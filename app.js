/* Sa Kanto storefront: small, accessible vanilla-JS catalog and local order list. */
'use strict';

(() => {
  const CART_KEY = 'sa-kanto-order-v1';
  const API_URL = '/api/products';
  const MAX_QUANTITY = 99;
  const pesoFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  });

  const els = {
    grid: document.getElementById('product-grid'),
    count: document.getElementById('product-count'),
    filters: document.getElementById('category-filters'),
    search: document.getElementById('product-search'),
    clearSearch: document.getElementById('clear-search'),
    loading: document.getElementById('loading-state'),
    error: document.getElementById('error-state'),
    empty: document.getElementById('empty-state'),
    priceNote: document.getElementById('price-note'),
    retry: document.getElementById('retry-load'),
    reset: document.getElementById('reset-filters'),
    dialog: document.getElementById('order-dialog'),
    openCart: document.getElementById('open-cart'),
    mobileOpenCart: document.getElementById('mobile-open-cart'),
    closeCart: document.getElementById('close-cart'),
    headerCartCount: document.getElementById('header-cart-count'),
    mobileCartSummary: document.getElementById('mobile-cart-summary'),
    mobileCartTotal: document.getElementById('mobile-cart-total'),
    cartItems: document.getElementById('cart-items'),
    cartEmpty: document.getElementById('cart-empty'),
    drawerSummary: document.getElementById('drawer-summary'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    copyOrder: document.getElementById('copy-order'),
    shareOrder: document.getElementById('share-order'),
    clearCart: document.getElementById('clear-cart'),
    shopFromCart: document.getElementById('shop-from-cart'),
    toast: document.getElementById('toast'),
    dialogToast: document.getElementById('dialog-toast')
  };

  const state = {
    products: [],
    categories: [],
    category: 'all',
    search: '',
    cart: new Map(),
    opener: null,
    toastTimer: null
  };

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

  const money = (amount) => pesoFormatter.format(Number(amount) || 0);

  const normalize = (value) => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-PH')
    .trim();

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    const target = els.dialog.open ? els.dialogToast : els.toast;
    const other = target === els.toast ? els.dialogToast : els.toast;
    other.textContent = '';
    other.classList.remove('is-visible');
    if (other === els.dialogToast) other.hidden = true;

    target.textContent = message;
    target.hidden = false;
    target.classList.add('is-visible');
    state.toastTimer = window.setTimeout(() => {
      target.classList.remove('is-visible');
      if (target === els.dialogToast) target.hidden = true;
    }, 2600);
  }

  function readCart() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(CART_KEY) || '{}');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
      for (const [id, rawQuantity] of Object.entries(saved)) {
        const quantity = Number(rawQuantity);
        if (/^[a-z0-9-]+$/.test(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= MAX_QUANTITY) {
          state.cart.set(id, quantity);
        }
      }
    } catch {
      // A blocked or malformed localStorage entry should never prevent shopping.
      state.cart.clear();
    }
  }

  function saveCart() {
    try {
      const snapshot = Object.fromEntries(state.cart.entries());
      window.localStorage.setItem(CART_KEY, JSON.stringify(snapshot));
    } catch {
      showToast('Hindi ma-save sa browser ang listahan. Nananatili muna ito habang bukas ang page.');
    }
  }

  function categoryLabel(id) {
    return state.categories.find((category) => category.id === id)?.label || id;
  }

  function makeCategoryFilters() {
    const counts = new Map();
    state.products.forEach((product) => counts.set(product.category, (counts.get(product.category) || 0) + 1));
    const categories = [{ id: 'all', label: 'Lahat', count: state.products.length }]
      .concat(state.categories
        .filter((category) => counts.has(category.id))
        .map((category) => ({ ...category, count: counts.get(category.id) })));

    els.filters.innerHTML = categories.map((category) => `
      <button class="category-button" type="button" data-category="${escapeHtml(category.id)}" aria-pressed="${category.id === state.category ? 'true' : 'false'}">
        <span>${escapeHtml(category.label)}</span>
        <span class="category-button-count" aria-label="${category.count} products">${category.count}</span>
      </button>
    `).join('');
  }

  function productCard(product) {
    const category = categoryLabel(product.category);
    const alt = `Original illustration of ${product.brand} ${product.name} packaging`;
    return `
      <li class="product-slot">
        <article class="product-card">
          <div class="product-art-stage">
            <span class="tingi-ticket">${escapeHtml(product.unit)}</span>
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(alt)}" width="240" height="220" loading="lazy" decoding="async">
          </div>
          <div class="product-copy">
            <span class="product-category">${escapeHtml(category)}</span>
            <p class="product-brand">${escapeHtml(product.brand)}</p>
            <h3>${escapeHtml(product.name)}</h3>
            <p class="product-detail">${escapeHtml(product.detail)}</p>
            <div class="product-purchase">
              <span class="product-price"><span class="product-price-label">Presyo</span><strong>${money(product.price)}</strong></span>
              <button class="add-button" type="button" data-add-id="${escapeHtml(product.id)}" aria-label="Idagdag ang ${escapeHtml(product.brand)} ${escapeHtml(product.name)} sa order list, ${money(product.price)}">
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 3v14M3 10h14"/></svg>
                <span>Idagdag</span>
              </button>
            </div>
          </div>
        </article>
      </li>`;
  }

  function visibleProducts() {
    const query = normalize(state.search);
    return state.products.filter((product) => {
      const categoryMatches = state.category === 'all' || product.category === state.category;
      if (!categoryMatches) return false;
      if (!query) return true;
      const searchIn = normalize([
        product.brand,
        product.name,
        product.artLabel,
        product.category,
        categoryLabel(product.category),
        product.detail,
        product.unit,
        product.description
      ].join(' '));
      return searchIn.includes(query);
    });
  }

  function renderCatalog() {
    const products = visibleProducts();
    els.grid.innerHTML = products.map(productCard).join('');
    els.grid.hidden = products.length === 0;
    els.empty.hidden = products.length !== 0 || state.products.length === 0;
    els.count.innerHTML = `<strong>${products.length}</strong><span>tinda</span>`;
    els.clearSearch.hidden = !state.search;
    els.filters.querySelectorAll('[data-category]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.category === state.category));
    });
  }

  function currentTotals() {
    let quantity = 0;
    let subtotal = 0;
    for (const [id, amount] of state.cart.entries()) {
      const product = state.products.find((item) => item.id === id);
      if (!product) continue;
      quantity += amount;
      subtotal += product.price * amount;
    }
    return { quantity, subtotal };
  }

  function cartItemRow(product, quantity) {
    return `
      <li class="cart-row">
        <img class="cart-thumb" src="${escapeHtml(product.image)}" alt="" width="66" height="66">
        <div class="cart-product-copy">
          <strong>${escapeHtml(product.name)}</strong>
          <span>${escapeHtml(product.brand)} · ${escapeHtml(product.unit)} · ${money(product.price)} bawat isa</span>
          <div class="cart-quantity" aria-label="Quantity for ${escapeHtml(product.name)}">
            <button class="quantity-button" type="button" data-cart-action="decrease" data-cart-id="${escapeHtml(product.id)}" aria-label="Bawasan ang ${escapeHtml(product.name)} ng isa">−</button>
            <span class="quantity-value" aria-live="polite">${quantity}</span>
            <button class="quantity-button" type="button" data-cart-action="increase" data-cart-id="${escapeHtml(product.id)}" aria-label="Dagdagan ang ${escapeHtml(product.name)} ng isa">+</button>
          </div>
        </div>
        <strong class="cart-line-total">${money(product.price * quantity)}</strong>
      </li>`;
  }

  function renderCart() {
    // Remove any saved entries for items that no longer exist in the catalog.
    const knownIds = new Set(state.products.map((product) => product.id));
    for (const id of state.cart.keys()) {
      if (!knownIds.has(id)) state.cart.delete(id);
    }

    const entries = state.products
      .filter((product) => state.cart.has(product.id))
      .map((product) => cartItemRow(product, state.cart.get(product.id)));
    const { quantity, subtotal } = currentTotals();
    const itemTypes = entries.length;

    els.cartItems.innerHTML = entries.join('');
    els.cartEmpty.hidden = itemTypes !== 0;
    els.drawerSummary.hidden = itemTypes === 0;
    els.cartSubtotal.textContent = money(subtotal);
    els.headerCartCount.textContent = String(quantity);
    els.openCart.setAttribute('aria-label', `Buksan ang order listahan, ${quantity} ${quantity === 1 ? 'item' : 'items'}`);
    els.mobileCartTotal.textContent = money(subtotal);
    els.mobileCartSummary.textContent = quantity === 0
      ? 'Wala pang idagdag'
      : `${itemTypes} uri · ${quantity} piraso`;
    els.shareOrder.hidden = typeof navigator.share !== 'function' || itemTypes === 0;
    els.copyOrder.disabled = itemTypes === 0;

    if (!els.dialog.open) saveCart();
  }

  function addToCart(id) {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;
    const current = state.cart.get(id) || 0;
    if (current >= MAX_QUANTITY) {
      showToast(`Hanggang ${MAX_QUANTITY} piraso lang bawat tinda sa listahan.`);
      return;
    }
    state.cart.set(id, current + 1);
    saveCart();
    renderCart();
    showToast(current ? `Nadagdagan: ${product.name}.` : `Naidagdag sa listahan: ${product.name}.`);
  }

  function changeQuantity(id, direction) {
    const current = state.cart.get(id) || 0;
    if (direction === 'increase') {
      if (current >= MAX_QUANTITY) {
        showToast(`Hanggang ${MAX_QUANTITY} piraso lang bawat tinda sa listahan.`);
        return;
      }
      state.cart.set(id, current + 1);
    } else if (current <= 1) {
      state.cart.delete(id);
    } else {
      state.cart.set(id, current - 1);
    }
    saveCart();
    renderCart();
  }

  function getOrderText() {
    const lines = ['Order list — Sa Kanto', 'Paki-prepare po kung available:'];
    for (const product of state.products) {
      const quantity = state.cart.get(product.id);
      if (!quantity) continue;
      lines.push(`${quantity} × ${product.name} (${product.brand}, ${product.unit}) — ${money(product.price * quantity)}`);
    }
    lines.push(`Subtotal estimate: ${money(currentTotals().subtotal)}`);
    lines.push('Final price and availability: paki-confirm sa tindahan.');
    return lines.join('\n');
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Clipboard permission unavailable');
  }

  function openCart(opener) {
    if (els.dialog.open) return;
    state.opener = opener || document.activeElement;
    els.dialog.showModal();
    els.closeCart.focus();
  }

  function closeCart() {
    if (els.dialog.open) els.dialog.close();
  }

  async function loadProducts() {
    els.loading.hidden = false;
    els.error.hidden = true;
    els.empty.hidden = true;
    els.grid.hidden = true;
    try {
      const response = await fetch(API_URL, {
        headers: { Accept: 'application/json' },
        cache: 'no-cache'
      });
      if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
      const payload = await response.json();
      if (!Array.isArray(payload.products) || !Array.isArray(payload.categories)) {
        throw new Error('Catalog data has an unexpected format');
      }
      state.products = payload.products.filter((product) =>
        product && typeof product.id === 'string' && Number.isFinite(Number(product.price)) &&
        typeof product.image === 'string' && typeof product.category === 'string');
      state.categories = payload.categories.filter((category) =>
        category && typeof category.id === 'string' && typeof category.label === 'string');
      if (state.products.length === 0) throw new Error('The catalog is empty');

      const knownIds = new Set(state.products.map((product) => product.id));
      for (const id of state.cart.keys()) {
        if (!knownIds.has(id)) state.cart.delete(id);
      }
      makeCategoryFilters();
      els.priceNote.textContent = payload.store?.priceNote || 'Presyong gabay lang; maaaring mag-iba depende sa lugar at supplier.';
      els.loading.hidden = true;
      els.error.hidden = true;
      els.grid.hidden = false;
      renderCatalog();
      renderCart();
    } catch (error) {
      console.error('Unable to load the Sa Kanto catalog:', error);
      els.loading.hidden = true;
      els.grid.hidden = true;
      els.error.hidden = false;
    }
  }

  els.search.addEventListener('input', () => {
    state.search = els.search.value;
    if (state.products.length) renderCatalog();
  });

  document.getElementById('search-form').addEventListener('submit', (event) => event.preventDefault());

  els.clearSearch.addEventListener('click', () => {
    els.search.value = '';
    state.search = '';
    renderCatalog();
    els.search.focus();
  });

  els.filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    renderCatalog();
  });

  els.grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add-id]');
    if (button) addToCart(button.dataset.addId);
  });

  els.cartItems.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action][data-cart-id]');
    if (button) changeQuantity(button.dataset.cartId, button.dataset.cartAction);
  });

  els.openCart.addEventListener('click', () => openCart(els.openCart));
  els.mobileOpenCart.addEventListener('click', () => openCart(els.mobileOpenCart));
  els.closeCart.addEventListener('click', closeCart);
  els.dialog.addEventListener('click', (event) => {
    if (event.target === els.dialog) closeCart();
  });
  els.dialog.addEventListener('close', () => {
    if (els.dialogToast.classList.contains('is-visible')) window.clearTimeout(state.toastTimer);
    els.dialogToast.hidden = true;
    els.dialogToast.classList.remove('is-visible');
    els.dialogToast.textContent = '';
    if (state.opener instanceof HTMLElement && state.opener.isConnected) state.opener.focus();
  });

  els.shopFromCart.addEventListener('click', () => {
    closeCart();
    document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => els.search.focus({ preventScroll: true }), 220);
  });

  els.copyOrder.addEventListener('click', async () => {
    try {
      await copyText(getOrderText());
      showToast('Nakopya na ang order list. I-send kay suki!');
    } catch {
      showToast('Hindi makopya ngayon. Subukang i-share ang listahan.');
    }
  });

  els.shareOrder.addEventListener('click', async () => {
    if (typeof navigator.share !== 'function') return;
    try {
      await navigator.share({ title: 'Order list — Sa Kanto', text: getOrderText() });
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('Hindi na-share ang listahan. Puwede itong kopyahin sa halip.');
    }
  });

  els.clearCart.addEventListener('click', () => {
    const { quantity } = currentTotals();
    if (!quantity) return;
    const confirmed = window.confirm('Burahin ang lahat ng nasa order list?');
    if (!confirmed) return;
    state.cart.clear();
    saveCart();
    renderCart();
    showToast('Nabura na ang order list.');
  });

  els.reset.addEventListener('click', () => {
    state.category = 'all';
    state.search = '';
    els.search.value = '';
    renderCatalog();
    els.search.focus({ preventScroll: true });
  });

  els.retry.addEventListener('click', loadProducts);

  readCart();
  loadProducts();
})();
