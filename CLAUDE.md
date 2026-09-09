# Bazaar — Claude / Coding Instructions

## 1. Project identity

Bazaar is a commerce + services super-app designed for the Indian market.

Core product idea:
- Customers can discover, buy, book, install, repair, maintain, and manage products/services from one platform.
- E-commerce is the first production phase.
- Services are designed as a first-class domain, not a later bolt-on.
- The defining integration is the unified **super cart**: product and service lines can coexist in one cart and one checkout.

The current repository is an interactive, dependency-free prototype. Treat it as the product UX and architecture specification for the future production system, not as the production runtime itself.

## 2. Source of truth

Before implementing a feature, inspect the existing prototype and documentation relevant to it.

Primary references:
- `README.md` — repository overview and prototype entry points.
- `prototype/README.md` — functional scope, flows, architecture recommendations, design system, data model priorities, integrity rules, environments, version promotion, and phasing.
- `prototype/dev.html` — engineering specification UI.
- `prototype/js/dev-data.js` — service catalogue, runtime topology, traced operations, request flows, payloads, events, and SLO-oriented examples.
- `prototype/js/mock-data.js` — fictional demo domain data and the current UI-level domain model.
- `prototype/js/ui.js` — shared state and cross-surface behavior, especially the prototype `UI.Store`.
- `prototype/js/theme.js` and `prototype/css/*` — design-token and theme behavior.

When documentation and implementation disagree, do not silently invent behavior. Preserve backward compatibility where practical and call out the discrepancy in the change description.

## 3. Production target architecture

Target production stack:
- Web storefront: React 19 + Vite + TypeScript, with a thin Node SSR layer where SEO requires it.
- Admin: React 19 + Vite SPA.
- Customer mobile: React Native + TypeScript.
- Partner/professional mobile: React Native with offline-tolerant writes.
- Backend: Go 1.23 microservices.
- Edge: CDN/WAF + API Gateway.
- External client API: REST + JSON.
- Internal synchronous communication: gRPC + protobuf.
- Async integration: Kafka events.
- Data: PostgreSQL 16 database-per-service, Redis 7, OpenSearch, ClickHouse, S3.
- Infra: AWS ap-south-1, EKS, Terraform, Helm, ArgoCD, OpenTelemetry.
- Contracts: generated TypeScript clients/types from backend OpenAPI/protobuf contracts; use buf for protobuf linting and breaking-change checks.

The documented service catalogue contains 14 services:
1. identity-service
2. catalog-service
3. search-service
4. cart-service
5. pricing-promo-service
6. inventory-service
7. order-service
8. payment-service
9. booking-service
10. allocation-service
11. logistics-service
12. notification-service
13. media-service
14. analytics-collector

Keep ownership boundaries explicit. Do not create a new microservice merely to move a few files around. A new service needs a clear domain ownership boundary, data ownership, scaling reason, operational reason, or security/isolation reason.

## 4. Non-negotiable domain rules

### Product and SKU model
- `Product -> Variant (SKU)` is the primary commerce relationship.
- Price, MRP, stock identity, barcode, weight, dimensions, and variant-specific status belong to the variant, not the product.
- Treat SKU/variant IDs as stable identifiers.
- Size is independent master data: `SizeGroup -> Size -> Category`.

### Service model
- Keep `ServiceCategory -> Package -> Booking` as the core chain.
- Packages can reference product categories for cross-sell/bundle relationships.
- Serviceability must be evaluated using city/pincode/service-area rules before promising a booking.

### Unified cart
- A cart is a polymorphic aggregate containing lines of `kind = product | service`.
- Products and services share cart identity and checkout, but retain domain-specific validation.
- Do not duplicate cart logic between web, mobile, and services UI.
- Cross-sell/attach-rate is a first-class business objective.

### Money
- Represent monetary values as integer **paise** in APIs, persistence, events, and calculations.
- Never use floating point for money.
- Formatting to rupees belongs at presentation boundaries only.
- Pricing is server-authoritative. Never trust client-calculated totals.

