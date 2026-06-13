// --- UTILITY FUNCTIONS ---

// Sanitize user-generated content to prevent XSS
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Display elegant non-blocking toast notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container') || (() => {
    const c = document.createElement('div');
    c.id = 'toast-container';
    c.style.position = 'fixed';
    c.style.bottom = '24px';
    c.style.right = '24px';
    c.style.display = 'flex';
    c.style.flexDirection = 'column';
    c.style.gap = '8px';
    c.style.zIndex = '99999';
    document.body.appendChild(c);
    return c;
  })();

  const toast = document.createElement('div');
  toast.style.background = type === 'error' ? '#ff4a5a' : '#0b5153';
  toast.style.color = '#fff';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.border = type === 'error' ? 'none' : '1px solid #35c4b3';
  toast.style.fontSize = '0.9rem';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  toast.style.transform = 'translateY(20px)';
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Generate loading skeleton templates
function getSkeletonHTML(count = 3, isGrid = false) {
  let html = '';
  for (let i = 0; i < count; i++) {
    if (isGrid) {
      html += `
        <div class="card skeleton-card" style="background:var(--card); border-radius:14px; padding:16px; min-height:180px; opacity:0.7; pointer-events:none; border:1px solid var(--border-color);">
          <div style="width: 30%; height: 10px; background: var(--border-color); margin-bottom: 12px; border-radius: 4px;"></div>
          <div style="width: 80%; height: 16px; background: var(--border-color); margin-bottom: 8px; border-radius: 4px;"></div>
          <div style="width: 60%; height: 12px; background: var(--border-color); margin-bottom: 16px; border-radius: 4px;"></div>
          <div style="display:flex; justify-content:space-between;">
            <div style="width: 30%; height: 10px; background: var(--border-color); border-radius: 4px;"></div>
            <div style="width: 20%; height: 20px; background: var(--border-color); border-radius: 4px;"></div>
          </div>
        </div>
      `;
    } else {
      html += `
        <article class="post skeleton-card" style="opacity:0.7; pointer-events:none; background:var(--card); border-radius:14px; padding:16px; margin-bottom:20px; border:1px solid var(--border-color);">
          <div class="post-media" style="background:var(--mint-solid); height:200px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:12px;"></div>
          <div class="post-info" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="width: 60%;">
              <div style="width: 80%; height: 14px; background: var(--border-color); margin-bottom: 8px; border-radius: 4px;"></div>
              <div style="width: 50%; height: 10px; background: var(--border-color); border-radius: 4px;"></div>
            </div>
            <div style="width: 20%; height: 30px; background: var(--border-color); border-radius: 8px;"></div>
          </div>
        </article>
      `;
    }
  }
  return html;
}

