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

  // Trigger animation
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  // Remove toast
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  // --- SIGN UP PAGE LOGIC ---
  const signupForm = document.querySelector('.signup-form');
  if (signupForm) {
    // Interactive Password Strength Meter
    const passwordInput = document.getElementById('signup-password');
    const strengthLabel = document.querySelector('.strength span');
    const strengthSpans = document.querySelectorAll('.strength .bar span');

    if (passwordInput && strengthLabel && strengthSpans.length >= 4) {
      passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        if (!val) {
          strengthLabel.textContent = 'Strength: Very Weak';
          strengthSpans.forEach(span => span.classList.add('light'));
          return;
        }
        let score = 0;
        if (val.length >= 6) score++;
        if (val.length >= 10) score++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
        if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

        let label = 'Very Weak';
        let activeBars = 1;
        if (score === 2) {
          label = 'Weak';
          activeBars = 2;
        } else if (score === 3) {
          label = 'Good';
          activeBars = 3;
        } else if (score >= 4) {
          label = 'Strong';
          activeBars = 4;
        }

        strengthLabel.textContent = `Strength: ${label}`;
        strengthSpans.forEach((span, index) => {
          if (index < activeBars) {
            span.classList.remove('light');
          } else {
            span.classList.add('light');
          }
        });
      });
    }

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('signup-name').value.trim();
      const student_id = document.getElementById('signup-student-id').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const department = document.getElementById('signup-department').value;
      const batch = document.getElementById('signup-batch').value;
      const password = document.getElementById('signup-password').value;
      const agree = document.getElementById('signup-agree').checked;

      if (!agree) {
        showToast('You must agree to the Terms of Use.', 'error');
        return;
      }

      // Validate Student ID format
      const studentIdRegex = /^\d{3}\s?\d{3}\s?\d{3}$/;
      if (!studentIdRegex.test(student_id)) {
        showToast('Invalid Student ID format. Please use a format like 011 201 000.', 'error');
        return;
      }

      // Validate email domain
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*uiu\.ac\.bd$/i;
      if (!emailRegex.test(email)) {
        showToast('Only UIU student emails are allowed (e.g., name@bscse.uiu.ac.bd).', 'error');
        return;
      }

      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, student_id, email, department, batch, password })
        });

        const data = await response.json();

        if (data.success) {
          showToast('Account created successfully!', 'success');
          setTimeout(() => {
            window.location.href = 'success.html';
          }, 1500);
        } else {
          showToast(data.message || 'Signup failed.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Server connection error. Please try again.', 'error');
      }
    });
  }

  // --- SIGN IN PAGE LOGIC ---
  const signinForm = document.querySelector('.signin-form');
  if (signinForm) {
    const togglePassword = document.getElementById('toggle-password');
    if (togglePassword) {
      togglePassword.addEventListener('click', () => {
        const passwordInput = document.getElementById('signin-password');
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          togglePassword.textContent = 'Hide';
        } else {
          passwordInput.type = 'password';
          togglePassword.textContent = 'Show';
        }
      });
    }

    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('signin-email').value.trim();
      const password = document.getElementById('signin-password').value;

      try {
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          showToast('Logged in successfully!', 'success');
          setTimeout(() => {
            window.location.href = 'home.html';
          }, 1000);
        } else {
          showToast(data.message || 'Invalid email or password.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Server connection error. Please try again.', 'error');
      }
    });
  }
});

// Helper function to check if user is logged in
function checkAuthentication() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    window.location.href = 'signin.html';
    return null;
  }

  return JSON.parse(user);
}

// Helper function to logout
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
