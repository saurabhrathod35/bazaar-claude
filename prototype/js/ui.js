/* ============================================================
   KEENPLAZA — ui.js
   Shared kit for every screen: formatting, placeholder art, icons,
   toast / modal / drawer, charts, and the persisted "super cart" store.
   Loaded by index.html, services.html, admin.html, mobile.html.
   ============================================================ */
(function (global) {
  'use strict';
  const M = global.MOCK;

  /* ---------- tiny DOM helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, attrs = {}, html = '') => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => k === 'class' ? n.className = v : n.setAttribute(k, v));
    if (html) n.innerHTML = html;
    return n;
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Live value of a CSS custom property — keeps charts on the active theme. */
  const cssVar = (name, fallback) =>
    (getComputedStyle(document.documentElement).getPropertyValue(name) || '').trim() || fallback || '#5B3DF5';

  /* ---------- formatting ---------- */
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const inrShort = n => n >= 10000000 ? '₹' + (n / 10000000).toFixed(2) + ' Cr'
    : n >= 100000 ? '₹' + (n / 100000).toFixed(2) + ' L'
    : n >= 1000 ? '₹' + (n / 1000).toFixed(1) + 'K' : '₹' + n;
  const num = n => Number(n).toLocaleString('en-IN');
  const dateFmt = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const dateShort = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const timeAgo = d => {
    const diff = (new Date('2026-08-09T18:00:00') - new Date(d)) / 86400000;
    if (diff < 1) return 'Today';
    if (diff < 2) return 'Yesterday';
    if (diff < 0) return 'Scheduled';
    return Math.floor(diff) + ' days ago';
  };
  const initials = name => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  /* ---------- placeholder artwork (no external assets) ---------- */
  const PALETTES = [['#EDE9FE', '#C4B5FD'], ['#DCFAF6', '#7DDDD3'], ['#FFE9DC', '#FFB98A'],
                    ['#E4EEFF', '#9CC0FF'], ['#FDE7F3', '#F9A8D4'], ['#FEF3C7', '#FCD34D'],
                    ['#E6F6EC', '#8ED9AC'], ['#EEF0F5', '#C3C8D4']];
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

  /** Deterministic SVG placeholder — gradient + emoji + label strip. */
  function ph(seed, emoji = '🛍️', label = '') {
    const [a, b] = PALETTES[hash(String(seed)) % PALETTES.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <rect width="480" height="480" fill="url(#g)"/>
      <circle cx="120" cy="110" r="150" fill="#ffffff" opacity=".22"/>
      <circle cx="392" cy="404" r="110" fill="#ffffff" opacity=".16"/>
      <text x="240" y="268" font-size="140" text-anchor="middle">${emoji}</text>
      ${label ? `<text x="240" y="392" font-size="24" font-family="Inter,Arial" font-weight="700"
        fill="#26263a" opacity=".55" text-anchor="middle">${esc(label).slice(0, 22)}</text>` : ''}
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  const productImg = (p, i = 0) => ph(p.id + '-' + i, p.emoji || '🛍️', i === 0 ? p.brand : 'View ' + (i + 1));
  const bannerImg = (seed, emoji) => ph('bn-' + seed, emoji, '');

  /* ---------- icons (inline SVG, 24px grid) ---------- */
  const ICONS = {
    logo:'<path d="M5 11.6h38"/><path d="M8 16h32v23H8Z"/><path d="M13 39v-8.5a3 3 0 0 1 6 0V39M29 39v-8.5a3 3 0 0 1 6 0V39"/><path d="M21.5 39V30a2.5 2.5 0 0 1 5 0v9Z" fill="var(--accent)" stroke="none"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    cart:'<path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.9a2 2 0 002-1.6L21 8H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>',
    heart:'<path d="M12 20s-7-4.4-7-9.2A3.9 3.9 0 0112 8a3.9 3.9 0 017 2.8C19 15.6 12 20 12 20z"/>',
    bell:'<path d="M18 15V10a6 6 0 10-12 0v5l-2 3h16z"/><path d="M10 21h4"/>',
    user:'<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0115 0"/>',
    pin:'<path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    close:'<path d="M6 6l12 12M18 6L6 18"/>',
    chevron:'<path d="M9 6l6 6-6 6"/>',
    chevronDown:'<path d="M6 9l6 6 6-6"/>',
    back:'<path d="M15 6l-6 6 6 6"/>',
    filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
    star:'<path d="M12 4l2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    trash:'<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
    edit:'<path d="M4 20h4L20 8l-4-4L4 16z"/>',
    copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5h10"/>',
    eye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',
    box:'<path d="M3 8l9-4 9 4v8l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v8"/>',
    truck:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
    tag:'<path d="M20 12l-8 8-8-8V4h8z"/><circle cx="9" cy="9" r="1.4"/>',
    chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    grid:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    users:'<circle cx="9" cy="8" r="3.2"/><path d="M2.5 19a6.5 6.5 0 0113 0"/><path d="M16 5.5a3.2 3.2 0 010 6M18 19a6 6 0 00-2-4.3"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    tools:'<path d="M14 6a4 4 0 105 5l-9 9-4-4z"/>',
    calendar:'<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    home:'<path d="M4 11l8-6 8 6v9H4z"/><path d="M10 20v-5h4v5"/>',
    percent:'<path d="M6 18L18 6"/><circle cx="7.5" cy="7.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
    wallet:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M16 12.5h3"/>',
    share:'<circle cx="6" cy="12" r="2.2"/><circle cx="17" cy="6" r="2.2"/><circle cx="17" cy="18" r="2.2"/><path d="M8 11l7-4M8 13l7 4"/>',
    refresh:'<path d="M4 12a8 8 0 0113.7-5.7L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 01-13.7 5.7L4 16"/><path d="M4 20v-4h4"/>',
    download:'<path d="M12 4v11M7.5 11.5L12 16l4.5-4.5M4 20h16"/>',
    logout:'<path d="M10 5H5v14h5"/><path d="M15 8l4 4-4 4M19 12H9"/>',
    layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    zap:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    shield:'<path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z"/>',
    rotate:'<path d="M3 12a9 9 0 109-9v4"/><path d="M12 3L8 7l4 4"/>'
  };
  function icon(name, size = 20, cls = '') {
    // the brand mark is drawn on a 48 grid; every other icon on 24
    const box = name === 'logo' ? 48 : 24;
    return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 ${box} ${box}" fill="none"
      stroke="currentColor" stroke-width="${name === 'logo' ? 2.6 : 1.7}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  }

  /* ---------- badges ---------- */
  const tone = s => (M.statusTone && M.statusTone[s]) || 'neutral';
  const badge = (text, t) => `<span class="badge badge-${t || tone(text)}">${esc(text)}</span>`;
  const stars = r => `<span class="rating"><span class="star">★</span>${r}</span>`;

  /* ---------- persisted store (the "super cart") ---------- */
  const KEY = 'keenplaza.proto.v1';
  const defaults = {
    cart: [], wishlist: [], user: null, city: 'Mumbai', pin: '400060',
    recentlyViewed: [], coupon: null, orders: [], bookings: [], notifSeen: false
  };
  let state = (() => {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { return Object.assign({}, defaults); }
  })();
  const listeners = [];
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    listeners.forEach(fn => fn(state));
  }
  const Store = {
    get state() { return state; },
    subscribe(fn) { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); },
    set(patch) { Object.assign(state, patch); save(); },
    reset() { state = JSON.parse(JSON.stringify(defaults)); save(); },

    /* cart holds BOTH products and services */
    addProduct(product, variant, qty = 1) {
      const v = variant || product.variants[0];
      const line = state.cart.find(i => i.kind === 'product' && i.variantId === v.id);
      if (line) line.qty += qty;
      else state.cart.push({
        kind: 'product', id: product.id, variantId: v.id, name: product.name, brand: product.brand,
        emoji: product.emoji, price: v.price, mrp: v.mrp, qty,
        variantLabel: [v.color, v.size].filter(x => x && x !== 'Default' && x !== 'One Size').join(' / ') || 'Standard',
        cat: product.cat, delivery: product.delivery
      });
      save(); return true;
    },
    addService(pkg, meta = {}) {
      if (state.cart.some(i => i.kind === 'service' && i.id === pkg.id)) return false;
      const cat = M.serviceCategories.find(c => c.id === pkg.catId);
      state.cart.push({
        kind: 'service', id: pkg.id, name: pkg.name, brand: cat ? cat.name : 'Service',
        emoji: cat ? cat.icon : '🧰', price: pkg.price, mrp: pkg.mrp, qty: 1,
        duration: pkg.duration, date: meta.date || null, slot: meta.slot || null, notes: meta.notes || ''
      });
      save(); return true;
    },
    updateQty(idx, delta) {
      const line = state.cart[idx]; if (!line) return;
      if (line.kind === 'service') return;
      line.qty = Math.max(1, line.qty + delta); save();
    },
    removeLine(idx) { state.cart.splice(idx, 1); save(); },
    clearCart() { state.cart = []; state.coupon = null; save(); },

    toggleWishlist(id) {
      const i = state.wishlist.indexOf(id);
      i > -1 ? state.wishlist.splice(i, 1) : state.wishlist.push(id);
      save(); return i === -1;
    },
    inWishlist: id => state.wishlist.includes(id),

    viewed(id) {
      state.recentlyViewed = [id, ...state.recentlyViewed.filter(x => x !== id)].slice(0, 8);
      save();
    },

    /* pricing engine — shared by cart, checkout, mobile */
    totals() {
      const items = state.cart;
      const productSub = items.filter(i => i.kind === 'product').reduce((s, i) => s + i.price * i.qty, 0);
      const serviceSub = items.filter(i => i.kind === 'service').reduce((s, i) => s + i.price, 0);
      const subtotal = productSub + serviceSub;
      const mrpTotal = items.reduce((s, i) => s + (i.mrp || i.price) * (i.qty || 1), 0);
      const savings = mrpTotal - subtotal;
      let couponOff = 0, coupon = state.coupon;
      if (coupon) {
        const c = M.coupons.find(x => x.code === coupon);
        if (c) {
          if (c.type === 'Percentage') couponOff = Math.min(subtotal * c.value / 100, c.maxDiscount);
          else if (c.type === 'Flat') couponOff = subtotal >= c.minCart ? c.value : 0;
          else couponOff = 0;
        }
      }
      const freeShip = coupon === 'FREESHIP' || productSub >= 999 || productSub === 0;
      const delivery = freeShip ? 0 : 79;
      const taxable = Math.max(0, subtotal - couponOff);
      const tax = Math.round(taxable * 0.05);
      const total = Math.round(taxable + delivery + tax);
      return { productSub, serviceSub, subtotal, mrpTotal, savings, couponOff: Math.round(couponOff),
               delivery, tax, total, count: items.reduce((s, i) => s + (i.qty || 1), 0),
               hasService: items.some(i => i.kind === 'service'), hasProduct: items.some(i => i.kind === 'product') };
    },

    applyCoupon(code) {
      const c = M.coupons.find(x => x.code.toUpperCase() === String(code).toUpperCase() && x.status === 'Active');
      if (!c) return { ok: false, msg: 'Invalid or expired coupon code' };
      const sub = this.totals().subtotal;
      if (sub < c.minCart) return { ok: false, msg: `Add ${inr(c.minCart - sub)} more to use ${c.code}` };
      state.coupon = c.code; save();
      return { ok: true, msg: `${c.code} applied` };
    },
    removeCoupon() { state.coupon = null; save(); },

    placeOrder(payment, address) {
      const t = this.totals();
      const id = 'BZ' + (100242 + state.orders.length);
      const products = state.cart.filter(i => i.kind === 'product');
      const services = state.cart.filter(i => i.kind === 'service');
      const order = { id, date: new Date().toISOString(), status: 'Placed', total: t.total, payment,
        address, items: products, services, courier: 'Delhivery', awb: 'DL' + Math.floor(Math.random() * 9e9) };
      state.orders.unshift(order);
      services.forEach((s, i) => state.bookings.unshift({
        id: 'SB' + (50020 + state.bookings.length + i), pkgId: s.id, name: s.name, emoji: s.emoji,
        date: s.date || 'Tomorrow', slot: s.slot || '11:00 AM', status: 'Booking Confirmed',
        amount: s.price, address, fromOrder: id, notes: s.notes || ''
      }));
      this.clearCart();
      return order;
    },

    login(name) {
      state.user = { name: name || 'Aarav Sharma', phone: '+91 98200 41122',
                     email: 'aarav.sharma@example.in', city: state.city }; save();
    },
    logout() { state.user = null; save(); }
  };

  /* ---------- toast ---------- */
  function toastRoot() {
    let r = $('.toast-root'); if (!r) { r = el('div', { class: 'toast-root' }); document.body.appendChild(r); }
    return r;
  }
  function toast(msg, type = 'success', ms = 2600) {
    const glyph = { success: '✓', error: '!', info: 'i', warning: '!' }[type] || '✓';
    const t = el('div', { class: 'toast toast-' + type },
      `<span class="ic">${glyph}</span><span>${esc(msg)}</span>`);
    toastRoot().appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 200); }, ms);
  }

  /* ---------- modal ---------- */
  function modal({ title, body, foot, size = '', onOpen }) {
    let root = $('.modal-root');
    if (!root) { root = el('div', { class: 'modal-root' }); document.body.appendChild(root); }
    root.innerHTML = `<div class="modal-backdrop" data-close></div>
      <div class="modal ${size}" role="dialog" aria-modal="true">
        <div class="modal-head"><h4 class="h5">${esc(title)}</h4>
          <button class="icon-btn" data-close aria-label="Close">${icon('close', 20)}</button></div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div>`;
    root.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    $$('[data-close]', root).forEach(b => b.onclick = closeModal);
    document.addEventListener('keydown', escClose);
    if (onOpen) onOpen(root);
    return root;
  }
  function escClose(e) { if (e.key === 'Escape') closeModal(); }
  function closeModal() {
    const r = $('.modal-root'); if (r) { r.classList.remove('is-open'); r.innerHTML = ''; }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', escClose);
  }

  /* ---------- drawer ---------- */
  function drawer({ title, body, foot, side = 'right', wide = false, onOpen }) {
    let root = $('.drawer-root');
    if (!root) { root = el('div', { class: 'drawer-root' }); document.body.appendChild(root); }
    root.innerHTML = `<div class="modal-backdrop" data-dclose></div>
      <div class="drawer ${side === 'left' ? 'drawer-left' : ''} ${wide ? 'drawer-wide' : ''}">
        <div class="drawer-head"><h4 class="h5">${esc(title)}</h4>
          <button class="icon-btn" data-dclose aria-label="Close">${icon('close', 20)}</button></div>
        <div class="drawer-body">${body}</div>
        ${foot ? `<div class="drawer-foot">${foot}</div>` : ''}
      </div>`;
    root.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    $$('[data-dclose]', root).forEach(b => b.onclick = closeDrawer);
    if (onOpen) onOpen(root);
    return root;
  }
  function closeDrawer() {
    const r = $('.drawer-root'); if (r) { r.classList.remove('is-open'); r.innerHTML = ''; }
    document.body.style.overflow = '';
  }

  function confirmDialog(title, message, onYes, yesLabel = 'Confirm') {
    modal({ title, size: 'modal-sm', body: `<p class="muted">${esc(message)}</p>`,
      foot: `<button class="btn btn-outline" data-close>Cancel</button>
             <button class="btn btn-danger" id="cfmYes">${esc(yesLabel)}</button>`,
      onOpen(root) { $('#cfmYes', root).onclick = () => { closeModal(); onYes && onYes(); }; } });
  }

  /* ---------- charts (dependency-free SVG) ---------- */
  const Chart = {
    /** Multi-series area/line chart. series:[{name,color,data:[n]}] */
    line(series, labels, { h = 200, area = true } = {}) {
      const w = 640, pad = { l: 44, r: 12, t: 14, b: 26 };
      const max = Math.max(...series.flatMap(s => s.data)) * 1.15 || 1;
      const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      const x = i => pad.l + (labels.length === 1 ? iw / 2 : i * iw / (labels.length - 1));
      const y = v => pad.t + ih - (v / max) * ih;
      const grid = [0, .25, .5, .75, 1].map(f =>
        `<line class="grid-line" x1="${pad.l}" x2="${w - pad.r}" y1="${pad.t + ih * f}" y2="${pad.t + ih * f}"/>
         <text class="axis-label" x="${pad.l - 8}" y="${pad.t + ih * f + 3}" text-anchor="end">${inrShort(max * (1 - f)).replace('₹', '')}</text>`).join('');
      const paths = series.map((s, si) => {
        const pts = s.data.map((v, i) => `${x(i)},${y(v)}`).join(' L');
        const dots = s.data.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${s.color}"/>`).join('');
        return `${area ? `<path d="M${pts} L${x(s.data.length - 1)},${pad.t + ih} L${pad.l},${pad.t + ih} Z"
          fill="${s.color}" opacity=".10"/>` : ''}
          <path d="M${pts}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}`;
      }).join('');
      const xl = labels.map((l, i) => `<text class="axis-label" x="${x(i)}" y="${h - 6}" text-anchor="middle">${esc(l)}</text>`).join('');
      return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">${grid}${paths}${xl}</svg>`
        + legend(series);
    },
    /** Horizontal ranked bars. rows:[{label,value,color?}] */
    bars(rows, { money = true, h = 22 } = {}) {
      const max = Math.max(...rows.map(r => r.value)) || 1;
      return `<div class="col gap-3">${rows.map(r => `
        <div class="bar-row">
          <div class="row-between tiny"><span class="clamp1">${esc(r.label)}</span>
            <span class="bold">${money ? inrShort(r.value) : num(r.value)}</span></div>
          <div class="progress" style="height:${h / 3}px;margin-top:4px">
            <i style="width:${(r.value / max * 100).toFixed(1)}%;background:${r.color || 'var(--primary)'}"></i></div>
        </div>`).join('')}</div>`;
    },
    /** Vertical columns, optionally stacked 2 series. */
    columns(labels, seriesA, seriesB, colorA = 'var(--primary)', colorB = 'var(--secondary)') {
      const w = 640, h = 200, pad = { l: 36, r: 8, t: 12, b: 24 };
      const totals = labels.map((_, i) => seriesA[i] + (seriesB ? seriesB[i] : 0));
      const max = Math.max(...totals) * 1.15 || 1;
      const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      const bw = Math.min(38, iw / labels.length * .55);
      const bars = labels.map((l, i) => {
        const cx = pad.l + (i + .5) * iw / labels.length;
        const ha = seriesA[i] / max * ih, hb = seriesB ? seriesB[i] / max * ih : 0;
        return `<rect class="bar" x="${cx - bw / 2}" y="${pad.t + ih - ha - hb}" width="${bw}" height="${hb}" fill="${colorB}" rx="3"/>
                <rect class="bar" x="${cx - bw / 2}" y="${pad.t + ih - ha}" width="${bw}" height="${ha}" fill="${colorA}" rx="3"/>
                <text class="axis-label" x="${cx}" y="${h - 6}" text-anchor="middle">${esc(l)}</text>`;
      }).join('');
      const grid = [0, .5, 1].map(f => `<line class="grid-line" x1="${pad.l}" x2="${w - pad.r}"
        y1="${pad.t + ih * f}" y2="${pad.t + ih * f}"/>`).join('');
      return `<svg class="chart" viewBox="0 0 ${w} ${h}" style="height:${h}px">${grid}${bars}</svg>`;
    },
    /** Donut with centre label. rows:[{label,value,color}] */
    donut(rows, centerTop, centerSub) {
      const total = rows.reduce((s, r) => s + r.value, 0) || 1;
      const R = 70, C = 2 * Math.PI * R; let off = 0;
      const arcs = rows.map(r => {
        const len = r.value / total * C;
        const seg = `<circle r="${R}" cx="100" cy="100" fill="none" stroke="${r.color}" stroke-width="26"
          stroke-dasharray="${len - 2} ${C - len + 2}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"/>`;
        off += len; return seg;
      }).join('');
      return `<div class="row gap-5 wrap"><svg viewBox="0 0 200 200" style="width:170px;flex:none">${arcs}
        <text x="100" y="96" text-anchor="middle" font-size="20" font-weight="800" fill="var(--text)">${esc(centerTop)}</text>
        <text x="100" y="118" text-anchor="middle" font-size="11" fill="var(--text-muted)">${esc(centerSub)}</text></svg>
        <div class="col gap-2 grow">${rows.map(r => `<div class="row-between tiny">
          <span><i style="width:10px;height:10px;border-radius:3px;background:${r.color};display:inline-block;margin-right:8px"></i>${esc(r.label)}</span>
          <span class="bold">${inrShort(r.value)}</span></div>`).join('')}</div></div>`;
    },
    /** Sparkline for KPI cards. */
    spark(data, color = 'var(--primary)') {
      const w = 120, h = 34, max = Math.max(...data), min = Math.min(...data);
      const pts = data.map((v, i) => `${i * w / (data.length - 1)},${h - ((v - min) / ((max - min) || 1)) * (h - 6) - 3}`).join(' L');
      return `<svg class="spark" viewBox="0 0 ${w} ${h}" style="width:${w}px;height:${h}px">
        <path d="M${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`;
    },
    funnel(rows) {
      const max = rows[0].value;
      return `<div class="col gap-2">${rows.map((r, i) => `
        <div class="funnel-row">
          <div class="row-between tiny"><span>${esc(r.label)}</span>
            <span class="muted">${num(r.value)} · ${(r.value / max * 100).toFixed(1)}%</span></div>
          <div class="funnel-bar" style="width:${(r.value / max * 100).toFixed(1)}%;
            background:linear-gradient(90deg,var(--primary),var(--primary-400));opacity:${1 - i * .12}"></div>
        </div>`).join('')}</div>`;
    }
  };
  function legend(series) {
    return `<div class="legend mt-2">${series.map(s =>
      `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  }

  /* ---------- generic admin table renderer ---------- */
  /** cols: [{key,label,render?(row),width?,align?}]  rows: []  opts:{empty,rowClick} */
  function table(cols, rows, opts = {}) {
    if (!rows.length) return `<div class="table-empty">${esc(opts.empty || 'Nothing here yet')}</div>`;
    return `<div class="table-wrap"><table class="table">
      <thead><tr>${cols.map(c => `<th${c.width ? ` style="width:${c.width}"` : ''}${c.align ? ` class="${c.align}"` : ''}>${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr data-idx="${i}"${opts.rowAttr ? ' ' + opts.rowAttr(r) : ''}>
        ${cols.map(c => `<td${c.align ? ` class="${c.align}"` : ''}>${c.render ? c.render(r, i) : esc(r[c.key])}</td>`).join('')}
      </tr>`).join('')}</tbody></table></div>`;
  }

  /* ---------- prototype switcher (client presentation mode) ---------- */
  function protoBar(active) {
    const links = [['index.html', 'Customer Website'], ['mobile.html', 'Mobile App'],
                   ['admin.html', 'Admin Dashboard'], ['services.html', 'Service Marketplace'],
                   ['superadmin.html', 'Super Admin Portal'], ['dev.html', 'Dev / Architecture']];
    const bar = el('nav', { class: 'proto-bar' },
      `<span class="live"><span>Interactive Prototype</span></span>` +
      links.map(([h, l]) => `<a href="${h}" class="${h === active ? 'is-active' : ''}">${l}</a>`).join('') +
      `<button class="mini" id="protoReset" title="Reset demo data">${icon('refresh', 16)}</button>`);
    document.body.appendChild(bar);
    $('#protoReset').onclick = () => confirmDialog('Reset prototype?',
      'Clears cart, wishlist, demo orders and bookings, then reloads this screen.',
      () => { Store.reset(); location.reload(); }, 'Reset');
  }

  /* ---------- lookups shared everywhere ---------- */
  const byId = (list, id) => list.find(x => x.id === id);
  const productById = id => byId(M.products, id);
  const pkgById = id => byId(M.servicePackages, id);
  const svcCatById = id => byId(M.serviceCategories, id);
  const customerById = id => byId(M.customers, id);
  const proById = id => byId(M.professionals, id);

  /** Universal search across products, services, categories, brands. */
  function universalSearch(q) {
    const s = String(q || '').trim().toLowerCase();
    if (!s) return { products: [], services: [], categories: [], brands: [] };
    const hit = t => String(t).toLowerCase().includes(s);
    return {
      products: M.products.filter(p => hit(p.name) || hit(p.brand) || hit(p.catName)).slice(0, 6),
      services: M.servicePackages.filter(p => hit(p.name) || hit((svcCatById(p.catId) || {}).name)).slice(0, 5),
      categories: M.flatCategories.filter(c => hit(c.name)).slice(0, 4),
      brands: M.brands.filter(b => hit(b.name)).slice(0, 4)
    };
  }

  /** Service recommended for a product (cross-sell engine). */
  function crossSellFor(product) {
    const rule = M.crossSell[product.cat] || (product.installService
      ? { pkg: M.servicePackages.find(p => p.catId === product.installService && /Install/.test(p.name)).id, pitch: 'Add Installation' }
      : null);
    if (!rule) return null;
    const pkg = pkgById(rule.pkg);
    return pkg ? { pkg, pitch: rule.pitch } : null;
  }

  /** Next 7 bookable dates. */
  function nextDates(n = 7) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const d = new Date('2026-08-09T09:00:00'); d.setDate(d.getDate() + i);
      out.push({ iso: d.toISOString().slice(0, 10),
        day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        num: d.getDate(), mon: d.toLocaleDateString('en-IN', { month: 'short' }),
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : null });
    }
    return out;
  }

  /* ---------- countdown for flash deals ---------- */
  function startCountdown(node, endsInMs) {
    let left = endsInMs;
    const tick = () => {
      left -= 1000; if (left < 0) left = 0;
      const h = String(Math.floor(left / 3600000)).padStart(2, '0');
      const m = String(Math.floor(left % 3600000 / 60000)).padStart(2, '0');
      const s = String(Math.floor(left % 60000 / 1000)).padStart(2, '0');
      if (!document.body.contains(node)) return clearInterval(id);
      node.innerHTML = `<b>${h}</b>:<b>${m}</b>:<b>${s}</b>`;
    };
    const id = setInterval(tick, 1000); tick();
  }

  global.UI = { $, $$, el, esc, cssVar, inr, inrShort, num, dateFmt, dateShort, timeAgo, initials,
    ph, productImg, bannerImg, icon, badge, stars, tone, toast, modal, closeModal, drawer, closeDrawer,
    confirmDialog, Chart, table, protoBar, Store, byId, productById, pkgById, svcCatById, customerById,
    proById, universalSearch, crossSellFor, nextDates, startCountdown };
})(window);
