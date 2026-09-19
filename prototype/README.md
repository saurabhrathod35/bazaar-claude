# KeenPlaza — Commerce + Services Super App (Interactive Prototype)

> **One platform for everything customers want to buy, book, install, repair, maintain and manage.**
> Today: e-commerce. Tomorrow: e-commerce + services. Future: a unified commerce & services ecosystem.

A clickable, framework-free prototype covering the customer website, the mobile app,
the admin console and the service marketplace — built so a client can walk through the
whole product before a line of production code is written.

---

## 1. How to run

**Option A — just open it.** Double-click `index.html`. Everything works from `file://`:
no build step, no npm install, no network calls.

**Option B — local server** (recommended for the cleanest demo):

```bash
cd prototype
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static server works (`npx serve`, VS Code Live Server, nginx).

**Requirements:** a modern browser (Chrome, Edge, Safari, Firefox). No dependencies,
no accounts, no backend. Demo state (cart, wishlist, orders, bookings) is kept in
`localStorage` — the ↻ button in the bottom prototype bar resets it.

---

## 2. Prototype structure

```text
prototype/
├── index.html            Customer website (SPA, hash routing)
├── services.html         Service marketplace + booking wizard
├── admin.html            Admin / business dashboard
├── mobile.html           Mobile app — 22 screens in a device frame
├── dev.html              Dev Mode: backend architecture & engineering spec
│
├── css/
│   ├── global.css        Design tokens + the whole component system
│   ├── storefront.css    Customer website & services marketplace
│   ├── admin.css         Admin shell, KPI cards, panes, matrices
│   ├── mobile.css        Device frame + app UI
│   ├── dev.css           Request tracer overlay + spec page
│   └── theme.css         Theme switcher panel + dark-mode corrections
│
├── js/
│   ├── mock-data.js      All demo data — the single source of truth
│   ├── ui.js             Shared kit: formatting, icons, modal/drawer/toast,
│   │                     charts, generic table, and the persisted "super cart"
│   ├── app.js            Customer website routes and views
│   ├── services.js       Service marketplace routes, booking wizard
│   ├── admin.js          Admin shell + dashboard, orders, catalog
│   ├── admin-modules.js  Marketing, customers, services, logistics,
│   │                     analytics, settings, integration architecture
│   ├── mobile.js         Mobile screens + screen switcher
│   ├── dev-data.js       The engineering spec as data: services, endpoints,
│   │                     request flows, stack, environments, release process
│   ├── dev-mode.js       Live request tracer overlay (works on every screen)
│   ├── dev.js            Renders the spec page from dev-data.js
│   └── theme.js          Light/dark + brand-colour engine (loaded in <head>)
│
└── assets/               Notes only — imagery is generated as inline SVG
```

### Why it is split this way

| Concern | Lives in | Reused by |
|---|---|---|
| Colour, type, spacing, buttons, inputs, cards, tables, chips, badges, modals, toasts, drawers | `css/global.css` | every screen |
| Money/date formatting, icons, placeholder art, charts, table renderer, form modal | `js/ui.js` | every screen |
| Products, services, orders, customers, coupons, inventory, professionals… | `js/mock-data.js` | every screen |
| Cart, wishlist, coupons, orders, bookings, login, city | `UI.Store` in `js/ui.js` | website, services, mobile — **shared cart across all three** |

Add a product once in `mock-data.js` and it appears on the website, in search, on the
mobile app, in the admin catalog and in analytics.

---

## 3. Available screens

### Customer website (`index.html`)
Home · Product listing with full filter rail · Product details (gallery, zoom, variants,
pincode check, offers, specs, reviews) · Universal search (products **and** services) ·
Offers · Cart · Multi-step checkout · Order success · Account (orders, service bookings,
wishlist, addresses, coupons, wallet, saved payments, notifications, profile, support) ·
Order detail with tracking timeline · Booking tracking · Login · OTP · Registration ·
Forgot password · Reset password.

### Service marketplace (`services.html`)
Services home · Category page with packages and professionals · Package detail
(inclusions, exclusions, duration, reviews) · 5-step booking wizard
(service → package → address → date & slot → payment) · Booking confirmation ·
Professionals directory · Partner sign-up.

### Admin console (`admin.html`)
**Dashboard** — 9 KPI cards, revenue trend (product vs service), orders & bookings,
category/channel splits, top products, low stock, delayed shipments, service performance,
active customers, date filters incl. custom range.

**Commerce** — Orders (+ detail drawer with fulfilment timeline & status update),
Products (9-tab editor: basic, media, pricing, inventory, variants, shipping, SEO, offers,
related), Categories (nested tree CRUD), Brands, Variants (full SKU matrix), Sizes
(independent master data + category mapping), Attributes, Inventory (adjust, transfer,
history, warehouses), Reviews moderation.

**Marketing** — Offers, Coupons, Campaigns (with live push preview), Notification trigger
matrix across push / email / SMS / WhatsApp / in-app.

**Customers** — Users (7-tab customer drawer: overview, orders, bookings, addresses,
wallet & coupons, notifications, support), Segments.

**Services** — Service categories, Packages, Bookings (assign professional), Professionals
(profile drawer), Availability grid, Service areas.

**Logistics** — Shipments, Shipping providers (API key / secret / base URL / priority /
serviceability / test connection), Warehouses.

**Analytics** — Sales, Products, Customers, Inventory, Services.

**Settings** — Business, Payments, Shipping APIs, Notifications, Roles & Permissions
(9 roles × 13 modules × view/create/update/delete matrix), Integrations
(visual architecture map), API Keys.

### Mobile app (`mobile.html`)
Splash · Onboarding · Login · OTP · Registration · Home · Search · Categories ·
Product list · Product details · Wishlist · Cart · Checkout · Order placed · Orders ·
Order tracking · Notifications · Profile · Services · Service details · Slot selection ·
Booking confirmed · Booking tracking. Arrow keys move between screens.

---

## 4. Main flows to demo

1. **Buy a product** — Home → category → PDP → pick colour/size → Add to cart → coupon → checkout → tracking.
2. **The killer flow: product + service in one cart** — open the LG AC (`#/pdp/p6`) →
   *Add AC Installation ₹1,499* → cart shows **Products** and **Services** as separate groups →
   checkout asks for a delivery option **and** an appointment slot → confirmation shows both →
   the order timeline carries the linked service visit.