### Inventory integrity
- Availability checks during cart operations are soft checks.
- Reserve inventory during checkout, not when an item is merely added to cart.
- Reservations require transactional locking and a TTL/expiry mechanism.
- A sweeper must release expired reservations safely.
- Keep an auditable stock ledger for adjustments/transfers/reservations.

### Service-slot integrity
- Slot capacity is domain data, not presentation state.
- Hold a slot when the checkout reaches the payment step.
- Slot holds expire automatically (prototype target: 10 minutes).
- Never overbook because of a client-side race.

### Professional allocation
- Allocation is asynchronous and queue-driven.
- Default model: dispatch approximately T-2 hours before the scheduled slot.
- Candidate scoring should account for skill, rating, distance, availability/load, and serviceability.
- Partner acceptance/decline must be idempotent.

### Payments
- Use a provider interface so gateways can be swapped/fail over.
- Webhooks are the source of truth for payment state; never treat the browser/client callback as authoritative.
- Payment operations must be idempotent.
- Reconciliation is a first-class workflow.

### Logistics
- Shipping/courier providers sit behind a provider interface.
- Select/fail over by priority plus serviceability.
- Webhook handling must be idempotent and signature-verified.

### Notifications
- Domain events drive notification delivery.
- Model notifications as `event -> channel -> template`.
- Channels include push, SMS, email, WhatsApp, and in-app.
- Delivery must be idempotent per `(event_id, channel)` or an equivalent deduplication key.

## 5. Go service architecture

Preferred service anatomy:

```text
service/
  cmd/
  internal/
    http/ or transport/
    service/        # business logic
    repository/     # persistence
    domain/         # entities/value objects where useful
    events/
  migrations/
  proto/
  tests/
  Dockerfile
  go.mod
```

Principles:
- Keep HTTP/gRPC handlers thin.
- Put business rules in testable service-layer functions.
- Keep persistence behind repositories/interfaces where useful.
- Use `context.Context` end-to-end.
- Set explicit context deadlines/timeouts for outbound calls.
- Prefer `errgroup` for bounded parallel fan-out.
- Use structured logging and distributed tracing.
- Do not leak SQL errors, provider secrets, stack traces, or internal topology through public APIs.

Every service should consider these patterns where applicable:
- transactional outbox
- saga/compensation for distributed workflows
- context deadlines
- idempotency keys
- circuit breakers / bounded retries
- graceful shutdown
- health/readiness checks
- metrics
- integration tests with disposable infrastructure (for example Testcontainers)

Retries must be bounded and must not amplify load. Never blindly retry non-idempotent mutations.

## 6. API conventions

External APIs:
- Version under `/v1/...`.
- Use stable resource-oriented naming.
- Validate auth, tenant/user context, idempotency, and request IDs at the edge.
- Support pagination for collection endpoints.
- Prefer cursor pagination for high-churn/large collections where appropriate.
- Return stable machine-readable error codes plus safe human-readable messages.
- Keep response contracts backward compatible during additive evolution.

Every request should support or propagate where appropriate:
- authorization context
- `x-request-id` / trace context
- idempotency key for money-moving or mutation endpoints
- user/tenant context

Never put provider API secrets in browser code, mobile bundles, static files, git history, or prototype UI.

## 7. Event-driven design

Use Kafka for cross-domain asynchronous communication, not as a replacement for every synchronous call.

Event rules:
- Name events as domain facts, e.g. `cart.item_added`, not UI actions.
- Include event ID, aggregate ID, timestamp, schema/version metadata, and trace/correlation context where appropriate.
- Consumers must be idempotent.
- Producers and consumers must tolerate duplicate delivery.
- Prefer additive schema evolution.
- Do not break existing consumers without a coordinated migration.

Important business events include, as applicable:
- catalog changes
- cart item added/removed
- checkout started/completed/failed
- inventory reserved/released
- payment authorized/captured/refunded
- order status changes
- booking created/rescheduled/cancelled
- professional assigned/accepted/declined
- shipment created/status changed
- notification requested/delivered/failed
- analytics funnel events

