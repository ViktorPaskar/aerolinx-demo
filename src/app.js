import * as THREE from 'three';
import { makeStudioEnv } from './kit.js';
import { buildEngine, sampleCam, FOV } from './engine.js';
import { createGlobe } from './globe.js';
import { PARTS, FLEET, CATS, CITIES, T } from './data.js';
import poster from '../assets/poster.webp';

const AED_PER_USD = 3.6725;
const $ = id => document.getElementById(id);
const S = { lang: location.hash === '#ar' ? 'ar' : 'en', cur: 'AED', fleet: '', cat: '', quote: {}, sent: null };
const t = k => T[S.lang][k];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = aed => S.cur === 'USD' ? '$' + Math.round(aed / AED_PER_USD).toLocaleString('en-US') : t('aedF')(Math.round(aed).toLocaleString('en-US'));
const byPn = pn => PARTS.find(p => p.pn === pn);
const fleetName = f => f === 'A320' ? t('A320') : f;
const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Rendering of the page text ---------- */
function renderStatic() {
  const html = document.documentElement;
  html.lang = S.lang; html.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  $('palInput').placeholder = t('palPh');
  $('langBtn').textContent = t('langBtn');
  $('curBtn').textContent = S.cur;
  $('curBtn').setAttribute('aria-label', S.cur === 'AED' ? 'Show prices in US dollars' : 'Show prices in dirhams');
  renderChapters(); renderSegs(); renderTiles(); renderGrid(); renderAog(); renderBento(); renderTrace(); renderClock(); renderCount();
  if ($('drawer').open) renderDrawer();
  if ($('palette').open) renderPalette();
  observeReveals();
}

function renderClock() {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit' }).format(new Date());
  $('clock').textContent = t('clock')(time);
}

function renderChapters() {
  const ch = t('chapters');
  $('chapters').innerHTML = ch.map((c, i) => `<div class="chapter" data-i="${i}">
    <div class="bar">${ch.map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</div>
    <h3>${c.t}</h3><p>${c.d}</p>
    <ul>${c.i.map(x => `<li>${x}</li>`).join('')}</ul>
    <button class="solid jump" type="button" data-shop="engine">${t('jump')}</button>
  </div>`).join('');
  $('hotspots').innerHTML = ch.map(c => `<div class="hs" data-k="${c.k}"><button type="button" data-chapter="${c.k}">${c.t}</button><i></i></div>`).join('');
}

