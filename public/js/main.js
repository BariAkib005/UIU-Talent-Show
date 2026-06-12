document.addEventListener('DOMContentLoaded', async () => {
  // Ensure user is logged in for all pages except login/signup/otp/success
  const publicPages = ['signin.html', 'signup.html', 'otp.html', 'success.html', 'index.html'];
  const path = window.location.pathname;
  const isPublic = publicPages.some(page => path.includes(page)) || path === '/' || path === '';

  let currentUser = null;
  if (!isPublic) {
    currentUser = checkAuthentication();
    if (!currentUser) return;
  }

  // --- 1. GLOBAL NAVIGATION & LINKS BINDING ---
  // Select sidebar and topbar elements
  bindGlobalNavigation(currentUser);

  // --- 2. PAGE SPECIFIC RENDERING ---
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

// Bind Navigation Links across sidebar and header
function bindGlobalNavigation(user) {
  if (!user) return;

  // Render current user's name in welcome header (if exists)
  const welcomeHeader = document.querySelector('.topbar h2');
  if (welcomeHeader) {
    welcomeHeader.innerHTML = `Welcome, ${user.name}!`;
  }

  // Bind sidebar nav links
  const navLinks = document.querySelectorAll('.sidebar .nav a, .topbar .links a');
  navLinks.forEach(link => {
    const text = link.textContent.trim().toLowerCase();
    if (text === 'home' || text === 'discover') {
      link.href = 'home.html';
    } else if (text === 'trending') {
      link.href = 'trending.html';
    } else if (text === 'categories') {
      link.href = 'categories.html';
    } else if (text === 'my profile' || text === 'profile') {
      link.href = 'profile.html';
    } else if (text === 'settings') {
      link.href = 'settings.html';
    } else if (text === 'competitions') {
      link.href = 'competitions.html';
    } else if (text === 'leaderboard') {
      link.href = 'leaderboard.html';
    }
  });

  // Bind footer buttons inside sidebar
  const logoutBtn = document.querySelector('.sidebar-footer a[href="#"], .sidebar-footer a:last-child');
  if (logoutBtn && logoutBtn.textContent.trim().toLowerCase() === 'logout') {
    logoutBtn.href = '#';
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // Bind Upload Performance CTA buttons
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
      alert('Live streaming feature is coming soon to UIU Arena!');
    });
  }

  // Set user avatar letter
  const avatar = document.querySelector('.avatar');
  if (avatar) {
    avatar.textContent = user.name.charAt(0).toUpperCase();
    avatar.style.display = 'flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    avatar.style.color = '#fff';
    avatar.style.backgroundColor = '#ff4a5a';
    avatar.style.fontWeight = 'bold';
    avatar.style.cursor = 'pointer';
    avatar.addEventListener('click', () => {
      window.location.href = 'profile.html';
    });
  }
}

