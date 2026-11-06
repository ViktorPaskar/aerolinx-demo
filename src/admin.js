// Admin panel stub. A working front end over in-page data, ready to wire to a real back end.
import { PARTS, photo, stock } from './catalog.js';

const fmt = n => 'AED ' + Math.round(n).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const STATUSES = ['Received', 'Certificate check', 'Packed', 'In transit', 'Delivered'];
const CUSTOMERS = [
  ['Falcon Regional Air', 'Airline', 'Dubai, UAE', 41, 2840000], ['Oasis Jet MRO', 'MRO', 'Sharjah, UAE', 67, 3920000], ['Sahara Cargo', 'Cargo airline', 'Riyadh, KSA', 18, 1160000],
  ['Marina Executive Jets', 'Business aviation', 'Dubai, UAE', 12, 640000], ['Red Sea Technics', 'MRO', 'Jeddah, KSA', 29, 1780000], ['Indus Air Services', 'Airline', 'Karachi, Pakistan', 22, 1320000],
];
export function sampleOrders() {
  const pick = i => PARTS[(i * 13 + 5) % PARTS.length];
  return [
    ['SA-10482', 0, 3, 1, true, '2h ago'], ['SA-10481', 1, 1, 2, false, '4h ago'], ['SA-10480', 4, 2, 1, true, '6h ago'], ['SA-10479', 2, 3, 4, false, 'Yesterday'],
    ['SA-10478', 5, 4, 2, false, 'Yesterday'], ['SA-10477', 3, 4, 1, false, '2 days ago'], ['SA-10476', 1, 0, 6, false, '2 days ago'], ['SA-10475', 0, 4, 3, false, '3 days ago'],
  ].map(([id, c, st, qty, aog, when], i) => {
    const p = pick(i), o = p.offers[0];
    return { id, company: CUSTOMERS[c][0], status: STATUSES[st], lines: [{ pn: p.pn, name: p.en, qty, aed: o.aed, c: o.c }], total: o.aed * qty * 1.05, aog, when };
  });
}

const REV = [['Dec', 3.1], ['Jan', 3.4], ['Feb', 2.9], ['Mar', 3.8], ['Apr', 4.2], ['May', 4.0], ['Jun', 4.6], ['Jul', 4.4], ['Aug', 5.1], ['Sep', 4.9], ['Oct', 5.6], ['Nov', 6.2]];

const NAV = [['dash', 'Dashboard'], ['orders', 'Orders'], ['aog', 'AOG queue'], ['stock', 'Inventory'], ['certs', 'Certificates'], ['people', 'Customers'], ['settings', 'Settings']];
const ICON = {
  dash: 'M3 3h6v8H3zM11 3h6v5h-6zM11 10h6v7h-6zM3 13h6v4H3z',
  orders: 'M4 3h12v14H4zM7 7h6M7 10h6M7 13h4',
  aog: 'M10 2 18 16H2zM10 8v4M10 14.2v.3',
  stock: 'M3 6l7-3 7 3v8l-7 3-7-3zM3 6l7 3 7-3M10 9v8',
  certs: 'M5 2h7l3 3v13H5zM12 2v3h3M8 9h4M8 12h4',
  people: 'M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 17c0-3 2-5 5-5s5 2 5 5M13 4a3 3 0 0 1 0 5.6M14.5 12c2 .6 3.5 2.4 3.5 5',
  settings: 'M3 6h8M15 6h2M3 14h2M9 14h8M13 4v4M7 12v4',
};

