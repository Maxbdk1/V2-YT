// =============================================================
// Persistent dashboard top bar.
// Drop this on any page with:
//     <script src="topbar.js" defer></script>
// It self-injects HTML + CSS, reads progress from the same
// localStorage keys the dashboard's tabs already use, and a
// water "+1" button writes to localStorage and (if configured)
// pushes a merged update to the Supabase health row so the
// new bottle appears on every device within ~1 second.
// =============================================================
(function () {
  'use strict';

  // -------- Supabase config (same project as the rest of the dashboard) --------
  // For your audience's standalone, replace these with placeholders
  // and have them paste their own values, just like the other pages.
  // Prefer Vercel env vars (served via /api/config → window.DASH_*),
  // otherwise fall back to these defaults.
  const TOPBAR_SUPABASE_URL = (window.DASH_SUPABASE_URL) || 'https://srajryooffirbroltjmg.supabase.co';
  const TOPBAR_SUPABASE_KEY = (window.DASH_SUPABASE_KEY) || 'sb_publishable_5142ZwTLF_DkSVRzciNuRA_bHwRAu4c';

  // -------- CSS --------
  const css = `
.topbar {
  position: sticky; top: 0; z-index: 40;
  display: flex; justify-content: flex-end; align-items: center;
  gap: 8px;
  padding: max(10px, env(safe-area-inset-top)) 14px 8px;
  background: #0a0a0b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
}
.topbar-water-wrap {
  display: flex; align-items: stretch;
}
.topbar-water-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 14px;
  background: rgba(125, 211, 252, 0.08);
  border: 1px solid rgba(125, 211, 252, 0.16);
  border-right: none;
  border-radius: 12px 0 0 12px;
  text-decoration: none;
  color: #FAFAFA;
  -webkit-tap-highlight-color: transparent;
}
.topbar-water-pill .topbar-pill-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #7DD3FC; flex-shrink: 0;
}
.topbar-water-pill.warn .topbar-pill-dot { background: #fbbf24; }
.topbar-water-pill.miss .topbar-pill-dot {
  background: #ff8a8a;
  animation: topbar-miss-pulse 1.6s ease-in-out infinite;
}
@keyframes topbar-miss-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
  50%      { box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
}
.topbar-pill-count {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px; font-weight: 700;
  color: #FAFAFA;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.topbar-water-add {
  width: 44px;
  border: 1px solid rgba(125, 211, 252, 0.16);
  background: linear-gradient(180deg, rgba(125, 211, 252, 0.28), rgba(110, 231, 183, 0.28));
  color: #FFFFFF;
  font-family: inherit; font-size: 20px; font-weight: 700; line-height: 1;
  cursor: pointer;
  border-radius: 0 12px 12px 0;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, transform 0.10s;
}
.topbar-water-add:active { transform: scale(0.94); }
.topbar-water-add.flash {
  background: linear-gradient(180deg, rgba(125, 211, 252, 0.7), rgba(110, 231, 183, 0.7));
}
.topbar-finance-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.topbar-finance-btn:hover { background: rgba(255, 255, 255, 0.08); }
.topbar-finance-icon {
  font-size: 20px; line-height: 1;
  filter: grayscale(100%) brightness(1.4);
  opacity: 0.85;
}

/* Nova — global floating mentor button, docked under the finance button */
.novaFab {
  position: fixed; top: 64px; right: 14px; z-index: 41;
  width: 44px; height: 44px; border-radius: 50%; border: 0; cursor: pointer; padding: 0;
  overflow: hidden; -webkit-tap-highlight-color: transparent; transition: transform 0.12s;
  background: radial-gradient(circle at 50% 58%, #8A6CFF, #4C2EC9 80%);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.14), 0 6px 22px rgba(124,92,255,0.55),
              inset 0 -6px 14px rgba(38,10,86,0.65);
}
.novaFab:active { transform: scale(0.93); }
.novaFab::before {
  content: ''; position: absolute; inset: -28%; border-radius: 50%;
  background: conic-gradient(from 0deg, #6D4AE0, #C9B8FF, #7C5CFF, #B98AFF, #8A6CFF, #6D4AE0);
  filter: blur(2px); opacity: 0.92; animation: novaspin 7s linear infinite;
}
.novaFab::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle at 34% 26%, rgba(255,255,255,0.92), rgba(255,255,255,0) 40%),
              radial-gradient(circle at 72% 82%, rgba(18,7,40,0.5), transparent 55%);
}
@keyframes novaspin { to { transform: rotate(360deg); } }
.novaFab .nv2-online { position: absolute; right: 1px; bottom: 1px; z-index: 2; width: 11px; height: 11px; border-radius: 50%; background: #6ee7b7; border: 2px solid #0a0a0b; box-shadow: 0 0 6px rgba(110,231,183,0.7); }
.novaPanel {
  position: fixed; top: 112px; right: 14px; z-index: 41;
  width: min(340px, calc(100vw - 28px)); max-height: 66vh; display: none; flex-direction: column;
  background: #111016; border: 1px solid rgba(255,255,255,0.10); border-radius: 18px;
  box-shadow: 0 24px 70px rgba(0,0,0,0.65); overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
}
.novaPanel.open { display: flex; }
.nv2-head { display: flex; align-items: center; gap: 9px; padding: 13px 14px; border-bottom: 1px solid rgba(255,255,255,0.07); }
.nv2-head .nv2-av { position: relative; overflow: hidden; width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: radial-gradient(circle at 34% 26%, rgba(255,255,255,0.85), rgba(255,255,255,0) 42%),
             conic-gradient(from 0deg, #6D4AE0, #C9B8FF, #7C5CFF, #B98AFF, #6D4AE0); }
.nv2-head .nv2-name { font-size: 14px; font-weight: 700; color: #FAFAFA; }
.nv2-head .nv2-sub { font-size: 10.5px; color: #76746E; }
.nv2-head .nv2-x { margin-left: auto; border: 0; background: transparent; color: #76746E; font-size: 20px; cursor: pointer; line-height: 1; }
.nv2-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.nv2-msg { font-size: 13px; line-height: 1.5; max-width: 90%; padding: 9px 12px; border-radius: 13px; }
.nv2-msg.coach { background: rgba(255,255,255,0.05); color: #E9E7E2; align-self: flex-start; border-bottom-left-radius: 4px; }
.nv2-msg.user { background: rgba(124,92,255,0.22); color: #FAFAFA; align-self: flex-end; border-bottom-right-radius: 4px; }
.nv2-msg b { color: #FAFAFA; } .nv2-msg ul { margin: 4px 0; padding-left: 18px; } .nv2-msg li { margin: 2px 0; }
.nv2-quick { display: flex; gap: 6px; flex-wrap: wrap; padding: 0 14px 10px; }
.nv2-chip { border: 1px solid rgba(124,92,255,0.35); background: rgba(124,92,255,0.12); color: #CBBDFF; font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 999px; cursor: pointer; }
.nv2-chip:active { transform: scale(0.96); }
.nv2-foot { display: flex; gap: 7px; padding: 11px 12px; border-top: 1px solid rgba(255,255,255,0.07); }
.nv2-input { flex: 1; min-width: 0; padding: 9px 12px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.10); background: rgba(0,0,0,0.32); color: #FAFAFA; font-family: inherit; font-size: 13px; outline: none; }
.nv2-input::placeholder { color: #6c6a64; }
.nv2-send { border: 0; border-radius: 11px; padding: 0 14px; background: linear-gradient(180deg,#C9B8FF,#7C5CFF); color: #14081f; font-weight: 700; font-size: 15px; cursor: pointer; }
.nv2-dots i { display:inline-block; width:5px; height:5px; margin:0 1px; border-radius:50%; background:#9b8aff; animation: nv2b 1s infinite; }
.nv2-dots i:nth-child(2){animation-delay:.15s} .nv2-dots i:nth-child(3){animation-delay:.3s}
@keyframes nv2b { 0%,100%{opacity:.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-3px)} }
@media (max-width: 480px) {
  .novaFab { top: 58px; right: 10px; width: 40px; height: 40px; }
  .novaPanel { top: 102px; right: 10px; }
}

/* Bottom tab bar — Instagram-style */
.bottombar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 40;
  display: flex; justify-content: space-around; align-items: stretch;
  padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
  background: #0a0a0b;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
}
.bottombar-tab {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px;
  padding: 6px 0 4px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.45);
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.04em;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s;
}
.bottombar-tab-icon {
  font-size: 24px; line-height: 1;
  filter: grayscale(100%) brightness(1.2);
  opacity: 0.55;
  transition: opacity 0.15s, filter 0.15s, transform 0.10s;
}
.bottombar-tab.active {
  color: #FAFAFA;
}
.bottombar-tab.active .bottombar-tab-icon {
  filter: grayscale(100%) brightness(1.6);
  opacity: 1;
}
.bottombar-tab:active .bottombar-tab-icon { transform: scale(0.92); }

/* Push page content above the fixed bottom bar */
body.has-bottombar {
  padding-bottom: calc(72px + env(safe-area-inset-bottom)) !important;
}

@media (max-width: 480px) {
  .topbar { padding-left: 10px; padding-right: 10px; gap: 6px; }
  .topbar-water-pill { padding: 8px 11px; gap: 6px; }
  .topbar-pill-count { font-size: 12px; }
  .topbar-water-add { width: 40px; font-size: 18px; }
  .topbar-finance-btn { width: 40px; height: 38px; }
  .topbar-finance-icon { font-size: 18px; }
  .bottombar-tab-icon { font-size: 22px; }
  .bottombar-tab { font-size: 10px; }
}

/* === Global mobile lockdown ===
   1) Hide the right-side scrollbar on phones (iOS uses overlay scrollbars anyway).
   2) Stop iOS auto-text-size-adjust.
   3) touch-action: pan-y prevents pinch-zoom while still allowing vertical scroll.
   4) overscroll-behavior on every common modal class stops scroll chaining —
      scrolling inside a settings popup won't drag the page behind it.
   5) When body has .topbar-modal-open, the page can't scroll at all (locked).
*/
html, body {
  -webkit-text-size-adjust: 100%;
}
@media (max-width: 768px) {
  html { touch-action: pan-y; }
  ::-webkit-scrollbar { width: 0; height: 0; display: none; }
  html, body { scrollbar-width: none; -ms-overflow-style: none; }
}
.modal-bg, .modal, .po-modal-bg, .po-modal, .wt-overlay, .wt-viewer {
  overscroll-behavior: contain;
}
body.topbar-modal-open {
  overflow: hidden;
  touch-action: none;
}
/* On phones, blow the modals up to full screen and let them be the only
   scrolling element. Way less "is this scrolling the page or the modal?"
   confusion. */
@media (max-width: 480px) {
  .modal-bg, .po-modal-bg {
    padding: 0 !important;
    align-items: stretch !important;
    justify-content: stretch !important;
  }
  .modal, .po-modal {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 100vh !important;
    height: 100vh !important;
    border-radius: 0 !important;
    padding-top: max(20px, env(safe-area-inset-top)) !important;
    padding-bottom: max(28px, env(safe-area-inset-bottom)) !important;
    overflow-y: auto !important;
    overscroll-behavior: contain;
  }
}
`;

  // -------- HTML --------
  const topbarHtml = `
<header class="topbar" id="topbar" role="navigation" aria-label="Quick actions">
  <div class="topbar-water-wrap">
    <a href="health.html#water" class="topbar-water-pill" id="topbarWater" aria-label="Water progress">
      <span class="topbar-pill-dot"></span>
      <span class="topbar-pill-count" id="topbarWaterCount">0/0</span>
    </a>
    <button class="topbar-water-add" id="topbarWaterAdd" aria-label="Log one drink" type="button">+</button>
  </div>
  <a href="finance.html" class="topbar-finance-btn" id="topbarFinance" aria-label="Finance">
    <span class="topbar-finance-icon">📊</span>
  </a>
</header>
`;

  const bottombarHtml = `
<nav class="bottombar" id="bottombar" role="navigation" aria-label="Main tabs">
  <a href="index.html" class="bottombar-tab" data-page="main">
    <span class="bottombar-tab-icon">🏠</span>
    <span>Main</span>
  </a>
  <a href="health.html" class="bottombar-tab" data-page="health">
    <span class="bottombar-tab-icon">💊</span>
    <span>Health</span>
  </a>
  <a href="gym.html" class="bottombar-tab" data-page="fitness">
    <span class="bottombar-tab-icon">💪</span>
    <span>Fitness</span>
  </a>
</nav>
`;

  const novaHtml = `
<button class="novaFab" id="novaFab" type="button" aria-label="Open Nova"><span class="nv2-online"></span></button>
<div class="novaPanel" id="novaPanel" role="dialog" aria-label="Nova">
  <div class="nv2-head">
    <div class="nv2-av"></div>
    <div><div class="nv2-name">Nova</div><div class="nv2-sub">your dashboard mentor</div></div>
    <button class="nv2-x" id="novaClose" type="button" aria-label="Close">×</button>
  </div>
  <div class="nv2-body" id="novaBody"></div>
  <div class="nv2-quick">
    <button class="nv2-chip" data-q="Give me an overview of how everything is going across my dashboard and what to focus on next.">📊 Overview</button>
    <button class="nv2-chip" data-q="What should I focus on today?">🎯 Today</button>
  </div>
  <div class="nv2-foot">
    <input class="nv2-input" id="novaInput" type="text" placeholder="Ask Nova…" autocomplete="off">
    <button class="nv2-send" id="novaSend" type="button">↑</button>
  </div>
</div>
`;

  // Pages where we suppress the app chrome: finance has its own internal
  // 4-tab bottom nav and self-contained back button.
  function isFinancePage() {
    const p = (window.location.pathname || '').toLowerCase();
    return p.endsWith('/finance.html') || p.endsWith('finance.html');
  }
  // When the water tracker is iframed inside health.html, the embedded
  // page shouldn't render its own chrome again.
  function isEmbedded() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }
  function shouldShowChrome() {
    return !isFinancePage() && !isEmbedded();
  }
  // Pages that already have their own dedicated Nova integration — don't
  // double up with the global floating button.
  function hasOwnNovaWidget() {
    const p = (window.location.pathname || '').toLowerCase();
    return p.endsWith('/gym.html') || p.endsWith('gym.html') ||
           p.endsWith('/nova-lite.html') || p.endsWith('nova-lite.html');
  }
  function shouldShowNova() {
    return shouldShowChrome() && !hasOwnNovaWidget();
  }
  function currentPageKey() {
    const p = (window.location.pathname || '').toLowerCase();
    if (p.endsWith('health.html')) return 'health';
    if (p.endsWith('gym.html')) return 'fitness';
    return 'main'; // index.html, /, or anything else falls back to main
  }

  function injectStyleAndHTML() {
    if (document.getElementById('topbar') || document.getElementById('bottombar')) return;
    if (!shouldShowChrome()) return;

    const style = document.createElement('style');
    style.id = 'topbar-style';
    style.textContent = css;
    document.head.appendChild(style);

    const topWrap = document.createElement('div');
    topWrap.innerHTML = topbarHtml.trim();
    document.body.insertBefore(topWrap.firstChild, document.body.firstChild);

    const bottomWrap = document.createElement('div');
    bottomWrap.innerHTML = bottombarHtml.trim();
    document.body.appendChild(bottomWrap.firstChild);

    if (shouldShowNova()) {
      const novaWrap = document.createElement('div');
      novaWrap.id = 'novaWrap';
      novaWrap.innerHTML = novaHtml.trim();
      document.body.appendChild(novaWrap);
    }

    // Highlight the active bottom tab.
    const active = currentPageKey();
    document.querySelectorAll('.bottombar-tab').forEach((t) => {
      t.classList.toggle('active', t.getAttribute('data-page') === active);
    });

    // Reserve room above the fixed bottom bar so page content can scroll
    // past it without being hidden.
    document.body.classList.add('has-bottombar');
  }

  // -------- Active-date helpers (match the goals page 6 AM rollover) --------
  function activeDateKey() {
    const now = new Date();
    const d = new Date(now);
    if (now.getHours() < 6) d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function calendarDateKey() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // -------- Read progress from localStorage --------
  function getGoalsProgress() {
    const key = 'goals:' + activeDateKey();
    let goals = [];
    try { goals = JSON.parse(localStorage.getItem(key)) || []; } catch (e) {}
    const total = Array.isArray(goals) ? goals.length : 0;
    const done = total ? goals.filter(g => g && g.done).length : 0;
    return { done, total };
  }

  function getStackProgress() {
    let items = [];
    try { items = JSON.parse(localStorage.getItem('stack:items')) || []; } catch (e) {}
    let taken = {};
    try { taken = JSON.parse(localStorage.getItem('stack:taken:' + activeDateKey())) || {}; } catch (e) {}
    const total = Array.isArray(items) ? items.length : 0;
    const done = total ? items.filter(i => i && taken[i.id]).length : 0;
    return { done, total };
  }

  function getWaterProgress() {
    let state = null;
    try { state = JSON.parse(localStorage.getItem('po_water_v1')); } catch (e) {}
    if (!state) return { done: 0, total: 0 };
    const todayKey = calendarDateKey();
    const done = (state.logs || {})[todayKey] || 0;
    const p = state.profile || { weightKg: 75 };
    const wKg = state.weightUnit === 'lb' ? (p.weightKg || 0) / 2.20462 : (p.weightKg || 0);
    const base = wKg * 35;
    const exercise = (p.activityHrsPerWeek || 0) / 7 * 500;
    const caffeine = Math.max(0, (state.caffeineMgPerDay || 0) - 200) * 1.5;
    const subs = (state.substances || []).reduce((s, x) => {
      const dose = (x && x.dose != null ? x.dose : (x && x.defaultDose)) || 0;
      return s + Math.max(0, dose * ((x && x.mlPerUnit) || 0));
    }, 0);
    let adjust = 0;
    if (p.sex === 'm') adjust += 200;
    if ((p.age || 0) >= 50) adjust += 100;
    const totalMl = base + exercise + caffeine + subs + adjust;
    let unitVol;
    if (state.unit === 'glass') unitVol = state.glassMl || 250;
    else if (state.unit === 'oz') unitVol = 30;
    else if (state.unit === 'ml') unitVol = 1;
    else unitVol = state.bottleMl || 500;
    const total = Math.max(1, Math.ceil(totalMl / unitVol));
    return { done, total };
  }

  function classifyStatus(done, total) {
    if (total === 0) return 'idle';
    if (done >= total) return 'good';
    if (done >= total * 0.5) return 'warn';
    // Past 6pm and still under half → flag as missed
    const h = new Date().getHours();
    if (h >= 18 && done < total * 0.5) return 'miss';
    return 'warn';
  }

  function setPillStatus(pillEl, status) {
    pillEl.classList.remove('good', 'warn', 'miss');
    if (status === 'warn' || status === 'miss') pillEl.classList.add(status);
  }

  function render() {
    const waterEl = document.getElementById('topbarWater');
    if (!waterEl) return; // not injected yet

    const w = getWaterProgress();
    const countEl = document.getElementById('topbarWaterCount');
    if (countEl) countEl.textContent = w.total ? w.done + '/' + w.total : '0/0';
    setPillStatus(waterEl, classifyStatus(w.done, w.total));
  }

  // -------- Water +1 (works from any page) --------
  function defaultWaterState() {
    return {
      unit: 'bottle', bottleMl: 500, glassMl: 250, weightUnit: 'kg',
      profile: { weightKg: 75, age: 25, sex: 'm', activityHrsPerWeek: 5 },
      caffeineMgPerDay: 200, substances: [], logs: {}
    };
  }

  async function pushWaterMergedToSupabase(localWater) {
    // Only do this when we're NOT on the health page — health page
    // has its own sync that already detects the localStorage change.
    if (window.location.pathname.endsWith('/health.html') ||
        window.location.pathname.endsWith('health.html')) return;

    if (!window.supabase || !TOPBAR_SUPABASE_URL || !TOPBAR_SUPABASE_KEY) return;
    if (TOPBAR_SUPABASE_URL.indexOf('PASTE-') === 0) return;

    try {
      const supa = window.supabase.createClient(TOPBAR_SUPABASE_URL, TOPBAR_SUPABASE_KEY);
      const { data } = await supa
        .from('app_state').select('data').eq('key', 'health').maybeSingle();
      const current = (data && data.data) || {};
      const merged = Object.assign({}, current, { po_water_v1: localWater });
      await supa.from('app_state').upsert(
        { key: 'health', data: merged, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    } catch (e) { /* offline — local change will sync next time user visits health */ }
  }

  function addWater() {
    let state = null;
    try { state = JSON.parse(localStorage.getItem('po_water_v1')); } catch (e) {}
    if (!state || typeof state !== 'object') state = defaultWaterState();
    state.logs = state.logs || {};
    const k = calendarDateKey();
    state.logs[k] = (state.logs[k] || 0) + 1;
    try { localStorage.setItem('po_water_v1', JSON.stringify(state)); } catch (e) {}
    render();

    const btn = document.getElementById('topbarWaterAdd');
    if (btn) {
      btn.classList.add('flash');
      setTimeout(() => btn.classList.remove('flash'), 220);
    }

    pushWaterMergedToSupabase(state);
  }

  // -------- Mobile lockdown helpers --------
  // Belt-and-suspenders zoom prevention — iOS Safari sometimes ignores
  // user-scalable=no, so we also kill the gesture events directly.
  function blockGesture(e) { e.preventDefault(); }
  function lockGestures() {
    document.addEventListener('gesturestart', blockGesture, { passive: false });
    document.addEventListener('gesturechange', blockGesture, { passive: false });
    document.addEventListener('gestureend', blockGesture, { passive: false });
    // Also kill the iOS double-tap-to-zoom on any tap.
    let lastTouch = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouch <= 300) e.preventDefault();
      lastTouch = now;
    }, { passive: false });
  }

  // Watch every known modal-bg / overlay class — when any one of them
  // gets `.show` or `.is-open`, lock the body scroll. When the last
  // one closes, unlock.
  function startModalLock() {
    const MODAL_SELECTORS = [
      '.modal-bg', '.po-modal-bg', '.wt-overlay', '.wt-viewer', '.wt-cam'
    ];
    function anyOpen() {
      for (const sel of MODAL_SELECTORS) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          if (el.classList.contains('show') || el.classList.contains('is-open')) {
            return true;
          }
        }
      }
      return false;
    }
    function sync() {
      document.body.classList.toggle('topbar-modal-open', anyOpen());
    }
    const observer = new MutationObserver(sync);
    // Observe class changes anywhere in body — modal toggles are rare so
    // a global subtree observer is cheap.
    observer.observe(document.body, {
      attributes: true, attributeFilter: ['class'], subtree: true
    });
    sync();
  }

  // -------- Nova — global floating mentor (bring-your-own Anthropic key) --------
  function wireNova() {
    const fab = document.getElementById('novaFab');
    if (!fab) return; // not injected on this page
    const panel = document.getElementById('novaPanel');
    const body = document.getElementById('novaBody');
    const input = document.getElementById('novaInput');
    const closeBtn = document.getElementById('novaClose');
    const sendBtn = document.getElementById('novaSend');
    const KEY_LS = 'nova_lite_api_key';
    let busy = false, greeted = false;

    function savedKey() { try { return localStorage.getItem(KEY_LS) || ''; } catch (e) { return ''; } }
    function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
    function md(t) {
      let h = esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
      const lines = h.split('\n'); let out = '', inUl = false;
      for (const ln of lines) {
        if (/^\s*[-*]\s+/.test(ln)) { if (!inUl) { out += '<ul>'; inUl = true; } out += '<li>' + ln.replace(/^\s*[-*]\s+/, '') + '</li>'; }
        else { if (inUl) { out += '</ul>'; inUl = false; } out += ln.trim() ? '<div>' + ln + '</div>' : ''; }
      }
      if (inUl) out += '</ul>';
      return out;
    }
    function addMsg(role, html) {
      const e = document.createElement('div');
      e.className = 'nv2-msg ' + role;
      e.innerHTML = html;
      body.appendChild(e);
      body.scrollTop = body.scrollHeight;
      return e;
    }
    function dashboardData() {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k === KEY_LS) continue; // never send the key itself as data
        try { out[k] = JSON.parse(localStorage.getItem(k)); } catch (e) { out[k] = localStorage.getItem(k); }
      }
      return out;
    }
    const SYS = "You are Nova, a personal mentor living inside the user's life-tracking dashboard. " +
      "You can see their saved data across every tab (goals, gym, water, finance, calories, ironman training, business, personality, face/skincare, etc.). " +
      "Give honest, specific, encouraging guidance. Answer in short markdown-style bullets starting with '- ', few words each, plain language. " +
      "Wrap key words and numbers in **double asterisks**. End with one '- Do today:' bullet giving a single concrete action. " +
      "Dashboard data as JSON:\n";

    function openPanel() {
      panel.classList.add('open');
      if (!greeted) {
        greeted = true;
        addMsg('coach', md("Hey — I'm Nova. I can see your whole dashboard. Ask me anything, or tap a quick prompt below."));
      }
      setTimeout(() => input.focus(), 50);
    }
    function closePanel() { panel.classList.remove('open'); }
    fab.addEventListener('click', () => { panel.classList.contains('open') ? closePanel() : openPanel(); });
    closeBtn.addEventListener('click', closePanel);

    async function ask(text) {
      text = (text || '').trim();
      if (!text || busy) return;
      const key = savedKey();
      addMsg('user', md(text));
      input.value = '';
      if (!key) { addMsg('coach', md('- Paste your **Anthropic API key** on the Nova page first (the 🧠 tile on Main) — it\'s saved in this browser and I\'ll use it here too.')); return; }
      busy = true;
      const loading = addMsg('coach', '<span class="nv2-dots"><i></i><i></i><i></i></span>');
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-opus-4-8',
            max_tokens: 1024,
            system: SYS + JSON.stringify(dashboardData()),
            messages: [{ role: 'user', content: text }],
          }),
        });
        const json = await res.json();
        if (json.error) { loading.innerHTML = md('- ' + (json.error.message || 'Something went wrong — check your API key.')); busy = false; return; }
        const reply = (json.content && json.content[0] && json.content[0].text) || 'Hmm, no reply.';
        loading.innerHTML = md(reply);
      } catch (e) {
        loading.innerHTML = md('- Could not reach Anthropic (' + (e && e.message ? e.message : 'unknown error') + ') — check your connection and key.');
      }
      busy = false;
    }

    sendBtn.addEventListener('click', () => ask(input.value));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ask(input.value); });
    document.querySelectorAll('.nv2-chip').forEach((chip) => {
      chip.addEventListener('click', () => { openPanel(); ask(chip.dataset.q); });
    });
  }

  // Pin the Nova button just under the topbar's real rendered height
  // (varies by device safe-area-inset-top) instead of a hardcoded px value,
  // so it never overlaps or gets clipped by the topbar above it.
  function positionNova() {
    const topbarEl = document.getElementById('topbar');
    const fab = document.getElementById('novaFab');
    if (!topbarEl || !fab) return;
    const panel = document.getElementById('novaPanel');
    const fabTop = Math.round(topbarEl.getBoundingClientRect().bottom + 10);
    fab.style.top = fabTop + 'px';
    if (panel) panel.style.top = (fabTop + fab.offsetHeight + 8) + 'px';
  }

  // -------- Boot --------
  function boot() {
    injectStyleAndHTML();
    wireNova();
    positionNova();
    window.addEventListener('resize', positionNova);
    window.addEventListener('orientationchange', positionNova);
    const btn = document.getElementById('topbarWaterAdd');
    if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); addWater(); });
    render();
    lockGestures();
    startModalLock();

    // Re-render when localStorage changes from another tab/window OR when
    // the page becomes visible (sync may have pulled in the background).
    window.addEventListener('storage', render);
    window.addEventListener('focus', render);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

    // Periodic refresh so counts stay current after midnight rollover etc.
    setInterval(render, 30 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
