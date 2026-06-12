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
        alert('You must agree to the Terms of Use.');
        return;
      }

      // Validate Student ID format
      const studentIdRegex = /^\d{3}\s?\d{3}\s?\d{3}$/;
      if (!studentIdRegex.test(student_id)) {
        alert('Invalid Student ID format. Please use a format like 011 201 000.');
        return;
      }

      // Validate email domain
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*uiu\.ac\.bd$/i;
      if (!emailRegex.test(email)) {
        alert('Only UIU student emails are allowed (e.g., name@bscse.uiu.ac.bd).');
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
          alert('Account created successfully!');
          window.location.href = 'success.html';
        } else {
          alert(data.message || 'Signup failed.');
        }
      } catch (err) {
        console.error(err);
        alert('Server connection error. Please try again.');
      }
    });
  }

  // --- OTP VERIFICATION PAGE LOGIC ---
  const otpPage = document.querySelector('.otp-page');
  if (otpPage) {
    const emailDisplay = document.getElementById('otp-email-display');
    const savedEmail = sessionStorage.getItem('otp_email');
    
    if (savedEmail) {
      emailDisplay.textContent = savedEmail;
    }

    const inputs = document.querySelectorAll('.otp-inputs input');
    
    // Auto-focus transition for OTP inputs
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });

    const verifyBtn = document.getElementById('verify-btn');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', async () => {
        let otp = '';
        inputs.forEach(input => {
          otp += input.value.trim();
        });

        if (otp.length < 6) {
          alert('Please enter the full 6-digit code.');
          return;
        }

        const email = savedEmail || '';
        try {
          const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, otp })
          });

          const data = await response.json();

          if (data.success) {
            sessionStorage.removeItem('otp_email');
            window.location.href = 'success.html';
          } else {
            alert(data.message || 'Verification failed.');
          }
        } catch (err) {
          console.error(err);
          alert('Error connecting to verification server.');
        }
      });
    }
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
          window.location.href = 'home.html';
        } else {
          alert(data.message || 'Invalid email or password.');
        }
      } catch (err) {
        console.error(err);
        alert('Server connection error. Please try again.');
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
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    console.error('Logout error:', err);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'signin.html';
}
