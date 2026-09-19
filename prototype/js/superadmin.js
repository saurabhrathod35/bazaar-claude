/* ============================================================
   KEENPLAZA — superadmin.js
   Prototype for the Super Admin Portal (see docs/architecture/super-admin.md):
   a separate, cross-tenant tool for the core-engine/on-call team — list all
   tenants, onboard new ones, manage feature flags, troubleshoot incidents
   by request/order id, and an immutable audit log of every action taken here.
   ============================================================ */
(function (global) {
  'use strict';
  const M = global.MOCK, U = global.UI;
  const { $, $$, esc, icon, badge, table, toast, modal, closeModal, drawer, confirmDialog, timeAgo, dateFmt, inrShort } = U;

  const NAV = [
    ['tenants', 'Tenants', 'grid'],
    ['flags', 'Feature Flags', 'settings'],
    ['troubleshoot', 'Troubleshoot', 'search'],
    ['audit', 'Audit Log', 'shield']
  ];
  const TITLES = Object.fromEntries(NAV.map(([k, l]) => [k, l]));
  const VIEWS = {};

  function current() { return (location.hash.replace(/^#\/?/, '') || 'tenants').split('/')[0]; }
  function go(k) { location.hash = '#/' + k; }
  function paint() {
    const key = current();
    $('#saTitle').textContent = TITLES[key] || 'Tenants';
    $('#saCrumb').textContent = 'KeenPlaza Super Admin / ' + (TITLES[key] || '');
    $('#content').innerHTML = (VIEWS[key] || VIEWS.tenants)();
    $$('.sb-link').forEach(a => a.classList.toggle('is-active', a.dataset.k === key));
    window.scrollTo(0, 0);
    $('.sidebar').classList.remove('open');
    (AFTER[key] || (() => {}))();
  }
  const AFTER = {};

  function pageHead(title, sub, actions) {
    return `<div class="list-toolbar" style="justify-content:space-between">
      <div><h2 class="h3">${esc(title)}</h2>${sub ? `<p class="muted small mt-1">${esc(sub)}</p>` : ''}</div>
      <div class="row gap-2">${actions || ''}</div></div>`;
  }
  function auditLine(a) {
    return { actor: a.actor, tenantId: a.tenantId, action: a.action, target: a.target, oldValue: a.oldValue, newValue: a.newValue, when: a.when, note: a.note };
  }
  function writeAudit(entry) {
    // demo only — a real portal writes this via the platform_audit_log endpoint (see ADR 0015), never client-side
    M.platformAuditLog.unshift(Object.assign({ id: 'al' + Math.random().toString(36).slice(2, 7), when: new Date().toISOString() }, entry));
  }
  function tenantName(id) { const t = M.platformTenants.find(x => x.id === id); return t ? t.name : (id || '—'); }

  /* ============================================================
     TENANTS
     ============================================================ */
  VIEWS.tenants = () => `${pageHead('Tenants', `${M.platformTenants.length} tenants on the platform`,
      `<button class="btn btn-primary btn-sm" id="onboardBtn">${icon('plus', 14)} Onboard tenant</button>`)}
    <div class="pane"><div class="pane-body tight">${table([
      { key: 'name', label: 'Tenant', render: t => `<b class="small">${esc(t.name)}</b><br><span class="tiny muted">/${esc(t.slug)}</span>` },
      { key: 'plan', label: 'Plan', render: t => `<span class="tag">${esc(t.plan)}</span>` },
      { key: 'status', label: 'Status', render: t => badge(t.status, t.status === 'active' ? 'success' : t.status === 'onboarding' ? 'info' : t.status === 'suspended' ? 'error' : 'neutral') },
      { key: 'mrr', label: 'MRR', align: 'right', render: t => t.mrr ? inrShort(t.mrr) : '—' },
      { key: 'health', label: 'Health', render: t => `<span class="health-dot health-${t.health}"></span><span class="tiny">${esc(t.errorRate)}% err · p95 ${t.p95}ms</span>` },
      { key: 'created', label: 'Created', render: t => `<span class="tiny muted">${dateFmt(t.createdAt)}</span>` },
      { key: 'act', label: '', align: 'right', render: t => `
          <button class="btn btn-ghost btn-sm" data-tsb="${t.id}" title="Troubleshoot">${icon('search', 15)}</button>
          <button class="btn btn-ghost btn-sm" data-flags="${t.id}" title="Feature flags">${icon('settings', 15)}</button>
          ${t.status === 'suspended'
            ? `<button class="btn btn-ghost btn-sm" data-reactivate="${t.id}" title="Reactivate">${icon('refresh', 15)}</button>`
            : `<button class="btn btn-ghost btn-sm" data-suspend="${t.id}" title="Suspend">${icon('close', 15)}</button>`}`
      }
    ], M.platformTenants)}</div></div>`;

  AFTER.tenants = () => {
    $('#onboardBtn').onclick = onboardWizard;
    $$('[data-flags]').forEach(b => b.onclick = () => { go('flags'); setTimeout(() => flagsView(b.dataset.flags), 0); });
    $$('[data-tsb]').forEach(b => b.onclick = () => { go('troubleshoot'); });
    $$('[data-suspend]').forEach(b => b.onclick = () => {
      const t = M.platformTenants.find(x => x.id === b.dataset.suspend);
      confirmDialog('Suspend ' + t.name + '?', 'This immediately blocks all API traffic for this tenant. Logged to the audit trail.', () => {
        const old = t.status; t.status = 'suspended';
        writeAudit({ actor: 'you@keenplaza.internal', tenantId: t.id, action: 'tenant.suspended', target: t.id, oldValue: old, newValue: 'suspended' });
        toast(t.name + ' suspended'); paint();
      }, 'Suspend');
    });
    $$('[data-reactivate]').forEach(b => b.onclick = () => {
      const t = M.platformTenants.find(x => x.id === b.dataset.reactivate);
      const old = t.status; t.status = 'active';
      writeAudit({ actor: 'you@keenplaza.internal', tenantId: t.id, action: 'tenant.reactivated', target: t.id, oldValue: old, newValue: 'active' });
      toast(t.name + ' reactivated'); paint();
    });
  };

  function onboardWizard() {
    const steps = ['Tenant details', 'Provider checklist', 'Feature baseline'];
    let active = 0;
    const data = { name: '', slug: '', plan: 'Starter', gateway: false, shipping: false, flags: false };
    const body = () => {
      if (active === 0) return `<div class="form-grid">
        <div class="field full"><label class="label">Tenant name</label><input class="input" id="obName" value="${esc(data.name)}" placeholder="e.g. QuickMart Local"></div>
        <div class="field"><label class="label">Slug</label><input class="input" id="obSlug" value="${esc(data.slug)}" placeholder="quickmart"></div>
        <div class="field"><label class="label">Plan</label><select class="select" id="obPlan"><option ${data.plan==='Starter'?'selected':''}>Starter</option><option ${data.plan==='Growth'?'selected':''}>Growth</option><option ${data.plan==='Enterprise'?'selected':''}>Enterprise</option></select></div>
      </div>`;
      if (active === 1) return `<p class="small muted mb-3">Calls the same <code>tenant</code>-owned creation path — this checklist just gates onboarding → active.</p>
        <div class="col gap-2">
          <label class="addr-card row-between"><span class="small">Payment gateway keys configured</span><input type="checkbox" id="obGw" ${data.gateway?'checked':''}></label>
          <label class="addr-card row-between"><span class="small">Shipping provider connected</span><input type="checkbox" id="obShip" ${data.shipping?'checked':''}></label>
        </div>`;
      return `<p class="small muted mb-3">Applies the platform default feature-flag baseline to this tenant.</p>
        <div class="col gap-2">${M.platformFeatureFlags.filter(f => !f.tenantId).map(f => `
          <label class="addr-card row-between"><span class="col"><b class="small">${esc(f.key)}</b><span class="tiny muted">${esc(f.desc)}</span></span>
            ${badge(f.enabled ? 'default on' : 'default off', f.enabled ? 'success' : 'neutral')}</label>`).join('')}</div>`;
    };
    modal({ title: 'Onboard tenant — ' + steps[active], size: 'modal-lg',
      body: `<div class="form-tabs" id="obTabs">${steps.map((s, i) => `<button class="${i===active?'is-active':''}" data-t="${i}" ${i>active?'disabled style="opacity:.4"':''}>${esc(s)}</button>`).join('')}</div>
        <div class="mt-5" id="obBody">${body()}</div>`,
      foot: `<button class="btn btn-outline" data-close>Cancel</button>
        <button class="btn btn-outline" id="obBack" ${active===0?'disabled style="opacity:.4"':''}>Back</button>
        <button class="btn btn-primary" id="obNext">${active === steps.length - 1 ? 'Create tenant' : 'Next'}</button>`,
      onOpen(root) {
        const sync = () => {
          if ($('#obName', root)) data.name = $('#obName', root).value;
          if ($('#obSlug', root)) data.slug = $('#obSlug', root).value;
          if ($('#obPlan', root)) data.plan = $('#obPlan', root).value;
          if ($('#obGw', root)) data.gateway = $('#obGw', root).checked;
          if ($('#obShip', root)) data.shipping = $('#obShip', root).checked;
        };
        const repaint = () => {
          $('#saTitle'); // no-op guard
          modal({ title: 'Onboard tenant — ' + steps[active], size: 'modal-lg',
            body: `<div class="form-tabs" id="obTabs">${steps.map((s, i) => `<button class="${i===active?'is-active':''}" data-t="${i}" ${i>active?'disabled style="opacity:.4"':''}>${esc(s)}</button>`).join('')}</div>
              <div class="mt-5" id="obBody">${body()}</div>`,
            foot: `<button class="btn btn-outline" data-close>Cancel</button>
              <button class="btn btn-outline" id="obBack" ${active===0?'disabled style="opacity:.4"':''}>Back</button>
              <button class="btn btn-primary" id="obNext">${active === steps.length - 1 ? 'Create tenant' : 'Next'}</button>`,
            onOpen: wire });
        };
        function wire(r) {
          $('#obBack', r).onclick = () => { sync(); if (active > 0) { active--; repaint(); } };
          $('#obNext', r).onclick = () => {
            sync();
            if (active < steps.length - 1) { active++; repaint(); return; }
            closeModal();
            const id = 't-' + (data.slug || 'tenant' + Math.random().toString(36).slice(2, 6));
            M.platformTenants.unshift({ id, name: data.name || 'New tenant', slug: data.slug || id, plan: data.plan, status: 'onboarding', mrr: 0, createdAt: new Date().toISOString(), errorRate: 0, p95: 0, health: 'pending' });
            writeAudit({ actor: 'you@keenplaza.internal', tenantId: id, action: 'tenant.onboarded', target: id, oldValue: null, newValue: 'onboarding' });
            toast('Tenant created — status: onboarding'); go('tenants'); paint();
          };
        }
        wire(root);
      } });
  }

  /* ============================================================
     FEATURE FLAGS
     ============================================================ */
  function flagsView(focusTenantId) {
    $('#content').innerHTML = renderFlags(focusTenantId);
    wireFlags();
  }
  function renderFlags(focusTenantId) {
    const rows = M.platformFeatureFlags;
    return `${pageHead('Feature Flags', 'Platform defaults (no tenant) and per-tenant overrides — every change is audited',
        `<button class="btn btn-outline btn-sm" id="newFlag">${icon('plus', 14)} New flag</button>`)}
      ${focusTenantId ? `<p class="small mb-3">Filtered to <b>${esc(tenantName(focusTenantId))}</b> · <a href="#" id="clearFlagFilter">clear filter</a></p>` : ''}
      <div class="pane"><div class="pane-body tight">${table([
        { key: 'scope', label: 'Scope', render: f => f.tenantId ? `<span class="tag">${esc(tenantName(f.tenantId))}</span>` : `<span class="tag" style="background:var(--n-900);color:#fff">platform default</span>` },
        { key: 'key', label: 'Flag', render: f => `<b class="small">${esc(f.key)}</b><br><span class="tiny muted">${esc(f.desc)}</span>` },
        { key: 'enabled', label: 'Enabled', render: f => badge(f.enabled ? 'on' : 'off', f.enabled ? 'success' : 'neutral') },
        { key: 'rollout', label: 'Rollout', align: 'right', render: f => `${f.rolloutPct}%` },
        { key: 'act', label: '', align: 'right', render: f => `<button class="btn btn-ghost btn-sm" data-edit-flag="${f.id}">${icon('edit', 15)}</button>` }
      ], focusTenantId ? rows.filter(f => f.tenantId === focusTenantId || !f.tenantId) : rows)}</div></div>`;
  }
  function editFlagModal(f) {
    modal({ title: 'Edit flag — ' + f.key, body: `<div class="form-grid">
        <div class="field full"><span class="small muted">${esc(f.desc)}</span></div>
        <div class="field"><label class="label">Enabled</label><label class="switch"><input type="checkbox" id="flEnabled" ${f.enabled?'checked':''}><span></span></label></div>
        <div class="field"><label class="label">Rollout %</label><input class="input" type="number" min="0" max="100" id="flRollout" value="${f.rolloutPct}"></div>
        <div class="field full"><span class="tiny muted">Scope: ${f.tenantId ? esc(tenantName(f.tenantId)) : 'platform default (all tenants without an override)'}</span></div>
      </div>`,
      foot: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="flSave">Save</button>`,
      onOpen(root) {
        $('#flSave', root).onclick = () => {
          const oldEnabled = f.enabled, oldPct = f.rolloutPct;
          f.enabled = $('#flEnabled', root).checked;
          f.rolloutPct = +$('#flRollout', root).value;
          closeModal();
          writeAudit({ actor: 'you@keenplaza.internal', tenantId: f.tenantId, action: 'feature_flag.updated', target: f.key,
            oldValue: `enabled=${oldEnabled} rollout=${oldPct}%`, newValue: `enabled=${f.enabled} rollout=${f.rolloutPct}%` });
          toast('Flag updated — audit log recorded'); paint();
        };
      } });
  }
  function wireFlags() {
    $('#newFlag').onclick = () => toast('New-flag creation calls the same tenant-owned feature_flags table — demo only', 'info');
    $$('[data-edit-flag]').forEach(b => b.onclick = () => editFlagModal(M.platformFeatureFlags.find(f => f.id === b.dataset.editFlag)));
    const clr = $('#clearFlagFilter'); if (clr) clr.onclick = e => { e.preventDefault(); flagsView(); };
  }
  VIEWS.flags = () => renderFlags();
  AFTER.flags = wireFlags;

  /* ============================================================
     TROUBLESHOOT
     ============================================================ */
  VIEWS.troubleshoot = () => `${pageHead('Troubleshoot', 'Paste a request_id, order_id, or trace_id — read-only, correlates across services the same way local-debugging.md does by hand')}
    <div class="pane card-pad mb-4">
      <div class="row gap-2">
        <input class="input" id="tsInput" placeholder="e.g. req_8f21a93c or BZ100241" style="max-width:360px">
        <button class="btn btn-primary btn-sm" id="tsGo">${icon('search', 14)} Look up</button>
      </div>
      <p class="tiny muted mt-2">Try <code>req_8f21a93c</code> (a stuck checkout saga) or <code>BZ100241</code> (a courier webhook that never arrived).</p>
    </div>
    <div id="tsResult"></div>`;
  AFTER.troubleshoot = () => {
    const run = () => {
      const v = $('#tsInput').value.trim();
      const hit = M.troubleshootLookups[v];
      if (!hit) { $('#tsResult').innerHTML = v ? `<div class="pane card-pad"><p class="small muted">No trace found for "${esc(v)}" — in production this calls each owning service's lookup endpoint, never another service's database directly.</p></div>` : ''; return; }
      $('#tsResult').innerHTML = `<div class="pane card-pad">
        <div class="row-between mb-3"><b class="h5">${esc(hit.summary)}</b>
          <span class="tag">${esc(tenantName(hit.tenantId))}</span></div>
        <p class="tiny muted mb-3">trace_id <code>${esc(hit.traceId)}</code> · correlation_id <code>${esc(hit.correlationId)}</code>
          · <a href="#" id="tsJaeger">open in Jaeger →</a></p>
        <div class="mb-3">${hit.timeline.map(([svc, what, when]) => `<div class="tl-row">
          <b class="tiny">${esc(svc)}</b><span class="tiny muted">${esc(what)}</span><span class="tiny muted right">${esc(when)}</span></div>`).join('')}</div>
        <div class="tile" style="background:var(--primary-50)"><b class="small">Suggested next step</b>
          <p class="tiny muted mt-1">${esc(hit.suggestion)}</p></div>
      </div>`;
      const j = $('#tsJaeger'); if (j) j.onclick = e => { e.preventDefault(); toast('Deep link to Jaeger — demo only', 'info'); };
    };
    $('#tsGo').onclick = run;
    $('#tsInput').onkeydown = e => { if (e.key === 'Enter') run(); };
  };

  /* ============================================================
     AUDIT LOG
     ============================================================ */
  VIEWS.audit = () => `${pageHead('Audit Log', 'Every action taken through this portal — immutable, queryable by tenant, engineer or time range')}
    <div class="pane"><div class="pane-body tight">${table([
      { key: 'when', label: 'When', render: a => `<span class="tiny muted">${timeAgo(a.when)}</span>` },
      { key: 'actor', label: 'Engineer', render: a => `<span class="small">${esc(a.actor)}</span>` },
      { key: 'tenant', label: 'Tenant', render: a => a.tenantId ? `<span class="tag">${esc(tenantName(a.tenantId))}</span>` : '<span class="tiny muted">platform</span>' },
      { key: 'action', label: 'Action', render: a => `<b class="small">${esc(a.action)}</b>` },
      { key: 'change', label: 'Change', render: a => a.oldValue || a.newValue ? `<span class="tiny">${esc(a.oldValue || '—')} → ${esc(a.newValue || '—')}</span>` : (a.note ? `<span class="tiny muted">${esc(a.note)}</span>` : '—') }
    ], M.platformAuditLog)}</div></div>`;

  /* ---------- shell boot ---------- */
  function sidebarHTML() {
    return `<div class="sb-head"><span class="mark">S</span>
        <span><b>KeenPlaza</b><small>Super Admin Portal</small></span></div>
      <div class="sb-scroll">${NAV.map(([k, l, ic]) => `<button class="sb-link" data-k="${k}">${icon(ic, 17)} ${l}</button>`).join('')}</div>
      <div class="sb-foot"><div class="sb-user"><span class="avatar avatar-sm" style="background:#f6c945;color:#1a1030">PS</span>
        <span class="col grow"><b>Priya S.</b><small>Platform on-call</small></span>
        <button class="icon-btn" style="width:28px;height:28px;color:rgba(255,255,255,.6)" id="sbOut">${icon('logout', 15)}</button></div>
        <a class="btn btn-outline btn-sm btn-block mt-3" href="admin.html" style="background:transparent;color:rgba(255,255,255,.75);border-color:rgba(255,255,255,.2)">
          Tenant admin console →</a></div>`;
  }
  function boot() {
    $('.sidebar').innerHTML = sidebarHTML();
    $$('.sb-link').forEach(b => b.onclick = () => go(b.dataset.k));
    $('#sbOut').onclick = () => confirmDialog('End platform-admin session?', 'You will need to re-authenticate with MFA next time.',
      () => location.reload(), 'Log out');
    $('#burger').onclick = () => $('.sidebar').classList.toggle('open');
    window.addEventListener('hashchange', paint);
    paint();
    U.protoBar('superadmin.html');
  }
  document.addEventListener('DOMContentLoaded', boot);
})(window);
