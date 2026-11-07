import * as THREE from 'three';
import { buildEngine, lineArt } from './engine.js';
import { createGlobe } from './globe.js';
import { PARTS, FLEET, CATS, CONDS, HUBS, DOCS, MAKERS, CITIES, photo, stock, bestOffer } from './catalog.js';
import { T } from './i18n.js';
import { certEASA, certFAA, certFor } from './cert.js';
import { createAdmin, sampleOrders, STATUSES } from './admin.js';
import { logo } from './logos.js';
import poster from '../assets/poster.webp';

const $ = id => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAGE = 24;
const RATES = { AED: 1, USD: 3.6725, EUR: 3.98, SAR: .979 };

/* ---------- Storage, safe in sandboxed viewers ---------- */
const load = (k, d) => { try { const v = localStorage.getItem('sirb.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const store = (k, v) => { try { localStorage.setItem('sirb.' + k, JSON.stringify(v)); } catch (e) { /* viewer without storage */ } };

const S = {
  lang: location.hash === '#ar' ? 'ar' : load('lang', 'en'), cur: load('cur', 'AED'), theme: load('theme', 'dark'),
  cart: load('cart', {}), saved: load('saved', []), recent: load('recent', []), ship: 'exp', sent: null,
  f: { fleet: '', cats: [], conds: [], docs: [], hubs: [], makers: [], inStock: false, q: '', sort: 'rel' }, page: 1, view: load('view', 'grid'),
  pd: null,
};
const adminState = { orders: load('orders', null) || sampleOrders(), edits: load('edits', {}), settings: load('settings', { aogDesk: true, usd: true, bulk: true, vat: 5 }) };
for (const [pn, ed] of Object.entries(adminState.edits)) { const p = PARTS.find(x => x.pn === pn); if (p) ed.forEach(([q, a], i) => { if (p.offers[i]) { p.offers[i].qty = q; p.offers[i].aed = a; } }); }
const saveAdmin = () => { store('orders', adminState.orders); store('edits', adminState.edits); store('settings', adminState.settings); };

const t = k => T[S.lang][k];
const vatRate = () => adminState.settings.vat / 100;
const money = aed => {
  const v = Math.round(aed / RATES[S.cur]).toLocaleString('en-US');
  return S.cur === 'AED' ? t('aedF')(v) : S.cur === 'USD' ? '$' + v : S.cur === 'EUR' ? '€' + v : 'SAR ' + v;
};
const byPn = pn => PARTS.find(p => p.pn === pn);
const fleetName = f => f === 'A320' ? t('A320') : f;
const nameOf = p => p[S.lang];
const icon = (id, s = 18) => `<svg width="${s}" height="${s}" aria-hidden="true"><use href="#${id}"/></svg>`;

/* ---------- Page text ---------- */
function renderStatic() {
  const html = document.documentElement;
  html.lang = S.lang; html.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach(el => { if (typeof t(el.dataset.t) === 'string') el.textContent = t(el.dataset.t); });
  $('palInput').placeholder = t('palPh');
  $('catQ').placeholder = t('filterSearch'); $('catQ').setAttribute('aria-label', t('filterSearch'));
  $('langBtn').textContent = t('langBtn');
  $('curSel').value = S.cur; $('curSel').hidden = !adminState.settings.usd;
  $('sortSel').innerHTML = [['rel', 'sRel'], ['low', 'sLow'], ['high', 'sHigh'], ['stock', 'sStock']].map(([v, k]) => `<option value="${v}"${S.f.sort === v ? ' selected' : ''}>${t(k)}</option>`).join('');
  $('footShop').innerHTML = `<h3>${t('fShop')}</h3>` + CATS.map(c => `<a href="#parts" data-shop="${c}">${t(c)}</a>`).join('');
  $('trust').innerHTML = t('trust').map(([a, b], i) => `<div>${icon(['i-tag', 'i-trace', 'i-headset', 'i-shield'][i], 24)}<strong>${a}</strong><span>${b}</span></div>`).join('');
  $('opsLogos').innerHTML = `<p>${t('opsT')}</p><div class="lgrow">${['emirates', 'etihadairways', 'qatarairways', 'saudia', 'turkishairlines', 'lufthansa'].map(k => logo(k, 52)).join('')}</div>`;
  $('members').innerHTML = `<p>${t('memT')}</p><div class="lgrow sm">${logo('iata', 46)}<b class="tm">ASA</b><b class="tm">AFRA</b></div>`;
  $('footPay').innerHTML = ['visa', 'mastercard', 'americanexpress', 'applepay'].map(k => logo(k, 28)).join('');
  $('appr').innerHTML = t('appr').map(([a, b, c]) => `<div><strong>${a}</strong><span>${b}</span><code dir="ltr">${c}</code></div>`).join('');
  $('stats').innerHTML = t('stats').map(([a, b]) => `<div><strong>${a}</strong><span>${b}</span></div>`).join('');
  $('quotes').innerHTML = t('quotes').map(([q, r, c]) => `<figure><blockquote>“${q}”</blockquote><figcaption><strong>${r}</strong><span>${c}</span></figcaption></figure>`).join('');
  $('cgrid').innerHTML = t('contacts').map(([a, b, href, l], i) => `<a class="ccard${i === 0 ? ' hot' : ''}" href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}><i class="ci">${icon(['i-headset', 'i-wa', 'i-mail', 'i-pin'][i], 22)}</i><span>${a}</span><strong dir="${i < 2 ? 'ltr' : 'auto'}">${b}</strong><em>${l}<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></em></a>`).join('');
  $('footLegal').innerHTML = `<h3>${t('fLegal')}</h3>` + t('legal').map(([k, l]) => `<button type="button" class="flink" data-legal="${k}">${l}</button>`).join('');
  $('faqList').innerHTML = t('faq').map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('');
  [$('heroBulk'), $('footBulk')].forEach(b => { b.hidden = !adminState.settings.bulk; });
  renderTheme(); renderChapters(); renderSegs(); renderTiles(); renderSide(); renderGrid(); renderAog(); renderBento(); renderTrace(); renderCount();
  if ($('drawer').open) renderDrawer();
  if ($('palette').open) renderPalette();
  if (S.pd) renderPdp();
  observeReveals();
}

function renderTheme() {
  document.documentElement.dataset.theme = S.theme;
  document.querySelector('meta[name=theme-color]').content = S.theme === 'light' ? '#ffffff' : '#000000';
  $('themeUse').setAttribute('href', S.theme === 'light' ? '#i-moon' : '#i-sun');
  $('themeBtn').setAttribute('aria-label', S.theme === 'light' ? t('themeD') : t('themeL'));
}

function renderChapters() {
  $('facts').innerHTML = t('facts').map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join('');
  $('hotspots').innerHTML = t('chapters').map(c => `<div class="hs" data-k="${c.k}"><button type="button" data-shop="engine" data-mod="${c.k}">${c.t}</button><i></i></div>`).join('');
}

/* ---------- Aircraft slider ---------- */
function moveThumb(el, instant) {
  const th = el.querySelector('.thumb'), b = el.querySelector('[aria-pressed=true]');
  if (!th || !b) return;
  if (instant) th.style.transition = 'none';
  th.style.width = b.offsetWidth + 'px'; th.style.transform = `translateX(${b.offsetLeft}px)`;
  if (instant) { void th.offsetWidth; th.style.transition = ''; }
  else if (el.scrollWidth > el.clientWidth) el.scrollTo({ left: b.offsetLeft - (el.clientWidth - b.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
}
function renderSegs() {
  const items = [['', t('allA')], ...FLEET.map(f => [f, fleetName(f)])];
  $('fleetSeg').innerHTML = '<span class="thumb"></span>' + items.map(([v, l]) => `<button type="button" data-fleet="${v}" aria-pressed="${v === S.f.fleet}">${l}</button>`).join('');
  moveThumb($('fleetSeg'), true);
}
const refit = () => moveThumb($('fleetSeg'), true);
document.fonts?.ready.then(refit);
document.fonts?.addEventListener?.('loadingdone', refit);
addEventListener('resize', refit);

/* ---------- Categories, filters, grid ---------- */
function renderTiles() {
  $('tiles').innerHTML = CATS.map(c => `<button class="ctile" type="button" data-shop="${c}" aria-pressed="${S.f.cats.length === 1 && S.f.cats[0] === c}">
    <span class="ci2">${icon('i-c-' + c, 32)}</span>
    <span class="ct-tx"><strong>${t(c)}</strong><span>${t('catN')(PARTS.filter(p => p.cat === c).length)}</span></span></button>`).join('');
}
function optGroup(title, key, items) {
  return `<div class="fgroup"><h3>${title}</h3>${items.map(([v, l]) => `<label class="fopt"><input type="checkbox" data-f="${key}" value="${esc(v)}"${S.f[key].includes(v) ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
}
function renderSide() {
  $('side').innerHTML = `<div class="fclose"><span>${t('fFilters')}</span><button class="ghost" type="button" id="sideClose">${t('close')}</button></div>
    <div class="fgroup"><label class="fopt"><input type="checkbox" id="inStockF"${S.f.inStock ? ' checked' : ''}><span>${t('fStock')}</span></label></div>
    ${optGroup(t('fCat'), 'cats', CATS.map(c => [c, t(c)]))}
    ${optGroup(t('fCond'), 'conds', CONDS.map(c => [c, t(c)]))}
    ${optGroup(t('fCert'), 'docs', DOCS.map(d => [d, d]))}
    ${optGroup(t('fHub'), 'hubs', HUBS.map(h => [h, h]))}
    ${optGroup(t('fMaker'), 'makers', MAKERS.map(m => [m, m]))}
    <div class="side-actions"><button class="solid" type="button" id="sideApply"></button></div>`;
  const a = $('sideApply'); if (a) a.textContent = t('fApply')(visible().length);
}
function visible() {
  const f = S.f, q = f.q.trim().toLowerCase();
  const list = PARTS.filter(p => {
    if (f.fleet && !p.fits.includes(f.fleet)) return false;
    if (f.cats.length && !f.cats.includes(p.cat)) return false;
    if (f.conds.length && !p.offers.some(o => f.conds.includes(o.c))) return false;
    if (f.docs.length && !p.offers.some(o => f.docs.includes(o.doc))) return false;
    if (f.hubs.length && !p.offers.some(o => f.hubs.includes(o.from))) return false;
    if (f.makers.length && !f.makers.includes(p.maker)) return false;
    if (f.inStock && !stock(p)) return false;
    if (q && !matches(p, q)) return false;
    return true;
  });
  const price = p => bestOffer(p).aed;
  if (f.sort === 'rel') list.sort((a, b) => a.rank - b.rank);
  else if (f.sort === 'low') list.sort((a, b) => price(a) - price(b));
  else if (f.sort === 'high') list.sort((a, b) => price(b) - price(a));
  else if (f.sort === 'stock') list.sort((a, b) => stock(b) - stock(a));
  return list;
}
const matches = (p, q) => p.pn.toLowerCase().includes(q) || p.alts.some(a => a.toLowerCase().includes(q)) || p.en.toLowerCase().includes(q) || p.ar.includes(q) || p.fits.some(x => x.toLowerCase().includes(q)) || t(p.cat).toLowerCase().includes(q) || p.maker.toLowerCase().includes(q);

function inCart(pn) { return Object.keys(S.cart).some(k => k.startsWith(pn + '|')); }
const keyOf = (pn, i) => `${pn}|${i}|out`;
// Best offer to recommend: the cheapest installable condition on the shelf. As removed never wins.
const bestFit = p => { const a = p.offers.filter(o => o.qty && o.c !== 'AR'); return a.length ? a.reduce((x, o) => o.aed < x.aed ? o : x) : null; };
const certShort = p => { const o = bestFit(p) || p.offers.find(x => x.c !== 'AR') || p.offers[0]; return o.doc.startsWith('EASA') ? 'EASA' : o.doc.startsWith('FAA') ? 'FAA' : ''; };
function cell(p, o, i, best, one) {
  const k = keyOf(p.pn, i), on = !!S.cart[k], ar = o.c === 'AR';
  const sub = o.qty ? `${o.qty} · ${o.from}` : t('onReq');
  const tag = best ? `<em class="tag">${t('best')}</em>` : ar && o.qty ? `<em class="tag mute">${t('noCert')}</em>` : '';
  const inner = `<span class="ct"><i class="cd c-${o.c}"></i>${one ? t(o.c) : o.c}${tag}</span><span class="cp">${money(o.aed)}</span><span class="cs">${on ? icon('i-check', 13) + t('inq') : sub}</span>`;
  return o.qty
    ? `<button type="button" class="cell${best ? ' best' : ''}${ar ? ' ar' : ''}${on ? ' in' : ''}${one ? ' one' : ''}" data-addo="${esc(p.pn)}|${i}" aria-label="${esc(`${t('add')}: ${p.pn}, ${t(o.c)}, ${money(o.aed)}, ${sub}`)}">${inner}</button>`
    : `<span class="cell none${one ? ' one' : ''}" aria-hidden="true">${inner}</span>`;
}
// Ready for an AOG: installable, on the shelf at a Dubai airport, ships today.
const aogReady = o => o && o.qty && o.c !== 'AR' && (o.from === 'DXB' || o.from === 'DWC');
function card(p) {
  const best = bestFit(p) || p.offers.find(o => o.qty), any = !!best;
  const i = any ? p.offers.indexOf(best) : -1, k = any ? keyOf(p.pn, i) : '', on = any && !!S.cart[k];
  const more = p.offers.filter(o => o !== best && o.qty).length;
  const buy = any
    ? `<div class="c-buy">
        <div class="c-pr">
          <span class="c-st"><i class="cd c-${best.c}"></i>${t(best.c)} · ${t('inStock')(best.qty)}${best.c === 'AR' ? ` · ${t('noCert')}` : ''}</span>
          <span class="c-price">${money(best.aed)}${more ? `<small class="c-more">${t('moreConds')(more)}</small>` : ''}</span>
        </div>
        <button type="button" class="c-add${on ? ' in' : ''}" data-addo="${esc(p.pn)}|${i}" aria-label="${esc(`${on ? t('inq') : t('add')}: ${p.pn}, ${t(best.c)}, ${money(best.aed)}`)}">${icon(on ? 'i-check' : 'i-plus', 20)}</button>
      </div>`
    : `<div class="c-buy">
        <div class="c-pr"><span class="c-q">${t('quoteIn')}</span></div>
        <button type="button" class="c-quote2" data-add="${esc(p.pn)}">${t('getQuote')}</button>
      </div>`;
  return `<article class="card${any ? '' : ' out'}" data-card="${p.pn}">
    <a class="c-link" href="#p-${p.pn}" aria-label="${esc(t('details') + ': ' + nameOf(p) + ' ' + p.pn + (any ? '' : ', ' + t('outStock')))}"></a>
    <div class="c-photo"><img src="${photo(p)}" alt="${esc(nameOf(p))}" loading="lazy" decoding="async">${any ? (aogReady(best) ? `<span class="aogr" title="${esc(t('aogReadyT'))}">${icon('i-bolt', 12)}${t('aogReady')}</span>` : '') : `<span class="soldout">${t('outStock')}</span>`}</div>
    <div class="c-head">
      <span class="pn" dir="ltr">${p.pn}</span>
      <h3>${nameOf(p)}</h3>
      <p class="fits">${icon('i-plane', 14)}<span>${p.fits.map(fleetName).join(', ')}</span>${(() => { const o = bestFit(p) || p.offers.find(x => x.c !== 'AR'); return o ? `<span class="c-cert">${icon('i-tag', 14)}${o.doc.startsWith('EASA') ? 'EASA' : 'FAA'}</span>` : ''; })()}</p>
    </div>
    ${buy}
  </article>`;
}
const buyLabel = (inq, avail) => (inq ? icon('i-check', 15) : '') + `<span>${inq ? t('inq') : avail ? t('add') : t('request')}</span>`;
function renderGrid() {
  const v = visible(), shown = v.slice(0, S.page * PAGE), g = $('grid');
  g.classList.toggle('as-list', S.view === 'list');
  const q = S.f.q.trim();
  g.innerHTML = v.length ? shown.map(card).join('') : q ? `<div class="empty"><h3>${esc(t('emptyQ2')(q))}</h3><p>${t('emptyQ2s')}</p><div class="row"><button class="solid" type="button" data-source="${esc(q)}">${esc(t('quoteIt')(q.toUpperCase()))}</button><button class="outline" type="button" id="clearF2">${t('fClear')}</button></div></div>` : `<div class="empty">${t('emptyF')}<br><button class="solid" type="button" id="clearF2">${t('fClear')}</button></div>`;
  $('count').textContent = t('results')(v.length);
  const rest = v.length - shown.length;
  $('moreW').innerHTML = rest > 0 ? `<button class="outline" type="button" id="moreBtn">${t('more')(Math.min(rest, PAGE))}</button>` : '';
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
  const f = S.f, chips = [
    ...f.cats.map(x => ['cats', x, t(x)]), ...f.conds.map(x => ['conds', x, t(x)]), ...f.docs.map(x => ['docs', x, x]),
    ...f.hubs.map(x => ['hubs', x, x]), ...f.makers.map(x => ['makers', x, x]),
  ];
  if (f.inStock) chips.push(['inStock', '1', t('fStock')]);
  $('activeF').innerHTML = chips.map(([k, val, l]) => `<button type="button" class="afil" data-rm="${k}" data-val="${esc(val)}">${l}<i aria-hidden="true">×</i></button>`).join('') + (chips.length > 1 ? `<button type="button" class="aclear" id="clearF">${t('fClear')}</button>` : '');
  const a = $('sideApply'); if (a) a.textContent = t('fApply')(v.length);
}
function clearFilters() { Object.assign(S.f, { fleet: '', cats: [], conds: [], docs: [], hubs: [], makers: [], inStock: false, q: '' }); $('catQ').value = ''; S.page = 1; renderSegs(); renderSide(); renderTiles(); renderGrid(); }
function shop(cat) {
  S.f.cats = [cat]; S.page = 1; renderSide(); renderTiles(); renderGrid();
  $('filters').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

/* ---------- Product page ---------- */
function openPdp(pn) {
  const p = byPn(pn); if (!p) { closeOverlays(); return; }
  const nonAr = p.offers.filter(o => o.c !== 'AR');
  const bf = bestFit(p) || (stock(p) ? bestOffer(p) : nonAr.length ? nonAr.reduce((x, o) => o.aed < x.aed ? o : x) : p.offers[0]);
  const oi = p.offers.indexOf(bf);
  S.pd = { pn, oi, type: 'out', qty: 1, view: p.view, tab: 'spec' };
  S.recent = [pn, ...S.recent.filter(x => x !== pn)].slice(0, 9); store('recent', S.recent);
  renderPdp();
  const el = $('pdp'); el.hidden = false; el.scrollTop = 0;
  document.documentElement.classList.add('locked');
  el.focus({ preventScroll: true });
}
const exUnit = o => Math.round(o.aed * .42 / 50) * 50, coreUnit = o => Math.round(o.aed * .58 / 50) * 50;
function renderPdp() {
  const d = S.pd, p = byPn(d.pn), o = p.offers[d.oi], avail = o.qty > 0;
  const exOk = p.rotable && o.c !== 'AR'; if (!exOk) d.type = 'out';
  const unit = d.type === 'ex' && exOk ? exUnit(o) : o.aed;
  const total = unit * d.qty, saved = S.saved.includes(p.pn);
  const rows = [[t('sPn'), p.pn], [t('sAlt'), p.alts.join(', ')], [t('sMaker'), p.maker], [t('sAta'), p.ata], [t('sKg'), `${p.kg} kg`], [t('sSize'), `${p.size} cm`], [t('sHs'), p.hs], [t('sEccn'), p.eccn], [t('sWarr'), o.c === 'AR' ? t('warrNone') : t('months')(o.c === 'SV' ? 6 : p.warranty)]];
  if (p.shelf) rows.push([t('sShelf'), t('shelfV')]);
  if (p.hazmat) rows.push([t('sHaz'), t('yes')]);
  const tabs = { spec: () => `<dl class="spec">${rows.map(([a, b]) => `<div><dt>${a}</dt><dd><bdi>${b}</bdi></dd></div>`).join('')}</dl>`,
    fits: () => `<div class="fitg">${p.fits.map(f => `<span><bdi>${fleetName(f)}</bdi></span>`).join('')}</div><p class="tnote">${t('fitsNote')}</p>`,
    docs: () => `<div class="docg"><button class="certwrap" type="button" data-certopen="${p.pn}|${d.oi}" aria-label="${t('docOpen')}">${certFor(p, o)}</button><div class="docside"><p>${o.c === 'AR' ? t('docIntroAR') : t('docIntro')(o.doc)}</p><button class="outline" type="button" data-certopen="${p.pn}|${d.oi}">${t('docOpen')}</button></div></div>`,
    ship: () => `<div class="shiprows">${t('shipRows').map(([a, b], i) => `<div>${icon(['i-depart', 'i-box', 'i-hangar', 'i-return', 'i-swap'][i], 20)}<strong>${a}</strong><span>${b}</span></div>`).join('')}</div>` };
  const similar = PARTS.filter(x => x.cat === p.cat && x.pn !== p.pn && x.model !== p.model).slice(0, 4);
  const recent = S.recent.filter(x => x !== p.pn).map(byPn).filter(Boolean).slice(0, 4);
  $('pdp').innerHTML = `<div class="pd-top"><div class="wrap">
      <button class="backb" type="button" id="pdBack"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>${t('pBack')}</button>
      <span class="crumbs"><bdi>${t(p.cat)}</bdi></span>
      <button class="solid small" type="button" data-opencart><span>${t('cart')}</span><b>${cartCount()}</b></button>
    </div></div>
    <div class="wrap">
      <div class="pd-main">
        <div class="gal">
          <div class="gal-main${stock(p) ? '' : ' out'}"><img src="${photo(p, d.view)}" alt="${esc(nameOf(p))}">${stock(p) ? '' : `<span class="soldout">${t('outStock')}</span>`}<span class="chip c-${o.c}"><i></i>${t(o.c)}</span></div>
          <div class="gal-th${stock(p) ? '' : ' out'}">${[1, 2, 3].map(v => `<button type="button" data-gal="${v}" aria-pressed="${v === d.view}" aria-label="${esc(nameOf(p))}, ${v} / 3"><img src="${photo(p, v)}" alt="" loading="lazy"></button>`).join('')}</div>
        </div>
        <div class="pd-info">
          <p class="eyebrow">ATA ${p.ata}, <bdi>${p.maker}</bdi></p>
          <h1>${nameOf(p)}</h1>
          <p class="pd-pn" dir="ltr" style="text-align:start"><strong>${p.pn}</strong> <span>/ ${p.alts[0]}</span></p>
          <h2 class="pd-h">${t('pCond')}</h2>
          <div class="opts">${p.offers.map((x, i) => `<button type="button" class="opt" data-opt="${i}" aria-pressed="${i === d.oi}"><strong>${t(x.c)} <bdi style="font-weight:400;color:var(--t2)">(${x.c})</bdi></strong><span class="pr">${money(x.aed)}</span><small>${t(x.c + 'd')}</small><small class="r">${x.qty ? `${t('inStock')(x.qty)}, ${x.from}` : t('out')}</small></button>`).join('')}</div>
          ${exOk ? `<h2 class="pd-h">${t('pType')}</h2><div class="toggle"><button type="button" data-type="out" aria-pressed="${d.type === 'out'}">${t('pOut')}</button><button type="button" data-type="ex" aria-pressed="${d.type === 'ex'}">${t('pEx')}</button></div><p class="tnote">${d.type === 'ex' ? t('pExD')(money(coreUnit(o))) : t('pOutD')}</p>` : ''}
          <div class="buybox">
            <div class="bb-top">
              <div class="bb-p">${money(total)}<small>${t('pSub')}, ${t('pIncl')(money(total * (1 + vatRate())))}</small></div>
              <div class="stepper" role="group" aria-label="${t('pQty')}"><button type="button" data-pq="-1" aria-label="${t('less')}">−</button><span aria-live="polite">${d.qty}</span><button type="button" data-pq="1" aria-label="${t('moreQ')}">+</button></div>
            </div>
            <div class="bb-act">
              <button class="solid" type="button" id="pdAdd">${avail ? t('add') : t('request')}</button>
              <button class="outline${saved ? ' on' : ''}" type="button" data-save="${p.pn}" aria-pressed="${saved}" aria-label="${saved ? t('saveR') : t('saveA')}">${icon('i-heart', 19)}</button>
            </div>
            <p class="bb-ship${avail ? '' : ' out'}">${icon(avail ? 'i-truck' : 'i-headset', 18)}<span>${avail ? t('pShip')(o.from) : t('pShipOut')}</span></p>
            <ul class="bb-proof"><li>${icon(o.c === 'AR' ? 'i-tag' : 'i-tag', 18)}<span>${o.c === 'AR' ? t('pfTag') : t('pfCert')(o.doc)}</span></li><li>${icon('i-shield', 18)}<span>${o.c === 'AR' ? t('warrNone') : t('pfWarr')(o.c === 'SV' ? 6 : p.warranty)}</span></li><li>${icon('i-return', 18)}<span>${t('pfRet')}</span></li></ul>
          </div>
        </div>
      </div>
      <div class="pd-tabs">
        <div class="tabsb" role="group">${[['spec', 'tSpec'], ['fits', 'tFits'], ['docs', 'tDocs'], ['ship', 'tShip']].map(([k, l]) => `<button type="button" data-tab="${k}" aria-pressed="${d.tab === k}">${t(l)}</button>`).join('')}</div>
        <div class="tabc">${tabs[d.tab]()}</div>
      </div>
      ${similar.length ? `<section class="rowsec"><h2>${t('similar')}</h2><div class="minis">${similar.map(card).join('')}</div></section>` : ''}
      ${recent.length ? `<section class="rowsec"><h2>${t('recent')}</h2><div class="minis">${recent.map(card).join('')}</div></section>` : ''}
    </div>`;
}
function openCert(p, o) {
  const m = $('modal'); m.classList.add('wide');
  $('modalBody').innerHTML = `<div class="m-pad"><div class="m-h"><h2 style="color:#1d1d1f;font-size:20px">${o.doc}</h2><button class="ghost" type="button" data-mclose>${t('close')}</button></div>${certFor(p, o)}</div>`;
  if (!m.open) m.showModal();
}

/* ---------- Home sections ---------- */
function renderAog() {
  $('ticket').innerHTML = `<div class="tk-head"><div><strong>${t('tkTitle')}</strong><span>${t('tkSub')}</span></div><span class="tk-live"><i></i>${t('tkLive')}</span></div>` +
    t('tk').map(([a, b]) => `<div class="tk"><time dir="ltr">${a}</time><span class="dot"></span><span>${b}</span></div>`).join('');
  $('routes').innerHTML = `<h3>${t('routesT')}</h3><ul>${CITIES.slice(0, 6).map(c => `<li><span>${c[S.lang]}</span><span dir="ltr">${c.t}</span></li>`).join('')}</ul><div class="cargo"><span>${t('cargoT')}</span><div>${['emirates', 'dhl', 'fedex', 'ups'].map(k => logo(k, 30)).join('')}</div></div>`;
  animateTicket();
}
let tkTimer = 0;
function animateTicket() {
  clearInterval(tkTimer);
  const rows = [...$('ticket').querySelectorAll('.tk')];
  if (reduced) { rows.forEach(r => r.classList.add('on')); return; }
  let i = 0;
  const step = () => { rows.forEach((r, j) => r.classList.toggle('on', j <= i)); i = (i + 1) % rows.length; };
  step(); tkTimer = setInterval(step, 1500);
}
function renderBento() {
  const p = PARTS[0], sub = p.offers[0].aed, vat = sub * vatRate();
  $('bento').innerHTML = `
  <article class="tile t-inv reveal">${icon('i-invoice', 26)}<h3>${t('invT')}</h3><p>${t('invD')}</p>
    <div class="viz"><div class="inv">
      <div class="inv-h"><span>${t('invNo')}</span><span dir="ltr">${p.pn}</span></div>
      <div class="inv-r"><span>${t('invSub')}</span><span dir="ltr">${money(sub)}</span></div>
      <div class="inv-r"><span>${t('invVat')}</span><span dir="ltr">${money(vat)}</span></div>
      <div class="inv-r tot"><span>${t('invTotal')}</span><span dir="ltr">${money(sub + vat)}</span></div>
    </div></div></article>
  <article class="tile t-lang reveal">${icon('i-lang', 26)}<h3>${t('langT')}</h3><p>${t('langD')}</p>
    <div class="viz bi" dir="ltr">
      <div><span>Tax invoice</span><span>فاتورة ضريبية</span></div>
      <div><span>Packing list</span><span>قائمة التعبئة</span></div>
      <div><span>Quotation</span><span>عرض سعر</span></div>
    </div></article>
  <article class="tile t-air reveal">${icon('i-hangar', 26)}<h3>${t('airT')}</h3><p>${t('airD')}</p>
    <div class="viz air">${t('airN').map(([a, b]) => `<div><strong dir="ltr">${a}</strong><span>${b}</span></div>`).join('')}</div></article>
  <article class="tile t-pay reveal">${icon('i-bank', 26)}<h3>${t('payT')}</h3><p>${t('payD')}</p>
    <div class="viz"><div class="chips">${t('pay').map(x => `<span>${x}</span>`).join('')}</div><div class="paymarks">${['visa', 'mastercard', 'americanexpress', 'applepay'].map(k => logo(k, 34)).join('')}</div></div></article>
  <article class="tile t-zone reveal">${icon('i-stamp', 26)}<h3>${t('zoneT')}</h3><p>${t('zoneD')}</p>
    <ul class="viz zone">${t('zone').map(([a, b]) => `<li><span>${a}</span><span>${b}</span></li>`).join('')}</ul></article>`;
}
let certKind = 'easa';
const certSample = () => { const p = PARTS[0], o = p.offers.find(x => x.c === 'OH') || p.offers[0]; return { p, o: { ...o, doc: certKind === 'faa' ? 'FAA 8130-3' : 'EASA Form 1' } }; };
function renderTrace() {
  const { p, o } = certSample();
  $('certwrap').innerHTML = (certKind === 'faa' ? certFAA : certEASA)(p, o);
  $('certwrap').setAttribute('aria-label', t('docOpen'));
  document.querySelectorAll('[data-cert]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cert === certKind)));
  $('life').innerHTML = t('life').map(([a, b, c]) => `<li><time>${a}</time><div><strong>${b}</strong><span>${c}</span></div></li>`).join('');
}

/* ---------- Cart ---------- */
const cartCount = () => Object.values(S.cart).reduce((a, q) => a + q.qty, 0);
function renderCount() {
  $('cartCount').textContent = cartCount();
  $('savedDot').hidden = !S.saved.length;
}
const saveCart = () => { store('cart', S.cart); renderCount(); };
function lineOf(key) {
  const [pn, oi, type] = key.split('|'), p = byPn(pn);
  if (!p || oi === '') return { key, pn, p: null, unit: 0 };
  const o = p.offers[+oi]; return { key, pn, p, o, type, unit: type === 'ex' ? exUnit(o) : o.aed };
}
let lastAdd = null;
function addToCart(pn, oi, type = 'out', qty = 1) {
  const p = byPn(pn);
  const key = p ? `${pn}|${oi ?? p.offers.indexOf(bestOffer(p))}|${type}` : `${pn}||`;
  S.cart[key] = { qty: (S.cart[key]?.qty || 0) + qty };
  saveCart();
  lastAdd = { key, qty };
  if (p) refreshCards(pn);
}
function totals() {
  let sub = 0, hasUnknown = false;
  for (const [k, q] of Object.entries(S.cart)) { const l = lineOf(k); if (l.p) sub += l.unit * q.qty; else hasUnknown = true; }
  const ship = (t('cShipO').find(x => x[0] === S.ship) || [0, 0, 0])[2];
  const vat = (sub + ship) * vatRate();
  return { sub, ship, vat, total: sub + ship + vat, hasUnknown };
}
function renderDrawer() {
  $('dTitle').textContent = t('dTitle');
  const body = $('dBody'), keys = Object.keys(S.cart);
  if (S.sent) {
    body.innerHTML = `<div class="sent"><h3>${t('sentT')}</h3><p>${t('sentB')(S.sent)}</p><div class="row"><button class="solid" type="button" data-closedrawer>${t('back')}</button><button class="outline" type="button" data-track="${S.sent}">${t('trackIt')}</button></div></div>`;
    return;
  }
  if (!keys.length) { body.innerHTML = `<div class="blank">${t('emptyQ')}<br><button class="solid" type="button" data-closedrawer>${t('browse')}</button></div>`; return; }
  const lines = keys.map(k => {
    const l = lineOf(k), q = S.cart[k].qty;
    return `<div class="cline">${l.p ? `<img src="${photo(l.p)}" alt="">` : '<span class="ph"></span>'}
      <div class="pnn" dir="ltr" style="text-align:start">${esc(l.pn)}</div><div class="amt">${l.p ? money(l.unit * q) : t('por')}</div>
      <div class="nm">${l.p ? `${nameOf(l.p)}, ${t(l.o.c)}${l.type === 'ex' ? `, ${t('pEx')}` : ''}` : t('custom')}</div>
      <div class="qty"><button type="button" data-less="${esc(k)}" aria-label="${t('less')} ${esc(l.pn)}">−</button><span>${q}</span><button type="button" data-moreq="${esc(k)}" aria-label="${t('moreQ')} ${esc(l.pn)}">+</button></div></div>`;
  }).join('');
  const x = totals();
  body.innerHTML = lines +
    `<div class="dform" style="margin-top:18px"><label>${t('cShip')}<select id="shipSel">${t('cShipO').map(([v, l, a]) => `<option value="${v}"${S.ship === v ? ' selected' : ''}>${l}${a ? `, ${money(a)}` : ''}</option>`).join('')}</select></label></div>` +
    `<dl class="sum"><dt>${t('subtotal')}</dt><dd>${money(x.sub)}</dd><dt>${t('ship')}</dt><dd>${money(x.ship)}</dd><dt>${t('vat')}</dt><dd>${money(x.vat)}</dd><dt class="big">${t('total')}</dt><dd class="big">${money(x.total)}</dd></dl>` +
    `<form class="dform" id="dForm"><label>${t('fCompany')}<input type="text" name="company" required autocomplete="organization"></label>
     <label>${t('fContact')}<input type="text" name="contact" required></label>
     <label>${t('fPo')} (${t('opt')})<input type="text" name="po"></label>
     <label>${t('fTail')} (${t('opt')})<input type="text" name="tail"></label>
     <label class="check"><input type="checkbox" name="aog"${S.aogFlag ? ' checked' : ''}>${t('fAog')}</label>
     <button class="solid" type="submit">${t('send')}</button></form>`;
}
const openDrawer = () => { S.sent = null; closePalette(); renderDrawer(); if (!$('drawer').open) $('drawer').showModal(); };
function placeOrder(form) {
  const id = 'SA-' + (10483 + adminState.orders.filter(o => o.mine).length);
  const data = new FormData(form), x = totals();
  const lines = Object.keys(S.cart).map(k => { const l = lineOf(k); return { pn: l.pn, name: l.p ? l.p.en : 'Sourcing request', qty: S.cart[k].qty, aed: l.unit, c: l.o?.c || '' }; });
  adminState.orders.unshift({ id, mine: true, company: data.get('company'), contact: data.get('contact'), po: data.get('po'), tail: data.get('tail'), status: STATUSES[0], lines, total: x.total, aog: !!data.get('aog'), when: 'Just now' });
  saveAdmin(); S.cart = {}; S.aogFlag = false; S.sent = id; saveCart(); renderGrid(); renderDrawer(); admin.refresh();
}

/* ---------- Search palette ---------- */
let palSel = 0, palRows = [];
function palResults() {
  const q = $('palInput').value.trim().toLowerCase();
  if (!q) return (S.recent.length ? S.recent.map(byPn).filter(Boolean) : PARTS).slice(0, 6);
  return PARTS.filter(p => matches(p, q)).slice(0, 30);
}
function renderPalette() {
  palRows = palResults();
  const q = $('palInput').value.trim();
  palSel = clamp(palSel, 0, Math.max(palRows.length - 1, 0));
  $('palList').innerHTML = (palRows.length ? palRows.map((p, i) => `<div class="pal-row${i === palSel ? ' sel' : ''}" role="option" aria-selected="${i === palSel}" data-pal="${i}">
    <img src="${photo(p)}" alt="" loading="lazy"><div class="tx"><strong>${nameOf(p)}</strong><small dir="ltr">${p.pn}</small></div><span class="p">${money(bestOffer(p).aed)}</span></div>`).join('') :
    `<div class="pal-empty">${esc(t('none')(q))}<br><button class="solid" type="button" data-source="${esc(q)}">${t('addSrc')}</button></div>`) +
    (adminState.settings.bulk ? `<button type="button" class="pal-bulk" data-bulk>${t('bulkOpen')}</button>` : '');
  $('palList').querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
}
const openPalette = () => { $('palInput').value = ''; palSel = 0; renderPalette(); if (!$('palette').open) $('palette').showModal(); $('palInput').focus(); };
const closePalette = () => { if ($('palette').open) $('palette').close(); };
const goProduct = pn => { closePalette(); location.hash = 'p-' + pn; };

/* ---------- Modals: bulk list, tracking, saved ---------- */
function showModal(html) { const m = $('modal'); m.classList.remove('wide'); $('modalBody').innerHTML = html; if (!m.open) m.showModal(); }
const mHead = title => `<div class="m-h"><h2>${title}</h2><button class="ghost" type="button" data-mclose>${t('close')}</button></div>`;
function openBulk(aog) {
  closePalette();
  S.aogFlag = !!aog;
  if (aog) S.ship = 'aog';
  showModal(`<div class="m-pad">${mHead(aog ? t('aogBtn') : t('bulkT'))}<p class="m-s">${t('bulkS')}</p>
    <textarea class="m-ta" id="bulkTa" spellcheck="false" dir="ltr" aria-label="${t('bulkT')}" placeholder="${PARTS[0].pn}, 2&#10;${PARTS[40].pn}&#10;${PARTS[70].pn}, 8"></textarea>
    <div class="m-act"><button class="solid" type="button" id="bulkGo">${t('bulkGo')}</button></div><div id="bulkRes"></div></div>`);
  $('bulkTa').focus();
}
let bulkRows = [];
function runBulk() {
  bulkRows = $('bulkTa').value.split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^([A-Za-z0-9\-/]+)[\s,;x]*(\d+)?/);
    if (!m) return null;
    const pn = m[1].toUpperCase(), p = PARTS.find(x => x.pn === pn || x.alts.includes(pn));
    return { pn: p ? p.pn : pn, qty: +m[2] || 1, p, ok: !!(p && stock(p)) };
  }).filter(Boolean);
  const found = bulkRows.filter(r => r.ok).length;
  $('bulkRes').innerHTML = bulkRows.length ? `<div class="bres">${bulkRows.map(r => `<div><span dir="ltr">${r.qty} x ${esc(r.pn)}</span><em class="${r.ok ? 'ok' : ''}">${r.ok ? `${t('bulkYes')}, ${money(bestOffer(r.p).aed)}` : t('bulkNo')}</em></div>`).join('')}</div>
    <p class="bsum">${t('bulkFound')(found)}, ${t('bulkMiss')(bulkRows.length - found)}</p><div class="m-act"><button class="solid" type="button" id="bulkAdd">${t('bulkAdd')}</button></div>` : '';
}
function openTrack(id) {
  closeDrawerIfOpen();
  showModal(`<div class="m-pad">${mHead(t('trackT'))}<p class="m-s">${t('trackS')}</p>
    <form id="trackForm" class="m-in-row"><input class="m-in" id="trackIn" dir="ltr" value="${esc(id || '')}" placeholder="${t('trackPh')}" aria-label="${t('trackS')}"><button class="solid" type="submit">${t('trackGo')}</button></form><div id="trackRes"></div></div>`);
  if (id) runTrack();
}
function runTrack() {
  const v = $('trackIn').value.trim().toUpperCase(), o = adminState.orders.find(x => x.id === v);
  if (!o) { $('trackRes').innerHTML = `<p class="m-s" style="margin-top:14px">${t('trackNone')}</p>`; return; }
  const at = STATUSES.indexOf(o.status);
  $('trackRes').innerHTML = `<ol class="tsteps">${t('trackSteps').map((s, i) => `<li class="${i <= at ? 'on' : ''}">${s}</li>`).join('')}</ol>`;
}
const closeDrawerIfOpen = () => { if ($('drawer').open) $('drawer').close(); };
function openSaved() {
  const list = S.saved.map(byPn).filter(Boolean);
  showModal(`<div class="m-pad">${mHead(t('savedT'))}${list.length ? `<div class="saved-list">${list.map(p => `<a href="#p-${p.pn}" data-mclose><img src="${photo(p)}" alt=""><span><strong>${nameOf(p)}</strong><span dir="ltr">${p.pn}, ${money(bestOffer(p).aed)}</span></span></a>`).join('')}</div>` : `<p class="m-s">${t('savedE')}</p>`}</div>`);
}
function toggleSave(pn) {
  S.saved = S.saved.includes(pn) ? S.saved.filter(x => x !== pn) : [pn, ...S.saved]; store('saved', S.saved); renderCount();
  const on = S.saved.includes(pn);
  document.querySelectorAll(`[data-save="${CSS.escape(pn)}"]`).forEach(b => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', (on ? t('saveR') : t('saveA')) + ' ' + pn); });
}

/* ---------- Toast and menu ---------- */
let toastT = 0;
function toastAdded(p, o) {
  const el = $('toast');
  el.innerHTML = `<img src="${photo(p)}" alt=""><div><strong>${t('added')}</strong><span>${t(o.c)} · ${money(o.aed)}</span></div><button class="ghost small" type="button" data-undo>${t('undo')}</button><button class="solid small" type="button" data-opencart>${t('viewCart')}</button>`;
  el.hidden = false; void el.offsetWidth; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(hideToast, 4200);
}
function hideToast() { const el = $('toast'); el.classList.remove('on'); clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 300); }
function renderMenu() {
  $('menuBody').innerHTML = `<nav class="m-links" aria-label="${t('menu')}">${['navParts', 'navAog', 'navGulf', 'navTrace', 'navFaq'].map((k, i) => `<a href="#${['parts', 'aog', 'gulf', 'trace', 'faq'][i]}" data-mclose-menu>${icon(['i-parts', 'i-headset', 'i-pin', 'i-tag', 'i-help'][i], 22)}${t(k)}</a>`).join('')}<button type="button" class="m-link" data-mtrack>${icon('i-truck', 22)}${t('track')}</button></nav>
    <div class="m-set">
      <div><span>${t('lang')}</span><button class="outline" type="button" data-mlang>${t('langBtn')}</button></div>
      <div><span>${t('cur')}</span><select class="outline" id="menuCur" aria-label="${t('cur')}">${Object.keys(RATES).map(c => `<option${c === S.cur ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
      <div><span>${t('theme')}</span><button class="outline" type="button" data-mtheme>${S.theme === 'light' ? t('themeD') : t('themeL')}</button></div>
    </div>`;
}
function openMenu() { renderMenu(); if (!$('menu').open) $('menu').showModal(); }
$('menu').addEventListener('click', e => {
  if (e.target === $('menu') || e.target.closest('[data-mclose-menu]') || e.target.closest('#menuClose')) { $('menu').close(); return; }
  if (e.target.closest('[data-mlang]')) { $('langBtn').click(); renderMenu(); }
  else if (e.target.closest('[data-mtheme]')) { $('themeBtn').click(); renderMenu(); }
  else if (e.target.closest('[data-mtrack]')) { $('menu').close(); openTrack(); }
});
$('menu').addEventListener('change', e => { if (e.target.id === 'menuCur') { S.cur = e.target.value; store('cur', S.cur); renderStatic(); renderMenu(); } });
// Keep the AOG button off the toolbar and the "show more" button it would cover.
function fabClear() {
  const fab = $('fab'), y = innerHeight - 84;
  const hit = ['.bar-top', '#moreW', '.side-actions'].some(sel => { const el = document.querySelector(sel); if (!el || !el.offsetHeight) return false; const r = el.getBoundingClientRect(); return r.top < innerHeight - 8 && r.bottom > y; });
  fab.classList.toggle('dodge', hit || !$('toast').hidden);
}

/* ---------- Routes ---------- */
let scrollBeforeAdmin = 0;
const admin = createAdmin({ root: $('adminRoot'), state: adminState, save: saveAdmin, onExit: () => leaveOverlay(), onChange: () => renderStatic(),
  onReset: () => { try { ['orders', 'edits', 'settings', 'cart', 'saved', 'recent'].forEach(k => localStorage.removeItem('sirb.' + k)); } catch (e) { /* no storage */ } location.hash = 'admin'; location.reload(); } });
function leaveOverlay() {
  try { history.pushState(null, '', location.pathname + location.search); route(); } catch (e) { location.hash = 'store'; }
}
function closeOverlays() {
  S.pd = null; $('pdp').hidden = true; $('pdp').innerHTML = '';
  if (!$('adminRoot').hidden) { $('adminRoot').hidden = true; $('store').hidden = false; renderSegs(); scrollTo(0, scrollBeforeAdmin); }
  document.documentElement.classList.remove('locked');
}
function route() {
  const h = location.hash.slice(1);
  if (h === 'admin') {
    closeOverlays(); scrollBeforeAdmin = scrollY;
    $('store').hidden = true; $('adminRoot').hidden = false; admin.render();
    document.documentElement.classList.add('locked');
  } else if (h.startsWith('p-')) {
    if (!$('adminRoot').hidden) { $('adminRoot').hidden = true; $('store').hidden = false; }
    openPdp(h.slice(2));
  } else closeOverlays();
}
addEventListener('hashchange', route);

/* ---------- Events ---------- */
document.addEventListener('click', e => {
  const shopEl = e.target.closest('[data-shop]');
  if (shopEl) { e.preventDefault(); closeOverlays(); shop(shopEl.dataset.shop); return; }
  if (e.target === $('drawer')) { $('drawer').close(); return; }
  if (e.target === $('palette')) { closePalette(); return; }
  if (e.target === $('modal')) { $('modal').close(); return; }
  const mc = e.target.closest('[data-mclose]');
  if (mc) { $('modal').close(); if (mc.tagName !== 'A') return; }
  const row = e.target.closest('[data-pal]');
  if (row) { goProduct(palRows[+row.dataset.pal].pn); return; }
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.add) {
    const p = byPn(d.add);
    if (inCart(d.add)) openDrawer();
    else { addToCart(d.add); openDrawer(); }
  }
  else if (d.addo) {
    const [pn, i] = d.addo.split('|'), p = byPn(pn), k = keyOf(pn, +i);
    if (S.cart[k]) openDrawer(); else { addToCart(pn, +i); refreshCards(pn); toastAdded(p, p.offers[+i]); }
  }
  else if (d.copy) {
    navigator.clipboard?.writeText(d.copy).catch(() => {});
    b.classList.add('done'); b.innerHTML = icon('i-check', 14); setTimeout(() => { b.classList.remove('done'); b.innerHTML = icon('i-copy', 14); }, 1400);
  }
  else if ('undo' in d) {
    if (lastAdd && S.cart[lastAdd.key]) { S.cart[lastAdd.key].qty -= lastAdd.qty; if (S.cart[lastAdd.key].qty < 1) delete S.cart[lastAdd.key]; saveCart(); refreshCards(lastAdd.key.split('|')[0]); }
    lastAdd = null; hideToast();
  }
  else if (d.save) toggleSave(d.save);
  else if ('fleet' in d) {
    S.f.fleet = d.fleet; S.page = 1;
    $('fleetSeg').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.fleet === d.fleet)));
    moveThumb($('fleetSeg')); renderGrid();
  }
  else if (d.rm) {
    if (d.rm === 'inStock') S.f.inStock = false; else S.f[d.rm] = S.f[d.rm].filter(x => x !== d.val);
    S.page = 1; renderSide(); renderTiles(); renderGrid();
  }
  else if (b.id === 'clearF' || b.id === 'clearF2') clearFilters();
  else if (b.id === 'moreBtn') { S.page++; renderGrid(); }
  else if (d.view) { S.view = d.view; store('view', S.view); renderGrid(); }
  else if (b.id === 'mFilters') $('side').classList.add('open');
  else if (b.id === 'sideClose' || b.id === 'sideApply') $('side').classList.remove('open');
  else if (d.moreq) { S.cart[d.moreq].qty++; saveCart(); renderDrawer(); }
  else if (d.less) { if (--S.cart[d.less].qty < 1) { delete S.cart[d.less]; refreshCards(d.less.split('|')[0]); } saveCart(); renderDrawer(); }
  else if ('opencart' in d) { hideToast(); closeOverlaysKeepPd(); openDrawer(); }
  else if (b.id === 'menuBtn') openMenu();

  else if ('closedrawer' in d) { S.sent = null; $('drawer').close(); leaveOverlayIfPd(); $('parts').scrollIntoView(); }
  else if ('aog' in d) { openBulk(true); }
  else if ('bulk' in d) openBulk(false);
  else if (d.source) { closePalette(); addToCart(d.source.toUpperCase()); openDrawer(); }
  else if (d.track) openTrack(d.track);
  else if (d.legal) { const [, title, paras] = t('legal').find(x => x[0] === d.legal); showModal(`<div class="m-pad legal">${mHead(title)}${paras.map(x => `<p>${x}</p>`).join('')}</div>`); }
  else if (d.opt !== undefined) { S.pd.oi = +d.opt; S.pd.qty = 1; renderPdpKeep(); }
  else if (d.type) { S.pd.type = d.type; renderPdpKeep(); }
  else if (d.pq) { S.pd.qty = Math.max(1, S.pd.qty + +d.pq); renderPdpKeep(); }
  else if (d.gal) { S.pd.view = +d.gal; renderPdpKeep(); }
  else if (d.tab) { S.pd.tab = d.tab; renderPdpKeep(); }
  else if (d.certopen) { const [pn, i] = d.certopen.split('|'), p = byPn(pn); openCert(p, p.offers[+i]); }
  else if (d.cert) { certKind = d.cert; renderTrace(); }
  else if (b.id === 'certwrap') { const { p, o } = certSample(); openCert(p, o); }
  else if (b.id === 'pdAdd') { const x = S.pd, p = byPn(x.pn); addToCart(p.pn, x.oi, p.rotable && p.offers[x.oi].c !== 'AR' ? x.type : 'out', x.qty); closeOverlaysKeepPd(); openDrawer(); }
  else if (b.id === 'pdBack') { history.length > 1 ? history.back() : leaveOverlay(); }
  else if (b.id === 'bulkGo') runBulk();
  else if (b.id === 'bulkAdd') { bulkRows.forEach(r => addToCart(r.pn, undefined, 'out', r.qty)); $('modal').close(); renderGrid(); openDrawer(); }
});
const closeOverlaysKeepPd = () => {};
function refreshCards(pn) { document.querySelectorAll(`[data-card="${CSS.escape(pn)}"]`).forEach(el => { el.outerHTML = card(byPn(pn)); }); }
const leaveOverlayIfPd = () => { if (S.pd) leaveOverlay(); };
function renderPdpKeep() { const el = $('pdp'), top = el.scrollTop; renderPdp(); el.scrollTop = top; }
document.addEventListener('change', e => {
  const el = e.target, d = el.dataset;
  if (d.f) { const a = S.f[d.f]; S.f[d.f] = el.checked ? [...a, el.value] : a.filter(x => x !== el.value); S.page = 1; renderTiles(); renderGrid(); }
  else if (el.id === 'inStockF') { S.f.inStock = el.checked; S.page = 1; renderGrid(); }
  else if (el.id === 'sortSel') { S.f.sort = el.value; S.page = 1; renderGrid(); }
  else if (el.id === 'shipSel') { S.ship = el.value; renderDrawer(); }
  else if (el.id === 'curSel') { S.cur = el.value; store('cur', S.cur); renderStatic(); }
});
$('catQ').addEventListener('input', e => { S.f.q = e.target.value; S.page = 1; renderGrid(); });
$('cartBtn').onclick = openDrawer;
$('dClose').onclick = () => $('drawer').close();
$('heroSearch').onclick = openPalette; $('navSearch').onclick = openPalette; $('endSearch').onclick = openPalette; $('palClose').onclick = closePalette;
$('heroBulk').onclick = () => openBulk(false); $('footBulk').onclick = () => openBulk(false);
$('footTrack').onclick = () => openTrack(); $('savedBtn').onclick = openSaved;
document.addEventListener('submit', e => {
  if (e.target.id === 'dForm') { e.preventDefault(); placeOrder(e.target); }
  else if (e.target.id === 'trackForm') { e.preventDefault(); runTrack(); }
});
$('langBtn').onclick = () => {
  S.lang = S.lang === 'en' ? 'ar' : 'en'; store('lang', S.lang);
  if (!S.pd) { try { history.replaceState(null, '', S.lang === 'ar' ? '#ar' : location.pathname + location.search); } catch (err) { /* sandboxed viewers */ } }
  renderStatic(); renderGlobeLabels(); sizeStory();
};
$('themeBtn').onclick = () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; store('theme', S.theme); renderTheme(); engineTheme?.(); globe?.redraw(); };
$('palInput').addEventListener('input', () => { palSel = 0; renderPalette(); });
$('palInput').addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { palSel = Math.min(palSel + 1, palRows.length - 1); renderPalette(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { palSel = Math.max(palSel - 1, 0); renderPalette(); e.preventDefault(); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    if (palRows[palSel]) goProduct(palRows[palSel].pn);
    else if ($('palInput').value.trim()) { closePalette(); addToCart($('palInput').value.trim().toUpperCase()); openDrawer(); }
  }
});
addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('palette').open ? closePalette() : openPalette(); }
  else if (e.key === 'Escape' && S.pd && !document.querySelector('dialog[open]')) leaveOverlay();
});

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
let storyTop = 0, storyLen = 1, engineTheme = null;
function sizeStory() { storyTop = story.offsetTop; storyLen = Math.max(story.offsetHeight - innerHeight, 1); }

// Two framings of the same line drawing: the fan head-on, then the whole engine pulled apart.
const SHOTS = {
  wide: [{ pos: [.5, .05, 3.4], tgt: [-1.1, .05, 0], fov: 36, ex: 0 }, { pos: [4.6, .75, 2.2], tgt: [-.3, -.1, -1.3], fov: 33, ex: .14 }, { pos: [6.4, .5, -.8], tgt: [.2, -.8, -1.45], fov: 31, ex: .3 }],
  tall: [{ pos: [0, .25, 4.9], tgt: [0, -1.05, 0], fov: 40, ex: 0 }, { pos: [5, .6, 2.6], tgt: [0, -1, -1.3], fov: 38, ex: .14 }, { pos: [8.2, .4, -1.4], tgt: [0, -1.2, -1.9], fov: 34, ex: .3 }],
};
const ease = x => x * x * (3 - 2 * x), lerp = (a, b, k) => a + (b - a) * k;
function shotAt(p, tall, rtl) {
  const K = SHOTS[tall ? 'tall' : 'wide'], u = ease(clamp(p)) * 2, i = Math.min(Math.floor(u), 1), k = u - i, a = K[i], b = K[i + 1];
  const m = (x, j) => j === 0 && rtl ? -x : x;
  return { pos: a.pos.map((v, j) => m(lerp(v, b.pos[j], k), j)), tgt: a.tgt.map((v, j) => m(lerp(v, b.tgt[j], k), j)), fov: lerp(a.fov, b.fov, k), ex: lerp(a.ex, b.ex, k) };
}

function applyOverlays(p) {
  const out = clamp((p - .12) / .26), hero = $('hero');
  for (const el of [hero, $('facts')]) { el.style.opacity = 1 - out; el.style.transform = `translateY(${-out * 40}px)`; el.style.visibility = out > .99 ? 'hidden' : 'visible'; }
  const b = clamp((p - .55) / .25), beat = $('beat2');
  beat.style.opacity = b; beat.style.transform = `translateY(${(1 - b) * 24}px)`; beat.style.pointerEvents = b > .9 ? 'auto' : 'none';
  const h = clamp((p - .62) / .2);
  $('hotspots').style.opacity = h; $('hotspots').style.visibility = h > .01 ? 'visible' : 'hidden';
  $('fab').classList.toggle('off', p > .02 && p < .99);
}

function setupEngine() {
  const canvas = $('gl');
  const lite = innerWidth < 820 || (navigator.hardwareConcurrency || 8) <= 4;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 3, 9);
  const { engine, modules, rotor, sync } = buildEngine({ lite });
  const { lines, mats } = lineArt(engine, { angle: lite ? 10 : 7 });
  scene.add(engine);
  const lit = {}; // module under a hovered label turns brand blue
  engineTheme = () => {
    const light = S.theme === 'light';
    scene.fog.color.set(light ? 0xffffff : 0x000000);
    for (const [n, m] of Object.entries(mats)) {
      const hot = lit[n] || 0, base = new THREE.Color(light ? 0x1d1d1f : 0xdfe3ea);
      m.color.copy(base).lerp(new THREE.Color(light ? 0x1f6bff : 0x5a96ff), hot);
      m.userData.base = (n === 'fan' ? (light ? .5 : .55) : (light ? .3 : .34)) + hot * .4; m.opacity = m.userData.base;
    }
  };
  engineTheme();
  const groups = { fan: ['fan'], hpc: ['lpc', 'hpc'], combustor: ['combustor'], lpt: ['hpt', 'lpt', 'exhaust'] };
  $('hotspots').addEventListener('pointerover', e => { const k = e.target.closest('[data-mod]')?.dataset.mod; for (const n in mats) lit[n] = 0; (groups[k] || []).forEach(n => { lit[n] = 1; }); engineTheme(); });
  $('hotspots').addEventListener('pointerout', () => { for (const n in mats) lit[n] = 0; engineTheme(); });
  const cam = new THREE.PerspectiveCamera(36, 1, .05, 80);

  let W = 0, H = 0, maxDpr = Math.min(devicePixelRatio || 1, 2);
  const resize = () => {
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W) return;
    renderer.setPixelRatio(maxDpr); renderer.setSize(W, H, false);
    cam.aspect = W / H; cam.updateProjectionMatrix(); sizeStory();
  };
  resize(); addEventListener('resize', resize);

  let px = 0, py = 0, tx = 0, ty = 0;
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
  let pS = clamp((scrollY - storyTop) / storyLen), prev = performance.now(), active = true, spin = 0;
  const start = prev, order = ['fan', 'lpc', 'hpc', 'combustor', 'hpt', 'lpt', 'exhaust', 'shaft'];
  const allLit = {}; for (const n of Object.keys(modules)) allLit[n] = 1;
  const v = new THREE.Vector3(), d3 = new THREE.Vector3();
  let drawn = false;
  const frame = now => {
    requestAnimationFrame(frame);
    if (!active || S.pd || !$('adminRoot').hidden) { prev = now; return; }
    const real = (now - prev) / 1000, dt = Math.min(real, .05); prev = now;
    pS += (clamp((scrollY - storyTop) / storyLen) - pS) * (1 - Math.exp(-Math.min(real, .6) * 6));
    const p = pS, aspect = W / H;
    px += (tx - px) * (1 - Math.exp(-dt * 2.5)); py += (ty - py) * (1 - Math.exp(-dt * 2.5));
    const s = shotAt(p, aspect < 1, S.lang === 'ar');
    cam.fov = s.fov; cam.updateProjectionMatrix();
    cam.position.set(s.pos[0] + px * .25, s.pos[1] - py * .18, s.pos[2]);
    cam.lookAt(...s.tgt);
    const dist = d3.set(...s.pos).distanceTo(v.set(...s.tgt));
    scene.fog.near = dist * .75; scene.fog.far = dist * 2.4;
    sync(s.ex, 1, allLit);
    spin += dt * .12; rotor.rotation.z = spin;
    // Head-on, the core behind the fan stays a faint echo; it comes forward as the engine turns.
    const core = .22 + .78 * ease(clamp(p / .5));
    for (const [n, m] of Object.entries(mats)) m.opacity = m.userData.base * (n === 'fan' ? 1 : core);
    // Draw the lines in on load, fan first, then the core module by module.
    if (!drawn) {
      const el = (now - start) / 1000; let done = true;
      for (const l of lines) {
        const i = Math.max(order.indexOf(l.userData.mod), 0), k = clamp((el - .15 - i * .12) / 2.2);
        const n = Math.floor(l.userData.n * (1 - Math.pow(1 - k, 3)) / 2) * 2;
        l.geometry.setDrawRange(0, n); if (k < 1) done = false;
      }
      drawn = done || reduced;
    }
    renderer.render(scene, cam);
    applyOverlays(p);
    if (p > .55) {
      document.querySelectorAll('.hs').forEach(h => {
        const m = modules[h.dataset.k], a = m.userData.anchor;
        v.set(0, a.y, a.z + m.position.z); engine.localToWorld(v); v.project(cam);
        h.style.setProperty('--len', '22px');
        h.style.transform = `translate(${(v.x * .5 + .5) * W}px,${(-v.y * .5 + .5) * H - 60}px) translate(-50%,0)`;
      });
    }
  };
  new IntersectionObserver(e => { active = e[0].isIntersecting; }, { rootMargin: '10%' }).observe($('stage'));
  requestAnimationFrame(frame);
  canvas.classList.add('on');
}

/* ---------- Boot ---------- */
$('poster').src = poster; $('endImg').src = poster;
document.querySelector('kbd').textContent = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl K';
renderStatic();
function hasWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
if (reduced || !hasWebGL()) document.documentElement.classList.add('static');
else { try { setupEngine(); } catch (err) { console.error(err); document.documentElement.classList.add('static'); } }
sizeStory();
globeCities.forEach(c => { c.label = c[S.lang]; });
globe = createGlobe($('globe'), () => globeCities, reduced, () => S.theme === 'light');
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('pre')));
const onScroll = () => $('nav').classList.toggle('solidnav', scrollY > 40 && (scrollY > storyTop + storyLen - 10 || document.documentElement.classList.contains('static')));
addEventListener('scroll', () => { onScroll(); fabClear(); }, { passive: true }); onScroll();
route();