function setSeg(el, items, value, attr) {
  el.innerHTML = '<span class="thumb"></span>' + items.map(([v, l]) => `<button type="button" data-${attr}="${v}" aria-pressed="${v === value}">${l}</button>`).join('');
  moveThumb(el, true);
}
function moveThumb(el, instant) {
  const th = el.querySelector('.thumb'), b = el.querySelector('[aria-pressed=true]');
  if (!th || !b) return;
  if (instant) th.style.transition = 'none';
  th.style.width = b.offsetWidth + 'px'; th.style.transform = `translateX(${b.offsetLeft}px)`;
  if (instant) { void th.offsetWidth; th.style.transition = ''; }
  else if (el.scrollWidth > el.clientWidth) {
    el.scrollTo({ left: b.offsetLeft - (el.clientWidth - b.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  }
}
function pressSeg(el, attr, value) {
  el.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-' + attr) === value)));
  moveThumb(el);
}
function syncFilters() {
  pressSeg($('fleetSeg'), 'fleet', S.fleet); pressSeg($('catSeg'), 'cat', S.cat);
  renderGrid(); renderTiles();
}
function shop(cat) {
  S.cat = cat; S.fleet = ''; syncFilters();
  $('filters').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}
function renderTiles() {
  const pics = { gear: 'SB-4471-02', engine: 'SM-9014', avionics: 'DU-8810-6', systems: 'BV-3290' };
  $('tiles').innerHTML = CATS.map(c => {
    return `<button class="ctile" type="button" data-shop="${c}" aria-pressed="${S.cat === c}">
      <span class="ct-tx"><strong>${t(c)}</strong><span>${t('catD')[c]}</span><em>${t('view')}</em></span>
      <img src="${byPn(pics[c]).img}" alt="">
    </button>`;
  }).join('');
}
function renderSegs() {
  setSeg($('fleetSeg'), [['', t('allA')], ...FLEET.map(f => [f, fleetName(f)])], S.fleet, 'fleet');
  setSeg($('catSeg'), [['', t('allC')], ...CATS.map(c => [c, t(c)])], S.cat, 'cat');
}

const WIDE = new Set(['SB-4471-02', 'FB-7728-11', 'TR-46172', 'TB-1140-7']);
const visible = () => PARTS.filter(p => (!S.fleet || p.fits.includes(S.fleet)) && (!S.cat || p.cat === S.cat));

function buyLabel(inq) { return (inq ? '<svg width="16" height="16" aria-hidden="true"><use href="#i-check"/></svg>' : '') + `<span>${inq ? t('inq') : t('add')}</span>`; }
function card(p) {
  const inq = !!S.quote[p.pn];
  return `<article class="card${WIDE.has(p.pn) ? ' wide' : ''}" data-card="${p.pn}">
    <div class="card-top"><span class="cond ${p.c}"><i></i>${t(p.c)}</span><span>${t('from')} ${p.from}</span></div>
    <div class="pic"><img src="${p.img}" alt="${esc(p[S.lang])}" decoding="async"></div>
    <div class="card-b">
      <div class="pn" dir="ltr" style="text-align:start">${p.pn}</div>
      <h3>${p[S.lang]}</h3>
      <p class="fits">${t('fits')} <bdi>${p.fits.map(fleetName).join(', ')}</bdi>. ${p.qty} ${t('inStock')}. <bdi>${p.doc}</bdi></p>
      <div class="buy">
        <div class="price">${money(p.aed)}<small>${t('exVat')}</small></div>
        <button type="button" class="addbtn${inq ? ' in' : ''}" data-add="${p.pn}" aria-label="${esc((inq ? t('inq') : t('add')) + ' ' + p.pn)}" aria-pressed="${inq}">${buyLabel(inq)}</button>
      </div>
    </div>
  </article>`;
}
function renderGrid() {
  const v = visible(), filtered = S.fleet || S.cat;
  $('found').innerHTML = filtered ? `${esc(t('shown')(v.length))}<button type="button" id="resetBtn">${t('reset')}</button>` : '';
  const g = $('grid');
  g.classList.toggle('filtered', !!filtered);
  g.innerHTML = v.length ? v.map(card).join('') : `<div class="empty">${t('emptyF')}<br><button class="solid" type="button" id="resetBtn2">${t('reset')}</button></div>`;
}

function renderAog() {
  $('ticket').innerHTML = `<div class="tk-head"><div><strong>${t('tkTitle')}</strong><span>${t('tkSub')}</span></div><span class="tk-live"><i></i>${t('tkLive')}</span></div>` +
    t('tk').map(([a, b]) => `<div class="tk"><time dir="ltr">${a}</time><span class="dot"></span><span>${b}</span></div>`).join('');
  $('routes').innerHTML = `<h3>${t('routesT')}</h3><ul>${CITIES.slice(0, 6).map(c => `<li><span>${c[S.lang]}</span><span dir="ltr">${c.t}</span></li>`).join('')}</ul>`;
  animateTicket();
}
let tkTimer = 0;
function animateTicket() {
  clearInterval(tkTimer);
  const rows = [...$('ticket').querySelectorAll('.tk')];
  if (reduced) { rows.forEach(r => r.classList.add('on')); return; }
  let i = 0;
  const step = () => { rows.forEach((r, j) => r.classList.toggle('on', j <= i)); i = (i + 1) % (rows.length + 1); if (i === 0) i = 0; };
  step(); tkTimer = setInterval(step, 1500);
}

function renderBento() {
  const sub = 148500, vat = sub * .05;
  $('bento').innerHTML = `
  <article class="tile t-inv reveal"><h3>${t('invT')}</h3><p>${t('invD')}</p>
    <div class="viz"><div class="inv">
      <div class="inv-h"><span>${t('invNo')}</span><span dir="ltr">SB-4471-02</span></div>
      <div class="inv-r"><span>${t('invSub')}</span><span dir="ltr">${money(sub)}</span></div>
      <div class="inv-r"><span>${t('invVat')}</span><span dir="ltr">${money(vat)}</span></div>
      <div class="inv-r tot"><span>${t('invTotal')}</span><span dir="ltr">${money(sub + vat)}</span></div>
    </div></div></article>
  <article class="tile t-lang reveal"><h3>${t('langT')}</h3><p>${t('langD')}</p>
    <div class="viz bi" dir="ltr">
      <div><span>Tax invoice</span><span>فاتورة ضريبية</span></div>
      <div><span>Packing list</span><span>قائمة التعبئة</span></div>
      <div><span>Quotation</span><span>عرض سعر</span></div>
    </div></article>
  <article class="tile t-air reveal"><h3>${t('airT')}</h3><p>${t('airD')}</p>
    <div class="viz air">${t('airN').map(([a, b]) => `<div><strong dir="ltr">${a}</strong><span>${b}</span></div>`).join('')}</div></article>
  <article class="tile t-pay reveal"><h3>${t('payT')}</h3><p>${t('payD')}</p>
    <div class="viz chips">${t('pay').map(x => `<span>${x}</span>`).join('')}</div></article>
  <article class="tile t-zone reveal"><h3>${t('zoneT')}</h3><p>${t('zoneD')}</p>
    <ul class="viz zone">${t('zone').map(([a, b]) => `<li><span>${a}</span><span>${b}</span></li>`).join('')}</ul></article>`;
}

function renderTrace() {
  const f = t('certF'), v = t('certV');
  const cls = ['w3', 'w3', '', '', '', 'w6', 'w3', 'w3'];
  $('cert').innerHTML = `<header><strong>${t('certTitle')}</strong><span>${t('certNote')}</span></header>
    <div class="cf">${f.map((x, i) => `<div class="${cls[i]}">${x}<b>${v[i]}</b></div>`).join('')}</div>`;
  $('life').innerHTML = t('life').map(([a, b, c]) => `<li><time>${a}</time><div><strong>${b}</strong><span>${c}</span></div></li>`).join('');
}

function renderCount() {
  $('qCount').textContent = Object.values(S.quote).reduce((a, q) => a + q.qty, 0);
}

/* ---------- Quote drawer ---------- */
function quoteText() {
  return Object.entries(S.quote).map(([k, q]) => `${q.qty} x ${k}${byPn(k) ? ' (' + byPn(k).en + ')' : ''}`).join('\n');
}
function renderDrawer() {
  const body = $('dBody'), keys = Object.keys(S.quote);
  if (S.sent) {
    body.innerHTML = `<div class="sent"><h3>${t('sentT')}</h3><p>${t('sentB')}</p><div class="row"><button class="solid" type="button" data-close>${t('back')}</button><button class="alt" type="button" id="copyBtn">${t('copy')}</button></div></div>`;
    return;
  }
  if (!keys.length) { body.innerHTML = `<div class="blank">${t('emptyQ')}<br><button class="solid" type="button" data-close>${t('browse')}</button></div>`; return; }
  let sub = 0;
  const lines = keys.map(k => {
    const it = S.quote[k], p = byPn(k), amt = p ? p.aed * it.qty : 0; sub += amt;
    return `<div class="line">${p ? `<img src="${p.img}" alt="">` : '<span class="ph"></span>'}
      <div class="pnn" dir="ltr" style="text-align:start">${esc(k)}</div><div class="amt">${p ? money(amt) : t('por')}</div>
      <div class="nm">${p ? p[S.lang] : t('custom')}</div>
      <div class="qty"><button type="button" data-less="${esc(k)}" aria-label="${t('less')} ${esc(k)}">−</button><span>${it.qty}</span><button type="button" data-more="${esc(k)}" aria-label="${t('more')} ${esc(k)}">+</button></div></div>`;
  }).join('');
  const vat = sub * .05;
  body.innerHTML = lines + (sub ? `<dl class="sum"><dt>${t('subtotal')}</dt><dd>${money(sub)}</dd><dt>${t('vat')}</dt><dd>${money(vat)}</dd><dt class="big">${t('total')}</dt><dd class="big">${money(sub + vat)}</dd></dl><p class="note">${t('vatNote')}</p>` : '') +
    `<form class="dform" id="dForm"><label>${t('fCompany')}<input type="text" required autocomplete="organization"></label>
     <label>${t('fContact')}<input type="text" required></label>
     <label>${t('fTail')} (${t('opt')})<input type="text"></label>
     <label class="check"><input type="checkbox">${t('fAog')}</label>
     <button class="solid" type="submit">${t('send')}</button></form>`;
}
const openDrawer = () => { S.sent = null; renderDrawer(); closePalette(); $('drawer').showModal(); };

function addPart(pn) {
  if (!S.quote[pn]) S.quote[pn] = { qty: 1 };
  renderCount();
  document.querySelectorAll(`[data-add="${CSS.escape(pn)}"]`).forEach(b => {
    b.classList.add('in'); b.innerHTML = buyLabel(true); b.setAttribute('aria-pressed', 'true');
    b.setAttribute('aria-label', t('inq') + ' ' + pn);
  });
}

/* ---------- Command palette ---------- */
let palSel = 0, palRows = [];
function palResults() {
  const q = $('palInput').value.trim().toLowerCase();
  if (!q) return PARTS.slice(0, 6);
  return PARTS.filter(p => p.pn.toLowerCase().includes(q) || p.en.toLowerCase().includes(q) || p.ar.includes(q) || p.fits.some(f => f.toLowerCase().includes(q)) || (S.lang === 'ar' && t(p.cat).includes(q)));
}
function renderPalette() {
  palRows = palResults();
  const q = $('palInput').value.trim();
  palSel = clamp(palSel, 0, Math.max(palRows.length - 1, 0));
  $('palList').innerHTML = palRows.length ? palRows.map((p, i) => `<div class="pal-row${i === palSel ? ' sel' : ''}" role="option" aria-selected="${i === palSel}" data-pal="${i}">
    <img src="${p.img}" alt=""><div class="tx"><strong>${p[S.lang]}</strong><small dir="ltr">${p.pn}</small></div><span class="p">${money(p.aed)}</span></div>`).join('') :
    `<div class="pal-empty">${esc(t('none')(q))}<br><button class="solid" type="button" data-source="${esc(q)}">${t('addSrc')}</button></div>`;
}
const openPalette = () => { $('palInput').value = ''; palSel = 0; renderPalette(); if (!$('palette').open) $('palette').showModal(); $('palInput').focus(); };
const closePalette = () => { if ($('palette').open) $('palette').close(); };

/* ---------- Events ---------- */
document.addEventListener('click', e => {
  const shopLink = e.target.closest('a[data-shop]');
  if (shopLink) { e.preventDefault(); shop(shopLink.dataset.shop); return; }
  if (e.target === $('drawer')) { $('drawer').close(); return; }
  if (e.target === $('palette')) { closePalette(); return; }
  const row = e.target.closest('[data-pal]');
  if (row) { addPart(palRows[+row.dataset.pal].pn); openDrawer(); return; }
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.add) { S.quote[d.add] ? openDrawer() : addPart(d.add); }
  else if ('fleet' in d) { S.fleet = d.fleet; syncFilters(); }
  else if ('cat' in d) { S.cat = d.cat; syncFilters(); }
  else if (d.shop) shop(d.shop);
  else if (b.id === 'resetBtn' || b.id === 'resetBtn2') { S.fleet = ''; S.cat = ''; syncFilters(); }
  else if (d.more) { S.quote[d.more].qty++; renderCount(); renderDrawer(); }
  else if (d.less) { if (--S.quote[d.less].qty < 1) { delete S.quote[d.less]; renderGrid(); } renderCount(); renderDrawer(); }
  else if ('openQuote' in d) openDrawer();
  else if ('close' in d) { S.sent = null; $('drawer').close(); $('parts').scrollIntoView(); }
  else if (d.source) { addPart(d.source.toUpperCase()); openDrawer(); }
  else if (d.chapter) jumpToChapter(d.chapter);
  else if (b.id === 'copyBtn') {
    navigator.clipboard?.writeText(S.sent).then(() => { b.textContent = t('copied'); }).catch(() => {});
  }
});
$('quoteBtn').onclick = openDrawer;
$('dClose').onclick = () => $('drawer').close();
$('heroSearch').onclick = openPalette; $('navSearch').onclick = openPalette; $('endSearch').onclick = openPalette; $('palClose').onclick = closePalette;
$('drawer').addEventListener('submit', e => {
  e.preventDefault();
  S.sent = quoteText(); S.quote = {}; renderCount(); renderGrid(); renderDrawer();
});
$('langBtn').onclick = () => {
  S.lang = S.lang === 'en' ? 'ar' : 'en';
  try { history.replaceState(null, '', S.lang === 'ar' ? '#ar' : location.pathname + location.search); } catch (err) { /* sandboxed viewers */ }
  renderStatic(); renderGlobeLabels(); sizeStory();
};
$('curBtn').onclick = () => { S.cur = S.cur === 'AED' ? 'USD' : 'AED'; renderStatic(); };
$('palInput').addEventListener('input', () => { palSel = 0; renderPalette(); });
$('palInput').addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { palSel = Math.min(palSel + 1, palRows.length - 1); renderPalette(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { palSel = Math.max(palSel - 1, 0); renderPalette(); e.preventDefault(); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    if (palRows[palSel]) { addPart(palRows[palSel].pn); openDrawer(); }
    else if ($('palInput').value.trim()) { addPart($('palInput').value.trim().toUpperCase()); openDrawer(); }
  }
});
addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('palette').open ? closePalette() : openPalette(); }
});
document.addEventListener('pointermove', e => {
  const c = e.target.closest?.('.card,.tile'); if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });
