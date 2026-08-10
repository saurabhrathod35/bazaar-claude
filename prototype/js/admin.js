/* ============================================================
   BAZAAR — admin.js  (part 1 of 2)
   Shell, sidebar routing, dashboard, orders and catalog modules.
   Part 2 (admin-modules.js) registers marketing, customers,
   services, logistics, analytics and settings views into ADMIN.views.
   ============================================================ */
(function (global) {
  'use strict';
  const M = global.MOCK, U = global.UI;
  const { $, $$, esc, inr, inrShort, num, dateFmt, timeAgo, icon, badge, stars, table, ph, Chart,
          toast, modal, closeModal, drawer, closeDrawer, confirmDialog, productById, pkgById,
          svcCatById, customerById, proById } = U;

  /* ---------- module registry (filled by both files) ---------- */
  const ADMIN = global.ADMIN = { views: {}, after: {}, go, refresh, formModal, listShell, pageHead };
  const view = (key, render, afterFn) => { ADMIN.views[key] = render; if (afterFn) ADMIN.after[key] = afterFn; };
  ADMIN.view = view;

  /* ---------- navigation model ---------- */
  const NAV = [
    { group: null, items: [['dashboard', 'Dashboard', 'grid']] },
    { group: 'Commerce', items: [['orders', 'Orders', 'box', 4], ['products', 'Products', 'tag'],
      ['categories', 'Categories', 'layers'], ['brands', 'Brands', 'shield'], ['variants', 'Variants', 'copy'],
      ['sizes', 'Sizes', 'edit'], ['attributes', 'Attributes', 'settings'], ['inventory', 'Inventory', 'box', 3],
      ['reviews', 'Reviews', 'star']] },
    { group: 'Marketing', items: [['offers', 'Offers', 'percent'], ['coupons', 'Coupons', 'tag'],
      ['campaigns', 'Campaigns', 'zap'], ['notifications', 'Notifications', 'bell']] },
    { group: 'Customers', items: [['users', 'Users', 'users'], ['segments', 'Segments', 'layers']] },
    { group: 'Services', items: [['svc-categories', 'Service Categories', 'tools'], ['packages', 'Packages', 'box'],
      ['bookings', 'Bookings', 'calendar', 2], ['professionals', 'Professionals', 'users'],
      ['availability', 'Availability', 'clock'], ['areas', 'Service Areas', 'pin']] },
    { group: 'Logistics', items: [['shipments', 'Shipments', 'truck'], ['shipping-providers', 'Shipping Providers', 'truck'],
      ['warehouses', 'Warehouses', 'home']] },
    { group: 'Analytics', items: [['an-sales', 'Sales', 'chart'], ['an-customers', 'Customers', 'users'],
      ['an-products', 'Products', 'tag'], ['an-inventory', 'Inventory', 'box'], ['an-services', 'Services', 'tools']] },
    { group: 'Settings', items: [['set-business', 'Business', 'home'], ['set-payments', 'Payments', 'wallet'],
      ['set-shipping', 'Shipping APIs', 'truck'], ['set-notifications', 'Notifications', 'bell'],
      ['roles', 'Roles & Permissions', 'shield'], ['integrations', 'Integrations', 'share'], ['api-keys', 'API Keys', 'settings']] }
  ];
  const TITLES = {};
  NAV.forEach(g => g.items.forEach(i => TITLES[i[0]] = i[1]));

  /* ---------- routing ---------- */
  function current() { return (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/')[0]; }
  function args() { return (location.hash.replace(/^#\/?/, '') || '').split('/').slice(1); }
  function go(k) { location.hash = '#/' + k; }
  function refresh() { paint(); }

  function paint() {
    const key = current();
    const fn = ADMIN.views[key] || ADMIN.views.dashboard;
    $('#adminTitle').textContent = TITLES[key] || 'Dashboard';
    $('#adminCrumb').textContent = crumbFor(key);
    $('#content').innerHTML = fn(args()) || '';
    if (ADMIN.after[key]) ADMIN.after[key](args());
    $$('.sb-link').forEach(a => a.classList.toggle('is-active', a.dataset.k === key));
    window.scrollTo(0, 0);
    $('.sidebar').classList.remove('open');
  }
  function crumbFor(key) {
    const g = NAV.find(g => g.items.some(i => i[0] === key));
    return (g && g.group ? g.group + ' / ' : 'Bazaar Admin / ') + (TITLES[key] || '');
  }

  /* ---------- shared page helpers ---------- */
  function pageHead(title, sub, actions) {
    return `<div class="list-toolbar" style="justify-content:space-between">
      <div><h2 class="h3">${esc(title)}</h2>${sub ? `<p class="muted small mt-1">${esc(sub)}</p>` : ''}</div>
      <div class="row gap-2">${actions || ''}</div></div>`;
  }
  /** Standard list page: toolbar (search + filters) + table pane. */
  function listShell({ title, sub, actions, filters, tableHTML, footer }) {
    return `${pageHead(title, sub, actions)}
      ${filters ? `<div class="list-toolbar">${filters}</div>` : ''}
      <div class="pane"><div class="pane-body tight">${tableHTML}</div>
        ${footer !== false ? `<div class="pager"><span class="tiny muted" id="rowCount"></span>
          <div class="row gap-2"><button class="btn btn-outline btn-sm">Previous</button>
            <button class="btn btn-outline btn-sm">1</button><button class="btn btn-ghost btn-sm">2</button>
            <button class="btn btn-outline btn-sm">Next</button></div></div>` : ''}</div>`;
  }
  /** Generic create/edit modal from a field spec. */
  function formModal(title, fields, onSave, size = '') {
    const input = f => {
      if (f.type === 'select') return `<select class="select" data-f="${f.k}">${f.options.map(o =>
        `<option ${String(o) === String(f.value) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      if (f.type === 'textarea') return `<textarea class="textarea" data-f="${f.k}" placeholder="${esc(f.ph || '')}">${esc(f.value || '')}</textarea>`;
      if (f.type === 'switch') return `<label class="switch"><input type="checkbox" data-f="${f.k}" ${f.value ? 'checked' : ''}><span></span></label>`;
      return `<input class="input" data-f="${f.k}" type="${f.type || 'text'}" value="${esc(f.value == null ? '' : f.value)}" placeholder="${esc(f.ph || '')}">`;
    };
    modal({ title, size,
      body: `<div class="form-grid">${fields.map(f => `
        <div class="field ${f.full ? 'full' : ''}"><label class="label">${esc(f.label)}</label>${input(f)}
          ${f.hint ? `<span class="hint">${esc(f.hint)}</span>` : ''}</div>`).join('')}</div>`,
      foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="fSave">Save</button>`,
      onOpen(root) {
        $('#fSave', root).onclick = () => {
          const data = {};
          $$('[data-f]', root).forEach(el => data[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value);
          closeModal(); onSave && onSave(data);
        };
      } });
  }
  const actionBtns = (row, opts = {}) => `<div class="actions">
    ${opts.view !== false ? `<button class="btn btn-ghost btn-sm" data-act="view" data-id="${esc(row.id)}" title="View">${icon('eye', 15)}</button>` : ''}
    <button class="btn btn-ghost btn-sm" data-act="edit" data-id="${esc(row.id)}" title="Edit">${icon('edit', 15)}</button>
    ${opts.dup !== false ? `<button class="btn btn-ghost btn-sm" data-act="dup" data-id="${esc(row.id)}" title="Duplicate">${icon('copy', 15)}</button>` : ''}
    <button class="btn btn-ghost btn-sm" data-act="del" data-id="${esc(row.id)}" title="Delete">${icon('trash', 15)}</button></div>`;
  ADMIN.actionBtns = actionBtns;
  /** Wires the standard row action buttons to toasts/handlers. */
  function bindActions(handlers = {}) {
    $$('[data-act]').forEach(b => b.onclick = () => {
      const a = b.dataset.act, id = b.dataset.id;
      if (handlers[a]) return handlers[a](id);
      if (a === 'del') return confirmDialog('Delete this record?', 'This cannot be undone in a real system.',
        () => toast('Deleted (demo only)', 'info'), 'Delete');
      if (a === 'dup') return toast('Duplicated — draft created');
      toast('Opening ' + id, 'info');
    });
  }
  ADMIN.bindActions = bindActions;
  ADMIN.searchFilter = (inputSel, rowSel) => {
    const inp = $(inputSel); if (!inp) return;
    inp.oninput = () => {
      const v = inp.value.toLowerCase();
      $$(rowSel).forEach(r => r.style.display = r.textContent.toLowerCase().includes(v) ? '' : 'none');
    };
  };

  /* ============================================================
     DASHBOARD
     ============================================================ */
  view('dashboard', () => {
    const rev = M.revenueTrend, ord = M.ordersTrend;
    const totalRev = rev.reduce((s, r) => s + r.product + r.service, 0);
    const svcRev = rev.reduce((s, r) => s + r.service, 0);
    const totalOrders = ord.reduce((s, r) => s + r.orders, 0);
    const totalBookings = ord.reduce((s, r) => s + r.bookings, 0);
    const lowStock = M.products.flatMap(p => p.variants.map(v => ({ p, v }))).filter(x => x.v.stock < 10);
    const delayed = M.orders.filter(o => o.delayed);
    const kpis = [
      ['Revenue', inrShort(totalRev), '+18.4%', 'up', rev.map(r => r.product + r.service), true],
      ['Orders', num(totalOrders), '+12.1%', 'up', ord.map(o => o.orders)],
      ['Service Bookings', num(totalBookings), '+24.6%', 'up', ord.map(o => o.bookings)],
      ['Customers', '18,402', '+6.2%', 'up', [120, 132, 140, 155, 149, 168, 181]],
      ['Avg Order Value', inr(2841), '+3.8%', 'up', [2600, 2710, 2680, 2790, 2755, 2820, 2841]],
      ['Conversion Rate', '3.7%', '+0.4pt', 'up', [3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7]],
      ['Refunds', inrShort(184000), '-2.1%', 'down', [40, 38, 36, 34, 33, 31, 29]],
      ['Low Stock Items', String(lowStock.length), 'needs action', 'down', [8, 9, 11, 12, 13, 14, lowStock.length]],
      ['Products Live', String(M.products.filter(p => p.status === 'Active').length), 'of ' + M.products.length, 'up', [10, 10, 11, 11, 12, 12, 12]]
    ];
    return `${pageHead('Business overview', 'Products and services, one view — 09 Aug 2026',
      `<div class="date-filter" id="dateF">${['Today', 'Yesterday', '7 Days', '30 Days', 'This Month', 'Custom']
        .map((l, i) => `<button class="${i === 2 ? 'is-active' : ''}">${l}</button>`).join('')}</div>
       <button class="btn btn-outline btn-sm" id="expDash">${icon('download', 14)} Export</button>`)}

    <div class="kpi-grid">${kpis.map(([l, v, d, dir, spark, accent]) => `
      <div class="kpi ${accent ? 'accent' : ''}"><span class="lbl">${esc(l)}</span>
        <span class="val">${esc(v)}</span>
        <span class="delta ${dir}">${dir === 'up' ? '▲' : '▼'} ${esc(d)}</span>
        <span class="spark">${Chart.spark(spark, accent ? 'rgba(255,255,255,.6)' : 'var(--primary)')}</span></div>`).join('')}</div>

    <div class="grid-dash mt-4">
      <div class="pane span-8"><div class="pane-head"><b>Revenue trend — product vs service</b>
        <span class="seg"><button class="is-active">Revenue</button><button>Orders</button></span></div>
        <div class="pane-body">${Chart.line([
          { name: 'Product revenue', color: U.cssVar('--primary'), data: rev.map(r => r.product) },
          { name: 'Service revenue', color: U.cssVar('--secondary'), data: rev.map(r => r.service) }], rev.map(r => r.d))}</div></div>

      <div class="pane span-4"><div class="pane-head"><b>Product vs service revenue</b></div>
        <div class="pane-body">${Chart.donut([
          { label: 'Products', value: totalRev - svcRev, color: U.cssVar('--primary') },
          { label: 'Services', value: svcRev, color: U.cssVar('--secondary') }], inrShort(totalRev), 'Last 7 days')}
          <div class="grid grid-2 mt-5"><div class="mini-kpi"><b>${((svcRev / totalRev) * 100).toFixed(1)}%</b>
            <span>Revenue from services</span></div>
            <div class="mini-kpi"><b>${(totalBookings / totalOrders * 100).toFixed(0)}%</b>
              <span>Bookings per 100 orders</span></div></div></div></div>

      <div class="pane span-4"><div class="pane-head"><b>Orders &amp; bookings</b></div>
        <div class="pane-body">${Chart.columns(ord.map(o => o.d), ord.map(o => o.orders), ord.map(o => o.bookings))}
          <div class="legend mt-2"><span><i style="background:var(--primary)"></i>Orders</span>
            <span><i style="background:var(--secondary)"></i>Bookings</span></div></div></div>

      <div class="pane span-4"><div class="pane-head"><b>Sales by category</b></div>
        <div class="pane-body">${Chart.bars(M.categorySales)}</div></div>

      <div class="pane span-4"><div class="pane-head"><b>Sales by channel</b></div>
        <div class="pane-body">${Chart.donut(M.channelSales, inrShort(M.channelSales.reduce((s, c) => s + c.value, 0)), 'All channels')}</div></div>

      <div class="pane span-6"><div class="pane-head"><b>Recent orders</b>
        <button class="btn btn-ghost btn-sm" data-goto="orders">View all ${icon('chevron', 13)}</button></div>
        <div class="pane-body tight">${table([
          { key: 'id', label: 'Order', render: o => `<b class="small">${esc(o.id)}</b><br><span class="tiny muted">${timeAgo(o.date)}</span>` },
          { key: 'customer', label: 'Customer', render: o => esc((customerById(o.customer) || {}).name || '—') },
          { key: 'status', label: 'Status', render: o => badge(o.status) + (o.delayed ? ' <span class="badge badge-error">Delayed</span>' : '') },
          { key: 'total', label: 'Amount', align: 'right', render: o => `<b>${inr(o.total)}</b>` }
        ], M.orders.slice(0, 6))}</div></div>

      <div class="pane span-6"><div class="pane-head"><b>Top products</b>
        <button class="btn btn-ghost btn-sm" data-goto="an-products">Analytics ${icon('chevron', 13)}</button></div>
        <div class="pane-body">${M.products.slice(0, 6).sort((a, b) => b.reviews - a.reviews).map((p, i) => `
          <div class="stat-line"><div class="row gap-3"><span class="rank">${i + 1}</span>
            <img src="${U.productImg(p)}" style="width:34px;height:34px;border-radius:8px">
            <div class="col"><b class="small clamp1" style="max-width:220px">${esc(p.name)}</b>
              <span class="tiny muted">${esc(p.brand)} · ${num(p.reviews)} reviews</span></div></div>
            <div class="col right"><b class="small">${inr(p.price)}</b>
              <span class="tiny muted">${p.stock} in stock</span></div></div>`).join('')}</div></div>

      <div class="pane span-6"><div class="pane-head"><b>⚠️ Low stock — needs reorder</b>
        <button class="btn btn-outline btn-sm" data-goto="inventory">Manage inventory</button></div>
        <div class="pane-body tight">${table([
          { key: 'sku', label: 'SKU', render: x => `<span class="small">${esc(x.v.sku)}</span>` },
          { key: 'p', label: 'Product', render: x => `<span class="small clamp1" style="max-width:190px">${esc(x.p.name)}</span>` },
          { key: 'stock', label: 'Available', align: 'right', render: x => `<b style="color:${x.v.stock === 0 ? 'var(--error)' : 'var(--warning)'}">${x.v.stock}</b>` },
          { key: 'st', label: 'Status', render: x => badge(x.v.stock === 0 ? 'Out of stock' : 'Low stock') }
        ], lowStock.slice(0, 7))}</div></div>

      <div class="pane span-6"><div class="pane-head"><b>🚚 Delayed &amp; at-risk shipments</b>
        <button class="btn btn-ghost btn-sm" data-goto="shipments">All shipments</button></div>
        <div class="pane-body">${delayed.length ? delayed.map(o => `
          <div class="stat-line"><div class="col"><b class="small">${esc(o.id)} · ${esc(o.courier)}</b>
            <span class="tiny muted">${esc(o.city)} · AWB ${esc(o.awb)}</span></div>
          <span class="badge badge-error">2 days late</span></div>`).join('')
          : '<p class="muted small">No delayed shipments 🎉</p>'}
          <div class="grid grid-3 mt-4">
            <div class="mini-kpi"><b>96.2%</b><span>On-time delivery</span></div>
            <div class="mini-kpi"><b>2.4</b><span>Avg days to deliver</span></div>
            <div class="mini-kpi"><b>1.8%</b><span>RTO rate</span></div></div></div></div>

      <div class="pane span-6"><div class="pane-head"><b>Service performance</b>
        <button class="btn btn-ghost btn-sm" data-goto="an-services">Service analytics</button></div>
        <div class="pane-body tight">${table([
          { key: 'label', label: 'Service' },
          { key: 'bookings', label: 'Bookings', align: 'right', render: r => num(r.bookings) },
          { key: 'revenue', label: 'Revenue', align: 'right', render: r => inrShort(r.revenue) },
          { key: 'util', label: 'Pro utilisation', render: r => `<div class="row gap-2"><div class="progress" style="width:70px">
              <i style="width:${r.util}"></i></div><span class="tiny">${r.util}</span></div>` }
        ], M.serviceStats)}</div></div>

      <div class="pane span-6"><div class="pane-head"><b>Active customers</b>
        <button class="btn btn-ghost btn-sm" data-goto="users">All customers</button></div>
        <div class="pane-body">${M.customers.filter(c => c.status === 'Active').slice(0, 6).map(c => `
          <div class="stat-line"><div class="row gap-3"><span class="avatar avatar-sm">${U.initials(c.name)}</span>
            <div class="col"><b class="small">${esc(c.name)}</b>
              <span class="tiny muted">${esc(c.city)} · ${c.orders} orders · ${c.bookings} bookings</span></div></div>
            <div class="col right"><b class="small">${inrShort(c.spent)}</b>
              <span class="tiny muted">${timeAgo(c.last)}</span></div></div>`).join('')}</div></div>
    </div>`;
  }, () => {
    $$('[data-goto]').forEach(b => b.onclick = () => go(b.dataset.goto));
    $$('#dateF button').forEach(b => b.onclick = () => {
      $$('#dateF button').forEach(x => x.classList.remove('is-active')); b.classList.add('is-active');
      if (b.textContent === 'Custom') return modal({ title: 'Custom date range', size: 'modal-sm',
        body: `<div class="form-grid"><div class="field"><label class="label">From</label><input class="input" type="date" value="2026-07-09"></div>
          <div class="field"><label class="label">To</label><input class="input" type="date" value="2026-08-09"></div></div>`,
        foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="dOk">Apply</button>`,
        onOpen(r) { $('#dOk', r).onclick = () => { closeModal(); toast('Dashboard updated for custom range'); }; } });
      toast('Dashboard updated — ' + b.textContent);
    });
    $('#expDash').onclick = () => toast('Report exported as CSV (demo)');
  });

  /* ============================================================
     ORDERS
     ============================================================ */
  view('orders', () => {
    const rows = M.orders;
    return listShell({
      title: 'Orders', sub: `${rows.length} orders · ${rows.filter(o => o.delayed).length} delayed`,
      actions: `<button class="btn btn-outline btn-sm" id="expOrders">${icon('download', 14)} Export</button>
                <button class="btn btn-primary btn-sm" id="manualOrder">${icon('plus', 14)} Create order</button>`,
      filters: `<div class="search-box" style="width:280px">${icon('search', 16)}
          <input id="oSearch" placeholder="Search order ID, customer, AWB"></div>
        <select class="select" style="width:170px" id="oStatus"><option>All statuses</option>
          ${M.orderStatuses.map(s => `<option>${s}</option>`).join('')}</select>
        <select class="select" style="width:150px"><option>All channels</option><option>Web</option><option>Mobile App</option></select>
        <select class="select" style="width:150px"><option>All couriers</option>${M.couriers.map(c => `<option>${c}</option>`).join('')}</select>
        <button class="btn btn-ghost btn-sm">${icon('refresh', 14)} Reset</button>`,
      tableHTML: table([
        { key: 'id', label: 'Order', render: o => `<b>${esc(o.id)}</b><br><span class="tiny muted">${esc(o.channel)}</span>` },
        { key: 'customer', label: 'Customer', render: o => { const c = customerById(o.customer) || {};
          return `<div class="cell-media"><span class="avatar avatar-sm">${U.initials(c.name || '?')}</span>
            <span class="col"><span class="small bold">${esc(c.name || '—')}</span>
            <span class="tiny muted">${esc(o.city)}</span></span></div>`; } },
        { key: 'items', label: 'Items', render: o => `<span class="small">${o.items.length} item${o.items.length > 1 ? 's' : ''}</span>
          ${o.hasService ? '<br><span class="badge badge-primary badge-plain">+ Service</span>' : ''}` },
        { key: 'date', label: 'Placed', render: o => `<span class="small">${dateFmt(o.date)}</span><br><span class="tiny muted">${timeAgo(o.date)}</span>` },
        { key: 'payment', label: 'Payment', render: o => `<span class="tag">${esc(o.payment)}</span>` },
        { key: 'courier', label: 'Shipping', render: o => `<span class="small">${esc(o.courier)}</span><br><span class="tiny muted">${esc(o.awb)}</span>` },
        { key: 'status', label: 'Status', render: o => badge(o.status) + (o.delayed ? '<br><span class="badge badge-error mt-2">Delayed</span>' : '') },
        { key: 'total', label: 'Amount', align: 'right', render: o => `<b>${inr(o.total)}</b>` },
        { key: 'act', label: '', align: 'right', render: o => `<div class="actions">
            <button class="btn btn-outline btn-sm" data-order="${o.id}">Details</button></div>` }
      ], rows, { rowAttr: () => 'class="ord-row"' })
    });
  }, () => {
    ADMIN.searchFilter('#oSearch', '.ord-row');
    $('#oStatus').onchange = e => {
      const v = e.target.value;
      $$('.ord-row').forEach(r => r.style.display = v === 'All statuses' || r.textContent.includes(v) ? '' : 'none');
    };
    $('#expOrders').onclick = () => toast('Orders exported as CSV (demo)');
    $('#manualOrder').onclick = () => toast('Manual order creation — demo only', 'info');
    $$('[data-order]').forEach(b => b.onclick = () => orderDrawer(b.dataset.order));
  });

  function orderDrawer(id) {
    const o = M.orders.find(x => x.id === id); if (!o) return;
    const c = customerById(o.customer) || {};
    const idx = { Placed: 0, Confirmed: 0, Packed: 1, Shipped: 3, 'Out for Delivery': 4, Delivered: 5 }[o.status] ?? 0;
    drawer({ title: 'Order ' + o.id, wide: true,
      body: `<div class="row-between mb-4">${badge(o.status)}
          <span class="row gap-2"><button class="btn btn-outline btn-sm" id="odInv">${icon('download', 14)} Invoice</button>
          <button class="btn btn-outline btn-sm" id="odLabel">Print label</button></span></div>
        <div class="grid grid-2 mb-5">
          <div class="tile"><b class="small">Customer</b>
            <p class="tiny muted mt-2">${esc(c.name)}<br>${esc(c.email)}<br>${esc(c.phone)}</p>
            <button class="btn btn-ghost btn-sm mt-2" data-goto-user="${c.id}">View profile</button></div>
          <div class="tile"><b class="small">Shipping</b>
            <p class="tiny muted mt-2">${esc(o.courier)} · AWB ${esc(o.awb)}<br>${esc(o.city)}<br>Payment: ${esc(o.payment)}</p></div></div>
        <b class="small">Items</b>
        <div class="mt-2">${o.items.map(i => {
          const isSvc = i.type === 'service';
          const it = isSvc ? pkgById(i.pid) : productById(i.pid);
          return `<div class="row gap-3" style="padding:10px 0;border-bottom:1px solid var(--border)">
            <img src="${ph(i.pid, isSvc ? '🧰' : (it.emoji || '📦'), '')}" style="width:44px;height:44px;border-radius:8px">
            <div class="col grow"><b class="small">${esc(it.name)}</b>
              <span class="tiny muted">${isSvc ? 'Service appointment' : esc(i.variant)} · Qty ${i.qty}</span></div>
            <b class="small">${inr(i.price * i.qty)}</b></div>`; }).join('')}</div>
        <div class="tile mt-4"><div class="row-between small"><span class="muted">Subtotal</span><span>${inr(Math.round(o.total * .93))}</span></div>
          <div class="row-between small"><span class="muted">Tax</span><span>${inr(Math.round(o.total * .05))}</span></div>
          <div class="row-between small"><span class="muted">Delivery</span><span>${inr(Math.round(o.total * .02))}</span></div>
          <div class="row-between mt-2" style="font-weight:800"><span>Total</span><span>${inr(o.total)}</span></div></div>
        <b class="small" style="display:block;margin-top:20px">Fulfilment timeline</b>
        <div class="timeline mt-3">${M.orderTimeline.map((s, i) => `
          <div class="tl-item ${i < idx ? 'done' : i === idx ? 'current' : ''}">
            <div class="tl-title">${esc(s.label)}</div><div class="tl-meta">${esc(s.note)}</div></div>`).join('')}</div>`,
      foot: `<div class="row gap-2"><select class="select grow" id="odStatus">
          ${M.orderStatuses.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <button class="btn btn-primary" id="odSave">Update status</button></div>`,
      onOpen(root) {
        $('#odSave', root).onclick = () => { closeDrawer(); toast('Order ' + o.id + ' → ' + $('#odStatus', root).value); };
        $('#odInv', root).onclick = () => toast('Invoice generated (demo)');
        $('#odLabel', root).onclick = () => toast('Shipping label queued at ' + o.courier);
        const gu = $('[data-goto-user]', root); if (gu) gu.onclick = () => { closeDrawer(); go('users'); };
      } });
  }

  /* ============================================================
     PRODUCTS
     ============================================================ */
  view('products', () => listShell({
    title: 'Products', sub: `${M.products.length} products · ${M.products.reduce((s, p) => s + p.variants.length, 0)} variants`,
    actions: `<button class="btn btn-outline btn-sm" id="impProd">${icon('download', 14)} Import CSV</button>
              <button class="btn btn-primary btn-sm" id="newProd">${icon('plus', 14)} Add product</button>`,
    filters: `<div class="search-box" style="width:300px">${icon('search', 16)}
        <input id="pSearch" placeholder="Search by name, SKU or brand"></div>
      <select class="select" style="width:180px"><option>All categories</option>
        ${M.flatCategories.map(c => `<option>${'— '.repeat(c.depth)}${c.name}</option>`).join('')}</select>
      <select class="select" style="width:150px"><option>All brands</option>${M.brands.map(b => `<option>${b.name}</option>`).join('')}</select>
      <select class="select" style="width:150px"><option>All statuses</option><option>Active</option><option>Draft</option><option>Out of stock</option></select>`,
    tableHTML: table([
      { key: 'name', label: 'Product', render: p => `<div class="cell-media">
          <img src="${U.productImg(p)}" alt=""><span class="col">
          <span class="small bold clamp1" style="max-width:230px">${esc(p.name)}</span>
          <span class="tiny muted">${esc(p.brand)} · ${p.variants.length} variants</span></span></div>` },
      { key: 'sku', label: 'SKU', render: p => `<span class="small">${esc(p.skuBase)}</span>` },
      { key: 'catName', label: 'Category', render: p => `<span class="tag">${esc(p.catName)}</span>` },
      { key: 'price', label: 'Price', align: 'right', render: p => `<b>${inr(p.price)}</b><br><span class="tiny strike">${inr(p.mrp)}</span>` },
      { key: 'stock', label: 'Inventory', align: 'right', render: p => `<b>${p.stock}</b><br>
          <span class="tiny ${p.stock < 40 ? '' : 'muted'}" style="${p.stock < 40 ? 'color:var(--warning)' : ''}">${p.stock < 40 ? 'running low' : 'healthy'}</span>` },
      { key: 'status', label: 'Status', render: p => badge(p.status) },
      { key: 'updated', label: 'Updated', render: p => `<span class="tiny muted">${timeAgo(p.updated)}</span>` },
      { key: 'act', label: '', align: 'right', render: p => actionBtns(p) }
    ], M.products, { rowAttr: () => 'class="p-row"' })
  }), () => {
    ADMIN.searchFilter('#pSearch', '.p-row');
    $('#newProd').onclick = () => productEditor(null);
    $('#impProd').onclick = () => toast('CSV importer — demo only', 'info');
    bindActions({
      view: id => productEditor(productById(id), true),
      edit: id => productEditor(productById(id)),
      dup: id => toast('Duplicated "' + productById(id).name + '" as draft'),
      del: id => confirmDialog('Delete product?', productById(id).name + ' will be removed along with its variants.',
        () => toast('Product deleted (demo)', 'info'), 'Delete')
    });
  });

  /** Multi-tab product create/edit form. */
  function productEditor(p, readOnly) {
    const TABS = ['Basic Information', 'Media', 'Pricing', 'Inventory', 'Variants', 'Shipping', 'SEO', 'Offers', 'Related Products'];
    let active = 0;
    const body = () => {
      const t = TABS[active];
      if (t === 'Basic Information') return `<div class="form-grid">
        <div class="field full"><label class="label">Product name</label><input class="input" value="${esc(p ? p.name : '')}" placeholder="e.g. Nike Air Max Running Shoes"></div>
        <div class="field"><label class="label">Brand</label><select class="select">${M.brands.map(b =>
          `<option ${p && p.brand === b.name ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></div>
        <div class="field"><label class="label">Category</label><select class="select">${M.flatCategories.map(c =>
          `<option ${p && p.cat === c.id ? 'selected' : ''}>${'— '.repeat(c.depth)}${esc(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label class="label">Base SKU</label><input class="input" value="${esc(p ? p.skuBase : '')}"></div>
        <div class="field"><label class="label">Status</label><select class="select"><option>Active</option><option>Draft</option><option>Archived</option></select></div>
        <div class="field full"><label class="label">Short description</label>
          <textarea class="textarea">${esc(p ? p.desc : '')}</textarea></div>
        <div class="field full"><label class="label">Highlights (one per line)</label>
          <textarea class="textarea" placeholder="Lightweight cushioning&#10;Breathable mesh upper"></textarea></div></div>`;
      if (t === 'Media') return `<div class="dropzone">${icon('download', 26)}
          <p class="bold mt-2">Drop images here or click to upload</p>
          <p class="tiny muted">PNG or JPG, up to 5 MB each. First image is the cover.</p></div>
        <div class="media-grid mt-4">${Array.from({ length: 4 }, (_, i) => `<div class="media-item">
          <img src="${p ? U.productImg(p, i) : ph('new' + i, '🖼️', '')}"><button class="rm">×</button></div>`).join('')}</div>`;
      if (t === 'Pricing') return `<div class="form-grid">
        <div class="field"><label class="label">MRP (₹)</label><input class="input" type="number" value="${p ? p.mrp : ''}"></div>
        <div class="field"><label class="label">Selling price (₹)</label><input class="input" type="number" value="${p ? p.price : ''}"></div>
        <div class="field"><label class="label">Cost price (₹)</label><input class="input" type="number" value="${p ? Math.round(p.price * .62) : ''}"></div>
        <div class="field"><label class="label">Tax class</label><select class="select"><option>GST 5%</option><option>GST 12%</option><option>GST 18%</option></select></div>
        <div class="field"><label class="label">Discount type</label><select class="select"><option>Percentage</option><option>Flat</option><option>None</option></select></div>
        <div class="field"><label class="label">Discount value</label><input class="input" value="${p ? p.discount + '%' : ''}"></div>
        <div class="field full"><div class="tile row-between"><span class="col"><b class="small">Price includes tax</b>
          <span class="tiny muted">Displayed price on storefront already includes GST</span></span>
          <label class="switch"><input type="checkbox" checked><span></span></label></div></div></div>`;
      if (t === 'Inventory') return `<div class="form-grid">
        <div class="field"><label class="label">Track inventory</label><select class="select"><option>Yes — by variant</option><option>Yes — product level</option><option>No</option></select></div>
        <div class="field"><label class="label">Reorder level</label><input class="input" type="number" value="10"></div>
        <div class="field"><label class="label">Default warehouse</label><select class="select">${M.warehouses.map(w => `<option>${esc(w.name)}</option>`).join('')}</select></div>
        <div class="field"><label class="label">Backorders</label><select class="select"><option>Do not allow</option><option>Allow</option></select></div>
        <div class="field full"><div class="tile"><b class="small">Current stock by warehouse</b>
          <div class="grid grid-3 mt-3">${M.warehouses.slice(0, 3).map(w => `<div class="mini-kpi">
            <b>${p ? Math.round(p.stock / 3) : 0}</b><span>${esc(w.name)}</span></div>`).join('')}</div></div></div></div>`;
      if (t === 'Variants') return `<div class="row-between mb-3"><b class="small">Variant matrix (colour × size)</b>
          <button class="btn btn-outline btn-sm" id="genVar">${icon('refresh', 14)} Regenerate</button></div>
        ${p ? table([
          { key: 'sku', label: 'SKU' },
          { key: 'color', label: 'Colour' }, { key: 'size', label: 'Size' },
          { key: 'price', label: 'Price', align: 'right', render: v => inr(v.price) },
          { key: 'mrp', label: 'MRP', align: 'right', render: v => `<span class="tiny strike">${inr(v.mrp)}</span>` },
          { key: 'stock', label: 'Stock', align: 'right' },
          { key: 'barcode', label: 'Barcode' },
          { key: 'weight', label: 'Weight' },
          { key: 'status', label: 'Status', render: v => badge(v.status) }
        ], p.variants) : '<p class="muted small">Save the product first to generate variants.</p>'}`;
      if (t === 'Shipping') return `<div class="form-grid">
        <div class="field"><label class="label">Weight</label><input class="input" value="${p ? p.weight : ''}"></div>
        <div class="field"><label class="label">Dimensions (L×W×H)</label><input class="input" value="${p ? p.dims : ''}"></div>
        <div class="field"><label class="label">Shipping class</label><select class="select"><option>Standard</option><option>Heavy / Large appliance</option><option>Fragile</option></select></div>
        <div class="field"><label class="label">Preferred courier</label><select class="select"><option>Auto (by priority)</option>${M.couriers.map(c => `<option>${c}</option>`).join('')}</select></div>
        <div class="field full"><div class="tile row-between"><span class="col"><b class="small">Requires installation service</b>
          <span class="tiny muted">Suggests the matching service package on the product page and in cart</span></span>
          <label class="switch"><input type="checkbox" ${p && p.installService ? 'checked' : ''}><span></span></label></div></div>
        <div class="field full"><label class="label">Linked service package</label>
          <select class="select">${M.servicePackages.filter(s => s.bundleFor).map(s => `<option>${esc(s.name)} — ${inr(s.price)}</option>`).join('')}</select>
          <span class="hint">This powers product + service cross-selling.</span></div></div>`;
      if (t === 'SEO') return `<div class="form-grid">
        <div class="field full"><label class="label">Page title</label><input class="input" value="${p ? esc(p.name) + ' — Buy Online | Bazaar' : ''}"></div>
        <div class="field full"><label class="label">Meta description</label><textarea class="textarea">${p ? esc(p.desc) : ''}</textarea></div>
        <div class="field"><label class="label">URL slug</label><input class="input" value="${p ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''}"></div>
        <div class="field"><label class="label">Canonical</label><input class="input" placeholder="Leave blank for default"></div>
        <div class="field full"><label class="label">Keywords</label><input class="input" placeholder="running shoes, nike, sports"></div></div>`;
      if (t === 'Offers') return `<div class="col gap-3">${M.offers.slice(0, 4).map(o => `
        <label class="addr-card row-between"><span class="col"><b class="small">${esc(o.name)}</b>
          <span class="tiny muted">${esc(o.type)} · ${esc(o.value)} · ends ${dateFmt(o.end)}</span></span>
        <input type="checkbox" class="perm-check" ${o.id === 'of1' ? 'checked' : ''}></label>`).join('')}</div>`;
      return `<p class="small muted mb-3">Cross-sell and upsell products shown on the product page.</p>
        <div class="col gap-2">${M.products.slice(0, 6).map(x => `<label class="addr-card row-between">
          <span class="row gap-3"><img src="${U.productImg(x)}" style="width:34px;height:34px;border-radius:6px">
            <span class="col"><b class="small">${esc(x.name)}</b><span class="tiny muted">${inr(x.price)}</span></span></span>
          <input type="checkbox" class="perm-check"></label>`).join('')}</div>`;
    };
    modal({ title: (readOnly ? 'View product — ' : p ? 'Edit product — ' : 'Add product') + (p ? p.name : ''), size: 'modal-lg',
      body: `<div class="form-tabs" id="pTabs">${TABS.map((t, i) =>
        `<button class="${i === 0 ? 'is-active' : ''}" data-t="${i}">${t}</button>`).join('')}</div>
        <div class="mt-5" id="pTabBody">${body()}</div>`,
      foot: `<button class="btn btn-outline" data-close>Cancel</button>
        <button class="btn btn-outline" id="pDraft">Save as draft</button>
        <button class="btn btn-primary" id="pSave">${p ? 'Save changes' : 'Create product'}</button>`,
      onOpen(root) {
        const repaint = () => {
          $('#pTabBody', root).innerHTML = body();
          $$('#pTabs button', root).forEach((b, i) => b.classList.toggle('is-active', i === active));
          const g = $('#genVar', root); if (g) g.onclick = () => toast('Variant matrix regenerated');
        };
        $$('#pTabs button', root).forEach(b => b.onclick = () => { active = +b.dataset.t; repaint(); });
        $('#pSave', root).onclick = () => { closeModal(); toast(p ? 'Product updated' : 'Product created'); };
        $('#pDraft', root).onclick = () => { closeModal(); toast('Saved as draft', 'info'); };
        repaint();
      } });
  }
  ADMIN.productEditor = productEditor;

  /* ============================================================
     CATEGORIES / BRANDS / VARIANTS / SIZES / ATTRIBUTES
     ============================================================ */
  view('categories', () => {
    const node = c => `<div class="tree-row">
        <span class="ic">${c.icon || icon('layers', 15)}</span>
        <div class="col grow"><b class="small">${esc(c.name)}</b>
          <span class="tiny muted">/${esc(c.slug || '')} · order ${c.order || 1}</span></div>
        <span class="tiny muted hide-sm">${M.products.filter(p => p.cat === c.id).length} products</span>
        ${badge(c.status || 'Active')}
        <div class="actions"><button class="btn btn-ghost btn-sm" data-cat-edit="${c.id}">${icon('edit', 15)}</button>
          <button class="btn btn-ghost btn-sm" data-cat-add="${c.id}">${icon('plus', 15)}</button>
          <button class="btn btn-ghost btn-sm" data-cat-del="${c.id}">${icon('trash', 15)}</button></div></div>
      ${(c.children || []).length ? `<div class="tree-node">${c.children.map(node).join('')}</div>` : ''}`;
    return `${pageHead('Categories', 'Nested category tree — drives navigation, filters and size mapping',
      `<button class="btn btn-primary btn-sm" id="newCat">${icon('plus', 14)} Add category</button>`)}
      <div class="grid-dash">
        <div class="pane span-8"><div class="pane-head"><b>Category tree</b>
          <span class="tiny muted">${M.flatCategories.length} categories</span></div>
          <div class="pane-body">${M.categories.map(node).join('')}</div></div>
        <div class="pane span-4"><div class="pane-head"><b>Category performance</b></div>
          <div class="pane-body">${Chart.bars(M.categorySales)}
            <hr class="divider"><div class="grid grid-2">
              <div class="mini-kpi"><b>${M.categories.length}</b><span>Top-level</span></div>
              <div class="mini-kpi"><b>${M.flatCategories.length}</b><span>Total nodes</span></div></div></div></div>
      </div>`;
  }, () => {
    const catFields = (c) => [
      { k: 'name', label: 'Category name', value: c ? c.name : '', full: true },
      { k: 'slug', label: 'Slug', value: c ? c.slug : '', hint: 'Used in the storefront URL' },
      { k: 'parent', label: 'Parent category', type: 'select', value: c ? c.parent : '',
        options: ['— none (top level) —'].concat(M.flatCategories.map(x => '— '.repeat(x.depth) + x.name)) },
      { k: 'order', label: 'Display order', type: 'number', value: c ? c.order || 1 : 1 },
      { k: 'status', label: 'Status', type: 'select', value: c ? c.status : 'Active', options: ['Active', 'Draft', 'Archived'] },
      { k: 'desc', label: 'Description', type: 'textarea', value: c ? c.desc || '' : '', full: true },
      { k: 'img', label: 'Image URL', value: '', full: true, hint: 'Shown on category shortcuts and mega menu' }
    ];
    $('#newCat').onclick = () => formModal('Add category', catFields(null), () => toast('Category created'));
    $$('[data-cat-edit]').forEach(b => b.onclick = () => {
      const c = M.flatCategories.find(x => x.id === b.dataset.catEdit);
      formModal('Edit category — ' + c.name, catFields(c), () => toast('Category updated'));
    });
    $$('[data-cat-add]').forEach(b => b.onclick = () => formModal('Add sub-category', catFields(null), () => toast('Sub-category created')));
    $$('[data-cat-del]').forEach(b => b.onclick = () => confirmDialog('Delete category?',
      'Products in this category must be reassigned first.', () => toast('Category deleted', 'info'), 'Delete'));
  });

  view('brands', () => listShell({
    title: 'Brands', sub: `${M.brands.length} brands`,
    actions: `<button class="btn btn-primary btn-sm" id="newBrand">${icon('plus', 14)} Add brand</button>`,
    filters: `<div class="search-box" style="width:280px">${icon('search', 16)}<input id="bSearch" placeholder="Search brands"></div>`,
    tableHTML: table([
      { key: 'name', label: 'Brand', render: b => `<div class="cell-media">
          <span class="avatar avatar-sm" style="background:var(--n-900);color:#fff">${esc(b.logo)}</span>
          <b class="small">${esc(b.name)}</b></div>` },
      { key: 'products', label: 'Products', align: 'right' },
      { key: 'rev', label: 'Revenue (30d)', align: 'right', render: b => inrShort(b.products * 21400) },
      { key: 'status', label: 'Status', render: b => badge(b.status) },
      { key: 'act', label: '', align: 'right', render: b => actionBtns(b, { view: false }) }
    ], M.brands, { rowAttr: () => 'class="b-row"' })
  }), () => {
    ADMIN.searchFilter('#bSearch', '.b-row');
    const f = b => [{ k: 'name', label: 'Brand name', value: b ? b.name : '', full: true },
      { k: 'logo', label: 'Logo initials', value: b ? b.logo : '' },
      { k: 'status', label: 'Status', type: 'select', value: b ? b.status : 'Active', options: ['Active', 'Draft'] },
      { k: 'desc', label: 'About the brand', type: 'textarea', full: true }];
    $('#newBrand').onclick = () => formModal('Add brand', f(null), () => toast('Brand created'));
    bindActions({ edit: id => formModal('Edit brand', f(M.brands.find(b => b.id === id)), () => toast('Brand updated')) });
  });

  view('variants', () => {
    const rows = M.products.flatMap(p => p.variants.map(v => Object.assign({ product: p.name, brand: p.brand, pid: p.id }, v)));
    return listShell({
      title: 'Variants', sub: `${rows.length} SKUs across ${M.products.length} products — each variant carries its own price, stock, barcode and dimensions`,
      actions: `<button class="btn btn-outline btn-sm" id="expVar">${icon('download', 14)} Export</button>`,
      filters: `<div class="search-box" style="width:300px">${icon('search', 16)}<input id="vSearch" placeholder="Search SKU, product, barcode"></div>
        <select class="select" style="width:170px"><option>All products</option>${M.products.map(p => `<option>${esc(p.name)}</option>`).join('')}</select>
        <select class="select" style="width:150px"><option>All statuses</option><option>Active</option><option>Low stock</option><option>Out of stock</option></select>`,
      tableHTML: table([
        { key: 'sku', label: 'SKU', render: v => `<b class="small">${esc(v.sku)}</b>` },
        { key: 'product', label: 'Product', render: v => `<span class="small clamp1" style="max-width:200px">${esc(v.product)}</span>` },
        { key: 'color', label: 'Colour', render: v => `<span class="row gap-2"><i style="width:14px;height:14px;border-radius:4px;display:inline-block;background:${M.COLORS[v.color] || '#ccc'}"></i>${esc(v.color)}</span>` },
        { key: 'size', label: 'Size' },
        { key: 'price', label: 'Price', align: 'right', render: v => inr(v.price) },
        { key: 'mrp', label: 'MRP', align: 'right', render: v => `<span class="tiny strike">${inr(v.mrp)}</span>` },
        { key: 'stock', label: 'Stock', align: 'right', render: v => `<b>${v.stock}</b>` },
        { key: 'barcode', label: 'Barcode', render: v => `<span class="tiny muted">${esc(v.barcode)}</span>` },
        { key: 'weight', label: 'Weight' },
        { key: 'status', label: 'Status', render: v => badge(v.status) },
        { key: 'act', label: '', align: 'right', render: v => `<button class="btn btn-ghost btn-sm" data-var="${esc(v.sku)}">${icon('edit', 15)}</button>` }
      ], rows.slice(0, 60), { rowAttr: () => 'class="v-row"' })
    });
  }, () => {
    ADMIN.searchFilter('#vSearch', '.v-row');
    $('#expVar').onclick = () => toast('Variant list exported (demo)');
    $$('[data-var]').forEach(b => b.onclick = () => formModal('Edit variant — ' + b.dataset.var, [
      { k: 'sku', label: 'SKU', value: b.dataset.var }, { k: 'price', label: 'Price (₹)', type: 'number', value: 2499 },
      { k: 'mrp', label: 'MRP (₹)', type: 'number', value: 4990 }, { k: 'stock', label: 'Available stock', type: 'number', value: 24 },
      { k: 'barcode', label: 'Barcode', value: '8901234567' }, { k: 'weight', label: 'Weight', value: '0.28 kg' },
      { k: 'dims', label: 'Dimensions', value: '20×18×8 cm' },
      { k: 'status', label: 'Status', type: 'select', value: 'Active', options: ['Active', 'Low stock', 'Out of stock', 'Disabled'] }
    ], () => toast('Variant updated')));
  });

  view('sizes', () => `${pageHead('Sizes', 'Independent master data — grouped and mapped to categories',
    `<button class="btn btn-outline btn-sm" id="newGrp">${icon('plus', 14)} New group</button>
     <button class="btn btn-primary btn-sm" id="newSize">${icon('plus', 14)} Add size</button>`)}
    <div class="grid-dash">${M.sizeGroups.map(g => `
      <div class="pane span-6"><div class="pane-head"><div class="col"><b>${esc(g.name)}</b>
          <span class="tiny muted">${g.sizes.length} sizes · mapped to ${g.appliesTo.length} categories</span></div>
        <div class="row gap-1"><button class="btn btn-ghost btn-sm" data-grp-map="${g.id}">${icon('layers', 15)}</button>
          <button class="btn btn-ghost btn-sm" data-grp-edit="${g.id}">${icon('edit', 15)}</button></div></div>
        <div class="pane-body">
          <div class="row gap-2 wrap">${g.sizes.map(s => `<span class="chip" data-size-edit="${s.id}">${esc(s.label)}
            <span class="x">✎</span></span>`).join('')}
            <button class="chip" data-size-add="${g.id}">${icon('plus', 13)} Add</button></div>
          <hr class="divider">
          <b class="tiny muted">Assigned categories</b>
          <div class="row gap-2 wrap mt-2">${g.appliesTo.map(cid => {
            const c = M.flatCategories.find(x => x.id === cid);
            return c ? `<span class="tag">${esc(c.name)}</span>` : ''; }).join('')}</div>
        </div></div>`).join('')}</div>`,
  () => {
    const sizeF = v => [{ k: 'label', label: 'Size label', value: v || '', full: true },
      { k: 'group', label: 'Size group', type: 'select', options: M.sizeGroups.map(g => g.name) },
      { k: 'order', label: 'Display order', type: 'number', value: 1 }];
    $('#newSize').onclick = () => formModal('Add size', sizeF(''), () => toast('Size added'));
    $('#newGrp').onclick = () => formModal('New size group', [
      { k: 'name', label: 'Group name', full: true, ph: 'e.g. Kids Footwear (EU)' },
      { k: 'cats', label: 'Apply to category', type: 'select', options: M.flatCategories.map(c => c.name) }
    ], () => toast('Size group created'));
    $$('[data-size-edit]').forEach(b => b.onclick = () => formModal('Edit size', sizeF(b.textContent.trim().replace('✎', '').trim()),
      () => toast('Size updated')));
    $$('[data-size-add]').forEach(b => b.onclick = () => formModal('Add size to group', sizeF(''), () => toast('Size added to group')));
    $$('[data-grp-edit]').forEach(b => b.onclick = () => formModal('Edit size group', [
      { k: 'name', label: 'Group name', value: M.sizeGroups.find(g => g.id === b.dataset.grpEdit).name, full: true }
    ], () => toast('Group updated')));
    $$('[data-grp-map]').forEach(b => b.onclick = () => {
      const g = M.sizeGroups.find(x => x.id === b.dataset.grpMap);
      modal({ title: 'Map "' + g.name + '" to categories',
        body: `<div class="col gap-2">${M.flatCategories.map(c => `<label class="addr-card row-between">
          <span style="padding-left:${c.depth * 14}px"><b class="small">${esc(c.name)}</b></span>
          <input type="checkbox" class="perm-check" ${g.appliesTo.includes(c.id) ? 'checked' : ''}></label>`).join('')}</div>`,
        foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="mOk">Save mapping</button>`,
        onOpen(r) { $('#mOk', r).onclick = () => { closeModal(); toast('Category mapping saved'); }; } });
    });
  });

  view('attributes', () => listShell({
    title: 'Attributes', sub: 'Reusable product attributes used in variants, filters and specifications',
    actions: `<button class="btn btn-primary btn-sm" id="newAttr">${icon('plus', 14)} Add attribute</button>`,
    tableHTML: table([
      { key: 'name', label: 'Attribute', render: a => `<b class="small">${esc(a.name)}</b>` },
      { key: 'type', label: 'Input type', render: a => `<span class="tag">${esc(a.type)}</span>` },
      { key: 'values', label: 'Values', render: a => a.values.map(v => `<span class="tag">${esc(v)}</span>`).join(' ') },
      { key: 'usedIn', label: 'Used in', align: 'right', render: a => a.usedIn + ' products' },
      { key: 'status', label: 'Status', render: a => badge(a.status) },
      { key: 'act', label: '', align: 'right', render: a => actionBtns(a, { view: false, dup: false }) }
    ], M.attributes)
  }), () => {
    $('#newAttr').onclick = () => formModal('Add attribute', [
      { k: 'name', label: 'Attribute name', full: true, ph: 'e.g. Sleeve Length' },
      { k: 'type', label: 'Input type', type: 'select', options: ['Dropdown', 'Swatch', 'Text', 'Number'] },
      { k: 'values', label: 'Values (comma separated)', full: true, ph: 'Half, Full, Sleeveless' },
      { k: 'filter', label: 'Show as storefront filter', type: 'switch', value: true }
    ], () => toast('Attribute created'));
    bindActions({ edit: id => formModal('Edit attribute', [
      { k: 'name', label: 'Attribute name', value: M.attributes.find(a => a.id === id).name, full: true },
      { k: 'values', label: 'Values', value: M.attributes.find(a => a.id === id).values.join(', '), full: true }
    ], () => toast('Attribute updated')) });
  });

  /* ============================================================
     INVENTORY + REVIEWS
     ============================================================ */
  view('inventory', () => {
    const rows = M.products.flatMap(p => p.variants.map(v => ({
      sku: v.sku, product: p.name, variant: [v.color, v.size].filter(x => x !== 'Default' && x !== 'One Size').join(' / ') || 'Standard',
      available: v.stock, reserved: v.reserved, transit: v.inTransit, reorder: v.reorder, warehouse: v.warehouse,
      status: v.stock === 0 ? 'Out of stock' : v.stock < v.reorder ? 'Low stock' : v.stock > 40 ? 'Overstocked' : 'In stock'
    })));
    const counts = k => rows.filter(r => r.status === k).length;
    return `${pageHead('Inventory', `${rows.length} SKUs across ${M.warehouses.length} warehouses`,
      `<button class="btn btn-outline btn-sm" id="invTransfer">${icon('share', 14)} Transfer stock</button>
       <button class="btn btn-outline btn-sm" id="invHist">${icon('clock', 14)} Stock history</button>
       <button class="btn btn-primary btn-sm" id="invAdjust">${icon('plus', 14)} Adjust stock</button>`)}
      <div class="kpi-grid mb-4">
        ${[['In stock', counts('In stock'), 'success'], ['Low stock', counts('Low stock'), 'warning'],
           ['Out of stock', counts('Out of stock'), 'error'], ['Overstocked', counts('Overstocked'), 'info'],
           ['Stock value', inrShort(rows.reduce((s, r) => s + r.available * 1800, 0)), 'primary']]
          .map(([l, v, t]) => `<div class="kpi"><span class="lbl">${l}</span><span class="val">${v}</span>
            <span class="badge badge-${t}">${l === 'Stock value' ? 'at cost' : 'SKUs'}</span></div>`).join('')}</div>
      <div class="list-toolbar"><div class="search-box" style="width:300px">${icon('search', 16)}
          <input id="iSearch" placeholder="Search SKU or product"></div>
        <select class="select" style="width:180px" id="iWh"><option>All warehouses</option>
          ${M.warehouses.map(w => `<option>${esc(w.name)}</option>`).join('')}</select>
        <select class="select" style="width:160px" id="iSt"><option>All statuses</option>
          <option>In stock</option><option>Low stock</option><option>Out of stock</option><option>Overstocked</option></select></div>
      <div class="pane"><div class="pane-body tight">${table([
        { key: 'sku', label: 'SKU', render: r => `<b class="small">${esc(r.sku)}</b>` },
        { key: 'product', label: 'Product', render: r => `<span class="small clamp1" style="max-width:200px">${esc(r.product)}</span>` },
        { key: 'variant', label: 'Variant' },
        { key: 'available', label: 'Available', align: 'right', render: r => `<b>${r.available}</b>` },
        { key: 'reserved', label: 'Reserved', align: 'right' },
        { key: 'transit', label: 'In transit', align: 'right' },
        { key: 'reorder', label: 'Reorder level', align: 'right' },
        { key: 'warehouse', label: 'Warehouse', render: r => `<span class="tag">${esc(r.warehouse)}</span>` },
        { key: 'status', label: 'Status', render: r => badge(r.status) },
        { key: 'act', label: '', align: 'right', render: r => `<button class="btn btn-outline btn-sm" data-adj="${esc(r.sku)}">Adjust</button>` }
      ], rows.slice(0, 50), { rowAttr: () => 'class="i-row"' })}</div></div>`;
  }, () => {
    ADMIN.searchFilter('#iSearch', '.i-row');
    const filterBy = sel => $(sel).onchange = e => {
      const v = e.target.value;
      $$('.i-row').forEach(r => r.style.display = v.startsWith('All') || r.textContent.includes(v) ? '' : 'none');
    };
    filterBy('#iWh'); filterBy('#iSt');
    const adjust = sku => formModal('Stock adjustment — ' + (sku || ''), [
      { k: 'sku', label: 'SKU', value: sku || '', full: true },
      { k: 'type', label: 'Adjustment type', type: 'select', options: ['Add stock (GRN)', 'Remove (damage)', 'Correction', 'Return to stock'] },
      { k: 'qty', label: 'Quantity', type: 'number', value: 10 },
      { k: 'wh', label: 'Warehouse', type: 'select', options: M.warehouses.map(w => w.name) },
      { k: 'note', label: 'Reason / reference', type: 'textarea', full: true, ph: 'GRN #4471' }
    ], () => toast('Stock adjusted — history updated'));
    $('#invAdjust').onclick = () => adjust('');
    $$('[data-adj]').forEach(b => b.onclick = () => adjust(b.dataset.adj));
    $('#invTransfer').onclick = () => formModal('Inventory transfer', [
      { k: 'sku', label: 'SKU', full: true }, { k: 'from', label: 'From warehouse', type: 'select', options: M.warehouses.map(w => w.name) },
      { k: 'to', label: 'To warehouse', type: 'select', options: M.warehouses.map(w => w.name) },
      { k: 'qty', label: 'Quantity', type: 'number', value: 20 },
      { k: 'eta', label: 'Expected arrival', type: 'date' }
    ], () => toast('Transfer created — stock marked in transit'));
    $('#invHist').onclick = () => drawer({ title: 'Stock history', wide: true,
      body: table([
        { key: 'date', label: 'Date', render: r => dateFmt(r.date) },
        { key: 'sku', label: 'SKU' }, { key: 'type', label: 'Type', render: r => `<span class="tag">${esc(r.type)}</span>` },
        { key: 'qty', label: 'Qty', align: 'right', render: r => `<b style="color:${r.qty > 0 ? 'var(--success)' : 'var(--error)'}">${r.qty > 0 ? '+' : ''}${r.qty}</b>` },
        { key: 'by', label: 'By' }, { key: 'note', label: 'Reference' }
      ], M.stockHistory) });
  });

  view('reviews', () => listShell({
    title: 'Reviews', sub: 'Moderate product reviews before they go live',
    filters: `<div class="search-box" style="width:280px">${icon('search', 16)}<input id="rSearch" placeholder="Search reviews"></div>
      <select class="select" style="width:150px"><option>All statuses</option><option>Published</option><option>Pending</option></select>`,
    tableHTML: table([
      { key: 'pid', label: 'Product', render: r => { const p = productById(r.pid);
        return `<div class="cell-media"><img src="${U.productImg(p)}"><span class="small clamp1" style="max-width:170px">${esc(p.name)}</span></div>`; } },
      { key: 'user', label: 'Customer' },
      { key: 'rating', label: 'Rating', render: r => `<span class="rating-pill">${r.rating} ★</span>` },
      { key: 'title', label: 'Review', render: r => `<b class="small">${esc(r.title)}</b><br>
        <span class="tiny muted clamp1" style="max-width:280px">${esc(r.body)}</span>` },
      { key: 'date', label: 'Date', render: r => `<span class="tiny muted">${dateFmt(r.date)}</span>` },
      { key: 'status', label: 'Status', render: r => badge(r.status === 'Published' ? 'Active' : 'Pending') },
      { key: 'act', label: '', align: 'right', render: r => `<div class="actions">
          <button class="btn btn-ghost btn-sm" data-rv-ok="${r.id}" title="Approve">${icon('check', 15)}</button>
          <button class="btn btn-ghost btn-sm" data-rv-no="${r.id}" title="Reject">${icon('close', 15)}</button></div>` }
    ], M.reviews, { rowAttr: () => 'class="rv-row"' })
  }), () => {
    ADMIN.searchFilter('#rSearch', '.rv-row');
    $$('[data-rv-ok]').forEach(b => b.onclick = () => toast('Review published'));
    $$('[data-rv-no]').forEach(b => b.onclick = () => toast('Review rejected', 'info'));
  });

  /* ============================================================
     SHELL BOOT
     ============================================================ */
  function sidebarHTML() {
    return `<div class="sb-head"><span class="mark">B</span>
        <span><b>Bazaar</b><small>Admin Console</small></span></div>
      <div class="sb-scroll">${NAV.map(g => `
        ${g.group ? `<div class="sb-group">${g.group}</div>` : ''}
        ${g.items.map(([k, l, ic, n]) => `<button class="sb-link" data-k="${k}">${icon(ic, 17)} ${l}
          ${n ? `<span class="n">${n}</span>` : ''}</button>`).join('')}`).join('')}</div>
      <div class="sb-foot"><div class="sb-user"><span class="avatar avatar-sm">AS</span>
        <span class="col grow"><b>Aarav Sharma</b><small>Super Admin</small></span>
        <button class="icon-btn" style="width:28px;height:28px;color:rgba(255,255,255,.6)" id="sbOut">${icon('logout', 15)}</button></div>
        <a class="btn btn-outline btn-sm btn-block mt-3" href="index.html" style="background:transparent;color:rgba(255,255,255,.75);border-color:rgba(255,255,255,.2)">
          View storefront</a></div>`;
  }

  function boot() {
    $('.sidebar').innerHTML = sidebarHTML();
    $$('.sb-link').forEach(b => b.onclick = () => go(b.dataset.k));
    $('#sbOut').onclick = () => confirmDialog('Log out of admin?', 'You will return to the storefront.',
      () => location.href = 'index.html', 'Log out');
    $('#burger').onclick = () => $('.sidebar').classList.toggle('open');
    $('#adminSearch').oninput = e => {
      const v = e.target.value.toLowerCase(); if (v.length < 2) return;
      const hit = Object.keys(TITLES).find(k => TITLES[k].toLowerCase().includes(v));
      if (hit) $('#adminSearchHint').textContent = 'Press Enter for ' + TITLES[hit];
    };
    $('#adminSearch').onkeydown = e => {
      if (e.key !== 'Enter') return;
      const v = e.target.value.toLowerCase();
      const hit = Object.keys(TITLES).find(k => TITLES[k].toLowerCase().includes(v));
      if (hit) { go(hit); e.target.value = ''; $('#adminSearchHint').textContent = ''; }
      else toast('No admin screen matched', 'error');
    };
    $('#adminBell').onclick = () => drawer({ title: 'Admin alerts',
      body: `<div class="col">${[['⚠️', 'Low stock', '12 SKUs below reorder level — reorder now'],
        ['🚚', 'Delayed shipment', 'BZ100240 is 2 days past ETA with Blue Dart'],
        ['🧰', 'Unassigned booking', 'SB50018 has no professional assigned for today 3 PM'],
        ['💳', 'Payout settled', '₹4.2L settled by Razorpay for 08 Aug'],
        ['⭐', 'Review pending', '1 review waiting for moderation']]
        .map(([e, t, d]) => `<div class="row gap-3" style="padding:14px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:20px">${e}</span><div class="col"><b class="small">${t}</b>
          <span class="tiny muted">${d}</span></div></div>`).join('')}</div>` });
    window.addEventListener('hashchange', paint);
    window.addEventListener('theme:change', paint);
    paint();
    U.protoBar('admin.html');
  }
  ADMIN.boot = boot;
})(window);
