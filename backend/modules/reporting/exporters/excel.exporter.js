/**
 * excel.exporter.js
 *
 * Resmi BBHB raporu sablonuna (Ek-4/ab tarzi) uygun genis (wide) tablo
 * uretir: Sira No, Isletmeci Adi, grup basina alt kategori sutunlari
 * (adet), Toplam BBHB. Renk semasi TEK RENK AILESI (gri tonlari) -
 * kurumsal rapor standardi: Times New Roman 8pt, 14.5pt satir yuksekligi.
 *
 * Birden fazla bolum (il/ilce/mahalle) varsa, her bolum kendi basligi
 * ve tablosuyla alt alta yazilir; en sonda GENEL OZET ve tek seferlik
 * siniflandirma kriterleri tablosu gelir.
 */

const ExcelJS = require('exceljs');
const lang = require('../../../../config/lang/tr');
const { katsayiBul } = require('../../bbhb/bbhb.rules');

// ---- Gri ton paleti (kurumsal, tek renk ailesi) ----
const RENK = {
  koyu: 'FF3F3F3C',        // ana baslik / bolum basligi
  orta: 'FF6E6E68',        // grup/alt-kategori basliklari
  katsayi: 'FFEDEBE4',     // katsayi satiri
  seritAcik: 'FFFFFFFF',   // veri satiri (acik)
  seritKoyu: 'FFF4F4F2',   // veri satiri (alternatif)
  toplam: 'FFDCDCD7',      // TOPLAM satiri
  ozetEtiket: 'FFD9D9D4',  // ozet bilgi etiket hucresi
};

const YAZI_TIPI = 'Times New Roman';
const YAZI_BOYUTU = 8;
const SATIR_YUKSEKLIGI = 15;

// ---- Resmi sablon sutun haritasi: [grup baslik, [{etiket, kategoriKodlari}]] ----
const SUTUN_HARITASI = [
  { grup: 'kulturIrki', baslik: 'Kültür Irkı', altlar: [
    { etiket: 'İnek', kodlar: ['inek'] },
    { etiket: 'Dana-Düve', kodlar: ['dana', 'duve'] },
  ]},
  { grup: 'kulturMelezi', baslik: 'Kültür Melezi', altlar: [
    { etiket: 'İnek', kodlar: ['inek'] },
    { etiket: 'Dana-Düve', kodlar: ['dana', 'duve'] },
  ]},
  { grup: 'yerliIrk', baslik: 'Yerli Irk', altlar: [
    { etiket: 'İnek', kodlar: ['inek'] },
    { etiket: 'Dana-Düve', kodlar: ['dana', 'duve'] },
  ]},
  { grup: 'buyukbasErkek', baslik: 'Büyükbaş Diğer', altlar: [
    { etiket: 'Boğa', kodlar: ['boga'] },
    { etiket: 'Öküz', kodlar: ['okuz'] },
  ]},
  { grup: 'manda', baslik: 'Manda', altlar: [
    { etiket: 'Erkek', kodlar: ['mandaErkek'] },
    { etiket: 'Dişi', kodlar: ['mandaDisi'] },
  ]},
  { grup: 'kucukbas', baslik: 'Küçükbaş', altlar: [
    { etiket: 'Koyun', kodlar: ['koyun'] },
    { etiket: 'Keçi', kodlar: ['kec'] },
    { etiket: 'Kuzu/Oğlak', kodlar: ['kuzu', 'oglak'] },
  ]},
  { grup: 'tekTirnakli', baslik: 'Tek Tırnaklı', altlar: [
    { etiket: 'At', kodlar: ['at'] },
    { etiket: 'Katır', kodlar: ['katir'] },
    { etiket: 'Eşek', kodlar: ['esek'] },
  ]},
];

