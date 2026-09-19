/* ============================================================
   KEENPLAZA — mobile.js
   Mobile app prototype: 22 screens inside a 390×844 device frame.
   Screens share the same mock data and cart store as the web app.
   ============================================================ */
(function (global) {
  'use strict';
  const M = global.MOCK, U = global.UI;
  const { $, $$, esc, inr, num, icon, badge, stars, ph, productImg, Store, toast, pkgById, svcCatById,
          productById, nextDates, dateFmt } = U;

  /* ---------- screen registry ---------- */
  const S = {};
  const screen = (key, def) => S[key] = def;
  let currentKey = 'splash';
  const stateM = { tab: 'home', cat: 'c-electronics', pid: 'p6', pkg: 'pk-ac-basic', date: null, slot: null, step: 1 };

  const GROUPS = [
    ['Onboarding', ['splash', 'onboarding', 'login', 'otp', 'register']],
    ['Shopping', ['home', 'search', 'categories', 'plp', 'pdp', 'wishlist']],
    ['Checkout', ['cart', 'checkout', 'orderSuccess']],
    ['Orders', ['orders', 'tracking', 'notifications', 'profile']],
    ['Services', ['services', 'serviceDetail', 'slots', 'bookingConfirm', 'bookingTrack']]
  ];
  const LABELS = {
    splash: 'Splash', onboarding: 'Onboarding', login: 'Login', otp: 'OTP verification', register: 'Registration',
    home: 'Home', search: 'Search', categories: 'Categories', plp: 'Product list', pdp: 'Product details',
    wishlist: 'Wishlist', cart: 'Cart (products + services)', checkout: 'Checkout', orderSuccess: 'Order placed',
    orders: 'My orders', tracking: 'Order tracking', notifications: 'Notifications', profile: 'Profile',
    services: 'Services home', serviceDetail: 'Service details', slots: 'Date & time slot',
    bookingConfirm: 'Booking confirmed', bookingTrack: 'Booking tracking'
  };
  const CAPTIONS = {
    splash: 'Branded cold-start screen while the session and city are resolved.',
    onboarding: 'Three-slide value pitch — the third slide introduces services.',
    login: 'Mobile-first login with OTP as the default and social sign-in fallbacks.',
    otp: 'Six-digit OTP with auto-advance and resend timer.',
    register: 'Registration with terms acceptance before OTP verification.',
    home: 'Location-aware home: categories, flash deals, trending and a service band.',
    search: 'Universal search returning products and services together.',
    categories: 'Full category tree with sub-category drill-down.',
    plp: 'Listing with sort, filter chips and quick add.',
    pdp: 'Product page with variants, delivery check and the service cross-sell.',
    wishlist: 'Saved products with move-to-cart.',
    cart: 'Super cart — products and services separated but checked out together.',
    checkout: 'Address, delivery, service slot and payment in one scrollable flow.',
    orderSuccess: 'Confirmation showing both the delivery and the service appointment.',
    orders: 'Order history with one-tap reorder.',
    tracking: 'Unified timeline: delivery milestones plus the linked service visit.',
    notifications: 'Order, service and marketing notifications in one inbox.',
    profile: 'Account hub — orders, bookings, wallet, coupons and support.',
    services: 'Service marketplace home with categories and most-booked packages.',
    serviceDetail: 'Package detail with inclusions, exclusions and reviews.',
    slots: 'Date strip and time-slot grid with unavailable slots blocked.',
    bookingConfirm: 'Booking confirmation with the assigned-professional promise.',
    bookingTrack: 'Live booking progress from assignment to rating.'
  };

  const go = k => { currentKey = k; if (location.hash.slice(2) !== k) location.hash = '#/' + k; paint(); };
  global.mgo = go;

  /* ---------- chrome helpers ---------- */
  const statusbar = () => `<div class="statusbar"><span>9:41</span>
    <span class="row gap-1">📶 &nbsp;🔋</span></div>`;
  const top = (title, back, right) => `<div class="app-top">
    ${back ? `<button class="icon-btn" style="width:32px;height:32px" onclick="mgo('${back}')">${icon('back', 18)}</button>` : ''}
    <span class="t">${esc(title)}</span>${right || ''}</div>`;
  const tabbar = () => {
    const t = Store.totals();
    const tabs = [['home', 'Home', 'home'], ['categories', 'Categories', 'grid'], ['services', 'Services', 'tools'],
      ['cart', 'Cart', 'cart'], ['profile', 'Account', 'user']];
    return `<div class="tabbar">${tabs.map(([k, l, ic]) => `
      <button onclick="mgo('${k}')" class="${currentKey === k ? 'is-active' : ''}">${icon(ic, 21)}
        ${k === 'cart' && t.count ? `<span class="dot">${t.count}</span>` : ''}<span>${l}</span></button>`).join('')}</div>`;
  };
  const pcard = p => `<div class="m-pcard" onclick="mgo('pdp')">
    <img src="${productImg(p)}" alt=""><div class="b"><div class="nm">${esc(p.name)}</div>
    <div class="pr">${inr(p.price)} <span class="tiny strike">${inr(p.mrp)}</span></div>
    <div class="tiny" style="color:var(--success);font-weight:700">${p.discount}% off</div></div></div>`;

  /* ============ SCREENS ============ */
  screen('splash', () => `${statusbar()}
    <div class="m-splash"><span class="mark">${icon('logo', 44)}</span>
      <b style="font-size:26px;letter-spacing:-.02em">KeenPlaza</b>
      <span style="opacity:.75;font-size:13px">Products Today. Services Tomorrow.</span>
      <div class="mt-6" style="width:120px"><div class="progress" style="background:rgba(255,255,255,.2)">
        <i style="width:70%;background:#fff"></i></div></div></div>`);

  screen('onboarding', () => `${statusbar()}
    <div class="m-onboard"><div class="art">🧰</div>
      <b style="font-size:22px;letter-spacing:-.02em">Buy it. Book it. Done.</b>
      <p class="muted small">Shop 12,000+ products and book verified professionals for installation,
        repair and cleaning — from one app.</p>
      <div class="m-dots mt-4"><i></i><i></i><i class="on"></i></div></div>
    <div class="m-cta"><button class="btn btn-outline grow" onclick="mgo('home')">Skip</button>
      <button class="btn btn-primary grow" onclick="mgo('login')">Get started</button></div>`);

  screen('login', () => `${statusbar()}${top('Login', 'onboarding')}
    <div class="app-body app-pad">
      <h3 class="h4 mt-2">Welcome back 👋</h3>
      <p class="small muted mt-1">Login with your mobile number</p>
      <div class="field mt-5"><label class="label">Mobile number</label>
        <div class="row gap-2"><span class="input" style="width:58px;display:grid;place-items:center">+91</span>
          <input class="input" value="98200 41122"></div></div>
      <button class="btn btn-primary btn-lg btn-block mt-4" onclick="mgo('otp')">Send OTP</button>
      <div class="row gap-3 mt-5" style="align-items:center"><hr class="grow" style="border:none;border-top:1px solid var(--border)">
        <span class="tiny soft">OR</span><hr class="grow" style="border:none;border-top:1px solid var(--border)"></div>
      <div class="col gap-2 mt-4">
        <button class="btn btn-outline btn-block">🔵 Continue with Google</button>
        <button class="btn btn-outline btn-block">⚫ Continue with Apple</button></div>
      <p class="tiny muted center mt-5">New here?
        <b style="color:var(--primary)" onclick="mgo('register')">Create an account</b></p></div>`);

  screen('otp', () => `${statusbar()}${top('Verify OTP', 'login')}
    <div class="app-body app-pad">
      <p class="small muted mt-2">Enter the 6-digit code sent to <b>+91 98200 41122</b></p>
      <div class="m-otp mt-5">${[1, 2, 3, 4, 5, 6].map(n => `<input value="${n}" maxlength="1">`).join('')}</div>
      <button class="btn btn-primary btn-lg btn-block mt-5" onclick="mgo('home')">Verify &amp; continue</button>
      <p class="tiny muted center mt-4">Resend code in <b>00:24</b></p>
      <div class="m-banner mt-6" style="margin:24px 0 0"><b class="small">🔒 Why we verify</b>
        <p class="tiny muted mt-1">A verified number keeps your orders, service visits and refunds secure.</p></div></div>`);

  screen('register', () => `${statusbar()}${top('Create account', 'login')}
    <div class="app-body app-pad">
      <div class="col gap-3 mt-3">
        <div class="field"><label class="label">Full name</label><input class="input" placeholder="Aarav Sharma"></div>
        <div class="field"><label class="label">Mobile</label><input class="input" placeholder="98200 41122"></div>
        <div class="field"><label class="label">Email</label><input class="input" placeholder="you@example.in"></div>
        <div class="field"><label class="label">Password</label><input class="input" type="password" placeholder="8+ characters"></div>
        <label class="check"><input type="checkbox" checked> I agree to the Terms &amp; Privacy Policy</label>
      </div>
      <button class="btn btn-primary btn-lg btn-block mt-5" onclick="mgo('otp')">Continue</button></div>`);

  screen('home', () => {
    const flash = M.products.filter(p => p.tags.includes('flash')).slice(0, 4);
    const trend = M.products.filter(p => p.tags.includes('trending')).slice(0, 4);
    return `${statusbar()}
      <div class="app-top"><div class="col grow">
        <span class="tiny muted">${icon('pin', 12)} Deliver to</span>
        <b class="small">${esc(Store.state.city)} ${esc(Store.state.pin)}</b></div>
        <button class="icon-btn" style="width:34px;height:34px" onclick="mgo('notifications')">${icon('bell', 19)}<span class="dot">3</span></button>
        <button class="icon-btn" style="width:34px;height:34px" onclick="mgo('wishlist')">${icon('heart', 19)}</button></div>
      <div class="app-search" onclick="mgo('search')">${icon('search', 16)} Search products and services</div>
      <div class="app-body">
        <div class="m-hero"><span class="tiny" style="opacity:.75;font-weight:700;letter-spacing:.1em">SUPER APP</span>
          <h3 class="mt-1">Everything You Need.<br>Products Today.<br>Services Tomorrow.</h3>
          <div class="row gap-2 mt-3"><button class="btn btn-sm btn-accent" onclick="mgo('plp')">Shop now</button>
            <button class="btn btn-sm btn-outline" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4)"
              onclick="mgo('services')">Book a service</button></div></div>

        <div class="app-sec"><div class="m-cat-row">${M.categories.slice(0, 8).map(c => `
          <button class="m-cat" onclick="mgo('plp')"><span class="em">${c.icon}</span>${esc(c.name.split(' ')[0])}</button>`).join('')}</div></div>

        <div class="app-sec"><div class="app-sec-head"><b>⚡ Flash deals</b>
          <span class="tiny bold" style="color:var(--accent)">05:42:19 left</span></div>
          <div class="m-scroll">${flash.map(pcard).join('')}</div></div>

        <div class="app-sec"><div class="m-banner" onclick="mgo('services')">
          <div class="row gap-3"><span style="font-size:26px">🧰</span>
            <div class="col grow"><b class="small">Need help at home?</b>
              <span class="tiny muted">AC service from ₹499 · book in 60 seconds</span></div>${icon('chevron', 16)}</div>
          <div class="row gap-2 mt-3" style="overflow-x:auto">${M.serviceCategories.slice(0, 5).map(c =>
            `<span class="chip" style="background:var(--surface)">${c.icon} ${esc(c.name.split(' ')[0])}</span>`).join('')}</div></div></div>

        <div class="app-sec"><div class="app-sec-head"><b>Trending now</b><a onclick="mgo('plp')">See all</a></div>
          <div class="m-scroll">${trend.map(pcard).join('')}</div></div>

        <div class="app-sec"><div class="app-sec-head"><b>Recommended for you</b><a onclick="mgo('plp')">See all</a></div>
          <div class="m-grid">${M.products.filter(p => p.tags.includes('recommended')).slice(0, 4).map(p => `
            <div class="m-pcard" style="width:auto" onclick="mgo('pdp')"><img src="${productImg(p)}">
              <div class="b"><div class="nm">${esc(p.name)}</div><div class="pr">${inr(p.price)}</div></div></div>`).join('')}</div></div>
        <div style="height:20px"></div>
      </div>${tabbar()}`;
  });

  screen('search', () => `${statusbar()}
    <div class="app-top"><button class="icon-btn" style="width:32px;height:32px" onclick="mgo('home')">${icon('back', 18)}</button>
      <div class="app-search" style="margin:0;flex:1">${icon('search', 16)} <b style="color:var(--text)">AC</b></div></div>
    <div class="app-body">
      <div class="app-pad"><span class="tiny muted">Showing products and services for “AC”</span></div>
      <div class="app-sec"><div class="app-sec-head"><b>🧰 Services</b><a onclick="mgo('services')">All</a></div>
        <div class="app-pad col gap-2">${M.servicePackages.filter(p => p.catId === 'sv-ac').slice(0, 3).map(p => `
          <button class="m-svc" onclick="mgo('serviceDetail')"><span class="em" style="background:#22D3EE22">❄️</span>
            <span class="col grow" style="text-align:left"><b class="small">${esc(p.name)}</b>
              <span class="tiny muted">${inr(p.price)} · ${esc(p.duration)} · ${p.rating}★</span></span>
            ${icon('chevron', 15)}</button>`).join('')}</div></div>
      <div class="app-sec"><div class="app-sec-head"><b>🛍️ Products</b><a onclick="mgo('plp')">All</a></div>
        ${M.products.filter(p => /AC|TV/.test(p.name)).map(p => `
          <div class="m-list-item" onclick="mgo('pdp')"><img src="${productImg(p)}">
            <div class="col grow"><b class="small">${esc(p.name)}</b>
              <span class="tiny muted">${esc(p.brand)} · ${p.rating}★</span>
              <b class="small mt-1">${inr(p.price)} <span class="tiny strike">${inr(p.mrp)}</span></b></div></div>`).join('')}</div>
      <div class="app-sec app-pad"><b class="small">Trending searches</b>
        <div class="row gap-2 mt-2 wrap">${['AC installation', 'running shoes', 'deep cleaning', 'smart TV', 'salon at home']
          .map(t => `<span class="chip">${t}</span>`).join('')}</div></div>
    </div>${tabbar()}`);

  screen('categories', () => `${statusbar()}${top('Categories')}
    <div class="app-body">
      ${M.categories.map(c => `<div class="m-list-item" onclick="mgo('plp')">
        <span style="width:64px;height:64px;border-radius:14px;background:var(--primary-50);display:grid;place-items:center;font-size:26px">${c.icon}</span>
        <div class="col grow"><b class="small">${esc(c.name)}</b>
          <span class="tiny muted">${(c.children || []).map(x => x.name).join(' · ') || 'Browse all'}</span></div>
        ${icon('chevron', 16)}</div>`).join('')}
      <div class="app-sec app-pad"><div class="m-banner" onclick="mgo('services')">
        <b class="small">🧰 Home services</b>
        <p class="tiny muted mt-1">Salon, cleaning, AC, electrician, plumbing and more.</p></div></div>
    </div>${tabbar()}`);

  screen('plp', () => `${statusbar()}${top('Electronics', 'categories',
    `<button class="icon-btn" style="width:32px;height:32px" onclick="mgo('search')">${icon('search', 18)}</button>`)}
    <div class="m-chip-row"><span class="chip is-active">${icon('filter', 13)} Filters</span>
      ${['Sort', 'Under ₹5,000', '4★ &amp; above', 'Express', 'In stock'].map(t => `<span class="chip">${t}</span>`).join('')}</div>
    <div class="app-body">
      <div class="app-pad tiny muted mb-2">${M.products.length} products · delivering to ${esc(Store.state.city)}</div>
      <div class="m-grid">${M.products.map(p => `
        <div class="m-pcard" style="width:auto" onclick="mgo('pdp')"><div style="position:relative">
          <img src="${productImg(p)}"><span class="p-disc">${p.discount}%</span>
          <button class="p-wish" onclick="event.stopPropagation()">${icon('heart', 15)}</button></div>
          <div class="b"><div class="nm">${esc(p.name)}</div>
            <div class="pr">${inr(p.price)} <span class="tiny strike">${inr(p.mrp)}</span></div>
            <div class="tiny muted mt-1">${p.rating}★ · ${esc(p.delivery)}</div></div></div>`).join('')}</div>
      <div style="height:20px"></div></div>${tabbar()}`);

  screen('pdp', () => {
    const p = productById(stateM.pid);
    const cross = U.crossSellFor(p);
    return `${statusbar()}${top('', 'plp',
      `<button class="icon-btn" style="width:32px;height:32px">${icon('share', 18)}</button>
       <button class="icon-btn" style="width:32px;height:32px">${icon('heart', 18)}</button>
       <button class="icon-btn" style="width:32px;height:32px" onclick="mgo('cart')">${icon('cart', 18)}</button>`)}
    <div class="app-body">
      <img src="${productImg(p)}" style="width:100%;aspect-ratio:1/1;object-fit:cover">
      <div class="app-pad mt-3">
        <span class="tiny bold" style="color:var(--primary)">${esc(p.brand)}</span>
        <h3 style="font-size:17px;font-weight:700;line-height:1.3;margin-top:4px">${esc(p.name)}</h3>
        <div class="row gap-2 mt-2"><span class="rating-pill">${p.rating} ★</span>
          <span class="tiny muted">${num(p.reviews)} ratings</span></div>
        <div class="row gap-2 mt-3" style="align-items:baseline"><b style="font-size:24px">${inr(p.price)}</b>
          <span class="strike small">${inr(p.mrp)}</span><span class="pct">${p.discount}% off</span></div>
        <p class="tiny muted mt-1">Inclusive of all taxes</p>

        <div class="mt-4"><b class="small">Capacity</b>
          <div class="size-grid mt-2">${p.sizes.map((s, i) => `<button class="size-box ${i === 1 ? 'on' : ''}">${esc(s)}</button>`).join('')}</div></div>

        <div class="tile mt-4"><div class="row gap-2">${icon('truck', 15)}
          <span class="col"><b class="tiny">Delivery by ${esc(p.delivery)}</b>
            <span class="tiny muted">to ${esc(Store.state.pin)} · free above ₹999</span></span></div></div>

        ${cross ? `<div class="bundle mt-4"><span class="flag">⚡ Frequently bought together</span>
          <div class="row-between gap-2 mt-2"><div class="row gap-2">
            <span style="font-size:22px">${svcCatById(cross.pkg.catId).icon}</span>
            <span class="col"><b class="tiny">${esc(cross.pitch)} — ${inr(cross.pkg.price)}</b>
              <span class="tiny muted">${esc(cross.pkg.duration)} · scheduled after delivery</span></span></div>
            <button class="btn btn-sm" style="background:var(--secondary);color:#fff"
              onclick="MOB.addService('${cross.pkg.id}')">Add</button></div></div>` : ''}

        <div class="mt-4"><b class="small">Offers</b>
          <div class="offer-item mt-2"><span class="em">🏷️</span>
            <span class="col"><b class="tiny">₹500 off with SAVE500</b>
              <span class="tiny muted">On cart above ₹2,999</span></span></div></div>

        <div class="mt-4"><b class="small">Product details</b>
          <p class="tiny muted mt-1">${esc(p.desc)}</p>
          <table class="spec-table mt-2">${Object.entries(p.specs).slice(0, 4).map(([k, v]) =>
            `<tr><td class="tiny">${esc(k)}</td><td class="tiny bold">${esc(v)}</td></tr>`).join('')}</table></div>

        <div class="mt-4"><b class="small">Ratings &amp; reviews</b>
          <div class="tile mt-2"><div class="row gap-2"><span class="rating-pill">5 ★</span>
            <b class="tiny">Cooling is fast</b></div>
            <p class="tiny muted mt-1">Room cools in under 6 minutes. Installation was booked with the AC itself.</p>
            <p class="tiny soft mt-1">Rahul Verma · verified purchase</p></div></div>
      </div><div style="height:16px"></div></div>
    <div class="m-cta"><button class="btn btn-outline grow" onclick="MOB.addProduct('${p.id}')">Add to cart</button>
      <button class="btn btn-accent grow" onclick="MOB.buyNow('${p.id}')">Buy now</button></div>`;
  });

  screen('wishlist', () => {
    const items = Store.state.wishlist.map(productById).filter(Boolean);
    const list = items.length ? items : M.products.slice(0, 3);
    return `${statusbar()}${top('Wishlist', 'home')}
      <div class="app-body">${list.map(p => `<div class="m-list-item">
        <img src="${productImg(p)}"><div class="col grow"><b class="small">${esc(p.name)}</b>
          <span class="tiny muted">${esc(p.brand)}</span>
          <b class="small mt-1">${inr(p.price)} <span class="tiny strike">${inr(p.mrp)}</span></b>
          <button class="btn btn-outline btn-sm mt-2" onclick="MOB.addProduct('${p.id}')">Move to cart</button></div>
        <button class="icon-btn" style="width:30px;height:30px;color:var(--error)">${icon('heart', 17)}</button></div>`).join('')}
      </div>${tabbar()}`;
  });

  screen('cart', () => {
    const items = Store.state.cart, t = Store.totals();
    if (!items.length) return `${statusbar()}${top('Cart')}
      <div class="app-body"><div class="empty" style="margin-top:60px"><span class="ic">🛒</span>
        <b>Your cart is empty</b><p class="tiny muted">Add products or services to get started.</p>
        <button class="btn btn-primary btn-sm" onclick="mgo('home')">Start shopping</button></div></div>${tabbar()}`;
    const prods = items.filter(i => i.kind === 'product'), svcs = items.filter(i => i.kind === 'service');
    const row = i => `<div class="m-list-item"><img src="${ph(i.id, i.emoji, '')}">
      <div class="col grow"><b class="small">${esc(i.name)}</b>
        <span class="tiny muted">${i.kind === 'product' ? esc(i.variantLabel) : esc(i.duration)}</span>
        <div class="row-between mt-2"><b class="small">${inr(i.price * (i.qty || 1))}</b>
          ${i.kind === 'product' ? `<span class="qty" style="height:28px">
            <button onclick="MOB.qty(${items.indexOf(i)},-1)">−</button><span>${i.qty}</span>
            <button onclick="MOB.qty(${items.indexOf(i)},1)">+</button></span>`
            : '<span class="tag">Slot at checkout</span>'}</div></div></div>`;
    return `${statusbar()}${top('Cart · ' + t.count + ' items')}
      <div class="app-body">
        ${prods.length ? `<div class="app-pad tiny bold mt-2" style="color:var(--text-muted)">📦 PRODUCTS — delivered</div>
          ${prods.map(row).join('')}` : ''}
        ${svcs.length ? `<div class="app-pad tiny bold mt-3" style="color:var(--secondary-600)">🧰 SERVICES — scheduled visit</div>
          ${svcs.map(row).join('')}` : ''}
        <div class="app-pad mt-4"><div class="row gap-2">
          <input class="input" placeholder="Coupon code" value="${esc(Store.state.coupon || '')}">
          <button class="btn btn-secondary" onclick="MOB.coupon()">Apply</button></div></div>
        <div class="app-pad mt-4"><div class="tile">
          <div class="sum-row"><span class="muted tiny">Subtotal</span><span class="tiny">${inr(t.subtotal)}</span></div>
          <div class="sum-row"><span class="muted tiny">Discount</span><span class="tiny" style="color:var(--success)">− ${inr(t.savings + t.couponOff)}</span></div>
          <div class="sum-row"><span class="muted tiny">Delivery</span><span class="tiny">${t.delivery ? inr(t.delivery) : 'FREE'}</span></div>
          <div class="sum-row"><span class="muted tiny">Tax</span><span class="tiny">${inr(t.tax)}</span></div>
          <div class="sum-row total"><span>Total</span><span>${inr(t.total)}</span></div></div></div>
        <div style="height:16px"></div></div>
      <div class="m-cta"><div class="col"><span class="tiny muted">Total</span><b>${inr(t.total)}</b></div>
        <button class="btn btn-primary grow" onclick="mgo('checkout')">Checkout</button></div>`;
  });

  screen('checkout', () => {
    const t = Store.totals();
    return `${statusbar()}${top('Checkout', 'cart')}
      <div class="m-step"><span class="on">● Address</span><span>—</span><span class="on">● Delivery</span>
        <span>—</span><span>○ Payment</span></div>
      <div class="app-body app-pad">
        <b class="small mt-3" style="display:block">Delivery address</b>
        ${M.addresses.slice(0, 2).map((a, i) => `<div class="addr-card mt-2 ${i === 0 ? 'on' : ''}">
          <div class="row-between"><b class="small">${esc(a.label)}</b>${i === 0 ? '<span class="badge badge-primary badge-plain">Selected</span>' : ''}</div>
          <p class="tiny muted mt-1">${esc(a.line)}, ${esc(a.area)}, ${esc(a.city)} — ${esc(a.pin)}</p></div>`).join('')}

        <b class="small mt-4" style="display:block">Delivery option</b>
        <div class="deliv-opt on mt-2"><span class="col"><b class="tiny">Standard delivery</b>
          <span class="tiny muted">Arrives in 2–3 days</span></span><b class="tiny" style="color:var(--success)">FREE</b></div>
        <div class="deliv-opt mt-2"><span class="col"><b class="tiny">Express delivery</b>
          <span class="tiny muted">Tomorrow before 9 PM</span></span><b class="tiny">₹99</b></div>

        ${t.hasService ? `<b class="small mt-4" style="display:block">🧰 Service appointment</b>
          <div class="date-strip mt-2">${nextDates(5).map((d, i) => `<div class="date-box ${i === 1 ? 'on' : ''}">
            <div class="d">${d.label || d.day}</div><div class="n">${d.num}</div><div class="d">${d.mon}</div></div>`).join('')}</div>
          <div class="m-slot mt-3">${M.timeSlots.slice(0, 6).map((s, i) => `
            <div class="slot ${i === 1 ? 'on' : ''} ${i === 2 ? 'full' : ''}" style="padding:8px;font-size:11px">${s}</div>`).join('')}</div>` : ''}

        <b class="small mt-4" style="display:block">Payment method</b>
        ${[['🟣', 'UPI', 'GPay · PhonePe · Paytm', true], ['💳', 'Card', 'Visa · Mastercard · RuPay', false],
          ['👛', 'Wallet', 'Balance ₹1,250', false], ['💵', 'Cash on delivery', t.hasService ? 'Not available with services' : 'Pay on arrival', false]]
          .map(([e, l, d, on]) => `<div class="pay-opt mt-2 ${on ? 'on' : ''}"><span class="em">${e}</span>
            <span class="col grow"><b class="tiny">${l}</b><span class="tiny muted">${d}</span></span></div>`).join('')}
        <div style="height:16px"></div></div>
      <div class="m-cta"><div class="col"><span class="tiny muted">Payable</span><b>${inr(t.total)}</b></div>
        <button class="btn btn-accent grow" onclick="MOB.pay()">Pay now</button></div>`;
  });

  screen('orderSuccess', () => `${statusbar()}
    <div class="app-body"><div class="success-hero" style="padding:48px 24px">
      <div class="tick">✓</div><h3 class="h4">Order placed!</h3>
      <p class="tiny muted mt-2">Order BZ100242 · ${inr(Store.totals().total || 44498)}</p></div>
      <div class="app-pad col gap-3">
        <div class="tile"><b class="small">📦 Delivery</b>
          <p class="tiny muted mt-1">Arriving in 2 days via Delhivery. Track live from Orders.</p></div>
        <div class="tile" style="border-color:var(--secondary)"><b class="small">🧰 Service appointment</b>
          <p class="tiny muted mt-1">AC Installation · Tomorrow, 11:00 AM. Professional assigned 2 hours before.</p></div>
        <button class="btn btn-primary btn-block" onclick="mgo('tracking')">Track order</button>
        <button class="btn btn-outline btn-block" onclick="mgo('home')">Continue shopping</button></div></div>`);

  screen('orders', () => `${statusbar()}${top('My orders')}
    <div class="m-chip-row">${['All', 'Active', 'Delivered', 'Cancelled'].map((f, i) =>
      `<span class="chip ${i === 0 ? 'is-active' : ''}">${f}</span>`).join('')}</div>
    <div class="app-body">${M.orders.slice(0, 5).map(o => `
      <div class="m-list-item" onclick="mgo('tracking')">
        <img src="${ph(o.id, '📦', '')}">
        <div class="col grow"><div class="row-between"><b class="small">${esc(o.id)}</b>${badge(o.status)}</div>
          <span class="tiny muted mt-1">${o.items.length} item${o.items.length > 1 ? 's' : ''} · ${dateFmt(o.date)}</span>
          <b class="small mt-1">${inr(o.total)}</b>
          ${o.hasService ? '<span class="badge badge-primary badge-plain mt-1">Includes service</span>' : ''}
          <button class="btn btn-outline btn-sm mt-2" onclick="event.stopPropagation()">🔁 Reorder</button></div></div>`).join('')}
    </div>${tabbar()}`);

  screen('tracking', () => `${statusbar()}${top('Track order', 'orders')}
    <div class="app-body app-pad">
      <div class="tile mt-2"><div class="row-between"><b class="small">BZ100241</b>${badge('Out for Delivery')}</div>
        <p class="tiny muted mt-1">Delhivery · AWB DL2914772819 · arriving today by 7 PM</p></div>
      <b class="small mt-4" style="display:block">Delivery timeline</b>
      <div class="timeline mt-3">${M.orderTimeline.map((s, i) => `
        <div class="tl-item ${i < 4 ? 'done' : i === 4 ? 'current' : ''}">
          <div class="tl-title" style="font-size:13px">${esc(s.label)}</div>
          <div class="tl-meta" style="font-size:11px">${esc(s.note)}</div></div>`).join('')}</div>
      <div class="m-banner mt-4" style="margin:16px 0 0"><b class="small">🧰 Linked service visit</b>
        <p class="tiny muted mt-1">TV Wall Mount &amp; Demo · Tomorrow 3:00 PM</p>
        <button class="btn btn-sm btn-outline mt-2" onclick="mgo('bookingTrack')">Track booking</button></div>
      <div class="row gap-2 mt-4"><button class="btn btn-outline grow btn-sm">Invoice</button>
        <button class="btn btn-outline grow btn-sm">Need help?</button></div>
      <div style="height:16px"></div></div>${tabbar()}`);

  screen('notifications', () => `${statusbar()}${top('Notifications', 'home')}
    <div class="app-body">${M.customerNotifications.map(n => `
      <div class="m-list-item" style="${n.unread ? 'background:var(--primary-50)' : ''}">
        <span style="width:44px;height:44px;border-radius:12px;background:var(--surface-sunken);display:grid;place-items:center;font-size:20px">${n.icon}</span>
        <div class="col grow"><b class="small">${esc(n.title)}</b>
          <span class="tiny muted">${esc(n.body)}</span><span class="tiny soft mt-1">${esc(n.time)}</span></div></div>`).join('')}
    </div>${tabbar()}`);

  screen('profile', () => `${statusbar()}${top('Account')}
    <div class="app-body">
      <div class="app-pad"><div class="row gap-3 mt-2"><span class="avatar avatar-lg">AS</span>
        <div class="col"><b>Aarav Sharma</b><span class="tiny muted">+91 98200 41122</span>
          <span class="badge badge-primary mt-1">KeenPlaza Plus</span></div></div>
        <div class="grid grid-3 mt-4" style="gap:8px">
          <div class="mini-kpi center"><b>14</b><span>Orders</span></div>
          <div class="mini-kpi center"><b>5</b><span>Bookings</span></div>
          <div class="mini-kpi center"><b>₹1,250</b><span>Wallet</span></div></div></div>
      <div class="app-sec">${[['📦', 'My Orders', 'orders'], ['🧰', 'Service Bookings', 'bookingTrack'],
        ['❤️', 'Wishlist', 'wishlist'], ['📍', 'Saved Addresses', 'profile'], ['🏷️', 'Coupons', 'profile'],
        ['👛', 'Wallet', 'profile'], ['💳', 'Saved Payments', 'profile'], ['🔔', 'Notifications', 'notifications'],
        ['🛡️', 'Support', 'profile'], ['↩️', 'Logout', 'login']]
        .map(([e, l, k]) => `<button class="m-list-item" style="width:100%;text-align:left" onclick="mgo('${k}')">
          <span style="width:36px;height:36px;border-radius:10px;background:var(--surface-sunken);display:grid;place-items:center">${e}</span>
          <b class="small grow" style="align-self:center">${l}</b>
          <span style="align-self:center">${icon('chevron', 15)}</span></button>`).join('')}</div>
    </div>${tabbar()}`);

  screen('services', () => `${statusbar()}${top('Services')}
    <div class="app-search" onclick="mgo('search')">${icon('search', 16)} Search services</div>
    <div class="app-body">
      <div class="m-hero" style="background:linear-gradient(135deg,#0a8d82,#0FB5A6)">
        <b style="font-size:17px">Need help at home?</b>
        <p class="tiny mt-1" style="opacity:.8">Verified professionals · 30-day warranty · from ₹199</p></div>
      <div class="app-sec"><div class="app-sec-head"><b>What do you need?</b></div>
        <div class="app-pad grid grid-2" style="gap:8px">${M.serviceCategories.map(c => `
          <button class="m-svc" onclick="mgo('serviceDetail')"><span class="em" style="background:${c.color}22">${c.icon}</span>
            <span class="col" style="text-align:left"><b class="tiny">${esc(c.name)}</b>
              <span class="tiny muted">${c.rating}★ · ${c.bookings}</span></span></button>`).join('')}</div></div>
      <div class="app-sec"><div class="app-sec-head"><b>Most booked</b></div>
        <div class="app-pad col gap-2">${['pk-ac-basic', 'pk-clean-bath', 'pk-salon-glow'].map(id => {
          const p = pkgById(id);
          return `<button class="m-svc" onclick="mgo('serviceDetail')">
            <span class="em" style="background:var(--primary-50)">${svcCatById(p.catId).icon}</span>
            <span class="col grow" style="text-align:left"><b class="tiny">${esc(p.name)}</b>
              <span class="tiny muted">${inr(p.price)} · ${esc(p.duration)} · ${p.rating}★</span></span>
            <span class="btn btn-primary btn-sm">Book</span></button>`; }).join('')}</div></div>
      <div class="app-sec app-pad"><div class="m-banner"><b class="small">⚡ Bought an appliance on KeenPlaza?</b>
        <p class="tiny muted mt-1">Add installation to your order and we schedule it right after delivery.</p></div></div>
      <div style="height:16px"></div></div>${tabbar()}`);

  screen('serviceDetail', () => {
    const p = pkgById(stateM.pkg), c = svcCatById(p.catId);
    return `${statusbar()}${top('', 'services', `<button class="icon-btn" style="width:32px;height:32px">${icon('share', 18)}</button>`)}
    <div class="app-body">
      <img src="${ph(p.id, c.icon, c.name)}" style="width:100%;height:170px;object-fit:cover">
      <div class="app-pad mt-3">
        <span class="tiny bold" style="color:var(--secondary-600)">${c.icon} ${esc(c.name)}</span>
        <h3 style="font-size:18px;font-weight:750;margin-top:4px">${esc(p.name)}</h3>
        <div class="row gap-2 mt-2"><span class="rating-pill">${p.rating} ★</span>
          <span class="tiny muted">${num(p.reviews)} reviews · ${esc(p.duration)}</span></div>
        <div class="row gap-2 mt-3" style="align-items:baseline"><b style="font-size:22px">${inr(p.price)}</b>
          <span class="strike small">${inr(p.mrp)}</span></div>
        <p class="tiny muted mt-2">${esc(p.desc)}</p>
        <b class="small mt-4" style="display:block">What's included</b>
        <ul class="inc-list mt-1">${p.includes.map(i => `<li><b>✓</b> ${esc(i)}</li>`).join('')}</ul>
        <b class="small mt-3" style="display:block">Not included</b>
        <ul class="inc-list exc-list mt-1">${p.excludes.map(i => `<li><b>✕</b> ${esc(i)}</li>`).join('')}</ul>
        <div class="tile mt-4"><b class="tiny">🛡️ 30-day service warranty</b>
          <p class="tiny muted mt-1">Free revisit if the issue repeats within 30 days.</p></div>
        <div class="mt-4"><b class="small">Reviews</b>
          <div class="tile mt-2"><div class="row gap-2"><span class="rating-pill">5 ★</span><b class="tiny">On time, neat work</b></div>
            <p class="tiny muted mt-1">Explained everything and cleaned up after. Booked again for the second AC.</p></div></div>
        <div style="height:16px"></div></div></div>
    <div class="m-cta"><div class="col"><span class="tiny muted">Total</span><b>${inr(p.price)}</b></div>
      <button class="btn btn-primary grow" onclick="mgo('slots')">Select slot</button></div>`;
  });

  screen('slots', () => `${statusbar()}${top('Choose date & time', 'serviceDetail')}
    <div class="app-body">
      <div class="app-pad"><b class="small">Select a date</b></div>
      <div class="date-strip app-pad mt-2">${nextDates(7).map((d, i) => `
        <button class="date-box ${(stateM.date || 1) === i ? 'on' : ''}" onclick="MOB.pickDate(${i})">
          <div class="d">${d.label || d.day}</div><div class="n">${d.num}</div><div class="d">${d.mon}</div></button>`).join('')}</div>
      <div class="app-pad mt-4"><b class="small">Select a time slot</b></div>
      <div class="m-slot mt-2">${M.timeSlots.map((s, i) => `
        <button class="slot ${(stateM.slot || 1) === i ? 'on' : ''} ${i === 2 ? 'full' : ''}"
          style="padding:10px;font-size:12px" onclick="MOB.pickSlot(${i})">${s}</button>`).join('')}</div>
      <div class="app-pad mt-4"><div class="field"><label class="label">Instructions (optional)</label>
        <textarea class="textarea" placeholder="e.g. Second floor, call before arriving"></textarea></div></div>
      <div class="app-pad"><div class="tile"><b class="tiny">📍 Service address</b>
        <p class="tiny muted mt-1">Home — B-1204, Oberoi Splendor, Andheri East, Mumbai 400060</p>
        <button class="btn btn-ghost btn-sm mt-1">Change</button></div></div>
      <div style="height:16px"></div></div>
    <div class="m-cta"><button class="btn btn-primary btn-block" onclick="mgo('bookingConfirm')">Confirm &amp; pay</button></div>`);

  screen('bookingConfirm', () => `${statusbar()}
    <div class="app-body"><div class="success-hero" style="padding:48px 24px">
      <div class="tick">✓</div><h3 class="h4">Booking confirmed</h3>
      <p class="tiny muted mt-2">Basic AC Service · Tomorrow, 11:00 AM</p>
      <p class="tiny soft">Booking SB50020 · ₹499</p></div>
      <div class="app-pad col gap-3">
        <div class="tile"><b class="small">👷 Professional</b>
          <p class="tiny muted mt-1">Assigned 2 hours before your slot. You'll get their name, photo and live location.</p></div>
        <div class="tile"><b class="small">🔁 Free rescheduling</b>
          <p class="tiny muted mt-1">Change your slot up to 4 hours before the visit at no cost.</p></div>
        <button class="btn btn-primary btn-block" onclick="mgo('bookingTrack')">Track booking</button>
        <button class="btn btn-outline btn-block" onclick="mgo('services')">Book another service</button></div></div>`);

  screen('bookingTrack', () => `${statusbar()}${top('Booking', 'profile')}
    <div class="app-body app-pad">
      <div class="tile mt-2"><div class="row-between"><b class="small">SB50019 · AC Installation</b>
        ${badge('Professional Assigned')}</div>
        <p class="tiny muted mt-1">Today, 11:00 AM · ₹1,499 · from order BZ100240</p></div>
      <div class="tile mt-3"><div class="row gap-3"><span class="avatar">RK</span>
        <div class="col grow"><b class="small">Ramesh Kadam</b>
          <span class="tiny muted">4.9★ · 1,284 jobs · 8 yrs</span></div></div>
        <div class="row gap-2 mt-3"><button class="btn btn-outline btn-sm grow">📞 Call</button>
          <button class="btn btn-outline btn-sm grow">💬 Chat</button></div></div>
      <b class="small mt-4" style="display:block">Progress</b>
      <div class="timeline mt-3">${M.bookingTimeline.map((s, i) => `
        <div class="tl-item ${i < 1 ? 'done' : i === 1 ? 'current' : ''}">
          <div class="tl-title" style="font-size:13px">${esc(s.label)}</div>
          <div class="tl-meta" style="font-size:11px">${esc(s.note)}</div></div>`).join('')}</div>
      <div class="row gap-2 mt-4"><button class="btn btn-outline btn-sm grow">Reschedule</button>
        <button class="btn btn-outline btn-sm grow">Cancel</button></div>
      <div style="height:16px"></div></div>${tabbar()}`);

  /* ---------- interactions exposed to inline handlers ---------- */
  const MOB = global.MOB = {
    addProduct(id) { const p = productById(id); Store.addProduct(p, p.variants[1] || p.variants[0]); toast('Added to cart'); paint(); },
    buyNow(id) { MOB.addProduct(id); go('cart'); },
    addService(id) { const ok = Store.addService(pkgById(id)); toast(ok ? 'Service added to cart' : 'Already in cart', ok ? 'success' : 'info'); paint(); },
    qty(i, d) { Store.updateQty(i, d); paint(); },
    coupon() { const r = Store.applyCoupon('SAVE500'); toast(r.msg, r.ok ? 'success' : 'error'); paint(); },
    pay() { Store.placeOrder('UPI', 'Home — Andheri East, Mumbai'); toast('Payment successful'); go('orderSuccess'); },
    pickDate(i) { stateM.date = i; paint(); },
    pickSlot(i) { if (i === 2) return toast('That slot is full', 'error'); stateM.slot = i; paint(); }
  };

  /* ---------- painting ---------- */
  function paint() {
    $('#screen').innerHTML = `<div class="notch"></div>` + S[currentKey]();
    $('#capTitle').textContent = LABELS[currentKey];
    $('#capText').textContent = CAPTIONS[currentKey];
    $$('.picker button[data-s]').forEach(b => b.classList.toggle('is-active', b.dataset.s === currentKey));
  }

  function boot() {
    const keys = GROUPS.flatMap(g => g[1]);
    $('#pickerList').innerHTML = GROUPS.map(([g, items]) => `<div class="grp">${g}</div>
      ${items.map(k => `<button data-s="${k}"><span class="n">${keys.indexOf(k) + 1}</span>${LABELS[k]}</button>`).join('')}`).join('');
    $$('.picker button[data-s]').forEach(b => b.onclick = () => go(b.dataset.s));
    $('#prevS').onclick = () => go(keys[Math.max(0, keys.indexOf(currentKey) - 1)]);
    $('#nextS').onclick = () => go(keys[Math.min(keys.length - 1, keys.indexOf(currentKey) + 1)]);
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') $('#prevS').click();
      if (e.key === 'ArrowRight') $('#nextS').click();
    });
    // deep link: mobile.html#/pdp opens that screen directly
    const linked = location.hash.slice(2);
    if (S[linked]) go(linked);
    else {
      go('splash'); // splash auto-advances like a real app launch
      setTimeout(() => { if (currentKey === 'splash') go('onboarding'); }, 1600);
    }
    window.addEventListener('theme:change', paint);
    window.addEventListener('hashchange', () => {
      const k = location.hash.slice(2);
      if (S[k] && k !== currentKey) go(k);
    });
    U.protoBar('mobile.html');
  }
  document.addEventListener('DOMContentLoaded', boot);
})(window);
