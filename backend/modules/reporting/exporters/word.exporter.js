/**
 * word.exporter.js
 *
 * Excel exporter ile AYNI resmi sablon mantigini (genis tablo, gruplu
 * baslik, katsayi satiri, TOPLAM satiri) docx tablosu olarak uretir.
 */

const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  ShadingType,
} = require('docx');
const lang = require('../../../../config/lang/tr');
const { katsayiBul } = require('../../bbhb/bbhb.rules');

const RENK = {
  koyu: '3F3F3C',
  orta: '6E6E68',
  katsayi: 'EDEBE4',
  seritKoyu: 'F4F4F2',
  toplam: 'DCDCD7',
};

const SUTUN_HARITASI = [
  { grup: 'kulturIrki', baslik: 'Kültür Irkı', altlar: [{ etiket: 'İnek', kodlar: ['inek'] }, { etiket: 'Dana-Düve', kodlar: ['dana', 'duve'] }] },
  { grup: 'kulturMelezi', baslik: 'Kültür Melezi', altlar: [{ etiket: 'İnek', kodlar: ['inek'] }, { etiket: 'Dana-Düve', kodlar: ['dana', 'duve'] }] },
  { grup: 'yerliIrk', baslik: 'Yerli Irk', altlar: [{ etiket: 'İnek', kodlar: ['inek'] }, { etiket: 'Dana-Düve', kodlar: ['dana', 'duve'] }] },
  { grup: 'buyukbasErkek', baslik: 'Büyükbaş Diğer', altlar: [{ etiket: 'Boğa', kodlar: ['boga'] }, { etiket: 'Öküz', kodlar: ['okuz'] }] },
  { grup: 'manda', baslik: 'Manda', altlar: [{ etiket: 'Erkek', kodlar: ['mandaErkek'] }, { etiket: 'Dişi', kodlar: ['mandaDisi'] }] },
  { grup: 'kucukbas', baslik: 'Küçükbaş', altlar: [{ etiket: 'Koyun', kodlar: ['koyun'] }, { etiket: 'Keçi', kodlar: ['kec'] }, { etiket: 'Kuzu/Oğlak', kodlar: ['kuzu', 'oglak'] }] },
  { grup: 'tekTirnakli', baslik: 'Tek Tırnaklı', altlar: [{ etiket: 'At', kodlar: ['at'] }, { etiket: 'Katır', kodlar: ['katir'] }, { etiket: 'Eşek', kodlar: ['esek'] }] },
];
const TUM_ALTLAR = SUTUN_HARITASI.flatMap((g) => g.altlar.map((a) => ({ ...a, grupKodu: g.grup })));

function hucre(metin, { kalin = false, renk, beyazYazi = false } = {}) {
  return new TableCell({
    shading: renk ? { type: ShadingType.SOLID, color: renk, fill: renk } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(metin), bold: kalin, color: beyazYazi ? 'FFFFFF' : undefined, size: 16, font: 'Times New Roman' })],
      }),
    ],
  });
}

function isletmeciSatiriDizisi(kayitlar) {
  return TUM_ALTLAR.map((alt) => {
    const toplam = kayitlar
      .filter((k) => k.grupKodu === alt.grupKodu && alt.kodlar.includes(k.kategoriKodu))
      .reduce((t, k) => t + k.adet, 0);
    return toplam || '';
  });
}