## 8. Checkout and saga rules

Checkout is a distributed workflow. Design it for partial failure.

Canonical direction:
1. Validate cart and latest pricing.
2. Validate serviceability and required slots.
3. Reserve required inventory.
4. Hold required service slots.
5. Create/authorize payment intent.
6. Confirm order/booking state only after authoritative payment state permits it.
7. Emit domain events through reliable publication.
8. On failure, execute explicit compensation in reverse dependency order.

Never:
- assume all calls succeed;
- update multiple service databases in one distributed transaction;
- expose a success page as proof of payment;
- reserve inventory indefinitely;
- allow stale client prices to become payable truth.

## 9. Frontend rules

Target applications:
- customer storefront
- admin console
- customer mobile app
- partner/professional mobile app

Use shared packages for:
- API types/clients
- domain types
- validation primitives
- auth/session helpers
- analytics instrumentation
- common UI primitives where platform-appropriate

Prefer server-state tools such as TanStack Query for remote state rather than building bespoke caching frameworks.

Keep client state separate from server state. Do not store sensitive secrets in localStorage or mobile persistent storage unless the storage mechanism is explicitly designed for secrets.

UX requirements carried forward from the prototype:
- mobile-first responsive behavior
- accessible forms and keyboard navigation
- loading, empty, error, success, and disabled states
- clear optimistic vs confirmed state
- checkout must surface delivery + appointment requirements when a service line is present
- avoid silent failures; provide actionable error feedback

## 10. Admin requirements

Admin is not merely CRUD. Preserve the prototype's operational model:
- catalog and variant management
- inventory and warehouses
- orders and fulfillment timelines
- service catalogue/packages/bookings
- professional management/allocation
- offers/coupons/campaigns
- customer support and customer history
- shipping provider configuration
- notifications and templates
- analytics
- roles and permissions
- integrations/API keys

Role-based access must be enforced server-side. UI hiding is not authorization.

For sensitive admin actions:
- validate permission
- validate resource ownership/scope
- record audit information
- require confirmation where irreversible
- make mutations idempotent when feasible

## 11. Authentication and authorization

Identity domain owns users, sessions, OTP, addresses, roles, and permissions.

Prototype target:
- short-lived access token (approximately 15 minutes)
- refresh token with longer lifetime (approximately 30 days)
- OTP throttling per phone number and IP

Security rules:
- never log access/refresh tokens or OTPs
- hash/password-protect secrets using appropriate modern mechanisms
- verify JWTs at trusted boundaries
- use least-privilege service credentials
- service-to-service auth should be explicit, not based solely on network location

## 12. Multi-tenant readiness

Bazaar is expected to evolve into a multi-tenant platform.

Even when tenant functionality is not the immediate MVP, avoid domain designs that make tenant isolation impossible.

Where tenant context exists:
- carry tenant ID in authenticated context
- scope queries and caches by tenant
- include tenant identity in unique constraints where needed
- never allow cross-tenant reads/writes by omission of a filter
- treat tenant boundaries as security boundaries

Do not introduce multi-tenancy everywhere prematurely if it makes the MVP unnecessarily complex; instead leave clean seams for it.

## 13. Observability

Use OpenTelemetry across HTTP/gRPC/Kafka boundaries where practical.

Every production service should expose:
- request/operation metrics
- latency distributions
- error rates
- dependency health
- consumer lag where applicable
- business metrics relevant to its domain

Trace IDs should connect a customer action through gateway, services, async events, and provider calls where supported.

Log structured data. Never log credentials, card data, OTPs, authorization headers, or unnecessary PII.

## 14. Testing expectations

For any non-trivial change, add tests at the right layer:
- unit tests for business rules
- repository/integration tests for persistence behavior
- contract tests for external/internal APIs where valuable
- workflow tests for sagas, payment webhooks, inventory/slot locking, and idempotency
- frontend interaction tests for critical checkout/admin flows

