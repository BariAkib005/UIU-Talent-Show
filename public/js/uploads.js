document.addEventListener('DOMContentLoaded', () => {
  // Ensure user is logged in
  const currentUser = checkAuthentication();
  if (!currentUser) return;

  const selectBtn = document.getElementById('select-file-btn');
  const fileInput = document.getElementById('media-file');
  const fileStatus = document.getElementById('file-status');
  const dropZone = document.getElementById('drop-zone');
  const publishBtn = document.getElementById('publish-btn');

  let selectedFile = null;

  // Click handler to open file dialog
  if (selectBtn && fileInput) {
    selectBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        fileStatus.textContent = `Selected: ${selectedFile.name}`;
      }
    });
  }

  // Drag & drop handlers
  if (dropZone && fileInput) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ff4a5a'; // Highlight border
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.style.borderColor = ''; // Reset border
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;

      if (files.length > 0) {
        selectedFile = files[0];
        fileInput.files = files; // Sync with hidden input
        fileStatus.textContent = `Selected: ${selectedFile.name}`;
      }
    });
  }

  // Publish to Arena handler
  if (publishBtn) {
    publishBtn.addEventListener('click', async () => {
      const title = document.getElementById('upload-title').value.trim();
      const tags = document.getElementById('upload-tags')?.value.trim() || '';
      const category = document.getElementById('upload-category')?.value || '';
      
      if (!title) {
        showToast('Please enter a title.', 'error');
        return;
      }

      // Determine upload type based on page path
      let type = 'blog';
      if (window.location.pathname.includes('upload-video')) {
        type = 'video';
      } else if (window.location.pathname.includes('upload-audio')) {
        type = 'audio';
      }

      const token = localStorage.getItem('token');

      try {
        let response;
        if (type === 'video' || type === 'audio') {
          if (!selectedFile) {
            showToast(`Please select a ${type} file first.`, 'error');
            return;
          }

          const description = document.getElementById('upload-description').value.trim();
          const formData = new FormData();
          formData.append('title', title);
          formData.append('description', description);
          formData.append('category', category);
          formData.append('tags', tags);
          formData.append('type', type);
          formData.append('media', selectedFile);

          publishBtn.disabled = true;
          publishBtn.textContent = 'Publishing...';

          response = await fetch('/api/performances/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        } else {
          // Blog upload
          const content = document.getElementById('upload-content').value.trim();
          if (!content) {
            showToast('Please write some content for your blog.', 'error');
            return;
          }

          publishBtn.disabled = true;
          publishBtn.textContent = 'Publishing...';

          response = await fetch('/api/performances/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title,
              description: '',
              category,
              tags,
              type: 'blog',
              blog_content: content
            })
          });
        }

        const data = await response.json();
        
        if (data.success) {
          showToast('Performance published successfully!', 'success');
          setTimeout(() => {
            window.location.href = 'home.html';
          }, 1500);
        } else {
          showToast(data.message || 'Publishing failed.', 'error');
          publishBtn.disabled = false;
          publishBtn.textContent = 'Publish to Arena';
        }
      } catch (err) {
        console.error(err);
        showToast('Server error. Failed to publish performance.', 'error');
        publishBtn.disabled = false;
        publishBtn.textContent = 'Publish to Arena';
      }
    });
  }
});
