// Admin panel: a working front end over in-page data, ready to wire to a real back end.
// Charts are plain SVG/HTML drawn to the container width, with hover and keyboard tooltips.
import { PARTS, CATS, HUBS, photo, stock } from './catalog.js';

const fmt = n => 'AED ' + Math.round(n).toLocaleString('en-US');
const fmtM = n => n >= 1e6 ? `AED ${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M` : n >= 1e3 ? `AED ${Math.round(n / 1e3)}k` : fmt(n);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const pct = (a, b) => b ? Math.round((a / b - 1) * 1000) / 10 : 0;
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const STATUSES = ['Received', 'Certificate check', 'Packed', 'In transit', 'Delivered'];
const CAT_NAME = { gear: 'Landing gear', engine: 'Engine and APU', avionics: 'Avionics', electrical: 'Electrical', systems: 'Hydraulics, fuel, air', safety: 'Safety' };
const CUSTOMERS = [
  ['Falcon Regional Air', 'Airline', 'Dubai, UAE', 41, 2840000], ['Oasis Jet MRO', 'MRO', 'Sharjah, UAE', 67, 3920000], ['Sahara Cargo', 'Cargo airline', 'Riyadh, KSA', 18, 1160000],
  ['Marina Executive Jets', 'Business aviation', 'Dubai, UAE', 12, 640000], ['Red Sea Technics', 'MRO', 'Jeddah, KSA', 29, 1780000], ['Indus Air Services', 'Airline', 'Karachi, Pakistan', 22, 1320000],
  ['Gulf Line Maintenance', 'MRO', 'Doha, Qatar', 34, 2210000], ['Muscat Wings', 'Airline', 'Muscat, Oman', 15, 870000],
];

// Seeded random, so the demo looks the same on every load.
function rng(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ s >>> 15, 2246822519) + 0x9e3779b9 >>> 0) % 1e6) / 1e6; }

export function sampleOrders() {
  const r = rng(7);
  const whens = ['18 min ago', '42 min ago', '2h ago', '4h ago', '6h ago', 'Yesterday', 'Yesterday', '2 days ago', '2 days ago', '3 days ago', '3 days ago', '4 days ago', '5 days ago', '6 days ago', '6 days ago', '1 week ago', '1 week ago', '8 days ago', '9 days ago', '10 days ago'];
  return whens.map((when, i) => {
    const p = PARTS[(i * 13 + 5) % PARTS.length], o = p.offers[0], qty = 1 + Math.floor(r() * 4);
    const st = i < 2 ? 0 : i < 5 ? 1 + (i % 2) : i < 9 ? 2 + (i % 2) : 4;
    return { id: 'SA-' + (10482 - i), company: CUSTOMERS[Math.floor(r() * CUSTOMERS.length)][0], status: STATUSES[st], lines: [{ pn: p.pn, name: p.en, qty, aed: o.aed, c: o.c }], total: o.aed * qty * 1.05, aog: i === 0 || i === 2 || i === 6 || i === 11, when, mins: [18, 42, 120, 240, 360][i] };
  });
}

// Revenue in AED: 12 months, plus 30 daily points, each with the period before for comparison.
const MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const REV_M = [3.1, 3.4, 2.9, 3.8, 4.2, 4.0, 4.6, 4.4, 5.1, 4.9, 5.6, 6.2].map(v => v * 1e6);
const REV_M_PREV = REV_M.map((v, i) => v * (.74 + ((i * 37) % 11) / 100));
const ORD_M = REV_M.map((v, i) => Math.round(v / 1e6 * 41 + (i % 3)));
const DAYS = [], REV_D = [], REV_D_PREV = [], ORD_D = [];
{
  const r = rng(11), end = new Date(Date.UTC(2026, 10, 6));
  for (let i = 29; i >= 0; i--) {
    const d = new Date(end - i * 864e5), wk = d.getUTCDay(), weekend = wk === 0 || wk === 6;
    const base = 2.07e5 * (weekend ? .55 : 1.12) * (.85 + r() * .32) * (1 + (29 - i) / 160);
    DAYS.push(`${d.getUTCDate()} ${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}`);
    REV_D.push(base); REV_D_PREV.push(base * (.78 + r() * .2)); ORD_D.push(Math.max(1, Math.round(base / 2.4e4)));
  }
}
const AOG_REPLY = [19, 16, 22, 14, 12, 17, 15, 13, 11, 18, 14, 12, 10, 14]; // median minutes, last 14 days
const CAT_SHARE = { engine: .31, avionics: .24, gear: .19, systems: .13, electrical: .08, safety: .05 };

