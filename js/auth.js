/* ================================================================
   auth.js — Authentication Logic
   Handles: SignUp, SignIn API calls, JWT token management
   ================================================================ */

'use strict';

/* ─────────────────────────────────────────────────────
   SIGN UP HANDLER
   Called by onsubmit of #signup-form
   ───────────────────────────────────────────────────── */
async function handleSignUp(event) {
  event.preventDefault();

  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim().toLowerCase();
  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;

  // ── Client-side Validation ──────────────────────────
  if (!name || !email || !password || !confirm) {
    showToast('Please fill in all fields.', 'error');
    return;
  }
  if (name.length < 2) {
    showToast('Name must be at least 2 characters.', 'error');
    return;
  }
  if (!isValidEmail(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'error');
    return;
  }
  if (password !== confirm) {
    showToast('Passwords do not match!', 'error');
    return;
  }

  // ── Show Loading State ──────────────────────────────
  const btn = document.getElementById('signup-btn');
  setButtonLoading(btn, true);

  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Backend error (e.g., email already exists)
      throw new Error(data.message || data.error || 'Registration failed. Please try again.');
    }

    // ── Success: store token and proceed ─────────────
    onLoginSuccess(data.user, data.token, true);
    document.getElementById('signup-form').reset();

  } catch (err) {
    console.error('Sign up error:', err);
    showToast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

/* ─────────────────────────────────────────────────────
   SIGN IN HANDLER
   Called by onsubmit of #signin-form
   ───────────────────────────────────────────────────── */
async function handleSignIn(event) {
  event.preventDefault();

  const email    = document.getElementById('signin-email').value.trim().toLowerCase();
  const password = document.getElementById('signin-password').value;

  // ── Client-side Validation ──────────────────────────
  if (!email || !password) {
    showToast('Please enter your email and password.', 'error');
    return;
  }
  if (!isValidEmail(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  // ── Show Loading State ──────────────────────────────
  const btn = document.getElementById('signin-btn');
  setButtonLoading(btn, true);

  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific errors with user-friendly messages
      if (response.status === 401) {
        throw new Error('Invalid email or password. Please try again.');
      } else if (response.status === 404) {
        throw new Error('Account not found. Please sign up first.');
      } else {
        throw new Error(data.message || data.error || 'Login failed. Please try again.');
      }
    }

    // ── Success: store token and proceed ─────────────
    onLoginSuccess(data.user, data.token, true);
    document.getElementById('signin-form').reset();

  } catch (err) {
    console.error('Sign in error:', err);
    showToast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

/* ─────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────── */

/**
 * Validates email format using regex.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sets a button into a loading or normal state.
 * Expects the button to have .btn-text and .btn-spinner children.
 */
function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  const textEl    = btn.querySelector('.btn-text');
  const spinnerEl = btn.querySelector('.btn-spinner');

  btn.disabled = isLoading;
  if (textEl)    textEl.classList.toggle('hidden', isLoading);
  if (spinnerEl) spinnerEl.classList.toggle('hidden', !isLoading);
}

/* ─────────────────────────────────────────────────────
   EXPOSE GLOBALS
   ───────────────────────────────────────────────────── */
window.handleSignUp = handleSignUp;
window.handleSignIn = handleSignIn;
