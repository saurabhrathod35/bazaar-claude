# KeenPlaza — Commerce + Services Super App (Interactive Prototype)

**Live demo → https://saurabhrathod35.github.io/bazaar-claude/**

A clickable, dependency-free prototype for a modern Indian e-commerce platform that is
architected from day one to also run a home-services marketplace.

> One platform for everything customers want to **buy, book, install, repair, maintain and manage**.

## Screens

| | Link | What it covers |
|---|---|---|
| 🛍️ | [Customer website](https://saurabhrathod35.github.io/bazaar-claude/prototype/index.html) | Home, listing + filters, PDP, super cart, checkout, account, orders, auth |
| 🧰 | [Service marketplace](https://saurabhrathod35.github.io/bazaar-claude/prototype/services.html) | Categories, packages, 5-step booking wizard, tracking, professionals |
| 📊 | [Admin dashboard](https://saurabhrathod35.github.io/bazaar-claude/prototype/admin.html) | 37 screens — catalog, variants, inventory, marketing, services, logistics, analytics, roles |
| 📱 | [Mobile app](https://saurabhrathod35.github.io/bazaar-claude/prototype/mobile.html) | 22 screens in a 390×844 device frame |
| 🛡️ | [Super Admin Portal](https://saurabhrathod35.github.io/bazaar-claude/prototype/superadmin.html) | Cross-tenant: tenant list, onboarding, feature flags, incident troubleshooting, audit log — for the backend on-call team, not tenant staff |
| 🧑‍💻 | [Dev Mode / architecture](https://saurabhrathod35.github.io/bazaar-claude/prototype/dev.html) | Go microservices, React & React Native, request flows, environments, release process |

## Highlights

- **Super cart** — products and services in one cart, one checkout, one timeline. Open the
  [LG AC](https://saurabhrathod35.github.io/bazaar-claude/prototype/index.html#/pdp/p6) and add
  *AC Installation ₹1,499* to see it.
- **Dev Mode** — the pill at the bottom-right of any screen turns each click into the API call it
  would make in production: endpoint, owning service, hop-by-hop route, payload, events, latency.
- **Live theming** — the pill at the bottom-left switches light/dark and regenerates the entire
  token ramp from three brand colours. Press **T** to flip dark mode.
- **Zero dependencies** — HTML, CSS and vanilla JS. Clone and open `prototype/index.html`.

## Target production stack

React 19 (web + admin) · React Native (customer + partner apps) · **Go 1.23 microservices**
(14 services, database-per-service, gRPC internally, Postgres-queue event bus (phase 1) / RabbitMQ (phase 2+), Postgres/OpenSearch).
Full specification in [`prototype/dev.html`](https://saurabhrathod35.github.io/bazaar-claude/prototype/dev.html).

## Run locally

```bash
git clone git@github.com:saurabhrathod35/keenplaza-claude.git
cd keenplaza-claude/prototype
python3 -m http.server 8080   # or just open index.html
```

Detailed documentation: [`prototype/README.md`](prototype/README.md).

---
All data is fictional. No real payment, shipping or messaging APIs are contacted.
