(() => {
  const { waapi, stagger } = anime;
  const { $, $$, aed, reduced } = HP;
  const items = [...HP.products, ...HP.packs];
  const params = new URLSearchParams(location.search);

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

  /* Colour and availability for every product (demo data derived from tone, name and id) */
  const TONE_COLOUR = { pink: 'Pink', sky: 'Baby Blue', lilac: 'Lavender', sun: 'Gold', mint: 'Green', red: 'Red', blush: 'Baby Pink' };
  const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  items.forEach(p => {
    if (!p.colour) {
      const n = p.name.toLowerCase();
      p.colour = /rose gold/.test(n) ? ['Rose Gold'] : /rainbow|confetti|unicorn/.test(n) ? ['Multicolour']
        : /gold/.test(n) ? ['Gold'] : /pink/.test(n) ? ['Pink'] : p.tone ? [TONE_COLOUR[p.tone] || 'Multicolour'] : ['Multicolour'];
    }
    if (p.stock === undefined) { const h = hash(p.id); p.stock = h % 9 !== 0; p.sameday = h % 3 !== 0; }
  });

  /* Categories, sub-categories and items come from the main menu itself */
  const MENU = {};
  $$('.mega[data-cat]').forEach(m => {
    MENU[m.dataset.cat] = [...m.querySelectorAll('.mm-col')].map(col => {
      const name = col.querySelector('h4 a').textContent.trim();
      return { name, items: [...col.querySelectorAll('li a')].map(a => a.textContent.trim()).filter(x => x !== name) };
    });
  });
  const treeOf = c => MENU[c] || [];
  const curTree = () => (state.cats.size === 1 ? treeOf([...state.cats][0]) : []);

  const state = {
    cats: new Set(params.getAll('cat')),
    occs: new Set(params.getAll('occ')),
    q: (params.get('q') || '').trim().toLowerCase(),
    s: '',
    offer: params.get('offer') === '1',
    instock: false,
    sameday: false,
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
  if (state.material) state.cats.add('Balloons');
  {
    const tree = curTree();
    if (state.sub && !tree.some(x => x.name === state.sub)) state.sub = '';
    if (state.item && !(tree.find(x => x.name === state.sub) || { items: [] }).items.includes(state.item)) state.item = '';
  }
  if (state.q) $('#q-top').value = params.get('q');

  const unique = arr => [...new Set(arr)];
  const cats = unique([...items.map(p => p.cat), ...state.cats]);
  const occs = unique([...items.flatMap(p => p.occ || []), ...state.occs]);
  const count = (fn) => items.filter(fn).length;
  const isBalloons = () => state.cats.has('Balloons');
  const PRODUCT_CATS = new Set(items.map(p => p.cat));
  const stem = c => c.toLowerCase().replace(/s$/, '');
  const hay = p => `${p.name} ${p.cat} ${(p.occ || []).join(' ')}`.toLowerCase();
  const realCat = () => state.cats.size === 1 && PRODUCT_CATS.has([...state.cats][0]);
  const catMatch = (p, c) => (PRODUCT_CATS.has(c) ? p.cat === c : hay(p).includes(stem(c)));
  const catHit = p => !state.cats.size || [...state.cats].some(c => catMatch(p, c));
  const subHit = p => !state.sub || !realCat() || p.sub === state.sub;
  const hasItem = (p, i) => (p.items || []).includes(i) || p.name.toLowerCase().includes(i.toLowerCase());
  const itemHit = p => !state.item || hasItem(p, state.item);
  const matHit = p => !state.material || p.material === state.material;
  const inScope = p => catHit(p) && subHit(p) && itemHit(p) && matHit(p);
  const resetBalloon = () => { state.sub = ''; state.item = ''; state.material = ''; };

  
  const group = (title, body, open = true) => `<details class="cf-group"${open ? ' open' : ''}><summary>${title}</summary><div class="cf-body">${body}</div></details>`;
  const row = (name, value, label, on, ct, lead = '') => `
      <label class="check"><input type="checkbox" name="${name}" value="${value}" ${on ? 'checked' : ''}>${lead}<span class="cf-name">${label}</span>${ct === '' ? '' : `<span class="ct">${ct}</span>`}</label>`;

  const filtersHtml = () => {
    const scope = items.filter(inScope);
    const shapeList = Object.keys(SHAPES).filter(s => scope.some(p => p.shape === s));
    const sizeList = SIZES.filter(s => scope.some(p => p.size === s));
    const colours = Object.keys(COLOURS).map(c => {
      const n = scope.filter(p => p.colour.includes(c)).length;
      const sw = `<span class="cf-sw${COLOURS[c] === 'multi' ? ' is-multi' : ''}" style="${COLOURS[c] === 'multi' ? '' : `background:${COLOURS[c]}`}"></span>`;
      return `<div class="${n || state.colours.has(c) ? '' : 'is-empty'}">${row('colour', c, c, state.colours.has(c), n, sw)}</div>`;
    }).join('');
    const curSub = curTree().find(x => x.name === state.sub);
    const inSub = items.filter(p => catHit(p) && subHit(p));
    const subGroup = curSub && curSub.items.length
      ? group(curSub.name, curSub.items.map(i => row('item', i, i, state.item === i, inSub.filter(p => hasItem(p, i)).length)).join(''))
      : '';
    const catGroup = group('Category', Object.keys(MENU).map(c => row('cat', c, c, state.cats.has(c), items.filter(p => catMatch(p, c)).length)).join(''));
    return `
    <div class="cf">
      ${catGroup}
      ${subGroup}
      ${group('Colour', colours)}
      ${shapeList.length ? group('Shape', shapeList.map(s => row('shape', s, s, state.shapes.has(s), scope.filter(p => p.shape === s).length, `<span class="cf-glyph" aria-hidden="true">${SHAPES[s]}</span>`)).join('')) : ''}
      ${sizeList.length ? group('Size', sizeList.map(s => row('size', s, s, state.sizes.has(s), scope.filter(p => p.size === s).length)).join('')) : ''}
      ${group('Price', BANDS.map(b => row('band', b.id, b.label, state.bands.has(b.id), '')).join(''))}
      ${group('Availability', row('instock', '1', 'In stock only', state.instock, '') + row('sameday', '1', 'Same-day delivery', state.sameday, '') + row('offer', '1', 'On offer only', state.offer, ''))}
      ${group('Occasion', occs.map(o => row('occ', o, o, state.occs.has(o), scope.filter(p => (p.occ || []).includes(o)).length)).join(''), state.occs.size > 0)}
    </div>`;
  };

  const panel = document.createElement('form');
  panel.innerHTML = filtersHtml();
  panel.addEventListener('submit', e => e.preventDefault());
  const desktopHost = $('[data-filters-host]');
  const mobileHost = $('[data-filters-mobile]');
  const mq = matchMedia('(max-width: 991.98px)');
  const place = () => (mq.matches ? mobileHost : desktopHost).appendChild(panel);
  mq.addEventListener('change', place);
  place();

  const SETS = { colour: 'colours', shape: 'shapes', size: 'sizes', band: 'bands', occ: 'occs' };
  panel.addEventListener('input', e => {
    const t = e.target;
    if (SETS[t.name]) {
      const set = state[SETS[t.name]];
      t.checked ? set.add(t.value) : set.delete(t.value);
    }
    if (t.name === 'offer' || t.name === 'instock' || t.name === 'sameday') state[t.name] = t.checked;
    if (t.name === 'cat') { state.cats.clear(); resetBalloon(); if (t.checked) state.cats.add(t.value); panel.innerHTML = filtersHtml(); }
    if (t.name === 'item') { state.item = t.checked ? t.value : ''; panel.innerHTML = filtersHtml(); }
    render();
  });
  $('[data-sort]').addEventListener('change', e => { state.sort = e.target.value; render(); });

  const search = $('[data-search]');
  search.addEventListener('input', () => { state.s = search.value.trim().toLowerCase(); render(); });

  const grid = $('[data-grid]');
  const rebuild = () => { panel.innerHTML = filtersHtml(); render(); };
  const clearAll = () => {
    state.cats.clear(); state.occs.clear(); state.q = ''; state.s = ''; state.offer = false; state.instock = false; state.sameday = false; state.max = 300;
    state.colours.clear(); state.shapes.clear(); state.sizes.clear(); state.bands.clear(); resetBalloon();
    $('#q-top').value = ''; search.value = '';
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
    if (kind === 'instock') state.instock = false;
    if (kind === 'sameday') state.sameday = false;
    if (kind === 'max') state.max = 300;
    if (kind === 'sub') { state.sub = ''; state.item = ''; state.material = ''; }
    if (kind === 'item') state.item = '';
    if (kind === 'material') state.material = '';
    if (SETS[kind] && kind !== 'cat') state[SETS[kind]].delete(val);
    rebuild();
  });

  /* Browse rows and material chips live in the banner, like the Balloons category page */
  const browse = $('[data-browse]');
  const heroMat = $('[data-hero-mat]');
  const hero = $('.page-hero');
  const brow = (label, buttons) => `<div class="browse-row"><span class="browse-label">${label}</span><div class="browse-chips">${buttons}</div></div>`;
  const bBtn = (kind, val, text, on, lead = '') => `<button type="button" data-browse-set="${kind}|${val}" aria-pressed="${on}">${lead}${text}</button>`;
  const renderBrowse = () => {
    const tree = curTree();
    const show = tree.length > 0;
    const bal = show && isBalloons();
    hero.classList.toggle('is-cat', show);
    browse.hidden = !show;
    heroMat.hidden = !bal;
    if (!show) { browse.innerHTML = heroMat.innerHTML = ''; return; }
    const sub = tree.find(x => x.name === state.sub);
    const cat = [...state.cats][0];
    const html = sub
      ? ''
      : brow(`In ${cat}`, tree.map(x => bBtn('sub', x.name, x.name, false)).join(''));
    browse.innerHTML = html;
    browse.hidden = !html;
    heroMat.innerHTML = bal ? brow('Material', bBtn('material', '', 'All materials', !state.material) + MATERIALS.map(m => bBtn('material', m, m, m === state.material, `<span class="mat-dot mat-dot--${m.toLowerCase()}"></span>`)).join('')) : '';
  };
  const onBrowse = e => {
    const b = e.target.closest('[data-browse-set]');
    if (!b) return;
    const [kind, val] = b.dataset.browseSet.split('|');
    if (kind === 'sub') { state.sub = state.sub === val ? '' : val; state.item = ''; }
    else if (kind === 'item') state.item = state.item === val ? '' : val;
    else state[kind] = val;
    panel.innerHTML = filtersHtml();
    render();
    const again = hero.querySelector(`[data-browse-set="${b.dataset.browseSet}"]`);
    again && again.focus();
  };
  browse.addEventListener('click', onBrowse);
  heroMat.addEventListener('click', onBrowse);

  const crumbs = $('[data-crumbs]');
  const setCrumbs = () => {
    const parts = ['<a href="index.html">Home</a>'];
    const cat = state.cats.size === 1 ? [...state.cats][0] : '';
    const link = (text, fn) => `<a href="#" data-crumb="${fn}">${text}</a>`;
    if (cat) {
      parts.push(state.sub ? link(cat, 'cat') : `<span aria-current="page">${cat}</span>`);
      if (state.sub) parts.push(state.item ? link(state.sub, 'sub') : `<span aria-current="page">${state.sub}</span>`);
      if (state.item) parts.push(`<span aria-current="page">${state.item}</span>`);
    } else parts.push('<span aria-current="page">All products</span>');
    crumbs.innerHTML = parts.join(' / ');
  };
  crumbs.addEventListener('click', e => {
    const a = e.target.closest('[data-crumb]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.crumb === 'cat') { state.sub = ''; state.item = ''; } else state.item = '';
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

  const inBand = p => !state.bands.size || [...state.bands].some(id => { const b = BANDS.find(x => x.id === id); return p.price >= b.min && p.price < b.max; });

  const matches = p =>
    catHit(p) &&
    (!state.occs.size || (p.occ || []).some(o => state.occs.has(o))) &&
    (!state.offer || p.was) &&
    (!state.instock || p.stock) &&
    (!state.sameday || p.sameday) &&
    p.price <= state.max &&
    subHit(p) && itemHit(p) && matHit(p) &&
    (!state.colours.size || p.colour.some(c => state.colours.has(c))) &&
    (!state.shapes.size || state.shapes.has(p.shape)) &&
    (!state.sizes.size || state.sizes.has(p.size)) &&
    inBand(p) &&
    (!state.s || p.name.toLowerCase().includes(state.s)) &&
    (!state.q || `${p.name} ${p.cat} ${(p.occ || []).join(' ')}`.toLowerCase().includes(state.q));

  const empty = $('[data-empty]');

  const setHeading = () => {
    const title = $('[data-shop-title]');
    if (state.q) title.textContent = `Results for “${params.get('q') || state.q}”`;
    else if (state.item) title.textContent = state.item;
    else if (state.sub) title.textContent = state.sub;
    else if (state.cats.size === 1) title.textContent = [...state.cats][0];
    else if (state.colours.size === 1 && !state.cats.size) title.textContent = `${[...state.colours][0]} party supplies`;
    else if (state.occs.size === 1) title.textContent = [...state.occs][0];
    else if (state.offer) title.textContent = 'Offers';
    else title.textContent = 'All products';
  };

  function render() {
    const list = items.filter(matches).sort(sorters[state.sort]);
    $('[data-result-count]').textContent = list.length;
    $('[data-total]').textContent = items.length;
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
      state.instock ? ['instock', '1', 'In stock'] : null,
      state.sameday ? ['sameday', '1', 'Same-day delivery'] : null
    ].filter(Boolean).map(([k, v, l]) => `<button type="button" data-chip="${k}|${v}" aria-label="Remove filter ${l}">${l}<i class="bi bi-x-lg" aria-hidden="true"></i></button>`).join('');
    if (chips.children.length) chips.insertAdjacentHTML('beforeend', '<button type="button" class="af-clear" data-chip="all|"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>Clear all</button>');

    setHeading();
    setCrumbs();
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