// Render dynamic homepage feed
async function renderHomeDashboard(user) {
  const feedContainer = document.querySelector('.feed');
  if (!feedContainer) return;

  try {
    // Fetch user votes to show toggle status
    const votesRes = await fetch('/api/votes/my-votes', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const votesData = await votesRes.json();
    const userVotedIds = votesData.success ? votesData.votedSubmissionIds : [];

    // Fetch performances
    const response = await fetch('/api/performances');
    const data = await response.json();

    if (data.success && data.performances.length > 0) {
      feedContainer.innerHTML = ''; // Clear placeholder posts
      
      data.performances.forEach(perf => {
        const hasVoted = userVotedIds.includes(perf.id);
        const postCard = document.createElement('article');
        postCard.className = 'post';

        let mediaSection = '';
        if (perf.type === 'video') {
          mediaSection = `
            <div class="post-media" style="padding: 0;">
              <video src="${perf.file_path}" controls style="width:100%; height:100%; object-fit:cover; border-radius:12px;"></video>
            </div>
          `;
        } else if (perf.type === 'audio') {
          mediaSection = `
            <div class="post-media" style="background: linear-gradient(135deg, #1f1f2e, #11111d); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;">
              <div style="font-size: 3rem;">🎵</div>
              <strong style="color: #a0a0b0; font-size: 0.9rem;">Audio Performance</strong>
              <audio src="${perf.file_path}" controls style="width: 85%; margin-top: 8px;"></audio>
            </div>
          `;
        } else if (perf.type === 'blog') {
          mediaSection = `
            <div class="post-media" style="background:#1a1a24; padding:18px; overflow-y:auto; color:#a0a0b0; text-align:left; font-size:0.85rem;">
              <h4 style="color:#fff; margin-bottom:8px; font-size:1.1rem;">${perf.title}</h4>
              <p style="white-space: pre-wrap; line-height: 1.5;">${perf.blog_content ? perf.blog_content.substring(0, 180) + '...' : ''}</p>
              <a href="#" class="read-blog-btn" data-id="${perf.id}" style="color:#ff4a5a; text-decoration:none; display:inline-block; margin-top:8px; font-weight:bold;">Read Full Article &rarr;</a>
            </div>
          `;
        }

        postCard.innerHTML = `
          ${mediaSection}
          <div class="post-info">
            <div>
              <h4 style="margin: 0; color:#fff;">${perf.title}</h4>
              <p style="margin: 4px 0 0 0; font-size: 0.85rem; color:#888;">by ${perf.performer_name} (${perf.department})</p>
              <p style="margin: 4px 0 0 0; font-size:0.8rem; color:#666;">${perf.description || ''}</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="vote-count-${perf.id}" style="font-size:0.85rem; color:#a0a0b0; font-weight:bold;">${perf.vote_count} votes</span>
              <button class="vote-btn ${hasVoted ? 'primary' : 'ghost'}" data-id="${perf.id}" style="padding: 6px 12px; font-size: 0.8rem;">
                ${hasVoted ? 'Voted' : 'Vote'}
              </button>
            </div>
          </div>
        `;

        feedContainer.appendChild(postCard);
      });

      // Hook up Vote listeners
      setupVoteListeners();
      
      // Hook up Blog detail triggers
      setupBlogDetailTriggers(data.performances);

    } else {
      feedContainer.innerHTML = '<div style="color:#666; text-align:center; padding:40px;">No performances uploaded yet. Be the first to publish!</div>';
    }

    // Populate Sidebar Leaderboard Snippet
    renderSidebarLeaderboard();

  } catch (err) {
    console.error(err);
  }
}

// Render Trending feed
async function renderTrendingFeed() {
  const feedContainer = document.querySelector('.feed');
  if (!feedContainer) return;

  try {
    const votesRes = await fetch('/api/votes/my-votes', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const votesData = await votesRes.json();
    const userVotedIds = votesData.success ? votesData.votedSubmissionIds : [];

    const response = await fetch('/api/performances/trending');
    const data = await response.json();

    if (data.success && data.performances.length > 0) {
      feedContainer.innerHTML = '';
      
      data.performances.forEach((perf, index) => {
        const hasVoted = userVotedIds.includes(perf.id);
        const postCard = document.createElement('article');
        postCard.className = 'post';

        let mediaSection = '';
        if (perf.type === 'video') {
          mediaSection = `
            <div class="post-media" style="padding: 0;">
              <video src="${perf.file_path}" controls style="width:100%; height:100%; object-fit:cover; border-radius:12px;"></video>
            </div>
          `;
        } else if (perf.type === 'audio') {
          mediaSection = `
            <div class="post-media" style="background: linear-gradient(135deg, #1f1f2e, #11111d); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;">
              <div style="font-size: 3rem;">🎵</div>
              <audio src="${perf.file_path}" controls style="width: 85%;"></audio>
            </div>
          `;
        } else if (perf.type === 'blog') {
          mediaSection = `
            <div class="post-media" style="background:#1a1a24; padding:18px; overflow-y:auto; color:#a0a0b0; text-align:left; font-size:0.85rem;">
              <h4 style="color:#fff; margin-bottom:8px; font-size:1.1rem;">${perf.title}</h4>
              <p style="white-space: pre-wrap; line-height: 1.5;">${perf.blog_content ? perf.blog_content.substring(0, 180) + '...' : ''}</p>
              <a href="#" class="read-blog-btn" data-id="${perf.id}" style="color:#ff4a5a; text-decoration:none; display:inline-block; margin-top:8px; font-weight:bold;">Read Full Article &rarr;</a>
            </div>
          `;
        }

        postCard.innerHTML = `
          ${mediaSection}
          <div class="post-info">
            <div>
              <span style="color:#ff4a5a; font-weight:bold; font-size:0.8rem; text-transform:uppercase;">🔥 Trending #${index + 1}</span>
              <h4 style="margin: 4px 0 0 0; color:#fff;">${perf.title}</h4>
              <p style="margin: 4px 0 0 0; font-size: 0.85rem; color:#888;">by ${perf.performer_name} (${perf.department})</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="vote-count-${perf.id}" style="font-size:0.85rem; color:#a0a0b0; font-weight:bold;">${perf.vote_count} votes</span>
              <button class="vote-btn ${hasVoted ? 'primary' : 'ghost'}" data-id="${perf.id}" style="padding: 6px 12px; font-size: 0.8rem;">
                ${hasVoted ? 'Voted' : 'Vote'}
              </button>
            </div>
          </div>
        `;
        feedContainer.appendChild(postCard);
      });

      setupVoteListeners();
      setupBlogDetailTriggers(data.performances);
    } else {
      feedContainer.innerHTML = '<div style="color:#666; text-align:center; padding:40px;">No trending items found yet.</div>';
    }
  } catch (err) {
    console.error(err);
  }
}

// Render Categories with Filters
async function renderCategoriesView() {
  const container = document.querySelector('.grid');
  if (!container) return;

  // Let's create category type selectors dynamically on the page
  const categoryHeader = document.querySelector('.content h2');
  if (categoryHeader) {
    const filterContainer = document.createElement('div');
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

    // Filter action
    const buttons = filterContainer.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fetchFilteredPerformances(btn.dataset.type);
      });
    });
  }

  // Initial fetch
  fetchFilteredPerformances('');
}