// ---- Siniflandirma kriterleri: paragraf metni icin yas/cinsiyet/irk aciklamalari ----
const KRITER_ACIKLAMALARI = [
  {
    grup: 'kulturIrki',
    baslik: 'Kültür Irkı',
    not: '"M" ile bitmeyen ve yerli ırk listesinde yer almayan ırklar',
    kategoriler: [
      { kod: 'inek', etiket: 'İnek', kosul: 'dişi, 22 ay ve üzeri' },
      { kod: 'duve', etiket: 'Düve', kosul: 'dişi, 21 ay ve altı' },
      { kod: 'dana', etiket: 'Dana', kosul: 'erkek, 12 ay ve altı' },
    ],
  },
  {
    grup: 'kulturMelezi',
    baslik: 'Kültür Melezi',
    not: 'ırk adı "M" ile bitenler',
    kategoriler: [
      { kod: 'inek', etiket: 'İnek', kosul: 'dişi, 22 ay ve üzeri' },
      { kod: 'duve', etiket: 'Düve', kosul: 'dişi, 21 ay ve altı' },
      { kod: 'dana', etiket: 'Dana', kosul: 'erkek, 12 ay ve altı' },
    ],
  },
  {
    grup: 'yerliIrk',
    baslik: 'Yerli Irk',
    not: 'Akkaraman, Kıvırcık, Morkaraman, İvesi, Norduz, Hemşin, Kangal ırkları',
    kategoriler: [
      { kod: 'inek', etiket: 'İnek', kosul: 'dişi, 22 ay ve üzeri' },
      { kod: 'duve', etiket: 'Düve', kosul: 'dişi, 21 ay ve altı' },
      { kod: 'dana', etiket: 'Dana', kosul: 'erkek, 12 ay ve altı' },
    ],
  },
  {
    grup: 'buyukbasErkek',
    baslik: 'Büyükbaş Diğer',
    not: null,
    kategoriler: [
      { kod: 'boga', etiket: 'Boğa', kosul: 'erkek, 13-96 ay' },
      { kod: 'okuz', etiket: 'Öküz', kosul: 'erkek, 97 ay ve üzeri' },
    ],
  },
  {
    grup: 'manda',
    baslik: 'Manda',
    not: 'yaştan bağımsız',
    kategoriler: [
      { kod: 'mandaErkek', etiket: 'Erkek', kosul: null },
      { kod: 'mandaDisi', etiket: 'Dişi', kosul: null },
    ],
  },
  {
    grup: 'kucukbas',
    baslik: 'Küçükbaş',
    not: 'ırktan bağımsız',
    kategoriler: [
      { kod: 'koyun', etiket: 'Koyun', kosul: '12 ay üzeri' },
      { kod: 'kec', etiket: 'Keçi', kosul: '12 ay üzeri' },
      { kod: 'kuzu', etiket: 'Kuzu', kosul: 'koyun yavrusu, 12 ay ve altı' },
      { kod: 'oglak', etiket: 'Oğlak', kosul: 'keçi yavrusu, 12 ay ve altı' },
    ],
  },
  {
    grup: 'tekTirnakli',
    baslik: 'Tek Tırnaklı',
    not: 'yaş/cinsiyetten bağımsız',
    kategoriler: [
      { kod: 'at', etiket: 'At', kosul: null },
      { kod: 'katir', etiket: 'Katır', kosul: null },
      { kod: 'esek', etiket: 'Eşek', kosul: null },
    ],
  },
];

