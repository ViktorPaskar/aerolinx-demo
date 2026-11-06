// The sample catalogue: part families expanded into SKUs per aircraft, with per-condition offers.
export const FLEET = ['A320', 'A330', 'A350', 'A380', '737', '777', '787', 'ATR 72', 'E190'];
export const CATS = ['gear', 'engine', 'avionics', 'electrical', 'systems', 'safety'];
export const CONDS = ['NE', 'OH', 'SV', 'AR'];
export const HUBS = ['DXB', 'DWC', 'SHJ'];
export const DOCS = ['EASA Form 1', 'FAA 8130-3'];
export const MAKERS = ['Meridian Aerosystems', 'Northgate Avionics', 'Halden Hydraulics', 'Corvus Power', 'Tessera Propulsion', 'Aldine Safety'];

// model, category, ATA chapter, names, base price (AED), maker, P/N prefix, aircraft groups, rotable?, weight kg, size cm, notes
const F = [
  ['brake', 'gear', 32, 'Main wheel brake assembly', 'مجموعة مكابح العجلة الرئيسية', 148500, 0, 'SB', [['A320'], ['737'], ['A330'], ['777']], 1, 68, '52 x 52 x 44'],
  ['brake', 'gear', 32, 'Carbon brake heat pack', 'حزمة أقراص مكابح كربونية', 96400, 0, 'CB', [['A320'], ['787'], ['A350']], 1, 42, '48 x 48 x 30'],
  ['wheel', 'gear', 32, 'Main wheel and tyre assembly', 'مجموعة العجلة والإطار الرئيسية', 26900, 0, 'TR', [['A320'], ['737'], ['E190'], ['A330']], 1, 92, '118 x 118 x 44'],
  ['nosewheel', 'gear', 32, 'Nose wheel assembly', 'مجموعة عجلة الأنف', 14800, 0, 'NW', [['A320'], ['737'], ['ATR 72']], 1, 34, '76 x 76 x 28'],
  ['actuator', 'gear', 32, 'Landing gear door actuator', 'مشغّل باب معدات الهبوط', 58200, 2, 'GA', [['A320'], ['737'], ['777']], 1, 12, '64 x 14 x 14'],
  ['actuator', 'systems', 27, 'Flap actuator', 'مشغّل القلابات', 127000, 2, 'AC', [['A380'], ['A330'], ['787']], 1, 19, '82 x 18 x 18'],
  ['blade', 'engine', 72, 'Fan blade', 'شفرة مروحة', 212000, 4, 'FB', [['737'], ['A320'], ['777']], 1, 14, '96 x 42 x 18'],
  ['tblade', 'engine', 72, 'High-pressure turbine blade set', 'طقم شفرات التوربين عالي الضغط', 391000, 4, 'TB', [['787', 'A350'], ['A320'], ['777']], 0, 6, '30 x 24 x 18'],
  ['starter', 'engine', 49, 'APU starter motor', 'محرك بدء وحدة الطاقة المساعدة', 73300, 3, 'SM', [['A320'], ['A330', '777'], ['737']], 1, 11, '38 x 20 x 20'],
  ['starter', 'engine', 80, 'Air turbine starter', 'مشغّل توربيني هوائي', 186000, 3, 'AT', [['737'], ['A320'], ['787']], 1, 16, '40 x 28 x 28'],
  ['igniter', 'engine', 74, 'Igniter plug', 'شمعة إشعال', 4850, 4, 'IG', [['A320'], ['737'], ['A330'], ['E190']], 0, .4, '26 x 4 x 4'],
  ['nozzle', 'engine', 73, 'Fuel nozzle', 'فوهة وقود', 31400, 4, 'FN', [['737'], ['A320'], ['777']], 1, 2.8, '30 x 18 x 12'],
  ['display', 'avionics', 31, 'Multifunction display unit', 'وحدة عرض متعددة الوظائف', 264000, 1, 'DU', [['787', 'A350'], ['A320'], ['737']], 1, 7.5, '26 x 22 x 32'],
  ['lru', 'avionics', 23, 'VHF communication transceiver', 'جهاز إرسال واستقبال VHF', 88500, 1, 'RT', [['A320'], ['737'], ['A330'], ['ATR 72']], 1, 4.2, '32 x 12 x 20'],
  ['lru', 'avionics', 34, 'Weather radar transceiver', 'جهاز رادار الطقس', 214000, 1, 'WX', [['A320'], ['777'], ['787']], 1, 11, '38 x 19 x 25'],
  ['lru', 'avionics', 34, 'Flight management computer', 'حاسوب إدارة الطيران', 342000, 1, 'FM', [['737'], ['A330'], ['A380']], 1, 8.4, '32 x 19 x 25'],
  ['panel', 'avionics', 23, 'Radio management panel', 'لوحة إدارة الراديو', 41800, 1, 'RM', [['A320'], ['A330'], ['A350']], 1, 1.3, '15 x 11 x 16'],
  ['panel', 'avionics', 23, 'Audio control panel', 'لوحة التحكم الصوتي', 26300, 1, 'AP', [['737'], ['777'], ['E190']], 1, 1.1, '15 x 11 x 14'],
  ['pitot', 'avionics', 34, 'Heated pitot probe', 'مسبار بيتو مُسخَّن', 31200, 1, 'PT', [['A320', 'A330'], ['737'], ['A350'], ['ATR 72']], 1, .9, '22 x 14 x 12'],
  ['generator', 'electrical', 24, 'Integrated drive generator', 'مولد الدفع المتكامل', 412000, 3, 'GN', [['A320'], ['737'], ['A330'], ['777']], 1, 48, '46 x 38 x 38'],
  ['battery', 'electrical', 24, 'Main nickel-cadmium battery', 'بطارية نيكل كادميوم رئيسية', 38700, 3, 'BA', [['A320'], ['737'], ['ATR 72'], ['E190']], 1, 34, '36 x 26 x 26'],
  ['light', 'electrical', 33, 'LED landing light', 'مصباح هبوط LED', 9850, 3, 'LL', [['737', 'A320'], ['A330'], ['E190']], 0, 2.1, '20 x 20 x 14'],
  ['light', 'electrical', 33, 'Runway turnoff light', 'مصباح الانعطاف على المدرج', 7400, 3, 'RL', [['A320'], ['777']], 0, 1.6, '18 x 18 x 12'],
  ['pump', 'systems', 29, 'Engine-driven hydraulic pump', 'مضخة هيدروليكية تعمل بالمحرك', 86400, 2, 'HP', [['737'], ['A320'], ['777'], ['A330']], 1, 13, '32 x 24 x 24'],
  ['pump', 'systems', 29, 'Electric motor pump', 'مضخة بمحرك كهربائي', 72100, 2, 'EM', [['A320'], ['787']], 1, 15, '36 x 22 x 22'],
  ['fuel', 'systems', 28, 'Fuel boost pump', 'مضخة تعزيز الوقود', 74600, 2, 'FP', [['A380', '777'], ['A320'], ['737']], 1, 9, '30 x 18 x 18'],
  ['valve', 'systems', 36, 'Engine bleed air valve', 'صمام سحب هواء المحرك', 118750, 2, 'BV', [['777'], ['A320'], ['737']], 1, 6.5, '28 x 22 x 24'],
  ['valve', 'systems', 21, 'Pack flow control valve', 'صمام التحكم في تدفق الهواء', 94300, 2, 'PF', [['A320'], ['A330']], 1, 5.8, '26 x 22 x 22'],
  ['filter', 'systems', 29, 'Hydraulic filter module', 'وحدة فلتر هيدروليكي', 6950, 2, 'FE', [['A320'], ['737'], ['A350'], ['777']], 0, 1.4, '20 x 10 x 10'],
  ['hose', 'systems', 29, 'Hydraulic hose assembly', 'مجموعة خرطوم هيدروليكي', 2840, 2, 'HS', [['A320'], ['737'], ['E190']], 0, .7, '68 x 6 x 6'],
  ['oxygen', 'safety', 35, 'Crew oxygen cylinder', 'أسطوانة أكسجين الطاقم', 19600, 5, 'OX', [['A320'], ['737'], ['A330']], 1, 8.2, '50 x 18 x 18'],
  ['elt', 'safety', 25, 'Emergency locator transmitter', 'جهاز تحديد موقع الطوارئ', 44200, 5, 'EL', [['A320'], ['737'], ['ATR 72'], ['777']], 0, 2.4, '24 x 12 x 16'],
  ['wiper', 'safety', 30, 'Windshield wiper assembly', 'مجموعة ماسحة الزجاج الأمامي', 16400, 5, 'WW', [['A320'], ['737']], 1, 2.2, '74 x 12 x 8'],
];

