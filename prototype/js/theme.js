/* ============================================================
   BAZAAR — theme.js
   Light / dark mode + live brand-colour customiser.
   Regenerates the whole token ramp (50→900) from three brand
   colours, writes them as CSS custom properties on :root, and
   persists the choice across every prototype screen.
   Loaded in <head> so the theme paints before first render.
   ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'bazaar.theme.v1';
  const DEFAULTS = { mode: 'light', primary: '#5B3DF5', secondary: '#0FB5A6', accent: '#FF7A2F', radius: 'default' };

  const PRESETS = [
    { id: 'indigo',  name: 'Indigo',    primary: '#5B3DF5', secondary: '#0FB5A6', accent: '#FF7A2F' },
    { id: 'emerald', name: 'Emerald',   primary: '#0E9F6E', secondary: '#3B82F6', accent: '#F59E0B' },
    { id: 'royal',   name: 'Royal',     primary: '#2563EB', secondary: '#06B6D4', accent: '#F43F5E' },
    { id: 'crimson', name: 'Crimson',   primary: '#DC2626', secondary: '#7C3AED', accent: '#F59E0B' },
    { id: 'sunset',  name: 'Sunset',    primary: '#EA580C', secondary: '#0EA5E9', accent: '#DB2777' },
    { id: 'plum',    name: 'Plum',      primary: '#9333EA', secondary: '#14B8A6', accent: '#FACC15' },
    { id: 'forest',  name: 'Forest',    primary: '#15803D', secondary: '#CA8A04', accent: '#EA580C' },
    { id: 'midnight',name: 'Midnight',  primary: '#4F46E5', secondary: '#64748B', accent: '#22D3EE' }
  ];

  const RADII = {
    sharp:   { xs: '2px', sm: '3px', md: '4px',  lg: '6px',  xl: '8px' },
    default: { xs: '6px', sm: '8px', md: '12px', lg: '16px', xl: '22px' },
    round:   { xs: '10px', sm: '14px', md: '20px', lg: '26px', xl: '32px' }
  };

  /* ---------- colour maths ---------- */
  const hex2rgb = h => {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgb2hex = ([r, g, b]) => '#' + [r, g, b].map(v =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b);
    return rgb2hex([0, 1, 2].map(i => A[i] + (B[i] - A[i]) * t)); };
  /** Relative luminance → pick readable foreground. */
  const lum = c => { const [r, g, b] = hex2rgb(c).map(v => { v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const readable = bg => (lum(bg) > 0.55 ? '#141428' : '#ffffff');
  const rgba = (c, a) => { const [r, g, b] = hex2rgb(c); return `rgba(${r},${g},${b},${a})`; };

  /** Build a 50→900 ramp. In dark mode the light end is mixed toward the
      dark surface instead of white, so tinted backgrounds stay dark. */
  function ramp(base, dark) {
    const lightEnd = dark ? '#15152a' : '#ffffff';
    const darkEnd = dark ? '#050510' : '#000000';
    return {
      50:  mix(base, lightEnd, dark ? 0.90 : 0.94),
      100: mix(base, lightEnd, dark ? 0.82 : 0.88),
      200: mix(base, lightEnd, dark ? 0.68 : 0.74),
      300: mix(base, lightEnd, 0.55),
      400: mix(base, lightEnd, 0.30),
      500: base,
      600: mix(base, darkEnd, 0.14),
      700: mix(base, darkEnd, 0.30),
      800: mix(base, darkEnd, 0.46),
      900: mix(base, darkEnd, dark ? 0.72 : 0.62)
    };
  }

  /* ---------- state ---------- */
  let state = Object.assign({}, DEFAULTS);
  try { state = Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}

  const prefersDark = () => global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolvedMode = () => state.mode === 'system' ? (prefersDark() ? 'dark' : 'light') : state.mode;

  /* ---------- apply ---------- */
  function apply() {
    const dark = resolvedMode() === 'dark';
    const root = document.documentElement;
    root.setAttribute('data-theme', dark ? 'dark' : 'light');

    const p = ramp(state.primary, dark);
    const s = ramp(state.secondary, dark);
    const a = ramp(state.accent, dark);
    const set = (k, v) => root.style.setProperty(k, v);

    Object.keys(p).forEach(k => set(`--primary-${k}`, p[k]));
    set('--primary', state.primary);
    set('--secondary', state.secondary);
    set('--secondary-600', s[600]);
    set('--secondary-100', s[100]);
    set('--accent', state.accent);
    set('--accent-600', a[600]);
    set('--accent-100', a[100]);
    set('--on-primary', readable(state.primary));
    set('--sh-primary', `0 8px 22px ${rgba(state.primary, dark ? 0.45 : 0.28)}`);

    const r = RADII[state.radius] || RADII.default;
    set('--r-xs', r.xs); set('--r-sm', r.sm); set('--r-md', r.md); set('--r-lg', r.lg); set('--r-xl', r.xl);

    root.style.colorScheme = dark ? 'dark' : 'light';
    save();
    if (global.__themePanelSync) global.__themePanelSync();
    // screens with hand-drawn SVG charts redraw on this
    try { global.dispatchEvent(new CustomEvent('theme:change', { detail: { mode: dark ? 'dark' : 'light' } })); }
    catch (e) {}
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  const Theme = global.Theme = {
    get state() { return state; },
    get mode() { return resolvedMode(); },
    presets: PRESETS,
    set(patch) { Object.assign(state, patch); apply(); },
    toggle() { Theme.set({ mode: resolvedMode() === 'dark' ? 'light' : 'dark' }); },
    reset() { state = Object.assign({}, DEFAULTS); apply(); },
    apply
  };

  apply(); // before first paint — no flash of the wrong theme
  if (global.matchMedia) {
    const mq = global.matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener || mq.addListener).call(mq, 'change', () => { if (state.mode === 'system') apply(); });
  }

  /* ---------- floating control ---------- */
  function mount() {
    if (document.getElementById('themeBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'themeBtn'; btn.className = 'theme-btn'; btn.title = 'Theme settings (T toggles dark mode)';
    btn.innerHTML = `<span class="tsw"></span><span class="tlabel">Theme</span>`;

    const panel = document.createElement('div');
    panel.id = 'themePanel'; panel.className = 'theme-panel';
    panel.innerHTML = `
      <div class="tp-head"><b>Theme</b>
        <button class="tp-x" id="tpClose" aria-label="Close">✕</button></div>
      <div class="tp-body">
        <div class="tp-label">Appearance</div>
        <div class="tp-seg" id="tpMode">
          ${[['light', '☀️ Light'], ['dark', '🌙 Dark'], ['system', '🖥️ System']]
            .map(([v, l]) => `<button data-mode="${v}">${l}</button>`).join('')}
        </div>

        <div class="tp-label">Preset palettes</div>
        <div class="tp-presets" id="tpPresets">
          ${PRESETS.map(p => `<button data-preset="${p.id}" title="${p.name}">
            <span class="dots"><i style="background:${p.primary}"></i><i style="background:${p.secondary}"></i><i style="background:${p.accent}"></i></span>
            <span class="pname">${p.name}</span></button>`).join('')}
        </div>

        <div class="tp-label">Brand colours</div>
        ${[['primary', 'Primary', 'Buttons, links, active states'],
           ['secondary', 'Secondary', 'Services accent, success paths'],
           ['accent', 'Accent', 'Deals, badges, CTAs']]
          .map(([k, l, d]) => `<div class="tp-color">
            <input type="color" data-c="${k}" id="tc-${k}">
            <span class="col"><b>${l}</b><small>${d}</small></span>
            <input class="tp-hex" data-hex="${k}" spellcheck="false" maxlength="7">
          </div>`).join('')}

        <div class="tp-label">Corner style</div>
        <div class="tp-seg" id="tpRadius">
          ${[['sharp', 'Sharp'], ['default', 'Default'], ['round', 'Round']]
            .map(([v, l]) => `<button data-radius="${v}">${l}</button>`).join('')}
        </div>

        <div class="tp-note">Tokens regenerate live — every screen, chart, badge and shadow
          follows these three colours. Tip: press <b>T</b> to flip dark mode.</div>
        <button class="tp-reset" id="tpReset">Reset to Bazaar default</button>
      </div>`;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    const sync = () => {
      btn.querySelector('.tsw').style.background =
        `linear-gradient(135deg, ${state.primary} 45%, ${state.accent} 45%)`;
      panel.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === state.mode));
      panel.querySelectorAll('[data-radius]').forEach(b => b.classList.toggle('on', b.dataset.radius === state.radius));
      panel.querySelectorAll('[data-preset]').forEach(b => {
        const p = PRESETS.find(x => x.id === b.dataset.preset);
        b.classList.toggle('on', p.primary.toLowerCase() === state.primary.toLowerCase()
          && p.accent.toLowerCase() === state.accent.toLowerCase());
      });
      ['primary', 'secondary', 'accent'].forEach(k => {
        const c = panel.querySelector(`[data-c="${k}"]`), h = panel.querySelector(`[data-hex="${k}"]`);
        if (c) c.value = state[k];
        if (h && document.activeElement !== h) h.value = state[k].toUpperCase();
      });
    };
    global.__themePanelSync = sync;

    btn.onclick = () => { panel.classList.toggle('open'); sync(); };
    panel.querySelector('#tpClose').onclick = () => panel.classList.remove('open');
    panel.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => Theme.set({ mode: b.dataset.mode }));
    panel.querySelectorAll('[data-radius]').forEach(b => b.onclick = () => Theme.set({ radius: b.dataset.radius }));
    panel.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
      const p = PRESETS.find(x => x.id === b.dataset.preset);
      Theme.set({ primary: p.primary, secondary: p.secondary, accent: p.accent });
    });
    panel.querySelectorAll('[data-c]').forEach(i => i.oninput = () => Theme.set({ [i.dataset.c]: i.value }));
    panel.querySelectorAll('[data-hex]').forEach(i => i.onchange = () => {
      const v = i.value.trim().replace(/^#?/, '#');
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) Theme.set({ [i.dataset.hex]: v });
      else { i.value = state[i.dataset.hex].toUpperCase(); }
    });
    panel.querySelector('#tpReset').onclick = () => Theme.reset();

    document.addEventListener('click', e => {
      if (!panel.contains(e.target) && !btn.contains(e.target)) panel.classList.remove('open');
    });
    document.addEventListener('keydown', e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''));
      if (!typing && (e.key === 't' || e.key === 'T')) Theme.toggle();
    });
    sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})(window);