const NAV = [['dash', 'Dashboard'], ['orders', 'Orders'], ['aog', 'AOG queue'], ['stock', 'Inventory'], ['certs', 'Certificates'], ['people', 'Customers'], ['settings', 'Settings']];
const ICON = {
  dash: 'M3 3h6v8H3zM11 3h6v5h-6zM11 10h6v7h-6zM3 13h6v4H3z',
  orders: 'M4 3h12v14H4zM7 7h6M7 10h6M7 13h4',
  aog: 'M10 2 18 16H2zM10 8v4M10 14.2v.3',
  stock: 'M3 6l7-3 7 3v8l-7 3-7-3zM3 6l7 3 7-3M10 9v8',
  certs: 'M5 2h7l3 3v13H5zM12 2v3h3M8 9h4M8 12h4',
  people: 'M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 17c0-3 2-5 5-5s5 2 5 5M13 4a3 3 0 0 1 0 5.6M14.5 12c2 .6 3.5 2.4 3.5 5',
  settings: 'M3 6h8M15 6h2M3 14h2M9 14h8M13 4v4M7 12v4',
  up: 'M5 12 10 7l5 5', down: 'M5 8l5 5 5-5', ok: 'M4.5 10.5 8.3 14.3 15.5 6', warn: 'M10 3 18 17H2zM10 8v4M10 14.4v.2', x: 'M5 5l10 10M15 5 5 15', clock: 'M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM10 6v4l3 2',
};
const ic = (k, s = 16) => `<svg viewBox="0 0 20 20" width="${s}" height="${s}" aria-hidden="true"><path d="${ICON[k]}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const niceMax = v => { const p = Math.pow(10, Math.floor(Math.log10(v || 1))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };

export function createAdmin({ root, state, save, onExit, onChange, onReset }) {
  let view = 'dash', q = '', orderOpen = null, range = '30d';
  const ui = { orders: { status: 'all', aog: false, sort: 'placed', dir: 1 }, stock: { cat: 'all', level: 'all', sort: 'pn', dir: 1, page: 0 }, certs: { st: 'all' }, people: { sort: 'ltv', dir: -1 }, table: {} };

  const badge = s => `<span class="st st-${slug(s)}">${s === 'Delivered' || s === 'Approved' ? ic('ok', 12) : s === 'Expires in 30 days' || s === 'Waiting for review' ? ic('clock', 12) : ''}${s}</span>`;
  const open = () => state.orders.filter(o => o.status !== 'Delivered');
  const level = n => n === 0 ? 'out' : n <= 2 ? 'low' : 'ok';
  const lvl = n => { const l = level(n); return `<span class="lv lv-${l}">${ic(l === 'ok' ? 'ok' : l === 'low' ? 'warn' : 'x', 12)}${l === 'ok' ? 'In stock' : l === 'low' ? 'Low' : 'Out'}</span>`; };
  const delta = (a, b, invert) => { const d = pct(a, b), good = invert ? d <= 0 : d >= 0; return `<em class="dl ${good ? 'good' : 'bad'}">${ic(d >= 0 ? 'up' : 'down', 12)}${Math.abs(d).toFixed(1)}%</em>`; };
  const th = (tab, k, l, cls = '') => { const s = ui[tab]; const on = s.sort === k; return `<th class="${cls}" aria-sort="${on ? (s.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button class="sortb${on ? ' on' : ''}" data-sort="${tab}|${k}">${l}<i>${on ? (s.dir > 0 ? '↑' : '↓') : '↕'}</i></button></th>`; };
  const chip = (attr, val, cur, label, n) => `<button class="fchip${cur === val ? ' on' : ''}" ${attr}="${val}" aria-pressed="${cur === val}">${label}${n !== undefined ? `<b>${n}</b>` : ''}</button>`;
  const tableToggle = id => `<button class="tvbtn" data-tv="${id}" aria-pressed="${!!ui.table[id]}">${ui.table[id] ? 'Chart' : 'Table'}</button>`;

  /* ---------- Dashboard ---------- */
  const series = () => range === '12m'
    ? { labels: MONTHS, a: REV_M, b: REV_M_PREV, orders: ORD_M, unit: 'month', prevName: 'Previous year' }
    : { labels: DAYS, a: REV_D, b: REV_D_PREV, orders: ORD_D, unit: 'day', prevName: 'Previous 30 days' };

  function dash() {
    const s = series(), sum = a => a.reduce((x, y) => x + y, 0);
    const rev = sum(s.a), revP = sum(s.b), ord = sum(s.orders), ordP = Math.round(ord * .9);
    const aogOpen = state.orders.filter(o => o.aog && o.status !== 'Delivered');
    const lowN = PARTS.filter(p => stock(p) <= 2).length;
    const kpi = (go, label, val, d, spark, sub) => `<button class="kpi" data-go="${go}"><span>${label}</span><strong>${val}</strong><div class="kpi-f">${d}<small>${sub}</small></div><div class="spark" data-spark="${spark}"></div></button>`;
    return `<header class="a-h"><h1>Dashboard</h1>
        <div class="seg" role="group" aria-label="Period">${[['30d', '30 days'], ['12m', '12 months']].map(([k, l]) => `<button data-range="${k}" aria-pressed="${range === k}">${l}</button>`).join('')}</div>
        <button class="a-btn ghost" data-reset title="Restore the sample orders, stock and settings">Reset demo data</button></header>
      <div class="kpis">
        ${kpi('orders', 'Revenue', fmtM(rev), delta(rev, revP), 'rev', range === '12m' ? 'vs previous year' : 'vs previous 30 days')}
        ${kpi('orders', 'Orders', ord.toLocaleString('en-US'), delta(ord, ordP), 'ord', range === '12m' ? 'vs previous year' : 'vs previous 30 days')}
        ${kpi('aog', 'AOG first reply', '14 min', delta(14, 17, true), 'aog', `median · ${aogOpen.length} open now`)}
        ${kpi('stock', 'Low or out of stock', String(lowN), `<em class="dl ${lowN > 15 ? 'bad' : 'good'}">${ic(lowN > 15 ? 'warn' : 'ok', 12)}${lowN > 15 ? 'Reorder' : 'Healthy'}</em>`, 'stk', `of ${PARTS.length} listed parts`)}
      </div>
      <div class="dgrid">
        <section class="panel span2"><div class="ph"><div><h2>Revenue</h2><p class="pnote">${range === '12m' ? 'By month, last 12 months' : 'By day, last 30 days'} · excl. VAT</p></div>
          <div class="legend"><span><i class="sw a"></i>This period</span><span><i class="sw b"></i>${s.prevName}</span></div>${tableToggle('rev')}</div>
          ${ui.table.rev ? `<div class="mini-tbl"><table><thead><tr><th>${s.unit === 'month' ? 'Month' : 'Day'}</th><th class="num">This period</th><th class="num">${s.prevName}</th><th class="num">Orders</th></tr></thead><tbody>${s.labels.map((l, i) => `<tr><td>${l}</td><td class="num">${fmt(s.a[i])}</td><td class="num">${fmt(s.b[i])}</td><td class="num">${s.orders[i]}</td></tr>`).join('')}</tbody></table></div>`
            : `<div class="cv" data-chart="rev" role="img" aria-label="Revenue ${range === '12m' ? 'by month' : 'by day'}: ${fmtM(rev)} this period against ${fmtM(revP)} before"></div>`}</section>
        <section class="panel"><div class="ph"><div><h2>Order pipeline</h2><p class="pnote">Open orders by step, live</p></div></div>${pipeline()}</section>
        <section class="panel"><div class="ph"><div><h2>Revenue by category</h2><p class="pnote">Share of ${range === '12m' ? '12-month' : '30-day'} revenue</p></div></div>${catBars(rev)}</section>
        <section class="panel"><div class="ph"><div><h2>AOG first reply</h2><p class="pnote">Median minutes per day, last 14 days</p></div>${tableToggle('aog')}</div>
          ${ui.table.aog ? `<div class="mini-tbl"><table><thead><tr><th>Day</th><th class="num">Median reply</th></tr></thead><tbody>${AOG_REPLY.map((v, i) => `<tr><td>${DAYS[16 + i]}</td><td class="num">${v} min</td></tr>`).join('')}</tbody></table></div>`
            : `<div class="cv" data-chart="aog" role="img" aria-label="AOG first reply, median minutes per day, all under the 30 minute target"></div>`}</section>
        <section class="panel"><div class="ph"><div><h2>Units on the shelf</h2><p class="pnote">By airport and category, live</p></div></div>${heat()}</section>
        <section class="panel span2"><div class="ph"><div><h2>Top customers</h2><p class="pnote">Lifetime value</p></div><button class="tvbtn" data-go="people">All customers</button></div>${topCustomers()}</section>
        <section class="panel"><div class="ph"><div><h2>Recent orders</h2><p class="pnote">Click to open</p></div><button class="tvbtn" data-go="orders">All orders</button></div>
          ${state.orders.slice(0, 6).map(o => `<button class="rowbtn" data-order="${o.id}"><span><strong>${o.id}${o.aog ? ' <span class="st st-hot">AOG</span>' : ''}</strong>${esc(o.company)}</span><span class="r">${badge(o.status)}<small>${fmt(o.total)}</small></span></button>`).join('')}</section>
      </div>`;
  }

  function pipeline() {
    const n = STATUSES.map(s => state.orders.filter(o => o.status === s).length), max = Math.max(...n, 1);
    return `<ol class="pipe">${STATUSES.map((s, i) => `<li data-tipx="${esc(`${s}: ${n[i]} order${n[i] === 1 ? '' : 's'}`)}" tabindex="0"><span class="pl">${s}</span><span class="pt"><i class="p${i}" style="width:${n[i] ? Math.max(n[i] / max * 100, 6) : 0}%"></i></span><b>${n[i]}</b></li>`).join('')}</ol>
      <p class="pnote pfoot">${open().length} open · ${n[4]} delivered this week</p>`;
  }
  function catBars(rev) {
    const rows = Object.entries(CAT_SHARE).sort((a, b) => b[1] - a[1]), max = rows[0][1];
    return `<div class="hbars">${rows.map(([c, v]) => `<div class="hb" tabindex="0" data-tipx="${esc(`${CAT_NAME[c]}: ${fmt(rev * v)} · ${Math.round(v * 100)}%`)}"><span class="hl">${CAT_NAME[c]}</span><span class="ht"><i style="width:${v / max * 100}%"></i></span><b>${Math.round(v * 100)}%</b></div>`).join('')}</div>`;
  }
  function heat() {
    const units = HUBS.map(h => CATS.map(c => PARTS.filter(p => p.cat === c).reduce((a, p) => a + p.offers.filter(o => o.from === h).reduce((x, o) => x + o.qty, 0), 0)));
    const max = Math.max(...units.flat(), 1), bin = v => v === 0 ? 0 : Math.min(5, Math.ceil(v / max * 5));
    return `<div class="heat" style="--cols:${CATS.length}"><span></span>${CATS.map(c => `<span class="hx" title="${CAT_NAME[c]}">${CAT_NAME[c].split(/[ ,]/)[0]}</span>`).join('')}
      ${HUBS.map((h, i) => `<span class="hy">${h}</span>${units[i].map((v, j) => `<span class="hc h${bin(v)}" tabindex="0" data-tipx="${esc(`${h} · ${CAT_NAME[CATS[j]]}: ${v} units`)}">${v}</span>`).join('')}`).join('')}</div>
      <div class="hscale"><span>0</span>${[1, 2, 3, 4, 5].map(b => `<i class="h${b}"></i>`).join('')}<span>${max} units</span></div>`;
  }
  function topCustomers() {
    const rows = [...CUSTOMERS].sort((a, b) => b[4] - a[4]).slice(0, 5), max = rows[0][4];
    return `<div class="mini-tbl"><table><thead><tr><th>Company</th><th>Type</th><th class="num">Orders</th><th class="w40">Lifetime value</th></tr></thead><tbody>
      ${rows.map(c => `<tr><td><strong>${c[0]}</strong><small class="sub">${c[2]}</small></td><td>${c[1]}</td><td class="num">${c[3]}</td><td><span class="cellbar"><i style="width:${c[4] / max * 100}%"></i><b>${fmtM(c[4])}</b></span></td></tr>`).join('')}</tbody></table></div>`;
  }

  /* ---------- Orders ---------- */
  function orders() {
    const s = ui.orders, idx = new Map(state.orders.map((o, i) => [o.id, i]));
    let rows = state.orders.filter(o => (!q || (o.id + o.company + o.lines.map(l => l.pn).join(' ')).toLowerCase().includes(q)) && (s.status === 'all' || o.status === s.status) && (!s.aog || o.aog));
    const key = { id: o => o.id, company: o => o.company, items: o => o.lines.reduce((a, l) => a + l.qty, 0), total: o => o.total, placed: o => idx.get(o.id), status: o => STATUSES.indexOf(o.status) }[s.sort];
    rows = [...rows].sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * s.dir; });
    const count = st => state.orders.filter(o => o.status === st).length, sum = rows.reduce((a, o) => a + o.total, 0);
    return `<header class="a-h"><h1>Orders</h1><input class="a-search" data-q type="search" placeholder="Search order, customer or part" value="${esc(q)}" aria-label="Search orders"></header>
      <div class="fbar">${chip('data-fst', 'all', s.status, 'All', state.orders.length)}${STATUSES.map(st => chip('data-fst', st, s.status, st, count(st))).join('')}
        <button class="fchip hot${s.aog ? ' on' : ''}" data-faog aria-pressed="${s.aog}">${ic('warn', 13)}AOG only</button></div>
      <div class="tbl"><table><thead><tr>${th('orders', 'id', 'Order')}${th('orders', 'company', 'Customer')}${th('orders', 'items', 'Items', 'num')}${th('orders', 'total', 'Total', 'num')}${th('orders', 'placed', 'Placed')}${th('orders', 'status', 'Status')}</tr></thead><tbody>
      ${rows.map(o => `<tr data-order="${o.id}" tabindex="0"><td><strong>${o.id}</strong>${o.aog ? ' <span class="st st-hot">AOG</span>' : ''}</td><td>${esc(o.company)}<small class="sub">${esc(o.lines[0]?.pn || '')}</small></td><td class="num">${o.lines.reduce((a, l) => a + l.qty, 0)}</td><td class="num">${fmt(o.total)}</td><td>${esc(o.when)}</td>
        <td><select data-status="${o.id}" aria-label="Status of ${o.id}">${STATUSES.map(st => `<option${st === o.status ? ' selected' : ''}>${st}</option>`).join('')}</select></td></tr>`).join('') || `<tr><td colspan="6" class="none">No orders match. <button class="a-link" data-clear>Clear filters</button></td></tr>`}
      </tbody>${rows.length ? `<tfoot><tr><td colspan="3">${rows.length} order${rows.length === 1 ? '' : 's'}</td><td class="num">${fmt(sum)}</td><td colspan="2"></td></tr></tfoot>` : ''}</table></div>`;
  }

  /* ---------- AOG queue ---------- */
  function aog() {
    const list = state.orders.filter(o => o.aog).sort((a, b) => (a.status === 'Delivered') - (b.status === 'Delivered'));
    return `<header class="a-h"><h1>AOG queue</h1><p class="pnote">Target: first reply within 30 minutes, any hour</p></header>
      <div class="cardsA">${list.map(o => {
        const at = STATUSES.indexOf(o.status), done = o.status === 'Delivered', mins = o.mins ?? 30, late = !done && at === 0 && mins > 30;
        return `<article class="panel aogc${done ? ' done' : ''}"><div class="aogt"><strong>${o.id}</strong>${badge(o.status)}</div>
          <p class="aogco">${esc(o.company)}</p><p class="pnote">${o.lines.map(l => `${l.qty} × ${l.pn}, ${esc(l.name)}`).join('<br>')}</p>
          <div class="sla${late ? ' late' : ''}">${ic('clock', 14)}${done ? 'Closed' : at === 0 ? `Waiting ${mins} min${late ? ' · over target' : ''}` : 'Replied · in progress'}</div>
          <ol class="steps">${STATUSES.map((s, i) => `<li class="${i <= at ? 'on' : ''}" title="${s}"></li>`).join('')}</ol>
          <div class="acts"><button class="a-btn" data-advance="${o.id}" ${done ? 'disabled' : ''}>${done ? 'Delivered' : `Move to ${STATUSES[at + 1]}`}</button><button class="a-btn ghost" data-order="${o.id}">Open</button></div></article>`;
      }).join('') || '<p class="none">No AOG requests right now.</p>'}</div>`;
  }

  /* ---------- Inventory ---------- */
  const PAGE = 15;
  function stockV() {
    const s = ui.stock;
    let rows = PARTS.filter(p => (!q || (p.pn + p.en + p.maker + p.alts.join(' ')).toLowerCase().includes(q)) && (s.cat === 'all' || p.cat === s.cat) && (s.level === 'all' || level(stock(p)) === s.level));
    const key = { pn: p => p.pn, name: p => p.en, qty: p => stock(p), price: p => Math.min(...p.offers.map(o => o.aed)) }[s.sort];
    rows = [...rows].sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * s.dir; });
    const pages = Math.max(1, Math.ceil(rows.length / PAGE)); s.page = clamp(s.page, 0, pages - 1);
    const page = rows.slice(s.page * PAGE, s.page * PAGE + PAGE);
    const cnt = l => PARTS.filter(p => level(stock(p)) === l).length;
    return `<header class="a-h"><h1>Inventory</h1><input class="a-search" data-q type="search" placeholder="Search part number or name" value="${esc(q)}" aria-label="Search inventory"><button class="a-btn" data-new>Add part</button></header>
      <div class="fbar">${chip('data-flv', 'all', s.level, 'All', PARTS.length)}${chip('data-flv', 'ok', s.level, 'In stock', cnt('ok'))}${chip('data-flv', 'low', s.level, 'Low', cnt('low'))}${chip('data-flv', 'out', s.level, 'Out', cnt('out'))}
        <select class="fsel" data-fcat aria-label="Category"><option value="all">All categories</option>${CATS.map(c => `<option value="${c}"${s.cat === c ? ' selected' : ''}>${CAT_NAME[c]}</option>`).join('')}</select>
        <span class="pnote fhint">Edits show in the store straight away.</span></div>
      <div class="tbl"><table><thead><tr><th></th>${th('stock', 'pn', 'Part')}<th>Condition</th><th>Location</th><th>Certificate</th>${th('stock', 'qty', 'Qty')}${th('stock', 'price', 'Price, AED')}<th>Level</th></tr></thead><tbody>
      ${page.map(p => p.offers.map((o, i) => `<tr class="${i === 0 ? 'grp' : ''}">${i === 0 ? `<td rowspan="${p.offers.length}" class="th"><img src="${photo(p)}" alt="" loading="lazy"></td><td rowspan="${p.offers.length}"><strong>${p.pn}</strong><small class="sub">${esc(p.en)}</small></td>` : ''}
        <td><span class="cond c-${o.c}"><i></i>${o.c}</span></td><td>${o.from}</td><td>${o.doc}</td>
        <td><input class="num-in" type="number" min="0" value="${o.qty}" data-qty="${p.pn}|${i}" aria-label="Quantity of ${p.pn} ${o.c}"></td>
        <td><input class="num-in wide" type="number" min="0" step="50" value="${o.aed}" data-price="${p.pn}|${i}" aria-label="Price of ${p.pn} ${o.c}"></td>
        ${i === 0 ? `<td rowspan="${p.offers.length}">${lvl(stock(p))}</td>` : ''}</tr>`).join('')).join('') || `<tr><td colspan="8" class="none">No parts match. <button class="a-link" data-clear>Clear filters</button></td></tr>`}
      </tbody></table></div>
      <div class="pager"><span>${rows.length ? `${s.page * PAGE + 1}–${Math.min(rows.length, s.page * PAGE + PAGE)} of ${rows.length} parts` : '0 parts'}</span>
        <button class="a-btn ghost" data-pg="-1" ${s.page === 0 ? 'disabled' : ''}>Previous</button><button class="a-btn ghost" data-pg="1" ${s.page >= pages - 1 ? 'disabled' : ''}>Next</button></div>`;
  }

  /* ---------- Certificates ---------- */
  const CERT_ST = ['Approved', 'Approved', 'Waiting for review', 'Approved', 'Expires in 30 days'];
  function certs() {
    const all = PARTS.slice(0, 24).map((p, i) => ({ p, st: CERT_ST[i % 5], doc: p.offers.find(o => o.c !== 'AR')?.doc || p.offers[0].doc, day: 1 + (i * 3) % 28 }));
    const rows = all.filter(r => ui.certs.st === 'all' || r.st === ui.certs.st);
    const n = st => all.filter(r => r.st === st).length;
    return `<header class="a-h"><h1>Certificates</h1><button class="a-btn" data-upload>Upload certificate</button></header>
      <div class="ctiles">${[['all', 'All documents', all.length, 'certs'], ['Approved', 'Approved', n('Approved'), 'ok'], ['Waiting for review', 'Waiting for review', n('Waiting for review'), 'clock'], ['Expires in 30 days', 'Expiring soon', n('Expires in 30 days'), 'warn']].map(([k, l, v, i]) => `<button class="ctl${ui.certs.st === k ? ' on' : ''}" data-fcs="${k}" aria-pressed="${ui.certs.st === k}">${ic(i, 18)}<span>${l}</span><strong>${v}</strong></button>`).join('')}</div>
      <div class="tbl"><table><thead><tr><th>Part</th><th>Document</th><th>Issued</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.map(({ p, st, doc, day }) => `<tr><td><strong>${p.pn}</strong><small class="sub">${esc(p.en)}</small></td><td>${doc}</td><td>${String(day).padStart(2, '0')} Oct 2026</td><td>${badge(st)}</td><td class="r"><a class="a-link" href="#p-${p.pn}">View part</a></td></tr>`).join('')}
      </tbody></table></div>`;
  }

  /* ---------- Customers ---------- */
  function people() {
    const s = ui.people, max = Math.max(...CUSTOMERS.map(c => c[4]));
    const key = { name: c => c[0], type: c => c[1], orders: c => c[3], ltv: c => c[4] }[s.sort];
    const rows = CUSTOMERS.filter(c => !q || (c[0] + c[1] + c[2]).toLowerCase().includes(q)).sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * s.dir; });
    return `<header class="a-h"><h1>Customers</h1><input class="a-search" data-q type="search" placeholder="Search customers" value="${esc(q)}" aria-label="Search customers"></header>
      <div class="tbl"><table><thead><tr>${th('people', 'name', 'Company')}${th('people', 'type', 'Type')}<th>Location</th>${th('people', 'orders', 'Orders', 'num')}${th('people', 'ltv', 'Lifetime value', 'w30')}<th>Terms</th></tr></thead><tbody>
      ${rows.map(c => `<tr><td><strong>${c[0]}</strong></td><td>${c[1]}</td><td>${c[2]}</td><td class="num">${c[3]}</td><td><span class="cellbar"><i style="width:${c[4] / max * 100}%"></i><b>${fmtM(c[4])}</b></span></td><td>${c[3] > 25 ? '30-day account' : 'Bank transfer'}</td></tr>`).join('') || '<tr><td colspan="6" class="none">No customers match.</td></tr>'}
      </tbody></table></div>`;
  }

  function settings() {
    const s = state.settings;
    const tog = (k, l, d) => `<label class="tog"><span><strong>${l}</strong><em>${d}</em></span><input type="checkbox" role="switch" data-set="${k}" ${s[k] ? 'checked' : ''}></label>`;
    return `<header class="a-h"><h1>Settings</h1></header>
      <section class="panel setp"><h2>Store</h2>
        ${tog('aogDesk', 'AOG desk open', 'Show the AOG desk as available around the clock')}
        ${tog('usd', 'Show prices in other currencies', 'Let buyers switch from AED to USD, EUR or SAR')}
        ${tog('bulk', 'Bulk parts list', 'Let buyers paste a list of part numbers')}
        <label class="fld">VAT rate, %<input class="num-in wide" type="number" value="${s.vat}" data-setn="vat" min="0" max="100"></label>
      </section>`;
  }

  const views = { dash, orders, aog, stock: stockV, certs, people, settings };

  function orderDrawer() {
    const o = state.orders.find(x => x.id === orderOpen); if (!o) return '';
    const at = STATUSES.indexOf(o.status);
    return `<div class="a-scrim" data-closeorder></div><aside class="a-drawer" role="dialog" aria-label="Order ${o.id}"><div class="ad-h"><div><h2>${o.id}</h2><p class="pnote">${esc(o.company)} · ${esc(o.when)}</p></div><button class="a-btn ghost" data-closeorder>Close</button></div>
      ${o.aog ? `<p class="aogflag">${ic('warn', 14)}Aircraft on ground · reply target 30 min</p>` : ''}
      <div class="adl">${o.lines.map(l => { const p = PARTS.find(x => x.pn === l.pn); return `<div>${p ? `<img src="${photo(p)}" alt="">` : '<span class="ph"></span>'}<span><strong>${esc(l.pn)}</strong><small>${esc(l.name || 'Sourcing request')}${l.c ? ` · ${l.c}` : ''}</small></span><span class="num">${l.qty} × ${l.aed ? fmt(l.aed) : 'To quote'}</span></div>`; }).join('')}</div>
      <p class="adt"><span>Total with VAT</span><strong>${fmt(o.total)}</strong></p>
      <ol class="ads">${STATUSES.map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"><i>${i < at ? ic('ok', 12) : ''}</i>${s}</li>`).join('')}</ol>
      <button class="a-btn" data-advance="${o.id}" ${o.status === 'Delivered' ? 'disabled' : ''}>${o.status === 'Delivered' ? 'Delivered' : `Move to ${STATUSES[at + 1]}`}</button>
      ${o.contact ? `<p class="pnote">Contact: ${esc(o.contact)}${o.po ? `<br>PO: ${esc(o.po)}` : ''}${o.tail ? `<br>Tail or station: ${esc(o.tail)}` : ''}</p>` : ''}
    </aside>`;
  }

  /* ---------- Charts ---------- */
  const tip = () => root.querySelector('#aTip');
  function showTip(html, x, y) { const t = tip(); if (!t) return; t.innerHTML = html; t.hidden = false; const w = t.offsetWidth; t.style.left = clamp(x, w / 2 + 8, innerWidth - w / 2 - 8) + 'px'; t.style.top = Math.max(y, t.offsetHeight + 12) + 'px'; }
  const hideTip = () => { const t = tip(); if (t) t.hidden = true; };

  function lineChart(el) {
    const s = series(), W = el.clientWidth; if (!W) return;
    const H = 260, L = 52, R = 10, T = 12, B = 28, n = s.a.length, top = niceMax(Math.max(...s.a, ...s.b) * 1.05);
    const x = i => L + (W - L - R) * i / (n - 1), y = v => T + (H - T - B) * (1 - v / top);
    const path = a => a.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const ticks = [0, .25, .5, .75, 1].map(k => top * k), every = Math.ceil(n / Math.max(2, Math.floor((W - L) / 70)));
    el.innerHTML = `<svg width="${W}" height="${H}" tabindex="0" aria-hidden="false">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--series)" stop-opacity=".22"/><stop offset="1" stop-color="var(--series)" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v ? (v >= 1e6 ? (v / 1e6).toFixed(v % 1e6 ? 1 : 0) + 'M' : Math.round(v / 1e3) + 'k') : '0'}</text>`).join('')}
      ${s.labels.map((l, i) => (i % every === 0 && n - 1 - i >= every * .7) || i === n - 1 ? `<text class="ax" x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${l}</text>` : '').join('')}
      <path d="${path(s.a)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="url(#ag)"/>
      <path class="lb" d="${path(s.b)}"/><path class="la" d="${path(s.a)}"/>
      <circle class="end" cx="${x(n - 1)}" cy="${y(s.a[n - 1])}" r="4"/>
      <g class="xh" visibility="hidden"><line y1="${T}" y2="${H - B}"/><circle class="db" r="4"/><circle class="da" r="5"/></g>
      <rect class="hit" x="${L}" y="0" width="${W - L - R}" height="${H}" fill="transparent"/></svg>`;
    const svg = el.firstChild, g = svg.querySelector('.xh');
    let cur = -1;
    const at = i => {
      cur = clamp(i, 0, n - 1); g.setAttribute('visibility', 'visible');
      const cx = x(cur); g.querySelector('line').setAttribute('x1', cx); g.querySelector('line').setAttribute('x2', cx);
      const da = g.querySelector('.da'), db = g.querySelector('.db'); da.setAttribute('cx', cx); da.setAttribute('cy', y(s.a[cur])); db.setAttribute('cx', cx); db.setAttribute('cy', y(s.b[cur]));
      const r = svg.getBoundingClientRect(), d = pct(s.a[cur], s.b[cur]);
      showTip(`<strong>${s.labels[cur]}</strong><span><i class="sw a"></i>This period<b>${fmt(s.a[cur])}</b></span><span><i class="sw b"></i>${s.prevName}<b>${fmt(s.b[cur])}</b></span><span class="tdl ${d >= 0 ? 'good' : 'bad'}">${d >= 0 ? '+' : ''}${d}% · ${s.orders[cur]} orders</span>`, r.left + cx, r.top + y(Math.max(s.a[cur], s.b[cur])) - 10);
    };
    const leave = () => { g.setAttribute('visibility', 'hidden'); hideTip(); cur = -1; };
    svg.addEventListener('pointermove', e => { const r = svg.getBoundingClientRect(); at(Math.round((e.clientX - r.left - L) / (W - L - R) * (n - 1))); });
    svg.addEventListener('pointerleave', leave);
    svg.addEventListener('blur', leave);
    svg.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); at((cur < 0 ? n - 1 : cur) + (e.key === 'ArrowRight' ? 1 : -1)); } });
    svg.addEventListener('focus', () => at(n - 1));
  }

  function colChart(el) {
    const W = el.clientWidth; if (!W) return;
    const H = 200, L = 34, R = 8, T = 14, B = 26, n = AOG_REPLY.length, top = 40, target = 30;
    const bw = (W - L - R) / n, y = v => T + (H - T - B) * (1 - v / top);
    el.innerHTML = `<svg width="${W}" height="${H}">
      ${[0, 10, 20, 30, 40].map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
      <line class="target" x1="${L}" x2="${W - R}" y1="${y(target)}" y2="${y(target)}"/><text class="tlab" x="${W - R}" y="${y(target) - 6}" text-anchor="end">Target 30 min</text>
      ${AOG_REPLY.map((v, i) => { const w = Math.min(bw - 4, 22), cx = L + bw * i + bw / 2; return `<g class="col" data-i="${i}" tabindex="0"><rect class="hitc" x="${L + bw * i}" y="${T}" width="${bw}" height="${H - T - B}" fill="transparent"/><path class="bar${i === n - 1 ? ' now' : ''}" d="M${cx - w / 2},${y(0)}V${y(v) + 4}a4,4 0 0 1 4,-4h${w - 8}a4,4 0 0 1 4,4V${y(0)}Z"/>${i % 2 === 1 || i === n - 1 ? `<text class="ax" x="${cx}" y="${H - 8}" text-anchor="middle">${DAYS[16 + i].split(' ')[0]}</text>` : ''}</g>`; }).join('')}</svg>`;
    el.querySelectorAll('.col').forEach(c => {
      const show = () => { const i = +c.dataset.i, r = c.getBoundingClientRect(); showTip(`<strong>${DAYS[16 + i]}</strong><span>Median first reply<b>${AOG_REPLY[i]} min</b></span>`, r.left + r.width / 2, r.top + (y(AOG_REPLY[i]) - T) - 6); };
      c.addEventListener('pointerenter', show); c.addEventListener('focus', show); c.addEventListener('pointerleave', hideTip); c.addEventListener('blur', hideTip);
    });
  }

  function spark(el, k) {
    const W = el.clientWidth, H = 34; if (!W) return;
    const s = series(), data = k === 'rev' ? s.a : k === 'ord' ? s.orders : k === 'aog' ? AOG_REPLY : [24, 22, 21, 19, 20, 18, 17, PARTS.filter(p => stock(p) <= 2).length];
    const mx = Math.max(...data), mn = Math.min(...data), x = i => 2 + (W - 4) * i / (data.length - 1), y = v => 3 + (H - 6) * (1 - (v - mn) / ((mx - mn) || 1));
    const d = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    el.innerHTML = `<svg width="${W}" height="${H}" aria-hidden="true"><path d="${d}L${x(data.length - 1)},${H}L${x(0)},${H}Z" class="sa"/><path d="${d}" class="sl"/><circle cx="${x(data.length - 1)}" cy="${y(data[data.length - 1])}" r="2.5" class="se"/></svg>`;
  }

  function drawCharts() {
    root.querySelectorAll('[data-chart="rev"]').forEach(lineChart);
    root.querySelectorAll('[data-chart="aog"]').forEach(colChart);
    root.querySelectorAll('[data-spark]').forEach(el => spark(el, el.dataset.spark));
  }

  function render() {
    hideTip();
    root.innerHTML = `<div class="admin">
      <aside class="a-side">
        <a class="logo" href="#" data-exit aria-label="Back to the store"><svg width="24" height="19"><use href="#i-logo"/></svg><span>SIRB Admin</span></a>
        <nav aria-label="Admin">${NAV.map(([k, l]) => `<button class="${view === k ? 'on' : ''}" data-go="${k}" ${view === k ? 'aria-current="page"' : ''}><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="${ICON[k]}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></svg>${l}${k === 'aog' ? (n => n ? `<i class="cnt">${n}</i>` : '')(state.orders.filter(o => o.aog && o.status !== 'Delivered').length) : ''}</button>`).join('')}</nav>
        <a class="a-back" href="#" data-exit>Back to the store</a>
      </aside>
      <main class="a-main">${views[view]()}</main>
      ${orderDrawer()}
      <div class="a-tip" id="aTip" role="status" hidden></div>
      <div class="a-toast" id="aToast" role="status" hidden></div>
    </div>`;
    drawCharts();
  }

  const toast = msg => {
    const t = root.querySelector('#aToast'); if (!t) return;
    t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600);
  };
  const keepScroll = fn => { const m = root.querySelector('.a-main'), top = m ? m.scrollTop : 0; fn(); const m2 = root.querySelector('.a-main'); if (m2) m2.scrollTop = top; };
  const advance = id => {
    const o = state.orders.find(x => x.id === id); if (!o) return;
    const i = STATUSES.indexOf(o.status); if (i < STATUSES.length - 1) o.status = STATUSES[i + 1];
    save(); keepScroll(render); toast(`${id} moved to ${o.status}`);
    if (orderOpen) root.querySelector('.a-drawer [data-advance]:not([disabled])')?.focus() ?? root.querySelector('.a-drawer [data-closeorder]')?.focus();
  };

  root.addEventListener('click', e => {
    const t = e.target.closest('[data-go],[data-order],[data-closeorder],[data-advance],[data-exit],[data-new],[data-upload],[data-reset],[data-range],[data-tv],[data-sort],[data-fst],[data-faog],[data-flv],[data-fcs],[data-pg],[data-clear]');
    if (!t || e.target.closest('select,input')) return;
    const d = t.dataset;
    if ('exit' in d) { e.preventDefault(); hideTip(); onExit(); }
    else if ('reset' in d) onReset?.();
    else if (d.go) { view = d.go; q = ''; orderOpen = null; render(); root.querySelector('.a-main').scrollTop = 0; }
    else if (d.advance) advance(d.advance);
    else if (d.order) { orderOpen = d.order; keepScroll(render); root.querySelector('.a-drawer [data-closeorder]')?.focus(); }
    else if ('closeorder' in d) { orderOpen = null; keepScroll(render); }
    else if (d.range) { range = d.range; keepScroll(render); }
    else if (d.tv) { ui.table[d.tv] = !ui.table[d.tv]; keepScroll(render); }
    else if (d.sort) { const [tab, k] = d.sort.split('|'), s = ui[tab]; s.dir = s.sort === k ? -s.dir : (k === 'total' || k === 'ltv' || k === 'qty' || k === 'orders' ? -1 : 1); s.sort = k; keepScroll(render); }
    else if (d.fst) { ui.orders.status = d.fst; keepScroll(render); }
    else if ('faog' in d) { ui.orders.aog = !ui.orders.aog; keepScroll(render); }
    else if (d.flv) { ui.stock.level = d.flv; ui.stock.page = 0; keepScroll(render); }
    else if (d.fcs) { ui.certs.st = d.fcs; keepScroll(render); }
    else if (d.pg) { ui.stock.page += +d.pg; render(); root.querySelector('.a-main').scrollTop = 0; }
    else if ('clear' in d) { q = ''; Object.assign(ui.orders, { status: 'all', aog: false }); Object.assign(ui.stock, { cat: 'all', level: 'all', page: 0 }); render(); }
    else if ('new' in d) toast('The part editor connects when the store goes live.');
    else if ('upload' in d) toast('Certificate uploads connect when the store goes live.');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && orderOpen && !root.hidden) { orderOpen = null; keepScroll(render); }
  });
  root.addEventListener('keydown', e => {
    const tr = e.target.closest?.('tr[data-order]');
    if (tr && (e.key === 'Enter' || e.key === ' ') && e.target === tr) { e.preventDefault(); orderOpen = tr.dataset.order; keepScroll(render); }
  });
  root.addEventListener('input', e => {
    const d = e.target.dataset;
    if ('q' in d) {
      q = e.target.value.trim().toLowerCase(); ui.stock.page = 0;
      const pos = e.target.selectionStart; render();
      const inp = root.querySelector('[data-q]'); if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (err) { /* search inputs in some browsers */ } }
    }
  });
  root.addEventListener('change', e => {
    const d = e.target.dataset;
    if (d.status) { const o = state.orders.find(x => x.id === d.status); if (!o) return; o.status = e.target.value; save(); keepScroll(render); toast(`${o.id} set to ${o.status}`); }
    else if ('fcat' in d) { ui.stock.cat = e.target.value; ui.stock.page = 0; keepScroll(render); }
    else if (d.qty || d.price) {
      const [pn, i] = (d.qty || d.price).split('|'); const p = PARTS.find(x => x.pn === pn), o = p?.offers[+i]; if (!o) return;
      const v = Math.max(0, Math.round(+e.target.value) || 0); e.target.value = v;
      if (d.qty) o.qty = v; else o.aed = v;
      state.edits[pn] = p.offers.map(x => [x.qty, x.aed]); save(); onChange(); toast(`${pn} updated in the store`);
      const cell = e.target.closest('tr'); if (d.qty && cell) keepScroll(render);
    } else if (d.set) { state.settings[d.set] = e.target.checked; save(); onChange(); toast('Setting saved'); }
    else if (d.setn) { const v = clamp(Math.round(+e.target.value) || 0, 0, 100); e.target.value = v; state.settings[d.setn] = v; save(); onChange(); toast('Setting saved'); }
  });
  // Simple hover/focus tooltips for HTML marks (bars, heat cells, pipeline rows).
  const tipx = e => { const el = e.target.closest?.('[data-tipx]'); if (!el) return; const r = el.getBoundingClientRect(); showTip(`<span>${el.dataset.tipx}</span>`, r.left + r.width / 2, r.top - 4); };
  root.addEventListener('pointerover', tipx);
  root.addEventListener('focusin', tipx);
  root.addEventListener('pointerout', e => { if (e.target.closest?.('[data-tipx]')) hideTip(); });
  root.addEventListener('focusout', e => { if (e.target.closest?.('[data-tipx]')) hideTip(); });
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { if (!root.hidden && root.firstChild) drawCharts(); }); });

  return { render, refresh: () => { if (root.firstChild) keepScroll(render); } };
}