// Open elegant modal player for videos, audios, and full blogs
async function openPerformanceModal(perfId) {
  try {
    showToast('Opening performance...', 'success');
    const response = await fetch(`/api/performances/${perfId}`);
    const data = await response.json();
    if (data.success) {
      const perf = data.performance;
      
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.background = 'rgba(0, 0, 0, 0.9)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '99999';
      modal.style.padding = '24px';

      let mediaHTML = '';
      const safeFilePath = perf.file_path ? encodeURI(perf.file_path) : '';
      if (perf.type === 'video') {
        mediaHTML = `<video src="${safeFilePath}" controls autoplay style="width:100%; max-height:60vh; border-radius:12px;"></video>`;
      } else if (perf.type === 'audio') {
        mediaHTML = `
          <div style="background: linear-gradient(135deg, #1f1f2e, #11111d); padding: 40px; border-radius: 12px; text-align: center; width: 100%;">
            <div style="font-size: 4rem; margin-bottom: 20px;">🎵</div>
            <audio src="${safeFilePath}" controls autoplay style="width: 100%;"></audio>
          </div>
        `;
      } else if (perf.type === 'blog') {
        let coverImageHTML = '';
        if (perf.file_path) {
          coverImageHTML = `<img src="${safeFilePath}" style="width:100%; max-height:220px; object-fit:cover; border-radius:8px; margin-bottom:16px; display:block;" alt="Blog Cover" />`;
        }
        mediaHTML = `
          <div style="background: var(--mint-solid); border: 1px solid var(--border-color); padding: 24px; border-radius: 12px; max-height: 50vh; overflow-y: auto; text-align: left; white-space: pre-wrap; line-height: 1.6; color: var(--text);">
            ${coverImageHTML}
            ${escapeHtml(perf.blog_content || perf.description || '')}
          </div>
        `;
      }

      modal.innerHTML = `
        <div style="background:var(--card); border:1px solid var(--border-color); border-radius:20px; padding:32px; max-width:800px; width:100%; position:relative; box-shadow: 0 16px 60px rgba(0,0,0,0.4); text-align:center;">
          <button class="close-modal-btn" style="position:absolute; top:20px; right:20px; background:var(--mint-solid); border:none; color:var(--teal-800); font-size:1.5rem; cursor:pointer; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">&times;</button>
          <span style="color:var(--teal-800); font-size:0.82rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; background:var(--mint-solid); padding:4px 14px; border-radius:20px; display:inline-block;">${perf.type} Performance</span>
          <h2 style="color:var(--text); margin:14px 0 6px 0; font-family:'Playfair Display',serif;">${escapeHtml(perf.title)}</h2>
          <p style="color:var(--muted); font-size:0.85rem; margin:0 0 22px 0;">by ${escapeHtml(perf.performer_name)} | ${escapeHtml(perf.department)}</p>
          <div style="margin-bottom: 24px;">
            ${mediaHTML}
          </div>
          <p style="color:var(--muted); font-size:0.9rem; line-height:1.6; margin-bottom:0;">${escapeHtml(perf.description || '')}</p>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('.close-modal-btn').addEventListener('click', () => {
        modal.remove();
      });
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) modal.remove();
      });
    } else {
      showToast(data.message || 'Failed to fetch details.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to load performance detail.', 'error');
  }
}

// Unified Single Card Builder for feeds, grids, and audio channels
function renderPerformanceCard(perf, hasVoted, viewType, index = 0) {
  const safeTitle = escapeHtml(perf.title);
  const safePerformerName = escapeHtml(perf.performer_name);
  const safeDept = escapeHtml(perf.department);
  const safeDesc = escapeHtml(perf.description || '');
  const safeBlogExcerpt = perf.blog_excerpt ? escapeHtml(perf.blog_excerpt) + '...' : '';
  const safeFilePath = perf.file_path ? encodeURI(perf.file_path) : '';

  const pointsCount = perf.points || 0;
  const likeCount = perf.like_count || 0;
  const commentCount = perf.comment_count || 0;

  // Shared Action/Comment bar html template
  const actionSectionHTML = `
    <div style="display:flex; flex-direction:column; gap:8px; align-items:stretch; width:100%; margin-top: 12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <span class="points-count-${perf.id}" style="font-size:0.85rem; color:var(--teal-800); font-weight:bold;">${pointsCount} pts</span>
        <div style="display:flex; gap:8px;">
          <button class="vote-btn ${hasVoted ? 'primary' : 'ghost'}" data-id="${perf.id}" style="padding: 6px 12px; font-size: 0.8rem; display:flex; align-items:center; gap:4px; border-radius:8px;">
            👍 <span class="like-count-${perf.id}">${likeCount}</span>
          </button>
          <button class="comment-toggle-btn ghost" data-id="${perf.id}" style="padding: 6px 12px; font-size: 0.8rem; display:flex; align-items:center; gap:4px; border-radius:8px;">
            💬 <span class="comment-count-${perf.id}">${commentCount}</span>
          </button>
        </div>
      </div>
      <div class="comments-container" id="comments-container-${perf.id}" style="display:none; width:100%; border-top:1px solid var(--border-color); padding-top:12px; margin-top:4px;">
        <div class="comments-list" id="comments-list-${perf.id}" style="max-height:150px; overflow-y:auto; font-size:0.8rem; color:var(--muted); display:flex; flex-direction:column; gap:6px; margin-bottom:8px; text-align:left;">
          <!-- comments load dynamically -->
        </div>
        <div style="display:flex; gap:8px; width:100%;">
          <input type="text" placeholder="Write a comment..." class="comment-input" id="comment-input-${perf.id}" style="flex:1; padding:6px 10px; border-radius:8px; border:1px solid var(--border-color); background:var(--card); color:var(--text); font-size:0.8rem;" />
          <button class="post-comment-btn primary" data-id="${perf.id}" style="padding:6px 14px; border-radius:8px; font-size:0.8rem; border:none; cursor:pointer; background:linear-gradient(135deg,var(--teal-600),var(--teal-400)); color:#fff; font-weight:bold;">Post</button>
        </div>
      </div>
    </div>
  `;

  if (viewType === 'feed' || viewType === 'trending') {
    const postCard = document.createElement('article');
    postCard.className = 'post';

    let mediaSection = '';
    if (perf.type === 'video') {
      mediaSection = `
        <div class="post-media" style="padding: 0;">
          <video src="${safeFilePath}" controls style="width:100%; height:100%; object-fit:cover; border-radius:12px;" preload="none" loading="lazy"></video>
        </div>
      `;
    } else if (perf.type === 'audio') {
      mediaSection = `
        <div class="post-media" style="background: linear-gradient(135deg, var(--mint-solid), #c8f0ea); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;">
          <div style="font-size: 3rem;">🎵</div>
          <strong style="color: var(--teal-800); font-size: 0.9rem;">Audio Performance</strong>
          <audio src="${safeFilePath}" controls style="width: 85%; margin-top: 8px;" preload="none"></audio>
        </div>
      `;
    } else if (perf.type === 'blog') {
      let coverImageHTML = '';
      if (perf.file_path) {
        coverImageHTML = `<img src="${safeFilePath}" style="width:100%; max-height:160px; object-fit:cover; border-radius:8px 8px 0 0; margin-bottom:12px; display:block;" alt="Blog Cover" />`;
      }
      mediaSection = `
        <div class="post-media" style="background:var(--mint-solid); padding:18px; overflow-y:auto; color:var(--muted); text-align:left; font-size:0.85rem; display:flex; flex-direction:column;">
          ${coverImageHTML}
          <h4 style="color:var(--text); margin-bottom:8px; font-size:1.1rem;">${safeTitle}</h4>
          <p style="white-space: pre-wrap; line-height: 1.5; flex:1;">${safeBlogExcerpt}</p>
          <a href="#" class="read-blog-btn" data-id="${perf.id}" style="color:var(--teal-800); text-decoration:none; display:inline-block; margin-top:8px; font-weight:bold;">Read Full Article &rarr;</a>
        </div>
      `;
    }

    const badge = viewType === 'trending'
      ? `<span style="color:var(--teal-600); font-weight:bold; font-size:0.8rem; text-transform:uppercase;">🔥 Trending #${index + 1}</span>`
      : '';

    postCard.innerHTML = `
      ${mediaSection}
      <div class="post-info">
        <div>
          ${badge}
          <h4 style="margin: ${viewType === 'trending' ? '4px' : '0'} 0 0 0; color:var(--text);">${safeTitle}</h4>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color:var(--muted);">by ${safePerformerName} (${safeDept})</p>
          <p style="margin: 4px 0 0 0; font-size:0.8rem; color:var(--muted);">${safeDesc}</p>
        </div>
        ${actionSectionHTML}
      </div>
    `;
    return postCard;
  } else if (viewType === 'grid') {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.background = 'var(--card)';
    card.style.borderRadius = '14px';
    card.style.padding = '16px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';
    card.style.gap = '12px';
    card.style.border = '1px solid var(--border-color)';
    card.style.boxShadow = 'var(--shadow-sm)';

    let preview = '';
    if (perf.type === 'video') preview = '📹 Video';
    else if (perf.type === 'audio') preview = '🎵 Audio';
    else preview = '📝 Blog';

    card.innerHTML = `
      <div>
        <span style="color:var(--teal-800); font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; background:var(--mint-solid); padding:3px 10px; border-radius:20px; display:inline-block; margin-bottom:8px;">${preview}</span>
        <h3 style="color:var(--text); margin: 0 0 4px 0; font-size:1rem; font-weight:700; line-height:1.35;">${safeTitle}</h3>
        <p style="color:var(--muted); font-size:0.82rem; margin:0 0 6px 0;">by ${safePerformerName}</p>
        <p style="color:var(--muted); font-size:0.78rem; line-height:1.45; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${perf.type === 'blog' ? safeBlogExcerpt : safeDesc}
        </p>
      </div>
      ${actionSectionHTML}
    `;
    return card;
  } else if (viewType === 'audio') {
    const card = document.createElement('article');
    card.className = 'card';

    const initials = safePerformerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    card.innerHTML = `
      <div class="card-head">
        <div class="avatar" style="display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,var(--teal-600),var(--teal-400)); color:#fff; font-weight:bold;">
          ${initials}
        </div>
        <div>
          <strong style="color:var(--text);">${safeTitle}</strong>
          <p style="color:var(--muted); font-size:0.82rem;">by ${safePerformerName} (${safeDept})</p>
        </div>
      </div>
      <div class="wave" style="padding: 12px; background: var(--mint-solid); border-radius: 10px; margin: 12px 0;">
        <audio src="${safeFilePath}" controls style="width: 100%;" preload="none"></audio>
      </div>
      ${actionSectionHTML}
    `;
    return card;
  }
}


// --- MAIN APP INITIALIZATION ---

document.addEventListener('DOMContentLoaded', async () => {
  const publicPages = ['signin.html', 'signup.html', 'success.html', 'index.html'];
  const path = window.location.pathname;
  const isPublic = publicPages.some(page => path.includes(page)) || path === '/' || path === '';

  let currentUser = null;
  if (!isPublic) {
    currentUser = checkAuthentication();
    if (!currentUser) return;

    // Fetch fresh user data from server
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        currentUser = data.user;
      }
    } catch (err) {
      console.error('Failed to fetch fresh user details:', err);
    }
  }

  // Bind Navigation Links across sidebar and header
  bindGlobalNavigation(currentUser);

  // Render Page specific sections
  if (path.includes('home.html')) {
    renderHomeDashboard(currentUser);
  } else if (path.includes('trending.html')) {
    renderTrendingFeed();
  } else if (path.includes('categories.html')) {
    renderCategoriesView();
  } else if (path.includes('leaderboard.html')) {
    renderLeaderboard();
  } else if (path.includes('profile.html')) {
    renderProfile(currentUser);
  } else if (path.includes('settings.html')) {
    renderSettings(currentUser);
  } else if (path.includes('audio-talent.html')) {
    renderAudioTalentPage();
  }
});


