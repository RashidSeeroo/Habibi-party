(() => {
  const { $, $$, aed, svg } = HP;
  const root = $('[data-bulk]');
  if (!root) return;
  const MIN = 20;
  const TIERS = [[500, .20], [250, .15], [100, .10], [50, .05], [0, 0]];
  const items = [...HP.products, ...HP.packs.filter(p => !p.isPack)];
  const packSize = p => { const m = p.name.match(/(\d+)\s*(?:-)?\s*pack\b/i) || p.name.match(/Set of (\d+)/i); return m ? +m[1] : 0; };
  const qty = {};
  const rows = $('[data-b-rows]');
  const q = $('#b-q'), cat = $('#b-cat'), packs = $('#b-packs');
  [...new Set(items.map(p => p.cat))].sort().forEach(c => cat.insertAdjacentHTML('beforeend', `<option>${c}</option>`));

  const render = () => {
    const term = q.value.trim().toLowerCase();
    const list = items.filter(p => (!term || p.name.toLowerCase().includes(term)) && (!cat.value || p.cat === cat.value) && (!packs.checked || packSize(p) >= MIN));
    rows.innerHTML = list.length ? list.map(p => `<div class="b-row" data-id="${p.id}">
      <span class="th" style="--tone:var(--${p.tone || 'blush'})">${p.img ? `<img src="${p.img}" alt="">` : svg(p.icon || 'balloon')}</span>
      <span class="b-name"><a href="product.html?id=${p.id}">${p.name}</a><small>${p.cat}${packSize(p) >= MIN ? ` &middot; ${packSize(p)} per pack` : ''} &middot; ${aed(p.price)} each</small></span>
      <span class="b-qty"><button type="button" data-step="-10" aria-label="Remove 10">&minus;</button><input type="number" min="0" step="1" inputmode="numeric" value="${qty[p.id] || ''}" placeholder="0" aria-label="Quantity of ${p.name}"><button type="button" data-step="10" aria-label="Add 10">+</button></span>
      <span class="b-line tnum" data-line></span>
    </div>`).join('') : '<p class="text-secondary">No products match. Try another search.</p>';
    $$('.b-row', rows).forEach(paintRow);
  };

  const rate = units => TIERS.find(t => units >= t[0])[1];
  const paintRow = row => {
    const id = row.dataset.id, n = qty[id] || 0, p = HP.find(id);
    const bad = n > 0 && n < MIN;
    row.classList.toggle('is-bad', bad);
    $('[data-line]', row).textContent = n ? (bad ? `Min ${MIN}` : aed(n * p.price)) : '';
  };

  const totals = () => {
    const sel = Object.entries(qty).filter(([, n]) => n > 0);
    const ok = sel.filter(([, n]) => n >= MIN);
    const units = ok.reduce((s, [, n]) => s + n, 0);
    const sub = ok.reduce((s, [id, n]) => s + n * HP.find(id).price, 0);
    const r = rate(units), off = Math.round(sub * r);
    $('[data-s-lines]').textContent = ok.length;
    $('[data-s-units]').textContent = units;
    $('[data-s-sub]').textContent = aed(sub);
    $('[data-s-pct]').textContent = r ? `(${r * 100}%)` : '';
    $('[data-s-off]').textContent = '-' + aed(off);
    $('[data-s-tot]').textContent = aed(sub - off);
    const next = [...TIERS].reverse().find(t => t[0] > units && t[0] > 0);
    const hasBad = sel.length > ok.length;
    $('[data-s-hint]').textContent = hasBad ? `Each product needs at least ${MIN} units.` : !ok.length ? `Add ${MIN} or more of a product to start.` : next ? `Add ${next[0] - units} more units for ${next[1] * 100}% off.` : 'Top discount unlocked.';
    $('[data-b-add]').disabled = !ok.length || hasBad;
    $$('[data-tier]').forEach(li => li.classList.toggle('is-on', units >= +li.dataset.tier && +li.dataset.tier > 0));
  };

  const setQty = (row, n) => {
    qty[row.dataset.id] = Math.max(0, Math.floor(n) || 0);
    paintRow(row); totals();
  };

  rows.addEventListener('input', e => { const row = e.target.closest('.b-row'); if (row && e.target.matches('input')) setQty(row, +e.target.value); });
  rows.addEventListener('click', e => {
    const b = e.target.closest('[data-step]'); if (!b) return;
    const row = b.closest('.b-row'), cur = qty[row.dataset.id] || 0, d = +b.dataset.step;
    const n = d > 0 && cur < MIN ? MIN : cur + d;
    setQty(row, n < MIN && n > 0 ? 0 : n);
    $('input', row).value = qty[row.dataset.id] || '';
  });
  [q, cat, packs].forEach(el => el.addEventListener('input', render));

  $('[data-b-add]').addEventListener('click', e => {
    const ok = Object.entries(qty).filter(([, n]) => n >= MIN);
    const units = ok.reduce((s, [, n]) => s + n, 0), r = rate(units);
    const cur = HP.basket.get().filter(i => !i.id.startsWith('bulk-'));
    ok.forEach(([id, n]) => { const p = HP.find(id); cur.push({ id: 'bulk-' + id, name: p.name + ' (bulk)', price: +(p.price * (1 - r)).toFixed(2), img: p.img, icon: p.icon, tone: p.tone, qty: n }); });
    HP.basket.set(cur);
    $('[data-b-msg]').textContent = `${units} units added to your basket${r ? ` at ${r * 100}% off` : ''}.`;
    HP.confetti && HP.confetti(e.currentTarget);
  });

  render(); totals();
})();