addEventListener('resize', () => { moveThumb($('fleetSeg')); moveThumb($('catSeg')); });
// Web fonts can arrive after the first measure, most often Arabic after switching language.
const refitThumbs = () => { moveThumb($('fleetSeg'), true); moveThumb($('catSeg'), true); };
document.fonts?.ready.then(refitThumbs);
document.fonts?.addEventListener?.('loadingdone', refitThumbs);

let revealIO;
function observeReveals() {
  if (!revealIO) revealIO = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); revealIO.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal:not(.in)').forEach(el => revealIO.observe(el));
}

/* ---------- Globe ---------- */
const globeCities = CITIES.map(c => ({ ...c }));
function renderGlobeLabels() { globeCities.forEach(c => { c.label = c[S.lang]; }); globe?.redraw(); }
let globe;

/* ---------- Scroll story ---------- */
const story = $('story');
let storyTop = 0, storyLen = 1;
function sizeStory() { storyTop = story.offsetTop; storyLen = Math.max(story.offsetHeight - innerHeight, 1); }
const chapterP = { fan: .58, hpc: .68, combustor: .78, lpt: .88 };
function jumpToChapter(k) { scrollTo({ top: storyTop + chapterP[k] * storyLen, behavior: 'smooth' }); }
const band = (p, a, b, c, d) => p <= a || p >= d ? 0 : p < b ? (p - a) / (b - a) : p > c ? 1 - (p - c) / (d - c) : 1;

