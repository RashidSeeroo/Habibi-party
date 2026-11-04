(() => {
  const { $ } = HP;
  const grid = $('[data-wl-grid]');
  if (!grid) return;
  const bar = $('[data-wl-bar]'), empty = $('[data-wl-empty]');
  const render = () => {
    const items = HP.wish.get().map(HP.find).filter(Boolean);
    grid.innerHTML = items.map(HP.card).join('');
    $('[data-wl-count]').textContent = items.length;
    bar.hidden = !items.length;
    empty.hidden = items.length > 0;
  };
  $('[data-wl-clear]').addEventListener('click', () => { if (confirm('Remove everything from your wishlist?')) HP.wish.clear(); });
  $('[data-wl-addall]').addEventListener('click', e => {
    const items = HP.wish.get().map(HP.find).filter(Boolean);
    const cur = HP.basket.get().slice();
    items.forEach(p => { if (!cur.find(i => i.id === p.id)) cur.push({ id: p.id, name: p.name, price: p.price, img: p.img, icon: p.icon, tone: p.tone, qty: 1 }); });
    HP.basket.set(cur);
    HP.confetti(e.currentTarget);
    HP.toast(`${items.length} item${items.length === 1 ? '' : 's'} in your basket`);
  });
  document.addEventListener('hp:wish', render);
  render();
})();