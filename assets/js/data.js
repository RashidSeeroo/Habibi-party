window.HP = (() => {
  const IMG = 'https://habibi-party.vercel.app/assets/img/';

  const icons = {
    balloon: '<path d="M12 3c3.6 0 6 2.8 6 6.4 0 3.9-3 7.1-6 7.1s-6-3.2-6-7.1C6 5.8 8.4 3 12 3z"/><path d="M11 16.6l-.6 1.6h3.2l-.6-1.6M12 18.2c0 1.6-1.6 1.6-1.6 3"/><path d="M9 7.6c.5-1 1.3-1.6 2.2-1.9"/>',
    arch: '<path d="M3 20v-6a9 9 0 0 1 18 0v6"/><circle cx="4" cy="17.5" r="1.6"/><circle cx="5.3" cy="12" r="1.6"/><circle cx="8.6" cy="7.6" r="1.6"/><circle cx="12" cy="6" r="1.6"/><circle cx="15.4" cy="7.6" r="1.6"/><circle cx="18.7" cy="12" r="1.6"/><circle cx="20" cy="17.5" r="1.6"/>',
    plates: '<ellipse cx="12" cy="13" rx="9" ry="5.5"/><ellipse cx="12" cy="13" rx="5" ry="2.8"/><path d="M3 13v1.6c0 3 4 5.5 9 5.5s9-2.5 9-5.5V13"/>',
    curtain: '<path d="M3 4h18"/><path d="M5 4v15M8 4v12M11 4v16M14 4v13M17 4v15M20 4v11"/>',
    number: '<path d="M8 6.5C8.8 4.6 10.3 3.6 12.3 3.6c2.4 0 4 1.5 4 3.6 0 3.4-5.4 6.4-8.2 12.4h8.6"/><path d="M12 19.6v1.8"/>',
    flower: '<circle cx="12" cy="9" r="2.2"/><path d="M12 6.8c-1-2.6 2-3.8 2.4-1.4M14.2 9c2.6-1 3.8 2 1.4 2.4M12 11.2c1 2.6-2 3.8-2.4 1.4M9.8 9c-2.6 1-3.8-2-1.4-2.4"/><path d="M12 12v9M12 16c-2-2-4.5-1.6-5 0M12 18c2-2 4.5-1.6 5 0"/>',
    pouch: '<path d="M7 9h10l1.6 10.4a1.6 1.6 0 0 1-1.6 1.6H7a1.6 1.6 0 0 1-1.6-1.6z"/><path d="M8.2 9C8 6.4 9.2 4 12 4s4 2.4 3.8 5"/><path d="M9 12.4c2 1 4 1 6 0"/>',
    banner: '<path d="M2.5 5.5h19"/><path d="M4 5.5l2 6 2-6M10 5.5l2 6 2-6M16 5.5l2 6 2-6"/><path d="M6 15.5c3 2.6 9 2.6 12 0"/>',
    garland: '<path d="M3 6c4 6 14 6 18 0"/><circle cx="5.5" cy="9.6" r="1.8"/><circle cx="9.4" cy="11.6" r="1.8"/><circle cx="14.6" cy="11.6" r="1.8"/><circle cx="18.5" cy="9.6" r="1.8"/><path d="M12 12v5M10.5 18.6c0 1.4 3 1.4 3 0"/>',
    runner: '<path d="M2.5 10.5h19v5h-19z"/><path d="M8 10.5v5M16 10.5v5M5 18.5h14"/>',
    skirt: '<path d="M3 7h18"/><path d="M4 7l-1 12h18L20 7"/><path d="M7.5 7l-.8 12M12 7v12M16.5 7l.8 12"/>',
    daisy: '<circle cx="12" cy="10" r="2.4"/><path d="M12 3.4v3.4M12 13.2v3.4M5.4 10h3.4M15.2 10h3.4M7.3 5.3l2.4 2.4M14.3 12.3l2.4 2.4M7.3 14.7l2.4-2.4M14.3 7.7l2.4-2.4"/><path d="M12 16.6v4.8"/>',
    charger: '<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="5.6"/><path d="M12 1.8v1.6M12 20.6v1.6M1.8 12h1.6M20.6 12h1.6"/>',
    candle: '<path d="M8 21v-9h8v9"/><path d="M6 21h12"/><path d="M12 12V9M12 4.4c1.6 1.8.6 3-0 3.8-.8-1-1.6-2 0-3.8z"/>',
    cup: '<path d="M6 5h12l-1.6 15H7.6z"/><path d="M6.6 10h10.8"/>'
  };

  const svg = (name, size = 64) =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.balloon}</svg>`;

  const products = [
    { id: 'arch-rose', name: 'Rose Gold Balloon Arch Kit, 73 pieces', cat: 'Balloons', sub: 'Balloon Bouquets & Arrangements', items: ['Ready-Made Garlands & Arches'], colour: ['Rose Gold', 'Pink'], shape: 'Round', occ: ['Birthday', 'Wedding', 'Baby shower'], price: 129, was: 165, rating: 4.8, reviews: 214, badge: 'Best seller', icon: 'arch', tone: 'pink', isNew: false },
    { id: 'tableware-6', name: 'Happy Birthday Party Tableware Set for 6', cat: 'Tableware', occ: ['Birthday'], price: 89, rating: 4.9, reviews: 156, badge: 'New', icon: 'plates', tone: 'sky', isNew: true },
    { id: 'curtain-set', name: 'Foil Curtain Backdrop & Banner Set', cat: 'Decorations', occ: ['Birthday', 'Celebration', 'Graduation'], price: 65, was: 85, rating: 4.7, reviews: 98, icon: 'curtain', tone: 'lilac' },
    { id: 'number-32', name: 'Gold Number Foil Balloon, 32 inch', cat: 'Balloons', sub: 'Foil Balloons', items: ['Number Balloons'], colour: ['Gold'], shape: 'Number', size: '32in', occ: ['Birthday'], price: 32, rating: 4.6, reviews: 67, icon: 'number', tone: 'sun' },
    { id: 'flower-centre', name: 'Artificial Flower Centrepiece Set', cat: 'Decorations', occ: ['Wedding', 'Baby shower'], price: 74, rating: 4.8, reviews: 43, badge: 'Best seller', icon: 'flower', tone: 'mint' },
    { id: 'gold-plates', name: 'Gold Paper Party Plates, Set of 10', cat: 'Tableware', occ: ['Birthday', 'Wedding', 'Ramadan & Eid'], price: 55, rating: 4.9, reviews: 121, icon: 'plates', tone: 'sun' },
    { id: 'organza-25', name: 'Organza Favour Pouches, 25 pack', cat: 'Party favours', occ: ['Wedding', 'Baby shower', 'Ramadan & Eid'], price: 41, was: 52, rating: 4.7, reviews: 76, icon: 'pouch', tone: 'pink' },
    { id: 'latex-100', name: 'Classic Latex Balloon Bundle, 100 pack', cat: 'Balloons', sub: 'Latex Balloons', items: ['Solid Colour Latex', 'Standard & Metallic Latex'], material: 'Standard', colour: ['Multicolour'], shape: 'Round', size: '12in', occ: ['Birthday', 'Celebration', 'Graduation'], price: 18, rating: 4.5, reviews: 302, badge: 'Best seller', icon: 'balloon', tone: 'red' },
    { id: 'hb-banner', name: 'Happy Birthday foil banner', cat: 'Decorations', occ: ['Birthday'], price: 45, rating: 4.7, reviews: 88, icon: 'banner', tone: 'sun' },
    { id: 'garland-pink', name: 'Pink balloon garland kit', cat: 'Balloons', sub: 'Balloon Bouquets & Arrangements', items: ['Ready-Made Garlands & Arches'], colour: ['Pink'], shape: 'Round', occ: ['Birthday', 'Baby shower'], price: 139, rating: 4.8, reviews: 64, icon: 'garland', tone: 'pink' },
    { id: 'garland-rainbow', name: 'Rainbow balloon garland kit', cat: 'Balloons', sub: 'Balloon Bouquets & Arrangements', items: ['Ready-Made Garlands & Arches'], colour: ['Multicolour'], shape: 'Round', occ: ['Birthday'], price: 139, rating: 4.7, reviews: 51, icon: 'garland', tone: 'sky', isNew: true, badge: 'New' },
    { id: 'fringe', name: 'Foil fringe curtain', cat: 'Decorations', occ: ['Birthday', 'Celebration'], price: 65, rating: 4.6, reviews: 72, icon: 'curtain', tone: 'pink' },
    { id: 'sequin-runner', name: 'Sequin table runner', cat: 'Tableware', occ: ['Wedding', 'Birthday'], price: 38, rating: 4.6, reviews: 39, icon: 'runner', tone: 'lilac' },
    { id: 'foil-skirt', name: 'Foil table skirt', cat: 'Tableware', occ: ['Birthday', 'Celebration'], price: 34, rating: 4.5, reviews: 33, icon: 'skirt', tone: 'mint' },
    { id: 'daisy-foil', name: 'Daisy foil balloon', cat: 'Balloons', sub: 'Foil Balloons', items: ['Shape Balloons (Hearts, Stars, Rounds)'], colour: ['Yellow'], shape: 'Round', occ: ['Birthday', 'Baby shower'], price: 24, rating: 4.7, reviews: 29, icon: 'daisy', tone: 'sun' },
    { id: 'confetti-runner', name: 'Confetti table runner', cat: 'Tableware', occ: ['Birthday', 'Celebration'], price: 29, rating: 4.4, reviews: 21, icon: 'runner', tone: 'sky' },
    { id: 'gold-chargers', name: 'Gold charger plates', cat: 'Tableware', occ: ['Wedding', 'Ramadan & Eid'], price: 55, rating: 4.8, reviews: 47, icon: 'charger', tone: 'sun' },
    { id: 'arch-kit', name: 'Balloon arch kit', cat: 'Balloons', sub: 'Balloon Bouquets & Arrangements', items: ['Ready-Made Garlands & Arches'], colour: ['Lavender'], shape: 'Round', occ: ['Wedding', 'Celebration'], price: 129, rating: 4.7, reviews: 58, icon: 'arch', tone: 'lilac' }
  ];

  products.forEach(p => { p.img = 'assets/img/products/' + p.id + '.jpg'; });

  const packs = [
    { id: 'pack-love', name: 'Love & Hearts', price: 249, img: IMG + 'pack-1-love-hearts.webp' },
    { id: 'pack-unicorn', name: 'Unicorn Dream', price: 289, img: IMG + 'pack-2-unicorn-dream.webp' },
    { id: 'pack-glam', name: 'Pink & Purple Glam', price: 259, img: IMG + 'pack-3-pink-purple.webp' },
    { id: 'pack-teddy', name: 'Teddy & Gold', price: 279, img: IMG + 'pack-4-teddy-gold.webp' },
    { id: 'pack-princess', name: 'Pink Princess', price: 269, img: IMG + 'pack-5-pink-princess.webp' },
    { id: 'pack-rbg', name: 'Red, Black & Gold', price: 249, img: IMG + 'pack-6-red-black-gold.webp' },
    { id: 'pack-npg', name: 'Navy, Pink & Gold', price: 259, img: IMG + 'pack-7-navy-pink-gold.webp' },
    { id: 'pack-gw', name: 'Gold & White Classic', price: 239, img: IMG + 'pack-8-gold-white.webp' }
  ].map(p => ({ ...p, cat: 'Party kits', occ: ['Birthday', 'Celebration'], rating: 4.8, reviews: 0, isPack: true }));

  const looks = [
    {
      label: 'Rose gold wedding table', img: IMG + 'setup-1-rosegold-wedding.webp',
      spots: [
        { x: 45, y: 8, name: 'Balloon arch kit', price: 129 },
        { x: 51, y: 40, name: 'Foil curtain backdrop', price: 65 },
        { x: 58, y: 84, name: 'Gold charger plates', price: 55 }
      ]
    },
    {
      label: 'Rainbow birthday table', img: IMG + 'setup-2-rainbow-birthday.webp',
      spots: [
        { x: 38, y: 20, name: 'Daisy foil balloon', price: 24 },
        { x: 50, y: 31, name: 'Happy Birthday foil banner', price: 45 },
        { x: 63, y: 12, name: 'Rainbow balloon garland kit', price: 139 },
        { x: 48, y: 88, name: 'Confetti table runner', price: 29 }
      ]
    },
    {
      label: 'Pink and purple birthday table', img: IMG + 'setup-3-pink-birthday.webp',
      spots: [
        { x: 48, y: 22, name: 'Happy Birthday foil banner', price: 45 },
        { x: 60, y: 12, name: 'Pink balloon garland kit', price: 139 },
        { x: 41, y: 24, name: 'Foil fringe curtain', price: 65 },
        { x: 48, y: 82, name: 'Sequin table runner', price: 38 },
        { x: 85, y: 72, name: 'Foil table skirt', price: 34 }
      ]
    }
  ];

  const aed = n => 'AED ' + n.toLocaleString('en-US');

  return { IMG, icons, svg, products, packs, looks, aed };
})();
