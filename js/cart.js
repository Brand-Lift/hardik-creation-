/* ================================================================
   cart.js — Shopping Cart Logic
   Handles: Add/Remove/Update items, LocalStorage sync, Cart UI
   ================================================================ */

'use strict';

/* ─────────────────────────────────────────────────────
   CART STATE KEY (in localStorage)
   ───────────────────────────────────────────────────── */
const CART_KEY = 'hc_cart';

/* ─────────────────────────────────────────────────────
   READ / WRITE CART
   ───────────────────────────────────────────────────── */

/**
 * Returns the current cart array from localStorage.
 * Each item: { productId, name, price, image, quantity }
 */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Saves the given cart array to localStorage.
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* ─────────────────────────────────────────────────────
   ADD TO CART
   ───────────────────────────────────────────────────── */
function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.productId === product.id);

  if (existingIndex > -1) {
    // Product already in cart → increment quantity
    cart[existingIndex].quantity += quantity;
    showToast(`${product.name} quantity updated!`, 'success');
  } else {
    // New product
    cart.push({
      productId: product.id,
      name:      product.name,
      price:     product.price,
      image:     product.image,
      quantity:  quantity,
    });
    showToast(`${product.name} added to cart! 🛒`, 'success');
  }

  saveCart(cart);
  syncCartBadge();
  renderCartItems();
}

/* ─────────────────────────────────────────────────────
   REMOVE ITEM FROM CART
   ───────────────────────────────────────────────────── */
function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.productId !== productId);
  saveCart(cart);
  syncCartBadge();
  renderCartItems();
  showToast('Item removed from cart.', 'info');
}

/* ─────────────────────────────────────────────────────
   UPDATE QUANTITY
   ───────────────────────────────────────────────────── */
function updateCartQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if (!item) return;

  item.quantity = Math.max(1, item.quantity + delta);

  saveCart(cart);
  syncCartBadge();
  renderCartItems();
}

/* ─────────────────────────────────────────────────────
   CLEAR CART
   ───────────────────────────────────────────────────── */
function clearCart() {
  saveCart([]);
  syncCartBadge();
  renderCartItems();
}

/* ─────────────────────────────────────────────────────
   CART TOTAL CALCULATION
   ───────────────────────────────────────────────────── */
function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartItemCount() {
  return getCart().reduce((count, item) => count + item.quantity, 0);
}

/* ─────────────────────────────────────────────────────
   SYNC BADGE
   ───────────────────────────────────────────────────── */
function syncCartBadge() {
  const badge = document.getElementById('cart-badge');
  const count = getCartItemCount();

  if (!badge) return;

  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.remove('hidden');
    // Pop animation
    badge.style.animation = 'none';
    requestAnimationFrame(() => {
      badge.style.animation = 'badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    });
  } else {
    badge.classList.add('hidden');
  }
}

/* ─────────────────────────────────────────────────────
   TOGGLE CART SIDEBAR
   ───────────────────────────────────────────────────── */
function toggleCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');

  const isOpen = sidebar.classList.contains('open');

  if (isOpen) {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  } else {
    renderCartItems(); // Refresh before opening
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }
}

/* ─────────────────────────────────────────────────────
   RENDER CART ITEMS IN SIDEBAR
   ───────────────────────────────────────────────────── */
function renderCartItems() {
  const container = document.getElementById('cart-items-list');
  const footer    = document.getElementById('cart-footer');
  const cart      = getCart();

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p style="color:var(--text-muted);">Your cart is empty</p>
        <p style="font-size:0.8rem; color:var(--text-muted);">Add some products to get started!</p>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  container.innerHTML = cart.map(item => `
    <div class="cart-item" id="cart-item-${item.productId}">
      <img 
        class="cart-item-img" 
        src="${item.image}" 
        alt="${escapeHtml(item.name)}"
        onerror="this.src='https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&q=80'"
      />
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
        <div class="cart-item-controls">
          <button 
            class="cart-qty-btn" 
            onclick="updateCartQty(${item.productId}, -1)"
            aria-label="Decrease quantity of ${escapeHtml(item.name)}"
          >−</button>
          <span class="cart-item-qty">${item.quantity}</span>
          <button 
            class="cart-qty-btn" 
            onclick="updateCartQty(${item.productId}, 1)"
            aria-label="Increase quantity of ${escapeHtml(item.name)}"
          >+</button>
          <button 
            class="cart-item-remove" 
            onclick="removeFromCart(${item.productId})"
            aria-label="Remove ${escapeHtml(item.name)} from cart"
          >🗑 Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  // Update total display
  const totalDisplay = document.getElementById('cart-total-display');
  if (totalDisplay) {
    const total = getCartTotal();
    const count = getCartItemCount();
    totalDisplay.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="color:var(--text-muted); font-size:0.85rem;">${count} item${count !== 1 ? 's' : ''}</span>
        <span style="font-size:1.1rem; font-weight:800; color:var(--gold);">₹${total.toLocaleString('en-IN')}</span>
      </div>`;
  }
}

/* ─────────────────────────────────────────────────────
   UTILITY: HTML ESCAPE
   ───────────────────────────────────────────────────── */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ─────────────────────────────────────────────────────
   EXPOSE GLOBALS
   ───────────────────────────────────────────────────── */
window.getCart        = getCart;
window.saveCart       = saveCart;
window.addToCart      = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQty  = updateCartQty;
window.clearCart      = clearCart;
window.getCartTotal   = getCartTotal;
window.syncCartBadge  = syncCartBadge;
window.toggleCart     = toggleCart;
window.renderCartItems= renderCartItems;
window.escapeHtml     = escapeHtml;
