(() => {
  const { waapi, animate, createTimeline, stagger, splitText, utils } = anime;
  const { $, $$, aed, reduced } = HP;
  /* ---------- Intro screen (first visit per session) ---------- */
  const introEl = $('[data-intro]');
  if (introEl && document.documentElement.classList.contains('has-intro') && !reduced) {
    const root = document.documentElement;
    const brand = $('[data-intro-brand]');
    const letters = [];
    brand.childNodes.forEach(n => {
      const wrap = document.createElement('span');
      wrap.style.display = 'inline-flex';
      wrap.setAttribute('aria-hidden', 'true');
      [...n.textContent.trim()].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; wrap.appendChild(s); letters.push(s); });
      if (n.nodeType === 1) { wrap.className = n.className; wrap.style.color = '#F52B91'; }
      n.replaceWith(wrap);
    });
    const rider = $('[data-intro-rider]'), tag = $('[data-intro-tag]'), bar = $('[data-intro-bar]'), count = $('[data-intro-count]');
    letters.forEach(l => (l.style.opacity = 0));
    tag.style.opacity = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { sessionStorage.setItem('hp-intro', '1'); } catch {}
      introEl.style.borderRadius = '0 0 50% 50% / 0 0 9vw 9vw';
      waapi.animate(rider, { translateX: [0, '70vw'], scale: [1, 1.12], opacity: [1, 0], duration: 600, ease: 'inQuad' });
      waapi.animate(introEl, { translateY: [0, '-102%'], duration: 950, delay: 220, ease: 'inOutExpo', onComplete: () => { root.classList.remove('has-intro'); introEl.remove(); } });
    };
    waapi.animate(rider, { translateX: ['-110vw', 0], rotate: [-8, 0], duration: 1300, ease: 'outExpo' });
    waapi.animate(letters, { opacity: [0, 1], translateY: [46, 0], rotate: [10, 0], delay: stagger(45, { start: 500 }), duration: 800, ease: 'outBack(1.8)' });
    waapi.animate(tag, { opacity: [0, 1], translateY: [14, 0], delay: 1100, duration: 700, ease: 'outExpo' });
    const o = { v: 0 };
    animate(o, {
      v: 100, duration: 2100, delay: 300, ease: 'inOutQuad', modifier: utils.round(0),
      onUpdate: () => { count.textContent = o.v; bar.style.transform = `scaleX(${o.v / 100})`; },
      onComplete: () => setTimeout(finish, 280)
    });
    $('[data-intro-skip]').addEventListener('click', finish);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') finish(); });
    setTimeout(finish, 6500);
  } else if (introEl) {
    introEl.remove();
  }

  /* ---------- Packs + featured ---------- */
  $('[data-packs]').innerHTML = HP.packs.map(p => `
    <article class="pack">
      <div class="pack-photo">
        <img src="${p.img}" alt="${p.name} Habibi Rescue party pack" width="460" height="460" loading="lazy">
        <button class="add-fab" type="button" data-add="${p.id}" aria-label="Add ${p.name} pack to basket"><i class="bi bi-plus-lg" aria-hidden="true"></i></button>
      </div>
      <div class="pack-meta"><h3>${p.name}</h3><span class="price">${aed(p.price)}</span></div>
    </article>`).join('');
  $('[data-featured]').innerHTML = HP.products.slice(0, 8).map(HP.card).join('');
  HP.onEnter([$('[data-packs]')], el => HP.reveal(el, [...el.children]));
  HP.onEnter([$('[data-featured]')], el => HP.reveal(el, [...el.children]));

  /* ---------- Marquee ---------- */
  if (!reduced) {
    const track = $('[data-marquee]');
    waapi.animate(track, { translateX: ['0%', '-50%'], duration: 32000, loop: true, ease: 'linear' });
  }

  /* ---------- Hero occasion strip ---------- */
  const occ = $('[data-occ]');
  if (occ) {
    const chips = $('[data-occ-chips]', occ), next = $('[data-occ-next]', occ);
    const atEnd = () => chips.scrollLeft + chips.clientWidth >= chips.scrollWidth - 4;
    const sync = () => next.classList.toggle('is-end', atEnd());
    next.addEventListener('click', () => {
      if (atEnd()) chips.scrollTo({ left: 0, behavior: reduced ? 'auto' : 'smooth' });
      else chips.scrollBy({ left: chips.clientWidth * .8, behavior: reduced ? 'auto' : 'smooth' });
    });
    chips.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
    HP.onEnter([occ], el => {
      el.classList.add('is-in');
      if (reduced) return;
      waapi.animate($$('h2, p', el), { opacity: [0, 1], translateY: [18, 0], delay: stagger(90), duration: 700, ease: 'outExpo' });
      waapi.animate($$('.occ-chips li', el), { opacity: [0, 1], translateY: [26, 0], scale: [.9, 1], delay: stagger(80, { start: 250 }), duration: 700, ease: 'outBack(1.6)' });
      waapi.animate(next, { opacity: [0, 1], scale: [0, 1], delay: 700, duration: 600, ease: 'outBack(2)' });
    }, '0px');
  }

  /* ---------- Bundle deals ---------- */
  const bundles = $('[data-bundles]');
  if (bundles) {
    const THEMES = [
      { bg: '#9FE6D6', a: '#17A58B', d: '#0E7A66', l: '#4FCDB5', kick: 'Cake, candles, confetti', title: 'Birthday Bash Collection' },
      { bg: '#FFD3BA', a: '#F2895A', d: '#C4592B', l: '#F7AE88', kick: 'Adorable beginning bash', title: 'Baby Shower Collection' },
      { bg: '#CBB4F5', a: '#6E3FC4', d: '#4A2397', l: '#9B74E6', kick: 'Cap, toss, celebrate', title: 'Grad Night Collection' },
      { bg: '#FCDDEB', a: '#F77FB0', d: '#46A9E6', l: '#8FD0F5', kick: 'The sweetest surprise', title: 'Boy or Girl Collection', html: '<b style="color:#2F9BE0">Boy</b> or <b style="color:#F0508F">Girl</b> Collection' },
      { bg: '#FFC9B5', a: '#E8553D', d: '#B33621', l: '#FF8F78', kick: 'Sunshine and snacks', title: 'Sunny Picnic Collection' },
      { bg: '#F9C7E8', a: '#D63AB0', d: '#9C1F82', l: '#EC7BD0', kick: 'Last fling before the ring', title: 'Bride Tribe Collection' },
      { bg: '#FFE08A', a: '#E8A60E', d: '#B97A00', l: '#FFC83D', kick: 'Elegant evenings', title: 'Golden Table Collection' }
    ];
    const stage = $('[data-b-stage]', bundles), links = $$('[data-b-list] a', bundles);
    const head = $('[data-b-head]', bundles), titleEl = $('[data-b-title]', bundles), kickEl = $('[data-b-kick]', bundles), shop = $('[data-b-shop]', bundles);
    let cur = 1, timer = 0, paused = false, started = false;

    const setTheme = (i, animateIn = true) => {
      cur = (i + THEMES.length) % THEMES.length;
      const t = THEMES[cur];
      ['bg', 'a', 'd', 'l'].forEach(k => stage.style.setProperty('--' + k, t[k]));
      links.forEach((a, n) => a.classList.toggle('is-on', n === cur));
      $$('.scene', stage).forEach((sc, n) => sc.classList.toggle('is-on', n === cur));
      const [first, ...rest] = t.title.split(' ');
      titleEl.innerHTML = t.html || `<b>${first}</b> ${rest.join(' ')}`;
      kickEl.textContent = t.kick;
      shop.href = links[cur].href;
      if (reduced || !animateIn) return;
      waapi.animate($$('.scene.is-on .it', stage), { opacity: [0, 1], scale: [.6, 1], translateY: [30, 0], delay: stagger(55), duration: 650, ease: 'outBack(1.7)' });
      waapi.animate($$('p, h3', head), { opacity: [0, 1], translateY: [10, 0], delay: stagger(70), duration: 500, ease: 'outExpo' });
    };

    links.forEach((a, n) => {
      a.addEventListener('pointerenter', e => { if (n !== cur && e.pointerType !== 'touch') setTheme(n); });
      a.addEventListener('click', e => { if (n !== cur) { e.preventDefault(); setTheme(n); } });
    });
    $('[data-b-next]', bundles).addEventListener('click', () => setTheme(cur + 1));
    bundles.addEventListener('pointerenter', () => { paused = true; });
    bundles.addEventListener('pointerleave', () => { paused = false; });
    bundles.addEventListener('focusin', () => { paused = true; });
    bundles.addEventListener('focusout', () => { paused = false; });
    setTheme(cur, false);

    HP.onEnter([bundles], el => {
      el.classList.add('is-in');
      if (reduced) return;
      waapi.animate($$('.b-side > *', el), { opacity: [0, 1], translateX: [-18, 0], delay: stagger(80), duration: 700, ease: 'outExpo' });
      waapi.animate($('.b-stage', el), { opacity: [0, 1], translateY: [24, 0], duration: 800, ease: 'outExpo' });
      waapi.animate($$('.scene.is-on .it', el), { opacity: [0, 1], scale: [.6, 1], translateY: [34, 0], delay: stagger(80, { start: 300 }), duration: 750, ease: 'outBack(1.7)' });
      if (!started) { started = true; timer = setInterval(() => { if (!paused && !document.hidden) setTheme(cur + 1); }, 6500); }
    }, '-80px');
  }
  /* ---------- Habibi Box builder ---------- */
  const BOX = {
    'Birthday':     { base: 230, items: ['Balloon garland kit', 'Tableware for {n}', 'Decoration kit', 'Number balloon and candle', 'Backdrop and banner', '{n} party bags'] },
    '1st birthday': { base: 250, items: ['Balloon garland kit', 'Tableware for {n}', 'ONE foil balloon and candle', 'High-chair banner', 'Backdrop and banner', '{n} party bags'] },
    'Baby shower':  { base: 240, items: ['Balloon garland kit', 'Tableware for {n}', 'Centrepiece set', 'Sash and badge', 'Backdrop and banner', '{n} favour pouches'] },
    'Graduation':   { base: 220, items: ['Balloon bouquet', 'Tableware for {n}', 'Grad cap decorations', 'Photo props', 'Backdrop and banner', '{n} party bags'] },
    'Eid':          { base: 210, items: ['Lantern set', 'Tableware for {n}', 'Eid Mubarak banner', 'Hanging decor', 'Gold balloon bouquet', '{n} Eidiya envelopes'] },
    'Wedding':      { base: 320, items: ['Balloon arch kit', 'Tableware for {n}', 'Flower centrepieces', 'Ring foil balloons', 'Backdrop and fairy lights', '{n} favour pouches'] }
  };
  const form = $('[data-builder]');
  const itemsEl = $('[data-box-items]');
  const totalEl = $('[data-box-total]');
  const fitEl = $('[data-box-fit]');
  const mascot = $('[data-box-mascot]');
  const shown = { v: 0 };
  let current = null;

  const readBox = () => {
    const f = new FormData(form);
    const event = f.get('event'), guests = +f.get('guests'), theme = f.get('theme'), budget = +f.get('budget');
    const def = BOX[event];
    return {
      event, guests, theme, budget,
      total: def.base + guests * 26,
      items: def.items.map(t => t.replace('{n}', guests)),
      title: `${theme} ${event.toLowerCase()}`
    };
  };

  const renderBox = (animateIn) => {
    current = readBox();
    $('[data-box-summary]').textContent = `${current.title} · ${current.guests} guests`;
    itemsEl.innerHTML = current.items.map(t => `<li>${t}</li>`).join('');

    const over = current.budget && current.total > current.budget;
    fitEl.className = 'fit ' + (over ? 'over' : 'ok');
    fitEl.textContent = !current.budget ? 'no budget limit set'
      : over ? `${aed(current.total - current.budget)} over budget. Try fewer guests or a higher budget`
      : `fits your ${aed(current.budget)} budget`;

    if (reduced || !animateIn) {
      shown.v = current.total;
      totalEl.textContent = aed(current.total);
      return;
    }
    waapi.animate([...itemsEl.children], { opacity: [0, 1], translateY: [-18, 0], scale: [.94, 1], delay: stagger(55), duration: 600, ease: 'outBack(1.4)' });
    animate(shown, { v: current.total, duration: 700, ease: 'outExpo', modifier: utils.round(0), onUpdate: () => (totalEl.textContent = aed(shown.v)) });
    waapi.animate(mascot, { rotate: [0, -8, 6, 0], translateY: [0, -12, 0], duration: 700, ease: 'outQuad' });
  };

  form.addEventListener('change', () => renderBox(true));
  if (mascot) {
    mascot.addEventListener('click', () => {
      if (reduced) return;
      waapi.animate(mascot, { translateY: [0, -46, 0], rotate: [0, -12, 10, 0], scale: [1, 1.1, .95, 1], duration: 750, ease: 'outBack(1.6)' });
      HP.confetti(mascot, 22);
    });
  }
  renderBox(false);
  $('[data-box-add]').addEventListener('click', e => {
    HP.addToBasket({ id: `box-${current.event}-${current.guests}-${current.theme}`, name: `Habibi Box: ${current.title}, ${current.guests} guests`, price: current.total, icon: 'pouch', tone: 'sun' }, e.currentTarget);
  });

  /* ---------- Shop the look ---------- */
  const tabs = $('[data-look-tabs]');
  const stage = $('[data-look-stage]');
  const list = $('[data-look-list]');
  const lookBtn = $('[data-look-add]');
  let look = 2;

  tabs.innerHTML = HP.looks.map((l, i) => `<button type="button" role="tab" id="look-tab-${i}" aria-selected="${i === look}" data-look="${i}" aria-label="${l.label}"></button>`).join('');

  const setSpot = idx => {
    $$('.spot', stage).forEach((s, i) => s.setAttribute('aria-pressed', String(i === idx)));
    $$('li', list).forEach((li, i) => li.classList.toggle('is-on', i === idx));
  };

  const renderLook = (animateIn) => {
    const l = HP.looks[look];
    const total = l.spots.reduce((n, s) => n + s.price, 0);
    stage.setAttribute('aria-labelledby', `look-tab-${look}`);
    stage.innerHTML = `<img src="${l.img}" alt="${l.label}" width="1500" height="500"><span class="look-name">${l.label}</span>` +
      l.spots.map((s, i) => `<button class="spot" type="button" style="--x:${s.x}%;--y:${s.y}%" aria-pressed="false" data-spot="${i}" aria-label="${i + 1}: ${s.name}, ${aed(s.price)}"><span class="dot">${i + 1}</span></button>`).join('');
    list.innerHTML = l.spots.map((s, i) => `<li data-spot="${i}"><span class="n">${i + 1}</span><span>${s.name}</span><span class="p">${aed(s.price)}</span></li>`).join('');
    lookBtn.textContent = `Shop this setup \u2014 ${aed(total)}`;
    $$('button', tabs).forEach((b, i) => b.setAttribute('aria-selected', String(i === look)));
    if (animateIn && !reduced) {
      waapi.animate($('img', stage), { opacity: [0, 1], scale: [1.06, 1], duration: 900, ease: 'outExpo' });
      waapi.animate($$('.spot', stage), { scale: [0, 1], opacity: [0, 1], delay: stagger(90, { start: 250 }), duration: 600, ease: 'outBack(2)' });
      waapi.animate([...list.children], { opacity: [0, 1], translateX: [16, 0], delay: stagger(50), duration: 600, ease: 'outExpo' });
    }
  };

  tabs.addEventListener('click', e => {
    const b = e.target.closest('[data-look]');
    if (!b || +b.dataset.look === look) return;
    look = +b.dataset.look;
    renderLook(true);
  });
  const go = d => { look = (look + d + HP.looks.length) % HP.looks.length; renderLook(true); };
  $('[data-look-prev]').addEventListener('click', () => go(-1));
  $('[data-look-next]').addEventListener('click', () => go(1));
  stage.addEventListener('click', e => { const s = e.target.closest('[data-spot]'); if (s) setSpot(+s.dataset.spot); });
  list.addEventListener('mouseover', e => { const s = e.target.closest('[data-spot]'); if (s) setSpot(+s.dataset.spot); });
  lookBtn.addEventListener('click', e => {
    const l = HP.looks[look];
    HP.addToBasket({ id: `look-${look}`, name: `${l.label} setup`, price: l.spots.reduce((n, s) => n + s.price, 0), img: l.img }, e.currentTarget);
  });
  renderLook(false);
})();
