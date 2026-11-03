(() => {
  const { $, $$, aed } = HP;
  const root = $('[data-pf]');
  if (!root) return;
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let u = get('hp-user', null);
  if (!u) { location.replace('account.html'); return; }
  const msg = (form, t, ok) => { const m = $('[data-msg]', form); m.textContent = t; m.className = 'form-msg ' + (ok ? 'ok' : 'err'); };
  const products = [...HP.products, ...HP.packs];
  const find = id => products.find(p => p.id === id);

  let orders = get('hp-orders', []);
  const last = get('hp-last-order', null);
  if (!orders.length && last) orders = [last];
  let addrs = get('hp-addrs', []);
  let prefs = get('hp-prefs', { orders: true, offers: true, wa: false });
  const spent = () => orders.reduce((n, o) => n + (o.total || 0), 0);
  const points = () => Math.floor(spent());
  const TIERS = [['Member', 0], ['Gold', 500], ['Platinum', 1500]];
  const tierOf = p => [...TIERS].reverse().find(t => p >= t[1]);

  const STAGES = ['Order placed', 'Preparing', 'Out for delivery', 'Delivered'];
  const stageOf = o => (o.biz && o.biz.verify !== 'Approved' && Date.now() - o.at < 36e5) ? -1 : Math.min(3, Math.floor((Date.now() - o.at) / 6e5));
  const stageName = o => { const s = stageOf(o); return s < 0 ? 'Licence verification' : STAGES[s]; };
  const stageCls = o => { const s = stageOf(o); return s < 0 ? 'is-lic' : s === 3 ? 'is-done' : s === 2 ? 'is-out' : 'is-prep'; };
  const dateOf = t => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const header = () => {
    const first = (u.name || u.email || 'friend').split(/[\s@]/)[0];
    $('[data-name]').textContent = u.name || u.email;
    const since = u.since || (u.since = Date.now(), set('hp-user', u), u.since);
    $('[data-meta]').innerHTML = [u.email, u.phone].filter(Boolean).map(esc).join(' &middot; ') + (u.email || u.phone ? ' &middot; ' : '') + 'Joined ' + new Date(since).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    const av = $('[data-avatar]'); av.innerHTML = '';
    if (u.picture) { const im = new Image(); im.src = u.picture; im.alt = ''; im.referrerPolicy = 'no-referrer'; av.appendChild(im); }
    else av.textContent = (u.name || u.email || '?').trim().charAt(0).toUpperCase();
    const t = tierOf(points()); $('[data-tier]').innerHTML = `<i class="bi bi-gem"></i> ${t[0]} member`;
    document.title = `${first} | Profile | Habibi Party`;
  };

  const stats = () => {
    $('[data-s-orders]').textContent = orders.length;
    $('[data-s-spent]').textContent = aed(Math.round(spent()));
    $('[data-s-points]').textContent = points().toLocaleString('en-US');
    $('[data-s-addr]').textContent = addrs.length;
  };

  const rewards = () => {
    const p = points(), cur = tierOf(p), nxt = TIERS.find(t => t[1] > p);
    $('[data-r-points]').textContent = p.toLocaleString('en-US');
    const from = cur[1], pct = nxt ? Math.round((p - from) / (nxt[1] - from) * 100) : 100;
    const bar = $('[data-r-bar]'); bar.setAttribute('aria-valuenow', pct);
    requestAnimationFrame(() => requestAnimationFrame(() => { $('i', bar).style.width = pct + '%'; }));
    $('[data-r-text]').textContent = nxt ? `${(nxt[1] - p).toLocaleString('en-US')} more points to reach ${nxt[0]}.` : 'You are at the top tier. Thank you!';
  };

  const orderCard = o => {
    const s = stageOf(o), lines = o.lines || [];
    const steps = STAGES.map((n, i) => `<li class="${i <= s ? 'on' : ''}"><i></i><span>${n}</span></li>`).join('');
    return `<article class="pf-order">
      <header><div><b>${esc(o.ref)}</b><small>${dateOf(o.at)}${o.biz ? ' &middot; Trade order' : ''}</small></div><span class="pf-status ${stageCls(o)}">${stageName(o)}</span></header>
      <ul class="pf-steps">${steps}</ul>
      <ul class="pf-lines">${lines.slice(0, 3).map(l => `<li><span>${esc(l.name)}</span><small>${l.qty} &times; ${aed(l.price)}</small></li>`).join('')}${lines.length > 3 ? `<li><small>+ ${lines.length - 3} more</small></li>` : ''}</ul>
      <footer><b>${aed(Math.round(o.total || 0))}</b><span><a class="btn-hp btn-hp--ghost" href="track-order.html?o=${encodeURIComponent(o.ref)}">Track</a><button class="btn-hp" type="button" data-reorder="${esc(o.ref)}"><i class="bi bi-arrow-repeat"></i> Reorder</button></span></footer>
    </article>`;
  };
  const empty = (icon, t, b, cta) => `<div class="pf-empty"><i class="bi bi-${icon}"></i><h3>${t}</h3><p>${b}</p>${cta || ''}</div>`;
  const ordersView = () => {
    $('[data-latest]').innerHTML = orders.length ? orderCard(orders[0]) : empty('bag-heart', 'No orders yet', 'Your first order will show up here.', '<a class="btn-hp" href="shop.html">Start shopping</a>');
    $('[data-orders]').innerHTML = orders.length ? `<div class="pf-orders">${orders.map(orderCard).join('')}</div>` : empty('receipt', 'No orders yet', 'When you order, you can track and reorder here.', '<a class="btn-hp" href="shop.html">Start shopping</a>');
  };

  const addrView = () => {
    $('[data-addrs]').innerHTML = addrs.length ? addrs.map((a, i) => `<li class="${a.def ? 'is-def' : ''}"><i class="bi bi-${/office|shop|work/i.test(a.label) ? 'building' : 'house-heart'}-fill"></i><span><b>${esc(a.label)}${a.def ? ' <em>Default</em>' : ''}</b><small>${esc(a.line)}, ${esc(a.area)}, ${esc(a.emirate)}</small></span><span class="pf-row-actions">${a.def ? '' : `<button type="button" data-def="${i}">Make default</button>`}<button type="button" data-del="${i}" aria-label="Delete ${esc(a.label)}"><i class="bi bi-trash3"></i></button></span></li>`).join('') : `<li class="pf-none">No saved addresses yet.</li>`;
    stats();
  };

  const bizView = () => {
    const b = get('hp-biz', null), dl = $('[data-biz-dl]'), chip = $('[data-biz-chip]');
    chip.textContent = b ? 'Details saved' : 'Not set up'; chip.classList.toggle('on', !!b);
    dl.innerHTML = b ? `<dt>Business</dt><dd>${esc(b.shop)}</dd><dt>Licence</dt><dd>${esc(b.licence)}${b.authority ? ' (' + esc(b.authority) + ')' : ''}</dd><dt>Expires</dt><dd>${esc(b.expiry)}</dd><dt>TRN</dt><dd>${esc(b.trn || '-')}</dd><dt>Address</dt><dd>${esc(b.shopaddress)}, ${esc(b.shoparea)}, ${esc(b.shopemirate)}</dd>` : '';
    if (b) Object.entries(b).forEach(([k, v]) => { const el = $('[name="' + k + '"]', $('[data-biz-form]')); if (el) el.value = v; });
  };

  /* tabs */
  const show = t => {
    $$('[data-t]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === t)));
    $$('[data-pane]').forEach(p => { p.hidden = p.dataset.pane !== t; });
    history.replaceState(null, '', '#' + t);
  };
  $('[data-pf-tabs]').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) show(b.dataset.t); });
  root.addEventListener('click', e => {
    const go = e.target.closest('[data-go]'); if (go) show(go.dataset.go);
    const d = e.target.closest('[data-def]'); if (d) { addrs.forEach((a, i) => { a.def = i === +d.dataset.def; }); set('hp-addrs', addrs); addrView(); }
    const x = e.target.closest('[data-del]'); if (x) { const wasDef = addrs[+x.dataset.del].def; addrs.splice(+x.dataset.del, 1); if (wasDef && addrs[0]) addrs[0].def = true; set('hp-addrs', addrs); addrView(); }
    const r = e.target.closest('[data-reorder]');
    if (r) {
      const o = orders.find(z => z.ref === r.dataset.reorder), cur = HP.basket.get();
      (o.lines || []).forEach(l => { const p = find(String(l.id).replace(/^bulk-/, '')); if (!p) return; const f = cur.find(i => i.id === l.id); if (f) f.qty += l.qty; else cur.push({ id: l.id, name: l.name, price: l.price, img: p.img, icon: p.icon, tone: p.tone, qty: l.qty }); });
      HP.basket.set(cur); HP.toast('Items added to your basket'); setTimeout(() => (location.href = 'checkout.html'), 700);
    }
  });

  /* forms */
  $('[data-addr-form]').addEventListener('submit', e => {
    e.preventDefault(); const f = e.target, bad = $$('[required]', f).find(x => !x.value.trim());
    if (bad) { msg(f, 'Please complete every field.', false); bad.focus(); return; }
    const a = Object.fromEntries(new FormData(f)); a.def = !addrs.length; addrs.push(a); set('hp-addrs', addrs); f.reset(); msg(f, 'Address saved.', true); addrView();
  });
  $('[data-biz-form]').addEventListener('submit', e => {
    e.preventDefault(); const f = e.target, bad = $$('input,select', f).find(x => (x.required && !x.value.trim()) || !x.checkValidity());
    if (bad) { msg(f, 'Check the highlighted field.', false); bad.focus(); return; }
    set('hp-biz', { ...get('hp-biz', {}), ...Object.fromEntries(new FormData(f)) }); msg(f, 'Trade details saved.', true); bizView();
  });
  const det = $('[data-details]');
  $('#p-name').value = u.name || ''; $('#p-email').value = u.email || ''; $('#p-phone').value = u.phone || ''; $('#p-dob').value = u.dob || '';
  det.addEventListener('submit', e => {
    e.preventDefault(); const bad = $$('input', det).find(x => !x.checkValidity() || (x.required && !x.value.trim()));
    if (bad) { msg(det, 'Check the highlighted field.', false); bad.focus(); return; }
    u = { ...u, name: $('#p-name').value.trim(), email: $('#p-email').value.trim(), phone: $('#p-phone').value.trim(), dob: $('#p-dob').value };
    set('hp-user', u); header(); msg(det, 'Saved.', true);
  });
  $$('[data-pref]').forEach(c => { c.checked = !!prefs[c.dataset.pref]; c.addEventListener('change', () => { prefs[c.dataset.pref] = c.checked; set('hp-prefs', prefs); HP.toast('Preference saved'); }); });
  $('[data-signout]').addEventListener('click', () => { try { localStorage.removeItem('hp-user'); } catch {} location.href = 'index.html'; });
  $('[data-delete]').addEventListener('click', () => { if (confirm('Delete your profile, addresses and order history from this browser?')) { ['hp-user', 'hp-addrs', 'hp-orders', 'hp-last-order', 'hp-biz', 'hp-prefs'].forEach(k => { try { localStorage.removeItem(k); } catch {} }); location.href = 'index.html'; } });

  /* photo */
  $('[data-photo]').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f || !f.type.startsWith('image/')) return;
    const img = new Image(), rd = new FileReader();
    rd.onload = () => { img.onload = () => { const c = document.createElement('canvas'), s = 256, m = Math.min(img.width, img.height); c.width = c.height = s; c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s); u.picture = c.toDataURL('image/jpeg', .85); set('hp-user', u); header(); HP.toast('Photo updated'); }; img.src = rd.result; };
    rd.readAsDataURL(f);
  });

  header(); stats(); rewards(); ordersView(); addrView(); bizView();
  root.hidden = false;
  const h = location.hash.slice(1); if (h && $('[data-pane="' + h + '"]')) show(h);
})();
