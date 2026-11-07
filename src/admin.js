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

const NAV = [['dash', 'Dashboard'], ['Sales'], ['orders', 'Orders'], ['aog', 'AOG queue'], ['people', 'Customers'], ['Catalogue'], ['stock', 'Inventory'], ['certs', 'Certificates'], ['System'], ['settings', 'Settings']];
const ICON = {
  dash: 'M3 3h6v8H3zM11 3h6v5h-6zM11 10h6v7h-6zM3 13h6v4H3z',
  orders: 'M4 3h12v14H4zM7 7h6M7 10h6M7 13h4',
  aog: 'M10 2 18 16H2zM10 8v4M10 14.2v.3',
  stock: 'M3 6l7-3 7 3v8l-7 3-7-3zM3 6l7 3 7-3M10 9v8',
  certs: 'M5 2h7l3 3v13H5zM12 2v3h3M8 9h4M8 12h4',
  people: 'M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 17c0-3 2-5 5-5s5 2 5 5M13 4a3 3 0 0 1 0 5.6M14.5 12c2 .6 3.5 2.4 3.5 5',
  settings: 'M3 6h8M15 6h2M3 14h2M9 14h8M13 4v4M7 12v4',
  plane: 'M10 2.5c.6 0 1 .7 1 1.6v4l5.5 3.2v1.5L11 11v3.6l1.6 1.2v1.3L10 16.5l-2.6.6v-1.3L9 14.6V11l-5.5 1.8v-1.5L9 8.1v-4c0-.9.4-1.6 1-1.6z',
  wrench: 'M12.5 3.2a4 4 0 0 0-4.8 5.3L3.2 13a1.6 1.6 0 0 0 2.3 2.3l4.5-4.5a4 4 0 0 0 5.3-4.8l-2.4 2.4-2.1-.4-.4-2.1z',
  box: 'M10 2.8 3.5 6v8L10 17.2 16.5 14V6zM3.5 6 10 9.2 16.5 6M10 9.2v8',
  jet: 'M2.5 11.5 16 7.8a1.6 1.6 0 0 1 .9 3l-3 1.2-4.6 4h-1.8l2.4-3.2-4.5 1.6-1.6 1.4H2.6l1.2-2.6z',
  bolt: 'M11 2.5 4.5 11h4.6l-.8 6.5L15 9h-4.6z',
  pin: 'M10 17.5s-5-4.4-5-8.5a5 5 0 0 1 10 0c0 4.1-5 8.5-5 8.5zM10 7.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z',
  tag: 'M2.8 10 6.6 5.5h9.1a.8.8 0 0 1 .8.8v7.4a.8.8 0 0 1-.8.8H6.6zM7.2 9.2a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6z',
  user: 'M10 9.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM3.8 17c.5-3 3-5 6.2-5s5.7 2 6.2 5',
  cal: 'M3.5 5h13v11.5h-13zM3.5 8.5h13M7 3v3.5M13 3v3.5',
  hash: 'M7.5 3 6 17M14 3l-1.5 14M3.5 7.5h13M3 12.5h13',
  coin: 'M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM12.4 7.6c-.5-.7-1.3-1-2.4-1-1.4 0-2.3.7-2.3 1.7 0 2.4 4.8 1.2 4.8 3.6 0 1-1 1.7-2.5 1.7-1.2 0-2.1-.4-2.6-1.2M10 5.2v1.4M10 13.6V15',
  spark: 'M10 2.5l1.6 4.6 4.9 1.6-4.9 1.6L10 15l-1.6-4.7-4.9-1.6 4.9-1.6zM15.5 13.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z',
  list: 'M7 5h10M7 10h10M7 15h10M3.5 5h.1M3.5 10h.1M3.5 15h.1',
  route: 'M5 16.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM15 7.1a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM6.8 14.7h5.7a2.6 2.6 0 0 0 0-5.2h-5a2.6 2.6 0 0 1 0-5.2h5.7',
  bell: 'M5 13.5V9a5 5 0 0 1 10 0v4.5l1.5 1.5h-13zM8.2 17a1.9 1.9 0 0 0 3.6 0',
  up: 'M5 12 10 7l5 5', down: 'M5 8l5 5 5-5', ok: 'M4.5 10.5 8.3 14.3 15.5 6', warn: 'M10 3 18 17H2zM10 8v4M10 14.4v.2', x: 'M5 5l10 10M15 5 5 15', clock: 'M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM10 6v4l3 2',
};
const ic = (k, s = 16) => `<svg viewBox="0 0 20 20" width="${s}" height="${s}" aria-hidden="true"><path d="${ICON[k]}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const csym = (c, sz = 18) => `<svg width="${sz}" height="${sz}" aria-hidden="true"><use href="#i-c-${c}"/></svg>`;
const TYPE_ICON = { Airline: 'plane', MRO: 'wrench', 'Cargo airline': 'box', 'Business aviation': 'jet' };
const niceMax = v => { const p = Math.pow(10, Math.floor(Math.log10(v || 1))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };

export function createAdmin({ root, state, save, onExit, onChange, onReset }) {
  let view = 'dash', q = '', orderOpen = null, range = '30d';
  const ui = { orders: { status: 'all', aog: false, sort: 'placed', dir: 1 }, stock: { cat: 'all', level: 'all', sort: 'pn', dir: 1, page: 0 }, certs: { st: 'all' }, people: { sort: 'ltv', dir: -1 }, table: {} };

  const badge = s => { const i = STATUSES.indexOf(s); return i >= 0 ? `<span class="st st-stage"><i class="c${i + 1}"></i>${s}</span>` : `<span class="st st-${slug(s)}">${s === 'Approved' ? ic('ok', 12) : s === 'Waiting for review' ? ic('clock', 12) : s.startsWith('Expires') ? ic('warn', 12) : ''}${s}</span>`; };
  const open = () => state.orders.filter(o => o.status !== 'Delivered');
  const level = n => n === 0 ? 'out' : n <= 2 ? 'low' : 'ok';
  const lvl = n => { const l = level(n); return `<span class="lv lv-${l}">${ic(l === 'ok' ? 'ok' : l === 'low' ? 'warn' : 'x', 12)}${l === 'ok' ? 'In stock' : l === 'low' ? 'Low' : 'Out'}</span>`; };
  const delta = (a, b, invert) => { const d = pct(a, b), good = invert ? d <= 0 : d >= 0; return `<em class="dl ${good ? 'good' : 'bad'}">${ic(d >= 0 ? 'up' : 'down', 12)}${Math.abs(d).toFixed(1)}%</em>`; };
  const th = (tab, k, l, cls = '') => { const s = ui[tab]; const on = s.sort === k; return `<th class="${cls}" aria-sort="${on ? (s.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button class="sortb${on ? ' on' : ''}" data-sort="${tab}|${k}">${l}<i>${on ? (s.dir > 0 ? '↑' : '↓') : '↕'}</i></button></th>`; };
  const chip = (attr, val, cur, label, n) => `<button class="fchip${cur === val ? ' on' : ''}" ${attr}="${val}" aria-pressed="${cur === val}">${label}${n !== undefined ? `<b>${n}</b>` : ''}</button>`;
  const tableToggle = id => `<button class="tvbtn" data-tv="${id}" aria-pressed="${!!ui.table[id]}">${ui.table[id] ? 'Chart' : 'Table'}</button>`;

  /* ---------- Dashboard ---------- */
  // Colour follows the entity: each category, airport and order step keeps one slot everywhere.
  const CAT_SLOT = { gear: 1, engine: 2, avionics: 3, electrical: 4, systems: 5, safety: 6 };
  const HUB_SLOT = { DXB: 1, DWC: 2, SHJ: 3 };
  const HUB_SHARE = { DXB: .46, DWC: .35, SHJ: .19 };
  const GOAL = { '30d': 7.5e6, '12m': 60e6 };
  const metricOf = () => ui.metric || 'rev';
  const series = () => {
    const m12 = range === '12m', base = m12 ? { labels: MONTHS, a: REV_M, b: REV_M_PREV, orders: ORD_M, unit: 'month', prevName: 'Previous year' } : { labels: DAYS, a: REV_D, b: REV_D_PREV, orders: ORD_D, unit: 'day', prevName: 'Previous 30 days' };
    if (metricOf() === 'ord') return { ...base, a: base.orders, b: base.orders.map((v, i) => Math.round(v * (.82 + ((i * 7) % 9) / 50))), money: false };
    return { ...base, money: true };
  };
  const sum = a => a.reduce((x, y) => x + y, 0);
  const T = (icon, text) => `<h2 class="pt2"><i class="pti">${ic(icon, 15)}</i>${text}</h2>`;
  const dot = (cls, label) => `<span class="ldot"><i class="${cls}"></i>${label}</span>`;
  const STAGE_SLOT = STATUSES.map((_, i) => 'c' + (i + 1));
  const initials = n => n.split(/\s+/).slice(0, 2).map(w => w[0]).join('');
  const custSlot = name => { const i = CUSTOMERS.findIndex(c => c[0] === name); return 'c' + ((i < 0 ? name.length : i) % 6 + 1); };

  // Big money: whole part large, scale and decimals small, like a banking balance.
  const big = (v, money = true) => {
    if (!money) return `<span class="bn">${Math.round(v).toLocaleString('en-US')}</span>`;
    const [w, d] = (v >= 1e6 ? (v / 1e6).toFixed(2) : (v / 1e3).toFixed(1)).split('.');
    return `<span class="cur">AED</span><span class="bn">${(+w).toLocaleString('en-US')}</span><span class="dec">.${d}${v >= 1e6 ? 'M' : 'k'}</span>`;
  };
  function dash() {
    const base = range === '12m' ? { a: REV_M, b: REV_M_PREV, o: ORD_M } : { a: REV_D, b: REV_D_PREV, o: ORD_D };
    const rev = sum(base.a), revP = sum(base.b), ord = sum(base.o), ordP = Math.round(ord * .9), aov = rev / ord, aovP = revP / ordP;
    const aogOpen = state.orders.filter(o => o.aog && o.status !== 'Delivered');
    const s = series(), money = metricOf() !== 'ord', heroV = money ? rev : ord, heroP = money ? revP : ordP;
    const now = new Date(), hr = +now.toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Dubai' });
    const hello = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    const mini = (go, icon, label, val, d, spark) => `<button class="kpi" data-go="${go}"><span class="kh"><i class="kic">${ic(icon, 16)}</i>${label}</span><strong>${val}</strong><div class="kpi-f">${d}</div><div class="spark" data-spark="${spark}"></div></button>`;
    return `<header class="a-h dash-h"><div><p class="hello">${hello}</p><h1>Overview</h1></div>
        <span class="live"><i></i>Live</span>
        <button class="a-btn ghost round" data-export>${ic('orders', 15)}Export</button></header>
      <div class="dgrid">
        <section class="panel dhero g8">
          <div class="hero-top"><div class="pills" role="tablist">${[['rev', 'Revenue'], ['ord', 'Orders']].map(([k, l]) => `<button role="tab" data-metric="${k}" aria-selected="${metricOf() === k}">${l}</button>`).join('')}</div>
            <div class="pills" role="group" aria-label="Period">${[['30d', '1M'], ['12m', '1Y']].map(([k, l]) => `<button data-range="${k}" aria-pressed="${range === k}">${l}</button>`).join('')}</div></div>
          <p class="hero-l">${ic(money ? 'coin' : 'orders', 14)}${money ? 'Revenue' : 'Orders'} · ${range === '12m' ? 'last 12 months' : 'last 30 days'}${money ? ', excl. VAT' : ''}</p>
          <div class="hero-n">${big(heroV, money)}</div>
          <div class="hero-d">${delta(heroV, heroP)}<span>${money ? fmtM(Math.abs(heroV - heroP)) : Math.abs(heroV - heroP)} ${heroV >= heroP ? 'more' : 'less'} than ${s.prevName.toLowerCase()}</span>${tableToggle('rev')}</div>
          ${ui.table.rev ? `<div class="mini-tbl"><table><thead><tr><th>${s.unit === 'month' ? 'Month' : 'Day'}</th><th class="num">This period</th><th class="num">${s.prevName}</th></tr></thead><tbody>${s.labels.map((l, i) => `<tr><td>${l}</td><td class="num">${s.money ? fmt(s.a[i]) : s.a[i]}</td><td class="num">${s.money ? fmt(s.b[i]) : s.b[i]}</td></tr>`).join('')}</tbody></table></div>`
            : `<div class="cv" data-chart="rev" role="img" aria-label="${money ? 'Revenue' : 'Orders'} ${range === '12m' ? 'by month' : 'by day'} against the previous period"></div>
               <div class="legend sm"><span><i class="sw a"></i>This period</span><span><i class="sw b"></i>${s.prevName}</span></div>`}
        </section>
        <div class="g4 stack">
          <section class="panel">${goal(rev)}</section>
          <section class="panel insights">${T('spark', 'Insights')}${insights(rev, revP)}</section>
        </div>
        <div class="g12 kpis k3">
          ${mini('orders', 'orders', 'Orders', ord.toLocaleString('en-US'), delta(ord, ordP), 'ord')}
          ${mini('orders', 'stock', 'Average order', fmtM(aov), delta(aov, aovP), 'aov')}
          ${mini('aog', 'clock', 'AOG first reply', '14 min', delta(14, 17, true), 'aog')}
        </div>
        <section class="panel g6"><div class="ph"><div>${T('coin', 'Sales by category')}<p class="pnote">${range === '12m' ? 'Last 12 months' : 'Last 30 days'}</p></div></div>${catDonut(rev)}</section>
        <section class="panel g6"><div class="ph"><div>${T('bell', 'Needs attention')}<p class="pnote">${aogOpen.length ? `${aogOpen.length} AOG open` : 'All clear'}</p></div></div>${attention()}</section>
        <section class="panel g6"><div class="ph"><div>${T('orders', 'Recent orders')}</div><button class="tvbtn" data-go="orders">See all</button></div>${txList()}</section>
        <section class="panel g6"><div class="ph"><div>${T('clock', 'Activity')}<p class="pnote">Last 24 hours</p></div></div>${activity()}</section>
      </div>`;
  }

  function insights(rev, revP) {
    const top = Object.entries(CAT_SHARE).sort((a, b) => b[1] - a[1])[0];
    const rows = [
      ['good', 'up', `Revenue ${pct(rev, revP) >= 0 ? 'up' : 'down'} ${Math.abs(pct(rev, revP))}%`, `Best ${range === '12m' ? 'year' : 'month'} on record so far`],
      ['n', 'stock', `${CAT_NAME[top[0]]} lead sales`, `${Math.round(top[1] * 100)}% of revenue, ${fmtM(rev * top[1])}`],
      ['good', 'clock', 'AOG replies 3 min faster', 'Median 14 min, target 30'],
      ['n', 'people', 'Oasis Jet MRO is your top buyer', '67 orders, AED 3.92M lifetime'],
      ['warning', 'certs', '5 certificates expire this month', 'Renew before the parts can ship'],
    ];
    return `<div class="ins">${rows.map(([c, i, t, d]) => `<div class="in"><i class="fi ${c}">${ic(i, 14)}</i><span><strong>${t}</strong><small>${d}</small></span></div>`).join('')}</div>`;
  }

  function catDonut(rev) {
    const rows = Object.entries(CAT_SHARE).sort((a, b) => b[1] - a[1]), R = 62, C = 2 * Math.PI * R, gap = 3;
    let off = 0;
    const arcs = rows.map(([c, v]) => { const len = Math.max(C * v - gap, 0); const el = `<circle cx="80" cy="80" r="${R}" class="arc c${CAT_SLOT[c]}" stroke-dasharray="${len.toFixed(1)} ${(C - len).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 80 80)" tabindex="0" data-tipx="${esc(`${CAT_NAME[c]}: ${fmt(rev * v)} · ${Math.round(v * 100)}%`)}"/>`; off += C * v; return el; }).join('');
    return `<div class="donut"><svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="${rows.map(([c, v]) => `${CAT_NAME[c]} ${Math.round(v * 100)}%`).join(', ')}">${arcs}<text x="80" y="76" text-anchor="middle" class="dt">${fmtM(rev)}</text><text x="80" y="96" text-anchor="middle" class="ds">total</text></svg>
      <ul class="dl2">${rows.map(([c, v]) => `<li><i class="cico c${CAT_SLOT[c]}">${csym(c, 22)}</i><span>${CAT_NAME[c]}</span><b>${fmtM(rev * v)}</b><em>${Math.round(v * 100)}%</em></li>`).join('')}</ul></div>`;
  }

  function txList() {
    const groups = {};
    state.orders.slice(0, 7).forEach(o => { const g = /min|h ago|Just/.test(o.when) ? 'Today' : o.when === 'Yesterday' ? 'Yesterday' : 'Earlier'; (groups[g] ||= []).push(o); });
    return Object.entries(groups).map(([g, list]) => `<p class="txg">${g}</p>${list.map(o => { const p = PARTS.find(x => x.pn === o.lines[0]?.pn); return `<button class="tx" data-order="${o.id}"><span class="cico lg c${p ? CAT_SLOT[p.cat] : 1}">${p ? csym(p.cat, 26) : ic('box', 18)}</span><span class="rb"><strong>${esc(o.company)}${o.aog ? ' <span class="st st-hot">' + ic('bolt', 11) + 'AOG</span>' : ''}</strong><small>${esc(p ? p.en : o.lines[0]?.name || '')} · ${o.id}</small></span><span class="amt">${fmt(o.total)}<small>${badge(o.status)}</small></span></button>`; }).join('')}`).join('');
  }

  function attention() {
    const aogWait = state.orders.filter(o => o.aog && o.status === 'Received').length, aogOpen = state.orders.filter(o => o.aog && o.status !== 'Delivered').length;
    const n = { ok: 0, low: 0, out: 0 }; PARTS.forEach(p => { n[level(stock(p))]++; });
    const certCheck = state.orders.filter(o => o.status === 'Certificate check').length;
    const rows = [
      [aogOpen ? 'critical' : 'good', aogOpen ? 'warn' : 'ok', aogOpen ? `${aogOpen} AOG order${aogOpen > 1 ? 's' : ''} open` : 'No AOG orders open', aogWait ? `${aogWait} waiting for a first reply` : 'All replied within target', 'data-go="aog"'],
      [n.out ? 'critical' : 'good', n.out ? 'x' : 'ok', `${n.out} part${n.out === 1 ? '' : 's'} out of stock`, `${n.low} more running low`, 'data-golv="out"'],
      ['warning', 'clock', '5 certificates expire soon', 'Within the next 30 days', 'data-gocert="1"'],
      [certCheck ? 'warning' : 'good', certCheck ? 'certs' : 'ok', `${certCheck} order${certCheck === 1 ? '' : 's'} in certificate check`, 'Paperwork before release', 'data-gost="Certificate check"'],
    ];
    return `<div class="attn">${rows.map(([c, i, t, d, go]) => `<button class="at" ${go}><i class="fi ${c}">${ic(i, 14)}</i><span><strong>${t}</strong><small>${d}</small></span><b aria-hidden="true">›</b></button>`).join('')}</div>`;
  }

  function goal(rev) {
    const g = GOAL[range], k = clamp(rev / g, 0, 1), r = 30, c = 2 * Math.PI * r;
    return `<div class="goal2"><svg viewBox="0 0 72 72" width="72" height="72" role="img" aria-label="${Math.round(k * 100)} percent of target"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a96ff"/><stop offset="1" stop-color="#8f7bff"/></linearGradient></defs><circle cx="36" cy="36" r="${r}" class="gtrack"/><circle cx="36" cy="36" r="${r}" class="gfill" stroke="url(#gg)" stroke-dasharray="${(c * k).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 36 36)"/><text x="36" y="41" text-anchor="middle" class="gpct">${Math.round(k * 100)}%</text></svg>
      <div><p class="pnote">${range === '12m' ? 'Annual' : 'Monthly'} target</p><strong class="gv">${fmtM(rev)} <small>of ${fmtM(g)}</small></strong><span class="gtag ${k >= .8 ? 'good' : 'warning'}">${ic(k >= .8 ? 'ok' : 'clock', 12)}${k >= .8 ? `On track · ${fmtM(Math.max(g - rev, 0))} to go` : 'Behind'}</span></div></div>`;
  }
  function pipeline() {
    const n = STATUSES.map(st => state.orders.filter(o => o.status === st).length), tot = Math.max(sum(n), 1);
    return `<div class="segbar thin" role="img" aria-label="${STATUSES.map((st, i) => `${st} ${n[i]}`).join(', ')}">${STATUSES.map((st, i) => n[i] ? `<span class="${STAGE_SLOT[i]}" style="flex:${n[i]}" tabindex="0" data-tipx="${esc(`${st}: ${n[i]} · ${Math.round(n[i] / tot * 100)}%`)}"></span>` : '').join('')}</div>
      <ol class="pipe">${STATUSES.map((st, i) => `<li><span class="ldot"><i class="${STAGE_SLOT[i]}"></i>${st}</span><span class="pp">${Math.round(n[i] / tot * 100)}%</span><b>${n[i]}</b></li>`).join('')}</ol>
      <p class="pnote pfoot">${open().length} open · ${n[4]} delivered</p>`;
  }
  function catBars(rev) {
    const rows = Object.entries(CAT_SHARE).sort((a, b) => b[1] - a[1]), max = rows[0][1];
    return `<div class="hbars">${rows.map(([c, v]) => `<div class="hb" tabindex="0" data-tipx="${esc(`${CAT_NAME[c]}: ${fmt(rev * v)} · ${Math.round(v * 100)}%`)}"><span class="hl">${CAT_NAME[c]}</span><span class="ht"><i style="width:${v / max * 100}%"></i></span><b>${fmtM(rev * v)}</b></div>`).join('')}</div>`;
  }
  const replyBadge = v => v < 15 ? `<span class="sb good">${ic('ok', 12)}Fast</span>` : v <= 30 ? `<span class="sb warning">${ic('clock', 12)}OK</span>` : `<span class="sb critical">${ic('warn', 12)}Late</span>`;
  function stockHealth() {
    const n = { ok: 0, low: 0, out: 0 }; PARTS.forEach(p => { n[level(stock(p))]++; });
    const parts = [['ok', 'good', 'In stock'], ['low', 'warning', 'Low'], ['out', 'critical', 'Out']];
    return `<div class="segbar thin" role="img" aria-label="${parts.map(([k, , l]) => `${l} ${n[k]}`).join(', ')}">${parts.map(([k, c, l]) => n[k] ? `<span class="${c}" style="flex:${n[k]}" tabindex="0" data-tipx="${esc(`${l}: ${n[k]} parts`)}"></span>` : '').join('')}</div>
      <div class="sh3">${parts.map(([k, c, l]) => `<button class="shc" data-golv="${k}"><span class="ldot"><i class="${c}"></i>${l}</span><strong>${n[k]}</strong></button>`).join('')}</div>`;
  }
  function heat() {
    const units = HUBS.map(h => CATS.map(c => PARTS.filter(p => p.cat === c).reduce((a, p) => a + p.offers.filter(o => o.from === h).reduce((x, o) => x + o.qty, 0), 0)));
    const max = Math.max(...units.flat(), 1), bin = v => v === 0 ? 0 : Math.min(5, Math.ceil(v / max * 5));
    return `<h3 class="ptl">Units by airport and category</h3><div class="heat" style="--cols:${CATS.length}"><span></span>${CATS.map(c => `<span class="hx" title="${CAT_NAME[c]}">${{ gear: 'Gear', engine: 'Eng', avionics: 'Avio', electrical: 'Elec', systems: 'Sys', safety: 'Safe' }[c]}</span>`).join('')}
      ${HUBS.map((h, i) => `<span class="hy">${h}</span>${units[i].map((v, j) => `<span class="hc h${bin(v)}" tabindex="0" data-tipx="${esc(`${h} · ${CAT_NAME[CATS[j]]}: ${v} units`)}">${v}</span>`).join('')}`).join('')}</div>
      <div class="hscale"><span>0</span>${[1, 2, 3, 4, 5].map(b => `<i class="h${b}"></i>`).join('')}<span>${max}</span></div>`;
  }
  function activity() {
    const o = state.orders;
    const items = [
      ['critical', 'warn', `AOG request ${o[0]?.id || ''}`, `${esc(o[0]?.company || '')} · A320 brake`, '18 min'],
      ['n', 'orders', `New order ${o[1]?.id || ''}`, `${esc(o[1]?.company || '')} · ${fmt(o[1]?.total || 0)}`, '42 min'],
      ['good', 'ok', 'Certificate approved', 'EASA Form 1 · CB-7924-22', '1 h'],
      ['n', 'dash', 'Payment received', `Oasis Jet MRO · ${fmt(286400)}`, '3 h'],
      ['warning', 'stock', 'Stock running low', 'GN-8234-06 · 0 left at SHJ', '5 h'],
      ['n', 'people', 'New customer', 'Muscat Wings · Airline', '9 h'],
    ];
    return `<ol class="feed">${items.map(([c, i, t, d, w]) => `<li><i class="fi ${c}">${ic(i, 14)}</i><div><strong>${t}</strong><span>${d}</span></div><time>${w}</time></li>`).join('')}</ol>`;
  }


  /* ---------- Orders ---------- */
  function orders() {
    const s = ui.orders, idx = new Map(state.orders.map((o, i) => [o.id, i]));
    let rows = state.orders.filter(o => (!q || (o.id + o.company + o.lines.map(l => l.pn).join(' ')).toLowerCase().includes(q)) && (s.status === 'all' || o.status === s.status) && (!s.aog || o.aog));
    const key = { id: o => o.id, company: o => o.company, items: o => o.lines.reduce((a, l) => a + l.qty, 0), total: o => o.total, placed: o => idx.get(o.id), status: o => STATUSES.indexOf(o.status) }[s.sort];
    rows = [...rows].sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * s.dir; });
    const count = st => state.orders.filter(o => o.status === st).length, sum = rows.reduce((a, o) => a + o.total, 0);
    return `<header class="a-h"><h1>Orders</h1><input class="a-search" data-q type="search" placeholder="Search order, customer or part" value="${esc(q)}" aria-label="Search orders"></header>
      <section class="panel strip"><div class="ph"><div>${T('route', 'Order pipeline')}<p class="pnote">All orders by step, live</p></div></div>${pipeline()}</section>
      <div class="fbar">${chip('data-fst', 'all', s.status, 'All', state.orders.length)}${STATUSES.map(st => chip('data-fst', st, s.status, st, count(st))).join('')}
        <button class="fchip hot${s.aog ? ' on' : ''}" data-faog aria-pressed="${s.aog}">${ic('warn', 13)}AOG only</button></div>
      <div class="tbl"><table><thead><tr>${th('orders', 'id', 'Order')}${th('orders', 'company', 'Customer')}${th('orders', 'items', 'Items', 'num')}${th('orders', 'total', 'Total', 'num')}${th('orders', 'placed', 'Placed')}${th('orders', 'status', 'Status')}</tr></thead><tbody>
      ${rows.map(o => `<tr data-order="${o.id}" tabindex="0"><td><strong>${o.id}</strong>${o.aog ? ' <span class="st st-hot">' + ic('bolt', 11) + 'AOG</span>' : ''}</td><td><span class="who"><i class="tico">${ic(TYPE_ICON[(CUSTOMERS.find(c => c[0] === o.company) || [, 'Airline'])[1]] || 'user', 15)}</i><span>${esc(o.company)}<small class="sub">${esc(o.lines[0]?.pn || '')}</small></span></span></td><td class="num">${o.lines.reduce((a, l) => a + l.qty, 0)}</td><td class="num">${fmt(o.total)}</td><td><span class="meta">${ic('clock', 13)}${esc(o.when)}</span></td>
        <td><select data-status="${o.id}" aria-label="Status of ${o.id}">${STATUSES.map(st => `<option${st === o.status ? ' selected' : ''}>${st}</option>`).join('')}</select></td></tr>`).join('') || `<tr><td colspan="6" class="none">No orders match. <button class="a-link" data-clear>Clear filters</button></td></tr>`}
      </tbody>${rows.length ? `<tfoot><tr><td colspan="3">${rows.length} order${rows.length === 1 ? '' : 's'}</td><td class="num">${fmt(sum)}</td><td colspan="2"></td></tr></tfoot>` : ''}</table></div>`;
  }

  /* ---------- AOG queue ---------- */
  function aog() {
    const list = state.orders.filter(o => o.aog).sort((a, b) => (a.status === 'Delivered') - (b.status === 'Delivered'));
    return `<header class="a-h"><h1>AOG queue</h1><p class="pnote">Target: first reply within 30 minutes, any hour</p></header>
      <section class="panel strip"><div class="ph"><div>${T('clock', 'First reply')}<p class="pnote">Median minutes per day, last 14 days</p></div>${tableToggle('aog')}</div>
        ${ui.table.aog ? `<div class="mini-tbl"><table><thead><tr><th>Day</th><th class="num">Median reply</th><th>Status</th></tr></thead><tbody>${AOG_REPLY.map((v, i) => `<tr><td>${DAYS[16 + i]}</td><td class="num">${v} min</td><td>${replyBadge(v)}</td></tr>`).join('')}</tbody></table></div>`
          : `<div class="cv" data-chart="aog" role="img" aria-label="AOG first reply, median minutes per day against a 30 minute target"></div><div class="legend sm">${dot('good', 'Under 15 min')}${dot('warning', '15–30 min')}${dot('critical', 'Over target')}</div>`}</section>
      <div class="cardsA">${list.map(o => {
        const at = STATUSES.indexOf(o.status), done = o.status === 'Delivered', mins = o.mins ?? 30, late = !done && at === 0 && mins > 30;
        return `<article class="panel aogc${done ? ' done' : ''}"><div class="aogt"><strong>${o.id}</strong>${badge(o.status)}</div>
          <ul class="kv"><li>${ic(TYPE_ICON[(CUSTOMERS.find(c => c[0] === o.company) || [, 'Airline'])[1]] || 'user', 14)}<span>${esc(o.company)}</span></li>${o.lines.map(l => { const p = PARTS.find(x => x.pn === l.pn); return `<li>${p ? csym(p.cat, 14) : ic('box', 14)}<span>${l.qty} × ${esc(l.name)} <small>${l.pn}</small></span></li>`; }).join('')}<li>${ic('coin', 14)}<span>${fmt(o.total)}</span></li></ul>
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
      <div class="strip2"><section class="panel"><div class="ph"><div>${T('stock', 'Stock health')}<p class="pnote">${PARTS.length} listed parts, live</p></div></div>${stockHealth()}</section><section class="panel"><div class="ph"><div>${T('pin', 'Units by airport')}<p class="pnote">By category, live</p></div></div>${heat().replace('<h3 class="ptl">Units by airport and category</h3>', '')}</section></div>
      <div class="fbar">${chip('data-flv', 'all', s.level, 'All', PARTS.length)}${chip('data-flv', 'ok', s.level, 'In stock', cnt('ok'))}${chip('data-flv', 'low', s.level, 'Low', cnt('low'))}${chip('data-flv', 'out', s.level, 'Out', cnt('out'))}
        <select class="fsel" data-fcat aria-label="Category"><option value="all">All categories</option>${CATS.map(c => `<option value="${c}"${s.cat === c ? ' selected' : ''}>${CAT_NAME[c]}</option>`).join('')}</select>
        <span class="pnote fhint">Edits show in the store straight away.</span></div>
      <div class="tbl"><table><thead><tr><th></th>${th('stock', 'pn', 'Part')}<th>Condition</th><th>Location</th><th>Certificate</th>${th('stock', 'qty', 'Qty')}${th('stock', 'price', 'Price, AED')}<th>Level</th></tr></thead><tbody>
      ${page.map(p => p.offers.map((o, i) => `<tr class="${i === 0 ? 'grp' : ''}">${i === 0 ? `<td rowspan="${p.offers.length}" class="th"><img src="${photo(p)}" alt="" loading="lazy"></td><td rowspan="${p.offers.length}"><strong>${p.pn}</strong><small class="sub"><span class="meta">${csym(p.cat, 13)}${esc(p.en)}</span></small></td>` : ''}
        <td><span class="cond c-${o.c}"><i></i>${o.c}</span></td><td><span class="meta">${ic('pin', 13)}${o.from}</span></td><td><span class="meta">${ic('tag', 13)}${o.doc}</span></td>
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
      ${rows.map(({ p, st, doc, day }) => `<tr><td><strong>${p.pn}</strong><small class="sub">${esc(p.en)}</small></td><td><span class="meta">${ic('certs', 13)}${doc}</span></td><td><span class="meta">${ic('cal', 13)}${String(day).padStart(2, '0')} Oct 2026</span></td><td>${badge(st)}</td><td class="r"><a class="a-link" href="#p-${p.pn}">View part</a></td></tr>`).join('')}
      </tbody></table></div>`;
  }

  /* ---------- Customers ---------- */
  function people() {
    const s = ui.people, max = Math.max(...CUSTOMERS.map(c => c[4]));
    const key = { name: c => c[0], type: c => c[1], orders: c => c[3], ltv: c => c[4] }[s.sort];
    const rows = CUSTOMERS.filter(c => !q || (c[0] + c[1] + c[2]).toLowerCase().includes(q)).sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * s.dir; });
    return `<header class="a-h"><h1>Customers</h1><input class="a-search" data-q type="search" placeholder="Search customers" value="${esc(q)}" aria-label="Search customers"></header>
      <div class="tbl"><table><thead><tr>${th('people', 'name', 'Company')}${th('people', 'type', 'Type')}<th>Location</th>${th('people', 'orders', 'Orders', 'num')}${th('people', 'ltv', 'Lifetime value', 'w30')}<th>Terms</th></tr></thead><tbody>
      ${rows.map(c => `<tr><td><span class="who"><span class="av ${custSlot(c[0])}">${initials(c[0])}</span><strong>${c[0]}</strong></span></td><td><span class="tp tp-${slug(c[1])}">${ic(TYPE_ICON[c[1]] || 'user', 12)}${c[1]}</span></td><td><span class="meta">${ic('pin', 13)}${c[2]}</span></td><td class="num">${c[3]}</td><td><span class="cellbar"><i style="width:${c[4] / max * 100}%"></i><b>${fmtM(c[4])}</b></span></td><td>${c[3] > 25 ? '30-day account' : 'Bank transfer'}</td></tr>`).join('') || '<tr><td colspan="6" class="none">No customers match.</td></tr>'}
      </tbody></table></div>`;
  }

  function settings() {
    const s = state.settings;
    const tog = (k, l, d) => `<label class="tog"><span><strong>${l}</strong><em>${d}</em></span><input type="checkbox" role="switch" data-set="${k}" ${s[k] ? 'checked' : ''}></label>`;
    return `<header class="a-h"><h1>Settings</h1></header>
      <section class="panel setp">${T('settings', 'Store')}
        ${tog('aogDesk', 'AOG desk open', 'Show the AOG desk as available around the clock')}
        ${tog('usd', 'Show prices in other currencies', 'Let buyers switch from AED to USD, EUR or SAR')}
        ${tog('bulk', 'Bulk parts list', 'Let buyers paste a list of part numbers')}
        <label class="fld">VAT rate, %<input class="num-in wide" type="number" value="${s.vat}" data-setn="vat" min="0" max="100"></label>
      </section>
      <section class="panel setp" style="margin-top:12px">${T('dash', 'Demo data')}<div class="fld"><span><strong>Reset the demo</strong><em class="sub">Restores sample orders, stock and settings</em></span><button class="a-btn ghost" data-reset>Reset demo data</button></div></section>`;
  }

  const views = { dash, orders, aog, stock: stockV, certs, people, settings };

  function orderDrawer() {
    const o = state.orders.find(x => x.id === orderOpen); if (!o) return '';
    const at = STATUSES.indexOf(o.status);
    return `<div class="a-scrim" data-closeorder></div><aside class="a-drawer" role="dialog" aria-label="Order ${o.id}"><div class="ad-h"><div><h2>${o.id}</h2><p class="pnote">${esc(o.company)} · ${esc(o.when)}</p></div><button class="a-btn ghost" data-closeorder>Close</button></div>
      ${o.aog ? `<p class="aogflag">${ic('warn', 14)}Aircraft on ground · reply target 30 min</p>` : ''}
      <dl class="kvg"><div><dt>${ic('user', 13)}Customer</dt><dd>${esc(o.company)}</dd></div><div><dt>${ic('clock', 13)}Placed</dt><dd>${esc(o.when)}</dd></div><div><dt>${ic('hash', 13)}PO</dt><dd>${esc(o.po || '—')}</dd></div><div><dt>${ic('plane', 13)}Tail or station</dt><dd>${esc(o.tail || '—')}</dd></div><div><dt>${ic('route', 13)}Status</dt><dd>${badge(o.status)}</dd></div><div><dt>${ic('coin', 13)}Payment</dt><dd>${STATUSES.indexOf(o.status) >= 3 ? 'Paid' : 'Invoice sent'}</dd></div></dl>
      <div class="adl">${o.lines.map(l => { const p = PARTS.find(x => x.pn === l.pn); return `<div>${p ? `<img src="${photo(p)}" alt="">` : '<span class="ph"></span>'}<span><strong>${esc(l.pn)}</strong><small>${esc(l.name || 'Sourcing request')}${l.c ? ` · ${l.c}` : ''}</small></span><span class="num">${l.qty} × ${l.aed ? fmt(l.aed) : 'To quote'}</span></div>`; }).join('')}</div>
      <p class="adt"><span>Total with VAT</span><strong>${fmt(o.total)}</strong></p>
      <ol class="ads">${STATUSES.map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"><i>${i < at ? ic('ok', 12) : ''}</i>${s}</li>`).join('')}</ol>
      <button class="a-btn" data-advance="${o.id}" ${o.status === 'Delivered' ? 'disabled' : ''}>${o.status === 'Delivered' ? 'Delivered' : `Move to ${STATUSES[at + 1]}`}</button>
      ${o.contact ? `<p class="pnote">${ic('mail' in ICON ? 'mail' : 'user', 13)} ${esc(o.contact)}</p>` : ''}
    </aside>`;
  }

  /* ---------- Charts ---------- */
  const tip = () => root.querySelector('#aTip');
  function showTip(html, x, y) { const t = tip(); if (!t) return; t.innerHTML = html; t.hidden = false; const w = t.offsetWidth; t.style.left = clamp(x, w / 2 + 8, innerWidth - w / 2 - 8) + 'px'; t.style.top = Math.max(y, t.offsetHeight + 12) + 'px'; }
  const hideTip = () => { const t = tip(); if (t) t.hidden = true; };

  function lineChart(el) {
    const s = series(), W = el.clientWidth; if (!W) return;
    const H = 240, L = 0, R = 0, T = 16, B = 26, n = s.a.length, top = niceMax(Math.max(...s.a, ...s.b) * 1.08);
    const x = i => L + 6 + (W - L - R - 12) * i / (n - 1), y = v => T + (H - T - B) * (1 - v / top);
    // Smooth curve through the points (Catmull-Rom to cubic Bezier), so the line reads like a banking app.
    const path = a => { const p = a.map((v, i) => [x(i), y(v)]); let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`; for (let i = 0; i < p.length - 1; i++) { const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2, t = .18; d += `C${(p1[0] + (p2[0] - p0[0]) * t).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) * t).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) * t).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) * t).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`; } return d; };
    const every = Math.ceil(n / Math.max(2, Math.floor(W / 90)));
    el.innerHTML = `<svg width="${W}" height="${H}" tabindex="0" aria-hidden="false">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a96ff" stop-opacity=".32"/><stop offset=".7" stop-color="#8f7bff" stop-opacity=".04"/><stop offset="1" stop-color="#8f7bff" stop-opacity="0"/></linearGradient>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3987e5"/><stop offset="1" stop-color="#8f7bff"/></linearGradient>
        <filter id="glow" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      ${[.5, 1].map(k => `<line class="grid" x1="0" x2="${W}" y1="${y(top * k)}" y2="${y(top * k)}"/><text class="ax" x="2" y="${y(top * k) - 6}" text-anchor="start">${s.money ? fmtM(top * k) : Math.round(top * k)}</text>`).join('')}
      <line class="base" x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}"/>
      ${s.labels.map((l, i) => (i % every === 0 && n - 1 - i >= every * .7) || i === n - 1 ? `<text class="ax" x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${l}</text>` : '').join('')}
      <path d="${path(s.a)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="url(#ag)"/>
      <path class="lb" d="${path(s.b)}"/><path class="la" d="${path(s.a)}" stroke="url(#lg)" filter="url(#glow)"/>
      <circle class="end" cx="${x(n - 1)}" cy="${y(s.a[n - 1])}" r="5"/>
      <g class="xh" visibility="hidden"><line y1="${T}" y2="${H - B}"/><circle class="db" r="4"/><circle class="da" r="6"/></g>
      <rect class="hit" x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>`;
    const svg = el.firstChild, g = svg.querySelector('.xh');
    let cur = -1;
    const at = i => {
      cur = clamp(i, 0, n - 1); g.setAttribute('visibility', 'visible');
      const cx = x(cur); g.querySelector('line').setAttribute('x1', cx); g.querySelector('line').setAttribute('x2', cx);
      const da = g.querySelector('.da'), db = g.querySelector('.db'); da.setAttribute('cx', cx); da.setAttribute('cy', y(s.a[cur])); db.setAttribute('cx', cx); db.setAttribute('cy', y(s.b[cur]));
      const r = svg.getBoundingClientRect(), d = pct(s.a[cur], s.b[cur]);
      const f = v => s.money ? fmt(v) : `${v} orders`;
      showTip(`<strong>${s.labels[cur]}</strong><span><i class="sw a"></i>This period<b>${f(s.a[cur])}</b></span><span><i class="sw b"></i>${s.prevName}<b>${f(s.b[cur])}</b></span><span class="tdl ${d >= 0 ? 'good' : 'bad'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}% vs before</span>`, r.left + cx, r.top + y(Math.max(s.a[cur], s.b[cur])) - 10);
    };
    const leave = () => { g.setAttribute('visibility', 'hidden'); hideTip(); cur = -1; };
    svg.addEventListener('pointermove', e => { const r = svg.getBoundingClientRect(); at(Math.round((e.clientX - r.left - 6) / (W - 12) * (n - 1))); });
    svg.addEventListener('pointerleave', leave);
    svg.addEventListener('blur', leave);
    svg.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); at((cur < 0 ? n - 1 : cur) + (e.key === 'ArrowRight' ? 1 : -1)); } });
    svg.addEventListener('focus', () => at(n - 1));
  }

  function colChart(el) {
    const W = el.clientWidth; if (!W) return;
    const H = 190, L = 30, R = 6, T = 16, B = 24, n = AOG_REPLY.length, top = 40, target = 30;
    const bw = (W - L - R) / n, y = v => T + (H - T - B) * (1 - v / top), cls = v => v < 15 ? 'good' : v <= 30 ? 'warning' : 'critical';
    el.innerHTML = `<svg width="${W}" height="${H}">
      ${[0, 15, 30].map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
      <line class="target" x1="${L}" x2="${W - R}" y1="${y(target)}" y2="${y(target)}"/><text class="tlab" x="${W - R}" y="${y(target) - 6}" text-anchor="end">Target 30 min</text>
      ${AOG_REPLY.map((v, i) => { const w = Math.min(bw - 4, 18), cx = L + bw * i + bw / 2; return `<g class="col" data-i="${i}" tabindex="0"><rect x="${L + bw * i}" y="${T}" width="${bw}" height="${H - T - B}" fill="transparent"/><path class="bar ${cls(v)}" d="M${cx - w / 2},${y(0)}V${y(v) + 4}a4,4 0 0 1 4,-4h${w - 8}a4,4 0 0 1 4,4V${y(0)}Z"/>${(i % 3 === 0 && n - 1 - i >= 2) || i === n - 1 ? `<text class="ax" x="${cx}" y="${H - 7}" text-anchor="middle">${DAYS[16 + i].split(' ')[0]}</text>` : ''}</g>`; }).join('')}</svg>`;
    el.querySelectorAll('.col').forEach(c => {
      const show = () => { const i = +c.dataset.i, r = c.getBoundingClientRect(); showTip(`<strong>${DAYS[16 + i]}</strong><span>Median first reply<b>${AOG_REPLY[i]} min</b></span>${replyBadge(AOG_REPLY[i])}`, r.left + r.width / 2, r.top + (y(AOG_REPLY[i]) - T) - 6); };
      c.addEventListener('pointerenter', show); c.addEventListener('focus', show); c.addEventListener('pointerleave', hideTip); c.addEventListener('blur', hideTip);
    });
  }

  function spark(el, k) {
    const W = el.clientWidth, H = 36; if (!W) return;
    const b = range === '12m' ? { a: REV_M, o: ORD_M } : { a: REV_D, o: ORD_D };
    const data = k === 'rev' ? b.a : k === 'ord' ? b.o : k === 'aov' ? b.a.map((v, i) => v / b.o[i]) : AOG_REPLY;
    const mx = Math.max(...data), mn = Math.min(...data), x = i => (W) * i / (data.length - 1), y = v => 4 + (H - 8) * (1 - (v - mn) / ((mx - mn) || 1));
    const d = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(''), id = 'sg' + k;
    el.innerHTML = `<svg width="${W}" height="${H}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path d="${d}L${W},${H}L0,${H}Z" fill="url(#${id})"/><path d="${d}" class="sl"/></svg>`;
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
        <a class="logo" href="#" data-exit aria-label="Back to the store"><svg class="mk" width="24" height="24" aria-hidden="true"><use href="#i-mark"/></svg><span>AEROLINX <em>Admin</em></span></a>
        <nav aria-label="Admin">${NAV.map(([k, l]) => !l ? `<p class="navg">${k}</p>` : `<button class="${view === k ? 'on' : ''}" data-go="${k}" ${view === k ? 'aria-current="page"' : ''}><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="${ICON[k]}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></svg>${l}${k === 'aog' ? (n => n ? `<i class="cnt">${n}</i>` : '')(state.orders.filter(o => o.aog && o.status !== 'Delivered').length) : ''}</button>`).join('')}</nav>
        <a class="a-back" href="#" data-exit>Back to the store</a>
      </aside>
      <main class="a-main">${views[view]()}</main>
      ${orderDrawer()}
      <div class="a-tip" id="aTip" role="status" hidden></div>
      <div class="a-toast" id="aToast" role="status" hidden></div>
    </div>`;
    drawCharts();
  }

  function exportCsv() {
    const rows = [['Order', 'Customer', 'Status', 'AOG', 'Items', 'Total AED', 'Placed'], ...state.orders.map(o => [o.id, o.company, o.status, o.aog ? 'yes' : 'no', o.lines.reduce((a, l) => a + l.qty, 0), Math.round(o.total), o.when])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'aerolinx-orders.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast(`Exported ${state.orders.length} orders`); }
    catch (err) { toast('Export is not available in this viewer'); }
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
    const t = e.target.closest('[data-go],[data-order],[data-closeorder],[data-advance],[data-exit],[data-new],[data-upload],[data-reset],[data-range],[data-tv],[data-sort],[data-fst],[data-faog],[data-flv],[data-fcs],[data-pg],[data-clear],[data-metric],[data-golv],[data-export],[data-gost],[data-gocert]');
    if (!t || e.target.closest('select,input')) return;
    const d = t.dataset;
    if ('exit' in d) { e.preventDefault(); hideTip(); onExit(); }
    else if ('reset' in d) onReset?.();
    else if (d.go) { view = d.go; q = ''; orderOpen = null; render(); root.querySelector('.a-main').scrollTop = 0; }
    else if (d.advance) advance(d.advance);
    else if (d.order) { orderOpen = d.order; keepScroll(render); root.querySelector('.a-drawer [data-closeorder]')?.focus(); }
    else if ('closeorder' in d) { orderOpen = null; keepScroll(render); }
    else if (d.range) { range = d.range; keepScroll(render); }
    else if (d.metric) { ui.metric = d.metric; keepScroll(render); }
    else if (d.gost) { ui.orders.status = d.gost; ui.orders.aog = false; view = 'orders'; q = ''; render(); root.querySelector('.a-main').scrollTop = 0; }
    else if (d.gocert) { ui.certs.st = 'Expires in 30 days'; view = 'certs'; q = ''; render(); root.querySelector('.a-main').scrollTop = 0; }
    else if (d.golv) { ui.stock.level = d.golv; ui.stock.page = 0; view = 'stock'; q = ''; render(); root.querySelector('.a-main').scrollTop = 0; }
    else if ('export' in d) exportCsv();
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
