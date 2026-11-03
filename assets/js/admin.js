(() => {
  const { aed, svg } = HP;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'hp-admin-v1';
  const DAY = 864e5;
  const STATUS = ['New', 'Processing', 'Out for delivery', 'Delivered', 'Cancelled'];
  const sCls = s => ({ New: 'b-new', Processing: 'b-processing', 'Out for delivery': 'b-out', Delivered: 'b-delivered', Cancelled: 'b-cancelled', Replied: 'b-replied', Closed: 'b-closed' }[s]);
  const COLORS = ['#F52B91', '#3BA9E0', '#F5B93B', '#17A58B', '#8A55E6', '#E0592A'];
  const items = [...HP.products, ...HP.packs];
  HP.find = id => items.find(p => p.id === id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- seed (deterministic) ---------- */
  let seed = 7;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const NAMES = ['Aisha Khan', 'Omar Haddad', 'Sara Ahmed', 'Layla Mansour', 'Yusuf Ali', 'Fatima Noor', 'Priya Nair', 'Hassan Malik', 'Maria Santos', 'Khalid Rahman', 'Nour Saleh', 'Ravi Menon', 'Dana Hussein', 'Zainab Qureshi', 'Tariq Aziz', 'Emma Clarke'];
  const AREAS = ['Dubai Marina', 'Jumeirah', 'Business Bay', 'Al Barsha', 'Deira', 'JLT', 'Downtown', 'Sharjah', 'Abu Dhabi', 'Mirdif'];
  const PAY = ['Cash on delivery', 'Visa', 'Apple Pay', 'Tabby', 'Mastercard'];

  const seedData = () => {
    const now = Date.now(), orders = [], custs = NAMES.map((n, i) => ({ id: 'C' + (100 + i), name: n, email: n.toLowerCase().replace(/\s/g, '.') + '@example.com', phone: '+971 5' + (0 + Math.floor(rnd() * 9)) + ' ' + String(Math.floor(1e6 + rnd() * 8.9e6)).replace(/(\d{3})(\d{4})/, '$1 $2'), area: pick(AREAS) }));
    for (let i = 0; i < 46; i++) {
      const c = pick(custs), n = 1 + Math.floor(rnd() * 3), lines = [];
      for (let k = 0; k < n; k++) { const p = pick(items); lines.push({ id: p.id, qty: 1 + Math.floor(rnd() * (rnd() > .95 ? 20 : 3)) }); }
      const age = Math.floor(rnd() * rnd() * 30 * DAY) + rnd() * 3e6;
      const d = age / DAY, st = d < .6 ? pick(['New', 'New', 'Processing']) : d < 1.5 ? pick(['Processing', 'Out for delivery']) : rnd() > .94 ? 'Cancelled' : 'Delivered';
      const sub = lines.reduce((s, l) => s + l.qty * HP.find(l.id).price, 0);
      orders.push({ ref: 'HP-' + (482100 + 46 - i), cust: c.id, at: now - age, lines, status: st, pay: pick(PAY), area: c.area, fee: sub >= 200 ? 0 : 20 });
    }
    orders.sort((a, b) => b.at - a.at);
    const enq = [
      ['Quote', 'Glow Events LLC', 'Need 500 balloons and 200 table covers for a launch', 1], ['Bulk', 'Sunny Nursery', 'Monthly party supplies for 3 branches', 2], ['Event', 'Aisha Khan', 'Decoration for a 6th birthday, 30 guests', 3], ['Quote', 'Palm Hotel', 'Eid decor for lobby and ballroom', 5],
      ['Event', 'Omar Haddad', 'Magician and face painting, Saturday', 6], ['Bulk', 'Party Pop Gifts', 'Resale pricing for foil balloons', 9], ['Event', 'Priya Nair', 'Catering and dessert table, 40 guests', 12], ['Quote', 'Al Noor School', 'Graduation day backdrops and favours', 15]
    ].map((e, i) => ({ id: 'E' + (i + 1), type: e[0], from: e[1], msg: e[2], at: now - e[3] * DAY - rnd() * DAY * .5, status: i < 3 ? 'New' : i < 6 ? 'Replied' : 'Closed' }));
    const stock = {}; items.forEach(p => { stock[p.id] = 4 + Math.floor(rnd() * 150); });
    return { orders, custs, enq, stock, price: {}, off: {}, settings: { store: 'Habibi Party L.L.C', email: 'hello@habibiparty.ae', phone: '+971 4 000 0000', freeOver: 200, fee: 20, promo: true, promoCode: 'PARTY10', promoPct: 10, lowStock: 20 } };
  };
  let D;
  try { D = JSON.parse(localStorage.getItem(KEY)); } catch {}
  if (!D || !D.orders) D = seedData();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch {} };
  const price = p => D.price[p.id] ?? p.price;
  const custOf = id => D.custs.find(c => c.id === id) || { name: 'Guest', email: '', phone: '', area: '' };
  const subOf = o => o.lines.reduce((s, l) => s + l.qty * (D.price[l.id] ?? HP.find(l.id).price), 0);
  const totOf = o => subOf(o) + o.fee;
  const live = () => D.orders.filter(o => o.status !== 'Cancelled');

  // real order placed on the storefront in this browser
  try {
    const last = JSON.parse(localStorage.getItem('hp-last-order') || 'null'), u = JSON.parse(localStorage.getItem('hp-user') || 'null');
    if (last && !D.orders.some(o => o.ref === last.ref)) {
      const cid = 'C-web'; if (!D.custs.some(c => c.id === cid)) D.custs.unshift({ id: cid, name: (u && u.name) || 'Website customer', email: (u && u.email) || '', phone: (u && u.phone) || '', area: 'Dubai' });
      const wl = (last.lines || []).map(l => ({ id: String(l.id).replace(/^bulk-/, ''), qty: l.qty })).filter(l => HP.find(l.id));
      D.orders.unshift({ ref: last.ref, cust: cid, at: last.at, lines: wl.length ? wl : [{ id: items[0].id, qty: 1 }], status: 'New', pay: 'Cash on delivery', area: (last.biz && last.biz.shoparea) || 'Dubai', fee: 0, web: true, biz: last.biz || null });
      if (last.biz) { const c0 = D.custs.find(c => c.id === cid); c0.name = last.biz.shop || c0.name; }
    }
  } catch {}

  /* ---------- helpers ---------- */
  const toast = t => { const el = $('.adm-toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2200); };
  const fmtD = t => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const ago = t => { const m = Math.round((Date.now() - t) / 6e4); return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
  const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('');
  const col = n => COLORS[[...n].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length];
  const who = c => `<span class="who"><span class="av" style="background:${col(c.name)}">${esc(initials(c.name))}</span><span>${esc(c.name)}<small>${esc(c.email)}</small></span></span>`;
  const thumb = p => `<span class="thumb" style="--tone:var(--${p.tone || 'blush'})">${p.img ? `<img src="${p.img}" alt="">` : svg(p.icon || 'balloon')}</span>`;
  const badge = s => `<span class="badge ${sCls(s)}">${s}</span>`;
  const sumBy = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
  const range = days => {
    const out = [], end = new Date(); end.setHours(23, 59, 59, 999);
    for (let i = days - 1; i >= 0; i--) { const a = end.getTime() - (i + 1) * DAY + 1, b = a + DAY; out.push({ a, v: sumBy(live().filter(o => o.at >= a && o.at < b), totOf), n: live().filter(o => o.at >= a && o.at < b).length }); }
    return out;
  };

  const spark = (vals, color) => {
    const max = Math.max(...vals, 1), w = 110, h = 40, pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - 4 - (v / max) * (h - 10)}`);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };
  const chart = days => {
    const data = range(days), max = Math.max(...data.map(d => d.v), 1) * 1.15, W = 760, H = 260, L = 44, B = 28, T = 10, pw = W - L - 28, ph = H - B - T;
    const x = i => L + (i / (data.length - 1)) * pw, y = v => T + ph - (v / max) * ph;
    const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.v).toFixed(1)}`).join(' ');
    const grid = [0, .25, .5, .75, 1].map(f => { const v = max * f, yy = y(v); return `<line x1="${L}" x2="${W - 20}" y1="${yy}" y2="${yy}" stroke="#ECE5F2"/><text x="${L - 8}" y="${yy + 4}" text-anchor="end">${v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : Math.round(v)}</text>`; }).join('');
    const step = days > 14 ? 5 : 1, labels = data.map((d, i) => i % step === 0 || i === data.length - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${fmtD(d.a)}</text>` : '').join('');
    const dots = data.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.v)}" r="14" fill="transparent"><title>${fmtD(d.a)}: ${aed(d.v)} (${d.n} orders)</title></circle>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Revenue over the last ${days} days"><defs><linearGradient id="rg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#F52B91" stop-opacity=".28"/><stop offset="1" stop-color="#F52B91" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${line} L${x(data.length - 1)} ${T + ph} L${L} ${T + ph} Z" fill="url(#rg)"/><path d="${line}" fill="none" stroke="#F52B91" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg>`;
  };

  /* ---------- views ---------- */
  const V = {};
  V.overview = () => {
    const o = live(), now = Date.now();
    const cur = o.filter(x => x.at > now - 7 * DAY), prev = o.filter(x => x.at <= now - 7 * DAY && x.at > now - 14 * DAY);
    const rev = sumBy(o, totOf), r7 = sumBy(cur, totOf), r14 = sumBy(prev, totOf);
    const dl = (a, b) => { const p = b ? Math.round((a - b) / b * 100) : 0; return `<span class="delta ${p >= 0 ? 'up' : 'dn'}"><i class="bi bi-arrow-${p >= 0 ? 'up' : 'down'}-right" aria-hidden="true"></i>${Math.abs(p)}% vs last week</span>`; };
    const d30 = range(14);
    const cats = {}; o.forEach(x => x.lines.forEach(l => { const c = HP.find(l.id).cat || 'Packs'; cats[c] = (cats[c] || 0) + l.qty * HP.find(l.id).price; }));
    const cl = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5), ct = sumBy(cl, e => e[1]) || 1;
    let acc = 0; const grad = cl.map((e, i) => { const s = acc; acc += e[1] / ct * 100; return `${COLORS[i]} ${s}% ${acc}%`; }).join(',');
    const top = {}; o.forEach(x => x.lines.forEach(l => { top[l.id] = (top[l.id] || 0) + l.qty; }));
    const tops = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const low = items.filter(p => D.stock[p.id] <= D.settings.lowStock).sort((a, b) => D.stock[a.id] - D.stock[b.id]).slice(0, 5);
    return `
    <div class="grid kpis">
      <div class="card kpi"><span class="ic" style="background:#FFD9EA;color:#F52B91"><i class="bi bi-cash-coin"></i></span><small>Revenue (30 days)</small><b class="tnum">${aed(rev)}</b>${dl(r7, r14)}${spark(d30.map(d => d.v), '#F52B91')}</div>
      <div class="card kpi"><span class="ic" style="background:#D9F3FF;color:#3BA9E0"><i class="bi bi-bag-check"></i></span><small>Orders</small><b class="tnum">${o.length}</b>${dl(cur.length, prev.length)}${spark(d30.map(d => d.n), '#3BA9E0')}</div>
      <div class="card kpi"><span class="ic" style="background:#FFF1CC;color:#E0A21B"><i class="bi bi-receipt"></i></span><small>Average order</small><b class="tnum">${aed(Math.round(rev / (o.length || 1)))}</b><span class="delta up"><i class="bi bi-graph-up-arrow"></i>Healthy</span>${spark(d30.map(d => d.n ? d.v / d.n : 0), '#E0A21B')}</div>
      <div class="card kpi"><span class="ic" style="background:#D6F5EE;color:#17A58B"><i class="bi bi-people"></i></span><small>Customers</small><b class="tnum">${D.custs.length}</b><span class="delta up"><i class="bi bi-person-plus"></i>${D.orders.filter(x => x.status === 'New').length} new orders</span></div>
    </div>
    <div class="grid row2">
      <section class="card"><div class="card-h"><h2>Revenue</h2><div class="seg" data-range><button class="is-on" data-d="14">14 days</button><button data-d="30">30 days</button></div></div><div data-chart>${chart(14)}</div></section>
      <section class="card"><div class="card-h"><h2>Sales by category</h2></div><div class="donut-wrap"><div class="donut" style="--p:conic-gradient(${grad})"><div class="donut-c"><span>${cl.length}<small>categories</small></span></div></div><ul class="legend">${cl.map((e, i) => `<li><i style="background:${COLORS[i]}"></i>${esc(e[0])}<b class="tnum">${Math.round(e[1] / ct * 100)}%</b></li>`).join('')}</ul></div></section>
    </div>
    <div class="grid row3">
      <section class="card"><div class="card-h"><h2>Recent orders</h2><a class="btn ghost" href="#orders">View all</a></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th class="r">Total</th></tr></thead><tbody>${D.orders.slice(0, 6).map(x => `<tr data-open="order:${x.ref}"><td><b>${x.ref}</b><br><small style="color:var(--soft)">${ago(x.at)}</small></td><td>${esc(custOf(x.cust).name)}</td><td>${badge(x.status)}</td><td class="r tnum"><b>${aed(totOf(x))}</b></td></tr>`).join('')}</tbody></table></div></section>
      <section class="card"><div class="card-h"><h2>Top products</h2></div><ul class="list">${tops.map(([id, n]) => { const p = HP.find(id); return `<li>${thumb(p)}<span class="grow"><span class="nm">${esc(p.name)}</span><small>${n} sold</small></span></li>`; }).join('')}</ul></section>
      <section class="card"><div class="card-h"><h2>Low stock</h2><a class="btn ghost" href="#products">Manage</a></div>${low.length ? `<ul class="list">${low.map(p => `<li>${thumb(p)}<span class="grow"><span class="nm">${esc(p.name)}</span><small>${D.stock[p.id]} left</small></span></li>`).join('')}</ul>` : '<p class="empty">Everything is well stocked.</p>'}</section>
    </div>`;
  };
  const afterOverview = () => $('[data-range]')?.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (!b) return; $$('button', e.currentTarget).forEach(x => x.classList.toggle('is-on', x === b)); $('[data-chart]').innerHTML = chart(+b.dataset.d); });

  let oF = { q: '', s: '' };
  V.orders = () => {
    const list = D.orders.filter(o => (!oF.s || o.status === oF.s) && (!oF.q || (o.ref + custOf(o.cust).name).toLowerCase().includes(oF.q.toLowerCase())));
    return `<section class="card"><div class="tools"><input class="in grow" type="search" placeholder="Search by order or customer" value="${esc(oF.q)}" data-oq aria-label="Search orders"><select class="sel" data-os aria-label="Filter by status"><option value="">All statuses</option>${STATUS.map(s => `<option ${oF.s === s ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="btn ghost" type="button" data-csv><i class="bi bi-download"></i>Export CSV</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Area</th><th>Status</th><th class="r">Total</th></tr></thead><tbody data-obody>${list.length ? list.map(o => `<tr data-open="order:${o.ref}"><td><b>${o.ref}</b>${o.web ? ' <span class="badge b-new">Website</span>' : ''}</td><td>${esc(custOf(o.cust).name)}</td><td>${fmtD(o.at)}</td><td>${esc(o.area)}</td><td>${badge(o.status)}</td><td class="r tnum"><b>${aed(totOf(o))}</b></td></tr>`).join('') : '<tr><td colspan="6" class="empty">No orders match.</td></tr>'}</tbody></table></div></section>`;
  };
  const afterOrders = () => {
    const re = () => { const t = document.createElement('div'); t.innerHTML = V.orders(); $('[data-obody]').innerHTML = $('[data-obody]', t).innerHTML; };
    $('[data-oq]').addEventListener('input', e => { oF.q = e.target.value; re(); });
    $('[data-os]').addEventListener('change', e => { oF.s = e.target.value; re(); });
    $('[data-csv]').addEventListener('click', () => {
      const rows = [['Order', 'Date', 'Customer', 'Email', 'Area', 'Payment', 'Status', 'Total (AED)'], ...D.orders.map(o => [o.ref, new Date(o.at).toISOString().slice(0, 10), custOf(o.cust).name, custOf(o.cust).email, o.area, o.pay, o.status, totOf(o)])];
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv' })); a.download = 'habibi-orders.csv'; a.click(); toast('Orders exported');
    });
  };

  let pF = { q: '', c: '' };
  V.products = () => `<section class="card"><div class="tools"><input class="in grow" type="search" placeholder="Search products" value="${esc(pF.q)}" data-pq aria-label="Search products"><select class="sel" data-pc aria-label="Category"><option value="">All categories</option>${[...new Set(items.map(p => p.cat || 'Packs'))].sort().map(c => `<option ${pF.c === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Product</th><th>Category</th><th>Price (AED)</th><th>Stock</th><th>Visible</th></tr></thead><tbody data-pbody>${prodRows()}</tbody></table></div></section>`;
  const prodRows = () => items.filter(p => (!pF.q || p.name.toLowerCase().includes(pF.q.toLowerCase())) && (!pF.c || (p.cat || 'Packs') === pF.c)).map(p => { const s = D.stock[p.id], low = s <= D.settings.lowStock; return `<tr><td><span class="who">${thumb(p)}<span>${esc(p.name)}</span></span></td><td>${esc(p.cat || 'Packs')}</td><td><input class="in sm tnum" type="number" min="0" step="1" value="${price(p)}" data-price="${p.id}" aria-label="Price of ${esc(p.name)}"></td><td><span class="stock"><input class="in sm tnum" type="number" min="0" value="${s}" data-stock="${p.id}" aria-label="Stock of ${esc(p.name)}"><span class="bar ${low ? 'low' : ''}"><i style="width:${Math.min(100, s)}%"></i></span></span></td><td><label class="sw"><input type="checkbox" ${D.off[p.id] ? '' : 'checked'} data-vis="${p.id}" aria-label="Visible in store"><i></i></label></td></tr>`; }).join('') || '<tr><td colspan="5" class="empty">No products match.</td></tr>';
  const afterProducts = () => {
    const re = () => { $('[data-pbody]').innerHTML = prodRows(); };
    $('[data-pq]').addEventListener('input', e => { pF.q = e.target.value; re(); });
    $('[data-pc]').addEventListener('change', e => { pF.c = e.target.value; re(); });
    const body = $('[data-pbody]');
    body.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.price) { D.price[t.dataset.price] = Math.max(0, +t.value || 0); toast('Price updated'); }
      else if (t.dataset.stock) { D.stock[t.dataset.stock] = Math.max(0, Math.floor(+t.value) || 0); toast('Stock updated'); re(); }
      else if (t.dataset.vis) { D.off[t.dataset.vis] = !t.checked; toast(t.checked ? 'Shown in store' : 'Hidden from store'); }
      save();
    });
  };

  V.customers = () => {
    const rows = D.custs.map(c => { const os = D.orders.filter(o => o.cust === c.id && o.status !== 'Cancelled'); return { c, n: os.length, t: sumBy(os, totOf), last: os[0] && os[0].at }; }).sort((a, b) => b.t - a.t);
    return `<section class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Customer</th><th>Phone</th><th>Area</th><th class="r">Orders</th><th class="r">Spent</th><th>Last order</th></tr></thead><tbody>${rows.map(r => `<tr><td>${who(r.c)}</td><td>${esc(r.c.phone || '-')}</td><td>${esc(r.c.area)}</td><td class="r tnum">${r.n}</td><td class="r tnum"><b>${aed(r.t)}</b></td><td>${r.last ? fmtD(r.last) : '-'}</td></tr>`).join('')}</tbody></table></div></section>`;
  };

  V.enquiries = () => `<section class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>From</th><th>Type</th><th>Message</th><th>Received</th><th>Status</th></tr></thead><tbody>${D.enq.map(e => `<tr><td><b>${esc(e.from)}</b></td><td>${e.type}</td><td style="max-width:340px">${esc(e.msg)}</td><td>${ago(e.at)}</td><td><select class="sel" data-enq="${e.id}" aria-label="Status for ${esc(e.from)}">${['New', 'Replied', 'Closed'].map(s => `<option ${e.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div></section>`;
  const afterEnq = () => $('tbody').addEventListener('change', e => { const id = e.target.dataset.enq; if (!id) return; D.enq.find(x => x.id === id).status = e.target.value; save(); counts(); toast('Enquiry updated'); });

  V.settings = () => { const s = D.settings; return `<div class="grid" style="grid-template-columns:1.2fr 1fr;align-items:start">
    <form class="card" data-sform><div class="card-h"><h2>Store details</h2></div><div class="form-grid">
      <div class="field full"><label for="s-store">Store name</label><input class="in" id="s-store" name="store" value="${esc(s.store)}"></div>
      <div class="field"><label for="s-email">Contact email</label><input class="in" id="s-email" name="email" type="email" value="${esc(s.email)}"></div>
      <div class="field"><label for="s-phone">Phone</label><input class="in" id="s-phone" name="phone" value="${esc(s.phone)}"></div>
      <div class="field"><label for="s-free">Free delivery over (AED)</label><input class="in" id="s-free" name="freeOver" type="number" min="0" value="${s.freeOver}"></div>
      <div class="field"><label for="s-fee">Delivery fee (AED)</label><input class="in" id="s-fee" name="fee" type="number" min="0" value="${s.fee}"></div>
      <div class="field"><label for="s-low">Low stock alert at</label><input class="in" id="s-low" name="lowStock" type="number" min="0" value="${s.lowStock}"></div>
      <div class="field full"><button class="btn" type="submit">Save settings</button></div></div></form>
    <div class="card"><div class="card-h"><h2>Promotions</h2></div>
      <div class="set-row"><div><b>Promo code ${esc(s.promoCode)}</b><p>${s.promoPct}% off for customers who enter the code.</p></div><label class="sw"><input type="checkbox" data-promo ${s.promo ? 'checked' : ''} aria-label="Promo code active"><i></i></label></div>
      <div class="set-row"><div><b>Demo data</b><p>Restore the sample orders, customers and stock.</p></div><button class="btn ghost" type="button" data-reset>Reset</button></div></div></div>`; };
  const afterSettings = () => {
    $('[data-sform]').addEventListener('submit', e => { e.preventDefault(); const f = new FormData(e.target); for (const [k, v] of f) D.settings[k] = ['freeOver', 'fee', 'lowStock'].includes(k) ? +v : v; save(); toast('Settings saved'); });
    $('[data-promo]').addEventListener('change', e => { D.settings.promo = e.target.checked; save(); toast(e.target.checked ? 'Promo code on' : 'Promo code off'); });
    $('[data-reset]').addEventListener('click', () => { if (confirm('Reset all demo data? Your edits will be lost.')) { try { localStorage.removeItem(KEY); } catch {} location.reload(); } });
  };
  const AFTER = { overview: afterOverview, orders: afterOrders, products: afterProducts, enquiries: afterEnq, settings: afterSettings };
  const TITLES = { overview: 'Overview', orders: 'Orders', products: 'Products', customers: 'Customers', enquiries: 'Enquiries', settings: 'Settings' };

  /* ---------- drawer ---------- */
  const drawer = $('[data-drawer]');
  const openDrawer = html => { $('[data-drawer-body]').innerHTML = html; drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); };
  const closeDrawer = () => { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); };
  const bizBlock = o => { const b = o.biz, st = b.verify || 'Pending'; return `<div class="card" style="margin:16px 0;padding:16px"><h3 style="font-size:1.05rem;margin-bottom:8px">Business buyer</h3><dl style="margin:0 0 12px"><dt>Shop</dt><dd>${esc(b.shop)}</dd><dt>Licence no.</dt><dd>${esc(b.licence)} (${esc(b.authority)})</dd><dt>Expires</dt><dd>${esc(b.expiry)}</dd><dt>TRN</dt><dd>${esc(b.trn || '-')}</dd><dt>Licence file</dt><dd>${b.licfile ? esc(b.licfile.name) : '-'}</dd><dt>Shop address</dt><dd>${esc(b.shopaddress)}, ${esc(b.shoparea)}, ${esc(b.shopemirate)}</dd><dt>Licence</dt><dd><span class="badge ${st === 'Approved' ? 'b-delivered' : st === 'Rejected' ? 'b-cancelled' : 'b-processing'}">${st}</span></dd></dl><div style="display:flex;gap:8px"><button class="btn" type="button" data-lic="Approved:${o.ref}">Approve licence</button><button class="btn ghost" type="button" data-lic="Rejected:${o.ref}">Reject</button></div></div>`; };
  const orderView = ref => {
    const o = D.orders.find(x => x.ref === ref), c = custOf(o.cust);
    openDrawer(`<div class="dr"><h2>${o.ref}</h2><p class="sub">${new Date(o.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      <div class="field"><label for="d-st">Status</label><select class="sel" id="d-st" data-ost="${o.ref}">${STATUS.map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      <dl><dt>Customer</dt><dd>${esc(c.name)}</dd><dt>Email</dt><dd>${esc(c.email || '-')}</dd><dt>Phone</dt><dd>${esc(c.phone || '-')}</dd><dt>Deliver to</dt><dd>${esc(o.area)}, UAE</dd><dt>Payment</dt><dd>${o.pay}</dd></dl>
      <ul class="items">${o.lines.map(l => { const p = HP.find(l.id); return `<li>${thumb(p)}<span class="grow" style="flex:1"><b>${esc(p.name)}</b><br><small style="color:var(--soft)">${l.qty} &times; ${aed(D.price[p.id] ?? p.price)}</small></span><b class="tnum">${aed(l.qty * (D.price[p.id] ?? p.price))}</b></li>`; }).join('')}</ul>
      <p style="display:flex;justify-content:space-between;margin:12px 0 0;color:var(--soft)"><span>Delivery</span><span>${o.fee ? aed(o.fee) : 'Free'}</span></p>
      ${o.biz ? bizBlock(o) : ''}
      <div class="tot"><span>Total</span><span class="tnum">${aed(totOf(o))}</span></div></div>`);
  };

  /* ---------- router ---------- */
  const counts = () => { $('[data-count="orders"]').textContent = D.orders.filter(o => o.status === 'New').length || ''; $('[data-count="enq"]').textContent = D.enq.filter(e => e.status === 'New').length || ''; };
  const route = () => {
    const v = TITLES[location.hash.slice(1)] ? location.hash.slice(1) : 'overview';
    $('#view').innerHTML = V[v]();
    $('[data-title]').textContent = TITLES[v];
    $$('[data-nav] a').forEach(a => a.classList.toggle('is-on', a.dataset.v === v));
    AFTER[v] && AFTER[v]();
    closeSide(); window.scrollTo(0, 0);
  };
  const side = $('#side'), scrim = $('[data-scrim]');
  const closeSide = () => { side.classList.remove('is-open'); scrim.classList.remove('is-open'); };
  $('[data-menu]').addEventListener('click', () => { side.classList.add('is-open'); scrim.classList.add('is-open'); });
  scrim.addEventListener('click', closeSide);
  document.addEventListener('click', e => {
    const op = e.target.closest('[data-open]'); if (op) { const [k, id] = op.dataset.open.split(':'); if (k === 'order') orderView(id); }
    const lic = e.target.closest('[data-lic]'); if (lic) { const [s, r] = lic.dataset.lic.split(':'); const o = D.orders.find(x => x.ref === r); o.biz.verify = s; if (s === 'Rejected') o.status = 'Cancelled'; save(); toast('Licence ' + s.toLowerCase()); orderView(r); }
    if (e.target.closest('[data-close]')) closeDrawer();
  });
  document.addEventListener('change', e => { const r = e.target.dataset.ost; if (!r) return; D.orders.find(o => o.ref === r).status = e.target.value; save(); counts(); toast('Order status updated'); const v = location.hash.slice(1); if (v === 'orders' || !v || v === 'overview') { const y = scrollY; route(); orderView(r); scrollTo(0, y); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeSide(); } });
  $('[data-gsearch]').addEventListener('keydown', e => { if (e.key === 'Enter') { oF.q = e.target.value; location.hash = '#orders'; if (location.hash === '#orders') route(); } });
  $('[data-date]').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  save(); counts(); addEventListener('hashchange', route); route();
})();