function kriterParagraflariOlustur() {
  return KRITER_ACIKLAMALARI.map((g) => {
    const kategoriMetni = g.kategoriler
      .map((k) => {
        const katsayi = katsayiBul(g.grup, k.kod);
        const kosulMetni = k.kosul ? ` (${k.kosul})` : '';
        return `${k.etiket}${kosulMetni}: ${katsayi}`;
      })
      .join('  ·  ');
    const notMetni = g.not ? ` — ${g.not}` : '';
    return `${g.baslik}${notMetni}: ${kategoriMetni}`;
  });
}
const SABIT_ONCESI = 2; // A, B
// ONEMLI: her alt sutuna kendi grupKodu'nu da tasiyoruz - yoksa orn.
// "inek" kategori kodu Kultur/Melez/Yerli uc grupta da var, grupKodu
// olmadan filtrelersek uc sutuna da AYNI deger yazilir (hatali karisma).
const TUM_ALTLAR = SUTUN_HARITASI.flatMap((g) =>
  g.altlar.map((alt) => ({ ...alt, grupKodu: g.grup }))
);
const TOPLAM_SUTUN_INDEX = SABIT_ONCESI + TUM_ALTLAR.length + 1; // 1-indexli

function hucreStil(hucre, { fill, bold = false, renkBeyaz = false, align = 'center' } = {}) {
  hucre.font = {
    name: YAZI_TIPI,
    size: YAZI_BOYUTU,
    bold,
    color: { argb: renkBeyaz ? 'FFFFFFFF' : 'FF1C1E1B' },
  };
  if (fill) {
    hucre.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  }
  hucre.alignment = { vertical: 'middle', horizontal: align, wrapText: true };
}

/** İşletmecinin kayitlarindan (grupKodu,kategoriKodu,adet) sutun sirasina gore adet dizisi cikarir */
function isletmeciSatiriDizisi(kayitlar) {
  return TUM_ALTLAR.map((alt) => {
    const toplam = kayitlar
      .filter((k) => k.grupKodu === alt.grupKodu && alt.kodlar.includes(k.kategoriKodu))
      .reduce((t, k) => t + k.adet, 0);
    return toplam || '';
  });
}

