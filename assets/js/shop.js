(() => {
  const { waapi, stagger } = anime;
  const { $, $$, aed, reduced } = HP;
  const items = [...HP.products, ...HP.packs];
  const params = new URLSearchParams(location.search);

  /* Balloon filters (same groups as the main Balloons category) */
  const MATERIALS = ['Standard', 'Metallic', 'Macaron', 'Chrome'];
  const COLOURS = {
    'Black': '#1E1A22', 'Baby Blue': '#9CCBEF', 'Baby Pink': '#F5BCD0', 'Beige': '#E6D3B3', 'Blue': '#2F6FD0', 'Creme': '#F3E9D2',
    'Gold': '#D4A12A', 'Green': '#3FAF5A', 'Lavender': '#B9A3E3', 'Multicolour': 'multi', 'Orange': '#F08A2B', 'Pink': '#EC5C9A',
    'Purple': '#7A3FB0', 'Red': '#D8262E', 'Rose Gold': '#D99A8C', 'Silver': '#B7BDC6', 'White': '#F7F7F7', 'Yellow': '#F2C832', 'Brown': '#8A5A34'
  };
  const SHAPES = { Round: '●', Heart: '♥', Star: '★', Number: '5', Letter: 'A' };
  const SIZES = ['5in', '10in', '11in', '12in', '18in', '32in'];
  const BANDS = [
    { id: 'u10', label: 'Under AED 10', min: 0, max: 10 },
    { id: '10-25', label: 'AED 10 – 25', min: 10, max: 25 },
    { id: '25-50', label: 'AED 25 – 50', min: 25, max: 50 },
    { id: '50+', label: 'AED 50 and up', min: 50, max: 1e9 }
  ];

  /* Balloon sub-categories come from the Balloons menu itself */
  const TREE = [...document.querySelectorAll('#mega-1 .mega-balloons > div')].map(col => ({
    name: col.querySelector('h4 a').textContent.trim(),
    items: [...col.querySelectorAll('li a')].map(a => a.textContent.trim())
  }));

  const state = {
    cats: new Set(params.getAll('cat')),
    occs: new Set(params.getAll('occ')),
    q: (params.get('q') || '').trim().toLowerCase(),
    offer: params.get('offer') === '1',
    max: 300,
    sort: 'featured',
    sub: params.get('sub') || '',
    item: params.get('item') || '',
    material: MATERIALS.includes(params.get('material')) ? params.get('material') : '',
    colours: new Set(params.getAll('colour').filter(c => COLOURS[c])),
    shapes: new Set(params.getAll('shape').filter(s => SHAPES[s])),
    sizes: new Set(params.getAll('size').filter(s => SIZES.includes(s))),
    bands: new Set()
  };
  if (state.sub && !TREE.some(t => t.name === state.sub)) state.sub = '';
  if (state.item && !(TREE.find(t => t.name === state.sub) || { items: [] }).items.includes(state.item)) state.item = '';
  if (state.sub || state.colours.size || state.shapes.size || state.sizes.size) state.cats.add('Balloons');
  if (state.q) $('#q-top').value = params.get('q');

  const unique = arr => [...new Set(arr)];
  const cats = unique([...items.map(p => p.cat), ...state.cats]);
  const occs = unique([...items.flatMap(p => p.occ), ...state.occs]);
  const count = (fn) => items.filter(fn).length;
  const isBalloons = () => state.cats.has('Balloons');
  const resetBalloon = () => { state.sub = ''; state.item = ''; state.material = ''; state.colours.clear(); state.shapes.clear(); state.sizes.clear(); state.bands.clear(); };

  const balloons = items.filter(p => p.cat === 'Balloons');
  const colourList = Object.keys(COLOURS).filter(c => balloons.some(p => (p.colour || []).includes(c)));
  const shapeList = Object.keys(SHAPES).filter(s => balloons.some(p => p.shape === s));
  const sizeList = SIZES.filter(s => balloons.some(p => p.size === s));

  const check = (name, value, label, on, ct) => `
      <label class="check"><input type="checkbox" name="${name}" value="${value}" ${on ? 'checked' : ''}>${label}<span class="ct">${ct}</span></label>`;

  const balloonFilters = () => `
    ${colourList.length ? `<div class="fgroup"><h3>Colour</h3><div class="swatches">${colourList.map(c => `
      <label class="sw" title="${c}"><input type="checkbox" name="colour" value="${c}" ${state.colours.has(c) ? 'checked' : ''} aria-label="${c}"><span class="sw-dot${COLOURS[c] === 'multi' ? ' is-multi' : ''}" style="${COLOURS[c] === 'multi' ? '' : `background:${COLOURS[c]}`}"></span></label>`).join('')}</div></div>` : ''}
    ${shapeList.length ? `<div class="fgroup"><h3>Shape</h3>${shapeList.map(s => check('shape', s, `<span class="glyph" aria-hidden="true">${SHAPES[s]}</span>${s}`, state.shapes.has(s), count(p => p.shape === s))).join('')}</div>` : ''}
    ${sizeList.length ? `<div class="fgroup"><h3>Size</h3>${sizeList.map(s => check('size', s, s, state.sizes.has(s), count(p => p.size === s))).join('')}</div>` : ''}
    <div class="fgroup"><h3>Price</h3>${BANDS.map(b => check('band', b.id, b.label, state.bands.has(b.id), count(p => p.price >= b.min && p.price < b.max && (!isBalloons() || p.cat === 'Balloons')))).join('')}</div>`;

  const filtersHtml = () => `
    <h2>Filter</h2>
    <div class="fgroup"><h3>Category</h3>${cats.map(c => `
      <label class="check"><input type="checkbox" name="cat" value="${c}" ${state.cats.has(c) ? 'checked' : ''}>${c}<span class="ct">${count(p => p.cat === c)}</span></label>`).join('')}
    </div>
    ${isBalloons() ? balloonFilters() : ''}
    <div class="fgroup"><h3>Occasion</h3>${occs.map(o => `
      <label class="check"><input type="checkbox" name="occ" value="${o}" ${state.occs.has(o) ? 'checked' : ''}>${o}<span class="ct">${count(p => p.occ.includes(o))}</span></label>`).join('')}
    </div>
    ${isBalloons() ? '' : `<div class="fgroup price-range"><h3>Price up to <output data-max-out>${aed(state.max)}</output></h3>
      <input type="range" name="max" min="20" max="300" step="10" value="${state.max}" aria-label="Maximum price in AED">
    </div>`}
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

  const SETS = { colour: 'colours', shape: 'shapes', size: 'sizes', band: 'bands', cat: 'cats', occ: 'occs' };
  panel.addEventListener('input', e => {
    const t = e.target;
    if (SETS[t.name]) {
      const set = state[SETS[t.name]];
      t.checked ? set.add(t.value) : set.delete(t.value);
    }
    if (t.name === 'offer') state.offer = t.checked;
    if (t.name === 'max') { state.max = +t.value; $('[data-max-out]', panel).textContent = aed(state.max); }
    if (t.name === 'cat') {
      const was = panel.contains(panel.querySelector('[name="colour"], [name="band"]'));
      if (!isBalloons()) resetBalloon();
      if (was !== isBalloons()) {
        panel.innerHTML = filtersHtml();
        const again = panel.querySelector(`[name="cat"][value="${t.value}"]`);
        again && again.focus();
      }
    }
    render();
  });
  $('[data-sort]').addEventListener('change', e => { state.sort = e.target.value; render(); });

  const rebuild = () => { panel.innerHTML = filtersHtml(); render(); };
  const clearAll = () => {
    state.cats.clear(); state.occs.clear(); state.q = ''; state.offer = false; state.max = 300; resetBalloon();
    $('#q-top').value = '';
    rebuild();
  };
  $('[data-clear]').addEventListener('click', clearAll);

  const chips = $('[data-active-filters]');
  chips.addEventListener('click', e => {
    const b = e.target.closest('[data-chip]');
    if (!b) return;
    const [kind, val] = b.dataset.chip.split('|');
    if (kind === 'all') return clearAll();
    if (kind === 'cat') { state.cats.delete(val); if (!isBalloons()) resetBalloon(); }
    if (kind === 'occ') state.occs.delete(val);
    if (kind === 'q') { state.q = ''; $('#q-top').value = ''; }
    if (kind === 'offer') state.offer = false;
    if (kind === 'max') state.max = 300;
    if (kind === 'sub') { state.sub = ''; state.item = ''; state.material = ''; }
    if (kind === 'item') state.item = '';
    if (kind === 'material') state.material = '';
    if (SETS[kind]) state[SETS[kind]].delete(val);
    rebuild();
  });

  /* Browse row: balloon sub-categories, items and latex materials */
  const browse = $('[data-browse]');
  const row = (label, buttons) => `<div class="browse-row"><span class="browse-label">${label}</span><div class="browse-chips">${buttons}</div></div>`;
  const bBtn = (kind, val, text, on) => `<button type="button" data-browse-set="${kind}|${val}" aria-pressed="${on}">${text}</button>`;
  const renderBrowse = () => {
    const show = isBalloons() && state.cats.size === 1;
    browse.hidden = !show;
    if (!show) { browse.innerHTML = ''; return; }
    const sub = TREE.find(t => t.name === state.sub);
    let html = row('Browse', bBtn('sub', '', 'All balloons', !state.sub) + TREE.map(t => bBtn('sub', t.name, t.name, t.name === state.sub)).join(''));
    if (sub) html += row(sub.name, bBtn('item', '', 'All', !state.item) + sub.items.map(i => bBtn('item', i, i, i === state.item)).join(''));
    if (state.sub === 'Latex Balloons') html += row('Material', bBtn('material', '', 'Any', !state.material) + MATERIALS.map(m => bBtn('material', m, m, m === state.material)).join(''));
    browse.innerHTML = html;
  };
  browse.addEventListener('click', e => {
    const b = e.target.closest('[data-browse-set]');
    if (!b) return;
    const [kind, val] = b.dataset.browseSet.split('|');
    if (kind === 'sub') { state.sub = val; state.item = ''; state.material = ''; }
    else state[kind] = val;
    render();
    const again = browse.querySelector(`[data-browse-set="${b.dataset.browseSet}"]`);
    again && again.focus();
  });

  const sorters = {
    featured: () => 0,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
    new: (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)
  };

  const inBand = p => !state.bands.size || [...state.bands].some(id => { const b = BANDS.find(x => x.id === id); return p.price >= b.min && p.price < b.max; });

  const matches = p =>
    (!state.cats.size || state.cats.has(p.cat)) &&
    (!state.occs.size || p.occ.some(o => state.occs.has(o))) &&
    (!state.offer || p.was) &&
    p.price <= state.max &&
    (!state.sub || p.sub === state.sub) &&
    (!state.item || (p.items || []).includes(state.item)) &&
    (!state.material || p.material === state.material) &&
    (!state.colours.size || (p.colour || []).some(c => state.colours.has(c))) &&
    (!state.shapes.size || state.shapes.has(p.shape)) &&
    (!state.sizes.size || state.sizes.has(p.size)) &&
    inBand(p) &&
    (!state.q || `${p.name} ${p.cat} ${p.occ.join(' ')}`.toLowerCase().includes(state.q));

  const grid = $('[data-grid]');
  const empty = $('[data-empty]');

  const setHeading = () => {
    const title = $('[data-shop-title]');
    if (state.q) title.textContent = `Results for “${params.get('q') || state.q}”`;
    else if (state.item) title.textContent = state.item;
    else if (state.sub) title.textContent = state.sub;
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
    renderBrowse();

    const bandLabel = id => BANDS.find(b => b.id === id).label;
    chips.innerHTML = [
      ...[...state.cats].map(c => ['cat', c, c]),
      state.sub ? ['sub', state.sub, state.sub] : null,
      state.item ? ['item', state.item, state.item] : null,
      state.material ? ['material', state.material, state.material] : null,
      ...[...state.colours].map(c => ['colour', c, c]),
      ...[...state.shapes].map(s => ['shape', s, s]),
      ...[...state.sizes].map(s => ['size', s, s]),
      ...[...state.bands].map(b => ['band', b, bandLabel(b)]),
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