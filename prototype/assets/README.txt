KeenPlaza prototype — assets
=========================

This folder is intentionally light.

All product, service and banner imagery in the prototype is generated at runtime as
inline SVG data URIs by `UI.ph(seed, emoji, label)` in `js/ui.js`. That keeps the
prototype:

  • fully offline — no CDN, no network calls, opens straight from the filesystem
  • deterministic — the same product always gets the same gradient/colour
  • zero-weight — no binary assets to ship or licence

Icons are inline SVG paths in the `ICONS` map in `js/ui.js`.
Charts are hand-drawn SVG in `UI.Chart` — no charting library.
Favicons are inline SVG data URIs in each HTML file's <head>.

To swap in real photography for a client demo:
  1. Drop image files into this folder (e.g. assets/products/p1.jpg).
  2. In `js/ui.js`, change `productImg(p, i)` to return `assets/products/${p.id}-${i}.jpg`
     with the current `ph(...)` call kept as the fallback.
Nothing else needs to change — every screen goes through that one function.
