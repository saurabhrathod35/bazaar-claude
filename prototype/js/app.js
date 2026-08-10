/* ============================================================
   BAZAAR — app.js
   Customer storefront SPA: home, listing, PDP, cart, checkout,
   auth, account, orders. Hash routing, no framework.
   ============================================================ */
(function (global) {
  'use strict';
  const M = global.MOCK, U = global.UI;
  const { $, $$, esc, inr, num, icon, badge, dateFmt, productImg, ph, Store, toast, modal, closeModal,
          drawer, closeDrawer, confirmDialog, productById, pkgById, svcCatById, crossSellFor,
          universalSearch, nextDates, startCountdown, stars, timeAgo } = U;

  const app = () => $('#view');

  /* ============ ROUTER ============ */
  const routes = {};
  function route(name, fn) { routes[name] = fn; }
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '') || 'home';
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    const q = {};
    (qs || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); q[k] = decodeURIComponent(v || ''); });
    return { name: parts[0] || 'home', args: parts.slice(1), q };
  }
  function render() {
    const r = parseHash();
    const fn = routes[r.name] || routes.home;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    const html = fn(r.args, r.q) || '';
    app().innerHTML = html;
    // views that redirect (auth guards) render nothing — skip their binder
    if (html && afterRender[r.name]) afterRender[r.name](r.args, r.q);
    syncHeader();
    document.body.classList.toggle('has-buybar', r.name === 'pdp');
  }
  const afterRender = {};
  const go = h => { location.hash = h; };
  global.go = go;

  /* ============ HEADER ============ */
  function headerHTML() {
    const cats = M.categories.slice(0, 6);
    return `
    <div class="header-top">
      <div class="container">
        <span>Free delivery over ₹999 · Services live in 6 cities</span>
        <span class="row gap-4 hide-md">
          <a href="#/services">Book a Service</a>
          <a href="admin.html">Seller / Admin</a>
          <a href="#/account/support">Help</a>
        </span>
      </div>
    </div>
    <div class="container header-main">
      <button class="icon-btn hide-lg" id="mNav">${icon('menu')}</button>
      <a href="#/home" class="logo"><span class="mark">B</span>
        <span>Bazaar<small>Commerce + Services</small></span></a>
      <button class="loc-btn hide-md" id="locBtn">${icon('pin', 18)}
        <span class="col"><span class="l1">Deliver to</span><span class="l2" id="locLabel">Mumbai 400060</span></span>
        ${icon('chevronDown', 14)}</button>
      <div class="header-search">
        <div class="search-box">${icon('search', 18)}
          <input id="q" placeholder="Search products, brands and services — try &quot;AC&quot;" autocomplete="off">
          <button class="btn btn-primary btn-sm" id="qGo">Search</button></div>
        <div id="suggest"></div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" id="notifBtn" title="Notifications">${icon('bell')}<span class="dot" id="notifDot">3</span></button>
        <a class="icon-btn" href="#/account/wishlist" title="Wishlist">${icon('heart')}<span class="dot hide" id="wishDot">0</span></a>
        <a class="icon-btn" href="#/cart" title="Cart">${icon('cart')}<span class="dot hide" id="cartDot">0</span></a>
        <button class="icon-btn" id="accBtn" title="Account">${icon('user')}</button>
      </div>
    </div>
    <div class="nav-bar"><div class="container">
      <button class="nav-link" data-mega="cats">All Categories ${icon('chevronDown', 13)}</button>
      ${cats.map(c => `<a class="nav-link" href="#/plp/${c.id}">${esc(c.name)}</a>`).join('')}
      <a class="nav-link" href="#/services">Services <span class="hot">New</span></a>
      <a class="nav-link" href="#/offers">Offers</a>
      <a class="nav-link" href="#/account/orders">Orders</a>
    </div></div>
    <div class="mega" id="mega"><div class="container">
      ${M.categories.filter(c => c.children).map(c => `<div>
        <h6>${esc(c.icon)} ${esc(c.name)}</h6>
        ${(c.children || []).map(s => `<a href="#/plp/${s.id}">${esc(s.name)}</a>
          ${(s.children || []).map(x => `<a href="#/plp/${x.id}" class="soft">— ${esc(x.name)}</a>`).join('')}`).join('')}
      </div>`).join('')}
    </div></div>`;
  }

  function footerHTML() {
    const col = (h, links) => `<div><h6>${h}</h6>${links.map(l => `<a href="${l[1] || '#/home'}">${l[0]}</a>`).join('')}</div>`;
    return `<div class="container">
      <div class="foot-grid">
        <div>
          <a href="#/home" class="logo" style="color:#fff"><span class="mark">B</span><span>Bazaar</span></a>
          <p class="small mt-3" style="max-width:34ch">One platform for everything you want to buy, book, install, repair and maintain.</p>
          <div class="row gap-2 mt-4">${['🇮🇳 Made for India', '⚡ Same-day services', '🔒 Secure payments']
            .map(t => `<span class="tag" style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.75)">${t}</span>`).join('')}</div>
        </div>
        ${col('Shop', [['Fashion', '#/plp/c-fashion'], ['Electronics', '#/plp/c-electronics'], ['Appliances', '#/plp/c-appliances'], ['Beauty', '#/plp/c-beauty'], ['Offers', '#/offers']])}
        ${col('Services', [['AC Service', '#/services'], ['Home Cleaning', '#/services'], ['Salon at Home', '#/services'], ['Electrician', '#/services'], ['All services', '#/services']])}
        ${col('Account', [['My Orders', '#/account/orders'], ['Wishlist', '#/account/wishlist'], ['Bookings', '#/account/bookings'], ['Wallet', '#/account/wallet'], ['Support', '#/account/support']])}
        ${col('Company', [['About Bazaar'], ['Careers'], ['Sell on Bazaar'], ['Partner as a Pro'], ['Press']])}
      </div>
      <div class="foot-bottom">
        <span>© 2026 Bazaar Commerce Pvt Ltd · Prototype for client demo — data is fictional.</span>
        <span class="row gap-4"><a href="#/home">Privacy</a><a href="#/home">Terms</a><a href="admin.html">Admin</a></span>
      </div></div>`;
  }

  function syncHeader() {
    const t = Store.totals(), s = Store.state;
    const cd = $('#cartDot'), wd = $('#wishDot');
    if (cd) { cd.textContent = t.count; cd.classList.toggle('hide', !t.count); }
    if (wd) { wd.textContent = s.wishlist.length; wd.classList.toggle('hide', !s.wishlist.length); }
    const loc = $('#locLabel'); if (loc) loc.textContent = `${s.city} ${s.pin}`;
    $$('.nav-link').forEach(a => a.classList.toggle('is-active',
      a.getAttribute('href') === '#/' + parseHash().name || (a.getAttribute('href') || '').includes(parseHash().args[0])));
  }

  function bindHeader() {
    const mega = $('#mega');
    $('[data-mega]').onclick = e => { e.stopPropagation(); mega.classList.toggle('is-open'); };
    document.addEventListener('click', e => { if (!mega.contains(e.target)) mega.classList.remove('is-open'); });
    $$('#mega a').forEach(a => a.onclick = () => mega.classList.remove('is-open'));

    const q = $('#q'), sug = $('#suggest');
    const doSearch = () => { if (q.value.trim()) { sug.innerHTML = ''; go('#/search?q=' + encodeURIComponent(q.value.trim())); } };
    $('#qGo').onclick = doSearch;
    q.onkeydown = e => { if (e.key === 'Enter') doSearch(); };
    q.oninput = () => {
      const v = q.value.trim();
      if (v.length < 2) return sug.innerHTML = '';
      const r = universalSearch(v);
      const grp = (title, items) => items.length ? `<div class="grp">${title}</div>` + items.join('') : '';
      sug.innerHTML = `<div class="suggest">
        ${grp('Products', r.products.map(p => `<button class="item" data-go="#/pdp/${p.id}">
            <img src="${productImg(p)}" alt=""><span class="col"><b class="small">${esc(p.name)}</b>
            <span class="tiny muted">${esc(p.brand)} · ${inr(p.price)}</span></span></button>`))}
        ${grp('Services', r.services.map(p => `<button class="item" data-go="services.html#/pkg/${p.id}">
            <span class="em">${(svcCatById(p.catId) || {}).icon || '🧰'}</span><span class="col">
            <b class="small">${esc(p.name)}</b><span class="tiny muted">${inr(p.price)} · ${esc(p.duration)}</span></span></button>`))}
        ${grp('Categories', r.categories.map(c => `<button class="item" data-go="#/plp/${c.id}">
            <span class="em">${icon('grid', 16)}</span><span class="small">${esc(c.name)}</span></button>`))}
        ${grp('Brands', r.brands.map(b => `<button class="item" data-go="#/plp/all?brand=${encodeURIComponent(b.name)}">
            <span class="em">${esc(b.logo)}</span><span class="small">${esc(b.name)}</span></button>`))}
        ${!r.products.length && !r.services.length ? '<div class="table-empty small">No matches. Try “AC”, “shoes”, “clean”.</div>' : ''}
      </div>`;
      $$('#suggest .item').forEach(b => b.onclick = () => {
        const dest = b.dataset.go; sug.innerHTML = ''; q.value = '';
        if (dest.startsWith('services.html')) location.href = dest; else go(dest);
      });
    };
    document.addEventListener('click', e => { if (!$('.header-search').contains(e.target)) sug.innerHTML = ''; });

    $('#locBtn').onclick = openLocation;
    $('#notifBtn').onclick = openNotifications;
    $('#accBtn').onclick = openAccountMenu;
    $('#mNav').onclick = () => drawer({
      title: 'Browse Bazaar', side: 'left',
      body: `<div class="col gap-1">
        ${M.categories.map(c => `<a class="row gap-3" style="padding:10px 0" href="#/plp/${c.id}">
          <span style="font-size:20px">${c.icon || '🛍️'}</span><b>${esc(c.name)}</b></a>`).join('')}
        <hr class="divider">
        <a class="row gap-3" style="padding:10px 0" href="#/services"><span style="font-size:20px">🧰</span><b>All Services</b></a>
        <a class="row gap-3" style="padding:10px 0" href="#/offers"><span style="font-size:20px">🏷️</span><b>Offers</b></a>
        <a class="row gap-3" style="padding:10px 0" href="#/account/orders"><span style="font-size:20px">📦</span><b>My Orders</b></a>
      </div>`,
      onOpen(root) { $$('a', root).forEach(a => a.onclick = () => closeDrawer()); }
    });
  }

  function openLocation() {
    modal({ title: 'Choose your location', size: 'modal-sm',
      body: `<p class="small muted mb-4">Delivery speed, service availability and offers change by city.</p>
        <div class="col gap-2">${M.business.cities.map(c => `
          <button class="addr-card row-between ${c === Store.state.city ? 'on' : ''}" data-city="${esc(c)}">
            <span class="row gap-3">${icon('pin', 18)}<b>${esc(c)}</b></span>
            <span class="tiny muted">${['Mumbai', 'Delhi NCR', 'Bengaluru', 'Pune', 'Ahmedabad', 'Surat'].includes(c) ? 'Products + Services' : 'Products only'}</span>
          </button>`).join('')}</div>
        <div class="field mt-4"><label class="label">Or enter a pincode</label>
          <div class="row gap-2"><input class="input" id="pinIn" placeholder="400060" maxlength="6" value="${esc(Store.state.pin)}">
          <button class="btn btn-outline" id="pinGo">Check</button></div></div>`,
      onOpen(root) {
        $$('[data-city]', root).forEach(b => b.onclick = () => {
          Store.set({ city: b.dataset.city }); closeModal(); syncHeader();
          toast('Now showing results for ' + b.dataset.city); render();
        });
        $('#pinGo', root).onclick = () => {
          const v = $('#pinIn', root).value.trim();
          if (!/^\d{6}$/.test(v)) return toast('Enter a valid 6-digit pincode', 'error');
          Store.set({ pin: v }); closeModal(); syncHeader(); toast('Delivering to ' + v);
        };
      } });
  }

  function openNotifications() {
    const list = M.customerNotifications;
    drawer({ title: 'Notifications',
      body: `<div class="col">${list.map(n => `
        <div class="row gap-3" style="padding:14px 0;border-bottom:1px solid var(--border);${n.unread ? 'background:var(--primary-50);margin:0 -20px;padding-left:20px;padding-right:20px' : ''}">
          <span style="font-size:22px">${n.icon}</span>
          <div class="col grow"><b class="small">${esc(n.title)}</b>
            <span class="tiny muted">${esc(n.body)}</span><span class="tiny soft mt-2">${esc(n.time)}</span></div>
        </div>`).join('')}</div>`,
      foot: `<button class="btn btn-outline btn-block" id="markAll">Mark all as read</button>`,
      onOpen(root) { $('#markAll', root).onclick = () => { $('#notifDot').classList.add('hide'); closeDrawer(); toast('All caught up'); }; } });
  }

  function openAccountMenu() {
    const u = Store.state.user;
    if (!u) return go('#/login');
    drawer({ title: 'My Account',
      body: `<div class="row gap-3 mb-4"><div class="avatar avatar-lg">${U.initials(u.name)}</div>
        <div class="col"><b class="h5">${esc(u.name)}</b><span class="small muted">${esc(u.phone)}</span>
        <span class="badge badge-primary mt-2">Bazaar Plus member</span></div></div>
        <div class="col">${[['orders', 'Orders', 'box'], ['bookings', 'Service Bookings', 'tools'], ['wishlist', 'Wishlist', 'heart'],
          ['addresses', 'Saved Addresses', 'pin'], ['coupons', 'Coupons', 'tag'], ['wallet', 'Wallet', 'wallet'],
          ['payments', 'Saved Payments', 'wallet'], ['notifications', 'Notifications', 'bell'],
          ['profile', 'Profile', 'user'], ['support', 'Support', 'shield']]
          .map(([k, l, ic]) => `<a class="row-between" style="padding:11px 0;border-bottom:1px solid var(--border)" href="#/account/${k}">
            <span class="row gap-3">${icon(ic, 18)}<b class="small">${l}</b></span>${icon('chevron', 16)}</a>`).join('')}</div>`,
      foot: `<button class="btn btn-outline btn-block" id="lo">${icon('logout', 16)} Logout</button>`,
      onOpen(root) {
        $$('a', root).forEach(a => a.onclick = () => closeDrawer());
        $('#lo', root).onclick = () => { Store.logout(); closeDrawer(); toast('Logged out'); go('#/home'); };
      } });
  }

  /* ============ SHARED PIECES ============ */
  function productCard(p) {
    const wish = Store.inWishlist(p.id);
    const oos = p.stock === 0;
    return `<article class="p-card" data-pid="${p.id}">
      <div class="p-media">
        <a href="#/pdp/${p.id}"><img src="${productImg(p)}" alt="${esc(p.name)}" loading="lazy"></a>
        ${p.discount > 0 ? `<span class="p-disc">${p.discount}% OFF</span>` : ''}
        <button class="p-wish ${wish ? 'on' : ''}" data-wish="${p.id}" aria-label="Wishlist">${icon('heart', 17)}</button>
        ${oos ? '<div class="p-oos">Out of stock</div>' : `<div class="p-quick">
          <button class="btn btn-primary btn-sm btn-block" data-quick="${p.id}">Quick add</button></div>`}
      </div>
      <div class="p-body">
        <span class="p-brand">${esc(p.brand)}</span>
        <a href="#/pdp/${p.id}" class="p-name clamp2">${esc(p.name)}</a>
        <div class="row gap-2"><span class="rating-pill">${p.rating} ★</span>
          <span class="tiny muted">${num(p.reviews)}</span></div>
        <div class="p-price"><b>${inr(p.price)}</b><span class="strike small">${inr(p.mrp)}</span>
          ${p.discount > 0 ? `<span class="pct">${p.discount}% off</span>` : ''}</div>
        <div class="p-foot"><span class="p-deliv">${p.express ? '⚡ ' : ''}${esc(p.delivery)}</span>
          ${p.stock > 0 && p.stock < 12 ? `<span class="tiny" style="color:var(--warning)">Only ${p.stock} left</span>` : ''}</div>
      </div></article>`;
  }

  function bindCards(root = document) {
    $$('[data-wish]', root).forEach(b => b.onclick = e => {
      e.preventDefault();
      const on = Store.toggleWishlist(b.dataset.wish);
      b.classList.toggle('on', on); syncHeader();
      toast(on ? 'Added to wishlist' : 'Removed from wishlist', on ? 'success' : 'info');
    });
    $$('[data-quick]', root).forEach(b => b.onclick = e => {
      e.preventDefault(); quickAdd(productById(b.dataset.quick));
    });
  }

  /** Quick add — asks for variant when the product has real options. */
  function quickAdd(p) {
    const needsChoice = (p.colors.length > 1 || p.sizes.length > 1);
    if (!needsChoice) { Store.addProduct(p, p.variants[0]); syncHeader(); return toast('Added to cart'); }
    let color = p.colors[0], size = p.sizes[0];
    const opts = () => `
      <div class="row gap-4">
        <img src="${productImg(p)}" style="width:90px;height:90px;border-radius:12px;object-fit:cover">
        <div class="col"><b>${esc(p.name)}</b><span class="small muted">${esc(p.brand)}</span>
          <div class="p-price"><b>${inr(p.price)}</b><span class="strike small">${inr(p.mrp)}</span></div></div></div>
      ${p.colors.length > 1 ? `<div class="mt-4"><div class="label mb-2">Colour: <b id="cLbl">${esc(color)}</b></div>
        <div class="opt-row">${p.colors.map(c => `<button class="color-dot ${c === color ? 'on' : ''}" data-c="${esc(c)}"
          style="background:${M.COLORS[c] || '#ccc'}" title="${esc(c)}"></button>`).join('')}</div></div>` : ''}
      ${p.sizes.length > 1 ? `<div class="mt-4"><div class="label mb-2">Size</div><div class="size-grid">
        ${p.sizes.map(s => `<button class="size-box ${s === size ? 'on' : ''}" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>` : ''}`;
    modal({ title: 'Choose options', size: 'modal-sm', body: opts(),
      foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="qAdd">Add to cart</button>`,
      onOpen(root) {
        const sync = () => {
          $$('[data-c]', root).forEach(b => b.classList.toggle('on', b.dataset.c === color));
          $$('[data-s]', root).forEach(b => b.classList.toggle('on', b.dataset.s === size));
          if ($('#cLbl', root)) $('#cLbl', root).textContent = color;
        };
        $$('[data-c]', root).forEach(b => b.onclick = () => { color = b.dataset.c; sync(); });
        $$('[data-s]', root).forEach(b => b.onclick = () => { size = b.dataset.s; sync(); });
        $('#qAdd', root).onclick = () => {
          const v = p.variants.find(v => v.color === color && String(v.size) === String(size)) || p.variants[0];
          if (v.stock === 0) return toast('That combination is out of stock', 'error');
          Store.addProduct(p, v); closeModal(); syncHeader(); toast('Added to cart');
        };
      } });
  }

  function sectionRail(title, sub, items, link) {
    if (!items.length) return '';
    return `<section class="section"><div class="container">
      <div class="section-head"><div><h3 class="h3">${esc(title)}</h3>
        ${sub ? `<p class="muted small mt-2">${esc(sub)}</p>` : ''}</div>
        ${link ? `<a href="${link}" class="btn btn-outline btn-sm">View all ${icon('chevron', 14)}</a>` : ''}</div>
      <div class="scroll-x">${items.map(p => `<div style="width:224px;flex:none">${productCard(p)}</div>`).join('')}</div>
    </div></section>`;
  }

  /* ============ HOME ============ */
  route('home', () => {
    const flash = M.products.filter(p => p.tags.includes('flash'));
    const trending = M.products.filter(p => p.tags.includes('trending'));
    const rec = M.products.filter(p => p.tags.includes('recommended'));
    const recent = Store.state.recentlyViewed.map(productById).filter(Boolean);
    return `
    <section class="hero"><div class="container">
      <div class="rise">
        <span class="eyebrow" style="color:var(--primary-200)">Commerce + Services Super App</span>
        <h1 class="mt-3">Everything You Need.<br><span>Products Today. Services Tomorrow.</span></h1>
        <p>Shop across fashion, electronics, home and appliances — then book trusted professionals to install,
           repair and maintain what you bought. One cart. One timeline. One app.</p>
        <div class="row gap-3 mt-6 wrap">
          <a href="#/plp/all" class="btn btn-lg btn-accent">Shop Now ${icon('chevron', 18)}</a>
          <a href="#/services" class="btn btn-lg btn-outline" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.35)">
            Explore Services</a></div>
        <div class="hero-badges">
          <span>⚡ Same-day delivery in 6 cities</span><span>🧰 Verified professionals</span>
          <span>↩️ 7-day easy returns</span><span>🔒 100% secure payments</span></div>
      </div>
      <div class="hero-art rise-2">
        <div class="hero-tile tall"><div><div class="big">❄️</div><b>AC + Installation</b>
          <small>Buy the AC, add certified installation in the same cart.</small></div>
          <a href="#/pdp/p6" class="btn btn-sm btn-accent mt-4">See bundle</a></div>
        <div class="hero-tile"><div class="big">👟</div><b>Fashion</b><small>Up to 60% off</small></div>
        <div class="hero-tile"><div class="big">🧼</div><b>Home Cleaning</b><small>From ₹499</small></div>
      </div>
    </div></section>

    <section class="section"><div class="container">
      <div class="section-head"><h3 class="h3">Shop by category</h3>
        <a href="#/plp/all" class="btn btn-ghost btn-sm">All products ${icon('chevron', 14)}</a></div>
      <div class="cat-strip">${M.categories.map(c => `<a class="cat-item" href="#/plp/${c.id}">
        <span class="em">${c.icon}</span><b>${esc(c.name)}</b></a>`).join('')}</div>
    </div></section>

    <section><div class="container"><div class="flash">
      <div class="flash-head">
        <div><span class="eyebrow" style="color:var(--accent)">⚡ Flash Deals</span>
          <h3 class="h3 mt-2" style="color:#fff">Today's biggest price drops</h3></div>
        <div class="row gap-3"><span class="small" style="opacity:.8">Ends in</span>
          <span class="countdown" id="cd"></span></div></div>
      <div class="flash-grid">${flash.slice(0, 5).map(productCard).join('')}</div>
    </div></div></section>

    ${sectionRail('Trending now', 'What India is buying this week', trending, '#/plp/all?sort=popularity')}

    <section class="section"><div class="container"><div class="svc-band">
      <div class="section-head"><div>
        <span class="eyebrow" style="color:var(--secondary-600)">Bazaar Services</span>
        <h3 class="h3 mt-2">Need help at home?<br>Book trusted professionals.</h3>
        <p class="muted mt-2">Background-verified experts, upfront pricing, 30-day service warranty.</p></div>
        <a href="#/services" class="btn btn-primary">Explore all services</a></div>
      <div class="svc-grid">${M.serviceCategories.map(s => `
        <a class="svc-item" href="services.html#/cat/${s.id}">
          <span class="em" style="background:${s.color}22">${s.icon}</span>
          <span class="col grow"><b>${esc(s.name)}</b><small>${stars(s.rating)} · ${s.bookings} bookings</small></span>
          ${icon('chevron', 16)}</a>`).join('')}</div>
    </div></div></section>

    ${sectionRail('Recommended for you', 'Based on your city, past orders and browsing', rec, '#/plp/all')}
    ${recent.length ? sectionRail('Recently viewed', '', recent) : ''}

    <section class="section"><div class="container">
      <div class="section-head"><h3 class="h3">Popular brands</h3></div>
      <div class="brand-rail">${M.brands.filter(b => b.status === 'Active').slice(0, 6).map(b => `
        <a class="brand-chip" href="#/plp/all?brand=${encodeURIComponent(b.name)}">
          <span class="lg">${esc(b.logo)}</span><b class="small">${esc(b.name)}</b>
          <span class="tiny muted">${b.products} products</span></a>`).join('')}</div>
    </div></section>

    <section class="section"><div class="container">
      <div class="usp">
        ${[['truck', 'Fast delivery', 'Same-day in metro cities, 2–3 days elsewhere'],
           ['tools', 'Book a pro', 'Verified professionals with upfront pricing'],
           ['rotate', 'Easy returns', '7-day no-questions returns on most products'],
           ['shield', 'Service warranty', '30 days on every completed service job']]
          .map(([ic, t, d]) => `<div class="tile"><span class="em">${icon(ic, 20)}</span>
            <span class="col"><b>${t}</b><small class="muted">${d}</small></span></div>`).join('')}
      </div>
    </div></section>`;
  });
  afterRender.home = () => {
    bindCards();
    const cd = $('#cd'); if (cd) startCountdown(cd, 5 * 3600e3 + 42 * 60e3);
  };

  /* ============ PRODUCT LISTING ============ */
  const filterState = { cat: 'all', brands: [], price: [0, 60000], rating: 0, discount: 0, sizes: [], colors: [], avail: false, fast: false, sort: 'recommended' };

  route('plp', (args, q) => {
    filterState.cat = args[0] || 'all';
    if (q.brand) filterState.brands = [q.brand];
    if (q.sort) filterState.sort = q.sort;
    const cat = M.flatCategories.find(c => c.id === filterState.cat);
    const crumb = ['<a href="#/home">Home</a>', '<span>›</span>',
      cat ? `<a href="#/plp/${cat.id}">${esc(cat.name)}</a>` : '<span>All products</span>'].join(' ');
    return `<div class="container section">
      <div class="crumbs">${crumb}</div>
      <div class="row-between mb-4 wrap gap-3">
        <div><h2 class="h2">${esc(cat ? cat.name : 'All products')}</h2>
          <p class="muted small mt-2" id="countLbl"></p></div>
        <button class="btn btn-outline hide-lg" id="fBtn">${icon('filter', 16)} Filters</button>
      </div>
      <div class="plp">
        <aside class="filters" id="filters"></aside>
        <div>
          <div class="plp-toolbar">
            <span class="small muted" id="tbCount"></span>
            <div class="row gap-3">
              <span class="small muted hide-sm">Sort by</span>
              <select class="select" id="sortSel" style="width:210px">
                ${[['recommended', 'Recommended'], ['popularity', 'Popularity'], ['price-asc', 'Price: Low to High'],
                   ['price-desc', 'Price: High to Low'], ['newest', 'Newest first'], ['discount', 'Discount']]
                  .map(([v, l]) => `<option value="${v}" ${filterState.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
              </select></div></div>
          <div class="applied" id="applied"></div>
          <div class="plp-grid" id="grid"></div>
        </div></div></div>`;
  });

  function matchingProducts() {
    const f = filterState;
    let list = M.products.slice();
    if (f.cat !== 'all') {
      const kids = new Set([f.cat]);
      const collect = c => (c.children || []).forEach(x => { kids.add(x.id); collect(x); });
      const node = M.flatCategories.find(c => c.id === f.cat); if (node) collect(node);
      list = list.filter(p => kids.has(p.cat));
    }
    if (f.brands.length) list = list.filter(p => f.brands.includes(p.brand));
    list = list.filter(p => p.price >= f.price[0] && p.price <= f.price[1]);
    if (f.rating) list = list.filter(p => p.rating >= f.rating);
    if (f.discount) list = list.filter(p => p.discount >= f.discount);
    if (f.sizes.length) list = list.filter(p => p.sizes.some(s => f.sizes.includes(String(s))));
    if (f.colors.length) list = list.filter(p => p.colors.some(c => f.colors.includes(c)));
    if (f.avail) list = list.filter(p => p.stock > 0);
    if (f.fast) list = list.filter(p => p.express);
    const sorters = {
      'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price,
      discount: (a, b) => b.discount - a.discount, popularity: (a, b) => b.reviews - a.reviews,
      newest: (a, b) => new Date(b.updated) - new Date(a.updated),
      recommended: (a, b) => (b.rating * 100 + b.discount) - (a.rating * 100 + a.discount)
    };
    return list.sort(sorters[f.sort] || sorters.recommended);
  }

  function renderFilters() {
    const f = filterState;
    const allSizes = [...new Set(M.products.flatMap(p => p.sizes))].filter(s => s !== 'One Size');
    const allColors = [...new Set(M.products.flatMap(p => p.colors))].filter(c => c !== 'Default');
    const html = `
      <div class="filter-grp"><h6>Category <button class="tiny" style="color:var(--primary)" id="clrAll">Clear all</button></h6>
        <div class="filter-list">
          <label class="check"><input type="radio" name="fc" value="all" ${f.cat === 'all' ? 'checked' : ''}> All products</label>
          ${M.flatCategories.filter(c => c.depth < 2).map(c => `<label class="check" style="padding-left:${c.depth * 12}px">
            <input type="radio" name="fc" value="${c.id}" ${f.cat === c.id ? 'checked' : ''}> ${esc(c.name)}</label>`).join('')}
        </div></div>
      <div class="filter-grp"><h6>Brand</h6><div class="filter-list">
        ${M.brands.map(b => `<label class="check"><input type="checkbox" data-brand="${esc(b.name)}"
          ${f.brands.includes(b.name) ? 'checked' : ''}> ${esc(b.name)} <span class="tiny soft">(${b.products})</span></label>`).join('')}
      </div></div>
      <div class="filter-grp"><h6>Price</h6>
        <input type="range" id="priceR" min="0" max="60000" step="1000" value="${f.price[1]}" style="width:100%;accent-color:var(--primary)">
        <div class="row-between tiny muted mt-2"><span>₹0</span><span id="priceLbl">Up to ${inr(f.price[1])}</span></div></div>
      <div class="filter-grp"><h6>Customer rating</h6><div class="filter-list">
        ${[4.5, 4, 3.5, 3].map(r => `<label class="check"><input type="radio" name="fr" value="${r}" ${f.rating === r ? 'checked' : ''}>
          ${r}★ &amp; above</label>`).join('')}</div></div>
      <div class="filter-grp"><h6>Discount</h6><div class="filter-list">
        ${[50, 40, 30, 20].map(d => `<label class="check"><input type="radio" name="fd" value="${d}" ${f.discount === d ? 'checked' : ''}>
          ${d}% or more</label>`).join('')}</div></div>
      <div class="filter-grp"><h6>Size</h6><div class="size-grid">
        ${allSizes.map(s => `<button class="size-box ${f.sizes.includes(String(s)) ? 'on' : ''}" data-size="${esc(s)}">${esc(s)}</button>`).join('')}
      </div></div>
      <div class="filter-grp"><h6>Colour</h6><div class="swatches">
        ${allColors.map(c => `<button class="swatch ${f.colors.includes(c) ? 'on' : ''}" data-color="${esc(c)}"
          style="background:${M.COLORS[c] || '#ccc'}" title="${esc(c)}"></button>`).join('')}
      </div></div>
      <div class="filter-grp"><h6>Availability &amp; delivery</h6><div class="filter-list">
        <label class="check"><input type="checkbox" id="fAvail" ${f.avail ? 'checked' : ''}> In stock only</label>
        <label class="check"><input type="checkbox" id="fFast" ${f.fast ? 'checked' : ''}> ⚡ Express delivery</label>
      </div></div>`;
    return html;
  }

  function paintPLP() {
    const list = matchingProducts();
    $('#grid').innerHTML = list.length ? list.map(productCard).join('')
      : `<div class="empty" style="grid-column:1/-1"><span class="ic">🔍</span>
         <b>No products match these filters</b><p class="muted small">Try widening price or clearing brands.</p>
         <button class="btn btn-outline btn-sm" id="clr2">Clear filters</button></div>`;
    const c = `${list.length} product${list.length === 1 ? '' : 's'}`;
    $('#countLbl').textContent = c + ' · delivering to ' + Store.state.city;
    $('#tbCount').textContent = c;
    const f = filterState;
    const chips = [];
    f.brands.forEach(b => chips.push(['brand', b, b]));
    f.sizes.forEach(s => chips.push(['size', s, 'Size ' + s]));
    f.colors.forEach(c2 => chips.push(['color', c2, c2]));
    if (f.rating) chips.push(['rating', f.rating, f.rating + '★ & above']);
    if (f.discount) chips.push(['discount', f.discount, f.discount + '%+ off']);
    if (f.price[1] < 60000) chips.push(['price', '', 'Under ' + inr(f.price[1])]);
    if (f.avail) chips.push(['avail', '', 'In stock']);
    if (f.fast) chips.push(['fast', '', 'Express']);
    $('#applied').innerHTML = chips.length
      ? chips.map(([k, v, l]) => `<button class="chip is-active" data-rm="${k}" data-v="${esc(v)}">${esc(l)} <span class="x">×</span></button>`).join('')
        + '<button class="chip" id="clrChips">Clear all</button>' : '';
    bindCards();
    if ($('#clr2')) $('#clr2').onclick = clearFilters;
    $$('[data-rm]').forEach(b => b.onclick = () => {
      const k = b.dataset.rm, v = b.dataset.v;
      if (k === 'brand') filterState.brands = filterState.brands.filter(x => x !== v);
      else if (k === 'size') filterState.sizes = filterState.sizes.filter(x => x !== v);
      else if (k === 'color') filterState.colors = filterState.colors.filter(x => x !== v);
      else if (k === 'rating') filterState.rating = 0;
      else if (k === 'discount') filterState.discount = 0;
      else if (k === 'price') filterState.price = [0, 60000];
      else if (k === 'avail') filterState.avail = false;
      else if (k === 'fast') filterState.fast = false;
      bindFilters(); paintPLP();
    });
    if ($('#clrChips')) $('#clrChips').onclick = clearFilters;
  }
  function clearFilters() {
    Object.assign(filterState, { brands: [], price: [0, 60000], rating: 0, discount: 0, sizes: [], colors: [], avail: false, fast: false });
    bindFilters(); paintPLP();
  }

  function bindFilters(container) {
    const box = container || $('#filters');
    if (!box) return;
    box.innerHTML = renderFilters();
    $$('input[name=fc]', box).forEach(r => r.onchange = () => { filterState.cat = r.value; paintPLP(); });
    $$('[data-brand]', box).forEach(c => c.onchange = () => {
      const b = c.dataset.brand;
      c.checked ? filterState.brands.push(b) : filterState.brands = filterState.brands.filter(x => x !== b);
      paintPLP();
    });
    const pr = $('#priceR', box);
    pr.oninput = () => { filterState.price = [0, +pr.value]; $('#priceLbl', box).textContent = 'Up to ' + inr(+pr.value); };
    pr.onchange = paintPLP;
    $$('input[name=fr]', box).forEach(r => r.onchange = () => { filterState.rating = +r.value; paintPLP(); });
    $$('input[name=fd]', box).forEach(r => r.onchange = () => { filterState.discount = +r.value; paintPLP(); });
    $$('[data-size]', box).forEach(b => b.onclick = () => {
      const s = b.dataset.size;
      filterState.sizes.includes(s) ? filterState.sizes = filterState.sizes.filter(x => x !== s) : filterState.sizes.push(s);
      b.classList.toggle('on'); paintPLP();
    });
    $$('[data-color]', box).forEach(b => b.onclick = () => {
      const c = b.dataset.color;
      filterState.colors.includes(c) ? filterState.colors = filterState.colors.filter(x => x !== c) : filterState.colors.push(c);
      b.classList.toggle('on'); paintPLP();
    });
    $('#fAvail', box).onchange = e => { filterState.avail = e.target.checked; paintPLP(); };
    $('#fFast', box).onchange = e => { filterState.fast = e.target.checked; paintPLP(); };
    $('#clrAll', box).onclick = clearFilters;
  }

  afterRender.plp = () => {
    bindFilters(); paintPLP();
    $('#sortSel').onchange = e => { filterState.sort = e.target.value; paintPLP(); };
    $('#fBtn').onclick = () => drawer({
      title: 'Filters', side: 'left', body: '<div id="fDrawer"></div>',
      foot: `<div class="row gap-2"><button class="btn btn-outline grow" id="dClr">Clear</button>
             <button class="btn btn-primary grow" id="dApply">Show results</button></div>`,
      onOpen(root) {
        bindFilters($('#fDrawer', root));
        $('#dClr', root).onclick = () => { clearFilters(); bindFilters($('#fDrawer', root)); };
        $('#dApply', root).onclick = closeDrawer;
      } });
  };

  /* ============ SEARCH (universal) ============ */
  route('search', (a, q) => {
    const term = q.q || '';
    const r = universalSearch(term);
    const all = M.products.filter(p => (p.name + p.brand + p.catName).toLowerCase().includes(term.toLowerCase()));
    return `<div class="container section">
      <p class="muted small">Search results for</p>
      <h2 class="h2">“${esc(term)}”</h2>
      <p class="muted small mt-2">${all.length} products · ${r.services.length} services · ${r.categories.length} categories</p>

      ${r.services.length ? `<div class="card card-pad mt-6" style="border-color:var(--secondary)">
        <div class="row-between mb-3"><b class="h5">🧰 Services matching “${esc(term)}”</b>
          <a href="services.html" class="btn btn-ghost btn-sm">All services ${icon('chevron', 14)}</a></div>
        <div class="grid grid-3">${r.services.map(p => {
          const c = svcCatById(p.catId);
          return `<a class="tile row gap-3" href="services.html#/pkg/${p.id}">
            <span style="font-size:22px">${c.icon}</span>
            <span class="col grow"><b class="small">${esc(p.name)}</b>
              <span class="tiny muted">${inr(p.price)} · ${esc(p.duration)} · ${p.rating}★</span></span>
            ${icon('chevron', 16)}</a>`; }).join('')}</div></div>` : ''}

      <h4 class="h4 mt-8 mb-4">Products</h4>
      <div class="plp-grid">${all.length ? all.map(productCard).join('')
        : `<div class="empty" style="grid-column:1/-1"><span class="ic">🔍</span><b>No products found</b>
           <p class="muted small">Try “AC”, “shoes”, “headphones”, “TV”.</p></div>`}</div>
    </div>`;
  });
  afterRender.search = () => bindCards();

  /* ============ OFFERS ============ */
  route('offers', () => `<div class="container section">
    <h2 class="h2">Offers &amp; coupons</h2>
    <p class="muted mt-2">Live campaigns across products and services.</p>
    <div class="grid grid-3 mt-6">${M.coupons.filter(c => c.status === 'Active').map(c => `
      <div class="card card-pad col gap-3">
        <div class="row-between"><span class="badge badge-primary">${esc(c.type)}</span>${badge(c.status)}</div>
        <b class="h4">${c.type === 'Percentage' ? c.value + '% OFF' : c.type === 'Flat' ? inr(c.value) + ' OFF' : 'FREE DELIVERY'}</b>
        <p class="small muted">Min cart ${inr(c.minCart)}${c.maxDiscount ? ` · up to ${inr(c.maxDiscount)}` : ''} · ${esc(c.scope)}</p>
        <div class="row gap-2 mt-2"><code class="kbd" style="font-size:14px;padding:6px 12px">${esc(c.code)}</code>
          <button class="btn btn-outline btn-sm" data-copy="${esc(c.code)}">Copy</button></div>
        <span class="tiny soft">Valid till ${dateFmt(c.end)}</span></div>`).join('')}</div>

    <h4 class="h4 mt-8 mb-4">Running campaigns</h4>
    <div class="grid grid-2">${M.offers.filter(o => o.status === 'Active').map(o => `
      <div class="card card-pad row-between gap-4">
        <div class="col"><b>${esc(o.name)}</b>
          <span class="small muted">${esc(o.type)} · applies to ${esc(o.applies)}</span>
          <span class="tiny soft mt-2">Ends ${dateFmt(o.end)}</span></div>
        <a class="btn btn-primary btn-sm" href="#/plp/all">Shop</a></div>`).join('')}</div></div>`);
  afterRender.offers = () => $$('[data-copy]').forEach(b => b.onclick = () => {
    navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy);
    toast('Coupon ' + b.dataset.copy + ' copied');
  });

  /* ============ PDP ============ */
  route('pdp', args => {
    const p = productById(args[0]); if (!p) return '<div class="container section">Product not found.</div>';
    Store.viewed(p.id);
    const cross = crossSellFor(p);
    const revs = M.reviews.filter(r => r.pid === p.id && r.status === 'Published');
    const similar = M.products.filter(x => x.cat === p.cat && x.id !== p.id);
    const alsoLike = M.products.filter(x => x.id !== p.id && x.brand === p.brand).concat(M.products.filter(x => x.id !== p.id)).slice(0, 8);
    const cat = M.flatCategories.find(c => c.id === p.cat);
    return `<div class="container section">
      <div class="crumbs"><a href="#/home">Home</a><span>›</span>
        <a href="#/plp/${p.cat}">${esc(cat ? cat.name : p.catName)}</a><span>›</span><span>${esc(p.name)}</span></div>
      <div class="pdp">
        <div>
          <div class="gallery">
            <div class="thumbs">${Array.from({ length: p.images }, (_, i) =>
              `<img src="${productImg(p, i)}" data-img="${i}" class="${i === 0 ? 'on' : ''}" alt="View ${i + 1}">`).join('')}</div>
            <div class="main" id="mainImg"><img src="${productImg(p, 0)}" alt="${esc(p.name)}">
              <span class="zoom-hint">${icon('search', 13)} Hover to zoom</span></div>
          </div>

          <div class="card mt-8">
            <div class="card-head"><b class="h5">Product details</b></div>
            <div class="card-body"><p class="muted">${esc(p.desc)}</p>
              <h5 class="h5 mt-6 mb-3">Specifications</h5>
              <table class="spec-table">${Object.entries(p.specs).map(([k, v]) =>
                `<tr><td>${esc(k)}</td><td class="bold">${esc(v)}</td></tr>`).join('')}
                <tr><td>SKU base</td><td class="bold">${esc(p.skuBase)}</td></tr>
                <tr><td>Weight</td><td class="bold">${esc(p.weight)}</td></tr>
                <tr><td>Dimensions</td><td class="bold">${esc(p.dims)}</td></tr></table>
              <div class="grid grid-2 mt-6">
                <div class="tile"><b class="small">${icon('rotate', 15)} Return policy</b>
                  <p class="tiny muted mt-2">7-day return window. Free pickup. Refund to source in 3–5 working days.</p></div>
                <div class="tile"><b class="small">${icon('shield', 15)} Sold by</b>
                  <p class="tiny muted mt-2">${esc(p.seller)} · 4.6★ seller rating · Ships from ${esc(Store.state.city)}</p></div>
              </div></div></div>

          <div class="card mt-6">
            <div class="card-head"><b class="h5">Ratings &amp; reviews</b>
              <button class="btn btn-outline btn-sm" id="writeRev">Write a review</button></div>
            <div class="card-body">
              <div class="rating-summary">
                <div class="center"><div class="h1">${p.rating}</div>
                  <div class="rating"><span class="star">★★★★★</span></div>
                  <p class="tiny muted mt-2">${num(p.reviews)} ratings</p></div>
                <div class="col gap-2">${[5, 4, 3, 2, 1].map(s => {
                  const pctv = s === 5 ? 62 : s === 4 ? 24 : s === 3 ? 8 : s === 2 ? 3 : 3;
                  return `<div class="rbar"><span>${s} ★</span>
                    <div class="progress"><i style="width:${pctv}%;background:${s > 3 ? 'var(--success)' : s === 3 ? 'var(--warning)' : 'var(--error)'}"></i></div>
                    <span class="tiny muted">${pctv}%</span></div>`; }).join('')}</div></div>
              <div class="mt-6">${revs.length ? revs.map(r => `<div class="review">
                <div class="row gap-3"><span class="rating-pill">${r.rating} ★</span><b>${esc(r.title)}</b>
                  ${r.verified ? '<span class="badge badge-success badge-plain">Verified purchase</span>' : ''}</div>
                <p class="small muted mt-2">${esc(r.body)}</p>
                <p class="tiny soft mt-2">${esc(r.user)} · ${dateFmt(r.date)}</p></div>`).join('')
                : '<p class="muted small">No written reviews yet — be the first.</p>'}</div></div></div>
        </div>

        <aside class="col gap-5" id="buyBox">
          <div>
            <a href="#/plp/all?brand=${encodeURIComponent(p.brand)}" class="eyebrow">${esc(p.brand)}</a>
            <h1 class="pdp-title mt-2">${esc(p.name)}</h1>
            <div class="row gap-3 mt-3"><span class="rating-pill">${p.rating} ★</span>
              <span class="small muted">${num(p.reviews)} ratings &amp; ${revs.length} reviews</span></div>
          </div>
          <div>
            <div class="price-row"><span class="now" id="pNow">${inr(p.price)}</span>
              <span class="strike h5" id="pMrp">${inr(p.mrp)}</span>
              <span class="pct" style="font-size:14px">${p.discount}% off</span></div>
            <p class="tiny muted mt-1">Inclusive of all taxes</p>
          </div>

          ${p.colors.length > 1 ? `<div><div class="label mb-2">Colour: <b id="colLbl">${esc(p.colors[0])}</b></div>
            <div class="opt-row">${p.colors.map((c, i) => `<button class="color-dot ${i === 0 ? 'on' : ''}" data-color="${esc(c)}"
              style="background:${M.COLORS[c] || '#ccc'}" title="${esc(c)}"></button>`).join('')}</div></div>` : ''}

          ${p.sizes[0] !== 'One Size' ? `<div>
            <div class="row-between mb-2"><span class="label">Select size</span>
              <button class="tiny bold" style="color:var(--primary)" id="sizeGuide">Size guide</button></div>
            <div class="size-grid" id="sizeGrid">${p.sizes.map((s, i) => `<button class="size-box ${i === 0 ? 'on' : ''}"
              data-size="${esc(s)}">${esc(s)}</button>`).join('')}</div>
            <p class="tiny mt-2" id="stockLbl"></p></div>` : '<p class="tiny" id="stockLbl"></p>'}

          <div class="row gap-3 wrap">
            <div class="qty"><button data-q="-1">${icon('minus', 16)}</button><span id="qty">1</span>
              <button data-q="1">${icon('plus', 16)}</button></div>
            <button class="btn btn-outline" id="wishBtn">${icon('heart', 16)} ${Store.inWishlist(p.id) ? 'Wishlisted' : 'Wishlist'}</button>
          </div>

          <div class="row gap-3">
            <button class="btn btn-primary btn-lg grow" id="addCart">${icon('cart', 18)} Add to Cart</button>
            <button class="btn btn-accent btn-lg grow" id="buyNow">Buy Now</button></div>

          ${cross ? `<div class="bundle">
            <span class="flag">${icon('zap', 13)} Frequently bought together</span>
            <div class="row-between gap-3 mt-3">
              <div class="row gap-3"><span style="font-size:26px">${svcCatById(cross.pkg.catId).icon}</span>
                <div class="col"><b class="small">${esc(cross.pitch)} — ${inr(cross.pkg.price)}</b>
                  <span class="tiny muted">${esc(cross.pkg.name)} · ${esc(cross.pkg.duration)} · ${cross.pkg.rating}★</span></div></div>
              <button class="btn btn-sm" style="background:var(--secondary);color:#fff" id="addSvc">Add</button></div>
            <p class="tiny muted mt-3">Book the professional while you check out — we'll schedule the visit after delivery.</p>
          </div>` : ''}

          <div class="card card-pad col gap-3">
            <b class="small">${icon('truck', 16)} Delivery</b>
            <div class="row gap-2"><input class="input" id="pinCheck" placeholder="Enter pincode" maxlength="6" value="${esc(Store.state.pin)}">
              <button class="btn btn-outline" id="pinBtn">Check</button></div>
            <p class="small" id="pinRes">Delivery by <b>${esc(p.delivery)}</b> to ${esc(Store.state.pin)}${p.express ? ' · ⚡ Express available' : ''}</p>
          </div>

          <div class="card card-pad col gap-3">
            <b class="small">${icon('tag', 16)} Available offers</b>
            ${M.coupons.filter(c => c.status === 'Active').slice(0, 3).map(c => `<div class="offer-item">
              <span class="em">${icon('percent', 16)}</span>
              <div class="col"><b class="small">${c.type === 'Percentage' ? c.value + '% off' : c.type === 'Flat' ? inr(c.value) + ' off' : 'Free delivery'} with ${esc(c.code)}</b>
                <span class="tiny muted">Min cart ${inr(c.minCart)} · ${esc(c.scope)}</span></div></div>`).join('')}
          </div>

          <div class="trust">
            ${[['↩️', '7-day returns'], ['✅', 'Genuine product'], ['🔒', 'Secure payment'], ['🧰', 'Service support']]
              .map(([e, t]) => `<div><div class="em">${e}</div><small>${t}</small></div>`).join('')}</div>
        </aside>
      </div>

      ${sectionRail('Similar products', '', similar.length ? similar : alsoLike.slice(0, 6))}
      ${sectionRail('Customers also viewed', '', alsoLike.slice(0, 6))}
    </div>
    <div class="buy-bar">
      <button class="btn btn-outline btn-icon" id="wishBar">${icon('heart', 18)}</button>
      <button class="btn btn-primary grow" id="addCartBar">Add to Cart</button>
      <button class="btn btn-accent grow" id="buyNowBar">Buy Now</button></div>`;
  });

  afterRender.pdp = args => {
    const p = productById(args[0]); if (!p) return;
    let color = p.colors[0], size = p.sizes[0], qty = 1, imgIdx = 0;
    const main = $('#mainImg');

    $$('[data-img]').forEach(t => t.onclick = () => {
      imgIdx = +t.dataset.img; $$('[data-img]').forEach(x => x.classList.remove('on')); t.classList.add('on');
      main.querySelector('img').src = productImg(p, imgIdx);
    });
    main.onmousemove = e => {
      const r = main.getBoundingClientRect();
      main.classList.add('zoom');
      main.querySelector('img').style.transformOrigin =
        `${((e.clientX - r.left) / r.width * 100)}% ${((e.clientY - r.top) / r.height * 100)}%`;
    };
    main.onmouseleave = () => main.classList.remove('zoom');

    const currentVariant = () => p.variants.find(v => v.color === color && String(v.size) === String(size)) || p.variants[0];
    const sync = () => {
      const v = currentVariant();
      $('#pNow').textContent = inr(v.price); $('#pMrp').textContent = inr(v.mrp);
      if ($('#colLbl')) $('#colLbl').textContent = color;
      $('#qty').textContent = qty;
      const sl = $('#stockLbl');
      if (sl) sl.innerHTML = v.stock === 0 ? '<span style="color:var(--error)">Out of stock in this variant</span>'
        : v.stock < 10 ? `<span style="color:var(--warning)">Hurry — only ${v.stock} left</span>`
        : `<span style="color:var(--success)">In stock · SKU ${esc(v.sku)}</span>`;
      $$('#sizeGrid [data-size]').forEach(b => {
        const vv = p.variants.find(x => x.color === color && String(x.size) === b.dataset.size);
        b.classList.toggle('off', vv && vv.stock === 0);
      });
    };
    $$('[data-color]').forEach(b => b.onclick = () => {
      color = b.dataset.color; $$('[data-color]').forEach(x => x.classList.remove('on')); b.classList.add('on'); sync();
    });
    $$('#sizeGrid [data-size]').forEach(b => b.onclick = () => {
      size = b.dataset.size; $$('#sizeGrid [data-size]').forEach(x => x.classList.remove('on')); b.classList.add('on'); sync();
    });
    $$('[data-q]').forEach(b => b.onclick = () => { qty = Math.max(1, qty + (+b.dataset.q)); sync(); });

    const add = (goCart) => {
      const v = currentVariant();
      if (v.stock === 0) return toast('This variant is out of stock', 'error');
      Store.addProduct(p, v, qty); syncHeader();
      toast(`${p.name} added to cart`);
      if (goCart) go('#/cart');
    };
    $('#addCart').onclick = () => add(false);
    $('#buyNow').onclick = () => add(true);
    $('#addCartBar').onclick = () => add(false);
    $('#buyNowBar').onclick = () => add(true);
    const wish = () => {
      const on = Store.toggleWishlist(p.id); syncHeader();
      $('#wishBtn').innerHTML = icon('heart', 16) + (on ? ' Wishlisted' : ' Wishlist');
      toast(on ? 'Added to wishlist' : 'Removed from wishlist', on ? 'success' : 'info');
    };
    $('#wishBtn').onclick = wish; $('#wishBar').onclick = wish;

    const cross = crossSellFor(p);
    if (cross && $('#addSvc')) $('#addSvc').onclick = () => {
      const ok = Store.addService(cross.pkg); syncHeader();
      toast(ok ? cross.pkg.name + ' added — schedule at checkout' : 'Already in your cart', ok ? 'success' : 'info');
    };

    $('#pinBtn').onclick = () => {
      const v = $('#pinCheck').value.trim();
      if (!/^\d{6}$/.test(v)) return toast('Enter a valid 6-digit pincode', 'error');
      Store.set({ pin: v }); syncHeader();
      $('#pinRes').innerHTML = `Delivery by <b>${p.delivery}</b> to ${v} · Cash on delivery available`;
      toast('Serviceable — delivery ' + p.delivery);
    };
    if ($('#sizeGuide')) $('#sizeGuide').onclick = () => {
      const grp = M.sizeGroups.find(g => g.appliesTo.includes(p.cat)) || M.sizeGroups[0];
      modal({ title: 'Size guide — ' + grp.name, size: 'modal-sm',
        body: `<table class="spec-table">${grp.sizes.map(s =>
          `<tr><td>${esc(s.label)}</td><td class="bold">${esc(grp.name)} standard</td></tr>`).join('')}</table>
          <p class="tiny muted mt-4">Sizes are managed as independent master data in the admin panel and mapped to categories.</p>` });
    };
    if ($('#writeRev')) $('#writeRev').onclick = () => modal({
      title: 'Write a review', size: 'modal-sm',
      body: `<div class="col gap-4"><div class="field"><label class="label">Your rating</label>
        <div class="row gap-1" id="starPick">${[1, 2, 3, 4, 5].map(i => `<button data-s="${i}" style="font-size:26px;color:var(--n-300)">★</button>`).join('')}</div></div>
        <div class="field"><label class="label">Title</label><input class="input" placeholder="Sum it up in a line"></div>
        <div class="field"><label class="label">Review</label><textarea class="textarea" placeholder="What did you like or dislike?"></textarea></div></div>`,
      foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="subRev">Submit review</button>`,
      onOpen(root) {
        let r = 0;
        $$('#starPick button', root).forEach(b => b.onclick = () => {
          r = +b.dataset.s;
          $$('#starPick button', root).forEach(x => x.style.color = +x.dataset.s <= r ? 'var(--warning)' : 'var(--n-300)');
        });
        $('#subRev', root).onclick = () => { closeModal(); toast('Review submitted for moderation'); };
      } });
    sync(); bindCards();
  };

  /* ============ CART (super cart: products + services) ============ */
  route('cart', () => {
    const items = Store.state.cart, t = Store.totals();
    if (!items.length) return `<div class="container section"><div class="empty">
      <span class="ic">🛒</span><b class="h4">Your cart is empty</b>
      <p class="muted">Add products, services — or both. They travel together.</p>
      <div class="row gap-3 mt-3"><a class="btn btn-primary" href="#/plp/all">Start shopping</a>
        <a class="btn btn-outline" href="#/services">Book a service</a></div></div></div>`;
    const prods = items.map((i, idx) => ({ i, idx })).filter(x => x.i.kind === 'product');
    const svcs = items.map((i, idx) => ({ i, idx })).filter(x => x.i.kind === 'service');
    const line = ({ i, idx }) => `<div class="cart-line">
      <img src="${ph(i.id, i.emoji, i.brand)}" alt="">
      <div class="col gap-2">
        <div class="row-between gap-3"><b class="small">${esc(i.name)}</b>
          <b>${inr(i.price * (i.qty || 1))}</b></div>
        <span class="tiny muted">${esc(i.brand)}${i.kind === 'product' ? ' · ' + esc(i.variantLabel) : ' · ' + esc(i.duration)}</span>
        ${i.kind === 'product'
          ? `<span class="tiny" style="color:var(--success)">Delivery by ${esc(i.delivery)}</span>`
          : `<span class="tiny" style="color:var(--secondary-600)">${i.date ? esc(i.date) + ' · ' + esc(i.slot) : 'Slot chosen at checkout'}</span>`}
        <div class="row gap-3 mt-2 wrap">
          ${i.kind === 'product' ? `<div class="qty"><button data-cq="${idx}" data-d="-1">${icon('minus', 15)}</button>
            <span>${i.qty}</span><button data-cq="${idx}" data-d="1">${icon('plus', 15)}</button></div>` : ''}
          <button class="btn btn-ghost btn-sm" data-rm="${idx}">${icon('trash', 15)} Remove</button>
          ${i.kind === 'product' ? `<button class="btn btn-ghost btn-sm" data-mv="${idx}">${icon('heart', 15)} Move to wishlist</button>` : ''}
        </div></div>
      <div class="col right hide-sm"><span class="tiny strike">${inr((i.mrp || i.price) * (i.qty || 1))}</span>
        <span class="tiny" style="color:var(--success)">You save ${inr(((i.mrp || i.price) - i.price) * (i.qty || 1))}</span></div>
    </div>`;

    return `<div class="container section">
      <div class="row-between mb-4 wrap gap-3">
        <div><h2 class="h2">Your cart</h2>
          <p class="muted small mt-2">${t.count} item${t.count === 1 ? '' : 's'} · products and services in one place</p></div>
        <a class="btn btn-ghost btn-sm" href="#/plp/all">Continue shopping</a></div>
      <div class="cart-layout">
        <div class="card card-pad">
          ${prods.length ? `<div class="group-head">${icon('box', 18)} Products <span class="n">· delivered to your address</span></div>
            ${prods.map(line).join('')}` : ''}
          ${svcs.length ? `<div class="group-head">${icon('tools', 18)} Services <span class="n">· scheduled as an appointment</span></div>
            ${svcs.map(line).join('')}` : ''}
          ${!svcs.length ? crossSellStrip() : ''}
        </div>
        <div class="summary col gap-4">
          <div class="card card-pad">
            <b class="h5">Order summary</b>
            <div class="mt-4">
              ${t.hasProduct ? `<div class="sum-row"><span class="muted">Products subtotal</span><span>${inr(t.productSub)}</span></div>` : ''}
              ${t.hasService ? `<div class="sum-row"><span class="muted">Services subtotal</span><span>${inr(t.serviceSub)}</span></div>` : ''}
              <div class="sum-row"><span class="muted">Discount on MRP</span>
                <span style="color:var(--success)">− ${inr(t.savings)}</span></div>
              <div class="sum-row"><span class="muted">Coupon ${Store.state.coupon ? `(${esc(Store.state.coupon)})` : ''}</span>
                <span style="color:var(--success)">− ${inr(t.couponOff)}</span></div>
              <div class="sum-row"><span class="muted">Delivery</span>
                <span>${t.delivery ? inr(t.delivery) : '<span style="color:var(--success)">FREE</span>'}</span></div>
              <div class="sum-row"><span class="muted">Tax (GST 5%)</span><span>${inr(t.tax)}</span></div>
              <div class="sum-row total"><span>Total payable</span><span>${inr(t.total)}</span></div>
            </div>
            <a class="btn btn-primary btn-lg btn-block mt-4" href="#/checkout">Proceed to checkout</a>
            <p class="tiny muted center mt-3">You save ${inr(t.savings + t.couponOff)} on this order 🎉</p>
          </div>
          <div class="card card-pad">
            <b class="small">${icon('tag', 15)} Apply coupon</b>
            <div class="coupon-row mt-3">
              <input class="input" id="cpIn" placeholder="Enter code" value="${esc(Store.state.coupon || '')}">
              ${Store.state.coupon ? '<button class="btn btn-outline" id="cpRm">Remove</button>'
                : '<button class="btn btn-secondary" id="cpGo">Apply</button>'}</div>
            <div class="row gap-2 mt-3 wrap">${M.coupons.filter(c => c.status === 'Active').slice(0, 4)
              .map(c => `<button class="chip" data-cp="${esc(c.code)}">${esc(c.code)}</button>`).join('')}</div>
          </div>
        </div></div></div>`;
  });

  function crossSellStrip() {
    const inCart = Store.state.cart.filter(i => i.kind === 'product');
    const hits = inCart.map(i => { const p = productById(i.id); return p ? crossSellFor(p) : null; }).filter(Boolean);
    if (!hits.length) return '';
    const c = hits[0];
    return `<div class="bundle mt-6">
      <span class="flag">${icon('zap', 13)} Complete your purchase</span>
      <div class="row-between gap-3 mt-3 wrap">
        <div class="row gap-3"><span style="font-size:26px">${svcCatById(c.pkg.catId).icon}</span>
          <div class="col"><b class="small">${esc(c.pitch)} — ${inr(c.pkg.price)}</b>
            <span class="tiny muted">${esc(c.pkg.name)} · ${esc(c.pkg.duration)} · scheduled after delivery</span></div></div>
        <button class="btn btn-sm" style="background:var(--secondary);color:#fff" data-addsvc="${c.pkg.id}">Add service</button>
      </div></div>`;
  }

  afterRender.cart = () => {
    $$('[data-cq]').forEach(b => b.onclick = () => { Store.updateQty(+b.dataset.cq, +b.dataset.d); render(); });
    $$('[data-rm]').forEach(b => b.onclick = () => { Store.removeLine(+b.dataset.rm); toast('Removed from cart', 'info'); render(); });
    $$('[data-mv]').forEach(b => b.onclick = () => {
      const i = Store.state.cart[+b.dataset.mv];
      if (i && !Store.inWishlist(i.id)) Store.toggleWishlist(i.id);
      Store.removeLine(+b.dataset.mv); toast('Moved to wishlist'); render();
    });
    $$('[data-addsvc]').forEach(b => b.onclick = () => {
      Store.addService(pkgById(b.dataset.addsvc)); toast('Service added to cart'); render();
    });
    $$('[data-cp]').forEach(b => b.onclick = () => { $('#cpIn').value = b.dataset.cp; applyCp(); });
    const applyCp = () => {
      const r = Store.applyCoupon($('#cpIn').value.trim());
      toast(r.msg, r.ok ? 'success' : 'error'); if (r.ok) render();
    };
    if ($('#cpGo')) $('#cpGo').onclick = applyCp;
    if ($('#cpRm')) $('#cpRm').onclick = () => { Store.removeCoupon(); toast('Coupon removed', 'info'); render(); };
  };

  /* ============ CHECKOUT ============ */
  const checkout = { step: 1, addr: 'ad1', delivery: 'standard', pay: 'upi', svcDate: null, svcSlot: null, notes: '' };

  route('checkout', () => {
    if (!Store.state.cart.length) { setTimeout(() => go('#/cart')); return ''; }
    if (!Store.state.user) { setTimeout(() => go('#/login?next=checkout')); return ''; }
    const t = Store.totals();
    const steps = ['Cart', 'Address', 'Delivery', 'Payment', 'Confirm'];
    return `<div class="container section">
      <div class="stepper mb-6">${steps.map((s, i) => `
        <span class="step ${checkout.step > i ? 'done' : ''} ${checkout.step === i + 1 ? 'is-active' : ''}">
          <span class="n">${checkout.step > i + 1 ? '✓' : i + 1}</span>${s}</span>
        ${i < steps.length - 1 ? '<span class="step-line"></span>' : ''}`).join('')}</div>
      <div class="checkout">
        <div class="card card-pad" id="stepBox">${checkoutStep(t)}</div>
        <div class="summary card card-pad">
          <b class="h5">Order summary</b>
          <div class="mt-3 col gap-2">${Store.state.cart.map(i => `<div class="row gap-3">
            <img src="${ph(i.id, i.emoji, '')}" style="width:44px;height:44px;border-radius:8px;object-fit:cover">
            <span class="col grow"><span class="tiny bold clamp1">${esc(i.name)}</span>
              <span class="tiny muted">${i.kind === 'product' ? 'Qty ' + i.qty : 'Service'}</span></span>
            <span class="tiny bold">${inr(i.price * (i.qty || 1))}</span></div>`).join('')}</div>
          <hr class="divider">
          <div class="sum-row"><span class="muted">Subtotal</span><span>${inr(t.subtotal)}</span></div>
          <div class="sum-row"><span class="muted">Coupon</span><span style="color:var(--success)">− ${inr(t.couponOff)}</span></div>
          <div class="sum-row"><span class="muted">Delivery</span><span>${t.delivery ? inr(t.delivery) : 'FREE'}</span></div>
          <div class="sum-row"><span class="muted">Tax</span><span>${inr(t.tax)}</span></div>
          <div class="sum-row total"><span>Total</span><span>${inr(t.total)}</span></div>
        </div></div></div>`;
  });

  function checkoutStep(t) {
    if (checkout.step === 1) {
      return `<h4 class="h4 mb-4">Review your cart</h4>
        ${Store.state.cart.map(i => `<div class="row-between gap-3" style="padding:12px 0;border-bottom:1px solid var(--border)">
          <div class="row gap-3"><img src="${ph(i.id, i.emoji, '')}" style="width:52px;height:52px;border-radius:8px">
            <div class="col"><b class="small">${esc(i.name)}</b>
              <span class="tiny muted">${i.kind === 'product' ? esc(i.variantLabel) + ' · Qty ' + i.qty : esc(i.duration) + ' · appointment'}</span></div></div>
          <b>${inr(i.price * (i.qty || 1))}</b></div>`).join('')}
        <div class="row gap-3 mt-6"><a class="btn btn-outline" href="#/cart">Edit cart</a>
          <button class="btn btn-primary grow" data-next>Continue to address</button></div>`;
    }
    if (checkout.step === 2) {
      return `<div class="row-between mb-4"><h4 class="h4">Delivery address</h4>
        <button class="btn btn-outline btn-sm" id="newAddr">${icon('plus', 14)} Add new</button></div>
        <div class="col gap-3">${M.addresses.map(a => `<label class="addr-card ${checkout.addr === a.id ? 'on' : ''}" data-addr="${a.id}">
          <div class="row-between"><span class="row gap-2"><b>${esc(a.name)}</b>
            <span class="tag">${esc(a.label)}</span>${a.default ? '<span class="badge badge-primary badge-plain">Default</span>' : ''}</span>
            <span class="tiny muted">${esc(a.phone)}</span></div>
          <p class="small muted mt-2">${esc(a.line)}, ${esc(a.area)}, ${esc(a.city)}, ${esc(a.state)} — ${esc(a.pin)}</p></label>`).join('')}</div>
        <div class="row gap-3 mt-6"><button class="btn btn-outline" data-back>Back</button>
          <button class="btn btn-primary grow" data-next>Continue to delivery</button></div>`;
    }
    if (checkout.step === 3) {
      const dates = nextDates(6);
      return `<h4 class="h4 mb-4">Delivery &amp; scheduling</h4>
        ${t.hasProduct ? `<b class="small">${icon('truck', 15)} Product delivery</b>
        <div class="col gap-3 mt-3">
          ${[['standard', 'Standard delivery', 'Arrives in 2–3 days', 'FREE'],
             ['express', 'Express delivery', 'Arrives tomorrow before 9 PM', '₹99'],
             ['slot', 'Choose a slot', 'Pick a 2-hour window on delivery day', '₹49']]
            .map(([k, t1, t2, p]) => `<label class="deliv-opt ${checkout.delivery === k ? 'on' : ''}" data-deliv="${k}">
              <span class="col"><b class="small">${t1}</b><span class="tiny muted">${t2}</span></span>
              <b class="small" style="color:${p === 'FREE' ? 'var(--success)' : 'inherit'}">${p}</b></label>`).join('')}
        </div>` : ''}
        ${t.hasService ? `<div class="mt-6"><b class="small">${icon('calendar', 15)} Service appointment</b>
          <p class="tiny muted mt-1">Pick when our professional should visit. Product deliveries and service visits stay on one timeline.</p>
          <div class="date-strip mt-3">${dates.map(d => `<button class="date-box ${checkout.svcDate === d.iso ? 'on' : ''}" data-date="${d.iso}">
            <div class="d">${d.label || d.day}</div><div class="n">${d.num}</div><div class="d">${d.mon}</div></button>`).join('')}</div>
          <div class="slot-grid mt-4">${M.timeSlots.map((s, i) => `<button class="slot ${checkout.svcSlot === s ? 'on' : ''} ${i === 2 ? 'full' : ''}"
            data-slot="${esc(s)}">${esc(s)}</button>`).join('')}</div>
          <div class="field mt-4"><label class="label">Instructions for the professional (optional)</label>
            <textarea class="textarea" id="svcNotes" placeholder="e.g. Gate code 4821, ask for Aarav">${esc(checkout.notes)}</textarea></div>
        </div>` : ''}
        <div class="row gap-3 mt-6"><button class="btn btn-outline" data-back>Back</button>
          <button class="btn btn-primary grow" data-next>Continue to payment</button></div>`;
    }
    if (checkout.step === 4) {
      const methods = [['upi', 'UPI', '🟣', 'GPay, PhonePe, Paytm, BHIM'], ['card', 'Credit / Debit Card', '💳', 'Visa, Mastercard, RuPay, Amex'],
        ['nb', 'Net Banking', '🏦', 'All major Indian banks'], ['wallet', 'Wallet', '👛', 'Bazaar Wallet · ₹1,250 balance'],
        ['cod', 'Cash on Delivery', '💵', t.hasService ? 'Not available with service bookings' : 'Pay when it arrives']];
      return `<h4 class="h4 mb-4">Payment method</h4>
        <div class="col gap-3">${methods.map(([k, l, e, d]) => {
          const off = k === 'cod' && t.hasService;
          return `<label class="pay-opt ${checkout.pay === k ? 'on' : ''}" data-pay="${k}" style="${off ? 'opacity:.45;pointer-events:none' : ''}">
            <span class="em">${e}</span><span class="col grow"><b class="small">${l}</b><span class="tiny muted">${d}</span></span>
            ${checkout.pay === k ? icon('check', 18) : ''}</label>`; }).join('')}</div>
        <div id="payDetail" class="mt-4"></div>
        <div class="row gap-3 mt-6"><button class="btn btn-outline" data-back>Back</button>
          <button class="btn btn-accent btn-lg grow" id="payNow">Pay ${inr(t.total)}</button></div>
        <p class="tiny muted center mt-3">🔒 Demo checkout — no real payment is processed.</p>`;
    }
    return '';
  }

  afterRender.checkout = () => {
    const t = Store.totals();
    const rebind = () => { app().querySelector('#stepBox').innerHTML = checkoutStep(Store.totals()); bindStep(); paintStepper(); };
    const paintStepper = () => {
      $$('.stepper .step').forEach((s, i) => {
        s.classList.toggle('done', checkout.step > i + 1);
        s.classList.toggle('is-active', checkout.step === i + 1);
        s.querySelector('.n').textContent = checkout.step > i + 1 ? '✓' : i + 1;
      });
    };
    function bindStep() {
      $$('[data-next]').forEach(b => b.onclick = () => {
        if (checkout.step === 3 && Store.totals().hasService && (!checkout.svcDate || !checkout.svcSlot))
          return toast('Choose a date and time slot for the service', 'error');
        checkout.step++; rebind();
      });
      $$('[data-back]').forEach(b => b.onclick = () => { checkout.step--; rebind(); });
      $$('[data-addr]').forEach(a => a.onclick = () => { checkout.addr = a.dataset.addr; rebind(); });
      $$('[data-deliv]').forEach(a => a.onclick = () => { checkout.delivery = a.dataset.deliv; rebind(); });
      $$('[data-date]').forEach(b => b.onclick = () => { checkout.svcDate = b.dataset.date; rebind(); });
      $$('[data-slot]').forEach(b => b.onclick = () => { checkout.svcSlot = b.dataset.slot; rebind(); });
      const nt = $('#svcNotes'); if (nt) nt.oninput = () => checkout.notes = nt.value;
      $$('[data-pay]').forEach(a => a.onclick = () => { checkout.pay = a.dataset.pay; rebind(); paintPayDetail(); });
      if ($('#newAddr')) $('#newAddr').onclick = addressModal;
      if ($('#payNow')) $('#payNow').onclick = payNow;
      paintPayDetail();
    }
    function paintPayDetail() {
      const box = $('#payDetail'); if (!box) return;
      const map = {
        upi: `<div class="tile"><div class="field"><label class="label">UPI ID</label>
          <div class="row gap-2"><input class="input" value="aarav@okhdfcbank"><button class="btn btn-outline">Verify</button></div></div></div>`,
        card: `<div class="tile col gap-3"><div class="field"><label class="label">Card number</label>
          <input class="input" placeholder="4242 4242 4242 4242" value="4242 4242 4242 4242"></div>
          <div class="row gap-3"><div class="field"><label class="label">Expiry</label><input class="input" value="08/29"></div>
          <div class="field"><label class="label">CVV</label><input class="input" type="password" value="123"></div></div>
          <label class="check"><input type="checkbox" checked> Save this card securely</label></div>`,
        nb: `<div class="tile"><div class="field"><label class="label">Choose bank</label>
          <select class="select">${['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra'].map(b => `<option>${b}</option>`).join('')}</select></div></div>`,
        wallet: `<div class="tile row-between"><span class="col"><b class="small">Bazaar Wallet</b>
          <span class="tiny muted">Balance ₹1,250 · remainder charged to UPI</span></span>
          <button class="btn btn-outline btn-sm">Add money</button></div>`,
        cod: `<div class="tile"><p class="small muted">Pay ${inr(Store.totals().total)} in cash or UPI when the order arrives. A ₹0 handling fee applies.</p></div>`
      };
      box.innerHTML = map[checkout.pay] || '';
    }
    function payNow() {
      const btn = $('#payNow');
      btn.innerHTML = 'Processing…'; btn.classList.add('is-disabled');
      setTimeout(() => {
        const addr = M.addresses.find(a => a.id === checkout.addr);
        const payLabel = { upi: 'UPI', card: 'Credit Card', nb: 'Net Banking', wallet: 'Wallet', cod: 'COD' }[checkout.pay];
        Store.state.cart.filter(i => i.kind === 'service').forEach(i => {
          i.date = checkout.svcDate ? dateFmt(checkout.svcDate) : 'Tomorrow';
          i.slot = checkout.svcSlot || '11:00 AM'; i.notes = checkout.notes;
        });
        const order = Store.placeOrder(payLabel, `${addr.label} — ${addr.area}, ${addr.city}`);
        checkout.step = 1; syncHeader();
        go('#/success/' + order.id);
      }, 1100);
    }
    bindStep();
  };

  function addressModal(existing) {
    modal({ title: existing ? 'Edit address' : 'Add a new address',
      body: `<div class="grid grid-2">
        <div class="field"><label class="label">Full name</label><input class="input" value="${esc(existing ? existing.name : '')}"></div>
        <div class="field"><label class="label">Mobile number</label><input class="input" value="${esc(existing ? existing.phone : '')}" placeholder="+91"></div>
        <div class="field" style="grid-column:1/-1"><label class="label">Flat / House / Building</label>
          <input class="input" value="${esc(existing ? existing.line : '')}"></div>
        <div class="field"><label class="label">Area / Locality</label><input class="input" value="${esc(existing ? existing.area : '')}"></div>
        <div class="field"><label class="label">Pincode</label><input class="input" maxlength="6" value="${esc(existing ? existing.pin : '')}"></div>
        <div class="field"><label class="label">City</label><input class="input" value="${esc(existing ? existing.city : Store.state.city)}"></div>
        <div class="field"><label class="label">State</label><input class="input" value="${esc(existing ? existing.state : 'Maharashtra')}"></div>
        <div class="field" style="grid-column:1/-1"><label class="label">Address type</label>
          <div class="row gap-2">${['Home', 'Office', 'Other'].map((l, i) =>
            `<button class="chip ${(existing ? existing.label === l : i === 0) ? 'is-active' : ''}" data-lbl="${l}">${l}</button>`).join('')}</div></div>
        <label class="check" style="grid-column:1/-1"><input type="checkbox" ${existing && existing.default ? 'checked' : ''}> Make this my default address</label>
      </div>`,
      foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="saveAddr">Save address</button>`,
      onOpen(root) {
        $$('[data-lbl]', root).forEach(b => b.onclick = () => {
          $$('[data-lbl]', root).forEach(x => x.classList.remove('is-active')); b.classList.add('is-active');
        });
        $('#saveAddr', root).onclick = () => { closeModal(); toast('Address saved'); };
      } });
  }

  /* ============ ORDER SUCCESS ============ */
  route('success', args => {
    const o = Store.state.orders.find(x => x.id === args[0]) || Store.state.orders[0];
    if (!o) return '<div class="container section">No order found.</div>';
    const bookings = Store.state.bookings.filter(b => b.fromOrder === o.id);
    return `<div class="container section">
      <div class="card">
        <div class="success-hero">
          <div class="tick">✓</div>
          <h2 class="h2">Order placed successfully</h2>
          <p class="muted mt-2">Order <b>${esc(o.id)}</b> · ${inr(o.total)} paid via ${esc(o.payment)}</p>
          <p class="small muted mt-1">A confirmation has been sent by push, SMS and email.</p>
          <div class="row gap-3 mt-6" style="justify-content:center">
            <a class="btn btn-primary" href="#/order/${o.id}">Track order</a>
            <a class="btn btn-outline" href="#/plp/all">Continue shopping</a></div>
        </div>
        <div class="card-body" style="border-top:1px solid var(--border)">
          <div class="grid grid-2">
            <div class="tile"><b class="small">${icon('truck', 15)} Delivery</b>
              <p class="tiny muted mt-2">${esc(o.address)}</p>
              <p class="tiny mt-2">Arriving <b>in 2 days</b> via ${esc(o.courier)} · AWB ${esc(o.awb)}</p></div>
            ${bookings.length ? `<div class="tile" style="border-color:var(--secondary)">
              <b class="small">${icon('calendar', 15)} Service appointment</b>
              ${bookings.map(b => `<p class="tiny muted mt-2">${esc(b.name)} · <b>${esc(b.date)} at ${esc(b.slot)}</b><br>
                Booking ${esc(b.id)} — professional assigned 2 hours before the visit.</p>`).join('')}
              <a class="btn btn-sm btn-outline mt-3" href="#/booking/${bookings[0].id}">Track booking</a></div>`
            : `<div class="tile"><b class="small">${icon('tools', 15)} Need installation?</b>
              <p class="tiny muted mt-2">Add a professional visit for this order any time before delivery.</p>
              <a class="btn btn-sm btn-outline mt-3" href="#/services">Browse services</a></div>`}
          </div></div></div></div>`;
  });

  /* ============ ACCOUNT ============ */
  const ACC_TABS = [['orders', 'My Orders', 'box'], ['bookings', 'Service Bookings', 'tools'], ['wishlist', 'Wishlist', 'heart'],
    ['addresses', 'Saved Addresses', 'pin'], ['coupons', 'My Coupons', 'tag'], ['wallet', 'Wallet', 'wallet'],
    ['payments', 'Saved Payments', 'wallet'], ['notifications', 'Notifications', 'bell'], ['profile', 'Profile', 'user'],
    ['support', 'Support', 'shield']];

  route('account', args => {
    if (!Store.state.user) { setTimeout(() => go('#/login')); return ''; }
    const tab = args[0] || 'orders';
    const u = Store.state.user;
    return `<div class="container section">
      <div class="row gap-4 mb-6"><div class="avatar avatar-lg">${U.initials(u.name)}</div>
        <div class="col"><h2 class="h3">Hello, ${esc(u.name.split(' ')[0])}</h2>
          <span class="muted small">${esc(u.phone)} · ${esc(u.email)}</span></div></div>
      <div class="account">
        <nav class="acc-nav">${ACC_TABS.map(([k, l, ic]) =>
          `<a href="#/account/${k}" class="${tab === k ? 'is-active' : ''}">${icon(ic, 17)} ${l}</a>`).join('')}
          <a href="#" id="logoutBtn">${icon('logout', 17)} Logout</a></nav>
        <div>${accountTab(tab)}</div></div></div>`;
  });

  function accountTab(tab) {
    const s = Store.state;
    if (tab === 'orders') {
      const demo = M.orders.slice(0, 4).map(o => ({ id: o.id, date: o.date, status: o.status, total: o.total,
        items: o.items.map(i => i.type === 'service' ? { name: pkgById(i.pid).name, emoji: '🧰', kind: 'service' }
          : { name: productById(i.pid).name, emoji: productById(i.pid).emoji, kind: 'product' }), courier: o.courier }));
      const mine = s.orders.map(o => ({ id: o.id, date: o.date, status: o.status, total: o.total,
        items: o.items.concat(o.services || []), courier: o.courier }));
      const all = mine.concat(demo);
      return `<div class="row-between mb-4"><h4 class="h4">My orders</h4>
        <div class="seg" id="ordFilter">${['All', 'Active', 'Delivered', 'Cancelled'].map((f, i) =>
          `<button class="${i === 0 ? 'is-active' : ''}" data-f="${f}">${f}</button>`).join('')}</div></div>
        <div id="ordList">${all.map(o => orderCard(o)).join('')}</div>`;
    }
    if (tab === 'bookings') {
      const mine = s.bookings;
      const demo = M.bookings.filter(b => b.customer === 'u1').map(b => ({ id: b.id, name: pkgById(b.pkg).name,
        emoji: svcCatById(pkgById(b.pkg).catId).icon, date: dateFmt(b.date), slot: b.slot, status: b.status, amount: b.amount, address: b.address }));
      const all = mine.concat(demo);
      return `<h4 class="h4 mb-4">Service bookings</h4>
        ${all.length ? all.map(b => `<div class="order-card">
          <div class="oc-head"><span>Booking <b>${esc(b.id)}</b> · ${esc(b.date)} at ${esc(b.slot)}</span>
            ${badge(b.status)}</div>
          <div class="oc-body">
            <span style="font-size:30px">${b.emoji || '🧰'}</span>
            <div class="col grow"><b>${esc(b.name)}</b>
              <span class="tiny muted">${esc(b.address || 'Home')} · ${inr(b.amount)}</span></div>
            <div class="row gap-2"><a class="btn btn-outline btn-sm" href="#/booking/${b.id}">Track</a>
              <button class="btn btn-ghost btn-sm" data-rebook="${esc(b.name)}">${icon('refresh', 14)} Book again</button></div>
          </div></div>`).join('')
        : `<div class="empty"><span class="ic">🧰</span><b>No bookings yet</b>
           <p class="muted small">Book AC service, cleaning, salon and more.</p>
           <a class="btn btn-primary btn-sm" href="#/services">Explore services</a></div>`}`;
    }
    if (tab === 'wishlist') {
      const items = s.wishlist.map(productById).filter(Boolean);
      return `<div class="row-between mb-4"><h4 class="h4">Wishlist</h4>
        <span class="muted small">${items.length} item${items.length === 1 ? '' : 's'}</span></div>
        ${items.length ? `<div class="plp-grid">${items.map(productCard).join('')}</div>`
        : `<div class="empty"><span class="ic">❤️</span><b>Nothing saved yet</b>
           <p class="muted small">Tap the heart on any product to save it here.</p>
           <a class="btn btn-primary btn-sm" href="#/plp/all">Browse products</a></div>`}`;
    }
    if (tab === 'addresses') {
      return `<div class="row-between mb-4"><h4 class="h4">Saved addresses</h4>
        <button class="btn btn-primary btn-sm" id="addAddr">${icon('plus', 14)} Add address</button></div>
        <div class="grid grid-2">${M.addresses.map(a => `<div class="card card-pad col gap-2">
          <div class="row-between"><span class="row gap-2"><b>${esc(a.label)}</b>
            ${a.default ? '<span class="badge badge-primary badge-plain">Default</span>' : ''}</span>
            <div class="row gap-1"><button class="btn btn-ghost btn-sm" data-edit-addr="${a.id}">${icon('edit', 14)}</button>
              <button class="btn btn-ghost btn-sm" data-del-addr="${a.id}">${icon('trash', 14)}</button></div></div>
          <b class="small">${esc(a.name)}</b>
          <p class="small muted">${esc(a.line)}, ${esc(a.area)}, ${esc(a.city)} — ${esc(a.pin)}</p>
          <span class="tiny soft">${esc(a.phone)}</span></div>`).join('')}</div>`;
    }
    if (tab === 'coupons') {
      return `<h4 class="h4 mb-4">My coupons</h4>
        <div class="grid grid-2">${M.coupons.map(c => `<div class="card card-pad col gap-2" style="${c.status !== 'Active' ? 'opacity:.55' : ''}">
          <div class="row-between"><code class="kbd">${esc(c.code)}</code>${badge(c.status)}</div>
          <b>${c.type === 'Percentage' ? c.value + '% off up to ' + inr(c.maxDiscount) : c.type === 'Flat' ? inr(c.value) + ' off' : 'Free delivery'}</b>
          <span class="tiny muted">Min cart ${inr(c.minCart)} · ${esc(c.scope)} · expires ${dateFmt(c.end)}</span></div>`).join('')}</div>`;
    }
    if (tab === 'wallet') {
      const tx = [['Refund — BZ100233', '+1,199', daysBack(11)], ['Cashback — Weekend Sale', '+250', daysBack(20)],
        ['Used on BZ100238', '-199', daysBack(2)], ['Referral bonus', '+100', daysBack(40)]];
      return `<h4 class="h4 mb-4">Bazaar Wallet</h4>
        <div class="card card-pad row-between" style="background:linear-gradient(120deg,var(--primary-900),var(--primary));color:#fff">
          <div class="col"><span class="small" style="opacity:.7">Available balance</span>
            <b style="font-size:34px">₹1,250</b><span class="tiny" style="opacity:.7">Usable on products and services</span></div>
          <button class="btn btn-accent" id="addMoney">Add money</button></div>
        <h5 class="h5 mt-6 mb-3">Recent transactions</h5>
        <div class="card">${tx.map(([t1, amt, d]) => `<div class="row-between" style="padding:14px 20px;border-bottom:1px solid var(--border)">
          <div class="col"><b class="small">${t1}</b><span class="tiny muted">${d}</span></div>
          <b style="color:${amt.startsWith('+') ? 'var(--success)' : 'var(--text)'}">₹${amt.replace(/[+-]/, '')}</b></div>`).join('')}</div>`;
    }
    if (tab === 'payments') {
      return `<div class="row-between mb-4"><h4 class="h4">Saved payments</h4>
        <button class="btn btn-outline btn-sm" id="addPay">${icon('plus', 14)} Add method</button></div>
        <div class="col gap-3">${M.savedPayments.map(p => `<div class="card card-pad row-between">
          <div class="row gap-3"><span style="font-size:22px">${p.icon}</span>
            <div class="col"><b class="small">${esc(p.label)}</b><span class="tiny muted">${esc(p.type)} · ${esc(p.meta)}</span></div></div>
          <button class="btn btn-ghost btn-sm">${icon('trash', 15)}</button></div>`).join('')}</div>`;
    }
    if (tab === 'notifications') {
      return `<div class="row-between mb-4"><h4 class="h4">Notifications</h4>
        <button class="btn btn-ghost btn-sm">Mark all read</button></div>
        <div class="card">${M.customerNotifications.map(n => `<div class="row gap-3" style="padding:16px 20px;border-bottom:1px solid var(--border)">
          <span style="font-size:22px">${n.icon}</span>
          <div class="col grow"><b class="small">${esc(n.title)}</b><span class="tiny muted">${esc(n.body)}</span></div>
          <span class="tiny soft nowrap">${esc(n.time)}</span></div>`).join('')}</div>
        <h5 class="h5 mt-6 mb-3">Notification preferences</h5>
        <div class="card card-pad col gap-3">${['Order updates', 'Service reminders', 'Offers and deals', 'Price drops', 'Back in stock']
          .map((l, i) => `<div class="row-between"><span class="small">${l}</span>
            <label class="switch"><input type="checkbox" ${i < 3 ? 'checked' : ''}><span></span></label></div>`).join('')}</div>`;
    }
    if (tab === 'profile') {
      const u = Store.state.user;
      return `<h4 class="h4 mb-4">Profile</h4>
        <div class="card card-pad"><div class="grid grid-2">
          <div class="field"><label class="label">Full name</label><input class="input" value="${esc(u.name)}"></div>
          <div class="field"><label class="label">Mobile</label><input class="input" value="${esc(u.phone)}"></div>
          <div class="field"><label class="label">Email</label><input class="input" value="${esc(u.email)}"></div>
          <div class="field"><label class="label">City</label><select class="select">${M.business.cities.map(c =>
            `<option ${c === Store.state.city ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
          <div class="field"><label class="label">Date of birth</label><input class="input" type="date" value="1994-06-12"></div>
          <div class="field"><label class="label">Gender</label><select class="select"><option>Prefer not to say</option><option>Male</option><option>Female</option></select></div>
        </div>
        <div class="row gap-3 mt-5"><button class="btn btn-primary" id="saveProf">Save changes</button>
          <button class="btn btn-outline" id="changePw">Change password</button></div></div>`;
    }
    if (tab === 'support') {
      return `<h4 class="h4 mb-4">Support</h4>
        <div class="grid grid-3 mb-6">${[['📦', 'Order issue', 'Delivery, damage, wrong item'],
          ['🧰', 'Service issue', 'Reschedule, quality, professional'], ['💳', 'Payment & refunds', 'Failed payment, refund status']]
          .map(([e, t1, d]) => `<button class="card card-pad col gap-2 center" data-ticket="${t1}">
            <span style="font-size:26px">${e}</span><b class="small">${t1}</b><span class="tiny muted">${d}</span></button>`).join('')}</div>
        <h5 class="h5 mb-3">Your tickets</h5>
        <div class="card">${M.supportTickets.map(t1 => `<div class="row-between" style="padding:14px 20px;border-bottom:1px solid var(--border)">
          <div class="col"><b class="small">${esc(t1.subject)}</b><span class="tiny muted">${esc(t1.id)} · updated ${timeAgo(t1.updated)}</span></div>
          ${badge(t1.status === 'Open' ? 'Placed' : 'Delivered')}</div>`).join('')}</div>`;
    }
    return '';
  }
  function daysBack(n) { const d = new Date('2026-08-09'); d.setDate(d.getDate() - n); return dateFmt(d); }

  function orderCard(o) {
    const first = o.items[0] || {};
    return `<div class="order-card" data-status="${esc(o.status)}">
      <div class="oc-head"><span>Order <b>${esc(o.id)}</b> · placed ${dateFmt(o.date)}</span>
        <span class="row gap-3">${badge(o.status)}<b>${inr(o.total)}</b></span></div>
      <div class="oc-body">
        <div class="mini-thumbs">${o.items.slice(0, 3).map(i =>
          `<img src="${ph(i.id || i.pid || i.name, i.emoji || '📦', '')}" alt="">`).join('')}</div>
        <div class="col grow"><b class="small">${esc(first.name || 'Order items')}</b>
          ${o.items.length > 1 ? `<span class="tiny muted">+ ${o.items.length - 1} more item${o.items.length > 2 ? 's' : ''}</span>` : ''}
          <span class="tiny muted">${o.courier ? esc(o.courier) : ''}</span></div>
        <div class="row gap-2">
          <a class="btn btn-outline btn-sm" href="#/order/${o.id}">${o.status === 'Delivered' ? 'View details' : 'Track order'}</a>
          <button class="btn btn-ghost btn-sm" data-reorder="${esc(o.id)}">${icon('refresh', 14)} Reorder</button></div>
      </div></div>`;
  }

  afterRender.account = args => {
    bindCards();
    $('#logoutBtn').onclick = e => { e.preventDefault(); Store.logout(); toast('Logged out'); go('#/home'); };
    $$('[data-reorder]').forEach(b => b.onclick = () => {
      const o = M.orders.find(x => x.id === b.dataset.reorder);
      if (o) o.items.forEach(i => { if (!i.type) { const p = productById(i.pid); if (p) Store.addProduct(p, p.variants[0], i.qty); } });
      syncHeader(); toast('Items added to cart — one-tap reorder'); go('#/cart');
    });
    $$('[data-rebook]').forEach(b => b.onclick = () => { toast('Reopening booking flow for ' + b.dataset.rebook); location.href = 'services.html'; });
    if ($('#ordFilter')) $$('#ordFilter button').forEach(b => b.onclick = () => {
      $$('#ordFilter button').forEach(x => x.classList.remove('is-active')); b.classList.add('is-active');
      const f = b.dataset.f;
      $$('#ordList .order-card').forEach(c => {
        const st = c.dataset.status;
        const show = f === 'All' || (f === 'Active' && !['Delivered', 'Cancelled', 'Returned', 'Refunded'].includes(st))
          || (f === 'Delivered' && st === 'Delivered') || (f === 'Cancelled' && ['Cancelled', 'Returned', 'Refunded'].includes(st));
        c.style.display = show ? '' : 'none';
      });
    });
    if ($('#addAddr')) $('#addAddr').onclick = () => addressModal();
    $$('[data-edit-addr]').forEach(b => b.onclick = () => addressModal(M.addresses.find(a => a.id === b.dataset.editAddr)));
    $$('[data-del-addr]').forEach(b => b.onclick = () => U.confirmDialog('Delete address?', 'This address will be removed from your account.', () => toast('Address deleted', 'info')));
    if ($('#saveProf')) $('#saveProf').onclick = () => toast('Profile updated');
    if ($('#changePw')) $('#changePw').onclick = () => modal({ title: 'Change password', size: 'modal-sm',
      body: `<div class="col gap-4"><div class="field"><label class="label">Current password</label><input class="input" type="password" value="••••••••"></div>
        <div class="field"><label class="label">New password</label><input class="input" type="password"></div>
        <div class="field"><label class="label">Confirm new password</label><input class="input" type="password"></div></div>`,
      foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="pwOk">Update</button>`,
      onOpen(r) { $('#pwOk', r).onclick = () => { closeModal(); toast('Password updated'); }; } });
    if ($('#addMoney')) $('#addMoney').onclick = () => toast('Wallet top-up flow — demo only', 'info');
    if ($('#addPay')) $('#addPay').onclick = () => toast('Add payment method — demo only', 'info');
    $$('[data-ticket]').forEach(b => b.onclick = () => modal({ title: 'Raise a ticket — ' + b.dataset.ticket, size: 'modal-sm',
      body: `<div class="col gap-4"><div class="field"><label class="label">Related order / booking</label>
        <select class="select"><option>BZ100241 — Samsung 55" TV</option><option>SB50019 — AC Installation</option></select></div>
        <div class="field"><label class="label">Describe the issue</label><textarea class="textarea"></textarea></div></div>`,
      foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="tOk">Submit</button>`,
      onOpen(r) { $('#tOk', r).onclick = () => { closeModal(); toast('Ticket raised — we will call you in 30 mins'); }; } }));
  };

  /* ============ ORDER DETAIL (unified timeline) ============ */
  route('order', args => {
    const id = args[0];
    let o = Store.state.orders.find(x => x.id === id);
    let src = 'user';
    if (!o) {
      const d = M.orders.find(x => x.id === id);
      if (!d) return '<div class="container section">Order not found.</div>';
      src = 'demo';
      o = { id: d.id, date: d.date, status: d.status, total: d.total, payment: d.payment, courier: d.courier, awb: d.awb,
        address: 'Home — ' + d.city,
        items: d.items.filter(i => !i.type).map(i => ({ name: productById(i.pid).name, emoji: productById(i.pid).emoji,
          qty: i.qty, price: i.price, variantLabel: i.variant, id: i.pid })),
        services: d.items.filter(i => i.type === 'service').map(i => ({ name: pkgById(i.pid).name, price: i.price, id: i.pid })) };
    }
    const idx = Math.max(0, M.orderTimeline.findIndex(s => s.label === 'Delivered'));
    const statusIndex = { Placed: 0, Confirmed: 0, Packed: 1, Shipped: 3, 'Out for Delivery': 4, Delivered: 5,
      Cancelled: 0, Returned: 5, Refunded: 5 }[o.status] ?? 0;
    const bookings = (Store.state.bookings.filter(b => b.fromOrder === o.id))
      .concat((o.services || []).length && !Store.state.bookings.some(b => b.fromOrder === o.id)
        ? o.services.map((s, i) => ({ id: 'SB5001' + i, name: s.name, date: 'Tomorrow', slot: '11:00 AM',
            status: 'Booking Confirmed', amount: s.price })) : []);
    return `<div class="container section">
      <div class="crumbs"><a href="#/account/orders">My Orders</a><span>›</span><span>${esc(o.id)}</span></div>
      <div class="row-between mb-5 wrap gap-3">
        <div><h2 class="h3">Order ${esc(o.id)}</h2>
          <p class="muted small mt-1">Placed on ${dateFmt(o.date)} · ${inr(o.total)} · ${esc(o.payment || 'UPI')}</p></div>
        <div class="row gap-2">${badge(o.status)}
          <button class="btn btn-outline btn-sm" id="invoice">${icon('download', 14)} Invoice</button>
          ${['Delivered', 'Cancelled', 'Returned', 'Refunded'].includes(o.status) ? '' :
            '<button class="btn btn-outline btn-sm" id="cancelOrd">Cancel order</button>'}</div></div>

      <div class="grid" style="grid-template-columns:minmax(0,1fr) 360px">
        <div class="col gap-5">
          <div class="card"><div class="card-head"><b class="h5">Delivery timeline</b>
            <span class="tiny muted">${esc(o.courier || 'Delhivery')} · AWB ${esc(o.awb || '—')}</span></div>
            <div class="card-body"><div class="timeline">${M.orderTimeline.map((s, i) => `
              <div class="tl-item ${i < statusIndex ? 'done' : i === statusIndex ? 'current' : ''}">
                <div class="tl-title">${esc(s.label)}</div>
                <div class="tl-meta">${esc(s.note)}${i <= statusIndex ? ' · ' + dateFmt(new Date(new Date(o.date).getTime() + i * 86400000)) : ''}</div>
              </div>`).join('')}</div></div></div>

          ${bookings.length ? `<div class="card" style="border-color:var(--secondary)">
            <div class="card-head"><b class="h5">🧰 Service appointment</b>
              <span class="badge badge-primary badge-plain">Unified timeline</span></div>
            <div class="card-body">${bookings.map(b => `
              <div class="row-between mb-4"><div class="col"><b>${esc(b.name)}</b>
                <span class="small muted">${esc(b.date)} at ${esc(b.slot)} · ${inr(b.amount)}</span></div>
                <a class="btn btn-outline btn-sm" href="#/booking/${b.id}">Track</a></div>
              <div class="timeline">${M.bookingTimeline.slice(0, 3).map((s, i) => `
                <div class="tl-item ${i === 0 ? 'done' : i === 1 ? 'current' : ''}">
                  <div class="tl-title">${esc(s.label)}</div><div class="tl-meta">${esc(s.note)}</div></div>`).join('')}</div>`).join('')}
            </div></div>` : ''}

          <div class="card"><div class="card-head"><b class="h5">Items in this order</b></div>
            <div class="card-body">${(o.items || []).map(i => `<div class="row gap-4" style="padding:12px 0;border-bottom:1px solid var(--border)">
              <img src="${ph(i.id || i.name, i.emoji || '📦', '')}" style="width:64px;height:64px;border-radius:10px">
              <div class="col grow"><b class="small">${esc(i.name)}</b>
                <span class="tiny muted">${esc(i.variantLabel || 'Standard')} · Qty ${i.qty || 1}</span>
                <div class="row gap-2 mt-2"><button class="btn btn-ghost btn-sm" data-rebuy="${esc(i.id || '')}">Buy again</button>
                  <button class="btn btn-ghost btn-sm" data-return>Return / Replace</button></div></div>
              <b>${inr(i.price * (i.qty || 1))}</b></div>`).join('')}
              ${(o.services || []).map(s => `<div class="row gap-4" style="padding:12px 0">
                <span style="font-size:28px">🧰</span><div class="col grow"><b class="small">${esc(s.name)}</b>
                  <span class="tiny muted">Service appointment</span></div><b>${inr(s.price)}</b></div>`).join('')}
            </div></div>
        </div>

        <div class="col gap-4">
          <div class="card card-pad"><b class="small">${icon('pin', 15)} Delivery address</b>
            <p class="small muted mt-2">${esc(o.address || 'Home — Andheri East, Mumbai 400060')}</p></div>
          <div class="card card-pad"><b class="small">${icon('wallet', 15)} Payment summary</b>
            <div class="mt-3"><div class="sum-row"><span class="muted">Item total</span><span>${inr(Math.round(o.total * .93))}</span></div>
              <div class="sum-row"><span class="muted">Delivery</span><span style="color:var(--success)">FREE</span></div>
              <div class="sum-row"><span class="muted">Tax</span><span>${inr(Math.round(o.total * .05))}</span></div>
              <div class="sum-row total"><span>Paid</span><span>${inr(o.total)}</span></div></div></div>
          <div class="card card-pad"><b class="small">Need help?</b>
            <p class="tiny muted mt-2">Chat with support about this order, reschedule the service or raise a return.</p>
            <a class="btn btn-outline btn-sm btn-block mt-3" href="#/account/support">Contact support</a></div>
        </div></div></div>`;
  });
  afterRender.order = () => {
    if ($('#cancelOrd')) $('#cancelOrd').onclick = () => confirmDialog('Cancel this order?',
      'Refund is initiated immediately and reaches your account in 3–5 working days.',
      () => toast('Order cancelled — refund initiated', 'info'), 'Cancel order');
    if ($('#invoice')) $('#invoice').onclick = () => toast('Invoice PDF downloaded (demo)');
    $$('[data-return]').forEach(b => b.onclick = () => modal({ title: 'Return or replace', size: 'modal-sm',
      body: `<div class="col gap-4"><div class="field"><label class="label">Reason</label>
        <select class="select"><option>Damaged on arrival</option><option>Wrong item delivered</option>
          <option>Size / fit issue</option><option>No longer needed</option></select></div>
        <div class="field"><label class="label">Preferred resolution</label>
          <select class="select"><option>Refund to source</option><option>Replace with same item</option><option>Bazaar Wallet credit</option></select></div>
        <div class="field"><label class="label">Comments</label><textarea class="textarea"></textarea></div></div>`,
      foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="rOk">Raise request</button>`,
      onOpen(r) { $('#rOk', r).onclick = () => { closeModal(); toast('Return requested — pickup in 2 days'); }; } }));
    $$('[data-rebuy]').forEach(b => b.onclick = () => {
      const p = productById(b.dataset.rebuy);
      if (p) { Store.addProduct(p, p.variants[0]); syncHeader(); toast('Added to cart'); }
      else toast('Item unavailable', 'error');
    });
  };

  /* ============ BOOKING TRACKING ============ */
  route('booking', args => {
    const id = args[0];
    let b = Store.state.bookings.find(x => x.id === id);
    if (!b) {
      const d = M.bookings.find(x => x.id === id) || M.bookings[0];
      const pkg = pkgById(d.pkg);
      b = { id: d.id, name: pkg.name, emoji: svcCatById(pkg.catId).icon, date: dateFmt(d.date), slot: d.slot,
        status: d.status, amount: d.amount, address: d.address, pro: d.pro };
    }
    const stageIdx = Math.max(0, M.bookingTimeline.findIndex(s => s.key === b.status));
    const pro = b.pro ? U.proById(b.pro) : M.professionals[0];
    return `<div class="container section">
      <div class="crumbs"><a href="#/account/bookings">Service Bookings</a><span>›</span><span>${esc(b.id)}</span></div>
      <div class="row-between mb-5 wrap gap-3">
        <div class="row gap-4"><span style="font-size:34px">${b.emoji || '🧰'}</span>
          <div class="col"><h2 class="h3">${esc(b.name)}</h2>
            <p class="muted small">${esc(b.id)} · ${esc(b.date)} at ${esc(b.slot)} · ${inr(b.amount)}</p></div></div>
        <div class="row gap-2">${badge(b.status)}
          <button class="btn btn-outline btn-sm" id="resched">Reschedule</button>
          <button class="btn btn-outline btn-sm" id="cancelBk">Cancel</button></div></div>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) 360px">
        <div class="card"><div class="card-head"><b class="h5">Booking progress</b></div>
          <div class="card-body"><div class="timeline">${M.bookingTimeline.map((s, i) => `
            <div class="tl-item ${i < stageIdx ? 'done' : i === stageIdx ? 'current' : ''}">
              <div class="tl-title">${esc(s.label)}</div><div class="tl-meta">${esc(s.note)}</div></div>`).join('')}</div>
            ${stageIdx >= 5 ? `<div class="tile mt-5"><b class="small">Rate your experience</b>
              <div class="row gap-1 mt-2" id="rateRow">${[1, 2, 3, 4, 5].map(i =>
                `<button data-s="${i}" style="font-size:26px;color:var(--n-300)">★</button>`).join('')}</div></div>` : ''}
          </div></div>
        <div class="col gap-4">
          <div class="card card-pad"><b class="small">Your professional</b>
            <div class="row gap-3 mt-3"><div class="avatar avatar-lg">${esc(pro.photo)}</div>
              <div class="col"><b>${esc(pro.name)}</b><span class="tiny muted">${stars(pro.rating)} · ${num(pro.jobs)} jobs · ${esc(pro.exp)}</span>
                <span class="badge badge-success badge-plain mt-2">${pro.verified ? 'Background verified' : 'Verification pending'}</span></div></div>
            <div class="row gap-2 mt-4"><button class="btn btn-outline btn-sm grow" id="callPro">Call</button>
              <button class="btn btn-outline btn-sm grow" id="chatPro">Chat</button></div></div>
          <div class="card card-pad"><b class="small">${icon('pin', 15)} Service address</b>
            <p class="small muted mt-2">${esc(b.address || 'Home — Andheri East, Mumbai')}</p>
            ${b.notes ? `<p class="tiny mt-2">Instructions: ${esc(b.notes)}</p>` : ''}</div>
          <div class="card card-pad"><b class="small">Payment</b>
            <div class="sum-row mt-2"><span class="muted">Service charge</span><span>${inr(b.amount)}</span></div>
            <div class="sum-row total"><span>Total</span><span>${inr(b.amount)}</span></div>
            <p class="tiny muted mt-2">Paid online · invoice available after completion.</p></div>
          <div class="card card-pad" style="border-color:var(--secondary)"><b class="small">🔁 Repeat this service</b>
            <p class="tiny muted mt-2">Most customers repeat AC service every 6 months.</p>
            <a class="btn btn-sm mt-3" style="background:var(--secondary);color:#fff" href="services.html">Book again</a></div>
        </div></div></div>`;
  });
  afterRender.booking = () => {
    if ($('#resched')) $('#resched').onclick = () => {
      const dates = nextDates(6);
      modal({ title: 'Reschedule booking',
        body: `<p class="small muted mb-3">Free rescheduling up to 4 hours before the slot.</p>
          <div class="date-strip">${dates.map((d, i) => `<button class="date-box ${i === 1 ? 'on' : ''}" data-date="${d.iso}">
            <div class="d">${d.label || d.day}</div><div class="n">${d.num}</div><div class="d">${d.mon}</div></button>`).join('')}</div>
          <div class="slot-grid mt-4">${M.timeSlots.map((s, i) => `<button class="slot ${i === 1 ? 'on' : ''}" data-slot="${s}">${s}</button>`).join('')}</div>`,
        foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="rsOk">Confirm new slot</button>`,
        onOpen(r) {
          $$('[data-date]', r).forEach(b => b.onclick = () => { $$('[data-date]', r).forEach(x => x.classList.remove('on')); b.classList.add('on'); });
          $$('[data-slot]', r).forEach(b => b.onclick = () => { $$('[data-slot]', r).forEach(x => x.classList.remove('on')); b.classList.add('on'); });
          $('#rsOk', r).onclick = () => { closeModal(); toast('Booking rescheduled'); };
        } });
    };
    if ($('#cancelBk')) $('#cancelBk').onclick = () => confirmDialog('Cancel booking?',
      'Free cancellation up to 4 hours before the slot. Refund reaches you in 3 working days.',
      () => toast('Booking cancelled', 'info'), 'Cancel booking');
    if ($('#callPro')) $('#callPro').onclick = () => toast('Connecting via masked number…', 'info');
    if ($('#chatPro')) $('#chatPro').onclick = () => toast('Chat opened (demo)', 'info');
    if ($('#rateRow')) $$('#rateRow button').forEach(b => b.onclick = () => {
      const r = +b.dataset.s;
      $$('#rateRow button').forEach(x => x.style.color = +x.dataset.s <= r ? 'var(--warning)' : 'var(--n-300)');
      toast('Thanks for rating ' + r + '★');
    });
  };

  /* ============ SERVICES (redirect to the dedicated marketplace) ============ */
  route('services', () => { location.href = 'services.html'; return ''; });

  /* ============ AUTH ============ */
  const authArt = `<div class="auth-art">
    <a href="#/home" class="logo" style="color:#fff"><span class="mark">B</span><span>Bazaar</span></a>
    <h2 class="h2" style="max-width:20ch">One account for everything you buy and book.</h2>
    ${[['🛍️', 'Shop 12,000+ products', 'Fashion, electronics, home and appliances'],
       ['🧰', 'Book verified professionals', 'AC service, cleaning, salon, repairs'],
       ['📦', 'One unified timeline', 'Deliveries and appointments side by side'],
       ['🎁', 'Member offers', 'Coupons, wallet cashback and early access']]
      .map(([e, t, d]) => `<div class="pt"><span class="em">${e}</span>
        <span class="col"><b>${t}</b><small style="opacity:.7">${d}</small></span></div>`).join('')}</div>`;

  route('login', (a, q) => `<div class="auth-wrap">${authArt}
    <div class="auth-form"><div class="inner">
      <h3 class="h3">Login to Bazaar</h3>
      <p class="muted small mt-2">Use your mobile number or email.</p>
      <div class="seg mt-5" id="loginMode"><button class="is-active" data-m="otp">Mobile + OTP</button>
        <button data-m="pw">Email + Password</button></div>
      <div class="col gap-4 mt-5" id="loginBody"></div>
      <div class="row gap-3 mt-6" style="align-items:center"><hr class="grow" style="border:none;border-top:1px solid var(--border)">
        <span class="tiny soft">OR</span><hr class="grow" style="border:none;border-top:1px solid var(--border)"></div>
      <div class="social mt-4">
        <button>🔵 Google</button><button>⚫ Apple</button><button>🔷 Facebook</button></div>
      <p class="small muted center mt-6">New to Bazaar? <a href="#/register" style="color:var(--primary);font-weight:700">Create an account</a></p>
      <p class="tiny soft center mt-4">Demo login — any value works.</p>
    </div></div></div>`);
  afterRender.login = (a, q) => {
    let mode = 'otp';
    const body = $('#loginBody');
    const paint = () => {
      body.innerHTML = mode === 'otp'
        ? `<div class="field"><label class="label">Mobile number</label>
             <div class="row gap-2"><span class="input" style="width:64px;display:grid;place-items:center">+91</span>
             <input class="input" id="mob" placeholder="98200 41122" value="98200 41122"></div></div>
           <button class="btn btn-primary btn-lg btn-block" id="sendOtp">Send OTP</button>`
        : `<div class="field"><label class="label">Email</label><input class="input" id="em" value="aarav.sharma@example.in"></div>
           <div class="field"><label class="label">Password</label><input class="input" type="password" value="password123"></div>
           <div class="row-between"><label class="check"><input type="checkbox" checked> Keep me signed in</label>
             <a href="#/forgot" class="tiny bold" style="color:var(--primary)">Forgot password?</a></div>
           <button class="btn btn-primary btn-lg btn-block" id="pwLogin">Login</button>`;
      if ($('#sendOtp')) $('#sendOtp').onclick = () => go('#/otp?next=' + (q.next || ''));
      if ($('#pwLogin')) $('#pwLogin').onclick = () => { Store.login(); toast('Welcome back, Aarav'); go(q.next === 'checkout' ? '#/checkout' : '#/home'); };
    };
    $$('#loginMode button').forEach(b => b.onclick = () => {
      $$('#loginMode button').forEach(x => x.classList.remove('is-active')); b.classList.add('is-active');
      mode = b.dataset.m; paint();
    });
    paint();
  };

  route('otp', (a, q) => `<div class="auth-wrap">${authArt}
    <div class="auth-form"><div class="inner">
      <button class="btn btn-ghost btn-sm mb-4" onclick="history.back()">${icon('back', 15)} Back</button>
      <h3 class="h3">Verify your number</h3>
      <p class="muted small mt-2">We sent a 6-digit code to <b>+91 98200 41122</b></p>
      <div class="otp-row mt-6" id="otpRow">${[0, 1, 2, 3, 4, 5].map(i =>
        `<input maxlength="1" inputmode="numeric" value="${[1, 2, 3, 4, 5, 6][i]}">`).join('')}</div>
      <button class="btn btn-primary btn-lg btn-block mt-6" id="verify">Verify &amp; continue</button>
      <p class="small muted center mt-4">Didn't get it? <button id="resend" style="color:var(--primary);font-weight:700">Resend in <span id="rs">28</span>s</button></p>
      <p class="tiny soft center mt-4">Demo OTP is pre-filled — just press verify.</p>
    </div></div></div>`);
  afterRender.otp = (a, q) => {
    const inputs = $$('#otpRow input');
    inputs.forEach((el2, i) => el2.oninput = () => { if (el2.value && inputs[i + 1]) inputs[i + 1].focus(); });
    $('#verify').onclick = () => { Store.login(); toast('Logged in successfully'); go(q.next === 'checkout' ? '#/checkout' : '#/home'); };
    let s = 28; const t = setInterval(() => { s--; const n = $('#rs'); if (!n) return clearInterval(t); n.textContent = s; if (s <= 0) clearInterval(t); }, 1000);
    $('#resend').onclick = () => toast('OTP resent', 'info');
  };

  route('register', () => `<div class="auth-wrap">${authArt}
    <div class="auth-form"><div class="inner">
      <h3 class="h3">Create your account</h3>
      <p class="muted small mt-2">Takes under a minute.</p>
      <div class="col gap-4 mt-5">
        <div class="field"><label class="label">Full name</label><input class="input" id="rn" placeholder="Aarav Sharma"></div>
        <div class="field"><label class="label">Mobile number</label>
          <div class="row gap-2"><span class="input" style="width:64px;display:grid;place-items:center">+91</span>
            <input class="input" placeholder="98200 41122"></div></div>
        <div class="field"><label class="label">Email</label><input class="input" placeholder="you@example.in"></div>
        <div class="field"><label class="label">Password</label><input class="input" type="password" placeholder="Minimum 8 characters">
          <span class="hint">Use 8+ characters with a number and a symbol.</span></div>
        <label class="check"><input type="checkbox" id="tc"> I agree to the <a href="#/home" style="color:var(--primary)">Terms</a>
          and <a href="#/home" style="color:var(--primary)">Privacy Policy</a></label>
        <button class="btn btn-primary btn-lg btn-block" id="reg">Send OTP &amp; continue</button>
      </div>
      <p class="small muted center mt-6">Already have an account? <a href="#/login" style="color:var(--primary);font-weight:700">Login</a></p>
    </div></div></div>`);
  afterRender.register = () => {
    $('#reg').onclick = () => {
      if (!$('#tc').checked) return toast('Please accept the terms to continue', 'error');
      go('#/otp');
    };
  };

  route('forgot', () => `<div class="auth-wrap">${authArt}
    <div class="auth-form"><div class="inner">
      <h3 class="h3">Forgot password</h3>
      <p class="muted small mt-2">We'll send a reset link to your registered email.</p>
      <div class="field mt-5"><label class="label">Email or mobile</label><input class="input" value="aarav.sharma@example.in"></div>
      <button class="btn btn-primary btn-lg btn-block mt-4" id="fp">Send reset link</button>
      <a class="btn btn-ghost btn-block mt-3" href="#/login">Back to login</a>
    </div></div></div>`);
  afterRender.forgot = () => $('#fp').onclick = () => go('#/reset');

  route('reset', () => `<div class="auth-wrap">${authArt}
    <div class="auth-form"><div class="inner">
      <h3 class="h3">Set a new password</h3>
      <p class="muted small mt-2">Choose something you haven't used before.</p>
      <div class="field mt-5"><label class="label">New password</label><input class="input" type="password"></div>
      <div class="field mt-4"><label class="label">Confirm password</label><input class="input" type="password"></div>
      <button class="btn btn-primary btn-lg btn-block mt-5" id="rp">Reset password</button>
    </div></div></div>`);
  afterRender.reset = () => $('#rp').onclick = () => { toast('Password reset — please login'); go('#/login'); };

  /* ============ BOOT ============ */
  function boot() {
    $('#header').innerHTML = headerHTML();
    $('#footer').innerHTML = footerHTML();
    bindHeader();
    window.addEventListener('hashchange', render);
    window.addEventListener('theme:change', render);
    Store.subscribe(syncHeader);
    render();
    U.protoBar('index.html');
  }
  document.addEventListener('DOMContentLoaded', boot);
})(window);