function applyOverlays(p) {
  const heroO = clamp(1 - p / .05);
  const hero = $('hero');
  hero.style.opacity = heroO; hero.style.visibility = heroO < .01 ? 'hidden' : 'visible';
  hero.style.transform = `translateY(${-p * 900}px) scale(${1 - p * .6})`;
  $('halo').style.transform = `translateY(${p * 700}px)`;
  const b1 = band(p, .15, .2, .285, .33), b2 = band(p, .405, .45, .51, .54);
  $('beat1').style.opacity = b1; $('beat1').style.transform = `translateY(${(1 - b1) * 18}px)`;
  $('beat2').style.opacity = b2; $('beat2').style.transform = `translateY(${(1 - b2) * 18}px)`;
  const ranges = [[.545, .57, .615, .64], [.645, .67, .715, .74], [.745, .77, .815, .84], [.845, .87, .925, .955]];
  document.querySelectorAll('.chapter').forEach((el, i) => {
    const o = band(p, ...ranges[i]);
    el.style.opacity = o; el.style.transform = `translateY(${(1 - o) * 20}px)`;
    el.style.visibility = o < .01 ? 'hidden' : 'visible';
    el.style.pointerEvents = o > .9 ? 'auto' : 'none';
  });
  $('scrim').style.opacity = Math.max(b1, ...[...document.querySelectorAll('.chapter')].map(e => +e.style.opacity || 0));
  $('hotspots').style.opacity = band(p, .445, .47, .515, .54);
  $('hotspots').style.visibility = p > .45 && p < .545 ? 'visible' : 'hidden';
}