3. **Book a service standalone** — `services.html` → AC Service → package → 5-step wizard → booking tracking.
4. **Universal search** — type `AC` in the header: products and services come back together.
5. **Admin one-view** — `admin.html` dashboard answers revenue, orders, bookings, top products,
   low stock, delayed shipments, product vs service revenue split, on one screen.
6. **Catalog depth** — Products → edit → **Variants** tab shows per-variant SKU, price, MRP,
   stock, barcode, weight, status. Sizes are managed separately and mapped to categories.
7. **Roles** — Settings → Roles & Permissions → click through the nine roles and watch the matrix change.
8. **Mobile walkthrough** — `mobile.html`, then ← → through all 22 screens.

**Theming:** the **Theme** pill (bottom-left, every screen) opens light / dark / system,
eight preset palettes, colour pickers for primary / secondary / accent, and a corner-radius
control. Press **T** anywhere to flip dark mode. See section 5b.

**Presentation mode:** the pill at the bottom of every page switches between
Customer Website · Mobile App · Admin Dashboard · Service Marketplace · Dev / Architecture,
and carries the "Interactive Prototype" label for the client. ↻ resets demo data.

---

## 4b. Dev Mode — for the engineering team

The prototype answers the design question. **Dev Mode** answers the build question:
*if I do this operation, where does the request go — which server, which service, which API?*

### Live request tracer

Click the **Dev Mode** pill (bottom-right) on the customer site, the services site, the admin
console or the mobile app. From then on, every action prints the API call it would make in
production:

```text
POST  /v1/cart/items                              212 ms   200 OK
  Operation   Add product to cart
  Owning svc  cart          Auth  Bearer JWT      SLO  p95 < 220 ms
  ├ web        www.keenplaza.in            POST body: { kind, variantId, qty }
  ├ gw         api.keenplaza.in            Verify JWT · attach x-user-id          5 ms
  ├ cart       cart.svc.cluster.local   Upsert line into cart aggregate       12 ms
  ├ catalog    catalog.svc…  (gRPC)     GetVariant → price, MRP, status       18 ms
  ├ inventory  inventory.svc… (gRPC)    CheckAvailability(sku, qty)           15 ms
  ├ pricing    pricing.svc…             Recalculate totals, auto-apply offers 21 ms
  ├ pg         pg-primary:5432          UPSERT cart row, expires_at + 30d      6 ms
  └ queue      pg-primary:5432 (queue)  emit cart.item_added                   4 ms
  Request  { "kind": "product", "variantId": "p6-white-15ton", "qty": 1 }
  Response { "cartId": "crt_91f2", "subtotal": 42999, "suggestedServices": ["pk-ac-install"] }
  Events   queue → cart.item_added   analytics → add_to_cart
```