// --- PAGE RENDERING MODULES ---

function bindGlobalNavigation(user) {
  if (!user) return;

  const welcomeHeader = document.querySelector('.topbar h2');
  if (welcomeHeader) {
    welcomeHeader.textContent = `Welcome, ${user.name}!`;
  }

  // Standardize Sidebar Navigation Hrefs and active states
  const navLinks = document.querySelectorAll('.sidebar .nav a, .topbar .links a');
  const path = window.location.pathname;

  navLinks.forEach(link => {
    const text = link.textContent.trim().toLowerCase();
    let href = '#';
    
    if (text === 'home' || text === 'discover') href = 'home.html';
    else if (text === 'trending') href = 'trending.html';
    else if (text === 'categories') href = 'categories.html';
    else if (text === 'my profile' || text === 'profile') href = 'profile.html';
    else if (text === 'settings') href = 'settings.html';
    else if (text === 'competitions') href = 'competitions.html';
    else if (text === 'leaderboard') href = 'leaderboard.html';

    link.href = href;

    // Set active class
    if (path.includes(href) && href !== '#') {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Help & Logout CTAs
  const helpLink = document.querySelector('.sidebar-footer a:first-child');
  if (helpLink && helpLink.textContent.trim().toLowerCase() === 'help') {
    helpLink.href = '#';
    helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Help center and documentation coming soon!', 'success');
    });
  }

  const logoutBtn = document.querySelector('.sidebar-footer a:last-child');
  if (logoutBtn && logoutBtn.textContent.trim().toLowerCase() === 'logout') {
    logoutBtn.href = '#';
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // Bind Upload CTA
  const uploadBtns = document.querySelectorAll('.cta, .upload-card button, .upload-card .primary');
  uploadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = 'choose-talent.html';
    });
  });

  // Bind Go Live Button
  const liveBtn = document.querySelector('.top-actions .pill');
  if (liveBtn) {
    liveBtn.addEventListener('click', () => {
      showToast('Live streaming feature is coming soon to UIU Arena!', 'success');
    });
  }

  // Set Profile Avatar initials — skip the banner profile-avatar (has its own styling)
  const avatar = document.querySelector('.avatar:not(.profile-avatar)');
  if (avatar) {
    if (user.profile_pic) {
      avatar.style.backgroundImage = `url(${user.profile_pic})`;
      avatar.style.backgroundSize = 'cover';
      avatar.style.backgroundPosition = 'center';
      avatar.textContent = '';
      avatar.style.background = '';
    } else {
      avatar.style.backgroundImage = '';
      avatar.textContent = user.name.charAt(0).toUpperCase();
      avatar.style.background = 'linear-gradient(135deg, #0b5153, #35c4b3)';
    }
    avatar.style.display = 'flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    avatar.style.color = '#fff';
    avatar.style.fontWeight = 'bold';
    avatar.style.cursor = 'pointer';
    avatar.addEventListener('click', () => {
      window.location.href = 'profile.html';
    });
  }
}