function bolumYaz(sheet, bolum, satirNoRef) {
  const baslikMetni = (
    `${bolum.baslik.il} İli ${bolum.baslik.ilce} İlçesi` +
    (bolum.baslik.mahalle ? ` ${bolum.baslik.mahalle} Köyü/Mahallesi` : '')
  ).toLocaleUpperCase('tr-TR');

  // Baslik satirlari
  const r1 = sheet.addRow([baslikMetni]);
  sheet.mergeCells(`A${r1.number}:${sheet.getColumn(TOPLAM_SUTUN_INDEX).letter}${r1.number}`);
  hucreStil(r1.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'left' });

  const r2 = sheet.addRow(['BÜYÜK BAŞ HAYVAN BİRİMİ (BBHB) RAPORU']);
  sheet.mergeCells(`A${r2.number}:${sheet.getColumn(TOPLAM_SUTUN_INDEX).letter}${r2.number}`);
  hucreStil(r2.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'left' });

  const tarihMetni = `Tarih: ${new Date().toLocaleDateString('tr-TR')}`;
  const r3 = sheet.addRow([tarihMetni]);
  hucreStil(r3.getCell(1), {});

  // Baslik satiri 1 (grup adlari, birlesik)
  const grupBaslikRow = sheet.addRow([]);
  const altBaslikRow = sheet.addRow([]);

  hucreStil(grupBaslikRow.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true });
  grupBaslikRow.getCell(1).value = 'Sıra\nNo';
  hucreStil(grupBaslikRow.getCell(2), { fill: RENK.koyu, bold: true, renkBeyaz: true });
  grupBaslikRow.getCell(2).value = 'İkamet Eden Aile Temsilcisinin\nAdı Soyadı (Aile)';
  sheet.mergeCells(`A${grupBaslikRow.number}:A${altBaslikRow.number}`);
  sheet.mergeCells(`B${grupBaslikRow.number}:B${altBaslikRow.number}`);

  let sutunIndex = SABIT_ONCESI + 1;
  for (const grup of SUTUN_HARITASI) {
    const baslaIndex = sutunIndex;
    const bitisIndex = sutunIndex + grup.altlar.length - 1;
    const hucre = grupBaslikRow.getCell(baslaIndex);
    hucre.value = grup.baslik;
    hucreStil(hucre, { fill: RENK.orta, bold: true, renkBeyaz: true });
    if (bitisIndex > baslaIndex) {
      sheet.mergeCells(
        `${sheet.getColumn(baslaIndex).letter}${grupBaslikRow.number}:${sheet.getColumn(bitisIndex).letter}${grupBaslikRow.number}`
      );
    }
    for (const alt of grup.altlar) {
      const altHucre = altBaslikRow.getCell(sutunIndex);
      altHucre.value = alt.etiket;
      hucreStil(altHucre, { fill: RENK.orta, bold: true, renkBeyaz: true });
      sutunIndex += 1;
    }
  }

  const toplamBaslikHucre = grupBaslikRow.getCell(TOPLAM_SUTUN_INDEX);
  toplamBaslikHucre.value = 'Toplam\nBBHB';
  hucreStil(toplamBaslikHucre, { fill: RENK.orta, bold: true, renkBeyaz: true });
  sheet.mergeCells(
    `${sheet.getColumn(TOPLAM_SUTUN_INDEX).letter}${grupBaslikRow.number}:${sheet.getColumn(TOPLAM_SUTUN_INDEX).letter}${altBaslikRow.number}`
  );

  // Katsayi satiri
  const katsayiRow = sheet.addRow([]);
  hucreStil(katsayiRow.getCell(1), { fill: RENK.katsayi, bold: true });
  hucreStil(katsayiRow.getCell(2), { fill: RENK.katsayi, bold: true });
  let ki = SABIT_ONCESI + 1;
  for (const alt of TUM_ALTLAR) {
    // Katsayi SABIT bir kanun tablosudur - o gun yuklenen veride o kategori
    // olmasa bile satir her zaman dolu gosterilir (dana/duve gibi birlesik
    // sutunlarda katsayilar zaten esit oldugu icin ilk kod yeterli).
    const hucre = katsayiRow.getCell(ki);
    hucre.value = katsayiBul(alt.grupKodu, alt.kodlar[0]);
    hucreStil(hucre, { fill: RENK.katsayi, bold: true });
    ki += 1;
  }
  hucreStil(katsayiRow.getCell(TOPLAM_SUTUN_INDEX), { fill: RENK.katsayi, bold: true });

  // Isletmeci satirlari
  const sutunToplamlari = new Array(TUM_ALTLAR.length).fill(0);
  let siraNo = 1;
  for (const isletmeci of bolum.isletmeciler) {
    const row = sheet.addRow([
      siraNo,
      isletmeci.isletmeciAdi,
      ...isletmeciSatiriDizisi(isletmeci.kayitlar),
      isletmeci.isletmeciToplami,
    ]);
    const zeminRenk = siraNo % 2 === 0 ? RENK.seritKoyu : RENK.seritAcik;
    row.eachCell({ includeEmpty: true }, (hucre, sutunNo) => {
      hucreStil(hucre, {
        fill: zeminRenk,
        bold: sutunNo === TOPLAM_SUTUN_INDEX,
        align: sutunNo === 2 ? 'left' : 'center',
      });
    });

    isletmeciSatiriDizisi(isletmeci.kayitlar).forEach((deger, idx) => {
      if (typeof deger === 'number') sutunToplamlari[idx] += deger;
    });

    siraNo += 1;
  }

  // TOPLAM satiri
  const toplamRow = sheet.addRow([
    'TOPLAM',
    '',
    ...sutunToplamlari.map((t) => t || ''),
    bolum.bolumToplami,
  ]);
  toplamRow.eachCell({ includeEmpty: true }, (hucre) => {
    hucreStil(hucre, { fill: RENK.toplam, bold: true });
  });
  sheet.mergeCells(`A${toplamRow.number}:B${toplamRow.number}`);

  sheet.addRow([]);

  // OZET BILGILER (sadece elimizde formulu olan metrikler)
  const toplamHayvan = bolum.isletmeciler
    .flatMap((is) => is.kayitlar)
    .reduce((t, k) => t + k.adet, 0);

  const ozetBaslikRow = sheet.addRow(['ÖZET BİLGİLER']);
  sheet.mergeCells(`A${ozetBaslikRow.number}:${sheet.getColumn(TOPLAM_SUTUN_INDEX).letter}${ozetBaslikRow.number}`);
  hucreStil(ozetBaslikRow.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'left' });

  const ozetSatirlari = [
    ['Toplam Hayvan Sayısı', `${toplamHayvan} baş`],
    ['Toplam BBHB', bolum.bolumToplami],
    ['İşletmeci Sayısı', bolum.isletmeciler.length],
  ];
  for (const [etiket, deger] of ozetSatirlari) {
    const row = sheet.addRow([etiket]);
    hucreStil(row.getCell(1), { fill: RENK.ozetEtiket, bold: true, align: 'left' });
    sheet.mergeCells(`A${row.number}:E${row.number}`);
    const degerHucre = row.getCell(6);
    degerHucre.value = deger;
    hucreStil(degerHucre, { align: 'left' });
  }

  sheet.addRow([]);
  sheet.addRow([]);
}

