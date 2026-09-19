/* ============================================================
   KEENPLAZA — dev-data.js
   The engineering spec behind the prototype: services, endpoints,
   request flows, tech stack, environments and release process.
   Consumed by dev-mode.js (live tracer) and dev.js (spec page).
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 1. RUNTIME TOPOLOGY ---------- */
  const hosts = {
    web:     { id: 'web',     name: 'Storefront (React 19 + Vite SSR)',  host: 'www.keenplaza.in',            tier: 'edge' },
    app:     { id: 'app',     name: 'Mobile App (React Native)', host: 'app build',                 tier: 'client' },
    admin:   { id: 'admin',   name: 'Admin Console (React 19 + Vite)', host: 'admin.keenplaza.in',           tier: 'edge' },
    cdn:     { id: 'cdn',     name: 'CDN + WAF (CloudFront)',    host: 'cdn.keenplaza.in',             tier: 'edge' },
    gw:      { id: 'gw',      name: 'API Gateway (Kong)',        host: 'api.keenplaza.in',             tier: 'gateway' },
    identity:{ id: 'identity',name: 'identity-service',          host: 'identity.svc.cluster.local:8080', tier: 'service' },
    catalog: { id: 'catalog', name: 'catalog-service',           host: 'catalog.svc.cluster.local:8080',  tier: 'service' },
    search:  { id: 'search',  name: 'search-service',            host: 'search.svc.cluster.local:8080',   tier: 'service' },
    cart:    { id: 'cart',    name: 'cart-service',              host: 'cart.svc.cluster.local:8080',     tier: 'service' },
    order:   { id: 'order',   name: 'order-service',             host: 'order.svc.cluster.local:8080',    tier: 'service' },
    inventory:{id: 'inventory',name:'inventory-service',         host: 'inventory.svc.cluster.local:8080',tier: 'service' },
    pricing: { id: 'pricing', name: 'pricing-promo-service',     host: 'pricing.svc.cluster.local:8080',  tier: 'service' },
    payment: { id: 'payment', name: 'payment-service',           host: 'payment.svc.cluster.local:8080',  tier: 'service' },
    booking: { id: 'booking', name: 'booking-service',           host: 'booking.svc.cluster.local:8080',  tier: 'service' },
    allocation:{id:'allocation',name:'allocation-service',       host: 'alloc.svc.cluster.local:8080',    tier: 'service' },
    logistics:{id: 'logistics',name:'logistics-service',         host: 'logistics.svc.cluster.local:8080',tier: 'service' },
    notify:  { id: 'notify',  name: 'notification-service',      host: 'notify.svc.cluster.local:8080',   tier: 'service' },
    media:   { id: 'media',   name: 'media-service',             host: 'media.svc.cluster.local:8080',    tier: 'service' },
    analytics:{id:'analytics',name: 'analytics-collector',       host: 'events.keenplaza.in',                tier: 'service' },
    pg:      { id: 'pg',      name: 'PostgreSQL 16 (primary)',   host: 'pg-primary:5432',           tier: 'data' },
    pgro:    { id: 'pgro',    name: 'PostgreSQL (read replica)', host: 'pg-replica:5432',           tier: 'data' },
    es:      { id: 'es',      name: 'OpenSearch',                host: 'search-cluster:9200',       tier: 'data' },
    kafka:   { id: 'kafka',   name: 'Event queue (Postgres, phase 1)', host: 'pg-primary:5432 (queue table)', tier: 'data' },
    s3:      { id: 's3',      name: 'S3 object store',           host: 's3.ap-south-1',             tier: 'data' },
    razorpay:{ id: 'razorpay',name: 'Razorpay',                  host: 'api.razorpay.com',          tier: 'external' },
    delhivery:{id:'delhivery',name: 'Delhivery',                 host: 'track.delhivery.com',       tier: 'external' },
    sendgrid:{ id: 'sendgrid',name: 'SendGrid',                  host: 'api.sendgrid.com',          tier: 'external' },
    partner: { id: 'partner', name: 'Partner App (professionals)',host:'partner.keenplaza.in',         tier: 'client' }
  };

  /* ---------- 2. SERVICE CATALOGUE ---------- */
  const services = [
    { id:'identity', owns:'Users, sessions, OTP, addresses, roles, permissions', stack:'Go 1.23 · chi · pgx',
      db:'identity_db', scaling:'3–6 pods', notes:'JWT access (15 min) + refresh (30 d). OTP rate-limited per number and per IP; OTP rows expire via a Postgres sweep job.' },
    { id:'catalog', owns:'Products, variants, categories, brands, sizes, attributes, media refs', stack:'Go 1.23 · chi · sqlc · pgx',
      db:'catalog_db', scaling:'4–10 pods', notes:'Write-light, read-heavy. Reads served from the Postgres replica; publishes catalog.* events to reindex search.' },
    { id:'search', owns:'Universal search across products AND services, autocomplete, facets', stack:'Go 1.23 · opensearch-go',
      db:'opensearch', scaling:'3–8 pods', notes:'One federated index with a `kind` field (product | service | category | brand) so one query returns both.' },
    { id:'cart', owns:'Cart lines (products + services), coupons, price recalculation', stack:'Go 1.23 · chi · pgx',
      db:'cart_db', scaling:'4–8 pods', notes:'Cart is a polymorphic line list, one Postgres row per cart with an `expires_at` TTL — no separate hot store.' },
    { id:'pricing', owns:'Offers, coupons, cart-level rules, tax, bundle discounts', stack:'Go 1.23 · pure-Go rules engine',
      db:'promo_db', scaling:'3–6 pods', notes:'Pure calculation service — the single source of truth for money. Never duplicate this maths in clients.' },
    { id:'inventory', owns:'Stock by SKU × warehouse, reservations, transfers, reorder alerts', stack:'Go 1.23 · sqlc · pgx (serializable tx)',
      db:'inventory_db', scaling:'3–6 pods', notes:'Reservations use SELECT … FOR UPDATE with a TTL. Released by a sweeper job on checkout timeout.' },
    { id:'order', owns:'Orders, order lines, status machine, returns, refunds', stack:'Go 1.23 · temporal-style saga · Postgres queue (SKIP LOCKED)',
      db:'order_db', scaling:'4–10 pods', notes:'Orchestrates checkout as a saga: reserve stock → charge → confirm → emit events. Compensates on failure.' },
    { id:'payment', owns:'Payment intents, captures, refunds, settlement reconciliation', stack:'Go 1.23 · provider interface per gateway',
      db:'payment_db', scaling:'3–6 pods', notes:'Gateway-agnostic provider interface. Webhooks are the source of truth, never the client callback.' },
    { id:'booking', owns:'Service catalogue, packages, slots, bookings, booking status machine', stack:'Go 1.23 · pgx',
      db:'booking_db', scaling:'3–6 pods', notes:'Slot capacity per city × category × time window. A Postgres row (`expires_at`) holds a slot for 10 minutes during checkout, atomic UPDATE guards capacity.' },
    { id:'allocation', owns:'Professional matching, job dispatch, live status from the partner app', stack:'Go 1.23 · goroutine dispatch pool · postgis',
      db:'alloc_db', scaling:'3–6 pods', notes:'Runs T-2h before the slot: scores pros by skill, rating, distance and load, then dispatches with accept/decline.' },
    { id:'logistics', owns:'Shipments, AWB, courier selection, tracking webhooks', stack:'Go 1.23 · resty + circuit breaker',
      db:'logistics_db', scaling:'3–6 pods', notes:'Priority-ordered courier fallback with serviceability check by pincode.' },
    { id:'notify', owns:'Templates, trigger matrix, push/SMS/email/WhatsApp fan-out', stack:'Go 1.23 · Postgres queue poller (LISTEN/NOTIFY wake-up)',
      db:'notify_db', scaling:'4–8 pods', notes:'Consumes domain events; every channel is a pluggable provider. Idempotent per (event_id, channel).' },
    { id:'media', owns:'Image upload, resizing, CDN invalidation', stack:'Go 1.23 · bimg/vips · S3',
      db:'s3', scaling:'2–4 pods', notes:'Presigned direct-to-S3 uploads; derivatives generated on first request and cached.' },
    { id:'analytics', owns:'Event collection, funnels, dashboards feed', stack:'Go 1.23 collector · ClickHouse',
      db:'clickhouse', scaling:'3–6 pods', notes:'Server-side events so ad-blockers do not distort the funnel.' }
  ];

  /* ---------- 3. TRACED OPERATIONS ----------
     Each step: [hostId, label, detail, ms]                       */
  const ops = {
    'catalog.list': {
      title: 'Browse product listing', method: 'GET', path: '/v1/catalog/products',
      query: '?category=c-electronics&sort=recommended&page=1&limit=24',
      service: 'catalog', auth: 'Optional (guest allowed)', cache: 'CDN 60s', slo: 'p95 < 180 ms',
      steps: [
        ['web', 'Client request', 'GET /v1/catalog/products?category=…', 0],
        ['cdn', 'CDN lookup', 'HIT for anonymous traffic, MISS when personalised', 8],
        ['gw', 'API Gateway', 'Rate limit 600 rpm/IP · route by path prefix', 4],
        ['catalog', 'catalog-service', 'Resolve category subtree, apply filters and sort', 22],
        ['pgro', 'Postgres replica', 'SELECT … FROM products JOIN variants (on CDN miss)', 31],
        ['catalog', 'Response', '200 OK · 24 products, facets, total count', 2]
      ],
      request: { headers: { 'x-keenplaza-city': 'Mumbai', 'x-request-id': 'req_8f21…' } },
      response: { total: 128, page: 1, items: [{ id: 'p6', name: 'LG 1.5 Ton 5 Star Split Inverter AC', brand: 'LG', price: 42999, mrp: 56990, rating: 4.6, inStock: true }] },
      events: []
    },
    'search.universal': {
      title: 'Universal search (products + services)', method: 'GET', path: '/v1/search',
      query: '?q=AC&city=Mumbai&kinds=product,service,category,brand',
      service: 'search', auth: 'Optional', cache: 'CDN 60s per (q, city)', slo: 'p95 < 120 ms',
      steps: [
        ['web', 'Client request', 'Debounced 250 ms after typing stops', 0],
        ['gw', 'API Gateway', 'Rate limit 120 rpm/session', 3],
        ['search', 'search-service', 'Build multi-index query with kind boosting', 9],
        ['es', 'OpenSearch', 'msearch across products_v7 and services_v3 indices', 26],
        ['search', 'Merge & rank', 'Interleave: services float up on intent words (repair, service, install)', 5]
      ],
      request: {}, response: { products: 3, services: 5, categories: 1, brands: 2,
        top: { kind: 'service', id: 'pk-ac-install', name: 'AC Installation', price: 1499 } },
      events: [['analytics', 'search.performed']]
    },
    'cart.addProduct': {
      title: 'Add product to cart', method: 'POST', path: '/v1/cart/items',
      service: 'cart', auth: 'Bearer JWT or guest cart cookie', cache: 'None (write)', slo: 'p95 < 220 ms',
      steps: [
        ['web', 'Client request', 'POST body: { kind, variantId, qty }', 0],
        ['gw', 'API Gateway', 'Verify JWT signature · attach x-user-id', 5],
        ['cart', 'cart-service', 'Upsert line into cart aggregate', 12],
        ['catalog', 'catalog-service (gRPC)', 'GetVariant(variantId) → price, MRP, status', 18],
        ['inventory', 'inventory-service (gRPC)', 'CheckAvailability(sku, qty) — soft check only', 15],
        ['pricing', 'pricing-promo-service', 'Recalculate totals, auto-apply eligible offers', 21],
        ['pg', 'Postgres', 'UPSERT cart row, expires_at = now() + 30d', 6],
        ['kafka', 'Event queue', 'emit cart.item_added', 4]
      ],
      request: { kind: 'product', variantId: 'p6-white-15ton', qty: 1 },
      response: { cartId: 'crt_91f2', lineCount: 1, subtotal: 42999, savings: 13991, suggestedServices: ['pk-ac-install'] },
      events: [['kafka', 'cart.item_added'], ['analytics', 'add_to_cart']]
    },
    'cart.addService': {
      title: 'Add service to cart (cross-sell)', method: 'POST', path: '/v1/cart/items',
      service: 'cart → booking', auth: 'Bearer JWT', cache: 'None (write)', slo: 'p95 < 260 ms',
      steps: [
        ['web', 'Client request', 'POST body: { kind: "service", packageId }', 0],
        ['gw', 'API Gateway', 'Auth + routing', 5],
        ['cart', 'cart-service', 'Append a service line to the same cart aggregate', 11],
        ['booking', 'booking-service (gRPC)', 'GetPackage(packageId) → price, duration, city availability', 19],
        ['booking', 'Serviceability check', 'Is this package live in the customer\'s pincode?', 12],
        ['pricing', 'pricing-promo-service', 'Apply bundle rule: AC + installation = ₹1,000 off', 18],
        ['kafka', 'Event queue', 'emit cart.service_added (feeds attach-rate analytics)', 4]
      ],
      request: { kind: 'service', packageId: 'pk-ac-install', linkedVariantId: 'p6-white-15ton' },
      response: { lineCount: 2, subtotal: 44498, bundleDiscount: 1000, requiresSlot: true },
      events: [['kafka', 'cart.service_added'], ['analytics', 'service_attach']]
    },
    'pricing.coupon': {
      title: 'Apply coupon', method: 'POST', path: '/v1/cart/{cartId}/coupon',
      service: 'pricing', auth: 'Bearer JWT', cache: 'None', slo: 'p95 < 150 ms',
      steps: [
        ['web', 'Client request', 'POST { code: "SAVE500" }', 0],
        ['gw', 'API Gateway', 'Auth + 20 rpm/user throttle (brute-force guard)', 4],
        ['pricing', 'pricing-promo-service', 'Load rule, validate window, min cart, scope and per-user cap', 16],
        ['pg', 'Postgres', 'SELECT … FROM coupons WHERE code = $1 FOR UPDATE — atomic global usage increment', 9],
        ['pricing', 'Recalculate', 'Discount, delivery waiver, GST on the discounted base', 8]
      ],
      request: { code: 'SAVE500' },
      response: { applied: true, discount: 500, total: 46198, message: 'SAVE500 applied' },
      events: [['analytics', 'coupon_applied']]
    },
    'order.place': {
      title: 'Place order (products + services)', method: 'POST', path: '/v1/orders',
      service: 'order (saga orchestrator)', auth: 'Bearer JWT + idempotency key', cache: 'None', slo: 'p95 < 900 ms',
      steps: [
        ['web', 'Client request', 'POST with Idempotency-Key header', 0],
        ['gw', 'API Gateway', 'Auth · idempotency replay check', 6],
        ['order', 'order-service', 'Open saga · create order in PENDING', 14],
        ['pricing', 'pricing-promo-service', 'Server-side re-price — client totals are never trusted', 22],
        ['inventory', 'inventory-service', 'ReserveStock(lines, ttl=15m) → reservationId', 34],
        ['booking', 'booking-service', 'LockSlot(packageId, date, slot, ttl=10m) → slotHold', 28],
        ['payment', 'payment-service', 'CreateIntent(amount, method) → gateway order id', 41],
        ['razorpay', 'Razorpay', 'POST /v1/orders → checkout handoff to the client', 180],
        ['payment', 'Webhook: payment.captured', 'Signature-verified callback confirms the charge', 60],
        ['order', 'Commit saga', 'Order → CONFIRMED · convert reservation to deduction · confirm slot', 25],
        ['kafka', 'Event queue', 'emit order.placed, booking.confirmed, inventory.deducted', 6],
        ['logistics', 'logistics-service', 'Pick courier by priority + pincode serviceability → AWB', 55],
        ['notify', 'notification-service', 'Fan-out confirmation: push + SMS + email', 30]
      ],
      request: { cartId: 'crt_91f2', addressId: 'ad1', payment: 'upi', slot: { date: '2026-08-11', time: '11:00 AM' } },
      response: { orderId: 'BZ100242', status: 'CONFIRMED', bookingIds: ['SB50020'], awb: 'DL2914772819', total: 46198 },
      events: [['kafka', 'order.placed'], ['kafka', 'booking.confirmed'], ['kafka', 'inventory.deducted'], ['analytics', 'purchase']],
      failure: 'If payment fails or times out: release reservation, release slot hold, order → FAILED, cart restored intact.'
    },
    'booking.create': {
      title: 'Book a service (standalone)', method: 'POST', path: '/v1/bookings',
      service: 'booking', auth: 'Bearer JWT + idempotency key', cache: 'None', slo: 'p95 < 700 ms',
      steps: [
        ['app', 'Client request', 'POST { packageId, addressId, date, slot, notes }', 0],
        ['gw', 'API Gateway', 'Auth + idempotency', 5],
        ['booking', 'booking-service', 'Validate package × city × slot capacity', 18],
        ['pg', 'Postgres', 'UPDATE slots SET capacity_held += 1 WHERE capacity_held < capacity, expires_at = now() + 600s — atomic slot hold', 6],
        ['payment', 'payment-service', 'Create intent (or mark pay-after-service)', 38],
        ['razorpay', 'Razorpay', 'Payment capture', 170],
        ['booking', 'Confirm', 'Booking → BOOKING_CONFIRMED · decrement slot capacity', 16],
        ['kafka', 'Event queue', 'emit booking.confirmed', 4],
        ['notify', 'notification-service', 'Confirmation on push + SMS + WhatsApp', 28]
      ],
      request: { packageId: 'pk-ac-basic', addressId: 'ad1', date: '2026-08-11', slot: '11:00 AM' },
      response: { bookingId: 'SB50020', status: 'BOOKING_CONFIRMED', amount: 499, proAssignmentAt: '2026-08-11T09:00:00+05:30' },
      events: [['kafka', 'booking.confirmed']]
    },
    'allocation.assign': {
      title: 'Assign a professional (async job)', method: 'JOB', path: 'allocation.assign_worker',
      service: 'allocation', auth: 'Internal (mTLS)', cache: 'None', slo: 'runs T-2h, p95 < 3 s',
      steps: [
        ['kafka', 'Trigger', 'booking.confirmed consumed · schedule job at slot − 2h', 0],
        ['allocation', 'allocation-service', 'Load eligible pros: skill match, city, availability window', 26],
        ['pg', 'Postgres + postgis', 'SELECT … WHERE ST_DWithin(location, pro_location, 8000) — nearest first', 10],
        ['allocation', 'Score & rank', 'rating 40% · distance 25% · load 20% · acceptance history 15%', 12],
        ['partner', 'Partner app dispatch', 'Push offer to top pro · 90-second accept window', 90],
        ['allocation', 'Confirm or fall through', 'On decline/timeout, offer to the next ranked pro', 20],
        ['kafka', 'Event queue', 'emit booking.professional_assigned', 4],
        ['notify', 'notification-service', 'Customer gets pro name, photo, rating and live-track link', 26]
      ],
      request: { bookingId: 'SB50020' },
      response: { professionalId: 'pro1', name: 'Ramesh Kadam', eta: '11:00 AM', acceptedIn: '38s' },
      events: [['kafka', 'booking.professional_assigned']]
    },
    'inventory.adjust': {
      title: 'Adjust stock (admin)', method: 'POST', path: '/v1/inventory/adjustments',
      service: 'inventory', auth: 'Bearer JWT · scope inventory:update', cache: 'None', slo: 'p95 < 250 ms',
      steps: [
        ['admin', 'Admin console', 'POST { sku, warehouse, type, qty, reason }', 0],
        ['gw', 'API Gateway', 'Auth · RBAC check against role permission matrix', 7],
        ['inventory', 'inventory-service', 'Append to the stock ledger (append-only, never UPDATE)', 15],
        ['pg', 'Postgres', 'INSERT INTO stock_ledger · UPDATE stock_summary in one transaction', 18],
        ['kafka', 'Event queue', 'emit inventory.adjusted', 4],
        ['search', 'search-service', 'Reindex availability flag for affected SKUs', 22],
        ['notify', 'notification-service', 'If crossing back above 0 → fire "Back in Stock" to waitlist', 25]
      ],
      request: { sku: 'LG-AC15-WHI-1.5Ton', warehouse: 'WH-Mumbai', type: 'GRN', qty: 24, reason: 'GRN #4471' },
      response: { available: 38, reserved: 2, status: 'In stock', ledgerId: 'led_44182' },
      events: [['kafka', 'inventory.adjusted'], ['kafka', 'product.back_in_stock']]
    },
    'catalog.upsert': {
      title: 'Create / update product (admin)', method: 'POST', path: '/v1/catalog/products',
      service: 'catalog', auth: 'Bearer JWT · scope catalog:write', cache: 'Invalidates CDN', slo: 'p95 < 400 ms',
      steps: [
        ['admin', 'Admin console', 'POST product with nested variant matrix', 0],
        ['gw', 'API Gateway', 'Auth · RBAC (Catalog Manager or above)', 6],
        ['catalog', 'catalog-service', 'Validate schema · generate SKUs for colour × size', 26],
        ['pg', 'Postgres', 'Transaction: upsert product + variants + attribute links', 34],
        ['media', 'media-service', 'Attach uploaded S3 keys · queue derivative generation', 18],
        ['kafka', 'Event queue', 'emit catalog.product_updated', 4],
        ['search', 'search-service', 'Consume event → reindex document in products_v7', 30],
        ['cdn', 'CDN', 'Purge /p/{slug} and the parent category listings', 40]
      ],
      request: { name: 'LG 1.5 Ton 5 Star Split Inverter AC', categoryId: 'c-ac', variants: '3 colours × 3 capacities = 9 SKUs' },
      response: { productId: 'p6', variantsCreated: 9, status: 'Active', searchIndexed: true },
      events: [['kafka', 'catalog.product_updated']]
    },
    'order.status': {
      title: 'Update order status (admin / courier webhook)', method: 'PATCH', path: '/v1/orders/{id}/status',
      service: 'order', auth: 'Bearer JWT or signed courier webhook', cache: 'None', slo: 'p95 < 200 ms',
      steps: [
        ['delhivery', 'Courier webhook', 'POST scan event, HMAC signature verified', 0],
        ['gw', 'API Gateway', 'Verify signature · reject replay (nonce window 5 min)', 6],
        ['logistics', 'logistics-service', 'Map courier code → canonical status', 12],
        ['order', 'order-service', 'Validate state transition against the status machine', 14],
        ['pg', 'Postgres', 'UPDATE orders SET status · INSERT order_status_history', 16],
        ['kafka', 'Event queue', 'emit order.status_changed', 4],
        ['notify', 'notification-service', 'Trigger matrix picks channels for this status', 26]
      ],
      request: { status: 'OUT_FOR_DELIVERY', awb: 'DL2914772819', scanAt: '2026-08-10T08:12:00+05:30' },
      response: { orderId: 'BZ100241', status: 'OUT_FOR_DELIVERY', notified: ['push', 'sms', 'whatsapp'] },
      events: [['kafka', 'order.status_changed']]
    },
    'notify.campaign': {
      title: 'Send campaign (admin)', method: 'POST', path: '/v1/campaigns',
      service: 'notify', auth: 'Bearer JWT · scope marketing:write', cache: 'None', slo: 'enqueue < 300 ms',
      steps: [
        ['admin', 'Admin console', 'POST { title, message, segmentId, channels }', 0],
        ['gw', 'API Gateway', 'Auth · RBAC (Marketing Manager)', 6],
        ['notify', 'notification-service', 'Resolve segment → audience snapshot', 40],
        ['pgro', 'Postgres replica', 'Materialise segment query (batched, 10k rows per page)', 120],
        ['kafka', 'Event queue', 'Produce one message per recipient per channel', 30],
        ['sendgrid', 'SendGrid', 'Bulk email with per-user unsubscribe', 160]
      ],
      request: { title: 'Weekend Sale 🎉', segmentId: 'sg2', channels: ['push', 'email'] },
      response: { campaignId: 'cm6', queued: 48200, estimatedDelivery: '4 min' },
      events: [['kafka', 'campaign.queued']]
    },
    'identity.otp': {
      title: 'Login with OTP', method: 'POST', path: '/v1/auth/otp/verify',
      service: 'identity', auth: 'Public (rate limited)', cache: 'None', slo: 'p95 < 250 ms',
      steps: [
        ['app', 'Client request', 'POST { phone, otp, deviceId }', 0],
        ['gw', 'API Gateway', '5 attempts / 10 min / number · 30 / hour / IP', 5],
        ['identity', 'identity-service', 'Compare against hashed OTP, constant-time', 12],
        ['pg', 'Postgres', 'SELECT … FROM otp_challenges WHERE phone = $1 AND expires_at > now() · DELETE on success (single use)', 6],
        ['pg', 'Postgres', 'Upsert user · create session row', 20],
        ['identity', 'Issue tokens', 'Access JWT 15 min · refresh token 30 d, rotating', 8],
        ['kafka', 'Event queue', 'emit user.logged_in', 4]
      ],
      request: { phone: '+919820041122', otp: '••••••', deviceId: 'dev_a91f' },
      response: { accessToken: 'eyJhbGciOi…', refreshToken: 'rt_…', expiresIn: 900, user: { id: 'u1', name: 'Aarav Sharma' } },
      events: [['kafka', 'user.logged_in']]
    }
  };

  /* ---------- 4. STACK ---------- */
  const stack = [
    { layer: 'Web storefront', choice: 'React 19 + Vite + TypeScript (SSR via a thin Node render server)', why: 'Plain React, no framework lock-in. Vite SSR gives product and service pages crawlable HTML for SEO; the same components hydrate on the client.' },
    { layer: 'Mobile app', choice: 'React Native 0.76 + TypeScript', why: 'One codebase for iOS and Android, sharing the API client, types and validation with web. Native modules only for push, payments SDK and location.' },
    { layer: 'Admin console', choice: 'React 19 + Vite SPA + TanStack Query/Table + React Hook Form', why: 'No SEO need; heavy tables and multi-tab forms want a fat client. Same design tokens as the storefront.' },
    { layer: 'Partner app (pros)', choice: 'React Native', why: 'Job accept/decline, live status, earnings. Offline-tolerant write queue for weak-network homes.' },
    { layer: 'Shared frontend code', choice: 'pnpm workspace: `packages/api-client`, `packages/types`, `packages/ui-tokens`', why: 'Types generated from the Go services\' OpenAPI/protobuf, so a backend field rename breaks the web and app build immediately.' },
    { layer: 'API layer', choice: 'REST + JSON over Kong gateway; gRPC (protobuf) service-to-service', why: 'REST is the pragmatic public contract for React and React Native; gRPC internally for latency and compile-time-typed contracts between Go services.' },
    { layer: 'Microservices', choice: 'Go 1.23 — chi router, pgx/sqlc, grpc-go', why: 'Small static binaries (~15 MB images, sub-second cold start), goroutines for the fan-out this domain is full of (allocation dispatch, notification fan-out, courier calls), and predictable memory under Indian festive traffic spikes.' },
    { layer: 'Go service toolkit', choice: 'sqlc (typed SQL), golang-migrate, wire (DI), testcontainers-go, testify, golangci-lint', why: 'No ORM magic over money and stock — hand-written SQL, compile-time-checked. Integration tests run against a real Postgres in a container.' },
    { layer: 'Primary database', choice: 'PostgreSQL 16 + postgis, database-per-service', why: 'Transactional integrity for money, stock and slots. TTL-bound rows (cart, OTP, reservations, slot holds) instead of a second cache store — no shared tables between services.' },
    { layer: 'Search', choice: 'OpenSearch', why: 'Federated product + service index with facets and typo tolerance.' },
    { layer: 'Event bus', choice: 'Postgres queue table (phase 1) — SKIP LOCKED + LISTEN/NOTIFY; RabbitMQ (Amazon MQ) phase 2+', why: 'One less broker to run for phase-1 traffic — outbox rows already live in Postgres (see ADR 0003); swap to RabbitMQ only if fan-out volume outgrows a single-table queue.' },
    { layer: 'Analytics store', choice: 'ClickHouse', why: 'Fast funnel and cohort queries without touching transactional Postgres.' },
    { layer: 'Object storage', choice: 'S3 + CloudFront', why: 'Direct-to-S3 presigned uploads; edge-cached derivatives.' },
    { layer: 'Infrastructure', choice: 'AWS ap-south-1 (Mumbai), EKS, Terraform, Helm, ArgoCD', why: 'Data residency in India, GitOps deploys, reproducible environments.' },
    { layer: 'Observability', choice: 'OpenTelemetry → Grafana Tempo/Loki/Prometheus, Sentry', why: 'One trace id from the browser click to the SQL query — the tracer in this prototype mirrors it.' },
    { layer: 'CI/CD', choice: 'GitHub Actions + ArgoCD', why: 'PR checks, image build, signed artefacts, environment promotion by manifest.' }
  ];

  /* ---------- 4b. GO MICROSERVICE ANATOMY ---------- */
  const repoLayout = `keen/plaza/
├── services/                        one Go module per service, own go.mod, own image
│   ├── catalog/
│   │   ├── cmd/server/main.go       wire deps, start HTTP + gRPC, graceful shutdown
│   │   ├── internal/
│   │   │   ├── handler/             chi HTTP handlers — decode, validate, call service
│   │   │   ├── grpcserver/          gRPC server impl for internal callers
│   │   │   ├── service/             business rules, no SQL, no HTTP — unit tested here
│   │   │   ├── repo/                sqlc-generated queries + pgx pool
│   │   │   └── event/               rabbitmq publisher, outbox relayer
│   │   ├── db/migrations/           golang-migrate, expand → migrate → contract
│   │   ├── db/query.sql             hand-written SQL, sqlc generates typed Go
│   │   ├── api/openapi.yaml         public REST contract (generates the TS client)
│   │   └── Dockerfile               distroless, static binary, ~15 MB
│   ├── cart/ order/ inventory/ pricing/ payment/
│   ├── booking/ allocation/ logistics/ notify/ identity/ search/ media/
├── proto/                           protobuf contracts, versioned, buf-linted
│   └── keenplaza/catalog/v1/catalog.proto
├── pkg/                             shared Go libs — NOT shared business logic
│   ├── httpx/    middleware: auth, request-id, otel, recover, rate limit
│   ├── money/    integer paise type, no floats anywhere
│   ├── errs/     error codes → HTTP status mapping (one contract, all services)
│   ├── outbox/   transactional outbox → Postgres queue table (RabbitMQ phase 2+)
│   └── otelx/    tracing/metrics bootstrap
├── apps/
│   ├── web/      React 19 + Vite + TS (storefront, SSR render server)
│   ├── admin/    React 19 + Vite SPA
│   ├── mobile/   React Native (customer)
│   └── partner/  React Native (professionals)
├── packages/     api-client (generated), types (generated), ui-tokens (shared design system)
└── deploy/       Helm charts per service, Terraform for AWS, ArgoCD app-of-apps`;

  const goPatterns = [
    ['Service template', 'Every service is the same shape: cmd → handler → service → repo. A new service is a `make new-service NAME=x` scaffold, so the twelfth service costs a day, not a sprint.'],
    ['Handlers stay thin', 'Decode, validate, map to a domain call, map errors to `pkg/errs`. No business logic in handlers — that is what makes the service layer unit-testable without HTTP.'],
    ['sqlc over ORM', 'SQL is written by hand in `db/query.sql`; sqlc generates typed Go. Stock and money queries are readable and reviewable, and a bad column name fails the build.'],
    ['Transactional outbox', 'Domain event rows are written in the same Postgres transaction as the state change, into a queue table other services poll with SELECT … FOR UPDATE SKIP LOCKED (LISTEN/NOTIFY wakes pollers instantly). No "order saved but event lost" class of bug, and no second broker in phase 1.'],
    ['Saga in order-service', 'Checkout is an orchestrated saga with explicit compensations: release reservation, release slot hold, void payment intent. Each step is idempotent and retried with backoff.'],
    ['Concurrency where it pays', 'PDP composition, allocation dispatch and notification fan-out use errgroup with per-call context deadlines — the exact work that would serialise in a single-threaded runtime.'],
    ['Context everywhere', '`ctx` is the first argument of every function that crosses a boundary. It carries the trace id, the deadline and cancellation from the gateway all the way to the SQL driver.'],
    ['Graceful degradation', 'Every outbound provider call sits behind a timeout, a circuit breaker and a fallback (next courier by priority, next payment gateway, queue the notification).'],
    ['Testing pyramid', 'Table-driven unit tests on the service layer; testcontainers-go integration tests against a real Postgres (including its queue table); contract tests generated from protobuf and OpenAPI.'],
    ['One binary per service', 'Static build in a distroless image. Kubernetes HPA on CPU and queue-table backlog (rows past their `available_at`); typical pod holds 128–256 MB.']
  ];

  const commsRules = [
    ['React / React Native → backend', 'REST + JSON through Kong only. Clients never call a service directly and never hold service URLs.'],
    ['Service → service (sync)', 'gRPC with protobuf, mTLS, 300 ms default deadline, retry budget on idempotent reads only.'],
    ['Service → service (async)', 'Postgres-queue domain events (phase 1; RabbitMQ phase 2+ if volume demands it). The producer knows nothing about consumers — that is how the services domain was added without touching order-service.'],
    ['Read-your-own-data', 'A service never queries another service\'s database. Cross-domain reads are gRPC calls or a locally projected read model built from events.'],
    ['Shared code', '`pkg/` holds plumbing (middleware, money type, error codes) only. Shared business logic across services is banned — it recreates the monolith.'],
    ['Frontend types', 'The TypeScript API client is generated from the Go services\' OpenAPI spec in CI. Hand-written response interfaces are not allowed to drift.']
  ];

  /* ---------- 5. ENVIRONMENTS & PROMOTION ---------- */
  const environments = [
    { name: 'Local', url: 'localhost', data: 'Seeded fixtures (this prototype\'s mock data)', deploy: 'docker compose up',
      gate: 'Unit tests + lint pass locally', audience: 'Developer' },
    { name: 'Dev', url: 'dev.keenplaza.in', data: 'Synthetic, reset nightly', deploy: 'Auto on merge to `develop`',
      gate: 'CI green: lint, unit, type-check, build', audience: 'Dev team' },
    { name: 'QA / Staging', url: 'staging.keenplaza.in', data: 'Anonymised production copy, weekly refresh', deploy: 'Auto on release branch cut',
      gate: 'Integration + E2E (Playwright) + contract tests', audience: 'QA, product, client demos' },
    { name: 'UAT', url: 'uat.keenplaza.in', data: 'Staging data + client scenarios', deploy: 'Manual promote of the tested image',
      gate: 'Client sign-off checklist', audience: 'Client stakeholders' },
    { name: 'Production', url: 'www.keenplaza.in', data: 'Live', deploy: 'Manual approval → canary 10% → 100%',
      gate: 'Sign-off + error-budget check + rollback plan', audience: 'Customers' }
  ];

  const pipeline = [
    { step: 'Branch', detail: '`feature/BZ-123-cart-service-line` cut from `develop`. Trunk-ish: branches live under 3 days.' },
    { step: 'Pull request', detail: 'CI runs golangci-lint + go test ./... + go vet for touched services, eslint + tsc + vitest for touched apps, buf breaking-change check on proto, and an OpenAPI contract diff. Two approvals; one must be the service owner.' },
    { step: 'Merge to develop', detail: 'Only the changed services rebuild (Go build cache + path filters). Images tagged `sha-<commit>`; ArgoCD syncs Dev automatically. React apps build once and deploy to CloudFront.' },
    { step: 'Release cut', detail: '`release/1.8.0` branched from develop. Version bumped, changelog generated from conventional commits.' },
    { step: 'Staging', detail: 'Same image promoted — never rebuilt. Playwright E2E suite plus manual QA pass on the release checklist.' },
    { step: 'UAT & sign-off', detail: 'Client walks the flows on UAT. Defects are fixed on the release branch and cherry-picked back to develop.' },
    { step: 'Production canary', detail: 'Same image, 10% of traffic for 30 minutes. Watch error rate, p95 latency, checkout conversion and payment success.' },
    { step: 'Full rollout', detail: 'Ramp to 100%. Tag `v1.8.0` on main. Merge release back to develop.' },
    { step: 'Rollback', detail: 'ArgoCD rollback to the previous image (one command, under 2 minutes). Database migrations are always backward-compatible so code can roll back without data rollback.' }
  ];

  const versioning = [
    ['Product releases', 'SemVer `MAJOR.MINOR.PATCH` per service; the platform gets a marketing version (1.8 "Services GA").'],
    ['API versioning', 'URL-versioned `/v1/…`. Breaking changes ship as `/v2` with `/v1` supported for two quarters. Additive fields are never breaking.'],
    ['Mobile app', 'Force-upgrade floor via a `/v1/config/min-version` check. Two versions supported behind the current release.'],
    ['Database', 'Expand → migrate → contract. Never drop a column in the same release that stops writing to it.'],
    ['Feature flags', 'Every risky feature ships dark behind a flag (services marketplace, bundles, subscriptions — see Admin → Settings → Business).'],
    ['Events', 'Schema registry with backward-compatible Avro; consumers must tolerate unknown fields.']
  ];

  const conventions = [
    ['Auth', '`Authorization: Bearer <JWT>` · 15-minute access token, rotating refresh. Service-to-service uses mTLS + scoped tokens.'],
    ['Idempotency', 'Every POST that moves money or stock requires an `Idempotency-Key`; replays return the original response.'],
    ['Tracing', '`x-request-id` and W3C `traceparent` flow through every hop and appear in every log line.'],
    ['Pagination', 'Cursor-based: `?cursor=…&limit=24`. Offset pagination only in admin tables.'],
    ['Errors', '`{ error: { code, message, details, requestId } }` with stable machine-readable codes.'],
    ['Money', 'Integer paise everywhere. Never a float. Formatting happens in the client only.'],
    ['Time', 'ISO-8601 with offset, stored UTC, rendered in Asia/Kolkata.'],
    ['Rate limits', 'Per-user and per-IP at the gateway; documented in the response headers `x-ratelimit-*`.']
  ];

  const errorCodes = [
    ['400', 'VALIDATION_FAILED', 'Payload failed schema validation', 'Fix the request; details[] lists field paths'],
    ['401', 'TOKEN_EXPIRED', 'Access token expired', 'Refresh silently and retry once'],
    ['403', 'INSUFFICIENT_SCOPE', 'Role lacks the permission', 'Surface the admin permission matrix'],
    ['409', 'STOCK_UNAVAILABLE', 'Reservation failed at checkout', 'Show the exact line, offer a substitute variant'],
    ['409', 'SLOT_TAKEN', 'Slot was locked by another customer', 'Refresh the slot grid, keep the cart intact'],
    ['422', 'COUPON_INELIGIBLE', 'Cart does not meet the coupon rule', 'Show what is missing (e.g. add ₹500 more)'],
    ['429', 'RATE_LIMITED', 'Too many attempts', 'Back off using retry-after'],
    ['502', 'GATEWAY_PROVIDER_DOWN', 'Payment or courier provider failed', 'Automatic fallback to the next provider by priority']
  ];

  const team = [
    { squad: 'Commerce squad', owns: 'catalog · cart · pricing · order · inventory (Go)', size: '4 Go, 2 React, 1 QA' },
    { squad: 'Services squad', owns: 'booking · allocation (Go) · partner app (RN)', size: '3 Go, 2 React Native, 1 QA' },
    { squad: 'Growth squad', owns: 'search · notify · analytics (Go) · campaigns UI (React)', size: '2 Go, 2 React, 1 data' },
    { squad: 'Platform squad', owns: 'gateway · identity · pkg/ libs · service template · CI/CD · observability', size: '3 Go platform, 1 SRE' }
  ];

  const phases = [
    ['Phase 1 · Commerce core', '10–12 weeks', '7 Go services + Kong, React storefront, React admin, React Native app'],
    ['Phase 2 · Services', '8–10 weeks', 'booking + allocation Go services, React Native partner app, service UI in web/app'],
    ['Phase 3 · The bundle', '4–6 weeks', 'product + service in one cart, unified timeline, attach-rate analytics, repeat booking'],
    ['Phase 4 · Scale', '8+ weeks', 'multi-seller, subscriptions, more cities, partner APIs, warehouse automation']
  ];

  global.DEVDATA = { hosts, services, ops, stack, repoLayout, goPatterns, commsRules,
    environments, pipeline, versioning, conventions, errorCodes, team, phases };
})(window);
