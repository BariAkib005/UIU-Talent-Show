# UIU Talent Show — Production Readiness Plan

> Status: **planning only — no code changes yet.** This document is the implementation
> contract derived from a full read of the current `jamiul` branch (1 commit ahead of
> `main`). It is to be reviewed/finalised before any code is touched.

---

## 0. Repository & Workflow Notes

- **Remote:** `https://github.com/BariAkib005/UIU-Talent-Show` (origin).
- **Branch reality:** working tree is on `jamiul`, which is the latest code (`main` is 1 commit
  behind). All planned work should branch from `jamiul`. **Open question for the maintainer:**
  should `jamiul` be merged into `main` first so work targets `main`, or do we keep building on
  `jamiul`? Resolve before the first commit.
- **Docs gap:** there are **no** architecture / setup / spec / roadmap docs. The only markdown is a
  one-line `README.md`. There is therefore *no documentation to drift from* — instead, intent has to
  be inferred from `schema.sql`, route names, and the static HTML. **Producing a real `README.md` +
  `.env.example` is itself a deliverable**, not optional.
- **Commit hygiene:** small, scoped, conventional commits. No co-author/AI/generated metadata
  anywhere (messages, comments, docs, PRs).

---

## 1. Architecture Review

### 1.1 Current architecture (as-built)

```
server.js
  ├─ express.static('public')        ← serves all HTML/CSS/JS
  ├─ /uploads (static)               ← user-uploaded audio/video
  ├─ /api/auth         → routes/auth.js        → controllers/authController.js
  ├─ /api/performances → routes/performances.js→ controllers/performanceController.js
  ├─ /api/votes        → routes/votes.js       → controllers/voteController.js
  ├─ middlewares/authMiddleware.js   ← JWT verify (cookie OR Bearer)
  ├─ middlewares/uploadMiddleware.js ← multer disk storage, 100MB, mime filter
  └─ config/db.js                    ← mysql2 promise pool (limit 10)

public/
  ├─ *.html / *.css   (per-page, ~17 pages)
  └─ js/{auth.js, main.js, uploads.js}   ← vanilla, page-dispatched by pathname
```

Data model (`schema.sql`): `users`, `submissions` (video/audio/blog), `votes`
(unique `(user_id, submission_id)` → one vote per user per submission, used as a toggle).

The layering (route → controller → pooled DB) is sound and appropriate for the scope. The problems
below are about drift, dead paths, and hardening — **not** a call for a rewrite or a framework.

### 1.2 Detected problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| A | **~30 duplicate, stale frontend files at repo root** (`home.html`, `home.css`, … exist both at `/` and `/public`). Only `public/` is served; root copies are dead and actively misleading (root `home.html` is the un-wired placeholder version). | repo root vs `public/` | High (maintainability) |
| B | **Dead OTP flow.** `schema.sql` has `otp`/`is_verified`; `verifyOtp` + `otp.html` exist, but `signup` force-sets `is_verified=true, otp=null` and the client jumps straight to `success.html`. `otp_email` is never written to `sessionStorage`, so `otp.html` can never work. | `authController.js:40-44`, `auth.js:89-91` | Medium (drift / dead code) |
| C | **Catch-all masks API 404s.** `app.get('*')` returns `index.html` (HTTP 200) for any unmatched route, including `/api/*` typos, so API errors arrive as HTML and break `res.json()` on the client. | `server.js:37-39` | Medium |
| D | **No central error handler.** Multer failures (size/mime) and thrown async errors fall through to Express' default HTML error page; the client always does `response.json()` → throws → generic alert. | `server.js`, all controllers | Medium |
| E | **Schema vs UI drift.** Upload UI collects `tags` + `category`, which have no columns; `uploads.js` jams them into `description` as `"tags | category | desc"`. | `uploads.js:91,123`; `schema.sql` | Medium |
| F | **`index.html` is a developer link-list**, not an app entry, yet it's the page the catch-all serves for unknown routes. | `public/index.html` | Low/Med (UX) |
| G | Redundant `dotenv.config()` in 4 files; fine, but signals no single config module. | several | Low |

### 1.3 Scalability concerns

- **No pagination anywhere.** `/api/performances` returns *every* submission, with full `blog_content`
  (`SELECT s.*`), recomputing vote counts via `LEFT JOIN votes + GROUP BY` each call. Payload, DB
  cost, and DOM size all grow unbounded.
- **Vote counts are recomputed on every read.** Acceptable now; needs covering indexes or a
  denormalised counter as data grows.