// Render dynamic dashboard homepage feed (Parallel Fetching + Loading Skeleton)
async function renderHomeDashboard(user) {
  const feedContainer = document.querySelector('.feed');
  if (!feedContainer) return;

  feedContainer.innerHTML = getSkeletonHTML(3);

  try {
    const token = localStorage.getItem('token');
    
    // Promise.all to prevent waterfalls
    const [votesRes, performancesRes] = await Promise.all([
      fetch('/api/votes/my-votes', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('/api/performances')
    ]);

    const votesData = await votesRes.json();
    const perfData = await performancesRes.json();

    const userVotedIds = votesData.success ? votesData.votedSubmissionIds : [];

    if (perfData.success && perfData.performances.length > 0) {
      feedContainer.innerHTML = '';
      perfData.performances.forEach(perf => {
        const hasVoted = userVotedIds.includes(perf.id);
        const card = renderPerformanceCard(perf, hasVoted, 'feed');
        feedContainer.appendChild(card);
      });
    } else {
      feedContainer.innerHTML = '<div style="color:#666; text-align:center; padding:40px;">No performances uploaded yet. Be the first to publish!</div>';
    }

    renderSidebarLeaderboard();
  } catch (err) {
    console.error('Home dashboard error:', err);
    feedContainer.innerHTML = '<div style="color:#ff4a5a; text-align:center; padding:40px;">Failed to load feed. Server error.</div>';
  }
}

// Render trending list (Parallel Fetching + Loading Skeleton)
async function renderTrendingFeed() {
  const spotlightContainer = document.getElementById('trending-spotlight');
  const sidebarContainer = document.getElementById('trending-sidebar-items');
  
  if (!spotlightContainer && !sidebarContainer) return;

  if (spotlightContainer) spotlightContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">Loading spotlight...</div>';
  if (sidebarContainer) sidebarContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Loading...</div>';

  try {
    const response = await fetch('/api/performances/trending');
    const perfData = await response.json();

    if (perfData.success && perfData.performances.length > 0) {
      // 1. Populate Spotlight Story (Content with the absolute maximum points)
      if (spotlightContainer) {
        spotlightContainer.innerHTML = '';
        const spotlight = perfData.performances[0];
        
        const spotlightMediaContainer = document.createElement('div');
        spotlightMediaContainer.className = 'feature-media';
        spotlightMediaContainer.style.background = '#1a1a24';
        spotlightMediaContainer.style.display = 'flex';
        spotlightMediaContainer.style.alignItems = 'center';
        spotlightMediaContainer.style.justifyContent = 'center';
        spotlightMediaContainer.style.borderRadius = '18px';
        spotlightMediaContainer.style.overflow = 'hidden';
        spotlightMediaContainer.style.height = '100%';
        spotlightMediaContainer.style.minHeight = '240px';
        
        const safeFilePath = spotlight.file_path ? encodeURI(spotlight.file_path) : '';
        if (spotlight.type === 'video') {
          spotlightMediaContainer.innerHTML = `<video src="${safeFilePath}" style="width:100%; height:100%; object-fit:cover;" preload="none" muted loop autoplay></video>`;
        } else if (spotlight.type === 'audio') {
          spotlightMediaContainer.innerHTML = `<div style="font-size:4rem;">🎵</div>`;
        } else {
          spotlightMediaContainer.innerHTML = `<div style="font-size:4rem;">📝</div>`;
        }

        const initials = spotlight.performer_name ? spotlight.performer_name.charAt(0).toUpperCase() : 'U';
        const btnText = spotlight.type === 'video' ? 'Watch Performance' : (spotlight.type === 'audio' ? 'Listen Performance' : 'Read Full Story');

        const spotlightCopyHTML = `
          <div class="feature-copy">
            <span class="tag">Spotlight Story | ${spotlight.type.toUpperCase()}</span>
            <h3>${escapeHtml(spotlight.title)}</h3>
            <p>${escapeHtml(spotlight.description || 'No description provided.')}</p>
            <div class="author">
              <span class="avatar" style="background:var(--gradient); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                ${initials}
              </span>
              <div>
                <strong>${escapeHtml(spotlight.performer_name)}</strong>
                <p>${escapeHtml(spotlight.department)} | ${escapeHtml(spotlight.batch)}</p>
              </div>
            </div>
            <button class="ghost read-spotlight-btn" data-id="${spotlight.id}">${btnText}</button>
          </div>
        `;
        
        spotlightContainer.appendChild(spotlightMediaContainer);
        spotlightContainer.insertAdjacentHTML('beforeend', spotlightCopyHTML);
        
        const spotlightBtn = spotlightContainer.querySelector('.read-spotlight-btn');
        if (spotlightBtn) {
          spotlightBtn.addEventListener('click', () => openPerformanceModal(spotlight.id));
        }
      }

      // 2. Populate Sidebar list with next top voted items
      if (sidebarContainer) {
        sidebarContainer.innerHTML = '';
        const rest = perfData.performances.slice(1, 6); // next 5 items

        if (rest.length > 0) {
          rest.forEach(perf => {
            const item = document.createElement('div');
            item.className = 'mini-card';
            item.style.cursor = 'pointer';
            item.style.transition = 'all 0.2s ease';
            item.style.display = 'flex';
            item.style.flexDirection = 'column';
            item.style.gap = '4px';
            item.style.borderBottom = '1px solid #eef4f4';
            item.style.padding = '12px 0';
            
            item.innerHTML = `
              <div style="font-weight:600; font-size:0.9rem; color:inherit;">${escapeHtml(perf.title)}</div>
              <div style="font-size:0.75rem; color:var(--muted); display:flex; justify-content:space-between; align-items:center;">
                <span>by ${escapeHtml(perf.performer_name)}</span>
                <span style="color:var(--teal-800); font-weight:bold;">${perf.points} pts</span>
              </div>
            `;
            item.addEventListener('click', () => openPerformanceModal(perf.id));
            sidebarContainer.appendChild(item);
          });
        } else {
          sidebarContainer.innerHTML = '<div style="color:#666; font-size:0.85rem; padding:10px;">No other trending items.</div>';
        }
      }
    } else {
      if (spotlightContainer) spotlightContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">No trending items uploaded yet.</div>';
      if (sidebarContainer) sidebarContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">No items.</div>';
    }
  } catch (err) {
    console.error('Trending feed error:', err);
    if (spotlightContainer) spotlightContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#ff4a5a;">Failed to load spotlight.</div>';
    if (sidebarContainer) sidebarContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#ff4a5a;">Error.</div>';
  }
}

// Render Categories Grid Feed (Parallel Fetching + Grid Skeleton)
async function renderCategoriesView() {
  const container = document.querySelector('.grid');
  if (!container) return;

  const categoryHeader = document.querySelector('.content h2');
  if (categoryHeader && !document.querySelector('.category-filter-bar')) {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'category-filter-bar';
    filterContainer.style.margin = '16px 0';
    filterContainer.style.display = 'flex';
    filterContainer.style.gap = '12px';
    filterContainer.innerHTML = `
      <button class="filter-btn active" data-type="" style="padding: 8px 16px; border-radius:20px; cursor:pointer;">All</button>
      <button class="filter-btn" data-type="video" style="padding: 8px 16px; border-radius:20px; cursor:pointer;">Videos</button>
      <button class="filter-btn" data-type="audio" style="padding: 8px 16px; border-radius:20px; cursor:pointer;">Audio</button>
      <button class="filter-btn" data-type="blog" style="padding: 8px 16px; border-radius:20px; cursor:pointer;">Blogs</button>
    `;
    categoryHeader.after(filterContainer);

    const buttons = filterContainer.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fetchFilteredPerformances(btn.dataset.type);
      });
    });
  }

  fetchFilteredPerformances('');
}