async function fetchFilteredPerformances(type) {
  const container = document.querySelector('.grid');
  if (!container) return;

  container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#666; padding:40px;">Loading talents...</div>';

  try {
    const token = localStorage.getItem('token');
    const votesRes = await fetch('/api/votes/my-votes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const votesData = await votesRes.json();
    const userVotedIds = votesData.success ? votesData.votedSubmissionIds : [];

    const url = type ? `/api/performances?type=${type}` : '/api/performances';
    const response = await fetch(url);
    const data = await response.json();

    if (data.success && data.performances.length > 0) {
      container.innerHTML = '';
      
      data.performances.forEach(perf => {
        const hasVoted = userVotedIds.includes(perf.id);
        const card = document.createElement('div');
        card.className = 'card';
        card.style.background = '#13131a';
        card.style.borderRadius = '12px';
        card.style.padding = '16px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.justifyContent = 'space-between';
        card.style.gap = '12px';

        let preview = '';
        if (perf.type === 'video') preview = '📹 Video Performance';
        else if (perf.type === 'audio') preview = '🎵 Audio Track';
        else preview = '📝 Blog Article';

        card.innerHTML = `
          <div>
            <span style="color:#ff4a5a; font-size:0.75rem; font-weight:bold; text-transform:uppercase;">${preview}</span>
            <h3 style="color:#fff; margin: 8px 0 4px 0; font-size:1.1rem;">${perf.title}</h3>
            <p style="color:#888; font-size:0.85rem; margin:0 0 8px 0;">by ${perf.performer_name}</p>
            <p style="color:#555; font-size:0.8rem; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
              ${perf.type === 'blog' ? perf.blog_content : perf.description}
            </p>
          </div>
          <div style="display:flex; justify-content:between; align-items:center; margin-top:8px;">
            <span class="vote-count-${perf.id}" style="color:#a0a0b0; font-size:0.85rem; font-weight:bold;">${perf.vote_count} votes</span>
            <button class="vote-btn ${hasVoted ? 'primary' : 'ghost'}" data-id="${perf.id}" style="padding: 6px 12px; font-size: 0.8rem;">
              ${hasVoted ? 'Voted' : 'Vote'}
            </button>
          </div>
        `;
        container.appendChild(card);
      });

      setupVoteListeners();
    } else {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#666; padding:40px;">No performances found in this category.</div>';
    }
  } catch (err) {
    console.error(err);
  }
}

// Render Full Leaderboard
async function renderLeaderboard() {
  const tableBody = document.querySelector('.table-body, .leaderboard-list');
  // Since HTML contains dynamic designs, let's target the leaderboard container
  const lbSection = document.querySelector('.ranks, .page');
  if (!lbSection) return;

  try {
    const response = await fetch('/api/votes/leaderboard');
    const data = await response.json();

    if (data.success && data.leaderboard.length > 0) {
      // Find where leaderboard elements are housed, or build them.
      // Usually leaderboard page has items with class="rank-item" or table rows.
      // Let's create a beautiful structured listing replacing the static contents.
      const listContainer = document.querySelector('.list, tbody, .ranks');
      if (listContainer) {
        listContainer.innerHTML = '';
        
        data.leaderboard.forEach((creator, index) => {
          const row = document.createElement('div');
          row.className = 'leader-row';
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.alignItems = 'center';
          row.style.padding = '16px';
          row.style.margin = '8px 0';
          row.style.background = '#13131a';
          row.style.borderRadius = '12px';

          row.innerHTML = `
            <div style="display:flex; align-items:center; gap:16px;">
              <span style="font-weight:bold; font-size:1.2rem; color:${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#a0a0b0'};">
                #${index + 1}
              </span>
              <div>
                <strong style="color:#fff; font-size:1.05rem;">${creator.creator_name}</strong>
                <p style="color:#666; margin:4px 0 0 0; font-size:0.8rem;">${creator.department} | ${creator.batch}</p>
              </div>
            </div>
            <div style="text-align:right;">
              <strong style="color:#ff4a5a; font-size:1.1rem;">${creator.total_votes}</strong>
              <p style="color:#555; margin:2px 0 0 0; font-size:0.75rem;">${creator.total_submissions} uploads</p>
            </div>
          `;
          listContainer.appendChild(row);
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// Render Profile details
async function renderProfile(user) {
  const nameEl = document.querySelector('.profile-name, h2');
  const detailsEl = document.querySelector('.profile-details, .info');
  const gridEl = document.querySelector('.profile-grid, .grid, .posts');

  if (nameEl) nameEl.textContent = user.name;
  if (detailsEl) {
    detailsEl.innerHTML = `
      <p style="margin:4px 0; color:#888;"><strong>Email:</strong> ${user.email}</p>
      <p style="margin:4px 0; color:#888;"><strong>Student ID:</strong> ${user.student_id}</p>
      <p style="margin:4px 0; color:#888;"><strong>Department:</strong> ${user.department}</p>
      <p style="margin:4px 0; color:#888;"><strong>Batch/Year:</strong> ${user.batch}</p>
    `;
  }

  // Load User's uploads
  if (gridEl) {
    gridEl.innerHTML = '<div style="color:#666; padding:20px;">Loading your uploads...</div>';
    
    try {
      const response = await fetch(`/api/performances/user/${user.id}`);
      const data = await response.json();

      if (data.success && data.performances.length > 0) {
        gridEl.innerHTML = '';
        
        data.performances.forEach(perf => {
          const card = document.createElement('div');
          card.className = 'profile-post-card';
          card.style.background = '#13131a';
          card.style.padding = '16px';
          card.style.borderRadius = '12px';
          card.style.marginBottom = '12px';
          
          card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:0.75rem; color:#ff4a5a; font-weight:bold; text-transform:uppercase;">${perf.type}</span>
                <h4 style="margin:4px 0; color:#fff;">${perf.title}</h4>
                <p style="font-size:0.8rem; color:#666; margin:0;">Uploaded: ${new Date(perf.created_at).toLocaleDateString()}</p>
              </div>
              <strong style="color:#a0a0b0;">${perf.vote_count} votes</strong>
            </div>
          `;
          gridEl.appendChild(card);
        });
      } else {
        gridEl.innerHTML = '<div style="color:#666; padding:20px; text-align:center;">You have not uploaded any performances yet.</div>';
      }
    } catch (err) {
      console.error(err);
      gridEl.innerHTML = '<div style="color:#ff4a5a; padding:20px;">Failed to load uploads.</div>';
    }
  }
}

// Render settings page configurations
function renderSettings(user) {
  // Populate settings fields if present
  const nameInput = document.getElementById('settings-name');
  const studentIdInput = document.getElementById('settings-id');
  const deptInput = document.getElementById('settings-dept');
  const batchInput = document.getElementById('settings-batch');

  if (nameInput) nameInput.value = user.name;
  if (studentIdInput) {
    studentIdInput.value = user.student_id;
    studentIdInput.disabled = true; // Protect ID
  }
  if (deptInput) {
    deptInput.value = user.department;
    deptInput.disabled = true; // Protect Department
  }
  if (batchInput) {
    batchInput.value = user.batch;
    batchInput.disabled = true; // Protect Batch
  }
}

// Sidebar Leaderboard Widget populate
async function renderSidebarLeaderboard() {
  const leaderList = document.querySelector('.leaderboard .leader');
  const leaderboardSection = document.querySelector('.rightbar .leaderboard');
  if (!leaderboardSection) return;

  try {
    const response = await fetch('/api/votes/leaderboard');
    const data = await response.json();

    if (data.success && data.leaderboard.length > 0) {
      // Find rank items
      const snippetContainer = document.createElement('div');
      snippetContainer.style.display = 'flex';
      snippetContainer.style.flexDirection = 'column';
      snippetContainer.style.gap = '12px';
      snippetContainer.style.margin = '16px 0';

      // Load top 3
      data.leaderboard.slice(0, 3).forEach((creator, index) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '12px';

        div.innerHTML = `
          <span style="font-weight:bold; color:#ff4a5a;">${index + 1}</span>
          <div>
            <strong style="color:#fff; font-size:0.9rem;">${creator.creator_name}</strong>
            <p style="margin:2px 0 0 0; font-size:0.75rem; color:#666;">${creator.total_votes} votes</p>
          </div>
        `;
        snippetContainer.appendChild(div);
      });

      // Clear standard placeholder items (leave the header and button)
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
    console.error(err);
  }
}

// Setup click handlers for Voting
function setupVoteListeners() {
  const voteBtns = document.querySelectorAll('.vote-btn');
  voteBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const submission_id = btn.dataset.id;
      const token = localStorage.getItem('token');

      if (!token) {
        alert('You must be logged in to cast a vote!');
        window.location.href = 'signin.html';
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
          // Toggle styling and update counts
          const countEls = document.querySelectorAll(`.vote-count-${submission_id}`);
          
          if (data.voted) {
            btn.textContent = 'Voted';
            btn.classList.remove('ghost');
            btn.classList.add('primary');
            // Increment UI counts
            countEls.forEach(el => {
              const currentVal = parseInt(el.textContent) || 0;
              el.textContent = `${currentVal + 1} votes`;
            });
          } else {
            btn.textContent = 'Vote';
            btn.classList.remove('primary');
            btn.classList.add('ghost');
            // Decrement UI counts
            countEls.forEach(el => {
              const currentVal = parseInt(el.textContent) || 0;
              el.textContent = `${Math.max(0, currentVal - 1)} votes`;
            });
          }
        } else {
          alert(data.message || 'Voting failed.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to register vote. Server error.');
      }
    });
  });
}

// Blog detail viewer overlay utility
function setupBlogDetailTriggers(performances) {
  const readBtns = document.querySelectorAll('.read-blog-btn');
  readBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = parseInt(btn.dataset.id);
      const perf = performances.find(p => p.id === id);
      
      if (perf) {
        // Render a simple floating modal with the full blog post
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
          <div style="background:#13131a; border:1px solid #222; border-radius:16px; padding:32px; max-width:700px; width:100%; max-height:85vh; overflow-y:auto; position:relative;">
            <button class="close-modal-btn" style="position:absolute; top:20px; right:20px; background:none; border:none; color:#ff4a5a; font-size:1.5rem; cursor:pointer;">&times;</button>
            <span style="color:#ff4a5a; font-size:0.8rem; font-weight:bold; text-transform:uppercase;">📝 Blog Submission</span>
            <h2 style="color:#fff; margin:12px 0 6px 0;">${perf.title}</h2>
            <p style="color:#666; font-size:0.85rem; margin:0 0 20px 0;">by ${perf.performer_name} | ${perf.department}</p>
            <div style="color:#d0d0e0; font-size:0.95rem; line-height:1.6; white-space:pre-wrap;">${perf.blog_content}</div>
          </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
          modal.remove();
        });
        modal.addEventListener('click', (ev) => {
          if (ev.target === modal) modal.remove();
        });
      }
    });
  });
}

async function renderAudioTalentPage() {
  const grid = document.querySelector('.grid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#666; padding:40px;">Loading audio performances...</div>';

  try {
    const votesRes = await fetch('/api/votes/my-votes', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const votesData = await votesRes.json();
    const userVotedIds = votesData.success ? votesData.votedSubmissionIds : [];

    const response = await fetch('/api/performances?type=audio');
    const data = await response.json();

    if (data.success && data.performances.length > 0) {
      grid.innerHTML = '';
      data.performances.forEach(perf => {
        const hasVoted = userVotedIds.includes(perf.id);
        const card = document.createElement('article');
        card.className = 'card';

        const initials = perf.performer_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        card.innerHTML = `
          <div class="card-head">
            <div class="avatar" style="display:flex; align-items:center; justify-content:center; background:#ff4a5a; color:#fff; font-weight:bold;">
              ${initials}
            </div>
            <div>
              <strong>${perf.title}</strong>
              <p>by ${perf.performer_name} (${perf.department})</p>
            </div>
          </div>
          <div class="wave" style="padding: 12px; background: #13131d; border-radius: 8px; margin: 12px 0;">
            <audio src="${perf.file_path}" controls style="width: 100%;"></audio>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <span class="vote-count-${perf.id}" style="font-size:0.85rem; color:#a0a0b0; font-weight:bold;">${perf.vote_count} votes</span>
            <button class="vote-btn ${hasVoted ? 'primary' : 'ghost'}" data-id="${perf.id}">
              ${hasVoted ? 'Voted' : 'Vote'}
            </button>
          </div>
        `;
        grid.appendChild(card);
      });
      setupVoteListeners();
    } else {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#666; padding:40px;">No audio performances uploaded yet.</div>';
    }
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#ff4a5a; padding:40px;">Failed to load audio performances.</div>';
  }
}