- **Uploads served by Node from local disk.** Single-host only; no object storage/CDN path, no
  size/disk-usage ceiling beyond per-file 100MB, no cleanup.

### 1.4 Maintainability concerns

- Heavy **copy-paste card rendering** across `renderHomeDashboard`, `renderTrendingFeed`,
  `fetchFilteredPerformances`, `renderAudioTalentPage` — four near-identical card builders.
- **Design tokens hardcoded** (`#ff4a5a`, `#13131a`, …) in both per-page CSS *and* JS inline styles.
- **Navigation is text-matched in JS** (`bindGlobalNavigation`): links are `href="#"` and rewired by
  reading `link.textContent` — brittle and non-functional without JS.
- No tests, no linting, no `.env.example`, no real README.

---

## 2. Performance & Memory Audit

### 2.1 Backend (Node / MySQL)

| Finding | Fix | Expected impact |
|--------|-----|-----------------|
| `getPerformances` returns all rows incl. full `blog_content`. | Add `LIMIT/OFFSET` (or keyset) pagination; select a `blog_excerpt` (`LEFT(blog_content, 200)`) for list views, full content only on detail. | Smaller payloads, less DB I/O, faster paint; bounded memory per request. |
| `getPerformanceById` runs a **second query for *all* voters** and ships the full `voterIds` array. | Replace with a single `EXISTS` for the *current* user (`hasVoted`); drop the array. | O(1) instead of O(voters); no unbounded array over the wire. |
| Vote count via `LEFT JOIN votes + GROUP BY` on every list call, no supporting index beyond FKs. | Add index `votes(submission_id)`; consider denormalised `submissions.vote_count` updated on cast/retract for hot paths. | Fewer full scans; cheaper sorts on trending/leaderboard. |
| `bcryptjs` (pure-JS) blocks the event loop on hash/compare. | Keep `bcryptjs` for portability **or** move to native `bcrypt`; either way isolate auth so a burst of signups can't stall the loop. Document cost = 10 salt rounds. | Lower tail latency on auth under load. |
| No graceful shutdown — pool not closed on `SIGTERM/SIGINT`. | Add shutdown hook to `pool.end()` and stop the HTTP server. | Clean restarts/deploys, no leaked connections. |
| Non-atomic vote toggle (SELECT→INSERT/DELETE) can throw `ER_DUP_ENTRY` 500 on concurrent double-fire. | Catch `ER_DUP_ENTRY` and treat as already-voted, or use `INSERT … ON DUPLICATE KEY`. | No spurious 500s; correct under concurrency. |
| `CORS origin: true` reflects any origin w/ credentials. | Restrict to known origins via env allowlist. | Smaller attack surface; no behavioural cost in prod. |

### 2.2 Frontend (client memory / DOM)

| Finding | Fix | Expected impact |
|--------|-----|-----------------|
| Every list page does **two sequential `fetch`** (my-votes, then performances) — request waterfall. | `Promise.all([...])`. | ~1 RTT faster first render. |
| Cards built with large **per-element inline-style strings** repeated N times. | Move styling to CSS classes in a shared stylesheet. | Smaller HTML strings, less style recalculation, far less duplication. |
| All media (`<video>`/`<audio>`) rendered **eagerly** for the whole feed. | `loading="lazy"`/`preload="none"`, render-on-scroll or paginate. | Big network + memory win on media-heavy feeds. |
| `vote-btn` listeners re-attached after each render; brittle per-node binding. | **Event delegation** on the feed/grid container. | Fewer listeners, no double-bind risk, less GC church. |
| Four duplicated card builders. | One `renderPerformanceCard(perf, opts)` util + `escapeHtml` (see §4). | Less code, single source of truth, smaller `main.js`. |
| `main.js` ships to pages that don't need most of it (single 30 KB file, all pages). | Optional: split per-concern or guard by page; at minimum minify for prod. | Smaller parse/exec on light pages. |

---

## 3. UI/UX Audit

Reviewed as a product engineer; goal = clean, intentional, not "template-generated".

- **No design system.** Colors/spacing/radii are hardcoded in 17 CSS files *and* in JS inline styles.
  → Introduce `:root` CSS custom properties (color, spacing scale, radius, typography) in a single
  shared `base.css`; refactor pages and JS to use classes/tokens.
- **Placeholder data flashes before hydration.** `home.html` ships "Welcome, Alex Rivers!" and a fake
  leaderboard ("Marcus The Groove – 4,820 votes") that JS later overwrites → visible fake content on
  load. → Render neutral skeletons/empty states, not fake data.
