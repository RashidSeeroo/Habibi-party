(() => {
  const { animate, waapi, stagger, utils } = anime;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { aed, svg } = HP;
  const PALETTE = ['#E11E2C', '#FCDF51', '#F394B3', '#94D0F1', '#85C884', '#C6A5CD', '#171212'];

  HP.reduced = reduced;
  HP.$ = $;
  HP.$$ = $$;

  /* ---------- Product cards ---------- */
  const allItems = [...HP.products, ...HP.packs];
  HP.find = id => allItems.find(p => p.id === id);

  /* ---------- Wishlist (favourites) ---------- */
  const WKEY = 'hp-wish';
  const wLoad = () => { try { const w = JSON.parse(localStorage.getItem(WKEY)); return Array.isArray(w) ? w : []; } catch { return []; } };
  let wish = wLoad();
  const wSave = () => { try { localStorage.setItem(WKEY, JSON.stringify(wish)); } catch {} };
  HP.wish = {
    get: () => wish.slice(),
    has: id => wish.includes(id),
    toggle(id) { wish = wish.includes(id) ? wish.filter(x => x !== id) : [id, ...wish]; wSave(); paintWish(); document.dispatchEvent(new CustomEvent('hp:wish', { detail: { id } })); return wish.includes(id); },
    clear() { wish = []; wSave(); paintWish(); document.dispatchEvent(new CustomEvent('hp:wish')); }
  };
  const paintWish = () => {
    $$('[data-wish]').forEach(b => {
      const on = wish.includes(b.dataset.wish), name = (HP.find(b.dataset.wish) || {}).name || 'product';
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `${on ? 'Remove' : 'Save'} ${name} ${on ? 'from' : 'to'} wishlist`);
      const i = $('i', b); if (i) i.className = on ? 'bi bi-heart-fill' : 'bi bi-heart';
      const l = $('.lbl', b); if (l) l.textContent = on ? 'Saved' : 'Save';
    });
    $$('[data-wish-count]').forEach(el => { el.textContent = wish.length; el.hidden = !wish.length; });
  };
  HP.paintWish = paintWish;
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-wish]');
    if (!b) return;
    e.preventDefault();
    const item = HP.find(b.dataset.wish);
    const on = HP.wish.toggle(b.dataset.wish);
    if (on && !reduced) waapi.animate(b, { scale: [1, 1.3, 1], duration: 420, ease: 'outBack' });
    if (item && HP.toast) HP.toast(on ? `${item.name} saved to your wishlist` : `${item.name} removed from your wishlist`);
  });
  window.addEventListener('storage', e => { if (e.key === WKEY) { wish = wLoad(); paintWish(); document.dispatchEvent(new CustomEvent('hp:wish')); } });
  (() => {
    const first = $('.header-actions a[href="account.html"], .header-actions a[href="profile.html"]');
    if (!first) return;
    first.insertAdjacentHTML('beforebegin', '<a class="icon-btn wish-link" href="wishlist.html" aria-label="Wishlist"><i class="bi bi-heart" aria-hidden="true"></i><span class="lbl">Wishlist</span><span class="wish-count" data-wish-count hidden>0</span></a>');
  })();

  HP.card = p => {
    const off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0;
    const badges = [
      p.badge && p.badge !== 'New' ? `<span class="badge-hp badge-hp--best"><i class="bi bi-fire" aria-hidden="true"></i>${p.badge}</span>` : '',
      p.isNew ? '<span class="badge-hp badge-hp--new"><i class="bi bi-stars" aria-hidden="true"></i>New</span>' : '',
      off ? `<span class="badge-hp badge-hp--off">-${off}%</span>` : '',
      p.isPack ? '<span class="badge-hp badge-hp--pack"><i class="bi bi-life-preserver" aria-hidden="true"></i>Habibi Rescue</span>' : ''
    ].join('');
    const art = p.img ? `<img class="photo" src="${p.img}" alt="" loading="lazy" width="460" height="460">` : svg(p.icon);
    const rating = p.reviews
      ? `<p class="rating" aria-label="Rated ${p.rating} out of 5 from ${p.reviews} reviews"><i class="bi bi-star-fill" aria-hidden="true"></i><b>${p.rating}</b><span class="rc" aria-hidden="true">(${p.reviews})</span></p>`
      : '<p class="rating"><i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>Same-day in Dubai</p>';
    const price = p.was
      ? `<span class="now-off">${aed(p.price)}</span><s>${aed(p.was)}</s>`
      : aed(p.price);
    return `<article class="pcard">
      <div class="pcard-art" style="--tone:var(--${p.tone || 'blush'})">
        <span class="badges">${badges}</span>
        <button class="wish" type="button" data-wish="${p.id}" aria-pressed="${HP.wish.has(p.id)}" aria-label="${HP.wish.has(p.id) ? 'Remove' : 'Save'} ${p.name} ${HP.wish.has(p.id) ? 'from' : 'to'} wishlist"><i class="bi ${HP.wish.has(p.id) ? 'bi-heart-fill' : 'bi-heart'}" aria-hidden="true"></i></button>${art}
        <button class="quick-add" type="button" data-add="${p.id}" aria-label="Add ${p.name} to basket"><i class="bi bi-plus-lg" aria-hidden="true"></i><span class="lbl">Quick add</span></button>
      </div>
      ${rating}
      <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
      <p class="price m-0">${price}</p>
    </article>`;
  };

  /* ---------- Mega menu ---------- */
  const megaButtons = $$('[data-mega]');
  const closeMega = except => megaButtons.forEach(b => {
    if (b === except) return;
    b.setAttribute('aria-expanded', 'false');
    b.nextElementSibling.classList.remove('show');
  });
  const openMega = btn => {
    closeMega(btn);
    const panel = btn.nextElementSibling;
    if (panel.classList.contains('show')) return;
    btn.setAttribute('aria-expanded', 'true');
    panel.classList.add('show');
    if (!reduced) {
      waapi.animate(panel, { opacity: [0, 1], translateY: [-8, 0], duration: 320, ease: 'outExpo' });
      waapi.animate($$('.shell > *', panel), { opacity: [0, 1], translateY: [10, 0], delay: stagger(35), duration: 420, ease: 'outExpo' });
    }
  };
  megaButtons.forEach(btn => {
    btn.addEventListener('click', () => btn.getAttribute('aria-expanded') === 'true' ? closeMega() : openMega(btn));
    const li = btn.parentElement;
    let t;
    li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { clearTimeout(t); t = setTimeout(() => openMega(btn), 120); } });
    li.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { clearTimeout(t); t = setTimeout(() => closeMega(), 160); } });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMega(); });
  document.addEventListener('click', e => { if (!e.target.closest('.catnav')) closeMega(); });

  /* ---------- Countdowns (Dubai time, UTC+4) ---------- */
  const dubaiNow = () => { const d = new Date(); return new Date(d.getTime() + (d.getTimezoneOffset() + 240) * 60000); };
  const pad = n => String(n).padStart(2, '0');
  const fmt = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`; };
  const tickClocks = () => {
    const now = dubaiNow();
    $$('[data-countdown]').forEach(el => {
      const target = new Date(now);
      if (el.dataset.countdown === 'today') {
        target.setHours(16, 0, 0, 0);
        const label = $('[data-cutoff-label]');
        if (now >= target) { target.setDate(target.getDate() + 1); if (label) label.textContent = 'Next same-day cut-off in'; }
      } else {
        target.setHours(24, 0, 0, 0);
      }
      el.textContent = fmt(target - now);
    });
  };
  tickClocks();
  setInterval(tickClocks, 1000);

  /* ---------- Toast ---------- */
  const toast = $('.hp-toast');
  let toastAnim, toastTimer;
  HP.toast = msg => {
    if (!toast) return;
    $('span', toast).textContent = msg;
    toastAnim?.cancel();
    clearTimeout(toastTimer);
    toastAnim = waapi.animate(toast, { opacity: [0, 1], translateY: [16, 0], duration: reduced ? 1 : 380, ease: 'outExpo' });
    toastTimer = setTimeout(() => {
      toastAnim = waapi.animate(toast, { opacity: 0, translateY: 10, duration: reduced ? 1 : 300, ease: 'inQuad' });
    }, 2400);
  };

  /* ---------- Confetti burst ---------- */
  HP.confetti = (originEl, count = 26) => {
    if (reduced || !originEl) return;
    const r = originEl.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    const pieces = Array.from({ length: count }, (_, i) => {
      const p = document.createElement('i');
      if (i % 3 === 0) p.className = 'round';
      p.style.background = PALETTE[i % PALETTE.length];
      p.style.left = r.left + r.width / 2 + 'px';
      p.style.top = r.top + r.height / 2 + 'px';
      layer.appendChild(p);
      return p;
    });
    document.body.appendChild(layer);
    animate(pieces, {
      x: () => utils.random(-160, 160),
      y: [{ to: () => utils.random(-200, -80), duration: 420, ease: 'outQuad' }, { to: () => utils.random(60, 180), duration: 720, ease: 'inQuad' }],
      rotate: () => utils.random(-540, 540),
      scale: [{ from: 0, to: () => utils.random(.7, 1.3, 2), duration: 200 }],
      opacity: [{ to: 1, duration: 900 }, { to: 0, duration: 240 }],
      delay: stagger(6),
      onComplete: () => layer.remove()
    });
  };

  /* ---------- Basket ---------- */
  const KEY = 'hp-basket';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = items => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} };
  let basket = load();

  const renderBasket = (bump = false) => {
    const qty = basket.length; // badge counts distinct products, not units
    const total = basket.reduce((n, i) => n + i.qty * i.price, 0);
    $$('[data-basket-count]').forEach(el => {
      el.textContent = qty;
      if (bump && !reduced) waapi.animate(el, { scale: [1, 1.5, 1], rotate: [0, -12, 0], duration: 520, ease: 'outBack' });
    });
    const list = $('[data-basket-list]');
    if (!list) return;
    list.innerHTML = basket.map(i => `<li>
      <span class="th" style="--tone:var(--${i.tone || 'blush'})">${i.img ? `<img src="${i.img}" alt="">` : svg(i.icon || 'balloon')}</span>
      <span><span class="nm d-block">${i.name}</span><span class="q">${i.qty} &times; ${aed(i.price)}</span></span>
      <button class="rm" type="button" data-remove="${i.id}" aria-label="Remove ${i.name}"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
    </li>`).join('');
    $('[data-basket-empty]').hidden = basket.length > 0;
    $('[data-basket-foot]').hidden = basket.length === 0;
    $('[data-basket-total]').textContent = aed(total);
  };

  HP.addToBasket = (item, originEl) => {
    const found = basket.find(i => i.id === item.id);
    if (found) found.qty += 1;
    else basket.push({ id: item.id, name: item.name, price: item.price, img: item.img, icon: item.icon, tone: item.tone, qty: 1 });
    save(basket);
    renderBasket(!found);
    HP.confetti(originEl);
    HP.toast(found ? `${item.name} added again (${found.qty} in your basket)` : `${item.name} added to your basket`);
  };

  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const item = HP.find(add.dataset.add);
      if (item) HP.addToBasket(item, add);
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      basket = basket.filter(i => i.id !== rm.dataset.remove);
      save(basket);
      renderBasket();
    }
  });
  renderBasket();
  paintWish();
  HP.basket = { get: () => basket, set: b => { basket = b; save(basket); renderBasket(); } };

  /* ---------- Reveals ---------- */
  HP.reveal = (el, targets) => {
    if (reduced) { el.style.opacity = 1; return; }
    const list = targets || [el];
    if (targets) el.style.opacity = 1;
    list.forEach(t => (t.style.opacity = 0));
    waapi.animate(list, {
      opacity: [0, 1],
      translateY: [28, 0],
      filter: ['blur(6px)', 'blur(0px)'],
      delay: stagger(70),
      duration: 900,
      ease: 'outExpo',
      onComplete: () => list.forEach(t => (t.style.opacity = 1))
    });
  };

  HP.onEnter = (els, fn, margin = '0px 0px -12% 0px') => {
    if (!('IntersectionObserver' in window)) { els.forEach(fn); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { io.unobserve(en.target); fn(en.target); }
    }), { rootMargin: margin });
    els.forEach(el => io.observe(el));
  };

  HP.onEnter($$('[data-reveal]'), el => HP.reveal(el));
  HP.onEnter($$('[data-reveal-group]'), el => HP.reveal(el, [...el.children]));

  /* ---------- Anchor links land under the sticky header ---------- */
  const hashTarget = () => { try { return location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; } catch (e) { return null; } };
  const toHash = () => {
    const t = hashTarget();
    if (!t) return;
    const head = $('.site-header');
    const y = t.getBoundingClientRect().top + scrollY - (head ? head.offsetHeight : 0) - 16;
    scrollTo({ top: Math.max(0, y), behavior: 'instant' });
  };
  if (hashTarget()) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    toHash();
    addEventListener('load', toHash);
    setTimeout(toHash, 400);
    setTimeout(toHash, 1200);
  }
  addEventListener('hashchange', toHash);

  /* ---------- Counters ---------- */
  HP.countUp = el => {
    const end = +el.dataset.countTo;
    const suffix = el.dataset.countSuffix || '';
    if (reduced) { el.textContent = end.toLocaleString('en-US') + suffix; return; }
    const o = { v: 0 };
    animate(o, {
      v: end, duration: 1600, ease: 'outExpo', modifier: utils.round(0),
      onUpdate: () => (el.textContent = o.v.toLocaleString('en-US') + suffix)
    });
  };

  /* ---------- Newsletter ---------- */
  $$('[data-newsletter]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('input', form);
    const msg = $('.msg', form);
    if (!input.value.trim() || !input.checkValidity()) {
      msg.textContent = 'Enter an email like you@example.com so we can send the ideas.';
      input.focus();
      return;
    }
    msg.textContent = 'You are on the list. First ideas arrive this fortnight.';
    form.reset();
  }));
})();

/* Signed-in header: account icon goes to the profile */
try {
  const hpUser = JSON.parse(localStorage.getItem('hp-user') || 'null');
  if (hpUser) document.querySelectorAll('a.icon-btn[href="account.html"]').forEach(a => {
    a.href = 'profile.html';
    const l = a.querySelector('.lbl'); if (l) l.textContent = (hpUser.name || hpUser.email || 'Profile').split(/[\s@]/)[0];
  });
} catch (e) {}