async function fetchFilteredPerformances(type) {
  const container = document.querySelector('.grid');
  if (!container) return;

  container.innerHTML = getSkeletonHTML(3, true);

  try {
    const token = localStorage.getItem('token');
    const url = type ? `/api/performances?type=${type}` : '/api/performances';

    const [votesRes, performancesRes] = await Promise.all([
      fetch('/api/votes/my-votes', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(url)
    ]);

    const votesData = await votesRes.json();
    const perfData = await performancesRes.json();

    const userVotedIds = votesData.success ? votesData.votedSubmissionIds : [];

    if (perfData.success && perfData.performances.length > 0) {
      container.innerHTML = '';
      perfData.performances.forEach(perf => {
        const hasVoted = userVotedIds.includes(perf.id);
        const card = renderPerformanceCard(perf, hasVoted, 'grid');
        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#666; padding:40px;">No performances found in this category.</div>';
    }
  } catch (err) {
    console.error('Categories error:', err);
    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#ff4a5a; padding:40px;">Failed to load items. Server error.</div>';
  }
}

// Render rankings page
async function renderLeaderboard() {
  const podiumContainer = document.getElementById('leaderboard-podium');
  const listContainer = document.getElementById('leaderboard-list');
  if (!podiumContainer && !listContainer) return;

  if (podiumContainer) podiumContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px; color:#666;">Loading podium...</div>';
  if (listContainer) listContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Loading rankings...</div>';

  try {
    const response = await fetch('/api/votes/leaderboard');
    const data = await response.json();

    if (data.success && data.leaderboard.length > 0) {
      // 1. Render Podium (Top 3)
      if (podiumContainer) {
        podiumContainer.innerHTML = '';
        const top3 = data.leaderboard.slice(0, 3);
        
        // Render in order: Rank 2 (Left), Rank 1 (Center/Winner), Rank 3 (Right)
        const second = top3[1] || null;
        const first = top3[0] || null;
        const third = top3[2] || null;
        
        // Second Place (Left)
        const secondCard = document.createElement('article');
        secondCard.className = 'podium';
        if (second) {
          const initials = second.creator_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          secondCard.innerHTML = `
            <span class="rank">2</span>
            <div class="avatar" style="background:var(--gradient); color:#fff;">${initials}</div>
            <h3>${escapeHtml(second.creator_name)}</h3>
            <p style="font-size:0.8rem; color:var(--muted); margin-top:2px;">${escapeHtml(second.department)}</p>
            <strong style="color:var(--teal-800); font-size:1.1rem; margin-top:4px;">${second.total_points} pts</strong>
          `;
        } else {
          secondCard.style.opacity = '0.5';
          secondCard.innerHTML = `
            <span class="rank">2</span>
            <div class="avatar">-</div>
            <h3>No Challenger</h3>
            <p>0 pts</p>
          `;
        }
        podiumContainer.appendChild(secondCard);
        
        // First Place (Center - Winner)
        const firstCard = document.createElement('article');
        firstCard.className = 'podium winner';
        if (first) {
          const initials = first.creator_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          firstCard.innerHTML = `
            <span class="rank">1</span>
            <div class="avatar" style="background:var(--gradient); color:#fff; width:70px; height:70px; font-size:1.4rem; border:2px solid var(--border-color); box-shadow:0 0 10px rgba(15,138,126,0.2);">${initials}</div>
            <h3 style="font-size:1.3rem;">${escapeHtml(first.creator_name)}</h3>
            <p style="font-size:0.8rem; color:var(--muted); margin-top:2px;">${escapeHtml(first.department)}</p>
            <strong style="color:var(--teal-800); font-size:1.25rem; margin-top:4px;">${first.total_points} pts</strong>
          `;
        } else {
          firstCard.style.opacity = '0.5';
          firstCard.innerHTML = `
            <span class="rank">1</span>
            <div class="avatar">-</div>
            <h3>No Winner Yet</h3>
            <p>0 pts</p>
          `;
        }
        podiumContainer.appendChild(firstCard);
        
        // Third Place (Right)
        const thirdCard = document.createElement('article');
        thirdCard.className = 'podium';
        if (third) {
          const initials = third.creator_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          thirdCard.innerHTML = `
            <span class="rank">3</span>
            <div class="avatar" style="background:var(--gradient); color:#fff;">${initials}</div>
            <h3>${escapeHtml(third.creator_name)}</h3>
            <p style="font-size:0.8rem; color:var(--muted); margin-top:2px;">${escapeHtml(third.department)}</p>
            <strong style="color:var(--teal-800); font-size:1.1rem; margin-top:4px;">${third.total_points} pts</strong>
          `;
        } else {
          thirdCard.style.opacity = '0.5';
          thirdCard.innerHTML = `
            <span class="rank">3</span>
            <div class="avatar">-</div>
            <h3>No Challenger</h3>
            <p>0 pts</p>
          `;
        }
        podiumContainer.appendChild(thirdCard);
      }
      
      // 2. Render Global Rankings (Rank 4+)
      if (listContainer) {
        listContainer.innerHTML = '';
        const rest = data.leaderboard.slice(3);
        
        if (rest.length > 0) {
          rest.forEach((creator, idx) => {
            const row = document.createElement('div');
            row.className = 'row';
            row.style.borderBottom = '1px solid var(--border-color)';
            row.style.padding = '12px 0';
            
            row.innerHTML = `
              <span class="place">${idx + 4}</span>
              <div style="display:flex; flex-direction:column; gap:2px; text-align:left;">
                <strong style="color:inherit; font-size:0.95rem;">${escapeHtml(creator.creator_name)}</strong>
                <span style="font-size:0.75rem; color:var(--muted);">${escapeHtml(creator.department)} | ${escapeHtml(creator.batch)}</span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; font-weight:700;">
                <span style="font-size:0.8rem; color:var(--muted); font-weight:normal;">${creator.total_likes} 👍 | ${creator.total_comments} 💬</span>
                <span class="score" style="color:var(--teal-800);">${creator.total_points} pts</span>
              </div>
            `;
            listContainer.appendChild(row);
          });
        } else {
          listContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#999; font-size:0.9rem;">No other contestants ranked yet.</div>';
        }
      }
    } else {
      if (podiumContainer) podiumContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">No rankings available yet.</div>';
      if (listContainer) listContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#666;">No rankings available yet.</div>';
    }
  } catch (err) {
    console.error('Leaderboard rendering error:', err);
    if (podiumContainer) podiumContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px; color:#ff4a5a;">Error loading rankings.</div>';
    if (listContainer) listContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#ff4a5a;">Error loading rankings.</div>';
  }
}

// Render user profile details and their uploads
async function renderProfile(user) {
  // Target new banner-based profile HTML elements
  const nameEl = document.querySelector('.profile-name');
  const detailsEl = document.querySelector('.profile-dept');
  const bioEl = document.querySelector('.profile-bio');
  const tagEl = document.querySelector('.talent-row .tag');
  const avatarEl = document.querySelector('.profile-avatar');
  const galleryEl = document.querySelector('.gallery, #profile-gallery');

  if (!user) return;

  // Populate banner hero with user info
  if (nameEl) nameEl.textContent = user.name;
  if (detailsEl) {
    detailsEl.textContent = `${user.department} • Batch ${user.batch}`;
  }
  if (bioEl) {
    bioEl.textContent = user.bio || 'No bio added yet. Click Edit Profile to add one!';
  }
  if (avatarEl) {
    if (user.profile_pic) {
      avatarEl.style.backgroundImage = `url(${user.profile_pic})`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.style.backgroundPosition = 'center';
      avatarEl.textContent = '';
    } else {
      avatarEl.style.backgroundImage = '';
      const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      avatarEl.textContent = initials;
    }
  }

  if (galleryEl) {
    galleryEl.innerHTML = getSkeletonHTML(3, true);
  }

  try {
    const token = localStorage.getItem('token');
    
    // Parallel fetch user submissions, global leaderboard, and votes
    const [perfRes, leaderboardRes, myVotesRes] = await Promise.all([
      fetch(`/api/performances/user/${user.id}`),
      fetch('/api/votes/leaderboard'),
      fetch('/api/votes/my-votes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const perfData = await perfRes.json();
    const leaderboardData = await leaderboardRes.json();
    const votesData = await myVotesRes.json();

    const userPerformances = perfData.success ? perfData.performances : [];
    const userVotedIds = votesData.success ? votesData.votedSubmissionIds : [];

    // Calculate dynamic stats
    const postCount = userPerformances.length;
    let totalLikes = 0;
    let totalComments = 0;

    userPerformances.forEach(perf => {
      totalLikes += perf.like_count || 0;
      totalComments += perf.comment_count || 0;
    });

    // Determine awards count (podium finish: 1st, 2nd, or 3rd in points)
    let awardsCount = 0;
    if (leaderboardData.success && leaderboardData.leaderboard.length > 0) {
      const userRankIndex = leaderboardData.leaderboard.findIndex(item => item.user_id === user.id);
      if (userRankIndex >= 0 && userRankIndex < 3) {
        awardsCount = 1;
      }
    }

    // Update stats counters
    const statStrongElements = document.querySelectorAll('.stats .stat strong');
    const formatStat = (num) => {
      if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.0', '') + 'k';
      }
      return String(num).padStart(2, '0');
    };

    if (statStrongElements.length >= 4) {
      statStrongElements[0].textContent = formatStat(postCount);
      statStrongElements[1].textContent = formatStat(totalLikes);
      statStrongElements[2].textContent = formatStat(totalComments);
      statStrongElements[3].textContent = formatStat(awardsCount);
    }

    // Set Dynamic Talent Tag according to active submissions types
    if (tagEl) {
      let userTag = 'Upcoming Participant';
      if (userPerformances.length > 0) {
        const types = userPerformances.map(p => p.type);
        const hasVideo = types.includes('video');
        const hasAudio = types.includes('audio');
        const hasBlog = types.includes('blog');
        
        if (hasVideo && hasAudio && hasBlog) {
          userTag = 'Multi-Talented Star';
        } else if (hasVideo && hasAudio) {
          userTag = 'Video & Audio Artist';
        } else if (hasVideo && hasBlog) {
          userTag = 'Vlogger & Writer';
        } else if (hasAudio && hasBlog) {
          userTag = 'Musician & Writer';
        } else if (hasVideo) {
          userTag = 'Video Creator';
        } else if (hasAudio) {
          userTag = 'Audio Performer';
        } else if (hasBlog) {
          userTag = 'Blogger & Writer';
        }
      }
      tagEl.textContent = userTag;
    }

    // Set up tabs filtering logic
    const tabButtons = document.querySelectorAll('.tabs button');
    
    const filterAndRender = async (tabName) => {
      if (!galleryEl) return;
      galleryEl.innerHTML = '';

      let itemsToRender = [];
      const lowerName = tabName.toLowerCase();

      if (lowerName === 'audio') {
        // Strict audio-only filter
        itemsToRender = userPerformances.filter(p => p.type === 'audio');
      } else if (lowerName === 'blogs') {
        // Strict blog-only filter
        itemsToRender = userPerformances.filter(p => p.type === 'blog');
      } else if (lowerName === 'my videos') {
        // Strict video-only filter
        itemsToRender = userPerformances.filter(p => p.type === 'video');
      } else if (lowerName.includes('liked') || lowerName.includes('saved')) {
        // Liked or Saved: fetch all platform performances and filter by user's liked IDs
        galleryEl.innerHTML = getSkeletonHTML(3, true);
        try {
          const allPerfRes = await fetch('/api/performances');
          const allPerfData = await allPerfRes.json();
          if (allPerfData.success) {
            itemsToRender = allPerfData.performances.filter(p => userVotedIds.includes(p.id));
          }
        } catch (err) {
          console.error('Error fetching liked performances:', err);
        }
        galleryEl.innerHTML = '';
      } else {
        // Default / All Posts: show everything the user has submitted
        itemsToRender = userPerformances;
      }

      if (itemsToRender.length > 0) {
        itemsToRender.forEach(perf => {
          const hasVoted = userVotedIds.includes(perf.id);
          const card = renderPerformanceCard(perf, hasVoted, 'grid');
          galleryEl.appendChild(card);
        });
      } else {
        const emptyLabel = lowerName === 'my videos' ? 'No video submissions yet.' :
                           lowerName === 'audio' ? 'No audio submissions yet.' :
                           lowerName === 'blogs' ? 'No blog submissions yet.' :
                           (lowerName.includes('liked') || lowerName.includes('saved')) ? 'No liked performances yet.' :
                           'No submissions found.';
        galleryEl.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#888;">${emptyLabel}</div>`;
      }
    };

    tabButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        await filterAndRender(btn.textContent.trim());
      });
    });

    // Default: always show ALL of the user's posts on initial profile load
    // so content is immediately visible regardless of which tab is active
    if (galleryEl) {
      await filterAndRender('all posts');
    }

    // --- EDIT PROFILE MODAL LOGIC ---
    const editBtn = document.querySelector('.edit-profile-btn');
    const editModal = document.getElementById('edit-profile-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editProfileForm = document.getElementById('edit-profile-form');

    if (editBtn && editModal) {
      // Open modal & populate inputs
      editBtn.addEventListener('click', () => {
        document.getElementById('edit-profile-name').value = user.name || '';
        document.getElementById('edit-profile-bio').value = user.bio || '';
        document.getElementById('edit-profile-dept').value = user.department || 'CSE';
        document.getElementById('edit-profile-batch').value = user.batch || 'Fall 2023';
        editModal.style.display = 'flex';
      });

      // Close modal
      const closeModal = () => {
        editModal.style.display = 'none';
        editProfileForm.reset();
      };

      closeEditModalBtn?.addEventListener('click', closeModal);
      cancelEditBtn?.addEventListener('click', closeModal);

      // Handle submit
      editProfileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('edit-profile-name').value.trim();
        const bio = document.getElementById('edit-profile-bio').value.trim();
        const department = document.getElementById('edit-profile-dept').value;
        const batch = document.getElementById('edit-profile-batch').value;
        const fileInput = document.getElementById('edit-profile-pic');

        const formData = new FormData();
        formData.append('name', name);
        formData.append('bio', bio);
        formData.append('department', department);
        formData.append('batch', batch);
        if (fileInput.files.length > 0) {
          formData.append('profile_pic', fileInput.files[0]);
        }

        const submitBtn = editProfileForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/auth/update-profile', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          const resData = await response.json();
          if (resData.success) {
            showToast('Profile updated successfully!', 'success');
            
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            showToast(resData.message || 'Failed to update profile.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
        } catch (err) {
          console.error(err);
          showToast('Server error. Failed to update profile.', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      });
    }

  } catch (err) {
    console.error('Error rendering profile:', err);
    if (galleryEl) {
      galleryEl.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#ff4a5a;">Failed to load profile details. Server error.</div>`;
    }
  }
}


// Render Settings (populates info and maps mock save hooks)
function renderSettings(user) {
  const nameInput = document.getElementById('settings-name');
  const studentIdInput = document.getElementById('settings-id');
  const deptInput = document.getElementById('settings-dept');
  const batchInput = document.getElementById('settings-batch');

  if (nameInput) nameInput.value = user.name;
  if (studentIdInput) {
    studentIdInput.value = user.student_id;
    studentIdInput.disabled = true; 
  }
  if (deptInput) {
    deptInput.value = user.department;
    deptInput.disabled = true; 
  }
  if (batchInput) {
    batchInput.value = user.batch;
    batchInput.disabled = true; 
  }

  const settingsForm = document.querySelector('.settings-form, form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Profile editing feature is coming soon!', 'success');
    });
  }
}

