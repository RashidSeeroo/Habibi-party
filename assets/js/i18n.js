/* English / Arabic switcher. Translates text nodes and key attributes using
   the dictionary in i18n-ar.js (window.HP_AR), flips the page to RTL and
   remembers the choice. English is the source of truth and is restored by
   keeping the original text of every node we touch. */
(() => {
  const KEY = 'hp-lang';
  const AR = window.HP_AR || {};
  const root = document.documentElement;
  const textOrig = new WeakMap();   // text node -> original string
  const attrOrig = new WeakMap();   // element -> { attr: original }
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  let lang = 'en', busy = false;

  const norm = s => s.replace(/\s+/g, ' ').trim();
  const EXTRA = {
    'Colour': 'اللون', 'Shape': 'الشكل', 'Size': 'الحجم', 'Price': 'السعر', 'Material': 'الخامة', 'Availability': 'التوفر',
    'Category': 'الفئة', 'Occasion': 'المناسبة', 'Round': 'دائري', 'Star': 'نجمة', 'Heart': 'قلب', 'Number': 'رقم',
    'Letter': 'حرف', 'Square': 'مربع', 'Small': 'صغير', 'Medium': 'وسط', 'Large': 'كبير', 'Jumbo': 'ضخم',
    'Featured': 'مميز', 'Clear all': 'مسح الكل', 'Clear': 'مسح', 'Apply': 'تطبيق', 'Showing': 'عرض',
    'Cart': 'السلة', 'Basket': 'السلة', 'Search': 'بحث', 'Menu': 'القائمة', 'Home': 'الرئيسية', 'Shop': 'تسوق',
    'Sign in': 'تسجيل الدخول', 'Account': 'الحساب', 'Wishlist': 'المفضلة', 'Save': 'حفظ', 'Saved': 'تم الحفظ'
  };
  Object.keys(EXTRA).forEach(k => { if (!AR[k]) AR[k] = EXTRA[k]; });
  const LOW = {};
  Object.keys(AR).forEach(k => { LOW[k.toLowerCase()] = AR[k]; });
  const tr = s => {
    const k = norm(s);
    if (!k) return null;
    if (AR[k]) return AR[k];
    return patterns(k) || LOW[k.toLowerCase()] || null;
  };
  /* dynamic strings that carry a name or number */
  const patterns = k => {
    let m;
    if ((m = k.match(/^(-?)AED ([\d,.]+)$/))) return `${m[1]}${m[2]} درهم`;
    if ((m = k.match(/^(.+) saved to your wishlist$/))) return `تمت إضافة ${AR[m[1]] || m[1]} إلى قائمة المفضلة`;
    if ((m = k.match(/^(.+) removed from your wishlist$/))) return `تمت إزالة ${AR[m[1]] || m[1]} من قائمة المفضلة`;
    if ((m = k.match(/^Add (.+) to basket$/))) return `أضف ${AR[m[1]] || m[1]} إلى السلة`;
    if ((m = k.match(/^Save (.+) to wishlist$/))) return `احفظ ${AR[m[1]] || m[1]} في المفضلة`;
    if ((m = k.match(/^Remove (.+) from wishlist$/))) return `أزل ${AR[m[1]] || m[1]} من المفضلة`;
    if ((m = k.match(/^Tableware for (\d+)$/))) return `أدوات مائدة لـ ${m[1]}`;
    if ((m = k.match(/^(\d+) party bags$/))) return `${m[1]} أكياس حفلات`;
    if ((m = k.match(/^(\d+) items?$/))) return `${m[1]} منتج`;
    if ((m = k.match(/^(\d+) products?$/))) return `${m[1]} منتج`;
    if ((m = k.match(/^(.+) · (\d+) guests$/))) return `${AR[m[1]] || m[1]} · ${m[2]} ضيف`;
    if ((m = k.match(/^fits your AED ([\d,]+) budget$/))) return `ضمن ميزانيتك ${m[1]} درهم`;
    return null;
  };

  const walk = (node, fn) => {
    if (node.nodeType === 3) return fn(node);
    if (node.nodeType !== 1) return;
    const t = node.nodeName;
    if (t === 'SCRIPT' || t === 'STYLE' || t === 'NOSCRIPT' || node.hasAttribute('data-no-i18n')) return;
    fn(node);
    for (let c = node.firstChild; c; c = c.nextSibling) walk(c, fn);
  };

  const apply = node => {
    const toAr = lang === 'ar';
    walk(node, n => {
      if (n.nodeType === 3) {
        const cur = n.nodeValue;
        if (toAr) {
          const o = textOrig.has(n) ? textOrig.get(n) : cur;
          const a = tr(o);
          if (a == null) { if (textOrig.has(n) && o !== cur && !textOrig.get(n)) textOrig.delete(n); return; }
          const lead = o.match(/^\s*/)[0], trail = o.match(/\s*$/)[0];
          if (!textOrig.has(n)) textOrig.set(n, o);
          const out = lead + a + trail;
          if (cur !== out) n.nodeValue = out;
        } else if (textOrig.has(n)) {
          n.nodeValue = textOrig.get(n);
          textOrig.delete(n);
        }
      } else {
        ATTRS.forEach(at => {
          if (!n.hasAttribute(at)) return;
          const store = attrOrig.get(n) || {};
          if (toAr) {
            const o = at in store ? store[at] : n.getAttribute(at);
            const a = tr(o);
            if (a == null) return;
            store[at] = o; attrOrig.set(n, store);
            if (n.getAttribute(at) !== a) n.setAttribute(at, a);
          } else if (at in store) {
            n.setAttribute(at, store[at]); delete store[at];
          }
        });
      }
    });
  };

  const metaFix = () => {
    const d = document.querySelector('meta[name="description"]');
    if (!document.documentElement.dataset.enTitle) {
      root.dataset.enTitle = document.title;
      root.dataset.enDesc = d ? d.content : '';
    }
    if (lang === 'ar') {
      document.title = tr(root.dataset.enTitle) || root.dataset.enTitle;
      if (d) d.content = tr(root.dataset.enDesc) || root.dataset.enDesc;
    } else {
      document.title = root.dataset.enTitle;
      if (d) d.content = root.dataset.enDesc;
    }
  };

  const paintToggle = () => {
    document.querySelectorAll('[data-lang-toggle]').forEach(b => {
      const ar = lang === 'ar';
      b.textContent = ar ? 'English' : 'العربية';
      b.setAttribute('lang', ar ? 'en' : 'ar');
      b.setAttribute('aria-label', ar ? 'Switch to English' : 'التبديل إلى العربية');
    });
  };

  const run = () => { busy = true; try { apply(document.body); metaFix(); } finally { busy = false; } };

  const set = (l, persist = true) => {
    lang = l === 'ar' ? 'ar' : 'en';
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.classList.toggle('is-ar', lang === 'ar');
    if (persist) { try { localStorage.setItem(KEY, lang); } catch {} }
    run();
    paintToggle();
    document.dispatchEvent(new CustomEvent('hp:lang', { detail: { lang } }));
  };
  window.HP = window.HP || {};
  HP.lang = () => lang;
  HP.setLang = set;
  HP.t = s => (lang === 'ar' && tr(s)) || s;

  /* toggle buttons: desktop top bar + mobile menu */
  const mount = () => {
    const make = cls => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.setAttribute('data-lang-toggle', ''); b.setAttribute('data-no-i18n', ''); b.addEventListener('click', () => set(lang === 'ar' ? 'en' : 'ar')); return b; };
    const links = document.querySelector('.topbar-links');
    if (links) links.appendChild(make('lang-btn'));
    const hdr = document.querySelector('.header-actions');
    if (hdr) { const b = make('lang-btn lang-btn--hdr'); hdr.insertBefore(b, hdr.firstChild); }
  };

  /* re-translate content that scripts render later */
  const mo = new MutationObserver(muts => {
    if (busy || lang !== 'ar') return;
    busy = true;
    try { muts.forEach(m => {
      if (m.type === 'childList') m.addedNodes.forEach(n => apply(n));
      else if (m.type === 'characterData') apply(m.target);
      else if (m.type === 'attributes') apply(m.target);
    }); } finally { busy = false; }
  });

  const init = () => {
    mount();
    let want = 'en';
    try { want = new URLSearchParams(location.search).get('lang') || localStorage.getItem(KEY) || 'en'; } catch {}
    paintToggle();
    if (want === 'ar') set('ar', false);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  else setTimeout(init, 0);
})();