async function contractToExcel(contract) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(contract.modulAdi);

  // Standart sutunlar 3.75, Isletmeci Adi (B) 8x = 30
  sheet.columns = new Array(TOPLAM_SUTUN_INDEX).fill(null).map(() => ({ width: 3.75 }));
  sheet.getColumn(2).width = 30;

  for (const bolum of contract.bolumler) {
    bolumYaz(sheet, bolum);
  }

  // GENEL OZET (birden fazla bolum varsa anlamli)
  if (contract.bolumler.length > 1) {
    const genelOzetRow = sheet.addRow(['GENEL ÖZET (Tüm Bölümler)']);
    sheet.mergeCells(`A${genelOzetRow.number}:${sheet.getColumn(TOPLAM_SUTUN_INDEX).letter}${genelOzetRow.number}`);
    hucreStil(genelOzetRow.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'left' });

    const row = sheet.addRow(['Genel Toplam BBHB']);
    hucreStil(row.getCell(1), { fill: RENK.ozetEtiket, bold: true, align: 'left' });
    sheet.mergeCells(`A${row.number}:E${row.number}`);
    const degerHucre = row.getCell(6);
    degerHucre.value = contract.genelToplam;
    hucreStil(degerHucre, { align: 'left' });

    sheet.addRow([]);
  }

  // Siniflandirma kriterleri (rapor sonunda, TEK sefer)
  // Siniflandirma kriterleri (rapor sonunda, TEK sefer) - yas/cinsiyet/irk
  // bilgisiyle birlikte PARAGRAF seklinde, hucreler birlestirilerek yazilir.
  const kriterBaslikRow = sheet.addRow([lang.ortak.siniflandirmaKriterleri]);
  sheet.mergeCells(`A${kriterBaslikRow.number}:${sheet.getColumn(TOPLAM_SUTUN_INDEX).letter}${kriterBaslikRow.number}`);
  hucreStil(kriterBaslikRow.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'left' });

  for (const paragraf of kriterParagraflariOlustur()) {
    const row = sheet.addRow([paragraf]);
    sheet.mergeCells(`A${row.number}:${sheet.getColumn(TOPLAM_SUTUN_INDEX).letter}${row.number}`);
    hucreStil(row.getCell(1), { align: 'left' });
    row.height = 24; // paragraf metni icin standarttan daha yuksek satir
  }

  // Tum satirlara sabit satir yuksekligi uygula - paragraf satirlarinin
  // (yukarida ayrica 24 verilmis) OZEL yuksekligini EZMEZ.
  sheet.eachRow((row) => {
    if (!row.height) row.height = SATIR_YUKSEKLIGI;
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = { contractToExcel };
