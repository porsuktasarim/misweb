/**
 * word.exporter.js
 *
 * Excel exporter ile AYNI sablonu (bkz. sablonlar/bbhb-tablo-semasi.js)
 * kullanir. Sayfa yatay, kenar bosluklari 1cm, basliklar ortali,
 * Isletmeci Adi hucresi 8 sutunluk gridSpan ile olusturulur.
 */

const {
  Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
  HeadingLevel, WidthType, ShadingType, AlignmentType, PageOrientation,
  convertMillimetersToTwip,
} = require('docx');
const lang = require('../../../../config/lang/tr');
const { katsayiBul } = require('../../bbhb/bbhb.rules');
const {
  SUTUN_HARITASI,
  TUM_ALTLAR,
  ISLETMECI_ADI_SUTUN_SAYISI,
  isletmeciSatiriDizisi,
  kriterParagraflariOlustur,
  bolumBasligiMetni,
} = require('../sablonlar/bbhb-tablo-semasi');

const RENK = { koyu: '3F3F3C', orta: '6E6E68', katsayi: 'EDEBE4', seritKoyu: 'F4F4F2', toplam: 'DCDCD7' };
const BIRIM_GENISLIK = 400; // twip - 3.75 excel biriminin gorsel karsiligi (orantisal)
const TOPLAM_SUTUN_SAYISI = 1 + ISLETMECI_ADI_SUTUN_SAYISI + TUM_ALTLAR.length + 1; // 26
const SUTUN_GENISLIKLERI = new Array(TOPLAM_SUTUN_SAYISI).fill(BIRIM_GENISLIK);

function hucre(metin, { kalin = false, renk, beyazYazi = false, span = 1, align = AlignmentType.CENTER } = {}) {
  return new TableCell({
    columnSpan: span > 1 ? span : undefined,
    shading: renk ? { type: ShadingType.SOLID, color: renk, fill: renk } : undefined,
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text: String(metin), bold: kalin, color: beyazYazi ? 'FFFFFF' : undefined, size: 16, font: 'Times New Roman' })],
      }),
    ],
  });
}

function bolumTablosu(bolum) {
  const grupBaslikSatiri = [
    hucre('Sıra No', { kalin: true, renk: RENK.koyu, beyazYazi: true }),
    hucre('İkamet Eden Aile Temsilcisinin Adı Soyadı (Aile)', { kalin: true, renk: RENK.koyu, beyazYazi: true, span: ISLETMECI_ADI_SUTUN_SAYISI }),
  ];
  const altBaslikSatiri = [hucre('', { renk: RENK.koyu }), hucre('', { renk: RENK.koyu, span: ISLETMECI_ADI_SUTUN_SAYISI })];

  for (const grup of SUTUN_HARITASI) {
    grupBaslikSatiri.push(hucre(grup.baslik, { kalin: true, renk: RENK.orta, beyazYazi: true, span: grup.altlar.length }));
    for (const alt of grup.altlar) altBaslikSatiri.push(hucre(alt.etiket, { kalin: true, renk: RENK.orta, beyazYazi: true }));
  }
  grupBaslikSatiri.push(hucre('Toplam BBHB', { kalin: true, renk: RENK.orta, beyazYazi: true }));
  altBaslikSatiri.push(hucre('', { renk: RENK.orta }));

  const katsayiSatiri = [hucre('', { renk: RENK.katsayi }), hucre('', { renk: RENK.katsayi, span: ISLETMECI_ADI_SUTUN_SAYISI })];
  for (const alt of TUM_ALTLAR) katsayiSatiri.push(hucre(katsayiBul(alt.grupKodu, alt.kodlar[0]), { kalin: true, renk: RENK.katsayi }));
  katsayiSatiri.push(hucre('', { renk: RENK.katsayi }));

  const veriSatirlari = bolum.isletmeciler.map((is, idx) => {
    const zemin = idx % 2 === 0 ? undefined : RENK.seritKoyu;
    return [
      hucre(idx + 1, { renk: zemin }),
      hucre(is.isletmeciAdi, { renk: zemin, span: ISLETMECI_ADI_SUTUN_SAYISI, align: AlignmentType.LEFT }),
      ...isletmeciSatiriDizisi(is.kayitlar).map((d) => hucre(d, { renk: zemin })),
      hucre(is.isletmeciToplami, { kalin: true, renk: zemin }),
    ];
  });

  const toplamSatiri = [hucre('TOPLAM', { kalin: true, renk: RENK.toplam, span: 1 + ISLETMECI_ADI_SUTUN_SAYISI })];
  const sutunToplamlari = new Array(TUM_ALTLAR.length).fill(0);
  for (const is of bolum.isletmeciler) {
    isletmeciSatiriDizisi(is.kayitlar).forEach((d, i) => { if (typeof d === 'number') sutunToplamlari[i] += d; });
  }
  sutunToplamlari.forEach((t) => toplamSatiri.push(hucre(t || '', { kalin: true, renk: RENK.toplam })));
  toplamSatiri.push(hucre(bolum.bolumToplami, { kalin: true, renk: RENK.toplam }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: SUTUN_GENISLIKLERI,
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
  const bolumler = [];

  for (const bolum of contract.bolumler) {
    bolumler.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: bolumBasligiMetni(bolum.baslik), bold: true, size: 24, font: 'Times New Roman' })],
      })
    );
    bolumler.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'BÜYÜK BAŞ HAYVAN BİRİMİ (BBHB) RAPORU', bold: true, size: 24, font: 'Times New Roman' })],
      })
    );
    bolumler.push(new Paragraph({ text: '' }));
    bolumler.push(
      new Paragraph({
        children: [new TextRun({ text: `Hesaplama Tarihi: ${new Date(contract.hesaplamaTarihi).toLocaleDateString('tr-TR')}`, font: 'Times New Roman', size: 16 })],
      })
    );
    bolumler.push(bolumTablosu(bolum));
    bolumler.push(
      new Paragraph({
        children: [new TextRun({ text: `Bölüm Toplamı: ${bolum.bolumToplami} BBHB`, bold: true, font: 'Times New Roman' })],
      })
    );
    bolumler.push(new Paragraph({ text: '' }));
  }

  bolumler.push(
    new Paragraph({
      children: [new TextRun({ text: `${lang.ortak.genelToplam}: ${contract.genelToplam}`, bold: true, size: 28, font: 'Times New Roman' })],
    })
  );

  bolumler.push(new Paragraph({ text: lang.ortak.siniflandirmaKriterleri, heading: HeadingLevel.HEADING_2 }));
  for (const paragraf of kriterParagraflariOlustur()) {
    bolumler.push(new Paragraph({ children: [new TextRun({ text: paragraf, font: 'Times New Roman', size: 16 })] }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: {
              top: convertMillimetersToTwip(10),
              bottom: convertMillimetersToTwip(10),
              left: convertMillimetersToTwip(10),
              right: convertMillimetersToTwip(10),
            },
          },
        },
        children: bolumler,
      },
    ],
  });
  return Packer.toBuffer(doc);
}

module.exports = { contractToWord };
