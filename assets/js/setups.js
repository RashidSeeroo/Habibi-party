(() => {
  const { $, aed } = HP;
  const grid = $('[data-su-grid]');
  const total = l => l.spots.reduce((n, s) => n + s.price, 0);

  grid.innerHTML = HP.looks.map((l, i) => `
    <article class="su-card">
      <div class="su-art"><img src="${l.img}" alt="${l.label}" width="1500" height="500" loading="lazy"></div>
      <div class="su-body">
        <h2>${l.label}</h2>
        <ul class="su-list">${l.spots.map(s => `<li><span>${s.name}</span><b>${aed(s.price)}</b></li>`).join('')}</ul>
        <button class="btn-hp" type="button" data-su-add="${i}">Shop this setup &mdash; ${aed(total(l))}</button>
      </div>
    </article>`).join('');

  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-su-add]');
    if (!b) return;
    const i = +b.dataset.suAdd, l = HP.looks[i];
    HP.addToBasket({ id: `look-${i}`, name: `${l.label} setup`, price: total(l), img: l.img }, b);
  });
})();