Each trace shows method and path, the owning service, auth and cache policy, the target SLO,
a hop-by-hop waterfall with per-hop latency, the request and response payloads, the domain
events emitted, and — for the checkout saga — the compensating failure path. A dropdown at the
top replays any of the 20 traced operations on demand, so you can demo `order.place` or
`allocation.assign` without walking the whole flow.

Traced today: catalog listing and detail, universal search, add product / add service to cart,
quantity change, remove line, wishlist, coupon apply, slot fetch, order placement (full saga),
standalone booking, professional allocation, stock adjustment, product upsert, order status
webhook, campaign send, OTP login, admin module loads and analytics queries.

### Engineering spec page — `dev.html`

The written half, for the developer who has to build it:

* **Architecture** — 4 clients → CDN/WAF → API gateway → 14 services → Postgres (data + phase-1 event queue)/OpenSearch → external providers, with the reasoning behind database-per-service, the event bus, and the single polymorphic cart.
* **Service catalogue** — what each service owns, its stack, its datastore, pod count and the one design note that matters (slot locks, stock ledger, saga compensation…).
* **Request flows** — the same 13 core operations as expandable waterfalls with payloads and events.
* **Tech stack** — every layer with the *why*, not just the *what*.
* **Go microservices** — repo layout, service anatomy (thin chi handler → testable service layer → sqlc repo), a real `POST /v1/cart/items` handler with its parallel `errgroup` fan-out, and the ten patterns every service follows: transactional outbox, saga compensation, context deadlines, circuit breakers, testcontainers.
* **React & React Native** — the four apps, the four shared packages, and one `useAddToCart` hook consumed by both web React and React Native.
* **Service comms** — REST at the edge, gRPC between services, a Postgres queue table for async (RabbitMQ phase 2+), plus the protobuf contract and the buf breaking-change gate.
* **Data & integrity** — stock reservations, slot holds, server-side pricing, core entity map.
* **API conventions & error contract** — auth, idempotency, tracing, pagination, money as integer paise, stable error codes and what the client should do with each.
* **Environments** — Local → Dev → QA/Staging → UAT → Production, with data policy, deploy trigger and promotion gate per environment.
* **Version promotion** — branch → PR → develop → release cut → staging → UAT → canary 10% → 100% → rollback, built on *one artefact promoted, never rebuilt*.
* **Versioning rules** — SemVer per service, URL-versioned APIs, mobile force-upgrade floor, expand/migrate/contract database changes, feature flags, event schema compatibility.
* **Team & delivery** — four squads, ownership boundaries, four delivery phases with durations, and the definition of done.

---

## 5. Design system

Tokens live at the top of `css/global.css` — primary `#5B3DF5`, secondary `#0FB5A6`,
accent `#FF7A2F`, success / warning / error / info, a 10-step neutral ramp, a type scale,
a 4px spacing scale, four radii and four elevations. Semantic surface tokens
(`--bg`, `--surface`, `--border`, `--text`) are dark-mode ready: a `[data-theme="dark"]`
block is already defined, so `document.documentElement.dataset.theme = 'dark'` previews it.
One polished light theme is the shipped default.

Components: buttons (6 variants × 3 sizes), inputs, selects, textareas, switches, cards,
panels, tiles, tables, chips, status badges, modals, drawers, toasts, tabs, segmented
controls, timelines, steppers, ratings, progress bars, skeletons, empty states — plus
dependency-free SVG charts (line/area, columns, ranked bars, donut, sparkline, funnel).

### 5b. Live theming

`js/theme.js` is the token engine. Give it three brand colours and it regenerates the full
50→900 ramp for each, plus `--on-primary` (contrast-checked automatically — pick a yellow
primary and button text flips to dark ink), `--sh-primary`, and the radius scale. Everything
downstream — buttons, badges, charts, timelines, the mobile frame, the admin sidebar — is
built on those tokens, so nothing needs a repaint rule.

* **Modes:** Light · Dark · System (follows the OS and updates live when the OS flips).
* **Presets:** Indigo (default), Emerald, Royal, Crimson, Sunset, Plum, Forest, Midnight.
* **Custom:** colour picker or hex entry for primary, secondary and accent.
* **Corners:** Sharp / Default / Round — retunes `--r-xs … --r-xl` across every component.
* **Persistence:** stored in `localStorage`, applied in `<head>` before first paint, so there
  is no flash of the wrong theme when moving between the five pages.
* **Dark mode is generated, not hand-drawn:** in dark, the 50–200 steps mix toward the dark
  surface instead of white, so tinted backgrounds stay dark. `css/theme.css` then corrects
  the handful of places that legitimately hardcode a light value (badge tints, wishlist
  buttons, footer, toasts, the mobile page backdrop).
* **Charts follow the theme:** admin charts read `UI.cssVar('--primary')` and re-render on the
  `theme:change` event the engine dispatches.