High-risk paths require explicit concurrency tests:
- inventory reservation
- slot locking
- duplicate payment webhook
- duplicate event consumption
- duplicate order/booking mutation
- simultaneous admin updates where race conditions can corrupt state

## 15. Data migration rules

Use expand -> migrate -> contract for breaking schema changes.

Never deploy code that requires a schema to exist before the migration has been safely rolled out.

Prefer backward-compatible migrations:
1. add nullable/new structures
2. deploy code that can read/write old + new as needed
3. backfill
4. switch reads
5. remove old structures only after all consumers are migrated

Migrations are versioned, repeatable in CI, and safe to run in deployment automation.

## 16. Environments and release process

Environment progression:
`Local -> Dev -> QA/Staging -> UAT -> Production`

Promotion model:
`feature branch -> PR -> develop -> release cut -> staging -> UAT -> canary 10% -> 100%`

Rules:
- one immutable artifact is promoted across environments; never rebuild the artifact between stages
- CI must run tests, linting, contract checks, and security checks before promotion
- production deployment must support rollback
- use feature flags for risky/incomplete capabilities
- mobile releases need a force-upgrade floor strategy for incompatible clients
- semantic versioning applies per service where the documented process requires it

## 17. Git and change discipline

Before changing code:
1. inspect the nearest existing implementation
2. identify domain owner and public contract
3. check tests and call sites
4. make the smallest coherent change
5. update documentation/contracts when behavior changes
6. add or update tests

Do not:
- rewrite unrelated files
- introduce a new library for a problem the current stack already solves
- bypass service ownership just because another service is easier to call
- duplicate domain rules in multiple services
- commit generated secrets, `.env` files, credentials, certificates, or real customer data
- rename public API fields/endpoints casually

Commit messages should clearly describe intent. Keep PRs focused.

## 18. Prototype-specific rules

The current `prototype/` application is intentionally dependency-free.

When editing the prototype:
- preserve zero external runtime dependencies unless the prototype itself is intentionally being migrated
- keep demo data fictional
- keep all external integrations simulated
- preserve hash-routing behavior where existing screens depend on it
- reuse `UI.Store` for shared demo state rather than inventing another cart state model
- keep theme behavior token-driven
- maintain light/dark/system support
- do not introduce a hidden network dependency
- wire actions that can reasonably be simulated; otherwise show an explicit demo-only response instead of failing silently

The prototype's Dev Mode is a contract visualization tool. When adding a meaningful user flow, consider adding:
- a traceable operation name
- endpoint/method
- owning service
- request/response examples
- hop-by-hop flow
- events
- expected SLO
- compensation path for distributed workflows

## 19. Product and business priorities

Build in this order unless a specific project decision overrides it:

### Phase 1 — Commerce foundation
Catalog, variants, cart, pricing, checkout, payments, orders, inventory, admin.

### Phase 2 — Services
Service catalogue, packages, bookings, slots, professional app, allocation.

### Phase 3 — Unified bundle
Product + service in one cart, unified timeline, repeat/subscription opportunities.

### Phase 4 — Marketplace scale
Multi-seller, multi-city, partner APIs, subscriptions, broader platform capabilities.

Analytics starts from day one. The most important strategic metric is not merely product GMV; measure the service attach-rate from product orders because it validates the commerce + services strategy.

## 20. Decision rule for new features

For every significant feature, answer these questions before coding:
1. Which domain owns it?
2. Which service owns its source of truth?
3. Is the operation synchronous or event-driven, and why?
4. What happens on timeout, duplicate request, duplicate event, or partial failure?
5. What data must be consistent immediately versus eventually?
6. What authorization is required?
7. What telemetry will prove it works in production?
8. What migration/versioning impact exists?
9. How does the feature behave for guest users, authenticated users, admins, and mobile where relevant?
10. Does the feature strengthen or accidentally bypass the unified commerce + services model?

When there is a trade-off, prefer correctness, explicit ownership, operability, and backward compatibility over short-term implementation convenience.
