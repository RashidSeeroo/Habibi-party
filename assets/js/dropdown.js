/* Custom dropdown for form selects (native select stays as the source of truth) */
(() => {
  const proto = HTMLSelectElement.prototype;
  const valDesc = Object.getOwnPropertyDescriptor(proto, 'value');
  const idxDesc = Object.getOwnPropertyDescriptor(proto, 'selectedIndex');
  let uid = 0;

  const upgrade = sel => {
    if (sel.dataset.dd) return;
    sel.dataset.dd = '1';
    const n = ++uid;
    const wrap = document.createElement('div');
    wrap.className = 'dd-field';
    wrap.innerHTML = `<button type="button" class="dd-btn" aria-haspopup="listbox" aria-expanded="false"><span></span></button><ul class="dd-menu" role="listbox" tabindex="-1" id="dd-menu-${n}" hidden></ul>`;
    sel.after(wrap);
    sel.classList.add('sort-native');
    sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    const btn = wrap.querySelector('button'), menu = wrap.querySelector('ul');
    btn.setAttribute('aria-controls', menu.id);
    const lbl = sel.id && document.querySelector(`label[for="${sel.id}"]`);
    if (lbl) { if (!lbl.id) lbl.id = `dd-lbl-${n}`; btn.setAttribute('aria-labelledby', lbl.id); menu.setAttribute('aria-labelledby', lbl.id); }
    lbl && lbl.addEventListener('click', () => btn.focus());

    let items = [], idx = 0;
    const text = o => (o ? o.textContent.trim() : '');
    const build = () => {
      menu.innerHTML = [...sel.options].map(o => `<li role="option" data-v="${o.value.replace(/"/g, '&quot;')}"${o.disabled ? ' aria-disabled="true"' : ''}><i class="bi bi-check2" aria-hidden="true"></i>${text(o)}</li>`).join('');
      items = [...menu.children];
    };
    const paint = () => {
      const o = sel.options[sel.selectedIndex];
      btn.firstChild.textContent = text(o) || ' ';
      btn.classList.toggle('is-placeholder', !sel.value);
      items.forEach((li, i) => { li.setAttribute('aria-selected', String(i === sel.selectedIndex)); li.classList.toggle('is-active', i === idx); });
    };
    const open = () => { build(); idx = Math.max(0, sel.selectedIndex); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); paint(); menu.focus(); const a = items[idx]; a && a.scrollIntoView({ block: 'nearest' }); };
    const close = (focus = true) => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focus) btn.focus(); };
    const pick = i => {
      if (!items[i] || items[i].getAttribute('aria-disabled')) return;
      if (sel.selectedIndex !== i) { idxDesc.set.call(sel, i); sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
      paint(); close();
    };
    const move = d => { idx = Math.min(items.length - 1, Math.max(0, idx + d)); paint(); items[idx].scrollIntoView({ block: 'nearest' }); };

    btn.addEventListener('click', () => (menu.hidden ? open() : close()));
    menu.addEventListener('click', e => { const li = e.target.closest('li'); if (li) pick(items.indexOf(li)); });
    menu.addEventListener('mousemove', e => { const li = e.target.closest('li'); if (li) { idx = items.indexOf(li); paint(); } });
    menu.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { move(1); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { move(-1); e.preventDefault(); }
      else if (e.key === 'Home') { move(-items.length); e.preventDefault(); }
      else if (e.key === 'End') { move(items.length); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === ' ') { pick(idx); e.preventDefault(); }
      else if (e.key === 'Escape') { close(); e.preventDefault(); }
      else if (e.key === 'Tab') close(false);
    });
    btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { open(); e.preventDefault(); } });
    document.addEventListener('click', e => { if (!wrap.contains(e.target) && !menu.hidden) close(false); });
    sel.addEventListener('change', paint);
    sel.form && sel.form.addEventListener('reset', () => setTimeout(paint));
    new MutationObserver(() => { build(); paint(); }).observe(sel, { childList: true });

    /* repaint when scripts set the value directly */
    Object.defineProperty(sel, 'value', { configurable: true, get() { return valDesc.get.call(this); }, set(v) { valDesc.set.call(this, v); paint(); } });
    Object.defineProperty(sel, 'selectedIndex', { configurable: true, get() { return idxDesc.get.call(this); }, set(v) { idxDesc.set.call(this, v); paint(); } });

    build(); paint();
  };

  const scan = () => document.querySelectorAll('select.form-select:not([data-dd])').forEach(upgrade);
  scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