// Sidebar Leaderboard Top-3 Snippet
async function renderSidebarLeaderboard() {
  const leaderboardSection = document.querySelector('.rightbar .leaderboard');
  if (!leaderboardSection) return;

  try {
    const response = await fetch('/api/votes/leaderboard');
    const data = await response.json();

    if (data.success && data.leaderboard.length > 0) {
      const snippetContainer = document.createElement('div');
      snippetContainer.className = 'leaderboard-snippet-container';
      snippetContainer.style.display = 'flex';
      snippetContainer.style.flexDirection = 'column';
      snippetContainer.style.gap = '12px';
      snippetContainer.style.margin = '16px 0';

      data.leaderboard.slice(0, 3).forEach((creator, index) => {
        const div = document.createElement('div');
        div.className = 'leader';

        div.innerHTML = `
          <span class="rank">${index + 1}</span>
          <div>
            <strong style="font-size:0.9rem; display:block;">${escapeHtml(creator.creator_name)}</strong>
            <p style="margin:2px 0 0 0; font-size:0.75rem; color:var(--muted);">${creator.total_points} pts</p>
          </div>
        `;
        snippetContainer.appendChild(div);
      });

      const title = leaderboardSection.querySelector('h3');
      const button = leaderboardSection.querySelector('button');
      
      leaderboardSection.innerHTML = '';
      if (title) leaderboardSection.appendChild(title);
      leaderboardSection.appendChild(snippetContainer);
      if (button) {
        leaderboardSection.appendChild(button);
        button.href = 'leaderboard.html';
        button.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = 'leaderboard.html';
        });
      }
    }
  } catch (err) {
    console.error('Sidebar leaderboard error:', err);
  }
}