function rng(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
const round50 = n => Math.round(n / 50) * 50;

export const PARTS = [];
F.forEach(([model, cat, ata, en, ar, base, maker, pre, groups, rotable, kg, size], fi) => {
  groups.forEach((fits, gi) => {
    const r = rng(pre + fi + gi);
    const num = 1000 + Math.floor(r() * 8999);
    const pn = `${pre}-${num}-${String(2 + Math.floor(r() * 40)).padStart(2, '0')}`;
    const factor = .84 + r() * .42;
    const conds = rotable ? (r() > .3 ? ['NE', 'OH', 'SV'] : ['OH', 'SV', 'AR']) : ['NE'];
    const offers = conds.map((c, i) => {
      const mult = { NE: 1, OH: .68, SV: .52, AR: .34 }[c];
      return {
        c,
        aed: round50(base * factor * mult),
        qty: Math.max(1, Math.round((kg < 3 ? 22 : 7) * r())),
        from: HUBS[Math.floor(r() * 3)],
        doc: c === 'AR' ? 'FAA 8130-3' : DOCS[Math.floor(r() * 2)],
      };
    });
    if (r() < .12) offers.forEach(o => { o.qty = 0; });
    const altA = `${pre}${num + 7}-${String(Math.floor(r() * 90) + 10)}`, altB = `${pre}-${num}-${String(Math.floor(r() * 90) + 10)}R`;
    PARTS.push({
      pn, model, cat, ata, en, ar, fits, rotable: !!rotable, maker: MAKERS[maker], kg, size, offers,
      alts: rotable ? [altA, altB] : [altA],
      view: gi % 2 ? 2 : 1,
      hs: rotable ? '8807.30' : '8807.90',
      eccn: cat === 'avionics' ? '7A994' : '9A991.d',
      warranty: rotable ? 12 : 6,
      shelf: ['filter', 'hose', 'oxygen'].includes(model),
      hazmat: ['battery', 'oxygen', 'elt'].includes(model),
    });
  });
});

// Default shelf order: one of each kind of part before any repeats.
const SHELF = ['brake', 'display', 'generator', 'blade', 'pump', 'oxygen', 'wheel', 'lru', 'starter', 'valve', 'elt', 'light', 'tblade', 'panel', 'fuel', 'nosewheel', 'battery', 'nozzle', 'actuator', 'filter', 'pitot', 'igniter', 'hose', 'wiper'];
const seen = {};
PARTS.forEach(p => { seen[p.model] = (seen[p.model] || 0) + 1; p.rank = seen[p.model] * 100 + SHELF.indexOf(p.model); p.view = seen[p.model] % 2 ? 1 : 2; });

export const photo = (p, view) => `assets/photos/${p.model}-${view || p.view}.webp`;
export const stock = p => p.offers.reduce((a, o) => a + o.qty, 0);
export const bestOffer = p => { const on = p.offers.filter(o => o.qty); return (on.length ? on : p.offers).reduce((a, o) => o.aed < a.aed ? o : a); };

export const CITIES = [
  { en: 'Doha', ar: 'الدوحة', lat: 25.3, lon: 51.5, t: '1h 10', dy: -10 },
  { en: 'Muscat', ar: 'مسقط', lat: 23.6, lon: 58.4, t: '1h 15', dy: 10 },
  { en: 'Riyadh', ar: 'الرياض', lat: 24.7, lon: 46.7, t: '2h', dy: 8 },
  { en: 'Karachi', ar: 'كراتشي', lat: 24.9, lon: 67, t: '2h 05' },
  { en: 'Mumbai', ar: 'مومباي', lat: 19.1, lon: 72.9, t: '3h 10' },
  { en: 'Jeddah', ar: 'جدة', lat: 21.5, lon: 39.2, t: '3h 20' },
  { en: 'Delhi', ar: 'دلهي', lat: 28.6, lon: 77.2, t: '3h 30' },
  { en: 'Cairo', ar: 'القاهرة', lat: 30, lon: 31.2, t: '4h 15' },
  { en: 'Istanbul', ar: 'إسطنبول', lat: 41, lon: 29, t: '4h 55' },
  { en: 'Nairobi', ar: 'نيروبي', lat: -1.3, lon: 36.8, t: '5h 05' },
];