function bolumTablosu(bolum) {
  const grupBaslikSatiri = [hucre('Sıra No', { kalin: true, renk: RENK.koyu, beyazYazi: true }), hucre('İşletmeci', { kalin: true, renk: RENK.koyu, beyazYazi: true })];
  const altBaslikSatiri = [hucre('', { renk: RENK.koyu }), hucre('', { renk: RENK.koyu })];

  for (const grup of SUTUN_HARITASI) {
    grupBaslikSatiri.push(hucre(grup.baslik, { kalin: true, renk: RENK.orta, beyazYazi: true }));
    for (let i = 1; i < grup.altlar.length; i++) grupBaslikSatiri.push(hucre('', { renk: RENK.orta }));
    for (const alt of grup.altlar) altBaslikSatiri.push(hucre(alt.etiket, { kalin: true, renk: RENK.orta, beyazYazi: true }));
  }
  grupBaslikSatiri.push(hucre('Toplam BBHB', { kalin: true, renk: RENK.orta, beyazYazi: true }));
  altBaslikSatiri.push(hucre('', { renk: RENK.orta }));

  const katsayiSatiri = [hucre('', { renk: RENK.katsayi }), hucre('', { renk: RENK.katsayi })];
  for (const alt of TUM_ALTLAR) {
    katsayiSatiri.push(hucre(katsayiBul(alt.grupKodu, alt.kodlar[0]), { kalin: true, renk: RENK.katsayi }));
  }
  katsayiSatiri.push(hucre('', { renk: RENK.katsayi }));

  const veriSatirlari = bolum.isletmeciler.map((is, idx) => {
    const zemin = idx % 2 === 0 ? undefined : RENK.seritKoyu;
    return [
      hucre(idx + 1, { renk: zemin }),
      hucre(is.isletmeciAdi, { renk: zemin }),
      ...isletmeciSatiriDizisi(is.kayitlar).map((d) => hucre(d, { renk: zemin })),
      hucre(is.isletmeciToplami, { kalin: true, renk: zemin }),
    ];
  });

  const toplamSatiri = [hucre('TOPLAM', { kalin: true, renk: RENK.toplam }), hucre('', { renk: RENK.toplam })];
  const sutunToplamlari = new Array(TUM_ALTLAR.length).fill(0);
  for (const is of bolum.isletmeciler) {
    isletmeciSatiriDizisi(is.kayitlar).forEach((d, i) => { if (typeof d === 'number') sutunToplamlari[i] += d; });
  }
  sutunToplamlari.forEach((t) => toplamSatiri.push(hucre(t || '', { kalin: true, renk: RENK.toplam })));
  toplamSatiri.push(hucre(bolum.bolumToplami, { kalin: true, renk: RENK.toplam }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: grupBaslikSatiri }),
      new TableRow({ children: altBaslikSatiri }),
      new TableRow({ children: katsayiSatiri }),
      ...veriSatirlari.map((s) => new TableRow({ children: s })),
      new TableRow({ children: toplamSatiri }),
    ],
  });
}

async function contractToWord(contract) {
  const bolumler = [
    new Paragraph({ text: `${contract.modulAdi} Raporu`, heading: HeadingLevel.HEADING_1 }),
  ];

  for (const bolum of contract.bolumler) {
    const baslikMetni =
      `${bolum.baslik.il} İli ${bolum.baslik.ilce} İlçesi` +
      (bolum.baslik.mahalle ? ` ${bolum.baslik.mahalle} Köyü/Mahallesi` : '');

    bolumler.push(new Paragraph({ text: baslikMetni, heading: HeadingLevel.HEADING_2 }));
    bolumler.push(bolumTablosu(bolum));
    bolumler.push(
      new Paragraph({
        children: [new TextRun({ text: `Bölüm Toplamı: ${bolum.bolumToplami} BBHB`, bold: true })],
      })
    );
    bolumler.push(new Paragraph({ text: '' }));
  }

  bolumler.push(
    new Paragraph({
      children: [new TextRun({ text: `${lang.ortak.genelToplam}: ${contract.genelToplam}`, bold: true, size: 28 })],
    })
  );

  bolumler.push(new Paragraph({ text: lang.ortak.siniflandirmaKriterleri, heading: HeadingLevel.HEADING_2 }));
  bolumler.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hucre(lang.ortak.grup, { kalin: true }), hucre(lang.ortak.cins, { kalin: true }), hucre(lang.ortak.katsayi, { kalin: true })] }),
        ...contract.siniflandirmaKriterleri.map(
          (k) => new TableRow({ children: [hucre(k.grup), hucre(k.kategori), hucre(k.katsayi)] })
        ),
      ],
    })
  );

  const doc = new Document({ sections: [{ children: bolumler }] });
  return Packer.toBuffer(doc);
}

module.exports = { contractToWord };
