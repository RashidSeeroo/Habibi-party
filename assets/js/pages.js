(() => {
  const { waapi, stagger } = anime;
  const { $, $$, aed, reduced } = HP;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const params = new URLSearchParams(location.search);
  const msgOf = form => $('[data-form-msg]', form);
  const say = (form, text, ok) => {
    const m = msgOf(form);
    if (!m) return;
    m.textContent = text;
    m.classList.toggle('ok', !!ok);
    m.classList.toggle('err', !ok);
  };

  /* ---------- Generic enquiry forms (front-end only) ---------- */
  $$('[data-form]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = $$('[required]', form).filter(f => !f.closest('fieldset[disabled]')).find(f => f.type === 'checkbox' ? !f.checked : f.type === 'file' ? !f.files.length : (!f.value.trim() || !f.checkValidity()));
    if (bad) { say(form, 'Please fill in the highlighted field.', false); bad.focus(); return; }
    say(form, msgOf(form).dataset.ok || 'Thanks, we have your message.', true);
    form.reset();
  }));

  /* ---------- Reveal groups + counters ---------- */
  HP.onEnter($$('[data-count-to]'), HP.countUp);

  /* ---------- FAQ search ---------- */
  const faqSearch = $('[data-faq-search]');
  if (faqSearch) {
    const items = $$('[data-faq] .accordion-item');
    faqSearch.addEventListener('input', () => {
      const q = faqSearch.value.trim().toLowerCase();
      let shown = 0;
      items.forEach(it => {
        const hit = !q || it.textContent.toLowerCase().includes(q);
        it.hidden = !hit;
        if (hit) shown++;
      });
      $('[data-faq-none]').hidden = shown > 0;
    });
  }

  /* ---------- Track order (demo status from the order number) ---------- */
  const trackForm = $('[data-track]');
  if (trackForm) {
    const STEPS = ['Order received', 'Packed by our team', 'Out for delivery', 'Delivered'];
    const show = ref => {
      let h = 0;
      for (const c of ref) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      let stage = h % 4;
      try { const last = JSON.parse(localStorage.getItem('hp-last-order') || 'null'); if (last && last.ref === ref) stage = Math.min(3, Math.floor((Date.now() - last.at) / 600000)); } catch {}
      $('[data-track-title]').textContent = `Order ${ref}: ${STEPS[stage]}`;
      $('[data-track-steps]').innerHTML = STEPS.map((s, i) => `<li class="${i < stage ? 'done' : i === stage ? 'now' : ''}"><span class="dot"><i class="bi bi-check-lg" aria-hidden="true"></i></span><span>${s}</span></li>`).join('');
      $('[data-track-result]').hidden = false;
      if (!reduced) waapi.animate($$('[data-track-steps] li'), { opacity: [0, 1], translateX: [-14, 0], delay: stagger(90), duration: 600, ease: 'outExpo' });
    };
    trackForm.addEventListener('submit', e => {
      e.preventDefault();
      const ref = $('#t-ref').value.trim().toUpperCase();
      if (!/^HP-?\d{4,8}$/.test(ref)) { say(trackForm, 'Enter your order number, like HP-482913.', false); $('[data-track-result]').hidden = true; return; }
      say(trackForm, '', true);
      show(ref.replace(/^HP(\d)/, 'HP-$1'));
    });
    if (params.get('o')) { $('#t-ref').value = params.get('o'); trackForm.requestSubmit(); }
  }

  /* ---------- Account ---------- */
  const tabs = $('[data-tabs]');
  if (tabs) {
    const forms = $$('[data-auth]');
    tabs.addEventListener('click', e => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      $$('button', tabs).forEach(x => x.setAttribute('aria-selected', String(x === b)));
      forms.forEach(f => (f.hidden = f.dataset.auth !== b.dataset.tab));
    });
    forms.filter(f => !f.hasAttribute('data-otp')).forEach(form => form.addEventListener('submit', e => {
      e.preventDefault();
      const bad = $$('input', form).find(f => !f.checkValidity());
      if (bad) { say(form, 'Check the highlighted field and try again.', false); bad.focus(); return; }
      const v = id => ($('#' + id, form) || {}).value || '';
      let old = null; try { old = JSON.parse(localStorage.getItem('hp-user') || 'null'); } catch {}
      const email = (v('a-email') || v('r-email')).trim();
      const user = form.dataset.auth === 'up'
        ? { name: v('r-name').trim(), email, phone: v('r-phone').trim() }
        : (old && old.email === email ? old : { name: email.split('@')[0], email });
      try { localStorage.setItem('hp-user', JSON.stringify(user)); } catch {}
      say(form, 'You are in! Taking you to your profile…', true);
      setTimeout(() => (location.href = 'profile.html'), 700);
    }));
    if (location.hash === '#register') $('[data-tab="up"]', tabs).click();
  }

  /* ---------- Mobile OTP sign-in ---------- */
  // Point OTP_API at your SMS backend (POST {phone} to /send, POST {phone, code} to /verify -> {ok:true}).
  // Left empty, the page runs in demo mode and shows the code on screen instead of texting it.
  const OTP_API = '';
  const otp = $('[data-otp]');
  if (otp) {
    const steps = { phone: $('[data-otp-step="phone"]', otp), code: $('[data-otp-step="code"]', otp) };
    const phoneIn = $('#o-phone'), codeIn = $('#o-code'), resend = $('[data-otp-resend]', otp), demo = $('[data-otp-demo]', otp);
    let phone = '', sent = '', timer = 0;
    const show = s => { steps.phone.hidden = s !== 'phone'; steps.code.hidden = s !== 'code'; say(otp, '', true); (s === 'phone' ? phoneIn : codeIn).focus(); };
    const countdown = () => {
      let n = 30; resend.disabled = true; clearInterval(timer);
      const tick = () => { resend.textContent = n > 0 ? `Resend code in ${n}s` : 'Resend code'; resend.disabled = n > 0; if (n-- <= 0) clearInterval(timer); };
      tick(); timer = setInterval(tick, 1000);
    };
    const send = () => {
      if (OTP_API) {
        return fetch(OTP_API + '/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) })
          .then(r => { if (!r.ok) throw 0; demo.hidden = true; });
      }
      sent = String(Math.floor(100000 + Math.random() * 900000));
      demo.hidden = false; demo.innerHTML = `Demo mode: no SMS is sent. Your code is <strong>${sent}</strong>.`;
      return Promise.resolve();
    };
    const begin = () => send().then(() => { $('[data-otp-to]', otp).textContent = phone; codeIn.value = ''; show('code'); countdown(); })
      .catch(() => say(otp, 'Could not send the code. Try again in a moment.', false));
    otp.addEventListener('submit', e => {
      e.preventDefault();
      if (!steps.phone.hidden) {
        if (!phoneIn.checkValidity() || !phoneIn.value.trim()) { say(otp, 'Enter a valid mobile number, like +971 50 123 4567.', false); phoneIn.focus(); return; }
        phone = phoneIn.value.trim().replace(/\s+/g, ' '); return begin();
      }
      if (!/^\d{6}$/.test(codeIn.value)) { say(otp, 'Enter the 6-digit code.', false); codeIn.focus(); return; }
      const email = $('#o-email').value.trim();
      if (email && !$('#o-email').checkValidity()) { say(otp, 'Enter a valid email address, like you@example.com.', false); $('#o-email').focus(); return; }
      if (!$('#o-terms').checked) { say(otp, 'Please accept the Terms & Conditions to continue.', false); $('#o-terms').focus(); return; }
      const ok = OTP_API
        ? fetch(OTP_API + '/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, code: codeIn.value }) }).then(r => r.ok && r.json()).then(j => !!(j && j.ok))
        : Promise.resolve(codeIn.value === sent);
      ok.then(good => {
        if (!good) { say(otp, 'That code is not right. Check it and try again.', false); codeIn.select(); return; }
        let old = null; try { old = JSON.parse(localStorage.getItem('hp-user') || 'null'); } catch {}
        const user = old && old.phone === phone ? old : { name: ($('#o-name').value || '').trim() || 'Habibi guest', phone };
        if (email && !user.email) user.email = email;
        try { localStorage.setItem('hp-user', JSON.stringify(user)); } catch {}
        say(otp, 'Verified! Taking you to your profile…', true);
        setTimeout(() => (location.href = 'profile.html'), 700);
      }).catch(() => say(otp, 'Could not verify the code. Try again.', false));
    });
    codeIn.addEventListener('input', () => { codeIn.value = codeIn.value.replace(/\D/g, '').slice(0, 6); });
    resend.addEventListener('click', () => { say(otp, 'A new code is on its way.', true); begin(); });
    $('[data-otp-change]', otp).addEventListener('click', () => { clearInterval(timer); show('phone'); });
  }

  /* ---------- Google sign-in ---------- */
  // Paste your Google OAuth Web client ID here to switch real Google sign-in on.
  const GOOGLE_CLIENT_ID = '';
  $$('[data-google]').forEach(btn => btn.addEventListener('click', () => {
    const form = btn.closest('form');
    if (!GOOGLE_CLIENT_ID) { say(form, 'Google sign-in needs a Google client ID. Add it to GOOGLE_CLIENT_ID in assets/js/pages.js.', false); return; }
    const start = () => google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID, scope: 'openid email profile',
      callback: r => {
        if (!r.access_token) return say(form, 'Google sign-in was cancelled.', false);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + r.access_token } })
          .then(x => x.json()).then(u => {
            try { localStorage.setItem('hp-user', JSON.stringify({ name: u.name, email: u.email, picture: u.picture })); } catch (e) {}
            say(form, 'Welcome, ' + (u.given_name || u.name) + '! Taking you to your profile…', true);
            setTimeout(() => (location.href = 'profile.html'), 700);
          });
      }
    }).requestAccessToken();
    if (window.google && google.accounts) return start();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.onload = start;
    s.onerror = () => say(form, 'Could not reach Google. Check your connection.', false);
    document.head.appendChild(s);
  }));

  /* ---------- Ideas + article ---------- */
  const IDEAS = [
    { tag: 'Ideas', tone: 'var(--sun)', img: 'garland-rainbow', t: '10 birthday party ideas under AED 800', body: [
      'A great party is about the details, not the bill. These ten ideas keep the total under AED 800 without looking like it.',
      '1. Pick one colour and repeat it: balloons, plates and a table runner in the same shade look far more expensive than a mix.',
      '2. Make the backdrop the hero. A foil curtain and a balloon garland behind the cake table covers every photo.',
      '3. Buy balloons in bulk. A 100-pack of latex balloons costs less than a handful of foil ones, and fills a room.',
      '4. Use a number balloon as the centrepiece. One large number does the work of five small decorations.',
      '5. Pair paper tableware with one standout item, like gold chargers, to lift the whole table.',
      '6. Put favours in organza pouches instead of buying individual gifts.',
      '7. Skip the extras nobody notices. Spend on the cake table and the entrance.',
      '8. Plan one activity, not five. A photo corner with props is often the favourite part.',
      '9. Order the set. A Habibi Box matches everything for your guest count so nothing is left over.',
      '10. Order early, but if you forget, a Habibi Rescue pack still arrives the same day in Dubai.'] },
    { tag: 'How-to', tone: 'var(--pink)', img: 'arch-rose', t: 'How to build a balloon arch at home', body: [
      'A balloon arch looks complicated, but a kit makes it a 45-minute job for one person.',
      'Before you start: pick a colour palette of three or four shades, plus one metallic. Check you have the arch frame or string, enough balloons and a pump.',
      '1. Inflate balloons in two sizes, a large 12 inch and a smaller 5 inch, so the arch looks full.',
      '2. Clip balloons into groups of four to make small clusters.',
      '3. Attach clusters along the string or frame, alternating colours as you go.',
      '4. Add the 5 inch balloons in the gaps to fill the shape.',
      '5. Stand it up, check from the front, and tuck any gaps with foil stars or flowers.',
      'Tip: build it the day before and keep it out of direct sun and cold air-conditioning.'] },
    { tag: 'Themes', tone: 'var(--sky)', img: 'garland-pink', t: 'Best baby shower themes for 2026', body: [
      'The most popular baby shower themes right now are soft, simple and photograph beautifully.',
      '1. Soft pastels: blush, sage and cream with gold accents.',
      '2. Little star: twinkling stars, moons and a night-sky backdrop.',
      '3. Boho rainbow: muted rainbow balloons, pampas and neutral tableware.',
      '4. Teddy bear picnic: warm browns, gingham and plenty of plush.',
      '5. Gender reveal: keep the colours secret with a confetti cannon and a mystery balloon.',
      'Start with one big focal point, like a balloon arch or foil curtain, then match the tableware and favours to it.'] },
    { tag: 'Budget', tone: 'var(--mint)', img: 'tableware-6', t: 'Party ideas under AED 500', body: [
      'You can throw a lovely small party for under AED 500 with a little planning.',
      '1. Choose a theme colour and stick to it.',
      '2. Buy a latex balloon bundle and a number balloon rather than many foil balloons.',
      '3. Add a banner and a tablecloth for an instant backdrop.',
      '4. Use paper plates, cups and napkins in your colour, with candles for the cake.',
      '5. Make favours yourself with a small treat and a pouch.',
      'Add one standout detail, and put your money where the photos will be.'] }
  ];
  const list = $('[data-ideas-list]');
  if (list) list.innerHTML = IDEAS.map((a, i) => `<a class="idea" href="idea.html?a=${i + 1}" style="--tone:${a.tone}"><span class="pic"><img src="assets/img/products/${a.img}.jpg" alt="" width="460" height="460" loading="lazy"><span class="tag">${a.tag}</span></span><span class="t">${a.t}</span><span class="go">Read <i class="bi bi-arrow-up-right" aria-hidden="true"></i></span></a>`).join('');
  const article = $('[data-article]');
  if (article) {
    const i = Math.min(Math.max(+params.get('a') || 1, 1), IDEAS.length) - 1;
    const a = IDEAS[i];
    document.title = `${a.t} | Habibi Party`;
    $('#page-title').textContent = a.t;
    $('.page-hero p').textContent = a.tag + ' from the Habibi Party team';
    $('.crumbs').innerHTML = '<a href="index.html">Home</a> / <a href="ideas.html">Ideas</a> / <span aria-current="page">' + esc(a.tag) + '</span>';
    article.insertAdjacentHTML('beforeend', `<img class="article-img" src="assets/img/products/${a.img}.jpg" alt="" width="900" height="600">` + a.body.map(p => `<p>${esc(p)}</p>`).join('') +
      `<div class="cta-band mt-4"><div><h2>Ready to shop the look?</h2><p class="m-0">Everything for this party is in stock.</p></div><a class="btn-hp btn-hp--sun" href="shop.html">Shop all products</a></div>`);
  }

  /* ---------- Product detail ---------- */
  const pd = $('[data-product]');
  if (pd) {
    const p = HP.find(params.get('id'));
    if (!p) {
      pd.innerHTML = '<div class="order-done"><h2>We could not find that product</h2><p>It may have sold out or moved.</p><a class="btn-hp" href="shop.html">Browse all products</a></div>';
    } else {
      document.title = `${p.name} | Habibi Party`;
      $('#page-title').textContent = p.name;
      $('.page-hero p').textContent = `${p.cat} · same-day delivery in Dubai`;
      $('.crumbs').innerHTML = `<a href="index.html">Home</a> / <a href="shop.html">Shop</a> / <a href="shop.html?cat=${encodeURIComponent(p.cat)}">${esc(p.cat)}</a>`;
      const off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0;
      const art = p.img ? `<img src="${p.img}" alt="${esc(p.name)}" width="800" height="800">` : HP.svg(p.icon, 220);
      pd.innerHTML = `
        <div class="pd-art" style="--tone:var(--${p.tone || 'blush'})">${art}${off ? `<span class="badge-hp badge-hp--off">-${off}%</span>` : ''}</div>
        <div class="pd-info">
          <p class="rating"><i class="bi bi-star-fill" aria-hidden="true"></i>${p.reviews ? `${p.rating} · ${p.reviews} reviews` : 'Same-day in Dubai'}</p>
          <h2>${esc(p.name)}</h2>
          <p class="pd-price">${p.was ? `<span class="now-off">${aed(p.price)}</span> <s>${aed(p.was)}</s>` : aed(p.price)}</p>
          <p class="pd-lead">A party favourite from our ${esc(p.cat.toLowerCase())} range${p.occ ? `, perfect for ${esc(p.occ.slice(0, 3).join(', ').toLowerCase())}` : ''}.</p>
          <div class="pd-buy">
            <div class="qty" role="group" aria-label="Quantity"><button type="button" data-q="-1" aria-label="Fewer">&minus;</button><output data-qty>1</output><button type="button" data-q="1" aria-label="More">+</button></div>
            <button class="btn-hp" type="button" data-pd-add><i class="bi bi-bag-heart" aria-hidden="true"></i> Add to basket</button>
            <button class="wish-lg" type="button" data-wish="${p.id}" aria-pressed="false"><i class="bi bi-heart" aria-hidden="true"></i><span class="lbl">Save</span></button>
          </div>
          <ul class="ticks-list">
            <li>Order before 4pm for same-day delivery in Dubai</li>
            <li>Free delivery over AED 200</li>
            <li>Easy returns within 7 days if unopened</li>
          </ul>
          <p class="small" style="color:var(--ink-soft)">Need a bigger quantity? <a href="wholesale.html#quote">Ask for a wholesale quote</a>.</p>
        </div>`;
      HP.paintWish && HP.paintWish();
      let qty = 1;
      const out = $('[data-qty]', pd);
      pd.addEventListener('click', e => {
        const q = e.target.closest('[data-q]');
        if (q) { qty = Math.min(99, Math.max(1, qty + +q.dataset.q)); out.textContent = qty; }
        const add = e.target.closest('[data-pd-add]');
        if (add) { for (let n = 0; n < qty; n++) HP.addToBasket(p, n === 0 ? add : null); }
      });
      const rel = HP.products.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
      if (rel.length) { $('[data-related]').innerHTML = rel.map(HP.card).join(''); $('[data-related-wrap]').hidden = false; }
    }
  }

  /* ---------- Checkout ---------- */
  const co = $('[data-checkout]');
  if (co) {
    const fee = (sub, emirate) => (sub >= 200 && emirate === 'Dubai') || sub === 0 ? 0 : emirate === 'Dubai' || !emirate ? 25 : 35;
    const dateIn = $('[data-date]');
    const today = new Date();
    dateIn.min = dateIn.value = today.toISOString().slice(0, 10);
    const render = () => {
      const items = HP.basket.get();
      if (!items.length && co.hidden === false && !$('[data-done]').hidden === false) { co.hidden = true; $('[data-empty-cart]').hidden = false; return; }
      const sub = items.reduce((n, i) => n + i.qty * i.price, 0);
      const del = fee(sub, $('[data-emirate]').value);
      $('[data-sum-list]').innerHTML = items.map(i => `<li><span class="th" style="--tone:var(--${i.tone || 'blush'})">${i.img ? `<img src="${i.img}" alt="">` : HP.svg(i.icon || 'balloon')}</span><span class="nm">${esc(i.name)}<small>${i.qty} &times; ${aed(i.price)}</small></span><b>${aed(i.qty * i.price)}</b></li>`).join('');
      $('[data-sum-sub]').textContent = aed(sub);
      $('[data-sum-del]').textContent = del ? aed(del) : 'Free';
      $('[data-sum-total]').textContent = aed(sub + del);
      return items.length;
    };
    if (!HP.basket.get().length) { co.hidden = true; $('[data-empty-cart]').hidden = false; }
    else {
      render();
      $('[data-emirate]').addEventListener('change', render);
      const isBulk = HP.basket.get().some(i => String(i.id).startsWith('bulk-'));
      const biz = $('[data-biz]');
      let saved = null; try { saved = JSON.parse(localStorage.getItem('hp-biz') || 'null'); } catch {}
      if (isBulk) {
        biz.hidden = false; biz.disabled = false;
        const exp = $('[data-exp]'); exp.min = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
        if (saved) Object.entries(saved).forEach(([k, v]) => { const el = $('[name="' + k + '"]', biz); if (el && el.type !== 'file' && el.type !== 'checkbox') el.value = v; });
        const same = $('[data-same]'), dl = { addr: $('#o-addr'), area: $('#o-area'), em: $('#o-em') }, src = { addr: $('#b-addr'), area: $('#b-area'), em: $('#b-em') };
        const sync = () => { if (!same.checked) return; Object.keys(dl).forEach(k => { dl[k].value = src[k].value; }); render(); };
        same.addEventListener('change', () => { Object.values(dl).forEach(el => { el.readOnly = same.checked; }); dl.em.style.pointerEvents = same.checked ? 'none' : ''; sync(); });
        Object.values(src).forEach(el => el.addEventListener('input', sync)); Object.values(src).forEach(el => el.addEventListener('change', sync));
        same.dispatchEvent(new Event('change'));
        $('[data-licfile]').addEventListener('change', e => {
          const f = e.target.files[0];
          if (f && (f.size > 5 * 1024 * 1024 || !/\.(pdf|jpe?g|png)$/i.test(f.name))) { e.target.value = ''; say($('[data-order]'), 'Licence copy must be a PDF, JPG or PNG under 5 MB.', false); }
        });
      }
      const form = $('[data-order]');
      form.addEventListener('submit', e => {
        e.preventDefault();
        const bad = $$('[required]', form).filter(f => !f.closest('fieldset[disabled]')).find(f => f.type === 'checkbox' ? !f.checked : f.type === 'file' ? !f.files.length : (!f.value.trim() || !f.checkValidity()));
        if (bad) { say(form, 'Please complete the highlighted field.', false); bad.focus(); return; }
        const ref = 'HP-' + String(Math.floor(100000 + Math.random() * 900000));
        let bizInfo = null;
        if (isBulk) {
          const g = n => ($('[name="' + n + '"]', form) || {}).value.trim();
          const file = $('[data-licfile]').files[0];
          bizInfo = { shop: g('shop'), licence: g('licence'), authority: g('authority'), expiry: g('expiry'), trn: g('trn'), shopaddress: g('shopaddress'), shoparea: g('shoparea'), shopemirate: g('shopemirate'), licfile: file ? { name: file.name, size: file.size } : null, verify: 'Pending' };
          try { const { licfile, verify, ...keep } = bizInfo; localStorage.setItem('hp-biz', JSON.stringify(keep)); } catch {}
          $('[data-biz-done]').hidden = false;
        }
        try { const rec = { ref, at: Date.now(), biz: bizInfo, total: HP.basket.get().reduce((n, i) => n + i.qty * i.price, 0), lines: HP.basket.get().map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })) }; const hist = JSON.parse(localStorage.getItem('hp-orders') || '[]'); hist.unshift(rec); localStorage.setItem('hp-orders', JSON.stringify(hist.slice(0, 50))); } catch {}
        try { localStorage.setItem('hp-last-order', JSON.stringify({ ref, at: Date.now(), biz: bizInfo, total: HP.basket.get().reduce((n, i) => n + i.qty * i.price, 0), lines: HP.basket.get().map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })) })); } catch {}
        HP.basket.set([]);
        co.hidden = true;
        $('[data-ref]').textContent = ref;
        $('[data-track-link]').href = 'track-order.html?o=' + ref;
        const done = $('[data-done]');
        done.hidden = false;
        HP.confetti(done, 40);
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });
    }
  }
})();
