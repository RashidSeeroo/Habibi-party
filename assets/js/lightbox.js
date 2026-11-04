/* Product image: full-screen viewer with zoom */
(() => {
  const host = document.querySelector('#main, main') || document.body;
  let lb, img, label, scale = 1, x = 0, y = 0, lastFocus = null;
  const MIN = 1, MAX = 5;

  const build = () => {
    lb = document.createElement('div');
    lb.className = 'lb';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Product image viewer');
    lb.innerHTML = `
      <div class="lb-bar">
        <span class="lb-title" data-lb-title></span>
        <div class="lb-tools">
          <button type="button" data-lb="out" aria-label="Zoom out"><i class="bi bi-zoom-out" aria-hidden="true"></i></button>
          <output class="lb-zoom" data-lb-zoom aria-live="polite">100%</output>
          <button type="button" data-lb="in" aria-label="Zoom in"><i class="bi bi-zoom-in" aria-hidden="true"></i></button>
          <button type="button" data-lb="reset" aria-label="Reset zoom"><i class="bi bi-arrows-angle-contract" aria-hidden="true"></i></button>
          <button type="button" data-lb="close" aria-label="Close"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
        </div>
      </div>
      <div class="lb-stage" data-lb-stage><img alt="" draggable="false"></div>
      <p class="lb-hint">Scroll or pinch to zoom &middot; drag to move &middot; double-click to toggle zoom &middot; Esc to close</p>`;
    document.body.appendChild(lb);
    img = lb.querySelector('img');
    label = lb.querySelector('[data-lb-zoom]');
    const stage = lb.querySelector('[data-lb-stage]');

    lb.addEventListener('click', e => {
      const b = e.target.closest('[data-lb]');
      if (b) {
        const a = b.dataset.lb;
        if (a === 'close') close();
        if (a === 'in') zoom(scale * 1.5);
        if (a === 'out') zoom(scale / 1.5);
        if (a === 'reset') zoom(1);
      } else if (e.target === stage && scale === 1) close();
    });
    stage.addEventListener('wheel', e => { e.preventDefault(); zoom(scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY); }, { passive: false });
    stage.addEventListener('dblclick', e => zoom(scale > 1 ? 1 : 2.5, e.clientX, e.clientY));

    // drag to pan, two fingers to pinch
    const pts = new Map(); let start = null, pinch = 0;
    stage.addEventListener('pointerdown', e => {
      stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      start = { px: e.clientX, py: e.clientY, x, y };
      if (pts.size === 2) pinch = dist();
    });
    stage.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const d = dist(); if (pinch) zoom(scale * d / pinch); pinch = d; return; }
      if (scale > 1 && start) { x = start.x + e.clientX - start.px; y = start.y + e.clientY - start.py; apply(); }
    });
    const up = e => { pts.delete(e.pointerId); pinch = 0; start = pts.size ? { px: [...pts.values()][0][0], py: [...pts.values()][0][1], x, y } : null; };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };

    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === '+' || e.key === '=') zoom(scale * 1.25);
      else if (e.key === '-') zoom(scale / 1.25);
      else if (e.key === '0') zoom(1);
      else if (e.key === 'Tab') { // keep focus inside the viewer
        const f = [...lb.querySelectorAll('button')]; const i = f.indexOf(document.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  };

  const apply = () => {
    const w = img.clientWidth, h = img.clientHeight;
    const mx = Math.max(0, (w * scale - lb.querySelector('[data-lb-stage]').clientWidth) / 2);
    const my = Math.max(0, (h * scale - lb.querySelector('[data-lb-stage]').clientHeight) / 2);
    if (scale <= 1) { x = 0; y = 0; } else { x = Math.max(-mx, Math.min(mx, x)); y = Math.max(-my, Math.min(my, y)); }
    img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    lb.classList.toggle('is-zoomed', scale > 1);
    label.textContent = Math.round(scale * 100) + '%';
  };
  const zoom = (next, cx, cy) => {
    next = Math.max(MIN, Math.min(MAX, next));
    if (cx != null && next !== scale) { // zoom towards the cursor
      const r = img.getBoundingClientRect(), ox = cx - (r.left + r.width / 2), oy = cy - (r.top + r.height / 2), k = next / scale;
      x -= ox * (k - 1); y -= oy * (k - 1);
    }
    scale = next; apply();
  };
  const open = (src, alt) => {
    if (!lb) build();
    lastFocus = document.activeElement;
    img.src = src; img.alt = alt || '';
    lb.querySelector('[data-lb-title]').textContent = alt || '';
    scale = 1; x = 0; y = 0; apply();
    lb.hidden = false; document.documentElement.classList.add('lb-open');
    lb.querySelector('[data-lb="close"]').focus();
  };
  const close = () => {
    lb.hidden = true; document.documentElement.classList.remove('lb-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  host.addEventListener('click', e => {
    const art = e.target.closest('.pd-art');
    if (!art || e.target.closest('[data-wish]')) return;
    const im = art.querySelector('img');
    if (im) open(im.currentSrc || im.src, im.alt);
  });
  // add a keyboard-reachable "Zoom" button once the product image has rendered
  const addExpand = () => {
    const art = document.querySelector('.pd-art');
    if (art && art.querySelector('img') && !art.querySelector('.pd-expand')) {
      art.insertAdjacentHTML('beforeend', '<button type="button" class="pd-expand" aria-label="View image full screen"><i class="bi bi-arrows-fullscreen" aria-hidden="true"></i><span>Zoom</span></button>');
      art.classList.add('is-zoomable');
    }
  };
  addExpand();
  new MutationObserver(addExpand).observe(host, { childList: true, subtree: true });
})();