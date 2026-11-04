(() => {
  const { waapi, stagger } = anime;
  const { $, $$, aed, reduced } = HP;
  const items = [...HP.products, ...HP.packs];
  const params = new URLSearchParams(location.search);

  const state = {
    cats: new Set(params.getAll('cat')),
    occs: new Set(params.getAll('occ')),
    q: (params.get('q') || '').trim().toLowerCase(),
    offer: params.get('offer') === '1',
    max: 300,
    sort: 'featured'
  };
  if (state.q) $('#q-top').value = params.get('q');

  const unique = arr => [...new Set(arr)];
  const cats = unique([...items.map(p => p.cat), ...state.cats]);
  const occs = unique([...items.flatMap(p => p.occ), ...state.occs]);
  const count = (fn) => items.filter(fn).length;

  const filtersHtml = () => `
    <h2>Filter</h2>
    <div class="fgroup"><h3>Category</h3>${cats.map(c => `
      <label class="check"><input type="checkbox" name="cat" value="${c}" ${state.cats.has(c) ? 'checked' : ''}>${c}<span class="ct">${count(p => p.cat === c)}</span></label>`).join('')}
    </div>
    <div class="fgroup"><h3>Occasion</h3>${occs.map(o => `
      <label class="check"><input type="checkbox" name="occ" value="${o}" ${state.occs.has(o) ? 'checked' : ''}>${o}<span class="ct">${count(p => p.occ.includes(o))}</span></label>`).join('')}
    </div>
    <div class="fgroup price-range"><h3>Price up to <output data-max-out>${aed(state.max)}</output></h3>
      <input type="range" name="max" min="20" max="300" step="10" value="${state.max}" aria-label="Maximum price in AED">
    </div>
    <div class="fgroup"><label class="check"><input type="checkbox" name="offer" ${state.offer ? 'checked' : ''}>On offer only</label></div>`;

  const panel = document.createElement('form');
  panel.innerHTML = filtersHtml();
  panel.addEventListener('submit', e => e.preventDefault());
  const desktopHost = $('[data-filters-host]');
  const mobileHost = $('[data-filters-mobile]');
  const mq = matchMedia('(max-width: 991.98px)');
  const place = () => (mq.matches ? mobileHost : desktopHost).appendChild(panel);
  mq.addEventListener('change', place);
  place();

  panel.addEventListener('input', e => {
    const t = e.target;
    if (t.name === 'cat' || t.name === 'occ') {
      const set = t.name === 'cat' ? state.cats : state.occs;
      t.checked ? set.add(t.value) : set.delete(t.value);
    }
    if (t.name === 'offer') state.offer = t.checked;
    if (t.name === 'max') { state.max = +t.value; $('[data-max-out]', panel).textContent = aed(state.max); }
    render();
  });
  $('[data-sort]').addEventListener('change', e => { state.sort = e.target.value; render(); });

  const clearAll = () => {
    state.cats.clear(); state.occs.clear(); state.q = ''; state.offer = false; state.max = 300;
    $('#q-top').value = '';
    panel.innerHTML = filtersHtml();
    render();
  };
  $('[data-clear]').addEventListener('click', clearAll);

  const chips = $('[data-active-filters]');
  chips.addEventListener('click', e => {
    const b = e.target.closest('[data-chip]');
    if (!b) return;
    const [kind, val] = b.dataset.chip.split('|');
    if (kind === 'all') return clearAll();
    if (kind === 'cat') state.cats.delete(val);
    if (kind === 'occ') state.occs.delete(val);
    if (kind === 'q') { state.q = ''; $('#q-top').value = ''; }
    if (kind === 'offer') state.offer = false;
    if (kind === 'max') state.max = 300;
    panel.innerHTML = filtersHtml();
    render();
  });

  const sorters = {
    featured: () => 0,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
    new: (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)
  };

  const matches = p =>
    (!state.cats.size || state.cats.has(p.cat)) &&
    (!state.occs.size || p.occ.some(o => state.occs.has(o))) &&
    (!state.offer || p.was) &&
    p.price <= state.max &&
    (!state.q || `${p.name} ${p.cat} ${p.occ.join(' ')}`.toLowerCase().includes(state.q));

  const grid = $('[data-grid]');
  const empty = $('[data-empty]');

  const setHeading = () => {
    const title = $('[data-shop-title]');
    if (state.q) title.textContent = `Results for “${params.get('q') || state.q}”`;
    else if (state.cats.size === 1) title.textContent = [...state.cats][0];
    else if (state.occs.size === 1) title.textContent = [...state.occs][0];
    else if (state.offer) title.textContent = 'Offers';
    else title.textContent = 'All products';
  };

  function render() {
    const list = items.filter(matches).sort(sorters[state.sort]);
    $('[data-result-count]').textContent = list.length;
    grid.innerHTML = list.map(HP.card).join('');
    empty.hidden = list.length > 0;

    chips.innerHTML = [
      ...[...state.cats].map(c => ['cat', c, c]),
      ...[...state.occs].map(o => ['occ', o, o]),
      state.q ? ['q', state.q, `“${state.q}”`] : null,
      state.offer ? ['offer', '1', 'On offer'] : null,
      state.max < 300 ? ['max', state.max, `Up to ${aed(state.max)}`] : null
    ].filter(Boolean).map(([k, v, l]) => `<button type="button" data-chip="${k}|${v}" aria-label="Remove filter ${l}">${l}<i class="bi bi-x-lg" aria-hidden="true"></i></button>`).join('');
    if (chips.children.length) chips.insertAdjacentHTML('beforeend', '<button type="button" class="af-clear" data-chip="all|"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>Clear all</button>');

    setHeading();
    if (!reduced && list.length) {
      waapi.animate([...grid.children].slice(0, 12), { opacity: [0, 1], translateY: [20, 0], delay: stagger(40), duration: 700, ease: 'outExpo' });
    }
  }

  render();

  if (!reduced) {
    waapi.animate($('[data-shop-title]'), { opacity: [0, 1], translateY: [30, 0], duration: 900, ease: 'outExpo' });
    waapi.animate($('[data-hero-mascot]'), { translateY: [60, 0], rotate: [8, 0], opacity: [0, 1], duration: 1100, ease: 'outBack(1.4)' });
  }
})();

