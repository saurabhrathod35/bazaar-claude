/* ============================================================
   BAZAAR — dev-mode.js
   Live request tracer. Toggle "Dev Mode" on any prototype screen
   and every action shows the API call it would make in production:
   endpoint, service, hop-by-hop path, payload, events, timing.
   Loads after ui.js; patches UI.Store + admin form saves.
   ============================================================ */
(function (global) {
  'use strict';
  const U = global.UI, D = global.DEVDATA;
  if (!U || !D) return;
  const { $, $$, esc } = U;

  /* ---------- extra lightweight operations (UI-level writes) ---------- */
  const extraOps = {
    'cart.updateQty': { title: 'Change cart quantity', method: 'PATCH', path: '/v1/cart/items/{lineId}',
      service: 'cart', auth: 'Bearer JWT', cache: 'None', slo: 'p95 < 180 ms',
      steps: [['web', 'Client request', 'PATCH { qty }', 0], ['gw', 'API Gateway', 'Auth + route', 4],
        ['cart', 'cart-service', 'Update line quantity', 10],
        ['inventory', 'inventory-service (gRPC)', 'Soft availability check for the new quantity', 14],
        ['pricing', 'pricing-promo-service', 'Re-evaluate coupon eligibility and totals', 17],
        ['pg', 'Postgres', 'UPDATE cart row', 5]],
      request: { qty: 2 }, response: { lineId: 'ln_2', qty: 2, subtotal: 85998 }, events: [] },
    'cart.removeItem': { title: 'Remove cart line', method: 'DELETE', path: '/v1/cart/items/{lineId}',
      service: 'cart', auth: 'Bearer JWT', cache: 'None', slo: 'p95 < 150 ms',
      steps: [['web', 'Client request', 'DELETE line', 0], ['gw', 'API Gateway', 'Auth', 4],
        ['cart', 'cart-service', 'Remove line · drop dependent service line if its product left the cart', 12],
        ['pricing', 'pricing-promo-service', 'Recalculate; may invalidate the applied coupon', 15],
        ['kafka', 'Event queue', 'emit cart.item_removed', 3]],
      request: {}, response: { lineCount: 1, subtotal: 1499 }, events: [['kafka', 'cart.item_removed']] },
    'wishlist.toggle': { title: 'Toggle wishlist', method: 'POST', path: '/v1/wishlist/items',
      service: 'identity', auth: 'Bearer JWT', cache: 'None', slo: 'p95 < 120 ms',
      steps: [['web', 'Client request', 'POST { productId }', 0], ['gw', 'API Gateway', 'Auth', 4],
        ['identity', 'identity-service', 'Upsert or delete the wishlist row', 11],
        ['pg', 'Postgres', 'INSERT … ON CONFLICT DO DELETE', 9],
        ['kafka', 'Event queue', 'emit wishlist.updated → feeds price-drop alerts', 3]],
      request: { productId: 'p6' }, response: { wishlisted: true, count: 4 },
      events: [['kafka', 'wishlist.updated'], ['analytics', 'add_to_wishlist']] },
    'catalog.detail': { title: 'Open product detail', method: 'GET', path: '/v1/catalog/products/{id}',
      service: 'catalog', auth: 'Optional', cache: 'CDN 120s', slo: 'p95 < 200 ms',
      steps: [['web', 'Client request', 'SSR fetch on the server, hydrated on the client', 0],
        ['cdn', 'CDN', 'ISR page cache, revalidate 120s', 7],
        ['gw', 'API Gateway', 'Route', 4],
        ['catalog', 'catalog-service', 'Product + variants + specs + seller', 20],
        ['inventory', 'inventory-service', 'Per-variant availability for the pincode', 16],
        ['pricing', 'pricing-promo-service', 'Live offers applicable to this product', 14],
        ['booking', 'booking-service', 'Cross-sell: matching service package for this category', 18],
        ['search', 'search-service', 'Similar and also-viewed products', 22]],
      request: {}, response: { id: 'p6', variants: 9, offers: 3, crossSell: 'pk-ac-install', deliveryBy: 'in 2 days' },
      events: [['analytics', 'view_item']] },
    'booking.slots': { title: 'Fetch available slots', method: 'GET', path: '/v1/bookings/slots',
      query: '?packageId=pk-ac-basic&pincode=400060&from=2026-08-10&days=7',
      service: 'booking', auth: 'Optional', cache: 'None', slo: 'p95 < 160 ms',
      steps: [['web', 'Client request', 'Date strip + slot grid load together', 0],
        ['gw', 'API Gateway', 'Route', 4],
        ['booking', 'booking-service', 'Capacity per city × category × window', 16],
        ['allocation', 'allocation-service (gRPC)', 'Live pro supply for that window (blocks slots with no capacity)', 21],
        ['pg', 'Postgres', 'SELECT … FROM slots WHERE city, date — always current, no cache lag', 6]],
      request: {}, response: { '2026-08-11': [{ time: '09:00 AM', open: true }, { time: '01:00 PM', open: false }] }, events: [] },
    'admin.list': { title: 'Load admin module', method: 'GET', path: '/v1/admin/{module}',
      service: 'varies by module', auth: 'Bearer JWT · RBAC scoped', cache: 'None (always fresh)', slo: 'p95 < 350 ms',
      steps: [['admin', 'Admin console', 'TanStack Query fetch with filters and pagination', 0],
        ['gw', 'API Gateway', 'Auth · RBAC check against the role permission matrix', 8],
        ['catalog', 'Owning service', 'Query with admin-level projection (includes drafts, costs)', 26],
        ['pgro', 'Postgres replica', 'Paginated SELECT with count(*) over()', 38],
        ['analytics', 'analytics-collector', 'Log the admin view for the audit trail', 6]],
      request: {}, response: { rows: 24, total: 128, page: 1 }, events: [['kafka', 'admin.viewed']] },
    'analytics.query': { title: 'Load analytics dashboard', method: 'GET', path: '/v1/analytics/dashboard',
      query: '?range=7d&metrics=revenue,orders,bookings,aov', service: 'analytics', auth: 'Bearer JWT · scope analytics:view',
      cache: 'CDN 300s', slo: 'p95 < 700 ms',
      steps: [['admin', 'Admin console', 'One request per dashboard, not per card', 0],
        ['gw', 'API Gateway', 'Auth', 6],
        ['analytics', 'analytics-collector', 'Fan out to pre-aggregated rollups', 24],
        ['es', 'ClickHouse', 'Rollup tables (hourly → daily) keep p95 under a second', 210]],
      request: {}, response: { revenue: 3464000, orders: 2373, bookings: 569, aov: 2841 }, events: [] }
  };
  const allOps = Object.assign({}, D.ops, extraOps);

  /* ---------- state ---------- */
  const KEY = 'bazaar.devmode';
  let on = false;
  try { on = localStorage.getItem(KEY) === '1'; } catch (e) {}
  const log = [];
  let seq = 0;

  /* ---------- rendering ---------- */
  const jitter = ms => Math.max(1, Math.round(ms * (0.85 + Math.random() * 0.3)));
  const hostOf = id => D.hosts[id] || { name: id, host: id, tier: 'service' };

  function entryHTML(t) {
    const maxMs = Math.max(...t.steps.map(s => s[3])) || 1;
    return `<div class="dev-entry" data-i="${t.i}">
      <div class="dev-entry-head">
        <span class="dev-m ${t.method}">${t.method}</span>
        <span class="dev-path">${esc(t.path)}${t.query ? esc(t.query) : ''}</span>
        <span class="dev-ms">${t.total} ms</span>
        <span class="dev-status">${t.method === 'JOB' ? 'OK' : t.status}</span>
      </div>
      <div class="dev-body">
        <div class="dev-meta">
          <span>Operation</span><span>${esc(t.title)}</span>
          <span>Owning svc</span><span>${esc(t.service)}</span>
          <span>Auth</span><span>${esc(t.auth)}</span>
          <span>Cache</span><span>${esc(t.cache)}</span>
          <span>Target SLO</span><span>${esc(t.slo)}</span>
          <span>Trace id</span><span>${esc(t.traceId)}</span>
        </div>
        <div class="dev-sec-t">Request path — ${t.steps.length} hops</div>
        ${t.steps.map(([hid, who, what, ms]) => { const h = hostOf(hid);
          return `<div class="dev-step" data-tier="${h.tier}">
            <div class="rail"><i></i><u></u></div>
            <div><div class="who">${esc(who)}</div>
              <div class="host">${esc(h.host)}</div>
              <div class="what">${esc(what)}</div>
              ${ms ? `<div class="bar" style="width:${Math.max(4, ms / maxMs * 100)}%"></div>
                <div class="host">${ms} ms</div>` : ''}</div></div>`; }).join('')}
        ${Object.keys(t.request || {}).length ? `<div class="dev-sec-t">Request payload</div>
          <div class="dev-code">${esc(JSON.stringify(t.request, null, 2))}</div>` : ''}
        <div class="dev-sec-t">Response ${t.method === 'JOB' ? '' : '· ' + t.status}</div>
        <div class="dev-code">${esc(JSON.stringify(t.response, null, 2))}</div>
        ${t.events && t.events.length ? `<div class="dev-sec-t">Events emitted</div>
          ${t.events.map(([bus, name]) => `<span class="dev-ev">${esc(bus)} → ${esc(name)}</span>`).join('')}` : ''}
        ${t.failure ? `<div class="dev-sec-t">Failure path</div><div class="dev-warn">${esc(t.failure)}</div>` : ''}
      </div></div>`;
  }

  function paint() {
    const box = $('#devLog'); if (!box) return;
    box.innerHTML = log.length ? log.map(entryHTML).join('')
      : `<div class="dev-empty">No calls yet.<br><br>
         Interact with the prototype — add to cart, apply a coupon, place an order, book a service,
         save something in admin — and each action's real API call appears here.<br><br>
         Or replay any operation from the dropdown above.</div>`;
    $$('.dev-entry-head', box).forEach(h => h.onclick = () => h.parentNode.classList.toggle('open'));
    if (log.length) box.firstElementChild.classList.add('open');
  }

  /* ---------- the tracer ---------- */
  function trace(key, overrides) {
    const spec = allOps[key]; if (!spec) return;
    const steps = spec.steps.map(s => [s[0], s[1], s[2], jitter(s[3])]);
    const t = Object.assign({}, spec, {
      i: ++seq, steps, status: '200 OK',
      total: steps.reduce((s, x) => s + x[3], 0),
      traceId: '4bf92f' + Math.random().toString(16).slice(2, 12),
      request: Object.assign({}, spec.request, (overrides || {}).request),
      response: Object.assign({}, spec.response, (overrides || {}).response)
    }, overrides && overrides.meta || {});
    log.unshift(t);
    if (log.length > 40) log.pop();
    if (on) { paint(); const b = $('#devCount'); if (b) b.textContent = seq; }
  }

  /* ---------- panel ---------- */
  function mount() {
    const panel = U.el('aside', { class: 'dev-panel', id: 'devPanel' }, `
      <div class="dev-head">
        <span class="live">Dev Mode</span>
        <b>Request tracer</b>
        <span class="grow"></span>
        <button id="devClear">Clear</button>
        <a href="dev.html" style="color:#a693fa;font-size:11px;font-weight:700;padding:4px 8px">Full spec →</a>
        <button id="devClose">✕</button>
      </div>
      <div class="dev-sub">
        <select id="devReplay">
          <option value="">Replay an operation…</option>
          ${Object.keys(allOps).map(k => `<option value="${k}">${esc(allOps[k].title)}</option>`).join('')}
        </select>
        <button class="btn-run" id="devRun">Run</button>
      </div>
      <div class="dev-log" id="devLog"></div>`);
    document.body.appendChild(panel);

    const toggle = U.el('button', { class: 'dev-toggle', id: 'devToggle' },
      `${U.icon('layers', 15)} Dev Mode <span id="devCount" style="opacity:.6">0</span>`);
    document.body.appendChild(toggle);

    toggle.onclick = () => setOpen(!on);
    $('#devClose').onclick = () => setOpen(false);
    $('#devClear').onclick = () => { log.length = 0; seq = 0; $('#devCount').textContent = '0'; paint(); };
    $('#devRun').onclick = () => {
      const k = $('#devReplay').value;
      if (!k) return U.toast('Choose an operation to replay', 'error');
      trace(k); U.toast('Traced: ' + allOps[k].title, 'info');
    };
    setOpen(on);
  }

  function setOpen(v) {
    on = v;
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {}
    $('#devPanel').classList.toggle('open', v);
    $('#devToggle').classList.toggle('on', v);
    document.body.classList.toggle('dev-on', v);
    if (v) paint();
  }

  /* ---------- patch the store so real interactions emit traces ---------- */
  function patchStore() {
    const S = U.Store;
    const wrap = (name, key, mk) => {
      const orig = S[name]; if (!orig) return;
      S[name] = function () {
        const out = orig.apply(S, arguments);
        try { trace(key, mk ? mk.apply(null, [out].concat([].slice.call(arguments))) : null); } catch (e) {}
        return out;
      };
    };
    wrap('addProduct', 'cart.addProduct', (out, product, variant, qty) => ({
      request: { kind: 'product', variantId: (variant || product.variants[0]).id, qty: qty || 1 },
      response: { cartId: 'crt_91f2', lineCount: S.state.cart.length, subtotal: S.totals().subtotal,
        suggestedServices: (U.crossSellFor(product) || {}).pkg ? [U.crossSellFor(product).pkg.id] : [] }
    }));
    wrap('addService', 'cart.addService', (out, pkg) => ({
      request: { kind: 'service', packageId: pkg.id },
      response: { lineCount: S.state.cart.length, subtotal: S.totals().subtotal, requiresSlot: true }
    }));
    wrap('updateQty', 'cart.updateQty', () => ({ response: { subtotal: S.totals().subtotal } }));
    wrap('removeLine', 'cart.removeItem', () => ({ response: { lineCount: S.state.cart.length, subtotal: S.totals().subtotal } }));
    wrap('toggleWishlist', 'wishlist.toggle', (out, id) => ({
      request: { productId: id }, response: { wishlisted: out, count: S.state.wishlist.length } }));
    wrap('applyCoupon', 'pricing.coupon', (out, code) => ({
      request: { code: String(code).toUpperCase() },
      meta: out && out.ok ? null : { status: '422 Unprocessable', response: { error: { code: 'COUPON_INELIGIBLE', message: out.msg } } },
      response: out && out.ok ? { applied: true, discount: S.totals().couponOff, total: S.totals().total } : undefined
    }));
    wrap('placeOrder', 'order.place', (out) => ({
      request: { cartId: 'crt_91f2', payment: out.payment, address: out.address },
      response: { orderId: out.id, status: 'CONFIRMED', total: out.total,
        bookingIds: S.state.bookings.filter(b => b.fromOrder === out.id).map(b => b.id), awb: out.awb }
    }));
    wrap('login', 'identity.otp', () => ({ response: { user: S.state.user } }));
  }

  /* ---------- patch admin writes ---------- */
  const ADMIN_OP = {
    products: 'catalog.upsert', categories: 'catalog.upsert', brands: 'catalog.upsert', variants: 'catalog.upsert',
    sizes: 'catalog.upsert', attributes: 'catalog.upsert', inventory: 'inventory.adjust', orders: 'order.status',
    coupons: 'pricing.coupon', offers: 'pricing.coupon', campaigns: 'notify.campaign', notifications: 'notify.campaign',
    bookings: 'allocation.assign', professionals: 'allocation.assign', packages: 'catalog.upsert',
    'svc-categories': 'catalog.upsert'
  };
  function patchAdmin() {
    // Admin writes all funnel through a success toast — the most reliable hook,
    // since view modules capture UI helpers by reference at load time.
    const origToast = U.toast;
    U.toast = function (msg, type) {
      if (!type || type === 'success') {
        const key = (location.hash.replace(/^#\/?/, '') || '').split('/')[0];
        try { trace(ADMIN_OP[key] || 'admin.list', { request: { action: msg } }); } catch (e) {}
      }
      return origToast.apply(U, arguments);
    };
    window.addEventListener('hashchange', adminRouteTrace);
    adminRouteTrace();
  }
  function adminRouteTrace() {
    const key = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/')[0];
    if (/^an-|dashboard/.test(key)) trace('analytics.query', { request: { module: key } });
    else trace('admin.list', { request: { module: key }, meta: { path: '/v1/admin/' + key } });
  }

  /* ---------- storefront route traces ---------- */
  function patchStorefront() {
    const map = () => {
      const r = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
      if (r[0] === 'plp') trace('catalog.list', { request: { category: r[1] || 'all' } });
      else if (r[0] === 'pdp') trace('catalog.detail', { meta: { path: '/v1/catalog/products/' + (r[1] || '') } });
      else if (r[0] === 'search') trace('search.universal');
      else if (r[0] === 'cat' || r[0] === 'pkg') trace('booking.slots');
      else if (r[0] === 'home') trace('catalog.list', { request: { section: 'home-rails' } });
    };
    window.addEventListener('hashchange', map);
    map();
  }

  /* ---------- boot ---------- */
  function boot() {
    mount();
    patchStore();
    if (global.ADMIN) patchAdmin(); else patchStorefront();
  }
  global.DEV = { trace, setOpen, ops: allOps };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
