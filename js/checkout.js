/* ================================================================
   checkout.js — Multi-Step Checkout Logic
   Step 1: Customer Details
   Step 2: Payment Selection (COD / UPI + Screenshot)
   Step 3: Order Summary + WhatsApp + API submit
   ================================================================ */

'use strict';

/* ─────────────────────────────────────────────────────
   CHECKOUT STATE
   ───────────────────────────────────────────────────── */
let checkoutStep         = 1;       // current step (1, 2, 3)
let selectedPaymentMethod = null;   // 'COD' or 'UPI'
let screenshotBase64     = null;    // Base64 string of payment screenshot

/* ─────────────────────────────────────────────────────
   OPEN / CLOSE CHECKOUT MODAL
   ───────────────────────────────────────────────────── */
function openCheckout() {
  const cart = getCart();
  if (!cart || cart.length === 0) {
    showToast('Your cart is empty!', 'warning');
    return;
  }

  // Reset state
  checkoutStep = 1;
  selectedPaymentMethod = null;
  screenshotBase64 = null;

  // Reset UI to step 1
  goToStep(1, true);

  // Pre-fill name from user profile
  if (currentUser && currentUser.name) {
    const nameField = document.getElementById('c-name');
    if (nameField && !nameField.value) nameField.value = currentUser.name;
  }

  // Show modal
  const modal = document.getElementById('checkout-modal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Hide success screen, show steps
  document.getElementById('order-success').classList.add('hidden');
  document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
  document.getElementById('checkout-step-1').classList.add('active');
  document.getElementById('step-indicators').style.display = 'flex';
  document.querySelector('.checkout-title').style.display = 'block';
}

function closeCheckout() {
  const modal = document.getElementById('checkout-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────────────────────
   STEP NAVIGATION
   ───────────────────────────────────────────────────── */
function goToStep(targetStep, forceNoValidation = false) {

  // Validate before advancing
  if (!forceNoValidation && targetStep > checkoutStep) {
    if (checkoutStep === 1 && !validateStep1()) return;
    if (checkoutStep === 2 && !validateStep2()) return;
  }

  checkoutStep = targetStep;

  // Update step panels
  document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
  const activePanel = document.getElementById(`checkout-step-${targetStep}`);
  if (activePanel) activePanel.classList.add('active');

  // Update step dots
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    if (!dot) continue;
    dot.classList.remove('active', 'completed');
    if (i < targetStep)  dot.classList.add('completed');
    if (i === targetStep) dot.classList.add('active');
  }

  // Update connectors
  const connectors = document.querySelectorAll('.step-connector');
  connectors.forEach((c, idx) => {
    c.classList.toggle('completed', idx + 1 < targetStep);
  });

  // If advancing to step 3, build order summary
  if (targetStep === 3) {
    buildOrderSummary();
  }

  // Scroll to top of modal
  const container = document.querySelector('.checkout-container');
  if (container) container.scrollTop = 0;
}

/* ─────────────────────────────────────────────────────
   STEP 1 VALIDATION — Customer Details
   ───────────────────────────────────────────────────── */
function validateStep1() {
  const name    = document.getElementById('c-name').value.trim();
  const phone   = document.getElementById('c-phone').value.trim();
  const address = document.getElementById('c-address').value.trim();
  const city    = document.getElementById('c-city').value.trim();
  const pincode = document.getElementById('c-pincode').value.trim();

  if (!name) {
    showToast('Please enter your full name.', 'error');
    document.getElementById('c-name').focus();
    return false;
  }
  if (!phone || !/^[0-9+\s\-]{7,15}$/.test(phone)) {
    showToast('Please enter a valid phone number.', 'error');
    document.getElementById('c-phone').focus();
    return false;
  }
  if (!address || address.length < 10) {
    showToast('Please enter your complete address (min. 10 characters).', 'error');
    document.getElementById('c-address').focus();
    return false;
  }
  if (!city) {
    showToast('Please enter your city.', 'error');
    document.getElementById('c-city').focus();
    return false;
  }
  if (!pincode || !/^[0-9]{6}$/.test(pincode)) {
    showToast('Please enter a valid 6-digit pincode.', 'error');
    document.getElementById('c-pincode').focus();
    return false;
  }
  return true;
}

/* ─────────────────────────────────────────────────────
   STEP 2 VALIDATION — Payment Method
   ───────────────────────────────────────────────────── */
function validateStep2() {
  if (!selectedPaymentMethod) {
    showToast('Please select a payment method.', 'error');
    return false;
  }
  return true;
}

/* ─────────────────────────────────────────────────────
   PAYMENT SELECTION
   ───────────────────────────────────────────────────── */
function selectPayment(method) {
  selectedPaymentMethod = method;

  // Update UI
  document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
  document.getElementById(`opt-${method.toLowerCase()}`).classList.add('selected');
  document.getElementById(`radio-${method.toLowerCase()}`).checked = true;

  // Show/hide relevant info boxes
  document.getElementById('cod-info').style.display = method === 'COD' ? 'block' : 'none';
  document.getElementById('upi-info').style.display = method === 'UPI' ? 'block' : 'none';

  if (method === 'UPI') {
    showToast('Please make payment to one of the UPI IDs above.', 'info');
  }
}

/* ─────────────────────────────────────────────────────
   SCREENSHOT UPLOAD HANDLER
   Converts selected image to Base64 for storage
   ───────────────────────────────────────────────────── */
function handleScreenshotUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file.', 'error');
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast('Screenshot must be under 5MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    screenshotBase64 = e.target.result; // Full Base64 string
    const preview = document.getElementById('screenshot-preview');
    const container = document.getElementById('screenshot-preview-container');
    if (preview && container) {
      preview.src = screenshotBase64;
      container.style.display = 'block';
    }
    showToast('Screenshot uploaded successfully!', 'success');
  };
  reader.onerror = () => showToast('Failed to read screenshot.', 'error');
  reader.readAsDataURL(file);
}

/* ─────────────────────────────────────────────────────
   STEP 3 — BUILD ORDER SUMMARY
   ───────────────────────────────────────────────────── */
function buildOrderSummary() {
  const cart     = getCart();
  const total    = getCartTotal();
  const name     = document.getElementById('c-name').value.trim();
  const phone    = document.getElementById('c-phone').value.trim();
  const address  = document.getElementById('c-address').value.trim();
  const city     = document.getElementById('c-city').value.trim();
  const pincode  = document.getElementById('c-pincode').value.trim();

  const itemsHTML = cart.map(item => `
    <div class="summary-item">
      <span class="order-item-name">${escapeHtml(item.name)}</span>
      <span class="order-item-qty">×${item.quantity}</span>
      <span class="order-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
    </div>`).join('');

  const summaryHTML = `
    <table class="order-summary-table">
      <tr>
        <td>👤 Name</td>
        <td>${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td>📞 Phone</td>
        <td>${escapeHtml(phone)}</td>
      </tr>
      <tr>
        <td>📍 Delivery Address</td>
        <td>${escapeHtml(address)}, ${escapeHtml(city)} - ${escapeHtml(pincode)}</td>
      </tr>
      <tr>
        <td>💳 Payment</td>
        <td>
          <span style="color:${selectedPaymentMethod === 'UPI' ? 'var(--info)' : 'var(--success)'}; font-weight:700;">
            ${selectedPaymentMethod === 'UPI' ? '📱 UPI Transfer' : '💵 Cash on Delivery'}
          </span>
          ${selectedPaymentMethod === 'UPI' && screenshotBase64 ? '<span style="color:var(--success); font-size:0.8rem;"> ✅ Screenshot attached</span>' : ''}
        </td>
      </tr>
    </table>

    <div style="margin: 16px 0 8px; font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">
      Order Items
    </div>
    <div class="summary-items-list">${itemsHTML}</div>

    <table class="order-summary-table" style="margin-top:12px;">
      <tr>
        <td>Subtotal</td>
        <td>₹${total.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Delivery</td>
        <td style="color:var(--success);">FREE</td>
      </tr>
      <tr class="summary-total-row">
        <td><strong>Total Amount</strong></td>
        <td><strong>₹${total.toLocaleString('en-IN')}</strong></td>
      </tr>
    </table>

    ${selectedPaymentMethod === 'UPI' ? `
      <div class="warning-box" style="margin-top:20px;">
        <div class="warning-icon">📸</div>
        <div class="warning-content">
          <strong class="warning-title">Remember to attach your payment screenshot on WhatsApp!</strong>
          <p>After clicking the button below, please <strong>attach your payment screenshot</strong> on WhatsApp. Your order will only be confirmed after screenshot verification.</p>
        </div>
      </div>` : ''}
  `;

  document.getElementById('order-summary-content').innerHTML = summaryHTML;
}

/* ─────────────────────────────────────────────────────
   PLACE ORDER
   1. Sends WhatsApp message
   2. Saves order to backend via POST /api/orders
   3. Clears cart and shows success
   ───────────────────────────────────────────────────── */
async function placeOrder() {
  const cart    = getCart();
  const total   = getCartTotal();
  const name    = document.getElementById('c-name').value.trim();
  const phone   = document.getElementById('c-phone').value.trim();
  const address = document.getElementById('c-address').value.trim();
  const city    = document.getElementById('c-city').value.trim();
  const pincode = document.getElementById('c-pincode').value.trim();

  if (cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }

  const btn = document.getElementById('place-order-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }

  try {
    // ── 1. Generate unique order ID ─────────────────
    const orderId = 'HC' + Date.now().toString(36).toUpperCase();

    // ── 2. Prepare order data ───────────────────────
    const orderData = {
      customer_name:     name,
      customer_phone:    phone,
      customer_address:  address,
      customer_city:     city,
      customer_pincode:  pincode,
      items: cart.map(item => ({
        productId: item.productId,
        name:      item.name,
        quantity:  item.quantity,
        price:     item.price,
      })),
      total_amount:      total,
      payment_method:    selectedPaymentMethod,
      payment_screenshot: (selectedPaymentMethod === 'UPI' && screenshotBase64) ? screenshotBase64 : null,
    };

    // ── 3. Send WhatsApp message ─────────────────────
    // Note: Screenshot must be attached MANUALLY by user on WhatsApp.
    // The message does NOT contain any "user will manually attach" text.
    const waUrl = generateWhatsAppURL(orderId, orderData);
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // ── 4. Save order to backend ─────────────────────
    const token = currentToken || localStorage.getItem('hc_token');
    const response = await fetch(`${CONFIG.BACKEND_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to save order. Please contact support.');
    }

    // ── 5. Success! ──────────────────────────────────
    clearCart();
    showOrderSuccess();

  } catch (err) {
    console.error('Place order error:', err);
    showToast(err.message, 'error', 5000);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Confirm & Send to WhatsApp'; }
  }
}

/* ─────────────────────────────────────────────────────
   SHOW ORDER SUCCESS ANIMATION
   ───────────────────────────────────────────────────── */
function showOrderSuccess() {
  // Hide step indicators and checkout steps
  document.getElementById('step-indicators').style.display = 'none';
  document.querySelector('.checkout-title').style.display = 'none';
  document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));

  // Show success
  const successEl = document.getElementById('order-success');
  successEl.classList.remove('hidden');

  showToast('Order placed successfully! 🎉', 'success', 5000);
}

/* ─────────────────────────────────────────────────────
   EXPOSE GLOBALS
   ───────────────────────────────────────────────────── */
window.openCheckout              = openCheckout;
window.closeCheckout             = closeCheckout;
window.goToStep                  = goToStep;
window.selectPayment             = selectPayment;
window.handleScreenshotUpload    = handleScreenshotUpload;
window.placeOrder                = placeOrder;
window.showOrderSuccess          = showOrderSuccess;