- **`alert()` everywhere** for success/error/validation (signup, vote, upload). Blocking and crude.
  → Lightweight non-blocking toast + inline field errors.
- **Inconsistent, JS-dependent nav.** Links are `href="#"`, rewired by text match. → Real `href`s in
  markup with an `aria-current` active state; JS only enhances.
- **Loading/empty states** exist on some pages (categories/audio) but not all (home/trending have no
  skeleton). → Consistent loading + empty + error states across every feed.
- **Accessibility gaps:** blog modal has no focus trap / ESC / scroll-lock / `role="dialog"`; color
  contrast unaudited; buttons lack labels; avatar styling injected via JS. → Address modal a11y,
  keyboard nav, focus-visible, contrast.
- **Responsiveness:** 3-column dashboard (`sidebar / content / rightbar`) with no obvious mobile
  collapse. → Verify and add responsive breakpoints (collapse rightbar, drawer sidebar on mobile).
- **Theme:** dark-only despite a Settings page. → Either commit to one polished dark theme (recommended,
  avoid scope creep) or implement a real token-driven light/dark toggle. Pick one; don't half-build.
- **Non-functional pages:** Settings populates fields but has **no save handler/endpoint**;
  Notifications and Competitions are static mockups. → Either wire them (needs a profile-update
  endpoint) or clearly mark "coming soon" and hide dead CTAs (e.g. "Go Live" `alert`).
- **Visual noise:** invalid CSS (`justify-content:between` in the categories card) and ad-hoc emoji
  badges. → Fix invalid CSS, standardise badges.

Guardrails: **no** flashy animation, **no** new framework, **no** component-abstraction bloat — keep
it vanilla, modular, token-driven.

---

## 4. Reliability & Security Audit

### 4.1 Security (highest priority)

| Risk | Detail | Fix |
|------|--------|-----|
| **Stored XSS** | `main.js` injects `perf.title`, `performer_name`, `description`, `blog_content`, `creator_name` via `innerHTML` with no escaping. A submission titled `<img src=x onerror=…>` runs in every viewer's browser. | `escapeHtml()` helper for all interpolated user data, or build nodes with `textContent`. **Critical.** |
| **Hardcoded JWT fallback secret** | `'uiu_talent_show_super_secret_jwt_key_2026'` in `authController.js:114` and `authMiddleware.js:20`. If `.env` is missing in prod, tokens are forgeable. | Require `JWT_SECRET`; fail-fast at boot if unset. Remove the literal. |
| **Token in `localStorage` *and* cookie** | JWT is set as httpOnly cookie *and* returned in body → stored in `localStorage` (`auth.js:203`) and sent as Bearer. localStorage is XSS-readable; the cookie is essentially unused by the client. | Pick one model. Recommended: httpOnly cookie + `sameSite=lax` + CSRF token, drop localStorage token; or keep Bearer and stop setting the cookie. Don't keep both. |
| **Cookie flags** | `secure:false` hardcoded, no `sameSite`. | `secure` from env (true in prod), `sameSite:'lax'`. |
| **No rate limiting** | signin/signup/vote are unthrottled → brute force / vote spam. | Add `express-rate-limit` (lightweight) on auth + vote. |
| **No security headers** | No `helmet`. | Add `helmet` (or a minimal manual header set) — CSP, nosniff, frame options. |
| **CORS** | `origin:true` + credentials reflects any origin. | Env-driven allowlist (see §2.1). |
| **`me` endpoint unused** | Client trusts `localStorage.user` (`checkAuthentication`) and never revalidates server-side. | On protected pages, validate via `/api/auth/me`; treat localStorage as a cache only. |

### 4.2 Reliability / correctness

- **Multer errors unhandled** (`LIMIT_FILE_SIZE`, invalid mime) → 500/HTML instead of clean JSON. Add
  error-handling middleware that returns `{ success:false, message }` consistently.
- **Vote toggle race** (see §2.1) → handle `ER_DUP_ENTRY`.
- **Client double-click voting** → disable button during request + event delegation; reconcile count
  from the server response rather than `parseInt(textContent)±1`.
- **Unbounded feed render** can hang the page on large datasets → pagination/lazy media (see §2).
- **Invalid CSS / null interpolation:** `justify-content:between`; `perf.description`/`blog_content`
  can be `null` → renders the string "null". Guard with `|| ''`.
- **Catch-all returns 200 HTML for `/api/*` misses** (§1.2 C) → return JSON 404 for unmatched `/api/*`.
- **No request-body size limit** on `express.json()` (default 100kb is OK, but make it explicit) and no
  validation layer — manual regex only. Centralise input validation per route.
