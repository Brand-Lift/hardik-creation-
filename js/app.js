/* ================================================================
   app.js — Core Application Logic
   Handles: Products data, Rendering, UI, Auth state, Animations
   ================================================================ */

'use strict';

/* ─────────────────────────────────────────────────────
   CONFIGURATION
   Replace BACKEND_URL with your deployed backend URL
   ───────────────────────────────────────────────────── */
const CONFIG = {
  BACKEND_URL: 'http://localhost:5000/api',   // ← change after deploy
  WHATSAPP_NUMBER: '919876543210',             // ← your WhatsApp number
};

/* ─────────────────────────────────────────────────────
   PRODUCT CATALOG (8 Sample Products)
   ───────────────────────────────────────────────────── */
const PRODUCTS = [
  {
    id: 1,
    name: 'Handwoven Bohemian Wall Art',
    category: 'decor',
    price: 1299,
    originalPrice: 1799,
    rating: 4.8,
    ratingCount: 247,
    badge: 'Best Seller',
    description: 'Elevate your living space with this stunning handwoven Bohemian wall art. Crafted from premium macramé cotton by skilled artisans, this piece brings warmth and artisanal charm to any room. Each piece is unique.',
    image: 'https://images.unsplash.com/photo-1622372738946-62e02505feb3?w=600&q=80',
  },
  {
    id: 2,
    name: 'Terracotta Pot Set (Set of 3)',
    category: 'decor',
    price: 849,
    originalPrice: 1100,
    rating: 4.6,
    ratingCount: 183,
    badge: 'New Arrival',
    description: 'A beautifully crafted set of three terracotta pots, perfect for succulents, herbs, or air plants. Hand-painted with traditional Indian motifs using eco-friendly colors. Includes drainage holes.',
    image: 'https://images.unsplash.com/photo-1604762524889-3e2fcc145683?w=600&q=80',
  },
  {
    id: 3,
    name: 'Oxidized Silver Jhumka Earrings',
    category: 'jewelry',
    price: 599,
    originalPrice: 799,
    rating: 4.9,
    ratingCount: 412,
    badge: 'Top Rated',
    description: 'Exquisite oxidized silver Jhumka earrings handcrafted by traditional jewellers. Features intricate filigree work with tiny bell accents. Perfect for ethnic wear and festivals.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
  },
  {
    id: 4,
    name: 'Block Print Cotton Dupatta',
    category: 'textile',
    price: 749,
    originalPrice: 999,
    rating: 4.7,
    ratingCount: 156,
    badge: 'Handcrafted',
    description: 'Pure cotton dupatta featuring traditional Rajasthani block-print art. Handprinted using wooden blocks and natural vegetable dyes. Soft, breathable, and ethically made.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
  },
  {
    id: 5,
    name: 'Marble Inlay Coasters (Set of 4)',
    category: 'gift',
    price: 1149,
    originalPrice: 1499,
    rating: 4.8,
    ratingCount: 98,
    badge: 'Premium',
    description: 'Stunning marble coasters with intricate inlay work inspired by the Taj Mahal. Each coaster is individually crafted using precious semi-stones set in marble. Includes a velvet storage box.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    id: 6,
    name: 'Silk Thread Choker Necklace',
    category: 'jewelry',
    price: 449,
    originalPrice: 650,
    rating: 4.5,
    ratingCount: 234,
    badge: 'Trending',
    description: 'A vibrant multi-layered silk thread choker necklace with gold-toned accents and mirror work. Lightweight and comfortable for all-day wear. Available in a stunning multicolor palette.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
  },
  {
    id: 7,
    name: 'Bamboo Photo Frame (5×7)',
    category: 'gift',
    price: 499,
    originalPrice: 699,
    rating: 4.6,
    ratingCount: 77,
    badge: 'Eco-Friendly',
    description: 'Handmade bamboo photo frame with laser-etched floral patterns. Sustainable, lightweight, and beautifully finished. A heartfelt gift for any occasion.',
    image: 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&q=80',
  },
  {
    id: 8,
    name: 'Kantha Stitch Cushion Cover',
    category: 'textile',
    price: 649,
    originalPrice: 850,
    rating: 4.7,
    ratingCount: 142,
    badge: 'Artisan Made',
    description: 'Traditional Kantha stitch cushion cover made from recycled vintage sarees. Features colorful geometric patterns and is double-sided. 16×16 inches. Machine washable.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
  },
];

/* ─────────────────────────────────────────────────────
   STATE
   ───────────────────────────────────────────────────── */
let currentUser     = null;     // logged-in user object
let currentToken    = null;     // JWT token
let currentSection  = 'home';   // active section
let activeCategory  = 'all';    // active category filter
let searchQuery     = '';       // current search string
let overlayProduct  = null;     // product open in overlay
let overlayQty      = 1;        // qty selected in overlay

