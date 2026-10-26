/* MyAKTA172 Admin — policy demonstrasi sahaja; TIADA kawalan server-side.
   Pemetaan bahagian/seksyen disalin daripada DATA.parts di index.html cabang audit (27 Okt 2026).
   Jangan ubah DATA atau ciri terkunci. */
(function (root, makePolicy) {
  const policy = makePolicy();
  if (typeof module !== 'undefined' && module.exports) module.exports = policy;
  if (root) root.MyAKTAAdminPolicy = policy;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const parts = [
  {
    "num": "I",
    "title": "PERMULAAN",
    "sections": [
      "1",
      "2"
    ]
  },
  {
    "num": "II",
    "title": "DASAR DAN PENTADBIRAN",
    "sections": [
      "2A",
      "2B",
      "3",
      "4",
      "5",
      "6"
    ]
  },
  {
    "num": "IIA",
    "title": "JAWATANKUASA PERANCANG WILAYAH",
    "sections": [
      "6A"
    ]
  },
  {
    "num": "IIB",
    "title": "RANCANGAN FIZIKAL NEGARA",
    "sections": [
      "6B"
    ]
  },
  {
    "num": "III",
    "title": "RANCANGAN PEMAJUAN",
    "sections": [
      "7",
      "8",
      "9",
      "10",
      "11",
      "11A",
      "11B",
      "12",
      "12A",
      "13",
      "14",
      "15",
      "16",
      "16A",
      "16B",
      "17"
    ]
  },
  {
    "num": "IV",
    "title": "KAWALAN PERANCANGAN",
    "sections": [
      "18",
      "19",
      "20",
      "20A",
      "20B",
      "21",
      "21A",
      "21B",
      "21C",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
      "31A"
    ]
  },
  {
    "num": "V",
    "title": "CAJ PEMAJUAN",
    "sections": [
      "32",
      "33",
      "34",
      "35"
    ]
  },
  {
    "num": "VA",
    "title": "PERINTAH PEMELIHARAAN POKOK",
    "sections": [
      "35A",
      "35B",
      "35C",
      "35D",
      "35E",
      "35F",
      "35G",
      "35H"
    ]
  },
  {
    "num": "VI",
    "title": "LEMBAGA RAYUAN",
    "sections": [
      "36"
    ]
  },
  {
    "num": "VII",
    "title": "NOTIS PEMBELIAN DAN PENGAMBILAN TANAH",
    "sections": [
      "37"
    ]
  },
  {
    "num": "VIII",
    "title": "KAWASAN PEMAJUAN",
    "sections": [
      "38",
      "39",
      "40",
      "41",
      "42",
      "43",
      "44"
    ]
  },
  {
    "num": "IX",
    "title": "PERUNTUKAN PELBAGAI",
    "sections": [
      "45",
      "46",
      "47",
      "48",
      "49",
      "50",
      "51",
      "52",
      "52A",
      "53",
      "54",
      "55",
      "56",
      "57",
      "58",
      "59"
    ]
  }
];
  const order = ['Free', 'Basic', 'Rahmah', 'Premium'];
  const features = ['search', 'flow', 'bookmarks', 'history', 'highlight', 'voice', 'glossary', 'related'];
  const packages = {
    Free:    { price: 0,  parts: ['I', 'II'], features: ['bookmarks', 'history'] },
    Basic:   { price: 15, parts: ['I', 'II', 'IIA', 'IIB', 'III'], features: ['search', 'bookmarks', 'history', 'glossary', 'related'] },
    Rahmah:  { price: 25, parts: ['I', 'II', 'IIA', 'IIB', 'III', 'IV'], features: ['search', 'flow', 'bookmarks', 'history', 'highlight', 'voice', 'glossary', 'related'] },
    Premium: { price: 50, parts: parts.map(p => p.num), features: features.slice() }
  };
  const sectionToPart = Object.create(null);
  for (const part of parts) for (const section of part.sections) {
    if (sectionToPart[section]) throw new Error('Duplikasi seksyen: ' + section);
    sectionToPart[section] = part.num;
  }
  const knownSections = Object.keys(sectionToPart);
  if (parts.length !== 12 || knownSections.length !== 83) throw new Error('Pemetaan seksyen tidak lengkap');
  const getPlan = name => Object.prototype.hasOwnProperty.call(packages, name) ? packages[name] : null;
  const partOf = section => sectionToPart[String(section).trim().toUpperCase()] || null;
  const canRead = (name, section) => !!(getPlan(name) && partOf(section) && getPlan(name).parts.includes(partOf(section)));
  const listedFeature = (name, feature) => !!(getPlan(name) && getPlan(name).features.includes(feature));
  // Hubungan seksyen disenaraikan sebagai hak pakej, tetapi dikunci sehingga audit hubungan lulus.
  const canUseFeature = (name, feature) => feature !== 'related' && listedFeature(name, feature);
  // Fail-closed: carta dan cetakan MESTI mempunyai senarai seksyen rujukan yang telah disahkan.
  // Tiada senarai disahkan => tidak layak ditayangkan, walaupun pakej mempunyai ciri flow.
  const canUseChart = (name, requiredSections) => !!(
    canUseFeature(name, 'flow') && Array.isArray(requiredSections) &&
    requiredSections.length > 0 && requiredSections.every(id => canRead(name, id))
  );
  const canPrintChart = canUseChart;
  function period30Days(dateInput) {
    const start = new Date(dateInput);
    if (Number.isNaN(start.getTime())) throw new Error('Tarikh langganan tidak sah');
    const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  function validatePayment(p) {
    return !!(p && getPlan(p.plan) && p.plan !== 'Free' && p.amount === getPlan(p.plan).price);
  }
  return Object.freeze({ parts, order, features, packages, knownSections, partOf,
    canRead, listedFeature, canUseFeature, canUseChart, canPrintChart,
    period30Days, validatePayment, subscriptionDays: 30, relatedPendingAudit: true });
});