- **No graceful shutdown / pool close** (§2.1).

---

## 5. Refactor Strategy (phased, prioritised)

### P0 — Critical fixes (correctness & security; do first)
1. Escape all user-generated content in `main.js` (stored-XSS). *(highest)*
2. Require `JWT_SECRET`; remove hardcoded fallback; fail-fast at boot.
3. Add central Express error handler + multer error handling (consistent JSON).
4. Fix vote-toggle concurrency (`ER_DUP_ENTRY`) + disable button during request.
5. Delete the ~30 stale root-level duplicate files (keep `public/` as the single source).
6. Decide & unify the auth-token model (cookie *or* Bearer, not both); set cookie flags.

### P1 — Architectural improvements
7. Resolve the OTP flow: either fully remove (schema columns, `verifyOtp`, `otp.html`) **or**
   implement it end-to-end. Recommended: **remove** unless email verification is a real requirement.
8. Add `/api/*` JSON 404 + tighten the catch-all; restrict CORS via env allowlist.
9. Introduce a single config module + `.env.example`; write a real `README.md` (setup, schema, env).
10. Reconcile schema vs UI: add `category`/`tags` columns (or drop the fields) instead of packing them
    into `description`.

### P2 — Performance optimizations
11. Pagination + excerpt-not-full-content on list endpoints; `EXISTS`-based `hasVoted` on detail.
12. Add `votes(submission_id)` index; evaluate denormalised vote counter.
13. `Promise.all` the dual fetches; lazy-load media; event delegation for votes.
14. Single `renderPerformanceCard()` util to kill the 4× duplication.
15. Graceful shutdown; minify/concat client JS/CSS for prod.

### P3 — UI/UX enhancements
16. Shared `base.css` with design tokens; migrate inline JS styles → classes.
17. Replace `alert()` with toasts + inline validation; consistent loading/empty/error states.
18. Real `href`-based nav with active state; fix invalid CSS; modal a11y (focus trap/ESC/scroll lock).
19. Responsive breakpoints; replace placeholder/fake data with skeletons.
20. Either wire Settings (needs profile-update endpoint) or mark dead pages/CTAs "coming soon".

### P4 — Optional / future
- Object-storage/CDN for uploads; disk-usage ceiling + cleanup job.
- Denormalised counters + caching layer for trending/leaderboard.
- Automated tests (controllers + a smoke E2E), linting/formatting, CI.
- Light/dark theming via tokens (only if product wants it).

---

## 6. Implementation Principles (binding during execution)

- **Incremental & reversible.** One concern per commit; never bundle unrelated changes.
- **Preserve intent.** No rewrites, no new framework, no heavy deps. Prefer the lightest fix
  (`express-rate-limit`, `helmet` are the only likely additions; justify any other).
- **Keep it vanilla & modular.** Shared utils over abstraction layers.
- **Lighter, faster, cleaner.** Every change should reduce payload, memory, or complexity — or clearly
  improve correctness/UX. State the rationale, tradeoff, and expected impact per major change.
- **Verify as we go.** After each phase, smoke-test the affected flow (auth → upload → feed → vote →
  leaderboard) before moving on.

---

## 7. Execution Order (phases)

1. **Documentation & config** — `.env.example`, `README.md`, config module *(no behaviour change)*.
2. **P0 critical fixes** — XSS, JWT secret, error handling, vote race, delete root duplicates, auth model.
3. **P1 architecture** — OTP decision, API 404/CORS, schema reconciliation.
4. **P2 performance/memory** — pagination, indexes, fetch/render efficiency, dedupe rendering.
5. **P3 UI/UX** — tokens, toasts, nav, a11y, responsiveness, real states.
6. **Reliability hardening pass** — rate limiting, headers, graceful shutdown, edge cases.
7. **Final senior-level audit** — re-scan for regressions, hidden bugs, perf/UI inconsistencies.
8. **Cleanup** — remove dead code/assets, ensure no leftover duplicates, lint.
9. **Commit & push** to the agreed branch with a clean history.

---

## 8. Open Questions (resolve before P0)

1. Target branch: merge `jamiul` → `main` first, or keep building on `jamiul`?
2. OTP/email verification: real requirement, or remove the dead flow?
3. Auth model: httpOnly cookie + CSRF, or Bearer-only? (Affects §4.1.)
4. Theme: lock a single polished dark theme, or build real light/dark?
5. Settings/Notifications/Competitions: wire them up this cycle, or defer behind "coming soon"?