/* ─────────────────────────────────────────────────────
   INITIALIZATION
   ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSplash();
  initScrollHeader();
  initHeroParticles();
  restoreSession();
});

/* ─────────────────────────────────────────────────────
   SPLASH SCREEN (2.5 seconds)
   ───────────────────────────────────────────────────── */
function initSplash() {
  // Create floating particles
  const container = document.getElementById('splash-particles');
  if (container) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'splash-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px';
      p.style.animationDuration = (Math.random() * 4 + 3) + 's';
      p.style.animationDelay = (Math.random() * 2) + 's';
      container.appendChild(p);
    }
  }

  // Dismiss splash after 2.5s
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('slide-out');
      setTimeout(() => {
        splash.style.display = 'none';
        splash.setAttribute('aria-hidden', 'true');
      }, 900);
    }
  }, 2500);
}

/* ─────────────────────────────────────────────────────
   HERO PARTICLES
   ───────────────────────────────────────────────────── */
function initHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';
    const size = Math.random() * 6 + 2;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 8 + 6}s;
      animation-delay: ${Math.random() * 4}s;
    `;
    container.appendChild(p);
  }
}

/* ─────────────────────────────────────────────────────
   STICKY HEADER
   ───────────────────────────────────────────────────── */
function initScrollHeader() {
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────
   SESSION RESTORE
   ───────────────────────────────────────────────────── */
function restoreSession() {
  try {
    const storedToken = localStorage.getItem('hc_token');
    const storedUser  = localStorage.getItem('hc_user');
    if (storedToken && storedUser) {
      currentToken = storedToken;
      currentUser  = JSON.parse(storedUser);
      onLoginSuccess(currentUser, currentToken, false);
    } else {
      // No session → show auth gate after splash
      setTimeout(() => showAuthModal(), 2700);
    }
  } catch (e) {
    console.error('Session restore failed:', e);
    setTimeout(() => showAuthModal(), 2700);
  }
}

/* ─────────────────────────────────────────────────────
   POST-LOGIN SETUP
   ───────────────────────────────────────────────────── */
function onLoginSuccess(user, token, isNew = true) {
  currentUser  = user;
  currentToken = token;

  // Persist
  localStorage.setItem('hc_token', token);
  localStorage.setItem('hc_user', JSON.stringify(user));

  // Update UI
  showLoggedInUI();
  renderProducts(getFilteredProducts());
  syncCartBadge();

  if (isNew) {
    showToast(`Welcome${user.name ? ', ' + user.name.split(' ')[0] : ''}! 🎉`, 'success');
    hideAuthModal();
  }
}

/* ─────────────────────────────────────────────────────
   AUTH UI STATE
   ───────────────────────────────────────────────────── */
function showLoggedInUI() {
  // Show authenticated elements
  const authElems = ['my-orders-btn', 'logout-btn', 'mobile-orders-btn', 'mobile-logout-btn'];
  authElems.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  });
}

function showLoggedOutUI() {
  const authElems = ['my-orders-btn', 'logout-btn', 'mobile-orders-btn', 'mobile-logout-btn'];
  authElems.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

/* ─────────────────────────────────────────────────────
   AUTH MODAL
   ───────────────────────────────────────────────────── */
function showAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('hidden');
}

function hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
}

function switchAuthTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));

  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`panel-${tab}`).classList.add('active');

  // Update aria attributes
  document.getElementById('tab-signin').setAttribute('aria-selected', tab === 'signin' ? 'true' : 'false');
  document.getElementById('tab-signup').setAttribute('aria-selected', tab === 'signup' ? 'true' : 'false');
}

/* ─────────────────────────────────────────────────────
   PASSWORD TOGGLE
   ───────────────────────────────────────────────────── */
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.textContent = isPassword ? '🙈' : '👁';
}

/* ─────────────────────────────────────────────────────
   LOGOUT
   ───────────────────────────────────────────────────── */
function handleLogout() {
  currentUser  = null;
  currentToken = null;
  localStorage.removeItem('hc_token');
  localStorage.removeItem('hc_user');

  // Clear cart too (optional — keeps it for convenience on re-login)
  // localStorage.removeItem('hc_cart');

  showLoggedOutUI();
  showSection('home');
  closeMobileMenu();
  showAuthModal();
  showToast('You have been logged out.', 'info');
}

/* ─────────────────────────────────────────────────────
   SECTION NAVIGATION
   ───────────────────────────────────────────────────── */
function showSection(section) {
  if (!currentUser && section !== 'home') {
    showToast('Please sign in to access this page.', 'warning');
    showAuthModal();
    return;
  }

  currentSection = section;

  document.getElementById('section-home').classList.add('hidden');
  document.getElementById('section-orders').classList.add('hidden');

  if (section === 'home') {
    document.getElementById('section-home').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (section === 'orders') {
    document.getElementById('section-orders').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadOrders(); // orders.js
  }
}

/* ─────────────────────────────────────────────────────
   MOBILE MENU
   ───────────────────────────────────────────────────── */
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}
function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.add('hidden');
}

/* ─────────────────────────────────────────────────────
   PRODUCT RENDERING
   ───────────────────────────────────────────────────── */
function getFilteredProducts() {
  let filtered = [...PRODUCTS];

  // Category filter
  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => p.category === activeCategory);
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  return filtered;
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  const noProducts = document.getElementById('no-products');

  if (!products || products.length === 0) {
    grid.innerHTML = '';
    noProducts.classList.remove('hidden');
    return;
  }
  noProducts.classList.add('hidden');

  grid.innerHTML = products.map(p => createProductCardHTML(p)).join('');

  // Attach 3D tilt effects to all rendered cards
  document.querySelectorAll('.product-card').forEach(card => {
    attach3DTilt(card);
  });
}

function createProductCardHTML(product) {
  const stars = generateStars(product.rating);
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return `
    <article class="product-card" 
      id="product-card-${product.id}"
      onclick="openProductOverlay(${product.id})"
      tabindex="0"
      role="button"
      aria-label="View ${product.name}, ₹${product.price}"
      onkeydown="if(event.key==='Enter') openProductOverlay(${product.id})"
    >
      <div class="product-card-img-wrapper">
        <img 
          src="${product.image}" 
          alt="${product.name}" 
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80'"
        />
        <span class="product-card-badge">${product.badge}</span>
        ${discount > 0 ? `<span style="position:absolute;top:12px;right:12px;background:rgba(255,59,48,0.9);color:#fff;padding:3px 10px;border-radius:50px;font-size:0.7rem;font-weight:700;">-${discount}%</span>` : ''}
      </div>
      <div class="product-card-body">
        <h3 class="product-card-title">${product.name}</h3>
        <div class="product-card-rating">
          <span class="stars">${stars}</span>
          <span class="rating-count">${product.rating} (${product.ratingCount})</span>
        </div>
        <p class="product-card-desc">${product.description}</p>
        <div class="product-card-footer">
          <div>
            <div class="product-price">₹${product.price.toLocaleString('en-IN')}</div>
            ${product.originalPrice ? `<div style="font-size:0.75rem;color:var(--text-muted);text-decoration:line-through;">₹${product.originalPrice.toLocaleString('en-IN')}</div>` : ''}
          </div>
          <div class="product-card-actions" onclick="event.stopPropagation()">
            <button 
              class="btn-cart" 
              onclick="quickAddToCart(${product.id})"
              aria-label="Add ${product.name} to cart"
            >
              🛒 Cart
            </button>
            <button 
              class="btn-buynow" 
              onclick="quickBuyNow(${product.id})"
              aria-label="Buy ${product.name} now"
            >
              ⚡ Buy
            </button>
          </div>
        </div>
      </div>
    </article>`;
}

/* ─────────────────────────────────────────────────────
   3D TILT EFFECT
   ───────────────────────────────────────────────────── */
function attach3DTilt(card) {
  const MAX_TILT = 12;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -MAX_TILT;
    const rotateY = ((x - centerX) / centerX) * MAX_TILT;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    card.style.transition = 'transform 0.5s ease';
  });

  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.1s ease';
  });
}

/* ─────────────────────────────────────────────────────
   PRODUCT OVERLAY
   ───────────────────────────────────────────────────── */
function openProductOverlay(productId) {
  if (!currentUser) {
    showToast('Please sign in to view product details.', 'warning');
    showAuthModal();
    return;
  }

  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  overlayProduct = product;
  overlayQty = 1;

  // Populate overlay
  document.getElementById('overlay-product-img').src = product.image;
  document.getElementById('overlay-product-img').alt = product.name;
  document.getElementById('overlay-product-name').textContent = product.name;
  document.getElementById('overlay-product-badge').textContent = product.badge;
  document.getElementById('overlay-product-desc').textContent = product.description;
  document.getElementById('overlay-product-price').textContent = `₹${product.price.toLocaleString('en-IN')}`;
  document.getElementById('overlay-product-rating').innerHTML = `
    <span class="stars">${generateStars(product.rating)}</span>
    <span class="rating-count" style="margin-left:6px;">${product.rating} (${product.ratingCount} reviews)</span>
  `;
  document.getElementById('overlay-qty-display').textContent = '1';

  // Show overlay
  const overlay = document.getElementById('product-overlay');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProductOverlay() {
  const overlay = document.getElementById('product-overlay');
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
  overlayProduct = null;
  overlayQty = 1;
}

function changeOverlayQty(delta) {
  overlayQty = Math.max(1, overlayQty + delta);
  document.getElementById('overlay-qty-display').textContent = overlayQty;
}

function overlayAddToCart() {
  if (!overlayProduct) return;
  addToCart(overlayProduct, overlayQty);
  closeProductOverlay();
}

function overlayBuyNow() {
  if (!overlayProduct) return;
  addToCart(overlayProduct, overlayQty);
  closeProductOverlay();
  openCheckout();
}

/* ─────────────────────────────────────────────────────
   QUICK ACTIONS (from card buttons)
   ───────────────────────────────────────────────────── */
function quickAddToCart(productId) {
  if (!currentUser) {
    showToast('Please sign in to add items to cart.', 'warning');
    showAuthModal();
    return;
  }
  const product = PRODUCTS.find(p => p.id === productId);
  if (product) addToCart(product, 1);
}

function quickBuyNow(productId) {
  if (!currentUser) {
    showToast('Please sign in to purchase.', 'warning');
    showAuthModal();
    return;
  }
  const product = PRODUCTS.find(p => p.id === productId);
  if (product) {
    addToCart(product, 1);
    openCheckout();
  }
}

/* ─────────────────────────────────────────────────────
   CATEGORY & SEARCH FILTERS
   ───────────────────────────────────────────────────── */
function filterByCategory(category, btn) {
  activeCategory = category;

  // Update button styles
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  renderProducts(getFilteredProducts());
}

function filterProducts(query) {
  searchQuery = query;
  renderProducts(getFilteredProducts());
}

/* ─────────────────────────────────────────────────────
   UTILITY: STARS GENERATOR
   ───────────────────────────────────────────────────── */
function generateStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(empty);
}

/* ─────────────────────────────────────────────────────
   UTILITY: TOAST NOTIFICATION
   ───────────────────────────────────────────────────── */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
  });

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
  }, duration);
}

/* ─────────────────────────────────────────────────────
   UTILITY: COPY TO CLIPBOARD
   ───────────────────────────────────────────────────── */
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text)
    .then(() => {
      if (btn) btn.classList.add('copied');
      showToast(`Copied: ${text}`, 'success', 2000);
      setTimeout(() => { if (btn) btn.classList.remove('copied'); }, 2000);
    })
    .catch(() => showToast('Could not copy. Please copy manually.', 'error'));
}

/* ─────────────────────────────────────────────────────
   CHECKOUT OPENER (from cart)
   ───────────────────────────────────────────────────── */
function proceedToCheckout() {
  if (!currentUser) {
    showToast('Please sign in to checkout.', 'warning');
    showAuthModal();
    return;
  }
  const cart = getCart();
  if (!cart || cart.length === 0) {
    showToast('Your cart is empty!', 'warning');
    return;
  }
  toggleCart(); // close cart sidebar
  openCheckout();
}

/* ─────────────────────────────────────────────────────
   EXPOSE GLOBALS (used by inline onclick handlers)
   ───────────────────────────────────────────────────── */
window.showToast            = showToast;
window.copyToClipboard      = copyToClipboard;
window.onLoginSuccess       = onLoginSuccess;
window.showAuthModal        = showAuthModal;
window.hideAuthModal        = hideAuthModal;
window.showSection          = showSection;
window.handleLogout         = handleLogout;
window.toggleMobileMenu     = toggleMobileMenu;
window.closeMobileMenu      = closeMobileMenu;
window.switchAuthTab        = switchAuthTab;
window.togglePassword       = togglePassword;
window.filterByCategory     = filterByCategory;
window.filterProducts       = filterProducts;
window.openProductOverlay   = openProductOverlay;
window.closeProductOverlay  = closeProductOverlay;
window.changeOverlayQty     = changeOverlayQty;
window.overlayAddToCart     = overlayAddToCart;
window.overlayBuyNow        = overlayBuyNow;
window.quickAddToCart       = quickAddToCart;
window.quickBuyNow          = quickBuyNow;
window.proceedToCheckout    = proceedToCheckout;
window.CONFIG               = CONFIG;
window.currentUser          = currentUser;
window.currentToken         = currentToken;
window.PRODUCTS             = PRODUCTS;

// Keep token and user in sync with window scope (needed by other modules)
Object.defineProperty(window, 'currentToken', {
  get: () => currentToken,
  set: (v) => { currentToken = v; }
});
Object.defineProperty(window, 'currentUser', {
  get: () => currentUser,
  set: (v) => { currentUser = v; }
});
