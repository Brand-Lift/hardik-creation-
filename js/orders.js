/* ================================================================
   orders.js — My Orders Module
   Fetches and renders the current user's order history
   ================================================================ */

'use strict';

/* ─────────────────────────────────────────────────────
   LOAD ORDERS FROM BACKEND
   GET /api/orders (JWT protected)
   ───────────────────────────────────────────────────── */
async function loadOrders() {
  const listEl   = document.getElementById('orders-list');
  const emptyEl  = document.getElementById('orders-empty');

  if (!listEl) return;

  // Show loading state
  listEl.innerHTML = `
    <div style="text-align:center; padding:60px; color:var(--text-muted);">
      <div style="display:inline-block; width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--gold); border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom:16px;"></div>
      <p>Loading your orders...</p>
    </div>`;
  if (emptyEl) emptyEl.classList.add('hidden');

  const token = currentToken || localStorage.getItem('hc_token');
  if (!token) {
    showToast('Please sign in to view orders.', 'warning');
    showAuthModal();
    return;
  }

  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      showToast('Session expired. Please sign in again.', 'error');
      handleLogout();
      return;
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load orders.');
    }

    const orders = await response.json();
    renderOrders(orders);

  } catch (err) {
    console.error('Load orders error:', err);
    listEl.innerHTML = `
      <div style="text-align:center; padding:60px; color:var(--error);">
        <div style="font-size:2rem; margin-bottom:12px;">❌</div>
        <p>${err.message}</p>
        <button class="btn-secondary" onclick="loadOrders()" style="margin-top:16px;">Try Again</button>
      </div>`;
  }
}

/* ─────────────────────────────────────────────────────
   RENDER ORDERS LIST
   ───────────────────────────────────────────────────── */
function renderOrders(orders) {
  const listEl  = document.getElementById('orders-list');
  const emptyEl = document.getElementById('orders-empty');

  if (!orders || orders.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');

  // Sort by newest first
  const sorted = [...orders].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  listEl.innerHTML = sorted.map(order => createOrderCardHTML(order)).join('');
}

/* ─────────────────────────────────────────────────────
   CREATE ORDER CARD HTML
   ───────────────────────────────────────────────────── */
function createOrderCardHTML(order) {
  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const items = Array.isArray(order.items) ? order.items : [];
  const statusBadge = getStatusBadgeHTML(order.order_status);

  const itemsHTML = items.map(item => `
    <div class="order-item-row">
      <span class="order-item-name">${escapeHtml(item.name || '')}</span>
      <span class="order-item-qty">×${item.quantity || 1}</span>
      <span class="order-item-price">₹${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}</span>
    </div>
  `).join('');

  return `
    <div class="order-card" id="order-${order.id}">
      <div class="order-card-header">
        <div>
          <div class="order-card-id">Order ID: <span>${order.id ? order.id.substring(0, 16) + '…' : 'N/A'}</span></div>
          <div class="order-card-date">📅 ${date}</div>
        </div>
        ${statusBadge}
      </div>

      <div class="order-card-items">
        <div class="order-card-items-title">Items Ordered</div>
        ${itemsHTML || '<div style="color:var(--text-muted); font-size:0.85rem;">No items found</div>'}
      </div>

      <div class="order-card-footer">
        <div class="order-card-total">
          Total: <span>₹${Number(order.total_amount || 0).toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <span class="order-payment-method">${order.payment_method === 'UPI' ? '📱 UPI' : '💵 COD'}</span>
          <span style="font-size:0.75rem; color:var(--text-muted);">
            📍 ${escapeHtml(order.customer_city || '')} ${escapeHtml(order.customer_pincode || '')}
          </span>
        </div>
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────────────
   STATUS BADGE HTML
   Processing → Yellow/Gold
   Shipped    → Blue
   Delivered  → Green
   Cancelled  → Red
   ───────────────────────────────────────────────────── */
function getStatusBadgeHTML(status) {
  const badges = {
    Processing: { cls: 'badge-processing', icon: '⏳', label: 'Processing' },
    Shipped:    { cls: 'badge-shipped',    icon: '🚚', label: 'Shipped' },
    Delivered:  { cls: 'badge-delivered',  icon: '✅', label: 'Delivered' },
    Cancelled:  { cls: 'badge-cancelled',  icon: '❌', label: 'Cancelled' },
  };

  const badge = badges[status] || { cls: 'badge-processing', icon: '⏳', label: status || 'Processing' };

  return `
    <span class="status-badge ${badge.cls}">
      ${badge.icon} ${badge.label}
    </span>`;
}

/* ─────────────────────────────────────────────────────
   EXPOSE GLOBALS
   ───────────────────────────────────────────────────── */
window.loadOrders = loadOrders;
