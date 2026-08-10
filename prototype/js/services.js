/* ============================================================
   BAZAAR — services.js
   Service marketplace: discovery, packages, booking wizard,
   booking tracking, professional profiles. Shares the super cart.
   ============================================================ */
(function (global) {
  'use strict';
  const M = global.MOCK, U = global.UI;
  const { $, $$, esc, inr, num, icon, badge, stars, ph, Store, toast, modal, closeModal, drawer, closeDrawer,
          confirmDialog, pkgById, svcCatById, nextDates, dateFmt } = U;

  const app = () => $('#view');
  const routes = {}, after = {};
  const route = (n, f) => routes[n] = f;
  const go = h => location.hash = h;
  global.go = go;

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '') || 'home';
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    const q = {}; (qs || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); q[k] = decodeURIComponent(v || ''); });
    return { name: parts[0] || 'home', args: parts.slice(1), q };
  }
  function render() {
    const r = parseHash();
    window.scrollTo(0, 0);
    app().innerHTML = (routes[r.name] || routes.home)(r.args, r.q) || '';
    if (after[r.name]) after[r.name](r.args, r.q);
    syncHeader();
  }

  /* ---------- header ---------- */
  function headerHTML() {
    return `<div class="header-top"><div class="container">
        <span>🧰 Verified professionals · 30-day service warranty · Live in 6 cities</span>
        <span class="row gap-4 hide-md"><a href="index.html">Shop products</a><a href="admin.html">Admin</a></span>
      </div></div>
      <div class="container header-main">
        <a href="index.html" class="logo"><span class="mark">B</span>
          <span>Bazaar<small>Services</small></span></a>
        <button class="loc-btn hide-md" id="locBtn">${icon('pin', 18)}
          <span class="col"><span class="l1">Service city</span><span class="l2" id="locLabel">Mumbai</span></span>
          ${icon('chevronDown', 14)}</button>
        <div class="header-search"><div class="search-box">${icon('search', 18)}
          <input id="q" placeholder="Search services — AC service, cleaning, salon…" autocomplete="off"></div>
          <div id="suggest"></div></div>
        <div class="header-actions">
          <a class="icon-btn" href="index.html#/account/bookings" title="Bookings">${icon('calendar')}</a>
          <a class="icon-btn" href="index.html#/cart" title="Cart">${icon('cart')}<span class="dot hide" id="cartDot">0</span></a>
          <a class="icon-btn" href="index.html#/account/profile" title="Account">${icon('user')}</a>
        </div></div>
      <div class="nav-bar"><div class="container">
        <a class="nav-link" href="#/home">All services</a>
        ${M.serviceCategories.slice(0, 6).map(c => `<a class="nav-link" href="#/cat/${c.id}">${esc(c.name)}</a>`).join('')}
        <a class="nav-link" href="#/pros">Our professionals</a>
        <a class="nav-link" href="index.html">Shop products →</a>
      </div></div>`;
  }
  function syncHeader() {
    const t = Store.totals(), d = $('#cartDot');
    if (d) { d.textContent = t.count; d.classList.toggle('hide', !t.count); }
    const l = $('#locLabel'); if (l) l.textContent = Store.state.city;
  }
  function bindHeader() {
    const q = $('#q'), sug = $('#suggest');
    q.oninput = () => {
      const v = q.value.trim().toLowerCase();
      if (v.length < 2) return sug.innerHTML = '';
      const hits = M.servicePackages.filter(p => (p.name + svcCatById(p.catId).name).toLowerCase().includes(v)).slice(0, 7);
      const prods = M.products.filter(p => (p.name + p.brand).toLowerCase().includes(v)).slice(0, 3);
      sug.innerHTML = `<div class="suggest">
        <div class="grp">Services</div>
        ${hits.length ? hits.map(p => `<button class="item" data-go="#/pkg/${p.id}">
          <span class="em">${svcCatById(p.catId).icon}</span><span class="col"><b class="small">${esc(p.name)}</b>
          <span class="tiny muted">${inr(p.price)} · ${esc(p.duration)}</span></span></button>`).join('')
          : '<div class="table-empty small">No services matched</div>'}
        ${prods.length ? '<div class="grp">Products on Bazaar</div>' + prods.map(p => `
          <button class="item" data-ext="index.html#/pdp/${p.id}"><span class="em">${p.emoji}</span>
          <span class="col"><b class="small">${esc(p.name)}</b><span class="tiny muted">${inr(p.price)}</span></span></button>`).join('') : ''}
      </div>`;
      $$('#suggest .item').forEach(b => b.onclick = () => {
        sug.innerHTML = ''; q.value = '';
        if (b.dataset.ext) location.href = b.dataset.ext; else go(b.dataset.go);
      });
    };
    document.addEventListener('click', e => { if (!$('.header-search').contains(e.target)) sug.innerHTML = ''; });
    $('#locBtn').onclick = () => modal({ title: 'Choose your service city', size: 'modal-sm',
      body: `<div class="col gap-2">${M.serviceAreas.map(a => `
        <button class="addr-card row-between ${a.city === Store.state.city ? 'on' : ''}" data-city="${esc(a.city)}"
          ${a.status === 'Planned' ? 'style="opacity:.5;pointer-events:none"' : ''}>
          <span class="col"><b>${esc(a.city)}</b><span class="tiny muted">${a.pros} professionals · ${a.cats} categories</span></span>
          ${badge(a.status)}</button>`).join('')}</div>`,
      onOpen(root) { $$('[data-city]', root).forEach(b => b.onclick = () => {
        Store.set({ city: b.dataset.city }); closeModal(); syncHeader(); toast('Showing services in ' + b.dataset.city); render(); }); } });
  }

  /* ---------- shared bits ---------- */
  function pkgRow(p) {
    const c = svcCatById(p.catId);
    return `<div class="card card-pad row-between gap-4 wrap">
      <div class="row gap-4"><span style="font-size:30px">${c.icon}</span>
        <div class="col"><b>${esc(p.name)}</b>
          <span class="tiny muted">${stars(p.rating)} (${num(p.reviews)}) · ${esc(p.duration)}</span>
          <span class="row gap-2 mt-2"><b>${inr(p.price)}</b><span class="strike tiny">${inr(p.mrp)}</span>
            <span class="pct">${Math.round((1 - p.price / p.mrp) * 100)}% off</span></span></div></div>
      <div class="row gap-2"><a class="btn btn-outline btn-sm" href="#/pkg/${p.id}">Details</a>
        <button class="btn btn-primary btn-sm" data-book="${p.id}">Book</button></div></div>`;
  }
  function bindBook(root = document) {
    $$('[data-book]', root).forEach(b => b.onclick = () => go('#/book/' + b.dataset.book));
    $$('[data-add]', root).forEach(b => b.onclick = () => {
      const ok = Store.addService(pkgById(b.dataset.add)); syncHeader();
      toast(ok ? 'Added to cart — schedule at checkout' : 'Already in your cart', ok ? 'success' : 'info');
    });
  }

  /* ============ HOME ============ */
  route('home', () => {
    const popular = ['pk-ac-basic', 'pk-clean-bath', 'pk-salon-glow', 'pk-elec-visit', 'pk-ac-install', 'pk-pest-general'].map(pkgById);
    const bundles = M.servicePackages.filter(p => p.bundleFor);
    return `
    <section class="svc-hero"><div class="container">
      <div style="max-width:640px">
        <span class="eyebrow" style="color:var(--secondary)">Bazaar Services</span>
        <h1 class="h1 mt-3" style="font-size:44px;line-height:1.1">Need help at home?<br>Book trusted professionals.</h1>
        <p class="mt-4" style="color:rgba(255,255,255,.72);font-size:16px">
          Background-verified experts, upfront pricing and a 30-day service warranty.
          Book in under a minute — and pay only after the job is done.</p>
        <div class="row gap-3 mt-6 wrap">
          <a class="btn btn-lg btn-accent" href="#/cat/sv-ac">Book AC Service</a>
          <a class="btn btn-lg btn-outline" href="index.html" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.35)">
            Shop products</a></div>
        <div class="hero-badges">
          <span>⭐ 4.8 average rating</span><span>🧰 480+ professionals</span>
          <span>🏙️ 6 cities live</span><span>🛡️ 30-day warranty</span></div>
      </div></div></section>

    <section class="section"><div class="container">
      <div class="section-head"><div><h3 class="h3">What do you need help with?</h3>
        <p class="muted small mt-2">Available in ${esc(Store.state.city)} today</p></div></div>
      <div class="svc-cat-grid">${M.serviceCategories.map(c => `
        <a class="svc-cat" href="#/cat/${c.id}">
          <span class="em" style="background:${c.color}22">${c.icon}</span>
          <span class="col grow"><b class="h5">${esc(c.name)}</b>
            <span class="small muted">${esc(c.desc)}</span>
            <span class="tiny mt-2">${stars(c.rating)} · ${c.bookings} bookings</span></span>
          ${icon('chevron', 18)}</a>`).join('')}</div>
    </div></section>

    <section class="section" style="background:var(--surface)"><div class="container">
      <div class="section-head"><h3 class="h3">Most booked this week</h3></div>
      <div class="grid grid-2">${popular.map(pkgRow).join('')}</div>
    </div></section>

    <section class="section"><div class="container">
      <div class="card card-pad" style="background:linear-gradient(120deg,var(--primary-900),var(--primary));color:#fff;border:none">
        <div class="row-between wrap gap-5">
          <div style="max-width:52ch"><span class="eyebrow" style="color:var(--accent)">⚡ Bazaar exclusive</span>
            <h3 class="h3 mt-2" style="color:#fff">Buy the product. Book the pro. One cart.</h3>
            <p class="mt-3" style="color:rgba(255,255,255,.75)">
              Bought an AC, TV, washing machine or furniture on Bazaar? Add professional installation
              or assembly to the same order and we schedule the visit right after delivery.</p></div>
          <div class="col gap-2" style="min-width:280px">${bundles.slice(0, 3).map(b => `
            <div class="row-between gap-3" style="background:rgba(255,255,255,.1);padding:12px 14px;border-radius:12px">
              <span class="col"><b class="small">${esc(b.name)}</b>
                <span class="tiny" style="opacity:.7">${esc(b.duration)}</span></span>
              <span class="row gap-2"><b>${inr(b.price)}</b>
                <button class="btn btn-sm btn-accent" data-add="${b.id}">Add</button></span></div>`).join('')}</div>
        </div></div>
    </div></section>

    <section class="section"><div class="container">
      <div class="section-head"><h3 class="h3">How it works</h3></div>
      <div class="grid grid-4">${[['1', 'Pick a service', 'Transparent packages with fixed prices — no surprises.'],
        ['2', 'Choose date & slot', 'Same-day slots available in most areas.'],
        ['3', 'Pro arrives on time', 'Background-verified, rated by real customers.'],
        ['4', 'Pay & rate', 'Pay after the job. 30-day warranty on every service.']]
        .map(([n, t, d]) => `<div class="tile col gap-2">
          <span class="avatar" style="background:var(--primary);color:#fff">${n}</span>
          <b>${t}</b><span class="small muted">${d}</span></div>`).join('')}</div>
    </div></section>

    <section class="section"><div class="container">
      <div class="section-head"><div><h3 class="h3">Subscriptions &amp; plans</h3>
        <p class="muted small mt-2">Future concept — recurring revenue from maintenance</p></div></div>
      <div class="grid grid-3">${[['Annual AC Maintenance', '₹1,999 / year', '3 scheduled services, priority slots, 10% off repairs', '❄️'],
        ['Monthly Home Cleaning', '₹2,499 / month', '2 deep cleans a month, same professional, free rescheduling', '🧼'],
        ['Beauty Membership', '₹999 / quarter', '15% off all salon services, priority evening slots', '💇']]
        .map(([t, p, d, e]) => `<div class="card card-pad col gap-3">
          <span style="font-size:28px">${e}</span><b class="h5">${t}</b>
          <b style="color:var(--primary)">${p}</b><span class="small muted">${d}</span>
          <button class="btn btn-outline btn-sm mt-2" data-soon>Notify me</button></div>`).join('')}</div>
    </div></section>`;
  });
  after.home = () => { bindBook(); $$('[data-soon]').forEach(b => b.onclick = () => toast('We\'ll notify you at launch', 'info')); };

  /* ============ CATEGORY ============ */
  route('cat', args => {
    const c = svcCatById(args[0]); if (!c) return '<div class="container section">Category not found.</div>';
    const pkgs = M.servicePackages.filter(p => p.catId === c.id);
    const pros = M.professionals.filter(p => p.cats.includes(c.id));
    return `<div class="container section">
      <div class="crumbs"><a href="#/home">Services</a><span>›</span><span>${esc(c.name)}</span></div>
      <div class="card card-pad row-between wrap gap-4 mb-6" style="background:${c.color}14;border-color:${c.color}55">
        <div class="row gap-4"><span style="font-size:40px">${c.icon}</span>
          <div class="col"><h2 class="h2">${esc(c.name)}</h2>
            <p class="muted mt-1">${esc(c.desc)}</p>
            <div class="row gap-3 mt-2"><span class="rating-pill">${c.rating} ★</span>
              <span class="small muted">${c.bookings} bookings · ${pros.length} pros in ${esc(Store.state.city)}</span></div></div></div>
        <div class="col right"><span class="tiny muted">Starting at</span>
          <b class="h3">${inr(Math.min(...pkgs.map(p => p.price)))}</b></div></div>

      <div class="col gap-4">${pkgs.map(p => `
        <div class="pkg-card">
          <div class="col gap-3">
            <div class="row-between gap-3"><div class="col">
              <b class="h5">${esc(p.name)}</b>
              <span class="tiny muted mt-1">${stars(p.rating)} (${num(p.reviews)}) · ${esc(p.duration)}
                ${p.subscription ? '· <span class="badge badge-primary badge-plain">Subscription</span>' : ''}</span></div>
              <div class="col right"><span class="row gap-2"><b class="h4">${inr(p.price)}</b>
                <span class="strike small">${inr(p.mrp)}</span></span>
                <span class="pct">${Math.round((1 - p.price / p.mrp) * 100)}% off</span></div></div>
            <p class="small muted">${esc(p.desc)}</p>
            <ul class="inc-list">${p.includes.slice(0, 3).map(i => `<li><b>✓</b> ${esc(i)}</li>`).join('')}
              ${p.includes.length > 3 ? `<li class="soft">+ ${p.includes.length - 3} more inclusions</li>` : ''}</ul>
            <div class="row gap-2 mt-2"><button class="btn btn-primary" data-book="${p.id}">Book now</button>
              <button class="btn btn-outline" data-add="${p.id}">Add to cart</button>
              <a class="btn btn-ghost" href="#/pkg/${p.id}">View details</a></div>
          </div>
          <div class="art"><img src="${ph(p.id, c.icon, c.name)}" alt="" style="height:100%;object-fit:cover"></div>
        </div>`).join('')}</div>

      <h4 class="h4 mt-8 mb-4">Professionals for ${esc(c.name)}</h4>
      <div class="grid grid-3">${pros.length ? pros.map(proCard).join('')
        : '<p class="muted small">Onboarding professionals in your city.</p>'}</div>
    </div>`;
  });
  after.cat = () => bindBook();

  function proCard(p) {
    return `<div class="pro-card">
      <div class="avatar avatar-lg">${esc(p.photo)}</div>
      <div class="col grow"><div class="row-between"><b>${esc(p.name)}</b>
        ${p.verified ? '<span class="badge badge-success badge-plain">Verified</span>' : badge('Pending')}</div>
        <span class="tiny muted">${stars(p.rating)} · ${num(p.jobs)} jobs · ${esc(p.exp)} experience</span>
        <span class="tiny muted mt-1">${esc(p.area)}</span>
        <div class="row gap-1 mt-2 wrap">${p.skills.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div></div></div>`;
  }

  /* ============ PACKAGE DETAIL ============ */
  route('pkg', args => {
    const p = pkgById(args[0]); if (!p) return '<div class="container section">Package not found.</div>';
    const c = svcCatById(p.catId);
    const related = M.servicePackages.filter(x => x.catId === p.catId && x.id !== p.id);
    return `<div class="container section">
      <div class="crumbs"><a href="#/home">Services</a><span>›</span>
        <a href="#/cat/${c.id}">${esc(c.name)}</a><span>›</span><span>${esc(p.name)}</span></div>
      <div class="pdp">
        <div class="col gap-6">
          <img src="${ph(p.id, c.icon, c.name)}" alt="" style="border-radius:var(--r-lg);aspect-ratio:16/9;object-fit:cover">
          <div class="card"><div class="card-head"><b class="h5">What's included</b></div>
            <div class="card-body grid grid-2">
              <div><b class="small">Included</b><ul class="inc-list mt-2">
                ${p.includes.map(i => `<li><b>✓</b> ${esc(i)}</li>`).join('')}</ul></div>
              <div><b class="small">Not included</b><ul class="inc-list exc-list mt-2">
                ${p.excludes.map(i => `<li><b>✕</b> ${esc(i)}</li>`).join('')}</ul></div></div></div>
          <div class="card"><div class="card-head"><b class="h5">How the visit works</b></div>
            <div class="card-body"><div class="timeline">${M.bookingTimeline.map(s => `
              <div class="tl-item done"><div class="tl-title">${esc(s.label)}</div>
                <div class="tl-meta">${esc(s.note)}</div></div>`).join('')}</div></div></div>
          <div class="card"><div class="card-head"><b class="h5">Ratings &amp; reviews</b>
            <span class="rating-pill">${p.rating} ★ · ${num(p.reviews)} reviews</span></div>
            <div class="card-body">${[['Aarav Sharma', 5, 'On time, neat work, explained everything. Booked again for the second AC.'],
              ['Riya Patel', 5, 'Professional was polite and carried all equipment. Great value at this price.'],
              ['Karthik Iyer', 4, 'Good service, slight delay in arrival but the work quality was solid.']]
              .map(([n, r, t]) => `<div class="review"><div class="row gap-3"><span class="rating-pill">${r} ★</span>
                <b class="small">${n}</b><span class="badge badge-success badge-plain">Verified booking</span></div>
                <p class="small muted mt-2">${t}</p></div>`).join('')}</div></div>
        </div>

        <aside class="col gap-5">
          <div><span class="eyebrow">${c.icon} ${esc(c.name)}</span>
            <h1 class="pdp-title mt-2">${esc(p.name)}</h1>
            <div class="row gap-3 mt-3"><span class="rating-pill">${p.rating} ★</span>
              <span class="small muted">${num(p.reviews)} reviews · ${esc(p.duration)}</span></div></div>
          <div><div class="price-row"><span class="now">${inr(p.price)}</span>
            <span class="strike h5">${inr(p.mrp)}</span>
            <span class="pct" style="font-size:14px">${Math.round((1 - p.price / p.mrp) * 100)}% off</span></div>
            <p class="tiny muted mt-1">Final price — materials charged separately where noted.</p></div>
          <p class="muted small">${esc(p.desc)}</p>
          <div class="row gap-3"><button class="btn btn-primary btn-lg grow" data-book="${p.id}">Book this service</button>
            <button class="btn btn-outline btn-lg" data-add="${p.id}">Add to cart</button></div>
          <div class="trust">${[['🛡️', '30-day warranty'], ['🧾', 'Upfront pricing'], ['⏱️', 'On-time promise'], ['🔁', 'Free reschedule']]
            .map(([e, t]) => `<div><div class="em">${e}</div><small>${t}</small></div>`).join('')}</div>
          <div class="card card-pad"><b class="small">${icon('calendar', 15)} Next available slots</b>
            <div class="row gap-2 mt-3 wrap">${M.timeSlots.slice(0, 4).map(s =>
              `<span class="chip">Today ${esc(s)}</span>`).join('')}</div></div>
          <div class="card card-pad"><b class="small">${icon('tag', 15)} Offer</b>
            <div class="offer-item mt-2"><span class="em">${icon('percent', 16)}</span>
              <div class="col"><b class="small">₹100 off with SERVICE100</b>
                <span class="tiny muted">On service bookings above ₹299</span></div></div></div>
        </aside></div>

      ${related.length ? `<div class="section-head mt-8"><h3 class="h3">Other ${esc(c.name)} packages</h3></div>
        <div class="grid grid-2">${related.map(pkgRow).join('')}</div>` : ''}
    </div>`;
  });
  after.pkg = () => bindBook();

  /* ============ BOOKING WIZARD ============ */
  const bk = { step: 1, pkgId: null, addr: 'ad1', date: null, slot: null, notes: '', pay: 'upi', extras: [] };
  const BK_STEPS = ['Service', 'Package', 'Address', 'Date & Slot', 'Payment'];

  route('book', args => {
    if (args[0] && bk.pkgId !== args[0]) { Object.assign(bk, { step: 2, pkgId: args[0], date: null, slot: null, extras: [] }); }
    return `<div class="container section">
      <div class="row-between mb-5 wrap gap-3">
        <h2 class="h2">Book a service</h2>
        <a class="btn btn-ghost btn-sm" href="#/home">Cancel</a></div>
      <div class="stepper mb-6">${BK_STEPS.map((s, i) => `
        <span class="step ${bk.step > i + 1 ? 'done' : ''} ${bk.step === i + 1 ? 'is-active' : ''}">
          <span class="n">${bk.step > i + 1 ? '✓' : i + 1}</span>${s}</span>
        ${i < BK_STEPS.length - 1 ? '<span class="step-line"></span>' : ''}`).join('')}</div>
      <div class="checkout">
        <div class="card card-pad" id="bkBox">${bookStep()}</div>
        <div class="summary card card-pad" id="bkSum">${bookSummary()}</div>
      </div></div>`;
  });

  function bookStep() {
    const pkg = bk.pkgId ? pkgById(bk.pkgId) : null;
    if (bk.step === 1) {
      return `<h4 class="h4 mb-4">Select a service category</h4>
        <div class="grid grid-2">${M.serviceCategories.map(c => `
          <button class="svc-cat" data-cat="${c.id}"><span class="em" style="background:${c.color}22">${c.icon}</span>
            <span class="col grow"><b>${esc(c.name)}</b><span class="tiny muted">${esc(c.desc)}</span></span>
            ${icon('chevron', 16)}</button>`).join('')}</div>`;
    }
    if (bk.step === 2) {
      const cat = pkg ? svcCatById(pkg.catId) : svcCatById(bk.catId || 'sv-ac');
      const list = M.servicePackages.filter(p => p.catId === cat.id);
      return `<div class="row-between mb-4"><h4 class="h4">Choose a package — ${esc(cat.name)}</h4>
        <button class="btn btn-ghost btn-sm" data-back>Change category</button></div>
        <div class="col gap-3">${list.map(p => `
          <label class="addr-card ${bk.pkgId === p.id ? 'on' : ''}" data-pkg="${p.id}">
            <div class="row-between gap-3"><div class="col"><b>${esc(p.name)}</b>
              <span class="tiny muted">${esc(p.duration)} · ${stars(p.rating)} (${num(p.reviews)})</span>
              <span class="tiny muted mt-1">${esc(p.desc)}</span></div>
              <div class="col right nowrap"><b>${inr(p.price)}</b><span class="strike tiny">${inr(p.mrp)}</span></div></div>
          </label>`).join('')}</div>
        <div class="mt-5"><b class="small">Add-ons</b>
          <div class="row gap-2 mt-2 wrap">${[['Gas top-up check', 299], ['Extra unit (+1)', 399], ['Deep coil wash', 249]]
            .map(([l, p]) => `<button class="chip ${bk.extras.some(e => e.l === l) ? 'is-active' : ''}"
              data-extra="${esc(l)}" data-p="${p}">${esc(l)} +${inr(p)}</button>`).join('')}</div></div>
        <div class="row gap-3 mt-6"><button class="btn btn-outline" data-back>Back</button>
          <button class="btn btn-primary grow" data-next>Continue to address</button></div>`;
    }
    if (bk.step === 3) {
      return `<div class="row-between mb-4"><h4 class="h4">Where should we come?</h4>
        <button class="btn btn-outline btn-sm" id="newAddr">${icon('plus', 14)} Add address</button></div>
        <div class="col gap-3">${M.addresses.map(a => `
          <label class="addr-card ${bk.addr === a.id ? 'on' : ''}" data-addr="${a.id}">
            <div class="row-between"><span class="row gap-2"><b>${esc(a.label)}</b>
              ${a.default ? '<span class="badge badge-primary badge-plain">Default</span>' : ''}</span>
              <span class="tiny muted">${esc(a.phone)}</span></div>
            <p class="small muted mt-2">${esc(a.line)}, ${esc(a.area)}, ${esc(a.city)} — ${esc(a.pin)}</p></label>`).join('')}</div>
        <div class="row gap-3 mt-6"><button class="btn btn-outline" data-back>Back</button>
          <button class="btn btn-primary grow" data-next>Continue to date &amp; slot</button></div>`;
    }
    if (bk.step === 4) {
      const dates = nextDates(7);
      return `<h4 class="h4 mb-4">Pick a date</h4>
        <div class="date-strip">${dates.map(d => `<button class="date-box ${bk.date === d.iso ? 'on' : ''}" data-date="${d.iso}">
          <div class="d">${d.label || d.day}</div><div class="n">${d.num}</div><div class="d">${d.mon}</div></button>`).join('')}</div>
        <h4 class="h4 mt-6 mb-3">Pick a time slot</h4>
        <div class="slot-grid">${M.timeSlots.map((s, i) => `
          <button class="slot ${bk.slot === s ? 'on' : ''} ${i === 2 ? 'full' : ''}" data-slot="${esc(s)}">
            ${esc(s)}${i === 2 ? '<br><span class="tiny">Full</span>' : ''}</button>`).join('')}</div>
        <div class="field mt-6"><label class="label">Instructions for the professional (optional)</label>
          <textarea class="textarea" id="bkNotes" placeholder="e.g. Second floor, no lift. Call before arriving.">${esc(bk.notes)}</textarea></div>
        <div class="row gap-3 mt-6"><button class="btn btn-outline" data-back>Back</button>
          <button class="btn btn-primary grow" data-next>Continue to payment</button></div>`;
    }
    if (bk.step === 5) {
      const methods = [['upi', 'UPI', '🟣', 'GPay, PhonePe, Paytm'], ['card', 'Credit / Debit Card', '💳', 'Visa, Mastercard, RuPay'],
        ['wallet', 'Bazaar Wallet', '👛', 'Balance ₹1,250'], ['cod', 'Pay after service', '💵', 'Cash or UPI to the professional']];
      return `<h4 class="h4 mb-4">Payment</h4>
        <div class="col gap-3">${methods.map(([k, l, e, d]) => `
          <label class="pay-opt ${bk.pay === k ? 'on' : ''}" data-pay="${k}"><span class="em">${e}</span>
            <span class="col grow"><b class="small">${l}</b><span class="tiny muted">${d}</span></span>
            ${bk.pay === k ? icon('check', 18) : ''}</label>`).join('')}</div>
        <div class="row gap-3 mt-6"><button class="btn btn-outline" data-back>Back</button>
          <button class="btn btn-accent btn-lg grow" id="confirmBk">Confirm booking</button></div>
        <p class="tiny muted center mt-3">🔒 Demo booking — no real payment is processed.</p>`;
    }
    return '';
  }

  function bookSummary() {
    const pkg = bk.pkgId ? pkgById(bk.pkgId) : null;
    const extras = bk.extras.reduce((s, e) => s + e.p, 0);
    const base = pkg ? pkg.price : 0;
    const total = base + extras;
    const addr = M.addresses.find(a => a.id === bk.addr);
    return `<b class="h5">Booking summary</b>
      ${pkg ? `<div class="row gap-3 mt-4"><span style="font-size:26px">${svcCatById(pkg.catId).icon}</span>
        <div class="col"><b class="small">${esc(pkg.name)}</b>
          <span class="tiny muted">${esc(pkg.duration)} · ${pkg.rating}★</span></div></div>`
        : '<p class="small muted mt-3">Select a service to see pricing.</p>'}
      ${bk.extras.length ? `<div class="mt-3">${bk.extras.map(e => `<div class="sum-row"><span class="muted">${esc(e.l)}</span>
        <span>${inr(e.p)}</span></div>`).join('')}</div>` : ''}
      <hr class="divider">
      <div class="sum-row"><span class="muted">Service charge</span><span>${inr(base)}</span></div>
      ${extras ? `<div class="sum-row"><span class="muted">Add-ons</span><span>${inr(extras)}</span></div>` : ''}
      <div class="sum-row"><span class="muted">Visit fee</span><span style="color:var(--success)">FREE</span></div>
      <div class="sum-row total"><span>Total</span><span>${inr(total)}</span></div>
      <hr class="divider">
      <div class="col gap-2 tiny muted">
        <div class="row gap-2">${icon('pin', 14)} ${addr ? esc(addr.label + ' — ' + addr.area + ', ' + addr.city) : 'Address pending'}</div>
        <div class="row gap-2">${icon('calendar', 14)} ${bk.date ? dateFmt(bk.date) : 'Date pending'}</div>
        <div class="row gap-2">${icon('clock', 14)} ${bk.slot ? esc(bk.slot) : 'Slot pending'}</div></div>
      <div class="tile mt-4"><b class="tiny">🛡️ 30-day service warranty</b>
        <p class="tiny muted mt-1">Free revisit if the issue repeats within 30 days.</p></div>`;
  }

  after.book = () => {
    const repaint = () => {
      $('#bkBox').innerHTML = bookStep();
      $('#bkSum').innerHTML = bookSummary();
      $$('.stepper .step').forEach((s, i) => {
        s.classList.toggle('done', bk.step > i + 1);
        s.classList.toggle('is-active', bk.step === i + 1);
        s.querySelector('.n').textContent = bk.step > i + 1 ? '✓' : i + 1;
      });
      bind();
    };
    function bind() {
      $$('[data-cat]').forEach(b => b.onclick = () => { bk.catId = b.dataset.cat; bk.pkgId = null; bk.step = 2; repaint(); });
      $$('[data-pkg]').forEach(b => b.onclick = () => { bk.pkgId = b.dataset.pkg; repaint(); });
      $$('[data-extra]').forEach(b => b.onclick = () => {
        const l = b.dataset.extra, p = +b.dataset.p;
        const i = bk.extras.findIndex(e => e.l === l);
        i > -1 ? bk.extras.splice(i, 1) : bk.extras.push({ l, p });
        repaint();
      });
      $$('[data-addr]').forEach(b => b.onclick = () => { bk.addr = b.dataset.addr; repaint(); });
      $$('[data-date]').forEach(b => b.onclick = () => { bk.date = b.dataset.date; repaint(); });
      $$('[data-slot]').forEach(b => b.onclick = () => { bk.slot = b.dataset.slot; repaint(); });
      $$('[data-pay]').forEach(b => b.onclick = () => { bk.pay = b.dataset.pay; repaint(); });
      const n = $('#bkNotes'); if (n) n.oninput = () => bk.notes = n.value;
      $$('[data-next]').forEach(b => b.onclick = () => {
        if (bk.step === 2 && !bk.pkgId) return toast('Choose a package to continue', 'error');
        if (bk.step === 4 && (!bk.date || !bk.slot)) return toast('Pick a date and a time slot', 'error');
        bk.step++; repaint();
      });
      $$('[data-back]').forEach(b => b.onclick = () => { bk.step = Math.max(1, bk.step - 1); repaint(); });
      if ($('#newAddr')) $('#newAddr').onclick = () => modal({ title: 'Add address', size: 'modal-sm',
        body: `<div class="col gap-3">
          <div class="field"><label class="label">Flat / House</label><input class="input"></div>
          <div class="field"><label class="label">Area</label><input class="input"></div>
          <div class="field"><label class="label">Pincode</label><input class="input" maxlength="6"></div></div>`,
        foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="aOk">Save</button>`,
        onOpen(r) { $('#aOk', r).onclick = () => { closeModal(); toast('Address saved'); }; } });
      if ($('#confirmBk')) $('#confirmBk').onclick = confirmBooking;
    }
    function confirmBooking() {
      const btn = $('#confirmBk'); btn.innerHTML = 'Confirming…'; btn.classList.add('is-disabled');
      setTimeout(() => {
        const pkg = pkgById(bk.pkgId);
        const addr = M.addresses.find(a => a.id === bk.addr);
        const id = 'SB' + (50020 + Store.state.bookings.length);
        const booking = { id, pkgId: pkg.id, name: pkg.name, emoji: svcCatById(pkg.catId).icon,
          date: dateFmt(bk.date), slot: bk.slot, status: 'Booking Confirmed',
          amount: pkg.price + bk.extras.reduce((s, e) => s + e.p, 0),
          address: `${addr.label} — ${addr.area}, ${addr.city}`, notes: bk.notes };
        Store.set({ bookings: [booking].concat(Store.state.bookings) });
        go('#/booked/' + id);
      }, 1000);
    }
    bind();
  };

  /* ============ BOOKING CONFIRMATION ============ */
  route('booked', args => {
    const b = Store.state.bookings.find(x => x.id === args[0]) || Store.state.bookings[0];
    if (!b) return '<div class="container section">No booking found.</div>';
    const pkg = pkgById(b.pkgId);
    return `<div class="container section"><div class="card">
      <div class="success-hero"><div class="tick">✓</div>
        <h2 class="h2">Booking confirmed</h2>
        <p class="muted mt-2">${esc(b.name)} · <b>${esc(b.date)} at ${esc(b.slot)}</b></p>
        <p class="small muted mt-1">Booking ID ${esc(b.id)} · ${inr(b.amount)}</p>
        <div class="row gap-3 mt-6" style="justify-content:center">
          <a class="btn btn-primary" href="index.html#/booking/${b.id}">Track booking</a>
          <a class="btn btn-outline" href="#/home">Book another service</a></div></div>
      <div class="card-body" style="border-top:1px solid var(--border)">
        <div class="grid grid-3">
          <div class="tile"><b class="small">${icon('user', 15)} Professional</b>
            <p class="tiny muted mt-2">Assigned 2 hours before the slot. You'll get their name, photo and live location.</p></div>
          <div class="tile"><b class="small">${icon('pin', 15)} Address</b>
            <p class="tiny muted mt-2">${esc(b.address)}</p></div>
          <div class="tile"><b class="small">${icon('shield', 15)} Warranty</b>
            <p class="tiny muted mt-2">30 days on this service. Free revisit if the issue repeats.</p></div></div>
        ${pkg ? `<div class="bundle mt-6"><span class="flag">${icon('zap', 13)} Customers also bought</span>
          <div class="row-between gap-3 mt-3 wrap"><div class="row gap-3">
            <span style="font-size:26px">🛍️</span><div class="col"><b class="small">Products that pair with this service</b>
              <span class="tiny muted">AC covers, filters, stabilisers and more on Bazaar</span></div></div>
            <a class="btn btn-sm" style="background:var(--secondary);color:#fff" href="index.html#/plp/all">Shop now</a></div></div>` : ''}
      </div></div></div>`;
  });

  /* ============ PROFESSIONALS ============ */
  route('pros', () => `<div class="container section">
    <h2 class="h2">Our professionals</h2>
    <p class="muted mt-2">Every professional is background-verified, skill-tested and rated after each job.</p>
    <div class="grid grid-4 mt-4">${[['480+', 'Active professionals'], ['4.8★', 'Average rating'],
      ['96%', 'On-time arrival'], ['6', 'Cities live']].map(([n, l]) =>
      `<div class="tile center"><b class="h2">${n}</b><span class="small muted">${l}</span></div>`).join('')}</div>
    <div class="grid grid-2 mt-6">${M.professionals.filter(p => p.status === 'Active').map(proCard).join('')}</div>
    <div class="card card-pad mt-8" style="background:linear-gradient(120deg,var(--secondary-100),var(--primary-50))">
      <div class="row-between wrap gap-4"><div class="col">
        <b class="h4">Are you a skilled professional?</b>
        <p class="muted small mt-2">Join Bazaar Services — steady jobs, weekly payouts, free training and insurance.</p></div>
        <button class="btn btn-primary" id="joinPro">Partner with us</button></div></div>
  </div>`);
  after.pros = () => $('#joinPro').onclick = () => modal({ title: 'Partner as a professional', size: 'modal-sm',
    body: `<div class="col gap-3">
      <div class="field"><label class="label">Full name</label><input class="input"></div>
      <div class="field"><label class="label">Mobile</label><input class="input" placeholder="+91"></div>
      <div class="field"><label class="label">Primary skill</label>
        <select class="select">${M.serviceCategories.map(c => `<option>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="field"><label class="label">City</label>
        <select class="select">${M.serviceAreas.map(a => `<option>${esc(a.city)}</option>`).join('')}</select></div></div>`,
    foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="jOk">Submit</button>`,
    onOpen(r) { $('#jOk', r).onclick = () => { closeModal(); toast('Application received — our team will call you'); }; } });

  /* ============ FOOTER + BOOT ============ */
  function footerHTML() {
    return `<div class="container"><div class="foot-grid">
      <div><a href="index.html" class="logo" style="color:#fff"><span class="mark">B</span><span>Bazaar</span></a>
        <p class="small mt-3" style="max-width:34ch">Buy it. Book it. Install it. Maintain it. One platform.</p></div>
      <div><h6>Services</h6>${M.serviceCategories.slice(0, 5).map(c => `<a href="#/cat/${c.id}">${esc(c.name)}</a>`).join('')}</div>
      <div><h6>For customers</h6><a href="index.html#/account/bookings">My bookings</a><a href="index.html#/cart">Cart</a>
        <a href="index.html#/account/support">Support</a><a href="#/pros">Professionals</a></div>
      <div><h6>For professionals</h6><a href="#/pros">Partner with us</a><a href="#/pros">Training</a><a href="#/pros">Payouts</a></div>
      <div><h6>Company</h6><a href="index.html">Shop products</a><a href="admin.html">Admin</a><a href="mobile.html">Mobile app</a></div>
    </div>
    <div class="foot-bottom"><span>© 2026 Bazaar Commerce Pvt Ltd · Prototype — data is fictional.</span></div></div>`;
  }

  function boot() {
    $('#header').innerHTML = headerHTML();
    $('#footer').innerHTML = footerHTML();
    bindHeader();
    window.addEventListener('hashchange', render);
    window.addEventListener('theme:change', render);
    Store.subscribe(syncHeader);
    render();
    U.protoBar('services.html');
  }
  document.addEventListener('DOMContentLoaded', boot);
})(window);