/* Custom sort dropdown (native select stays as the source of truth) */
(() => {
  const sel = document.querySelector('[data-sort]');
  if (!sel) return;
  const wrap = document.createElement('div');
  wrap.className = 'sort-dd';
  wrap.innerHTML = '<button type="button" class="sort-btn" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="sort-lbl"><span></span></button><ul class="sort-menu" role="listbox" aria-labelledby="sort-lbl" tabindex="-1" hidden></ul>';
  sel.after(wrap);
  sel.classList.add('sort-native');
  sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
  const btn = wrap.querySelector('button'), menu = wrap.querySelector('ul');
  menu.innerHTML = [...sel.options].map(o => `<li role="option" data-v="${o.value}"><i class="bi bi-check2" aria-hidden="true"></i>${o.textContent}</li>`).join('');
  const items = [...menu.children];
  let idx = 0;
  const paint = () => {
    btn.firstChild.textContent = sel.options[sel.selectedIndex].textContent;
    items.forEach((li, i) => { li.setAttribute('aria-selected', String(li.dataset.v === sel.value)); li.classList.toggle('is-active', i === idx); });
  };
  const open = () => { idx = sel.selectedIndex; menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); paint(); menu.focus(); };
  const close = (focus = true) => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focus) btn.focus(); };
  const pick = i => { if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); } paint(); close(); };
  btn.addEventListener('click', () => (menu.hidden ? open() : close()));
  menu.addEventListener('click', e => { const li = e.target.closest('li'); if (li) pick(items.indexOf(li)); });
  menu.addEventListener('mousemove', e => { const li = e.target.closest('li'); if (li) { idx = items.indexOf(li); paint(); } });
  menu.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { idx = Math.min(items.length - 1, idx + 1); paint(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { idx = Math.max(0, idx - 1); paint(); e.preventDefault(); }
    else if (e.key === 'Home') { idx = 0; paint(); e.preventDefault(); }
    else if (e.key === 'End') { idx = items.length - 1; paint(); e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === ' ') { pick(idx); e.preventDefault(); }
    else if (e.key === 'Escape') { close(); e.preventDefault(); }
    else if (e.key === 'Tab') close(false);
  });
  btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { open(); e.preventDefault(); } });
  document.addEventListener('click', e => { if (!wrap.contains(e.target) && !menu.hidden) close(false); });
  sel.addEventListener('change', paint);
  paint();
})();