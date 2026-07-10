/**
 * cks.word.exporter.js
 *
 * Ek-4/a formu - Excel ile ayni yapida, docx tablosu olarak.
 */

const {
  Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
  WidthType, ShadingType, AlignmentType, convertMillimetersToTwip,
  Footer, PageNumber, BorderStyle,
} = require('docx');

const RENK = { koyu: '3F3F3C', orta: '6E6E68', imzaFiligran: 'CCCCCC' };
const CERCEVESIZ = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function hucre(metin, { kalin = false, renk, beyazYazi = false, align = AlignmentType.CENTER, span = 1, renkYazi } = {}) {
  return new TableCell({
    columnSpan: span > 1 ? span : undefined,
    shading: renk ? { type: ShadingType.SOLID, color: renk, fill: renk } : undefined,
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text: String(metin), bold: kalin, color: renkYazi || (beyazYazi ? 'FFFFFF' : undefined), font: 'Times New Roman', size: 18 })] })],
  });
}

function imzaBlokuTablosu(baslikMetni, imzacilarGirdi) {
  const imzacilar = imzacilarGirdi && imzacilarGirdi.length > 0 ? imzacilarGirdi : [{ adSoyad: '', unvan: '' }];
  const align = imzacilar.length === 1 ? AlignmentType.LEFT : AlignmentType.CENTER;

  const cocuklar = [
    new Paragraph({
      shading: { type: ShadingType.SOLID, color: RENK.orta, fill: RENK.orta },
      children: [new TextRun({ text: baslikMetni, bold: true, color: 'FFFFFF', font: 'Times New Roman', size: 20 })],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: CERCEVESIZ.top, bottom: CERCEVESIZ.bottom, left: CERCEVESIZ.left, right: CERCEVESIZ.right, insideHorizontal: CERCEVESIZ.top, insideVertical: CERCEVESIZ.left },
      rows: [
        new TableRow({ children: imzacilar.map(() => hucre('İMZA', { align, renkYazi: RENK.imzaFiligran, kalin: true })) }),
        new TableRow({ children: imzacilar.map((i) => hucre(i.adSoyad || '', { align, kalin: true })) }),
        new TableRow({ children: imzacilar.map((i) => hucre(i.unvan || '', { align })) }),
      ],
    }),
  ];
  return cocuklar;
}

async function contractToCksWord(cks) {
  const cocuklar = [];

  cocuklar.push(new Paragraph({ children: [new TextRun({ text: '( Ek-4/a )', font: 'Times New Roman', size: 18 })] }));
  cocuklar.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: RENK.koyu, fill: RENK.koyu },
      children: [new TextRun({ text: 'TESPİT VE TAHDİT ÇALIŞMALARINA ESAS OLAN', bold: true, color: 'FFFFFF', font: 'Times New Roman', size: 24 })],
    })
  );
  cocuklar.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: RENK.koyu, fill: RENK.koyu },
      children: [new TextRun({ text: 'ÇİFTÇİ AİLE VE GEÇİM KAYNAĞI BİLDİRİM CETVELİ', bold: true, color: 'FFFFFF', font: 'Times New Roman', size: 24 })],
    })
  );
  cocuklar.push(new Paragraph({ text: '' }));

  [['İli', cks.il], ['İlçesi', cks.ilce], ['Köyü/Mahalle', cks.koyMahalle], ...(cks.uretimYili ? [['Üretim Yılı', String(cks.uretimYili)]] : [])].forEach(([etiket, deger]) => {
    cocuklar.push(new Paragraph({ children: [new TextRun({ text: `${etiket}: `, bold: true, font: 'Times New Roman', size: 20 }), new TextRun({ text: deger, font: 'Times New Roman', size: 20 })] }));
  });
  cocuklar.push(new Paragraph({ text: '' }));

  const grupBaslikSatiri = [
    hucre('Sıra No', { kalin: true, renk: RENK.koyu, beyazYazi: true }),
    hucre('İkamet Eden Aile Temsilcisinin Adı Soyadı (Aile)', { kalin: true, renk: RENK.koyu, beyazYazi: true }),
    hucre('Ekilişi (da) ve Hayvan Varlığı (BBHB)', { kalin: true, renk: RENK.orta, beyazYazi: true, span: 4 }),
    hucre('Geçim Kaynağı', { kalin: true, renk: RENK.orta, beyazYazi: true, span: 2 }),
  ];
  const altBaslikSatiri = [
    hucre('', { renk: RENK.koyu }), hucre('', { renk: RENK.koyu }),
    ...['Hayvan Varlığı', 'Yem Bitkisi', 'Sebze/Meyve', 'Hububat/Yağlı Tohumlar'].map((b) => hucre(b, { kalin: true, renk: RENK.orta, beyazYazi: true })),
    ...['Tarım', 'Hayvancılık'].map((b) => hucre(b, { kalin: true, renk: RENK.orta, beyazYazi: true })),
  ];

  const veriSatirlari = cks.ciftciler.map((c, i) => {
    const zemin = i % 2 === 0 ? undefined : 'F4F4F2';
    return [
      hucre(i + 1, { renk: zemin }),
      hucre(c.isletmeciAdi, { renk: zemin, align: AlignmentType.LEFT }),
      hucre('', { renk: zemin }),
      hucre(c.yemBitkisi || '', { renk: zemin }),
      hucre(c.sebzeMeyve || '', { renk: zemin }),
      hucre(c.hububatYagli || '', { renk: zemin }),
      hucre(c.tarim ? 'X' : '', { renk: zemin }),
      hucre('', { renk: zemin }),
    ];
  });

  cocuklar.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: grupBaslikSatiri }),
        new TableRow({ children: altBaslikSatiri }),
        ...veriSatirlari.map((s) => new TableRow({ children: s })),
      ],
    })
  );
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(new Paragraph({ children: [new TextRun({ text: 'Not:  1. Teknik Ekip Üyelerince İmzalanacaktır.', font: 'Times New Roman', size: 18 })] }));
  cocuklar.push(new Paragraph({ children: [new TextRun({ text: '        2. Muhtar ve İhtiyar Heyetince İmzalanarak Mühürlenecektir.', font: 'Times New Roman', size: 18 })] }));
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(...imzaBlokuTablosu('TEKNİK EKİP ÜYELERİ', cks.teknikEkipImzacilari));
  cocuklar.push(new Paragraph({ text: '' }));
  cocuklar.push(...imzaBlokuTablosu('MUHTAR VE İHTİYAR HEYETİ', cks.muhtarHeyetiImzacilari));

  const bilgiMetni = `${cks.il} ${cks.ilce} ${cks.koyMahalle}`;
  const footer = new Footer({
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: bilgiMetni, size: 14, font: 'Times New Roman' })] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ children: [PageNumber.CURRENT], size: 14, font: 'Times New Roman' }),
          new TextRun({ text: '/', size: 14, font: 'Times New Roman' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, font: 'Times New Roman' }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: 'landscape' },
            margin: {
              top: convertMillimetersToTwip(10), bottom: convertMillimetersToTwip(10),
              left: convertMillimetersToTwip(10), right: convertMillimetersToTwip(10),
            },
          },
        },
        footers: { default: footer },
        children: cocuklar,
      },
    ],
  });
  return Packer.toBuffer(doc);
}

module.exports = { contractToCksWord };
