/* ============================================================
   BAZAAR — dev.js
   Renders the engineering spec page (dev.html) from dev-data.js:
   architecture, service catalogue, request flows, stack,
   environments, release/promotion process, conventions, roadmap.
   ============================================================ */
(function (global) {
  'use strict';
  const D = global.DEVDATA, U = global.UI;
  const { $, $$, esc, icon, badge, table } = U;

  const SECTIONS = [
    ['overview', 'Overview'], ['architecture', 'Architecture'], ['services', 'Service catalogue'],
    ['flows', 'Request flows'], ['stack', 'Tech stack'], ['golang', 'Go microservices'],
    ['frontend', 'React & React Native'], ['comms', 'Service comms'], ['data', 'Data & integrity'],
    ['conventions', 'API conventions'], ['errors', 'Error contract'], ['envs', 'Environments'],
    ['promotion', 'Version promotion'], ['versioning', 'Versioning rules'], ['team', 'Team & delivery']
  ];

  /* ---------- sections ---------- */
  function overview() {
    return `<section class="doc-sec" id="overview">
      <span class="eyebrow">Engineering specification</span>
      <h2 class="mt-2">How this prototype becomes a real system</h2>
      <p class="small" style="font-weight:700;color:var(--primary)">Target stack: React 19 (web + admin) · React Native (customer + partner apps) · Go 1.23 microservices</p>
      <p class="lead">Every screen in this prototype maps to a concrete API call, an owning service and a
        database. This page is the handover document: what the backend looks like, how a request travels,
        what each team owns, and how code moves from a laptop to production.</p>
      <div class="grid grid-4 mb-5">
        ${[['14', 'Go microservices'], ['4', 'React / React Native apps'], ['5', 'Environments'], ['1', 'Generated API client']]
          .map(([n, l]) => `<div class="card card-pad center"><b class="h2">${n}</b>
            <span class="small muted">${l}</span></div>`).join('')}</div>
      <div class="card card-pad" style="background:linear-gradient(120deg,var(--primary-50),var(--secondary-100))">
        <b class="h5">${icon('layers', 17)} Turn on Dev Mode anywhere in the prototype</b>
        <p class="small muted mt-2">Open the customer site, the app or the admin console and hit the
          <b>Dev Mode</b> pill at the bottom right. Every click then prints the API call it would make —
          method, path, owning service, hop-by-hop route through gateway, services, database and third
          parties, the payload, the events emitted and the latency budget.</p>
        <div class="row gap-2 mt-3 wrap">
          <a class="btn btn-primary btn-sm" href="index.html">Customer site</a>
          <a class="btn btn-outline btn-sm" href="services.html">Services</a>
          <a class="btn btn-outline btn-sm" href="admin.html">Admin</a>
          <a class="btn btn-outline btn-sm" href="mobile.html">Mobile app</a></div></div>
    </section>`;
  }

  function architecture() {
    const col = (title, ids, cls) => `<div class="flow-col"><h6>${title}</h6>
      ${ids.map(id => { const h = D.hosts[id];
        return `<div class="flow-node ${cls || ''}"><b>${esc(h.name)}</b>
          <span class="muted" style="font-family:ui-monospace,monospace;font-size:10px">${esc(h.host)}</span></div>`; }).join('')}</div>`;
    return `<section class="doc-sec" id="architecture">
      <h2>Architecture</h2>
      <p class="lead">Four clients, one gateway, fourteen services, database-per-service, one event bus.
        Products and services are separate domains that meet in exactly three places: the cart, the payment
        layer and the notification bus.</p>
      <div class="card card-pad">
        <div class="flow-map">
          ${col('Clients', ['web', 'app', 'admin', 'partner'])}
          ${col('Edge', ['cdn', 'gw'])}
          <div class="flow-col"><h6>Commerce domain</h6>
            ${['catalog', 'cart', 'pricing', 'order', 'inventory', 'logistics'].map(id => `
              <div class="flow-node core"><b>${esc(D.hosts[id].name)}</b></div>`).join('')}</div>
          <div class="flow-col"><h6>Services domain</h6>
            ${['booking', 'allocation'].map(id => `<div class="flow-node core"
              style="background:linear-gradient(135deg,#0a8d82,#0FB5A6)"><b>${esc(D.hosts[id].name)}</b></div>`).join('')}
            <h6 class="mt-3">Shared</h6>
            ${['identity', 'search', 'payment', 'notify', 'media', 'analytics'].map(id => `
              <div class="flow-node"><b>${esc(D.hosts[id].name)}</b></div>`).join('')}</div>
          ${col('Data & providers', ['pg', 'redis', 'es', 'kafka', 's3', 'razorpay', 'delhivery', 'fcm', 'msg91'], 'ext')}
        </div>
        <hr class="divider">
        <div class="grid grid-3">
          ${[['Why database-per-service', 'No service reads another service\'s tables. Cross-domain reads go through gRPC or an event-sourced local copy — that is what lets the services domain ship without destabilising commerce.'],
             ['Why an event bus', 'order.placed fans out to notifications, analytics, logistics and the allocation worker without the order service knowing any of them exist.'],
             ['Why one cart', 'A cart line is polymorphic: { kind: "product" | "service" }. That single decision is what makes "Buy AC + Installation" possible without a second checkout.']]
            .map(([t, d]) => `<div class="tile"><b class="small">${t}</b><p class="tiny muted mt-2">${d}</p></div>`).join('')}</div>
      </div></section>`;
  }

  function servicesSec() {
    return `<section class="doc-sec" id="services">
      <h2>Service catalogue</h2>
      <p class="lead">Each service owns its data, its deploy cadence and its on-call rotation.</p>
      <div class="pane"><div class="pane-body tight">${table([
        { key: 'id', label: 'Service', render: s => `<b class="small">${esc(D.hosts[s.id].name)}</b><br>
          <span class="tiny muted" style="font-family:ui-monospace,monospace">${esc(D.hosts[s.id].host)}</span>` },
        { key: 'owns', label: 'Owns', render: s => `<span class="small">${esc(s.owns)}</span>` },
        { key: 'stack', label: 'Stack', render: s => `<span class="tag">${esc(s.stack)}</span>` },
        { key: 'db', label: 'Datastore', render: s => `<span class="tiny" style="font-family:ui-monospace,monospace">${esc(s.db)}</span>` },
        { key: 'scaling', label: 'Pods' },
        { key: 'notes', label: 'Design note', render: s => `<span class="tiny muted">${esc(s.notes)}</span>` }
      ], D.services)}</div></div></section>`;
  }

  function flows() {
    const keys = Object.keys(D.ops);
    return `<section class="doc-sec" id="flows">
      <h2>Request flows</h2>
      <p class="lead">The thirteen operations that define the platform. Click one to see every hop, the
        payload, the events it emits and the latency budget. These are the same traces Dev Mode prints live.</p>
      ${keys.map(k => { const o = D.ops[k];
        const max = Math.max(...o.steps.map(s => s[3])) || 1;
        const total = o.steps.reduce((s, x) => s + x[3], 0);
        return `<div class="op-card" data-op="${k}">
          <div class="op-head">
            <span class="mth">${esc(o.method)}</span>
            <code>${esc(o.path)}${o.query ? esc(o.query) : ''}</code>
            <span class="grow"></span>
            <span class="tag">${esc(o.service)}</span>
            <span class="tiny muted">${o.steps.length} hops · ~${total} ms</span>
            ${icon('chevronDown', 15)}</div>
          <div class="op-body">
            <p class="small muted mb-3"><b>${esc(o.title)}</b> · auth: ${esc(o.auth)} · cache: ${esc(o.cache)} · SLO: ${esc(o.slo)}</p>
            ${o.steps.map(([hid, who, what, ms]) => { const h = D.hosts[hid] || { name: hid, host: hid, tier: 'service' };
              return `<div class="wf-row"><div class="col"><b class="tiny">${esc(who)}</b>
                  <span class="tiny muted" style="font-family:ui-monospace,monospace">${esc(h.host)}</span></div>
                <div><div class="tiny muted mb-1">${esc(what)}</div>
                  <div class="wf-bar ${h.tier}" style="width:${Math.max(3, ms / max * 100)}%"></div></div>
                <span class="tiny muted right">${ms} ms</span></div>`; }).join('')}
            <div class="grid grid-2 mt-4">
              ${Object.keys(o.request || {}).length ? `<div><b class="tiny muted">REQUEST</b>
                <div class="code-block mt-2">${esc(JSON.stringify(o.request, null, 2))}</div></div>` : '<div></div>'}
              <div><b class="tiny muted">RESPONSE</b>
                <div class="code-block mt-2">${esc(JSON.stringify(o.response, null, 2))}</div></div></div>
            ${o.events && o.events.length ? `<div class="mt-3"><b class="tiny muted">EVENTS</b><br>
              ${o.events.map(([bus, n]) => `<span class="tag mt-2">${esc(bus)} → ${esc(n)}</span>`).join(' ')}</div>` : ''}
            ${o.failure ? `<div class="mt-3"><b class="tiny muted">FAILURE PATH</b>
              <p class="small mt-1" style="color:var(--error)">${esc(o.failure)}</p></div>` : ''}
          </div></div>`; }).join('')}
    </section>`;
  }

  function stackSec() {
    return `<section class="doc-sec" id="stack">
      <h2>Tech stack</h2>
      <p class="lead">Chosen for an Indian consumer app on mixed networks, with a team that ships across
        web, mobile and backend without switching languages.</p>
      <div class="pane"><div class="pane-body tight">${table([
        { key: 'layer', label: 'Layer', render: s => `<b class="small">${esc(s.layer)}</b>` },
        { key: 'choice', label: 'Choice', render: s => `<span class="tag">${esc(s.choice)}</span>` },
        { key: 'why', label: 'Why this', render: s => `<span class="small muted">${esc(s.why)}</span>` }
      ], D.stack)}</div></div></section>`;
  }

  function golangSec() {
    const goSample = `// services/cart/internal/handler/cart.go
func (h *Handler) AddItem(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 800*time.Millisecond)
    defer cancel()

    var req AddItemRequest
    if err := httpx.DecodeJSON(r, &req); err != nil {
        httpx.Error(w, errs.Validation(err)); return          // 400 VALIDATION_FAILED
    }

    line, err := h.cart.AddItem(ctx, httpx.UserID(ctx), domain.AddItem{
        Kind:      req.Kind,                                   // product | service
        VariantID: req.VariantID,
        Qty:       req.Qty,
    })
    if err != nil {
        httpx.Error(w, err); return                            // errs maps code → status
    }
    httpx.JSON(w, http.StatusOK, toDTO(line))
}

// services/cart/internal/service/cart.go — parallel fan-out, one deadline
func (s *Service) AddItem(ctx context.Context, uid string, in domain.AddItem) (domain.Line, error) {
    var variant catalogv1.Variant
    var avail  inventoryv1.Availability

    g, gctx := errgroup.WithContext(ctx)
    g.Go(func() (err error) { variant, err = s.catalog.GetVariant(gctx, in.VariantID); return })
    g.Go(func() (err error) { avail,   err = s.inventory.Check(gctx, in.VariantID, in.Qty); return })
    if err := g.Wait(); err != nil {
        return domain.Line{}, err
    }
    if !avail.InStock {
        return domain.Line{}, errs.Conflict("STOCK_UNAVAILABLE", "variant out of stock")
    }

    line := domain.NewLine(in, money.Paise(variant.PricePaise))
    return line, s.repo.UpsertLine(ctx, uid, line)             // outbox event in same tx
}`;
    return `<section class="doc-sec" id="golang">
      <h2>Go microservices</h2>
      <p class="lead">Fourteen Go services, one module each, one image each, one database each. Every
        service has the same internal shape so a developer moving between them is productive on day one.</p>

      <div class="grid grid-4 mb-5">
        ${[['~15 MB', 'Container image (distroless)'], ['< 1 s', 'Cold start / pod'],
           ['128–256 MB', 'Typical pod memory'], ['1 module', 'Per service, own go.mod']]
          .map(([n, l]) => `<div class="card card-pad center"><b class="h3">${n}</b>
            <span class="tiny muted">${l}</span></div>`).join('')}</div>

      <b class="h4">Repository layout</b>
      <p class="small muted mt-1 mb-3">Monorepo: Go services, React apps and generated packages side by
        side, so a contract change and its client update land in one pull request.</p>
      <div class="code-block">${esc(D.repoLayout)}</div>

      <b class="h4 mt-8" style="display:block">Service anatomy — a real handler</b>
      <p class="small muted mt-1 mb-3">Thin handler, testable service layer, typed repo, one deadline
        across a parallel fan-out. This is the <code>POST /v1/cart/items</code> call the tracer prints.</p>
      <div class="code-block">${esc(goSample)}</div>

      <b class="h4 mt-8" style="display:block">Patterns every service follows</b>
      <div class="pane mt-3"><div class="pane-body tight">${table([
        { key: 0, label: 'Pattern', render: r => `<b class="small">${esc(r[0])}</b>` },
        { key: 1, label: 'What it means here', render: r => `<span class="small muted">${esc(r[1])}</span>` }
      ], D.goPatterns)}</div></div>

      <div class="card card-pad mt-4"><b class="h5">Why Go for this domain specifically</b>
        <div class="grid grid-2 mt-3">
          ${[['Fan-out is the workload', 'A product page composes catalog + inventory + pricing + booking + search. Allocation dispatches to N professionals with timeouts. Notifications fan out to four channels. errgroup + context deadlines make that ordinary code, not an architecture problem.'],
             ['Festive-traffic predictability', 'Static binaries, no JIT warm-up, no GC pause cliffs at the scale we need. A pod that handles 400 rps at 10 a.m. handles it at 10 p.m. on sale day.'],
             ['Cheap horizontal scale', '15 MB images and sub-second starts mean HPA can add pods faster than a flash-sale ramp, and the cluster bill stays sane at 14 services × 3 replicas minimum.'],
             ['Money and stock want boring code', 'Typed SQL via sqlc, integer paise, explicit transactions and compile-time-checked protobuf. Nothing about the checkout path relies on runtime reflection.']]
            .map(([t, d]) => `<div class="tile"><b class="small">${t}</b><p class="tiny muted mt-2">${d}</p></div>`).join('')}</div></div>
    </section>`;
  }

  function frontendSec() {
    const rn = `// packages/api-client — generated from the Go services' OpenAPI spec
export const cartApi = {
  addItem: (body: AddItemRequest) => post<CartLine>('/v1/cart/items', body),
};

// apps/mobile/src/features/cart/useCart.ts — same hook shape on web and native
export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cartApi.addItem,
    onMutate: async (item) => {                     // optimistic: cart badge moves instantly
      await qc.cancelQueries({ queryKey: ['cart'] });
      const prev = qc.getQueryData<Cart>(['cart']);
      qc.setQueryData<Cart>(['cart'], (c) => addLineLocally(c, item));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['cart'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}`;
    return `<section class="doc-sec" id="frontend">
      <h2>React &amp; React Native</h2>
      <p class="lead">Four clients, one language, one generated API client. Business rules live in Go —
        the clients render state and collect input, nothing more.</p>

      <div class="grid grid-4 mb-5">
        ${[['apps/web', 'React 19 + Vite, SSR for SEO on product and service pages'],
           ['apps/admin', 'React 19 + Vite SPA, TanStack Query/Table, React Hook Form'],
           ['apps/mobile', 'React Native — customer app, iOS + Android'],
           ['apps/partner', 'React Native — professional app, offline-tolerant']]
          .map(([t, d]) => `<div class="card card-pad"><b class="small" style="font-family:ui-monospace,monospace">${t}</b>
            <p class="tiny muted mt-2">${d}</p></div>`).join('')}</div>

      <b class="h4">Shared across all four</b>
      <div class="pane mt-3 mb-6"><div class="pane-body tight">${table([
        { key: 0, label: 'Package', render: r => `<code class="kbd">${esc(r[0])}</code>` },
        { key: 1, label: 'Contents', render: r => `<span class="small muted">${esc(r[1])}</span>` }
      ], [
        ['packages/types', 'TypeScript types generated from Go OpenAPI + protobuf. Regenerated in CI; drift breaks the build.'],
        ['packages/api-client', 'Typed fetch wrappers, auth refresh, retry, idempotency keys, trace header propagation.'],
        ['packages/ui-tokens', 'The design tokens in this prototype\'s global.css, exported as TS for web and React Native StyleSheet.'],
        ['packages/domain-hooks', 'useCart, useCheckout, useBooking — the state machines, shared by web and native, rendered differently.']
      ])}</div></div>

      <b class="h4">One hook, two renderers</b>
      <p class="small muted mt-1 mb-3">The cart mutation is written once and consumed by React on web and
        React Native on mobile. The optimistic update is why the cart badge in this prototype moves before
        the response lands.</p>
      <div class="code-block">${esc(rn)}</div>

      <div class="grid grid-3 mt-6">
        ${[['Why plain React + Vite, not a framework', 'The storefront needs SSR for SEO and nothing else a framework gives. A thin Node render server keeps the team on standard React, keeps the build fast, and keeps rendering decisions in our hands.'],
           ['Why React Native over two native apps', 'Two apps (customer + partner) × two platforms is four codebases in native. React Native makes it one language and one component library, with native modules only for push, payments and location.'],
           ['State management', 'TanStack Query for server state (it is 90% of the app), Zustand for the small local slices — cart drawer, filter panel, booking wizard step. No global store of server data.']]
          .map(([t, d]) => `<div class="tile"><b class="small">${t}</b><p class="tiny muted mt-2">${d}</p></div>`).join('')}</div>
    </section>`;
  }

  function commsSec() {
    return `<section class="doc-sec" id="comms">
      <h2>Service communication</h2>
      <p class="lead">Three transports, one rule each. Getting these boundaries right is what stops
        fourteen services becoming a distributed monolith.</p>
      <div class="pane"><div class="pane-body tight">${table([
        { key: 0, label: 'Boundary', render: r => `<b class="small">${esc(r[0])}</b>` },
        { key: 1, label: 'Rule', render: r => `<span class="small muted">${esc(r[1])}</span>` }
      ], D.commsRules)}</div></div>
      <div class="card card-pad mt-4">
        <b class="h5">Protobuf contract — the internal API</b>
        <div class="code-block mt-3">${esc(`// proto/bazaar/catalog/v1/catalog.proto
service CatalogService {
  rpc GetVariant(GetVariantRequest) returns (Variant);
  rpc ListVariants(ListVariantsRequest) returns (ListVariantsResponse);
}

message Variant {
  string id           = 1;
  string sku          = 2;
  int64  price_paise  = 3;   // never a float, never rupees
  int64  mrp_paise    = 4;
  string color        = 5;
  string size         = 6;
  Status status       = 7;
}`)}</div>
        <p class="tiny muted mt-3">buf lint + buf breaking run in CI. Adding a field is allowed; renaming
          or renumbering one fails the pull request before it can break another squad's service.</p></div>
    </section>`;
  }

  function dataSec() {
    return `<section class="doc-sec" id="data">
      <h2>Data &amp; integrity</h2>
      <p class="lead">The three places this platform can lose money if modelled carelessly: stock, slots and price.</p>
      <div class="grid grid-3 mb-4">
        ${[['Stock', 'Reserve at checkout start with a 15-minute TTL, not at payment. Reservations are rows, deductions are ledger entries — the stock table is append-only so every movement is auditable (see Admin → Inventory → Stock history).'],
           ['Slots', 'A slot hold is a Redis key with NX + 10-minute expiry, keyed by city, date and window. Capacity is a function of live professional supply, so the grid greys out honestly instead of overbooking.'],
           ['Price', 'Only pricing-promo-service computes money, in integer paise. The client\'s totals are display-only and re-computed server-side at order creation — a tampered cart cannot change what is charged.']]
          .map(([t, d]) => `<div class="card card-pad"><b class="h5">${t}</b><p class="small muted mt-2">${d}</p></div>`).join('')}</div>
      <div class="card card-pad">
        <b class="h5">Core entities</b>
        <div class="code-block mt-3">Product 1─* Variant(SKU)          Variant carries price, MRP, stock, barcode, weight, dims
Category *─* SizeGroup ─* Size    size masters are independent, mapped to categories
Cart 1─* CartLine                 CartLine.kind = product | service   ← the bundle lives here
Order 1─* OrderLine 1─1 Shipment
Order 1─* Booking                 a bundled service booking points back at its order
ServiceCategory 1─* Package 1─* Booking 1─1 Professional
Booking *─1 Slot(city, date, window, capacity)
User 1─* Address, WalletTxn, Wishlist, Notification</div>
        <p class="tiny muted mt-3">Migrations follow expand → migrate → contract, so any release can roll
          back to the previous image without a data rollback.</p></div>
    </section>`;
  }

  function conventionsSec() {
    return `<section class="doc-sec" id="conventions">
      <h2>API conventions</h2>
      <p class="lead">Non-negotiables every service implements identically.</p>
      <div class="pane"><div class="pane-body tight">${table([
        { key: 0, label: 'Rule', render: r => `<b class="small">${esc(r[0])}</b>` },
        { key: 1, label: 'Contract', render: r => `<span class="small muted">${esc(r[1])}</span>` }
      ], D.conventions)}</div></div></section>`;
  }

  function errorsSec() {
    return `<section class="doc-sec" id="errors">
      <h2>Error contract</h2>
      <p class="lead">Stable machine-readable codes so clients can react without parsing English.</p>
      <div class="code-block mb-4">{ "error": { "code": "SLOT_TAKEN", "message": "That slot was just booked",
    "details": [{ "field": "slot", "value": "11:00 AM" }], "requestId": "req_8f21c4" } }</div>
      <div class="pane"><div class="pane-body tight">${table([
        { key: 0, label: 'HTTP', render: r => `<span class="tag">${esc(r[0])}</span>` },
        { key: 1, label: 'Code', render: r => `<code class="kbd">${esc(r[1])}</code>` },
        { key: 2, label: 'Meaning', render: r => `<span class="small">${esc(r[2])}</span>` },
        { key: 3, label: 'Client should', render: r => `<span class="small muted">${esc(r[3])}</span>` }
      ], D.errorCodes)}</div></div></section>`;
  }

  function envsSec() {
    return `<section class="doc-sec" id="envs">
      <h2>Environments</h2>
      <p class="lead">Five environments. One artefact — the image built on merge is the exact image that
        reaches production; nothing is rebuilt on the way up.</p>
      <div class="env-flow">${D.environments.map((e, i) => `
        ${i ? `<div class="env-arrow">${icon('chevron', 18)}</div>` : ''}
        <div class="env-card ${e.name === 'Production' ? 'prod' : ''}">
          <b>${esc(e.name)}</b>
          <p class="tiny muted" style="font-family:ui-monospace,monospace">${esc(e.url)}</p>
          <hr class="divider" style="margin:10px 0">
          <p class="tiny"><b>Data:</b> ${esc(e.data)}</p>
          <p class="tiny mt-2"><b>Deploy:</b> ${esc(e.deploy)}</p>
          <p class="tiny mt-2"><b>Gate:</b> ${esc(e.gate)}</p>
          <p class="tiny mt-2 muted">${esc(e.audience)}</p></div>`).join('')}</div>
    </section>`;
  }

  function promotionSec() {
    return `<section class="doc-sec" id="promotion">
      <h2>Version promotion</h2>
      <p class="lead">From a branch on a laptop to 100% of production traffic, and back out again if the
        numbers look wrong.</p>
      <div class="card card-pad">${D.pipeline.map((p, i) => `
        <div class="pipe-step"><span class="n">${i + 1}</span>
          <div><b class="small">${esc(p.step)}</b>
            <p class="small muted mt-1">${esc(p.detail)}</p></div></div>`).join('')}</div>
      <div class="grid grid-3 mt-4">
        ${[['Deploy frequency', 'Dev: on every merge. Staging: daily. Production: 2–3 times a week, plus hotfixes.'],
           ['Rollback target', 'Under 2 minutes, one ArgoCD command, no data migration required.'],
           ['Canary signals', 'Error rate, p95 latency, checkout conversion, payment success, booking completion.']]
          .map(([t, d]) => `<div class="tile"><b class="small">${t}</b><p class="tiny muted mt-2">${d}</p></div>`).join('')}</div>
    </section>`;
  }

  function versioningSec() {
    return `<section class="doc-sec" id="versioning">
      <h2>Versioning rules</h2>
      <p class="lead">Six surfaces version independently. Clients in the wild are the constraint that
        matters — a mobile app from four months ago must still work.</p>
      <div class="pane"><div class="pane-body tight">${table([
        { key: 0, label: 'Surface', render: r => `<b class="small">${esc(r[0])}</b>` },
        { key: 1, label: 'Rule', render: r => `<span class="small muted">${esc(r[1])}</span>` }
      ], D.versioning)}</div></div></section>`;
  }

  function teamSec() {
    return `<section class="doc-sec" id="team">
      <h2>Team &amp; delivery</h2>
      <p class="lead">Squads own services end to end — build, deploy, on-call.</p>
      <div class="grid grid-4 mb-5">${D.team.map(t => `<div class="card card-pad">
        <b class="h5">${esc(t.squad)}</b><p class="small muted mt-2">${esc(t.owns)}</p>
        <span class="tag mt-3">${esc(t.size)}</span></div>`).join('')}</div>
      <b class="h4">Delivery phases</b>
      <div class="pane mt-3"><div class="pane-body tight">${table([
        { key: 0, label: 'Phase', render: r => `<b class="small">${esc(r[0])}</b>` },
        { key: 1, label: 'Duration', render: r => `<span class="tag">${esc(r[1])}</span>` },
        { key: 2, label: 'Ships', render: r => `<span class="small muted">${esc(r[2])}</span>` }
      ], D.phases)}</div></div>
      <div class="card card-pad mt-4"><b class="h5">Definition of done</b>
        <div class="grid grid-2 mt-3">
          ${['Unit + integration tests written and green', 'OpenAPI spec updated and contract test passing',
             'Feature flag defined with a default-off state', 'Dashboards and alerts added for the new path',
             'Rollback plan written in the PR description', 'Analytics events emitted and verified in staging',
             'Accessibility pass on new UI (keyboard, contrast, labels)', 'Runbook entry for the on-call rotation']
            .map(t => `<div class="row gap-2"><span style="color:var(--success)">✓</span>
              <span class="small muted">${t}</span></div>`).join('')}</div></div>
    </section>`;
  }

  /* ---------- boot ---------- */
  function boot() {
    $('#docNav').innerHTML = SECTIONS.map(([id, l], i) =>
      `<a href="#${id}" class="${i === 0 ? 'on' : ''}">${l}</a>`).join('');
    $('#docBody').innerHTML = [overview(), architecture(), servicesSec(), flows(), stackSec(), golangSec(), frontendSec(), commsSec(), dataSec(),
      conventionsSec(), errorsSec(), envsSec(), promotionSec(), versioningSec(), teamSec()].join('');

    $$('.op-head').forEach(h => h.onclick = () => h.parentNode.classList.toggle('open'));
    $$('.op-card')[0].classList.add('open');

    const links = $$('#docNav a');
    const spy = () => {
      let cur = SECTIONS[0][0];
      SECTIONS.forEach(([id]) => { const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) cur = id; });
      links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur));
    };
    window.addEventListener('scroll', spy, { passive: true });
    links.forEach(a => a.onclick = e => {
      e.preventDefault();
      document.getElementById(a.getAttribute('href').slice(1)).scrollIntoView({ behavior: 'smooth' });
    });
    U.protoBar('dev.html');
  }
  document.addEventListener('DOMContentLoaded', boot);
})(window);