export function createAdmin({ root, state, save, onExit, onChange }) {
  let view = 'dash', q = '', edit = null, orderOpen = null;

  const badge = s => `<span class="st st-${s.toLowerCase().replace(/\s+/g, '-')}">${s}</span>`;
  const open = () => state.orders.filter(o => o.status !== 'Delivered');
  const low = () => PARTS.filter(p => stock(p) <= 2);

  function dash() {
    const rev = REV[REV.length - 1][1], prev = REV[REV.length - 2][1];
    const aog = state.orders.filter(o => o.aog && o.status !== 'Delivered');
    const max = 7;
    const bars = REV.map(([m, v], i) => {
      const h = v / max * 100;
      return `<div class="bar" data-tip="${m}: AED ${v.toFixed(1)}M" tabindex="0"><span style="height:${h}%" class="${i === REV.length - 1 ? 'now' : ''}"></span><em>${m}</em></div>`;
    }).join('');
    return `<header class="a-h"><h1>Dashboard</h1></header>
      <div class="kpis">
        <button class="kpi" data-go="orders"><span>Revenue this month</span><strong>AED ${rev.toFixed(1)}M</strong><em class="up">Up ${Math.round((rev / prev - 1) * 100)}% on October</em></button>
        <button class="kpi" data-go="orders"><span>Open orders</span><strong>${open().length}</strong><em>${state.orders.length} in the last 7 days</em></button>
        <button class="kpi" data-go="aog"><span>AOG requests open</span><strong>${aog.length}</strong><em class="${aog.length ? 'hot' : ''}">${aog.length ? 'Needs a reply now' : 'All clear'}</em></button>
        <button class="kpi" data-go="stock"><span>Low stock lines</span><strong>${low().length}</strong><em>Out of ${PARTS.length} listed parts</em></button>
      </div>
      <div class="a-grid">
        <section class="panel"><h2>Monthly revenue</h2><p class="pnote">AED millions, last 12 months</p>
          <div class="chart" role="img" aria-label="Monthly revenue, rising from 3.1 to 6.2 million dirhams">${[0, 2, 4, 6].map(v => `<i class="gl" style="bottom:${v / max * 100}%"><b>${v}</b></i>`).join('')}<div class="bars">${bars}</div></div></section>
        <section class="panel"><h2>Recent orders</h2>${state.orders.slice(0, 5).map(o => `<button class="rowbtn" data-order="${o.id}"><span><strong>${o.id}</strong>${esc(o.company)}</span><span class="r">${badge(o.status)}${fmt(o.total)}</span></button>`).join('')}</section>
      </div>`;
  }

  function orders() {
    const rows = state.orders.filter(o => !q || (o.id + o.company).toLowerCase().includes(q));
    return `<header class="a-h"><h1>Orders</h1><input class="a-search" data-q placeholder="Search orders" value="${esc(q)}" aria-label="Search orders"></header>
      <div class="tbl"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Placed</th><th>Status</th></tr></thead><tbody>
      ${rows.map(o => `<tr data-order="${o.id}"><td><strong>${o.id}</strong>${o.aog ? ' <span class="st st-hot">AOG</span>' : ''}</td><td>${esc(o.company)}</td><td>${o.lines.reduce((a, l) => a + l.qty, 0)}</td><td class="num">${fmt(o.total)}</td><td>${o.when}</td>
        <td><select data-status="${o.id}" aria-label="Status of ${o.id}">${STATUSES.map(s => `<option${s === o.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('') || `<tr><td colspan="6" class="none">No orders match that search.</td></tr>`}
      </tbody></table></div>`;
  }

  function aog() {
    const list = state.orders.filter(o => o.aog);
    return `<header class="a-h"><h1>AOG queue</h1></header>
      <div class="cardsA">${list.map(o => `<article class="panel aogc"><div class="aogt"><strong>${o.id}</strong>${badge(o.status)}</div>
        <p>${esc(o.company)}</p><p class="pnote">${o.lines.map(l => `${l.qty} x ${l.pn}, ${esc(l.name)}`).join('<br>')}</p>
        <div class="acts"><button class="a-btn" data-advance="${o.id}" ${o.status === 'Delivered' ? 'disabled' : ''}>Move to next step</button><button class="a-btn ghost" data-order="${o.id}">Open</button></div></article>`).join('') || '<p class="none">No AOG requests right now.</p>'}</div>`;
  }

  function stockV() {
    const rows = PARTS.filter(p => !q || (p.pn + p.en + p.maker).toLowerCase().includes(q)).slice(0, 60);
    return `<header class="a-h"><h1>Inventory</h1><input class="a-search" data-q placeholder="Search part number or name" value="${esc(q)}" aria-label="Search inventory"><button class="a-btn" data-new>Add part</button></header>
      <p class="pnote a-note">Changes here show in the store straight away.</p>
      <div class="tbl"><table><thead><tr><th></th><th>Part</th><th>Condition</th><th>Location</th><th>Certificate</th><th>Qty</th><th>Price, AED</th></tr></thead><tbody>
      ${rows.map(p => p.offers.map((o, i) => `<tr>${i === 0 ? `<td rowspan="${p.offers.length}" class="th"><img src="${photo(p)}" alt="" loading="lazy"></td><td rowspan="${p.offers.length}"><strong>${p.pn}</strong><br>${esc(p.en)}</td>` : ''}
        <td>${o.c}</td><td>${o.from}</td><td>${o.doc}</td>
        <td><input class="num-in" type="number" min="0" value="${o.qty}" data-qty="${p.pn}|${i}" aria-label="Quantity of ${p.pn} ${o.c}"></td>
        <td><input class="num-in wide" type="number" min="0" step="50" value="${o.aed}" data-price="${p.pn}|${i}" aria-label="Price of ${p.pn} ${o.c}"></td></tr>`).join('')).join('')}
      </tbody></table></div>`;
  }

  function certs() {
    const rows = PARTS.slice(0, 14).map((p, i) => ({ p, st: ['Approved', 'Approved', 'Waiting for review', 'Approved', 'Expires in 30 days'][i % 5] }));
    return `<header class="a-h"><h1>Certificates</h1><button class="a-btn" data-upload>Upload certificate</button></header>
      <div class="tbl"><table><thead><tr><th>Part</th><th>Document</th><th>Issued</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.map(({ p, st }, i) => `<tr><td><strong>${p.pn}</strong><br>${esc(p.en)}</td><td>${p.offers[0].doc}</td><td>${String(1 + i * 2).padStart(2, '0')} Oct 2026</td><td>${badge(st)}</td><td><a class="a-link" href="#p-${p.pn}">View part</a></td></tr>`).join('')}
      </tbody></table></div>`;
  }

  function people() {
    return `<header class="a-h"><h1>Customers</h1></header>
      <div class="tbl"><table><thead><tr><th>Company</th><th>Type</th><th>Location</th><th>Orders</th><th>Lifetime value</th><th>Terms</th></tr></thead><tbody>
      ${CUSTOMERS.map((c, i) => `<tr><td><strong>${c[0]}</strong></td><td>${c[1]}</td><td>${c[2]}</td><td>${c[3]}</td><td class="num">${fmt(c[4])}</td><td>${i % 2 ? 'Bank transfer' : '30-day account'}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  function settings() {
    const s = state.settings;
    const tog = (k, l, d) => `<label class="tog"><span><strong>${l}</strong><em>${d}</em></span><input type="checkbox" data-set="${k}" ${s[k] ? 'checked' : ''}></label>`;
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
    return `<aside class="a-drawer" role="dialog" aria-label="Order ${o.id}"><div class="ad-h"><h2>${o.id}</h2><button class="a-btn ghost" data-closeorder>Close</button></div>
      <p>${esc(o.company)}${o.aog ? ' <span class="st st-hot">AOG</span>' : ''}</p>
      <div class="adl">${o.lines.map(l => `<div><span><strong>${l.pn}</strong><br>${esc(l.name || '')}</span><span>${l.qty} x ${l.aed ? fmt(l.aed) : 'To be quoted'}</span></div>`).join('')}</div>
      <p class="adt"><span>Total with VAT</span><strong>${fmt(o.total)}</strong></p>
      <ol class="ads">${STATUSES.map((s, i) => `<li class="${i <= STATUSES.indexOf(o.status) ? 'on' : ''}">${s}</li>`).join('')}</ol>
      <button class="a-btn" data-advance="${o.id}" ${o.status === 'Delivered' ? 'disabled' : ''}>Move to next step</button>
      ${o.contact ? `<p class="pnote">Contact: ${esc(o.contact)}${o.po ? `<br>PO: ${esc(o.po)}` : ''}${o.tail ? `<br>Tail or station: ${esc(o.tail)}` : ''}</p>` : ''}
    </aside>`;
  }

  function render() {
    root.innerHTML = `<div class="admin">
      <aside class="a-side">
        <a class="logo" href="#" data-exit aria-label="Back to the store"><svg width="24" height="19"><use href="#i-logo"/></svg><span>SIRB Admin</span></a>
        <nav aria-label="Admin">${NAV.map(([k, l]) => `<button class="${view === k ? 'on' : ''}" data-go="${k}"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="${ICON[k]}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></svg>${l}${k === 'aog' && state.orders.some(o => o.aog && o.status !== 'Delivered') ? '<i class="dotn"></i>' : ''}</button>`).join('')}</nav>
        <a class="a-back" href="#" data-exit>Back to the store</a>
      </aside>
      <main class="a-main">${views[view]()}</main>
      ${orderDrawer()}
      <div class="a-tip" id="aTip" hidden></div>
      <div class="a-toast" id="aToast" hidden></div>
    </div>`;
  }

  const toast = msg => {
    const t = root.querySelector('#aToast'); if (!t) return;
    t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600);
  };
  const advance = id => {
    const o = state.orders.find(x => x.id === id); if (!o) return;
    const i = STATUSES.indexOf(o.status); if (i < STATUSES.length - 1) o.status = STATUSES[i + 1];
    save(); render(); toast(`${id} moved to ${o.status}`);
  };

  root.addEventListener('click', e => {
    const t = e.target.closest('[data-go],[data-order],[data-closeorder],[data-advance],[data-exit],[data-new],[data-upload]');
    if (!t) return;
    if (t.tagName === 'SELECT' || e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
    const d = t.dataset;
    if ('exit' in d) { e.preventDefault(); onExit(); }
    else if (d.go) { view = d.go; q = ''; orderOpen = null; render(); root.querySelector('.a-main').scrollTop = 0; }
    else if (d.advance) advance(d.advance);
    else if (d.order) { orderOpen = d.order; render(); }
    else if ('closeorder' in d) { orderOpen = null; render(); }
    else if ('new' in d) toast('The part editor connects when the store goes live.');
    else if ('upload' in d) toast('Certificate uploads connect when the store goes live.');
  });
  root.addEventListener('input', e => {
    const d = e.target.dataset;
    if ('q' in d) {
      q = e.target.value.trim().toLowerCase();
      const pos = e.target.selectionStart; render();
      const inp = root.querySelector('[data-q]'); inp.focus(); inp.setSelectionRange(pos, pos);
    }
  });
  root.addEventListener('change', e => {
    const d = e.target.dataset;
    if (d.status) { const o = state.orders.find(x => x.id === d.status); o.status = e.target.value; save(); toast(`${o.id} set to ${o.status}`); }
    else if (d.qty || d.price) {
      const [pn, i] = (d.qty || d.price).split('|'); const p = PARTS.find(x => x.pn === pn), o = p.offers[+i];
      const v = Math.max(0, +e.target.value || 0);
      if (d.qty) o.qty = v; else o.aed = v;
      state.edits[pn] = p.offers.map(x => [x.qty, x.aed]); save(); onChange(); toast(`${pn} updated in the store`);
    } else if (d.set) { state.settings[d.set] = e.target.checked; save(); onChange(); toast('Setting saved'); }
    else if (d.setn) { state.settings[d.setn] = +e.target.value; save(); onChange(); toast('Setting saved'); }
  });
  const showTip = e => {
    const b = e.target.closest?.('.bar'), tip = root.querySelector('#aTip'); if (!tip) return;
    if (!b) { tip.hidden = true; return; }
    const r = b.getBoundingClientRect(); tip.textContent = b.dataset.tip; tip.hidden = false;
    tip.style.left = r.left + r.width / 2 + 'px'; tip.style.top = r.top + 'px';
  };
  root.addEventListener('pointermove', showTip);
  root.addEventListener('focusin', showTip);
  root.addEventListener('pointerleave', () => { const tip = root.querySelector('#aTip'); if (tip) tip.hidden = true; });

  return { render, refresh: () => { if (root.firstChild) render(); } };
}