function setupEngine() {
  const canvas = $('gl');
  const small = innerWidth < 820;
  const lite = small || (navigator.hardwareConcurrency || 8) <= 4;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0;
  const scene = new THREE.Scene();
  scene.environment = makeStudioEnv(renderer);
  const { engine, modules, rotor, sync } = buildEngine({ lite });
  scene.add(engine);
  const cam = new THREE.PerspectiveCamera(FOV, 1, .05, 80);

  let W = 0, H = 0, maxDpr = Math.min(devicePixelRatio || 1, lite ? 1.5 : 2);
  const resize = () => {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setPixelRatio(maxDpr);
    renderer.setSize(W, H, false);
    cam.aspect = W / H; cam.updateProjectionMatrix();
    sizeStory();
  };
  resize(); addEventListener('resize', resize);

  let px = 0, py = 0, tx = 0, ty = 0;
  addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5); ty = (e.clientY / innerHeight - .5); }, { passive: true });

  let pS = clamp((scrollY - storyTop) / storyLen);
  const start = performance.now();
  let spin = 0, prev = start, active = true, slow = 0;
  const v = new THREE.Vector3(), fw = new THREE.Vector3();
  const hsEls = () => [...document.querySelectorAll('.hs')];
  const zoomFor = (aspect, pv) => {
    // Keep the subject inside narrow viewports, framed tighter in the opening shot.
    const base = aspect < 1.25 ? Math.min(1.25 / aspect, 2.1) : 1;
    return pv < .1 ? 1 + (base - 1) * (.72 + pv * 2.8) : base;
  };

  const frame = now => {
    requestAnimationFrame(frame);
    if (!active) { prev = now; return; }
    const real = (now - prev) / 1000, dt = Math.min(real, .05); prev = now;
    const target = clamp((scrollY - storyTop) / storyLen);
    pS += (target - pS) * (1 - Math.exp(-Math.min(real, .6) * 7));
    const p = pS;
    px += (tx - px) * (1 - Math.exp(-dt * 3)); py += (ty - py) * (1 - Math.exp(-dt * 3));

    const s = sampleCam(p);
    const aspect = W / H;
    const zoom = zoomFor(aspect, p);
    const pos = s.pos.slice(), tgt = s.tgt.slice();
    // Narrow screens: move the text offset from sideways to vertical.
    for (let i = 0; i < 3; i++) pos[i] = tgt[i] + (pos[i] - tgt[i]) * zoom;
    if (s.sh) {
      // Slide the frame sideways so the subject clears the text column.
      if (aspect < 1) { tgt[1] += s.my * s.sh * .86; pos[1] += s.my * s.sh * .86; }
      else {
        fw.set(tgt[0] - pos[0], 0, tgt[2] - pos[2]).normalize();
        const side = S.lang === 'ar' ? -1 : 1;
        // Camera right is forward x up; moving the frame left pushes the subject right.
        const rx = -fw.z, rz = fw.x, d = s.sh * side;
        tgt[0] -= rx * d; tgt[2] -= rz * d; pos[0] -= rx * d; pos[2] -= rz * d;
      }
    }
    const par = 1 - clamp(p / .1) * .75;
    cam.position.set(pos[0] + px * .55 * par, pos[1] - py * .32 * par, pos[2]);
    cam.lookAt(tgt[0], tgt[1], tgt[2]);

    sync(s.explode, s.open, s.focus);
    const el = (now - start) / 1000;
    // Spool up on load, settle into a slow windmill.
    const k = clamp(el / 4.2);
    const speed = (Math.sin(Math.min(k * 1.5, 1) * Math.PI / 2) * 2.1) * (1 - k * k * .72) + .08 + p * .25;
    spin += speed * dt;
    rotor.rotation.z = spin;
    for (const n of ['lpc', 'hpc', 'hpt', 'lpt']) modules[n].rotation.z = spin * 1.4;
    renderer.toneMappingExposure = clamp(el / 2.2) * 1.08;
    canvas.style.transition = el > 2 ? 'none' : '';
    canvas.style.opacity = p > .95 ? clamp((1 - p) / .05) : '';

    renderer.render(scene, cam);
    applyOverlays(p);

    // Drop resolution on GPUs that can't hold a smooth frame rate.
    if (el > 3) {
      slow += real > .03 ? 1 : -.25; slow = Math.max(slow, 0);
      if (slow > 45 && maxDpr > 1) { maxDpr = Math.max(maxDpr - .5, 1); slow = 0; resize(); }
    }

    // Pin the module labels to their parts on screen.
    if (p > .44 && p < .55) {
      const anchorOf = { fan: 'fan', hpc: 'hpc', combustor: 'combustor', lpt: 'lpt' };
      hsEls().forEach(h => {
        const m = modules[anchorOf[h.dataset.k]];
        // The rotors spin, so place the label from the axis instead of the rotating group.
        const a = m.userData.anchor;
        v.set(0, a.y, a.z + m.position.z); engine.localToWorld(v); v.project(cam);
        const x = (v.x * .5 + .5) * W, y = (-v.y * .5 + .5) * H;
        const lift = 52;
        h.style.setProperty('--len', lift - 34 + 'px');
        h.style.transform = `translate(${x}px,${y - lift}px) translate(-50%,0)`;
      });
    }
  };
  // Stop rendering when the story is off screen.
  new IntersectionObserver(e => { active = e[0].isIntersecting; }, { rootMargin: '10%' }).observe($('stage'));
  requestAnimationFrame(frame);
  canvas.classList.add('on');
}

/* ---------- Boot ---------- */
$('poster').src = poster; $('endImg').src = poster;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
document.querySelector('kbd').textContent = isMac ? '⌘K' : 'Ctrl K';
renderStatic();
setInterval(renderClock, 20000);
function hasWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
if (reduced || !hasWebGL()) document.documentElement.classList.add('static');
else {
  try { setupEngine(); } catch (err) { console.error(err); document.documentElement.classList.add('static'); }
}
globeCities.forEach(c => { c.label = c[S.lang]; });
globe = createGlobe($('globe'), () => globeCities, reduced);
$('halo').style.opacity = 1;
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('pre')));
const onScroll = () => $('nav').classList.toggle('solidnav', scrollY > 40 && (scrollY > storyTop + storyLen - 10 || document.documentElement.classList.contains('static')));
addEventListener('scroll', onScroll, { passive: true }); onScroll();