Breakpoints: 1440 / 1280 / 1024 / 768 / 560 / 390. Every screen was built mobile-first
and reflows — the PLP filter rail becomes a drawer, the admin sidebar becomes an overlay,
the PDP grows a sticky buy bar.

---

## 6. Future implementation recommendations

**Architecture.** Keep the split this prototype already models: a commerce core
(catalog, cart, orders, inventory, payments) and a services core (catalogue, slots,
bookings, professional allocation) sharing one identity, one cart, one payment layer and
one notification bus. The cart is the integration point — model a cart line as a
polymorphic `{ kind: 'product' | 'service' }`, exactly as `UI.Store` does here.

**Target stack — React JS · React Native · Go microservices.**

| Surface | Choice |
|---|---|
| Storefront | React 19 + Vite + TypeScript, SSR through a thin Node render server for SEO |
| Admin console | React 19 + Vite SPA, TanStack Query/Table, React Hook Form |
| Customer app | React Native 0.76 + TypeScript |
| Partner app (professionals) | React Native, offline-tolerant write queue |
| Backend | 14 Go 1.23 microservices — chi, sqlc/pgx, grpc-go |
| Contracts | REST + JSON through Kong for clients; gRPC + protobuf between services |
| Data | PostgreSQL 16 + postgis (database per service — carts, slot locks, geo all TTL rows; phase-1 event queue table too), OpenSearch, ClickHouse, S3 — RabbitMQ phase 2+ |
| Infra | AWS ap-south-1, EKS, Terraform, Helm, ArgoCD, OpenTelemetry |

Monorepo: `services/*` (one Go module and image each), `proto/` (buf-linted contracts),
`pkg/` (plumbing only — middleware, integer-paise money type, error codes, outbox),
`apps/{web,admin,mobile,partner}` (React and React Native), `packages/*`
(TypeScript client and types **generated** from the Go OpenAPI/protobuf, so a backend
rename breaks the frontend build immediately).

Go earns its place here because the workload is fan-out: a product page composes catalog +
inventory + pricing + booking + search, allocation dispatches to N professionals with
timeouts, notifications fan out to four channels. `errgroup` plus context deadlines makes
that ordinary code. 15 MB images and sub-second starts also keep 14 services × 3 replicas
affordable, and keep autoscaling ahead of a flash-sale ramp.

Full detail — repository layout, a real handler with its service layer, the ten patterns
every service follows, protobuf contracts, and the shared React/React Native hook layer —
is on **`dev.html`** under *Go microservices*, *React & React Native* and *Service comms*.

**Data model priorities.**
`Product → Variant (SKU)` is the single most important relationship — price, MRP, stock,
barcode, weight and dimensions belong on the *variant*, never the product.
Keep `SizeGroup → Size → Category` as independent master data (as shown in Admin → Sizes).
Give services a mirrored `ServiceCategory → Package → Booking` chain, and let a
`Package.bundleFor[]` list of product categories drive cross-selling.

**Slot & inventory integrity.** Reserve stock at checkout with a TTL, not at payment.
Same for service slots: lock the slot when the wizard reaches payment, release on timeout.
Professional allocation should be a queue-driven job (assign ~2 hours before the slot), not synchronous.

**Integrations.** Payment (Razorpay/Cashfree) and shipping (Delhivery/Blue Dart/Shiprocket)
behind a provider interface with priority-based fallback — the Shipping Providers screen
already models the contract. Never hold API secrets client-side; the keys shown here are
dummy strings.

**Notifications.** One event bus, many channels. The trigger matrix in
Admin → Notifications maps 1:1 to an `event → channel → template` table.

**Phasing.**
Phase 1 — commerce (catalog, cart, checkout, orders, admin, inventory).
Phase 2 — services in the same app (catalogue, booking, professional app, allocation).
Phase 3 — the bundle (product + service in one cart, unified timeline, repeat/subscription).
Phase 4 — marketplace scale (multi-seller, multi-city, partner APIs, subscriptions).

**Analytics from day one.** Instrument the funnel in Analytics → Sales
(sessions → views → cart → checkout → order) and the service funnel alongside it —
attach-rate of services to product orders is the metric this whole strategy lives or dies by.

---

## 7. Notes for reviewers

* All data is fictional. Names, cities, orders, credentials and API keys are placeholders.
* No real payment, shipping or messaging API is contacted. Nothing leaves the browser.
* Imagery is generated as inline SVG — see `assets/README.txt` to swap in real photography.
* Buttons that could reasonably be simulated in front-end JavaScript are wired; the rest
  respond with an explicit "demo only" toast rather than failing silently.
