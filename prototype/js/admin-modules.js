/* ============================================================
   KEENPLAZA — admin-modules.js  (part 2 of 2)
   Marketing, customers, services, logistics, analytics, settings
   and the integration-architecture map. Boots the admin shell.
   ============================================================ */
(function (global) {
  'use strict';
  const M = global.MOCK, U = global.UI, A = global.ADMIN;
  const { $, $$, esc, inr, inrShort, num, dateFmt, timeAgo, icon, badge, stars, table, ph, Chart,
          toast, modal, closeModal, drawer, closeDrawer, confirmDialog, productById, pkgById,
          svcCatById, customerById, proById } = U;
  const { view, listShell, pageHead, formModal, actionBtns, bindActions, searchFilter, go } = A;

  /* ============================================================
     MARKETING
     ============================================================ */
  const offerFields = o => [
    { k: 'name', label: 'Offer name', value: o ? o.name : '', full: true },
    { k: 'code', label: 'Offer code (optional)', value: '' },
    { k: 'type', label: 'Discount type', type: 'select', value: o ? o.type : '',
      options: ['Product discount', 'Category discount', 'Brand discount', 'Buy 1 Get 1', 'Flat discount', 'Percentage discount', 'Free shipping', 'Cart-level discount'] },
    { k: 'value', label: 'Discount value', value: o ? o.value : '', ph: '25% or ₹500' },
    { k: 'minCart', label: 'Minimum cart value (₹)', type: 'number', value: o ? o.minCart : 0 },
    { k: 'maxDiscount', label: 'Maximum discount (₹)', type: 'number', value: o ? o.maxDiscount : 0 },
    { k: 'start', label: 'Start date', type: 'date', value: '2026-08-09' },
    { k: 'end', label: 'End date', type: 'date', value: '2026-08-31' },
    { k: 'applies', label: 'Product / category applicability', type: 'select', value: o ? o.applies : '',
      options: ['All products'].concat(M.categories.map(c => c.name)).concat(M.brands.map(b => b.name)).concat(['Services only', 'Appliances + Services']) },
    { k: 'users', label: 'User applicability', type: 'select', value: o ? o.users : 'All',
      options: ['All', 'New customers only', 'VIP segment', 'Lapsed 60 days', 'App users only'] },
    { k: 'limit', label: 'Usage limit (0 = unlimited)', type: 'number', value: o ? o.limit : 0 },
    { k: 'status', label: 'Status', type: 'select', value: o ? o.status : 'Active', options: ['Active', 'Scheduled', 'Paused', 'Expired'] }
  ];

  view('offers', () => listShell({
    title: 'Offers', sub: `${M.offers.filter(o => o.status === 'Active').length} running · ${M.offers.length} total`,
    actions: `<button class="btn btn-primary btn-sm" id="newOffer">${icon('plus', 14)} Create offer</button>`,
    filters: `<div class="search-box" style="width:280px">${icon('search', 16)}<input id="ofSearch" placeholder="Search offers"></div>
      <select class="select" style="width:170px"><option>All types</option><option>Product discount</option><option>Category discount</option>
        <option>Buy 1 Get 1</option><option>Free shipping</option></select>
      <select class="select" style="width:150px"><option>All statuses</option><option>Active</option><option>Scheduled</option><option>Expired</option></select>`,
    tableHTML: table([
      { key: 'name', label: 'Offer', render: o => `<b class="small">${esc(o.name)}</b><br><span class="tiny muted">${esc(o.applies)}</span>` },
      { key: 'type', label: 'Type', render: o => `<span class="tag">${esc(o.type)}</span>` },
      { key: 'value', label: 'Value', render: o => `<b>${esc(o.value)}</b>` },
      { key: 'minCart', label: 'Min cart', align: 'right', render: o => o.minCart ? inr(o.minCart) : '—' },
      { key: 'used', label: 'Used', align: 'right', render: o => `${num(o.used)}${o.limit ? ' / ' + num(o.limit) : ''}` },
      { key: 'users', label: 'Audience' },
      { key: 'end', label: 'Window', render: o => `<span class="tiny muted">${dateFmt(o.start)}<br>→ ${dateFmt(o.end)}</span>` },
      { key: 'status', label: 'Status', render: o => badge(o.status) },
      { key: 'act', label: '', align: 'right', render: o => actionBtns(o, { view: false }) }
    ], M.offers, { rowAttr: () => 'class="of-row"' })
  }), () => {
    searchFilter('#ofSearch', '.of-row');
    $('#newOffer').onclick = () => formModal('Create offer', offerFields(null), () => toast('Offer created'), 'modal-lg');
    bindActions({ edit: id => formModal('Edit offer', offerFields(M.offers.find(o => o.id === id)), () => toast('Offer updated'), 'modal-lg'),
      dup: () => toast('Offer duplicated as draft') });
  });

  const couponFields = c => [
    { k: 'code', label: 'Coupon code', value: c ? c.code : '', full: true, ph: 'WELCOME20' },
    { k: 'type', label: 'Discount type', type: 'select', value: c ? c.type : '', options: ['Percentage', 'Flat', 'Free Shipping'] },
    { k: 'value', label: 'Discount value', type: 'number', value: c ? c.value : 0 },
    { k: 'minCart', label: 'Minimum cart (₹)', type: 'number', value: c ? c.minCart : 0 },
    { k: 'maxDiscount', label: 'Maximum discount (₹)', type: 'number', value: c ? c.maxDiscount : 0 },
    { k: 'start', label: 'Start date', type: 'date', value: '2026-08-09' },
    { k: 'end', label: 'Expiry date', type: 'date', value: '2026-09-09' },
    { k: 'limit', label: 'Usage limit', type: 'number', value: c ? c.limit : 1000 },
    { k: 'perUser', label: 'Uses per customer', type: 'number', value: 1 },
    { k: 'scope', label: 'Applies to', type: 'select', value: c ? c.scope : '',
      options: ['All products', 'Electronics', 'Fashion + Appliances', 'Services only', 'Products + Services'] },
    { k: 'status', label: 'Status', type: 'select', value: c ? c.status : 'Active', options: ['Active', 'Paused', 'Expired'] }
  ];

  view('coupons', () => {
    const used = M.coupons.reduce((s, c) => s + c.used, 0);
    return `${pageHead('Coupons', `${M.coupons.filter(c => c.status === 'Active').length} active · ${num(used)} redemptions`,
      `<button class="btn btn-primary btn-sm" id="newCoupon">${icon('plus', 14)} Create coupon</button>`)}
      <div class="kpi-grid mb-4">
        ${[['Active coupons', M.coupons.filter(c => c.status === 'Active').length], ['Total redemptions', num(used)],
           ['Discount given', inrShort(1840000)], ['Avg order with coupon', inr(3410)]]
          .map(([l, v]) => `<div class="kpi"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join('')}</div>
      ${listShell({ title: '', sub: '', filters: `<div class="search-box" style="width:280px">${icon('search', 16)}
          <input id="cpSearch" placeholder="Search coupon code"></div>`,
        tableHTML: table([
          { key: 'code', label: 'Coupon', render: c => `<code class="kbd">${esc(c.code)}</code>` },
          { key: 'type', label: 'Type', render: c => `<span class="tag">${esc(c.type)}</span>` },
          { key: 'value', label: 'Discount', render: c => `<b>${c.type === 'Percentage' ? c.value + '%' : c.type === 'Flat' ? inr(c.value) : 'Free ship'}</b>
            <br><span class="tiny muted">min ${inr(c.minCart)}</span>` },
          { key: 'used', label: 'Usage', render: c => `<div class="row gap-2"><div class="progress" style="width:70px">
              <i style="width:${c.limit ? Math.min(100, c.used / c.limit * 100) : 40}%"></i></div>
              <span class="tiny">${num(c.used)}${c.limit ? '/' + num(c.limit) : ''}</span></div>` },
          { key: 'start', label: 'Start', render: c => `<span class="tiny muted">${dateFmt(c.start)}</span>` },
          { key: 'end', label: 'Expiry', render: c => `<span class="tiny muted">${dateFmt(c.end)}</span>` },
          { key: 'scope', label: 'Scope' },
          { key: 'status', label: 'Status', render: c => badge(c.status) },
          { key: 'act', label: '', align: 'right', render: c => actionBtns(c, { view: false }) }
        ], M.coupons, { rowAttr: () => 'class="cp-row"' }) })}`;
  }, () => {
    searchFilter('#cpSearch', '.cp-row');
    $('#newCoupon').onclick = () => formModal('Create coupon', couponFields(null), () => toast('Coupon created'), 'modal-lg');
    bindActions({ edit: id => formModal('Edit coupon', couponFields(M.coupons.find(c => c.id === id)), () => toast('Coupon updated'), 'modal-lg'),
      dup: id => toast('Coupon duplicated — edit the code before publishing'),
      del: id => confirmDialog('Delete coupon?', 'Customers using it at checkout will see an error.', () => toast('Coupon deleted', 'info'), 'Delete') });
  });

  view('campaigns', () => listShell({
    title: 'Campaigns', sub: 'Push, email, SMS and WhatsApp campaigns across products and services',
    actions: `<button class="btn btn-primary btn-sm" id="newCamp">${icon('plus', 14)} New campaign</button>`,
    tableHTML: table([
      { key: 'title', label: 'Campaign', render: c => `<b class="small">${esc(c.title)}</b><br>
        <span class="tiny muted clamp1" style="max-width:260px">${esc(c.message)}</span>` },
      { key: 'audience', label: 'Audience', render: c => `<span class="tag">${esc(c.audience)}</span>` },
      { key: 'channel', label: 'Channel' },
      { key: 'sent', label: 'Sent', align: 'right', render: c => num(c.sent) },
      { key: 'opened', label: 'Opened', align: 'right' },
      { key: 'clicked', label: 'Clicked', align: 'right' },
      { key: 'date', label: 'Date', render: c => `<span class="tiny muted">${timeAgo(c.date)}</span>` },
      { key: 'status', label: 'Status', render: c => badge(c.status === 'Completed' ? 'Delivered' : c.status) },
      { key: 'act', label: '', align: 'right', render: c => actionBtns(c, { view: false }) }
    ], M.campaigns)
  }), () => {
    const campaignForm = () => modal({ title: 'Create campaign', size: 'modal-lg',
      body: `<div class="form-grid">
        <div class="field full"><label class="label">Title</label><input class="input" id="cTitle" placeholder="Weekend Sale 🎉"></div>
        <div class="field full"><label class="label">Message</label>
          <textarea class="textarea" id="cMsg" placeholder="Get up to 40% off selected products."></textarea></div>
        <div class="field"><label class="label">Audience</label><select class="select"><option>All Customers</option>
          ${M.segments.map(s => `<option>${esc(s.name)}</option>`).join('')}</select></div>
        <div class="field"><label class="label">Deep link</label><select class="select">
          <option>Home</option><option>Offers page</option><option>Category — Electronics</option><option>Services — AC Service</option></select></div>
        <div class="field full"><label class="label">Channels</label>
          <div class="row gap-3 wrap">${['Push', 'Email', 'SMS', 'WhatsApp', 'In-app'].map((c, i) =>
            `<label class="check"><input type="checkbox" ${i === 0 ? 'checked' : ''}> ${c}</label>`).join('')}</div></div>
        <div class="field"><label class="label">Schedule</label><select class="select"><option>Send now</option><option>Schedule for later</option></select></div>
        <div class="field"><label class="label">Send at</label><input class="input" type="datetime-local" value="2026-08-10T10:00"></div>
        <div class="field full"><div class="tile"><b class="tiny muted">Preview — mobile push</b>
          <div class="row gap-3 mt-2" style="background:var(--surface);padding:12px;border-radius:10px;box-shadow:var(--sh-sm)">
            <span style="font-size:20px">🛍️</span><div class="col"><b class="small" id="pvT">Weekend Sale 🎉</b>
            <span class="tiny muted" id="pvM">Get up to 40% off selected products.</span></div></div></div></div></div>`,
      foot: `<button class="btn btn-outline" data-close>Cancel</button>
        <button class="btn btn-outline" id="cTest">Send test</button>
        <button class="btn btn-primary" id="cSend">Create campaign</button>`,
      onOpen(r) {
        const t = $('#cTitle', r), m = $('#cMsg', r);
        t.oninput = () => $('#pvT', r).textContent = t.value || 'Campaign title';
        m.oninput = () => $('#pvM', r).textContent = m.value || 'Campaign message';
        $('#cTest', r).onclick = () => toast('Test push sent to your device');
        $('#cSend', r).onclick = () => { closeModal(); toast('Campaign queued for delivery'); };
      } });
    $('#newCamp').onclick = campaignForm;
    bindActions({ edit: () => campaignForm(), dup: () => toast('Campaign duplicated') });
  });

  view('notifications', () => `${pageHead('Notification management', 'Trigger matrix across channels — used by orders, services and marketing',
    `<button class="btn btn-outline btn-sm" id="testNotif">Send test</button>
     <button class="btn btn-primary btn-sm" id="saveNotif">Save changes</button>`)}
    <div class="grid-dash">
      <div class="pane span-8"><div class="pane-head"><b>Triggers &amp; channels</b>
        <span class="tiny muted">${M.notificationTriggers.length} triggers</span></div>
        <div class="pane-body tight">${table([
          { key: 'event', label: 'Trigger', render: t => `<b class="small">${esc(t.event)}</b><br>
            <span class="tiny muted">${esc(t.template)}</span>` },
          ...['push', 'email', 'sms', 'whatsapp', 'inapp'].map(ch => ({
            key: ch, label: ch === 'inapp' ? 'In-app' : ch === 'whatsapp' ? 'WhatsApp' : ch.toUpperCase(), align: 'center',
            render: t => `<label class="switch"><input type="checkbox" ${t[ch] ? 'checked' : ''}><span></span></label>` })),
          { key: 'act', label: '', align: 'right', render: t => `<button class="btn btn-ghost btn-sm" data-tpl="${t.id}">${icon('edit', 15)}</button>` }
        ], M.notificationTriggers)}</div></div>
      <div class="pane span-4"><div class="pane-head"><b>Channel health</b></div>
        <div class="pane-body">
          ${[['Firebase Cloud Messaging', 'Push', '99.4% delivered', 'success'],
             ['MSG91', 'SMS + OTP', '98.1% delivered', 'success'],
             ['SendGrid', 'Email', '96.8% delivered', 'success'],
             ['WhatsApp Business API', 'WhatsApp', 'Not connected', 'warning']]
            .map(([n, c, s, t]) => `<div class="stat-line"><div class="col"><b class="small">${n}</b>
              <span class="tiny muted">${c}</span></div><span class="badge badge-${t}">${s}</span></div>`).join('')}
          <hr class="divider">
          <b class="small">Last 7 days</b>
          <div class="grid grid-2 mt-3">
            <div class="mini-kpi"><b>184K</b><span>Push sent</span></div>
            <div class="mini-kpi"><b>22.4%</b><span>Open rate</span></div>
            <div class="mini-kpi"><b>41K</b><span>SMS sent</span></div>
            <div class="mini-kpi"><b>6.1%</b><span>Click rate</span></div></div></div></div>
    </div>`, () => {
    $('#saveNotif').onclick = () => toast('Notification settings saved');
    $('#testNotif').onclick = () => toast('Test notification sent on all enabled channels');
    $$('[data-tpl]').forEach(b => b.onclick = () => {
      const t = M.notificationTriggers.find(x => x.id === b.dataset.tpl);
      formModal('Edit template — ' + t.event, [
        { k: 'title', label: 'Title', value: t.event, full: true },
        { k: 'body', label: 'Message body', type: 'textarea', value: t.template, full: true,
          hint: 'Variables: {{id}} {{customer}} {{courier}} {{amount}} {{pro}}' },
        { k: 'deeplink', label: 'Deep link', value: 'keenplaza://orders/{{id}}', full: true }
      ], () => toast('Template updated'));
    });
  });

  /* ============================================================
     CUSTOMERS
     ============================================================ */
  view('users', () => listShell({
    title: 'Customers', sub: `${M.customers.length} shown · 18,402 total`,
    actions: `<button class="btn btn-outline btn-sm" id="expUsers">${icon('download', 14)} Export</button>
              <button class="btn btn-primary btn-sm" id="notifyUsers">${icon('bell', 14)} Send notification</button>`,
    filters: `<div class="search-box" style="width:300px">${icon('search', 16)}<input id="uSearch" placeholder="Search name, email or phone"></div>
      <select class="select" style="width:150px"><option>All statuses</option><option>Active</option><option>Inactive</option><option>Blocked</option></select>
      <select class="select" style="width:150px"><option>All segments</option><option>VIP</option><option>Loyal</option><option>New</option><option>At Risk</option></select>
      <select class="select" style="width:150px"><option>All cities</option>${M.business.cities.map(c => `<option>${c}</option>`).join('')}</select>`,
    tableHTML: table([
      { key: 'name', label: 'Customer', render: c => `<div class="cell-media"><span class="avatar avatar-sm">${U.initials(c.name)}</span>
        <span class="col"><span class="small bold">${esc(c.name)}</span><span class="tiny muted">${esc(c.city)}</span></span></div>` },
      { key: 'email', label: 'Email', render: c => `<span class="small">${esc(c.email)}</span>` },
      { key: 'phone', label: 'Phone', render: c => `<span class="small">${esc(c.phone)}</span>` },
      { key: 'orders', label: 'Orders', align: 'right' },
      { key: 'bookings', label: 'Bookings', align: 'right' },
      { key: 'spent', label: 'Total spent', align: 'right', render: c => `<b>${inrShort(c.spent)}</b>` },
      { key: 'last', label: 'Last order', render: c => `<span class="tiny muted">${timeAgo(c.last)}</span>` },
      { key: 'segment', label: 'Segment', render: c => badge(c.segment) },
      { key: 'status', label: 'Status', render: c => badge(c.status) },
      { key: 'joined', label: 'Joined', render: c => `<span class="tiny muted">${dateFmt(c.joined)}</span>` },
      { key: 'act', label: '', align: 'right', render: c => `<button class="btn btn-outline btn-sm" data-user="${c.id}">View</button>` }
    ], M.customers, { rowAttr: () => 'class="u-row"' })
  }), () => {
    searchFilter('#uSearch', '.u-row');
    $('#expUsers').onclick = () => toast('Customer list exported (demo)');
    $('#notifyUsers').onclick = () => formModal('Send notification', [
      { k: 'aud', label: 'Audience', type: 'select', options: ['All customers'].concat(M.segments.map(s => s.name)), full: true },
      { k: 'title', label: 'Title', full: true }, { k: 'msg', label: 'Message', type: 'textarea', full: true },
      { k: 'ch', label: 'Channel', type: 'select', options: ['Push', 'Email', 'SMS', 'WhatsApp'] }
    ], () => toast('Notification queued'));
    $$('[data-user]').forEach(b => b.onclick = () => customerDrawer(b.dataset.user));
  });

  function customerDrawer(id) {
    const c = customerById(id); if (!c) return;
    const orders = M.orders.filter(o => o.customer === id);
    const bookings = M.bookings.filter(b => b.customer === id);
    const tab = { i: 0 };
    const TABS = ['Overview', 'Orders', 'Bookings', 'Addresses', 'Wallet & Coupons', 'Notifications', 'Support'];
    const body = () => {
      const t = TABS[tab.i];
      if (t === 'Overview') return `<div class="grid grid-2">
          <div class="mini-kpi"><b>${c.orders}</b><span>Orders</span></div>
          <div class="mini-kpi"><b>${c.bookings}</b><span>Service bookings</span></div>
          <div class="mini-kpi"><b>${inrShort(c.spent)}</b><span>Lifetime value</span></div>
          <div class="mini-kpi"><b>${inr(Math.round(c.spent / Math.max(1, c.orders)))}</b><span>Avg order value</span></div></div>
        <hr class="divider"><table class="spec-table">
          <tr><td>Email</td><td class="bold">${esc(c.email)}</td></tr>
          <tr><td>Phone</td><td class="bold">${esc(c.phone)}</td></tr>
          <tr><td>City</td><td class="bold">${esc(c.city)}</td></tr>
          <tr><td>Segment</td><td>${badge(c.segment)}</td></tr>
          <tr><td>Joined</td><td class="bold">${dateFmt(c.joined)}</td></tr>
          <tr><td>Last order</td><td class="bold">${timeAgo(c.last)}</td></tr></table>`;
      if (t === 'Orders') return orders.length ? table([
          { key: 'id', label: 'Order' }, { key: 'date', label: 'Date', render: o => dateFmt(o.date) },
          { key: 'status', label: 'Status', render: o => badge(o.status) },
          { key: 'total', label: 'Amount', align: 'right', render: o => inr(o.total) }], orders)
        : '<p class="muted small">No orders yet.</p>';
      if (t === 'Bookings') return bookings.length ? table([
          { key: 'id', label: 'Booking' }, { key: 'pkg', label: 'Service', render: b => esc(pkgById(b.pkg).name) },
          { key: 'date', label: 'Date', render: b => dateFmt(b.date) + ' · ' + b.slot },
          { key: 'status', label: 'Status', render: b => badge(b.status) },
          { key: 'amount', label: 'Amount', align: 'right', render: b => inr(b.amount) }], bookings)
        : '<p class="muted small">No service bookings yet.</p>';
      if (t === 'Addresses') return M.addresses.map(a => `<div class="tile mb-3"><b class="small">${esc(a.label)}</b>
        <p class="tiny muted mt-2">${esc(a.line)}, ${esc(a.area)}, ${esc(a.city)} — ${esc(a.pin)}</p></div>`).join('');
      if (t === 'Wallet & Coupons') return `<div class="tile row-between"><span class="col"><b>Wallet balance</b>
          <span class="tiny muted">Usable on products and services</span></span><b class="h4">${inr(c.wallet)}</b></div>
        <b class="small" style="display:block;margin-top:16px">Coupons issued</b>
        <div class="col gap-2 mt-2">${M.coupons.slice(0, 3).map(cp => `<div class="tile row-between">
          <code class="kbd">${esc(cp.code)}</code>${badge(cp.status)}</div>`).join('')}</div>`;
      if (t === 'Notifications') return M.customerNotifications.map(n => `<div class="row gap-3" style="padding:10px 0;border-bottom:1px solid var(--border)">
        <span>${n.icon}</span><div class="col"><b class="small">${esc(n.title)}</b><span class="tiny muted">${esc(n.body)}</span></div></div>`).join('');
      return M.supportTickets.map(t2 => `<div class="tile mb-2 row-between"><span class="col"><b class="small">${esc(t2.subject)}</b>
        <span class="tiny muted">${esc(t2.id)} · ${esc(t2.priority)} priority</span></span>${badge(t2.status === 'Open' ? 'Placed' : 'Delivered')}</div>`).join('');
    };
    drawer({ title: c.name, wide: true,
      body: `<div class="row gap-3 mb-4"><span class="avatar avatar-lg">${U.initials(c.name)}</span>
          <div class="col grow"><b class="h5">${esc(c.name)}</b><span class="small muted">${esc(c.email)}</span>
            <div class="row gap-2 mt-2">${badge(c.status)}${badge(c.segment)}</div></div></div>
        <div class="form-tabs" id="cTabs">${TABS.map((t, i) => `<button class="${i === 0 ? 'is-active' : ''}" data-t="${i}">${t}</button>`).join('')}</div>
        <div class="mt-4" id="cTabBody">${body()}</div>`,
      foot: `<div class="row gap-2 wrap"><button class="btn btn-outline btn-sm" id="cEdit">Edit</button>
        <button class="btn btn-outline btn-sm" id="cNote">Add note</button>
        <button class="btn btn-outline btn-sm" id="cNotif">Send notification</button>
        <button class="btn btn-danger btn-sm" id="cBlock">${c.status === 'Blocked' ? 'Unblock' : 'Block'}</button></div>`,
      onOpen(root) {
        $$('#cTabs button', root).forEach(b => b.onclick = () => {
          tab.i = +b.dataset.t;
          $$('#cTabs button', root).forEach((x, i) => x.classList.toggle('is-active', i === tab.i));
          $('#cTabBody', root).innerHTML = body();
        });
        $('#cEdit', root).onclick = () => formModal('Edit customer', [
          { k: 'name', label: 'Full name', value: c.name, full: true }, { k: 'email', label: 'Email', value: c.email },
          { k: 'phone', label: 'Phone', value: c.phone }, { k: 'city', label: 'City', type: 'select', value: c.city, options: M.business.cities },
          { k: 'status', label: 'Status', type: 'select', value: c.status, options: ['Active', 'Inactive', 'Blocked'] }
        ], () => toast('Customer updated'));
        $('#cNote', root).onclick = () => formModal('Add internal note', [{ k: 'note', label: 'Note', type: 'textarea', full: true }],
          () => toast('Note added to customer profile'));
        $('#cNotif', root).onclick = () => formModal('Send notification to ' + c.name, [
          { k: 'title', label: 'Title', full: true }, { k: 'msg', label: 'Message', type: 'textarea', full: true },
          { k: 'ch', label: 'Channel', type: 'select', options: ['Push', 'SMS', 'Email', 'WhatsApp'] }], () => toast('Notification sent'));
        $('#cBlock', root).onclick = () => confirmDialog(c.status === 'Blocked' ? 'Unblock customer?' : 'Block customer?',
          c.status === 'Blocked' ? 'They will be able to place orders again.' : 'They will not be able to place new orders or bookings.',
          () => { closeDrawer(); toast('Customer ' + (c.status === 'Blocked' ? 'unblocked' : 'blocked'), 'info'); },
          c.status === 'Blocked' ? 'Unblock' : 'Block');
      } });
  }

  view('segments', () => listShell({
    title: 'Segments', sub: 'Dynamic audiences used by campaigns and offers',
    actions: `<button class="btn btn-primary btn-sm" id="newSeg">${icon('plus', 14)} Create segment</button>`,
    tableHTML: table([
      { key: 'name', label: 'Segment', render: s => `<b class="small">${esc(s.name)}</b>` },
      { key: 'rule', label: 'Rule', render: s => `<span class="tiny muted">${esc(s.rule)}</span>` },
      { key: 'size', label: 'Customers', align: 'right', render: s => `<b>${num(s.size)}</b>` },
      { key: 'growth', label: 'Growth (30d)', align: 'right', render: s => `<span style="color:${s.growth.startsWith('-') ? 'var(--error)' : 'var(--success)'}">${esc(s.growth)}</span>` },
      { key: 'channel', label: 'Preferred channels' },
      { key: 'act', label: '', align: 'right', render: s => `<div class="actions">
          <button class="btn btn-outline btn-sm" data-seg="${s.id}">Campaign</button>${actionBtns(s, { view: false, dup: false })}</div>` }
    ], M.segments)
  }), () => {
    $('#newSeg').onclick = () => formModal('Create segment', [
      { k: 'name', label: 'Segment name', full: true },
      { k: 'field', label: 'Condition', type: 'select', options: ['Lifetime spend', 'Order count', 'Days since last order', 'Bought category', 'Booked service', 'City'] },
      { k: 'op', label: 'Operator', type: 'select', options: ['greater than', 'less than', 'equals', 'contains'] },
      { k: 'val', label: 'Value', full: true }
    ], () => toast('Segment created — audience refreshing'));
    $$('[data-seg]').forEach(b => b.onclick = () => { toast('Opening campaign builder for this segment', 'info'); go('campaigns'); });
    bindActions({ edit: () => toast('Segment rules updated') });
  });

  /* ============================================================
     SERVICES
     ============================================================ */
  view('svc-categories', () => listShell({
    title: 'Service Categories', sub: `${M.serviceCategories.length} categories live`,
    actions: `<button class="btn btn-primary btn-sm" id="newSvcCat">${icon('plus', 14)} Add category</button>`,
    tableHTML: table([
      { key: 'name', label: 'Category', render: c => `<div class="cell-media">
        <span class="avatar avatar-sm" style="background:${c.color}22">${c.icon}</span>
        <span class="col"><b class="small">${esc(c.name)}</b><span class="tiny muted">${esc(c.desc)}</span></span></div>` },
      { key: 'pkgs', label: 'Packages', align: 'right', render: c => M.servicePackages.filter(p => p.catId === c.id).length },
      { key: 'pros', label: 'Professionals', align: 'right', render: c => M.professionals.filter(p => p.cats.includes(c.id)).length },
      { key: 'rating', label: 'Rating', render: c => `<span class="rating-pill">${c.rating} ★</span>` },
      { key: 'bookings', label: 'Bookings', align: 'right' },
      { key: 'act', label: '', align: 'right', render: c => actionBtns(c, { view: false, dup: false }) }
    ], M.serviceCategories)
  }), () => {
    const f = c => [{ k: 'name', label: 'Category name', value: c ? c.name : '', full: true },
      { k: 'icon', label: 'Icon (emoji)', value: c ? c.icon : '' },
      { k: 'color', label: 'Accent colour', value: c ? c.color : '#5B3DF5' },
      { k: 'desc', label: 'Description', type: 'textarea', value: c ? c.desc : '', full: true },
      { k: 'status', label: 'Status', type: 'select', options: ['Live', 'Pilot', 'Draft'] }];
    $('#newSvcCat').onclick = () => formModal('Add service category', f(null), () => toast('Service category created'));
    bindActions({ edit: id => formModal('Edit service category', f(svcCatById(id)), () => toast('Category updated')) });
  });

  view('packages', () => listShell({
    title: 'Service Packages', sub: `${M.servicePackages.length} packages · fixed-price service SKUs`,
    actions: `<button class="btn btn-primary btn-sm" id="newPkg">${icon('plus', 14)} Add package</button>`,
    filters: `<div class="search-box" style="width:280px">${icon('search', 16)}<input id="pkSearch" placeholder="Search packages"></div>
      <select class="select" style="width:190px"><option>All categories</option>${M.serviceCategories.map(c => `<option>${esc(c.name)}</option>`).join('')}</select>`,
    tableHTML: table([
      { key: 'name', label: 'Package', render: p => `<div class="cell-media"><span class="avatar avatar-sm">${svcCatById(p.catId).icon}</span>
        <span class="col"><b class="small">${esc(p.name)}</b><span class="tiny muted">${esc(svcCatById(p.catId).name)}</span></span></div>` },
      { key: 'price', label: 'Price', align: 'right', render: p => `<b>${inr(p.price)}</b><br><span class="tiny strike">${inr(p.mrp)}</span>` },
      { key: 'duration', label: 'Duration' },
      { key: 'rating', label: 'Rating', render: p => `<span class="rating-pill">${p.rating} ★</span> <span class="tiny muted">${num(p.reviews)}</span>` },
      { key: 'inc', label: 'Inclusions', align: 'right', render: p => p.includes.length },
      { key: 'bundle', label: 'Cross-sell', render: p => p.bundleFor ? '<span class="badge badge-primary badge-plain">Product bundle</span>' : '<span class="tiny muted">—</span>' },
      { key: 'act', label: '', align: 'right', render: p => actionBtns(p, { view: false }) }
    ], M.servicePackages, { rowAttr: () => 'class="pk-row"' })
  }), () => {
    searchFilter('#pkSearch', '.pk-row');
    const f = p => [
      { k: 'name', label: 'Package name', value: p ? p.name : '', full: true },
      { k: 'cat', label: 'Service category', type: 'select', value: p ? svcCatById(p.catId).name : '', options: M.serviceCategories.map(c => c.name) },
      { k: 'price', label: 'Price (₹)', type: 'number', value: p ? p.price : 0 },
      { k: 'mrp', label: 'MRP (₹)', type: 'number', value: p ? p.mrp : 0 },
      { k: 'duration', label: 'Estimated duration', value: p ? p.duration : '' },
      { k: 'desc', label: 'Description', type: 'textarea', value: p ? p.desc : '', full: true },
      { k: 'includes', label: 'Included items (one per line)', type: 'textarea', value: p ? p.includes.join('\n') : '', full: true },
      { k: 'excludes', label: 'Excluded items (one per line)', type: 'textarea', value: p ? p.excludes.join('\n') : '', full: true },
      { k: 'bundle', label: 'Cross-sell with product category', type: 'select',
        options: ['— none —'].concat(M.flatCategories.map(c => c.name)) },
      { k: 'sub', label: 'Subscription plan', type: 'switch', value: p ? !!p.subscription : false }
    ];
    $('#newPkg').onclick = () => formModal('Add service package', f(null), () => toast('Package created'), 'modal-lg');
    bindActions({ edit: id => formModal('Edit package', f(pkgById(id)), () => toast('Package updated'), 'modal-lg'),
      dup: () => toast('Package duplicated') });
  });

  view('bookings', () => listShell({
    title: 'Service Bookings', sub: `${M.bookings.length} bookings · ${M.bookings.filter(b => !b.pro).length} awaiting assignment`,
    actions: `<button class="btn btn-outline btn-sm" id="expBk">${icon('download', 14)} Export</button>`,
    filters: `<div class="search-box" style="width:280px">${icon('search', 16)}<input id="bkSearch" placeholder="Search booking, customer"></div>
      <select class="select" style="width:180px"><option>All statuses</option><option>Booking Confirmed</option>
        <option>Professional Assigned</option><option>Service Completed</option><option>Cancelled</option></select>
      <select class="select" style="width:150px"><option>All cities</option>${M.serviceAreas.map(a => `<option>${esc(a.city)}</option>`).join('')}</select>`,
    tableHTML: table([
      { key: 'id', label: 'Booking', render: b => `<b class="small">${esc(b.id)}</b>
        ${b.fromOrder ? `<br><span class="tiny muted">from ${esc(b.fromOrder)}</span>` : ''}` },
      { key: 'pkg', label: 'Service', render: b => `<div class="cell-media"><span class="avatar avatar-sm">${svcCatById(pkgById(b.pkg).catId).icon}</span>
        <span class="small">${esc(pkgById(b.pkg).name)}</span></div>` },
      { key: 'customer', label: 'Customer', render: b => esc((customerById(b.customer) || {}).name || '—') },
      { key: 'date', label: 'Slot', render: b => `<span class="small">${dateFmt(b.date)}</span><br><span class="tiny muted">${esc(b.slot)}</span>` },
      { key: 'pro', label: 'Professional', render: b => b.pro
        ? `<div class="cell-media"><span class="avatar avatar-sm">${proById(b.pro).photo}</span><span class="small">${esc(proById(b.pro).name)}</span></div>`
        : '<span class="badge badge-warning">Unassigned</span>' },
      { key: 'city', label: 'City' },
      { key: 'amount', label: 'Amount', align: 'right', render: b => `<b>${inr(b.amount)}</b>` },
      { key: 'status', label: 'Status', render: b => badge(b.status) },
      { key: 'act', label: '', align: 'right', render: b => `<button class="btn btn-outline btn-sm" data-bk="${b.id}">Manage</button>` }
    ], M.bookings, { rowAttr: () => 'class="bk-row"' })
  }), () => {
    searchFilter('#bkSearch', '.bk-row');
    $('#expBk').onclick = () => toast('Bookings exported (demo)');
    $$('[data-bk]').forEach(btn => btn.onclick = () => {
      const b = M.bookings.find(x => x.id === btn.dataset.bk);
      const pkg = pkgById(b.pkg), c = customerById(b.customer) || {};
      const idx = Math.max(0, M.bookingTimeline.findIndex(s => s.key === b.status));
      drawer({ title: 'Booking ' + b.id,
        body: `<div class="row-between mb-4">${badge(b.status)}<span class="tiny muted">${dateFmt(b.date)} · ${esc(b.slot)}</span></div>
          <div class="tile mb-4"><b class="small">${svcCatById(pkg.catId).icon} ${esc(pkg.name)}</b>
            <p class="tiny muted mt-2">${esc(pkg.duration)} · ${inr(b.amount)}</p></div>
          <table class="spec-table">
            <tr><td>Customer</td><td class="bold">${esc(c.name || '—')}</td></tr>
            <tr><td>Phone</td><td class="bold">${esc(c.phone || '—')}</td></tr>
            <tr><td>Address</td><td class="bold">${esc(b.address)}</td></tr>
            <tr><td>City</td><td class="bold">${esc(b.city)}</td></tr>
            ${b.fromOrder ? `<tr><td>Linked order</td><td class="bold">${esc(b.fromOrder)}</td></tr>` : ''}</table>
          <b class="small" style="display:block;margin-top:18px">Progress</b>
          <div class="timeline mt-3">${M.bookingTimeline.map((s, i) => `
            <div class="tl-item ${i < idx ? 'done' : i === idx ? 'current' : ''}">
              <div class="tl-title">${esc(s.label)}</div><div class="tl-meta">${esc(s.note)}</div></div>`).join('')}</div>`,
        foot: `<div class="row gap-2"><select class="select grow" id="bkPro">
            <option>— assign professional —</option>
            ${M.professionals.filter(p => p.cats.includes(pkg.catId)).map(p =>
              `<option ${b.pro === p.id ? 'selected' : ''}>${esc(p.name)} · ${p.rating}★</option>`).join('')}</select>
          <button class="btn btn-primary" id="bkAssign">Assign</button></div>`,
        onOpen(r) { $('#bkAssign', r).onclick = () => { closeDrawer(); toast('Professional assigned and notified'); }; } });
    });
  });

  view('professionals', () => listShell({
    title: 'Professionals', sub: `${M.professionals.filter(p => p.status === 'Active').length} active partners`,
    actions: `<button class="btn btn-primary btn-sm" id="newPro">${icon('plus', 14)} Onboard professional</button>`,
    filters: `<div class="search-box" style="width:280px">${icon('search', 16)}<input id="prSearch" placeholder="Search name or skill"></div>
      <select class="select" style="width:190px"><option>All categories</option>${M.serviceCategories.map(c => `<option>${esc(c.name)}</option>`).join('')}</select>
      <select class="select" style="width:150px"><option>All statuses</option><option>Active</option><option>Pending</option><option>Blocked</option></select>`,
    tableHTML: table([
      { key: 'name', label: 'Professional', render: p => `<div class="cell-media"><span class="avatar avatar-sm">${esc(p.photo)}</span>
        <span class="col"><b class="small">${esc(p.name)}</b><span class="tiny muted">${esc(p.exp)} experience</span></span></div>` },
      { key: 'cats', label: 'Categories', render: p => p.cats.map(c => `<span class="tag">${esc(svcCatById(c).name)}</span>`).join(' ') },
      { key: 'skills', label: 'Skills', render: p => `<span class="tiny muted">${p.skills.join(', ')}</span>` },
      { key: 'rating', label: 'Rating', render: p => `<span class="rating-pill">${p.rating} ★</span>` },
      { key: 'jobs', label: 'Jobs done', align: 'right', render: p => num(p.jobs) },
      { key: 'area', label: 'Service area', render: p => `<span class="tiny">${esc(p.area)}</span>` },
      { key: 'availability', label: 'Availability', render: p => badge(p.availability) },
      { key: 'verified', label: 'Verification', render: p => p.verified ? badge('Active', 'success') : badge('Pending') },
      { key: 'status', label: 'Status', render: p => badge(p.status) },
      { key: 'act', label: '', align: 'right', render: p => `<button class="btn btn-outline btn-sm" data-pro="${p.id}">Profile</button>` }
    ], M.professionals, { rowAttr: () => 'class="pr-row"' })
  }), () => {
    searchFilter('#prSearch', '.pr-row');
    $('#newPro').onclick = () => formModal('Onboard professional', [
      { k: 'name', label: 'Full name', full: true }, { k: 'phone', label: 'Mobile' },
      { k: 'exp', label: 'Experience (years)', type: 'number' },
      { k: 'cats', label: 'Primary category', type: 'select', options: M.serviceCategories.map(c => c.name) },
      { k: 'skills', label: 'Skills (comma separated)', full: true },
      { k: 'area', label: 'Service area', full: true },
      { k: 'city', label: 'City', type: 'select', options: M.serviceAreas.map(a => a.city) },
      { k: 'kyc', label: 'KYC verified', type: 'switch' }
    ], () => toast('Professional onboarded — pending verification'), 'modal-lg');
    $$('[data-pro]').forEach(b => b.onclick = () => {
      const p = proById(b.dataset.pro);
      const jobs = M.bookings.filter(x => x.pro === p.id);
      drawer({ title: p.name,
        body: `<div class="row gap-3 mb-4"><span class="avatar avatar-lg">${esc(p.photo)}</span>
            <div class="col grow"><b class="h5">${esc(p.name)}</b>
              <span class="small muted">${stars(p.rating)} · ${num(p.jobs)} jobs · ${esc(p.exp)}</span>
              <div class="row gap-2 mt-2">${badge(p.status)}${badge(p.availability)}
                ${p.verified ? '<span class="badge badge-success badge-plain">Verified</span>' : ''}</div></div></div>
          <div class="grid grid-2 mb-4">
            <div class="mini-kpi"><b>${p.rating}</b><span>Average rating</span></div>
            <div class="mini-kpi"><b>${num(p.jobs)}</b><span>Completed jobs</span></div>
            <div class="mini-kpi"><b>96%</b><span>On-time arrival</span></div>
            <div class="mini-kpi"><b>${inrShort(p.jobs * 480)}</b><span>Lifetime earnings</span></div></div>
          <table class="spec-table">
            <tr><td>Categories</td><td class="bold">${p.cats.map(c => svcCatById(c).name).join(', ')}</td></tr>
            <tr><td>Skills</td><td class="bold">${p.skills.join(', ')}</td></tr>
            <tr><td>Service area</td><td class="bold">${esc(p.area)}</td></tr>
            <tr><td>Verification</td><td class="bold">${p.verified ? 'Aadhaar + police verification done' : 'Pending'}</td></tr></table>
          <b class="small" style="display:block;margin-top:18px">Recent jobs</b>
          ${jobs.length ? table([{ key: 'id', label: 'Booking' },
            { key: 'pkg', label: 'Service', render: j => esc(pkgById(j.pkg).name) },
            { key: 'status', label: 'Status', render: j => badge(j.status) }], jobs) : '<p class="muted small mt-2">No jobs yet.</p>'}`,
        foot: `<div class="row gap-2"><button class="btn btn-outline btn-sm grow" id="prEdit">Edit</button>
          <button class="btn btn-outline btn-sm grow" id="prSlots">Availability</button>
          <button class="btn btn-danger btn-sm" id="prBlock">${p.status === 'Blocked' ? 'Unblock' : 'Block'}</button></div>`,
        onOpen(r) {
          $('#prEdit', r).onclick = () => formModal('Edit professional', [
            { k: 'name', label: 'Name', value: p.name, full: true },
            { k: 'area', label: 'Service area', value: p.area, full: true },
            { k: 'status', label: 'Status', type: 'select', value: p.status, options: ['Active', 'Pending', 'Blocked'] }
          ], () => toast('Professional updated'));
          $('#prSlots', r).onclick = () => { closeDrawer(); go('availability'); };
          $('#prBlock', r).onclick = () => confirmDialog('Change partner status?',
            'They will stop receiving new job allocations.', () => { closeDrawer(); toast('Status updated', 'info'); }, 'Confirm');
        } });
    });
  });

  view('availability', () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return `${pageHead('Availability', 'Slot capacity per professional — drives what customers can book',
      `<button class="btn btn-primary btn-sm" id="saveAvail">Save capacity</button>`)}
      <div class="pane"><div class="pane-body tight">
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Professional</th>${M.timeSlots.map(s => `<th class="center">${s}</th>`).join('')}<th class="center">Weekly load</th></tr></thead>
          <tbody>${M.professionals.filter(p => p.status === 'Active').map(p => `<tr>
            <td><div class="cell-media"><span class="avatar avatar-sm">${esc(p.photo)}</span>
              <span class="col"><b class="small">${esc(p.name)}</b><span class="tiny muted">${esc(svcCatById(p.cats[0]).name)}</span></span></div></td>
            ${M.timeSlots.map((s, i) => `<td class="center"><label class="switch">
              <input type="checkbox" ${(i + p.jobs) % 4 !== 0 ? 'checked' : ''}><span></span></label></td>`).join('')}
            <td class="center"><div class="progress" style="width:70px;margin:0 auto"><i style="width:${60 + (p.jobs % 4) * 10}%"></i></div>
              <span class="tiny muted">${60 + (p.jobs % 4) * 10}%</span></td></tr>`).join('')}</tbody></table></div>
      </div></div>
      <div class="grid-dash mt-4">
        <div class="pane span-6"><div class="pane-head"><b>Weekly slot capacity</b></div>
          <div class="pane-body">${Chart.columns(days, [420, 405, 430, 445, 480, 610, 520], [380, 360, 395, 410, 445, 580, 470])}
            <div class="legend mt-2"><span><i style="background:var(--primary)"></i>Capacity</span>
              <span><i style="background:var(--secondary)"></i>Booked</span></div></div></div>
        <div class="pane span-6"><div class="pane-head"><b>Utilisation by category</b></div>
          <div class="pane-body">${Chart.bars(M.serviceStats.map(s => ({ label: s.label, value: parseInt(s.util) })), { money: false })}</div></div>
      </div>`;
  }, () => $('#saveAvail').onclick = () => toast('Availability saved'));

  view('areas', () => listShell({
    title: 'Service Areas', sub: 'City and pincode serviceability for the services marketplace',
    actions: `<button class="btn btn-primary btn-sm" id="newArea">${icon('plus', 14)} Add area</button>`,
    tableHTML: table([
      { key: 'city', label: 'City', render: a => `<b class="small">${esc(a.city)}</b>` },
      { key: 'pincodes', label: 'Pincode range' },
      { key: 'cats', label: 'Categories live', align: 'right' },
      { key: 'pros', label: 'Professionals', align: 'right', render: a => num(a.pros) },
      { key: 'slots', label: 'Working hours' },
      { key: 'status', label: 'Status', render: a => badge(a.status) },
      { key: 'act', label: '', align: 'right', render: a => actionBtns(a, { view: false, dup: false }) }
    ], M.serviceAreas)
  }), () => {
    $('#newArea').onclick = () => formModal('Add service area', [
      { k: 'city', label: 'City', full: true }, { k: 'pin', label: 'Pincode range', full: true },
      { k: 'slots', label: 'Working hours', value: '09:00–20:00' },
      { k: 'status', label: 'Status', type: 'select', options: ['Planned', 'Pilot', 'Live'] }
    ], () => toast('Service area added'));
    bindActions({ edit: () => toast('Service area updated') });
  });

  /* ============================================================
     LOGISTICS
     ============================================================ */
  view('shipments', () => listShell({
    title: 'Shipments', sub: `${M.shipments.length} shipments · ${M.shipments.filter(s => s.delayed).length} delayed`,
    actions: `<button class="btn btn-outline btn-sm" id="bulkLabel">Print labels</button>
              <button class="btn btn-primary btn-sm" id="newPickup">Schedule pickup</button>`,
    filters: `<div class="search-box" style="width:280px">${icon('search', 16)}<input id="shSearch" placeholder="Search AWB or order"></div>
      <select class="select" style="width:160px"><option>All couriers</option>${M.couriers.map(c => `<option>${c}</option>`).join('')}</select>`,
    tableHTML: table([
      { key: 'id', label: 'Shipment', render: s => `<b class="small">${esc(s.id)}</b><br><span class="tiny muted">${esc(s.order)}</span>` },
      { key: 'courier', label: 'Courier', render: s => `<span class="tag">${esc(s.courier)}</span>` },
      { key: 'awb', label: 'AWB', render: s => `<span class="small">${esc(s.awb)}</span>` },
      { key: 'city', label: 'Destination' },
      { key: 'weight', label: 'Weight', align: 'right' },
      { key: 'cost', label: 'Shipping cost', align: 'right', render: s => inr(s.cost) },
      { key: 'eta', label: 'ETA' },
      { key: 'status', label: 'Status', render: s => badge(s.status) + (s.delayed ? ' <span class="badge badge-error">Delayed</span>' : '') },
      { key: 'act', label: '', align: 'right', render: s => `<button class="btn btn-ghost btn-sm" data-track="${s.awb}">${icon('eye', 15)}</button>` }
    ], M.shipments, { rowAttr: () => 'class="sh-row"' })
  }), () => {
    searchFilter('#shSearch', '.sh-row');
    $('#bulkLabel').onclick = () => toast('12 labels queued for printing');
    $('#newPickup').onclick = () => formModal('Schedule pickup', [
      { k: 'wh', label: 'Warehouse', type: 'select', options: M.warehouses.map(w => w.name) },
      { k: 'courier', label: 'Courier', type: 'select', options: M.couriers },
      { k: 'date', label: 'Pickup date', type: 'date' }, { k: 'count', label: 'Package count', type: 'number', value: 24 }
    ], () => toast('Pickup scheduled with courier'));
    $$('[data-track]').forEach(b => b.onclick = () => drawer({ title: 'Tracking ' + b.dataset.track,
      body: `<div class="timeline">${M.orderTimeline.map((s, i) => `
        <div class="tl-item ${i < 3 ? 'done' : i === 3 ? 'current' : ''}"><div class="tl-title">${esc(s.label)}</div>
          <div class="tl-meta">${esc(s.note)} · scan at hub</div></div>`).join('')}</div>` }));
  });

  view('shipping-providers', () => `${pageHead('Shipping Providers', 'Settings → Integrations → Shipping Providers · demo credentials only',
    `<button class="btn btn-primary btn-sm" id="addProv">${icon('plus', 14)} Add provider</button>`)}
    <div class="grid-dash">${M.shippingProviders.map(p => `
      <div class="pane span-6"><div class="pane-head">
        <div class="row gap-3"><span class="avatar avatar-sm" style="background:var(--n-900);color:#fff">${esc(p.name.slice(0, 2).toUpperCase())}</span>
          <div class="col"><b>${esc(p.name)}</b><span class="tiny muted">Priority ${p.priority} · avg ${p.avgDays} days</span></div></div>
        <label class="switch"><input type="checkbox" ${p.enabled ? 'checked' : ''} data-prov-toggle="${p.id}"><span></span></label></div>
        <div class="pane-body">
          <div class="form-grid">
            <div class="field"><label class="label">API key</label><input class="input" value="${esc(p.apiKey)}" readonly></div>
            <div class="field"><label class="label">API secret</label><input class="input" type="password" value="${esc(p.secret)}" readonly></div>
            <div class="field full"><label class="label">Base URL</label><input class="input" value="${esc(p.base)}" readonly></div>
            <div class="field"><label class="label">Priority</label><input class="input" type="number" value="${p.priority}"></div>
            <div class="field"><label class="label">COD supported</label>
              <select class="select"><option ${p.cod ? 'selected' : ''}>Yes</option><option ${!p.cod ? 'selected' : ''}>No</option></select></div></div>
          <div class="row-between mt-4"><div class="col"><span class="tiny muted">Serviceability</span>
              <b class="small">${esc(p.serviceability)}</b></div>
            <div class="row gap-2">${badge(p.tested === 'Connected' ? 'Active' : 'Pending')}
              <button class="btn btn-outline btn-sm" data-test="${p.id}">Test connection</button>
              <button class="btn btn-ghost btn-sm" data-prov-edit="${p.id}">${icon('edit', 15)}</button></div></div>
        </div></div>`).join('')}</div>
    <p class="tiny muted mt-4">🔒 Credentials shown are dummy placeholders. Real keys should live in server-side secret storage, never in the client.</p>`,
  () => {
    $('#addProv').onclick = () => formModal('Add shipping provider', [
      { k: 'name', label: 'Provider name', full: true }, { k: 'key', label: 'API key' }, { k: 'secret', label: 'API secret', type: 'password' },
      { k: 'base', label: 'Base URL', full: true }, { k: 'priority', label: 'Priority', type: 'number', value: 6 },
      { k: 'enabled', label: 'Enabled', type: 'switch', value: true }
    ], () => toast('Provider added — run a test connection'));
    $$('[data-test]').forEach(b => b.onclick = () => {
      b.textContent = 'Testing…';
      setTimeout(() => { b.textContent = 'Test connection'; toast('Connection successful — 200 OK (demo)'); }, 900);
    });
    $$('[data-prov-toggle]').forEach(t => t.onchange = e => toast('Provider ' + (e.target.checked ? 'enabled' : 'disabled'), 'info'));
    $$('[data-prov-edit]').forEach(b => b.onclick = () => {
      const p = M.shippingProviders.find(x => x.id === b.dataset.provEdit);
      formModal('Edit ' + p.name, [
        { k: 'key', label: 'API key', value: p.apiKey }, { k: 'secret', label: 'API secret', type: 'password', value: '••••••••' },
        { k: 'base', label: 'Base URL', value: p.base, full: true }, { k: 'priority', label: 'Priority', type: 'number', value: p.priority }
      ], () => toast('Provider updated'));
    });
  });

  view('warehouses', () => listShell({
    title: 'Warehouses', sub: `${M.warehouses.length} fulfilment locations`,
    actions: `<button class="btn btn-primary btn-sm" id="newWh">${icon('plus', 14)} Add warehouse</button>`,
    tableHTML: table([
      { key: 'name', label: 'Warehouse', render: w => `<b class="small">${esc(w.name)}</b><br><span class="tiny muted">${esc(w.city)} — ${esc(w.pincode)}</span>` },
      { key: 'skus', label: 'SKUs', align: 'right', render: w => num(w.skus) },
      { key: 'units', label: 'Units', align: 'right', render: w => num(w.units) },
      { key: 'capacity', label: 'Capacity used', render: w => `<div class="row gap-2"><div class="progress" style="width:80px">
          <i style="width:${w.capacity}%;background:${w.capacity > 70 ? 'var(--warning)' : 'var(--primary)'}"></i></div>
          <span class="tiny">${w.capacity}%</span></div>` },
      { key: 'manager', label: 'Manager' },
      { key: 'status', label: 'Status', render: w => badge(w.status === 'Pilot' ? 'Pending' : 'Active') },
      { key: 'act', label: '', align: 'right', render: w => actionBtns(w, { view: false, dup: false }) }
    ], M.warehouses)
  }), () => {
    $('#newWh').onclick = () => formModal('Add warehouse', [
      { k: 'name', label: 'Warehouse name', full: true }, { k: 'city', label: 'City' }, { k: 'pin', label: 'Pincode' },
      { k: 'manager', label: 'Manager', full: true }, { k: 'type', label: 'Type', type: 'select', options: ['Fulfilment centre', 'Dark store', 'Return hub'] }
    ], () => toast('Warehouse added'));
    bindActions({ edit: () => toast('Warehouse updated') });
  });

  /* ============================================================
     ANALYTICS
     ============================================================ */
  const kpiRow = items => `<div class="kpi-grid mb-4">${items.map(([l, v, d]) => `
    <div class="kpi"><span class="lbl">${l}</span><span class="val">${v}</span>
      ${d ? `<span class="delta ${d.startsWith('-') ? 'down' : 'up'}">${d}</span>` : ''}</div>`).join('')}</div>`;

  view('an-sales', () => `${pageHead('Sales analytics', 'Revenue, orders and conversion across products and services')}
    ${kpiRow([['Revenue', inrShort(3464000), '+18.4%'], ['Orders', '2,373', '+12.1%'], ['AOV', inr(2841), '+3.8%'],
      ['Conversion', '3.7%', '+0.4pt'], ['Refund rate', '1.9%', '-0.3pt'], ['Repeat rate', '38.2%', '+2.1pt']])}
    <div class="grid-dash">
      <div class="pane span-8"><div class="pane-head"><b>Revenue — product vs service</b></div>
        <div class="pane-body">${Chart.line([
          { name: 'Products', color: U.cssVar('--primary'), data: M.revenueTrend.map(r => r.product) },
          { name: 'Services', color: U.cssVar('--secondary'), data: M.revenueTrend.map(r => r.service) }], M.revenueTrend.map(r => r.d))}</div></div>
      <div class="pane span-4"><div class="pane-head"><b>Conversion funnel</b></div>
        <div class="pane-body">${Chart.funnel(M.funnel)}</div></div>
      <div class="pane span-6"><div class="pane-head"><b>Sales by category</b></div>
        <div class="pane-body">${Chart.bars(M.categorySales)}</div></div>
      <div class="pane span-6"><div class="pane-head"><b>Sales by channel</b></div>
        <div class="pane-body">${Chart.donut(M.channelSales, inrShort(M.channelSales.reduce((s, c) => s + c.value, 0)), 'Last 30 days')}</div></div>
    </div>`);

  view('an-products', () => {
    const top = M.products.slice().sort((a, b) => b.reviews - a.reviews);
    return `${pageHead('Product analytics', 'Best sellers, slow movers, views and wishlists')}
      ${kpiRow([['Products live', String(M.products.length)], ['Most viewed', 'boAt Rockerz'], ['Most wishlisted', 'Nike Air Max'],
        ['Slow movers', '3 SKUs'], ['Avg rating', '4.3 ★']])}
      <div class="grid-dash">
        <div class="pane span-6"><div class="pane-head"><b>Top products by revenue</b></div>
          <div class="pane-body">${Chart.bars(top.slice(0, 6).map(p => ({ label: p.name, value: p.price * (p.reviews / 10) })))}</div></div>
        <div class="pane span-6"><div class="pane-head"><b>Slow-moving products</b></div>
          <div class="pane-body tight">${table([
            { key: 'name', label: 'Product', render: p => `<span class="small clamp1" style="max-width:220px">${esc(p.name)}</span>` },
            { key: 'stock', label: 'Stock', align: 'right' },
            { key: 'reviews', label: 'Reviews', align: 'right', render: p => num(p.reviews) },
            { key: 'days', label: 'Days in stock', align: 'right', render: () => 60 + Math.floor(Math.random() * 90) }
          ], top.slice(-4))}</div></div>
        <div class="pane span-6"><div class="pane-head"><b>Most viewed</b></div>
          <div class="pane-body">${Chart.bars(top.slice(0, 5).map(p => ({ label: p.name, value: p.reviews * 12, color: U.cssVar('--secondary') })), { money: false })}</div></div>
        <div class="pane span-6"><div class="pane-head"><b>Most wishlisted</b></div>
          <div class="pane-body">${Chart.bars(top.slice(1, 6).map(p => ({ label: p.name, value: p.reviews * 3, color: U.cssVar('--accent') })), { money: false })}</div></div>
      </div>`;
  });

  view('an-customers', () => `${pageHead('Customer analytics', 'Acquisition, retention and lifetime value')}
    ${kpiRow([['Total customers', '18,402', '+6.2%'], ['New (30d)', '2,140', '+9.4%'], ['Returning', '38.2%', '+2.1pt'],
      ['Avg LTV', inr(9840), '+4.6%'], ['Churn risk', '3,410', '+120']])}
    <div class="grid-dash">
      <div class="pane span-8"><div class="pane-head"><b>New vs returning customers</b></div>
        <div class="pane-body">${Chart.columns(M.ordersTrend.map(o => o.d), [180, 165, 198, 214, 202, 268, 291], [104, 97, 120, 127, 127, 134, 146])}
          <div class="legend mt-2"><span><i style="background:var(--primary)"></i>New</span>
            <span><i style="background:var(--secondary)"></i>Returning</span></div></div></div>
      <div class="pane span-4"><div class="pane-head"><b>Segments</b></div>
        <div class="pane-body">${Chart.donut([
          { label: 'VIP', value: 142, color: U.cssVar('--primary') }, { label: 'Loyal', value: 3120, color: U.cssVar('--secondary') },
          { label: 'New', value: 2140, color: U.cssVar('--accent') }, { label: 'At risk', value: 3410, color: U.cssVar('--error', '#E5484D') }], '18.4K', 'Customers')}</div></div>
      <div class="pane span-12"><div class="pane-head"><b>Top customers by lifetime value</b></div>
        <div class="pane-body tight">${table([
          { key: 'name', label: 'Customer', render: c => `<div class="cell-media"><span class="avatar avatar-sm">${U.initials(c.name)}</span>
            <b class="small">${esc(c.name)}</b></div>` },
          { key: 'city', label: 'City' }, { key: 'orders', label: 'Orders', align: 'right' },
          { key: 'bookings', label: 'Bookings', align: 'right' },
          { key: 'spent', label: 'Lifetime value', align: 'right', render: c => `<b>${inr(c.spent)}</b>` },
          { key: 'segment', label: 'Segment', render: c => badge(c.segment) }
        ], M.customers.slice().sort((a, b) => b.spent - a.spent))}</div></div>
    </div>`);

  view('an-inventory', () => {
    const vars = M.products.flatMap(p => p.variants);
    const value = vars.reduce((s, v) => s + v.stock * 1800, 0);
    return `${pageHead('Inventory analytics', 'Stock value, coverage and dead inventory')}
      ${kpiRow([['Stock value', inrShort(value)], ['SKUs', String(vars.length)], ['Low stock', String(vars.filter(v => v.stock < 10).length)],
        ['Out of stock', String(vars.filter(v => v.stock === 0).length)], ['Dead inventory', inrShort(value * .06)]])}
      <div class="grid-dash">
        <div class="pane span-6"><div class="pane-head"><b>Stock value by warehouse</b></div>
          <div class="pane-body">${Chart.bars(M.warehouses.map(w => ({ label: w.name, value: w.units * 1800 })))}</div></div>
        <div class="pane span-6"><div class="pane-head"><b>Stock health</b></div>
          <div class="pane-body">${Chart.donut([
            { label: 'In stock', value: vars.filter(v => v.stock >= 10 && v.stock <= 40).length, color: U.cssVar('--success', '#12A150') },
            { label: 'Low stock', value: vars.filter(v => v.stock > 0 && v.stock < 10).length, color: U.cssVar('--warning', '#F5A524') },
            { label: 'Out of stock', value: vars.filter(v => v.stock === 0).length, color: U.cssVar('--error', '#E5484D') },
            { label: 'Overstocked', value: vars.filter(v => v.stock > 40).length, color: '#3B82F6' }], String(vars.length), 'SKUs')}</div></div>
        <div class="pane span-12"><div class="pane-head"><b>Reorder recommendations</b>
          <button class="btn btn-outline btn-sm" onclick="ADMIN.go('inventory')">Open inventory</button></div>
          <div class="pane-body tight">${table([
            { key: 'sku', label: 'SKU' }, { key: 'stock', label: 'Available', align: 'right' },
            { key: 'reorder', label: 'Reorder level', align: 'right' },
            { key: 'sug', label: 'Suggested order', align: 'right', render: v => `<b>${Math.max(20, v.reorder * 3 - v.stock)}</b>` },
            { key: 'warehouse', label: 'Warehouse' }
          ], vars.filter(v => v.stock < 10).slice(0, 10))}</div></div>
      </div>`;
  });

  view('an-services', () => `${pageHead('Service analytics', 'Bookings, revenue, cancellations and professional utilisation')}
    ${kpiRow([['Bookings (7d)', '569', '+24.6%'], ['Service revenue', inrShort(628000), '+21.2%'],
      ['Cancellation rate', '4.8%', '-0.6pt'], ['Avg booking value', inr(1104), '+2.4%'],
      ['Pro utilisation', '73%', '+4pt'], ['Repeat bookings', '41%', '+3.2pt']])}
    <div class="grid-dash">
      <div class="pane span-8"><div class="pane-head"><b>Bookings trend</b></div>
        <div class="pane-body">${Chart.line([{ name: 'Bookings', color: U.cssVar('--secondary'), data: M.ordersTrend.map(o => o.bookings) }],
          M.ordersTrend.map(o => o.d))}</div></div>
      <div class="pane span-4"><div class="pane-head"><b>Revenue by service</b></div>
        <div class="pane-body">${Chart.donut(M.serviceStats.map((s, i) => ({ label: s.label, value: s.revenue,
          color: [U.cssVar('--primary'), U.cssVar('--secondary'), U.cssVar('--accent'), '#3B82F6', '#F472B6', '#F5A524'][i] })),
          inrShort(M.serviceStats.reduce((a, b) => a + b.revenue, 0)), 'Last 30 days')}</div></div>
      <div class="pane span-12"><div class="pane-head"><b>Popular services &amp; utilisation</b></div>
        <div class="pane-body tight">${table([
          { key: 'label', label: 'Service' },
          { key: 'bookings', label: 'Bookings', align: 'right', render: s => num(s.bookings) },
          { key: 'revenue', label: 'Revenue', align: 'right', render: s => inr(s.revenue) },
          { key: 'cancel', label: 'Cancellation rate', align: 'right' },
          { key: 'util', label: 'Professional utilisation', render: s => `<div class="row gap-2">
              <div class="progress" style="width:100px"><i style="width:${s.util}"></i></div><span class="tiny">${s.util}</span></div>` }
        ], M.serviceStats)}</div></div>
    </div>`);

  /* ============================================================
     SETTINGS
     ============================================================ */
  view('set-business', () => `${pageHead('Business settings', 'Store identity, tax and locale',
    `<button class="btn btn-primary btn-sm" id="saveBiz">Save changes</button>`)}
    <div class="grid-dash">
      <div class="pane span-8"><div class="pane-head"><b>Business profile</b></div>
        <div class="pane-body"><div class="form-grid">
          <div class="field"><label class="label">Legal name</label><input class="input" value="${esc(M.business.name)}"></div>
          <div class="field"><label class="label">Brand name</label><input class="input" value="${esc(M.business.brand)}"></div>
          <div class="field"><label class="label">GSTIN</label><input class="input" value="${esc(M.business.gstin)}"></div>
          <div class="field"><label class="label">Support email</label><input class="input" value="${esc(M.business.support)}"></div>
          <div class="field"><label class="label">Support phone</label><input class="input" value="${esc(M.business.phone)}"></div>
          <div class="field"><label class="label">Currency</label><select class="select"><option>${esc(M.business.currency)}</option></select></div>
          <div class="field"><label class="label">Timezone</label><select class="select"><option>${esc(M.business.timezone)}</option></select></div>
          <div class="field"><label class="label">Default language</label><select class="select"><option>English (India)</option><option>हिन्दी</option></select></div>
          <div class="field full"><label class="label">Registered address</label><textarea class="textarea">${esc(M.business.address)}</textarea></div>
        </div></div></div>
      <div class="pane span-4"><div class="pane-head"><b>Operating cities</b></div>
        <div class="pane-body"><div class="row gap-2 wrap">${M.business.cities.map(c => `<span class="chip is-active">${esc(c)} <span class="x">×</span></span>`).join('')}
          <button class="chip">${icon('plus', 13)} Add city</button></div>
          <hr class="divider"><b class="small">Feature flags</b>
          <div class="col gap-3 mt-3">${[['Services marketplace', true], ['Product + service bundles', true],
            ['Subscriptions', false], ['Multi-seller marketplace', false], ['Dark stores / 10-min delivery', false]]
            .map(([l, on]) => `<div class="row-between"><span class="small">${l}</span>
              <label class="switch"><input type="checkbox" ${on ? 'checked' : ''}><span></span></label></div>`).join('')}</div></div></div>
    </div>`, () => $('#saveBiz').onclick = () => toast('Business settings saved'));

  view('set-payments', () => `${pageHead('Payment settings', 'Gateways, methods and settlement')}
    <div class="grid-dash">
      <div class="pane span-8"><div class="pane-head"><b>Payment gateways</b>
        <button class="btn btn-outline btn-sm" id="addPg">${icon('plus', 14)} Add gateway</button></div>
        <div class="pane-body tight">${table([
          { key: 'name', label: 'Gateway', render: g => `<b class="small">${esc(g.name)}</b><br><span class="tiny muted">${esc(g.key)}</span>` },
          { key: 'methods', label: 'Methods', render: g => `<span class="tiny muted">${esc(g.methods)}</span>` },
          { key: 'fee', label: 'Fee', align: 'right' },
          { key: 'mode', label: 'Mode', render: g => `<span class="tag">${esc(g.mode)}</span>` },
          { key: 'enabled', label: 'Enabled', align: 'center', render: g => `<label class="switch"><input type="checkbox" ${g.enabled ? 'checked' : ''}><span></span></label>` }
        ], M.paymentGateways)}</div></div>
      <div class="pane span-4"><div class="pane-head"><b>Checkout methods</b></div>
        <div class="pane-body"><div class="col gap-3">${['UPI', 'Credit card', 'Debit card', 'Net banking', 'Wallet', 'Cash on delivery', 'EMI', 'Pay after service']
          .map((m, i) => `<div class="row-between"><span class="small">${m}</span>
            <label class="switch"><input type="checkbox" ${i < 6 ? 'checked' : ''}><span></span></label></div>`).join('')}</div>
          <hr class="divider"><b class="small">Settlement</b>
          <table class="spec-table mt-2"><tr><td>Cycle</td><td class="bold">T+2 working days</td></tr>
            <tr><td>Next payout</td><td class="bold">11 Aug 2026</td></tr>
            <tr><td>Pending</td><td class="bold">${inr(842000)}</td></tr></table></div></div>
    </div>`, () => $('#addPg').onclick = () => formModal('Add payment gateway', [
      { k: 'name', label: 'Gateway', type: 'select', options: ['Razorpay', 'Cashfree', 'Stripe', 'PayU', 'PhonePe'] },
      { k: 'key', label: 'API key' }, { k: 'secret', label: 'API secret', type: 'password' },
      { k: 'mode', label: 'Mode', type: 'select', options: ['Test', 'Live'] }
    ], () => toast('Gateway added in test mode')));

  view('set-shipping', () => { A.go('shipping-providers'); return ''; });
  view('set-notifications', () => { A.go('notifications'); return ''; });

  view('roles', () => {
    const active = M.roles[0].id;
    return `${pageHead('Roles & Permissions', 'Nine roles across commerce, marketing, services and finance',
      `<button class="btn btn-primary btn-sm" id="newRole">${icon('plus', 14)} Create role</button>`)}
      <div class="grid-dash">
        <div class="pane span-4"><div class="pane-head"><b>Roles</b><span class="tiny muted">${M.roles.length}</span></div>
          <div class="pane-body tight">${M.roles.map((r, i) => `
            <button class="row-between" data-role="${r.id}" style="width:100%;padding:14px 20px;border-bottom:1px solid var(--border);
              ${i === 0 ? 'background:var(--primary-50)' : ''}">
              <span class="col" style="text-align:left"><b class="small">${esc(r.name)}</b>
                <span class="tiny muted">${esc(r.desc)}</span></span>
              <span class="tag">${r.users} users</span></button>`).join('')}</div></div>
        <div class="pane span-8"><div class="pane-head"><b id="permTitle">${esc(M.roles[0].name)} — permissions</b>
          <button class="btn btn-primary btn-sm" id="savePerm">Save</button></div>
          <div class="pane-body tight" id="permBody">${permTable(active)}</div></div>
      </div>`;
  }, () => bindRoles());

  function permTable(roleId) {
    const m = M.permissionMatrix[roleId];
    return `<div class="table-wrap"><table class="table perm-table">
      <thead><tr><th>Module</th><th>View</th><th>Create</th><th>Update</th><th>Delete</th></tr></thead>
      <tbody>${M.permissionModules.map(mod => `<tr><td><b class="small">${esc(mod)}</b></td>
        ${m[mod].map(v => `<td><input type="checkbox" class="perm-check" ${v ? 'checked' : ''}></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function bindRoles() {
    const btns = $$('[data-role]'); if (!btns.length) return;
    btns.forEach(b => b.onclick = () => {
      btns.forEach(x => x.style.background = '');
      b.style.background = 'var(--primary-50)';
      const r = M.roles.find(x => x.id === b.dataset.role);
      $('#permTitle').textContent = r.name + ' — permissions';
      $('#permBody').innerHTML = permTable(r.id);
    });
    if ($('#savePerm')) $('#savePerm').onclick = () => toast('Permissions saved');
    if ($('#newRole')) $('#newRole').onclick = () => formModal('Create role', [
      { k: 'name', label: 'Role name', full: true }, { k: 'desc', label: 'Description', type: 'textarea', full: true },
      { k: 'copy', label: 'Copy permissions from', type: 'select', options: M.roles.map(r => r.name) }
    ], () => toast('Role created'));
  }

  view('integrations', () => {
    const groups = [...new Set(M.integrations.map(i => i.group))];
    return `${pageHead('Integrations', 'Conceptual integration architecture for the platform')}
      <div class="pane mb-4"><div class="pane-head"><b>Platform architecture</b>
        <span class="tiny muted">Commerce + Services core with pluggable providers</span></div>
        <div class="pane-body"><div class="arch">
          <div class="arch-col"><div class="arch-label">Inbound</div>
            ${[['🛍️', 'Customer Web'], ['📱', 'Mobile App'], ['🧰', 'Partner App (Pros)'], ['🖥️', 'Admin Console']]
              .map(([e, n]) => `<div class="arch-node"><span class="em">${e}</span><b class="small">${n}</b></div>`).join('')}</div>
          <div class="arch-core"><div style="font-size:30px">⚙️</div>
            <b class="h4" style="color:#fff">Commerce + Services Platform</b>
            <p class="tiny mt-2" style="color:rgba(255,255,255,.7)">Catalog · Cart · Orders · Bookings · Inventory · Payments · Notifications</p>
            <div class="row gap-2 mt-4 wrap" style="justify-content:center">
              ${['REST API', 'Webhooks', 'Events'].map(t => `<span class="tag" style="background:rgba(255,255,255,.15);color:#fff">${t}</span>`).join('')}</div></div>
          <div class="arch-col"><div class="arch-label">Outbound providers</div>
            ${[['💳', 'Payment Gateways', 'Razorpay · Cashfree · Stripe'], ['🚚', 'Shipping APIs', 'Delhivery · Blue Dart · Shiprocket'],
               ['🔔', 'Push', 'Firebase Cloud Messaging'], ['✉️', 'SMS / Email', 'MSG91 · SendGrid'],
               ['🧰', 'Service Provider APIs', 'Partner allocation · job status'], ['📊', 'Analytics', 'GA4 · server events']]
              .map(([e, n, d]) => `<div class="arch-node"><span class="em">${e}</span>
                <span class="col"><b class="small">${n}</b><span class="tiny muted">${d}</span></span></div>`).join('')}</div>
        </div></div></div>
      ${groups.map(g => `<div class="pane mb-4"><div class="pane-head"><b>${esc(g)}</b></div>
        <div class="pane-body tight">${table([
          { key: 'name', label: 'Integration', render: i => `<b class="small">${esc(i.name)}</b>` },
          { key: 'purpose', label: 'Purpose', render: i => `<span class="tiny muted">${esc(i.purpose)}</span>` },
          { key: 'status', label: 'Status', render: i => badge(i.status === 'Planned' ? 'Pending' : i.status) },
          { key: 'act', label: '', align: 'right', render: i => `<button class="btn btn-outline btn-sm" data-ig="${i.id}">Configure</button>` }
        ], M.integrations.filter(i => i.group === g))}</div></div>`).join('')}`;
  }, () => $$('[data-ig]').forEach(b => b.onclick = () => {
    const i = M.integrations.find(x => x.id === b.dataset.ig);
    formModal('Configure ' + i.name, [
      { k: 'key', label: 'API key', value: '••••••••••••', full: true },
      { k: 'secret', label: 'API secret', type: 'password', value: '••••••••••••', full: true },
      { k: 'env', label: 'Environment', type: 'select', options: ['Test', 'Production'] },
      { k: 'enabled', label: 'Enabled', type: 'switch', value: i.status === 'Enabled' }
    ], () => toast(i.name + ' configuration saved'));
  }));

  view('api-keys', () => listShell({
    title: 'API Keys', sub: 'Client keys for storefront, mobile app and partner systems',
    actions: `<button class="btn btn-primary btn-sm" id="newKey">${icon('plus', 14)} Generate key</button>`,
    tableHTML: table([
      { key: 'name', label: 'Key name', render: k => `<b class="small">${esc(k.name)}</b>` },
      { key: 'key', label: 'Key', render: k => `<code class="kbd">${esc(k.key)}</code>` },
      { key: 'scope', label: 'Scopes', render: k => k.scope.split(', ').map(s => `<span class="tag">${esc(s)}</span>`).join(' ') },
      { key: 'created', label: 'Created', render: k => `<span class="tiny muted">${dateFmt(k.created)}</span>` },
      { key: 'lastUsed', label: 'Last used', render: k => `<span class="tiny muted">${timeAgo(k.lastUsed)}</span>` },
      { key: 'status', label: 'Status', render: k => badge(k.status === 'Revoked' ? 'Blocked' : 'Active') },
      { key: 'act', label: '', align: 'right', render: k => `<div class="actions">
          <button class="btn btn-ghost btn-sm" data-copy-key="${esc(k.key)}">${icon('copy', 15)}</button>
          <button class="btn btn-ghost btn-sm" data-revoke="${k.id}">${icon('trash', 15)}</button></div>` }
    ], M.apiKeys),
    footer: false
  }) + `<p class="tiny muted mt-4">🔒 Demo values only. Secret keys must never be exposed to a browser client in production.</p>`,
  () => {
    $('#newKey').onclick = () => formModal('Generate API key', [
      { k: 'name', label: 'Key name', full: true }, { k: 'scope', label: 'Scopes', type: 'select',
        options: ['read:catalog', 'read:catalog, write:cart', 'read:bookings, write:job-status', 'full access'] },
      { k: 'expiry', label: 'Expires on', type: 'date' }
    ], () => toast('API key generated — copy it now, it is shown once'));
    $$('[data-copy-key]').forEach(b => b.onclick = () => { navigator.clipboard && navigator.clipboard.writeText(b.dataset.copyKey); toast('Key copied'); });
    $$('[data-revoke]').forEach(b => b.onclick = () => confirmDialog('Revoke this key?',
      'Any client using it will stop working immediately.', () => toast('Key revoked', 'info'), 'Revoke'));
  });

  /* ---------- boot the shell once both files are loaded ---------- */
  document.addEventListener('DOMContentLoaded', A.boot);
})(window);