// Render Audio channel Feed (Parallel Fetching + Loading Skeleton)
async function renderAudioTalentPage() {
  const grid = document.querySelector('.grid');
  if (!grid) return;

  grid.innerHTML = getSkeletonHTML(3, true);

  try {
    const token = localStorage.getItem('token');

    const [votesRes, performancesRes] = await Promise.all([
      fetch('/api/votes/my-votes', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('/api/performances?type=audio')
    ]);

    const votesData = await votesRes.json();
    const perfData = await performancesRes.json();

    const userVotedIds = votesData.success ? votesData.votedSubmissionIds : [];

    if (perfData.success && perfData.performances.length > 0) {
      grid.innerHTML = '';
      perfData.performances.forEach(perf => {
        const hasVoted = userVotedIds.includes(perf.id);
        const card = renderPerformanceCard(perf, hasVoted, 'audio');
        grid.appendChild(card);
      });
    } else {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#666; padding:40px;">No audio performances uploaded yet.</div>';
    }
  } catch (err) {
    console.error('Audio feed error:', err);
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#ff4a5a; padding:40px;">Failed to load audio performances. Server error.</div>';
  }
}


// --- DYNAMIC GLOBAL EVENT DELEGATION LISTENER ---

async function loadCommentsForSubmission(submission_id) {
  const listEl = document.getElementById(`comments-list-${submission_id}`);
  if (!listEl) return;

  listEl.innerHTML = '<div style="color:#666; font-size:0.75rem;">Loading comments...</div>';

  try {
    const response = await fetch(`/api/votes/comments/${submission_id}`);
    const data = await response.json();

    if (data.success && data.comments.length > 0) {
      listEl.innerHTML = '';
      data.comments.forEach(comment => {
        const div = document.createElement('div');
        div.style.borderBottom = '1px solid #1c1c28';
        div.style.paddingBottom = '4px';
        div.style.marginBottom = '4px';
        
        const commenterName = escapeHtml(comment.commentator_name);
        const dept = escapeHtml(comment.department || '');
        const commentText = escapeHtml(comment.comment_text);
        const dateStr = new Date(comment.created_at).toLocaleDateString();

        div.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <strong style="color:#fff; font-size:0.75rem;">${commenterName} (${dept})</strong>
            <span style="color:#555; font-size:0.7rem;">${dateStr}</span>
          </div>
          <p style="margin:0; color:#b0b0c0; font-size:0.8rem; line-height:1.4;">${commentText}</p>
        `;
        listEl.appendChild(div);
      });
    } else {
      listEl.innerHTML = '<div style="color:#555; font-size:0.75rem;">No comments yet.</div>';
    }
  } catch (err) {
    console.error(err);
    listEl.innerHTML = '<div style="color:#ff4a5a; font-size:0.75rem;">Failed to load comments.</div>';
  }
}

document.body.addEventListener('click', async (e) => {
  // 1. Handle Like Button Click actions
  const voteBtn = e.target.closest('.vote-btn');
  if (voteBtn) {
    e.preventDefault();
    if (voteBtn.disabled) return;
    voteBtn.disabled = true;

    const submission_id = voteBtn.dataset.id;
    const token = localStorage.getItem('token');

    if (!token) {
      showToast('You must be logged in to cast a vote!', 'error');
      setTimeout(() => {
        window.location.href = 'signin.html';
      }, 1500);
      voteBtn.disabled = false;
      return;
    }

    try {
      const response = await fetch('/api/votes/cast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submission_id })
      });

      const data = await response.json();

      if (data.success) {
        // Toggle styles and update count across all elements referencing this submission
        const likeCountEls = document.querySelectorAll(`.like-count-${submission_id}`);
        const voteBtns = document.querySelectorAll(`.vote-btn[data-id="${submission_id}"]`);
        
        voteBtns.forEach(btn => {
          if (data.voted) {
            btn.classList.remove('ghost');
            btn.classList.add('primary');
          } else {
            btn.classList.remove('primary');
            btn.classList.add('ghost');
          }
        });

        likeCountEls.forEach(el => {
          el.textContent = data.vote_count;
        });

        // Update total points dynamically: points = likes * 1 + comments * 2
        const commentCountEl = document.querySelector(`.comment-count-${submission_id}`);
        const commentsCountVal = commentCountEl ? parseInt(commentCountEl.textContent) || 0 : 0;
        const newPointsVal = data.vote_count * 1 + commentsCountVal * 2;
        const pointsEls = document.querySelectorAll(`.points-count-${submission_id}`);
        pointsEls.forEach(el => {
          el.textContent = `${newPointsVal} pts`;
        });
        
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'Action failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to toggle like. Server connection error.', 'error');
    } finally {
      voteBtn.disabled = false;
    }
    return;
  }

  // 2. Handle Comment Toggle click
  const commentToggleBtn = e.target.closest('.comment-toggle-btn');
  if (commentToggleBtn) {
    e.preventDefault();
    const submission_id = commentToggleBtn.dataset.id;
    const container = document.getElementById(`comments-container-${submission_id}`);
    if (container) {
      if (container.style.display === 'none') {
        container.style.display = 'block';
        loadCommentsForSubmission(submission_id);
      } else {
        container.style.display = 'none';
      }
    }
    return;
  }

  // 3. Handle Post Comment button click
  const postCommentBtn = e.target.closest('.post-comment-btn');
  if (postCommentBtn) {
    e.preventDefault();
    if (postCommentBtn.disabled) return;

    const submission_id = postCommentBtn.dataset.id;
    const input = document.getElementById(`comment-input-${submission_id}`);
    if (!input) return;

    const comment_text = input.value.trim();
    if (!comment_text) {
      showToast('Please enter a comment.', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('You must be logged in to comment.', 'error');
      setTimeout(() => {
        window.location.href = 'signin.html';
      }, 1500);
      return;
    }

    postCommentBtn.disabled = true;

    try {
      const response = await fetch('/api/votes/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submission_id, comment_text })
      });

      const data = await response.json();

      if (data.success) {
        input.value = '';
        showToast('Comment posted successfully!');
        
        // Reload comments list
        loadCommentsForSubmission(submission_id);

        // Update comment count elements
        const commentCountEls = document.querySelectorAll(`.comment-count-${submission_id}`);
        commentCountEls.forEach(el => {
          el.textContent = data.comment_count;
        });

        // Update total points elements
        const pointsEls = document.querySelectorAll(`.points-count-${submission_id}`);
        const newPointsVal = data.like_count * 1 + data.comment_count * 2;
        pointsEls.forEach(el => {
          el.textContent = `${newPointsVal} pts`;
        });
      } else {
        showToast(data.message || 'Failed to post comment.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to post comment. Server error.', 'error');
    } finally {
      postCommentBtn.disabled = false;
    }
    return;
  }

  // 4. Handle Dynamic Blog Modal Detail trigger
  const blogBtn = e.target.closest('.read-blog-btn');
  if (blogBtn) {
    e.preventDefault();
    const id = blogBtn.dataset.id;

    try {
      showToast('Loading full article...', 'success');

      const response = await fetch(`/api/performances/${id}`);
      const data = await response.json();

      if (data.success) {
        const perf = data.performance;
        
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0, 0, 0, 0.85)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';
        modal.style.padding = '24px';

        modal.innerHTML = `
          <div style="background:var(--card); border:1px solid var(--border-color); border-radius:20px; padding:32px; max-width:700px; width:100%; max-height:85vh; overflow-y:auto; position:relative; box-shadow: 0 16px 60px rgba(0,0,0,0.1);">
            <button class="close-modal-btn" style="position:absolute; top:20px; right:20px; background:var(--mint-solid); border:none; color:var(--teal-800); font-size:1.5rem; cursor:pointer; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">&times;</button>
            <span style="color:var(--teal-800); font-size:0.82rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; background:var(--mint-solid); padding:4px 14px; border-radius:20px; display:inline-block; margin-bottom:16px;">📝 Blog Submission</span>
            ${perf.file_path ? `<img src="${encodeURI(perf.file_path)}" style="width:100%; max-height:260px; object-fit:cover; border-radius:12px; margin-bottom:20px; display:block;" alt="Blog Cover" />` : ''}
            <h2 style="color:var(--text); margin:0 0 6px 0; font-family:'Playfair Display',serif;">${escapeHtml(perf.title)}</h2>
            <p style="color:var(--muted); font-size:0.85rem; margin:0 0 20px 0;">by ${escapeHtml(perf.performer_name)} | ${escapeHtml(perf.department)}</p>
            <div style="color:var(--text); font-size:0.95rem; line-height:1.6; white-space:pre-wrap; text-align:left;">${escapeHtml(perf.blog_content)}</div>
          </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
          modal.remove();
        });
        modal.addEventListener('click', (ev) => {
          if (ev.target === modal) modal.remove();
        });
      } else {
        showToast(data.message || 'Failed to fetch article details.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load article. Server connection error.', 'error');
    }
  }
});


// --- AUTHENTICATION STATE HELPERS ---

function checkAuthentication() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    window.location.href = 'signin.html';
    return null;
  }

  return JSON.parse(user);
}

async function logoutUser() {
  try {
    const token = localStorage.getItem('token');
    await fetch('/api/auth/logout', { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'signin.html';
}
