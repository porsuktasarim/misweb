/**
 * ekgb.word.exporter.js
 *
 * EKGB raporu - Excel ile ayni icerik/gorunum, 2 sayfa (page break).
 * Footer: ust satirda konum bilgisi, alt satirda gercek sayfa
 * numarasi (X/Y - docx'un native PageNumber alanlariyla).
 */

const {
  Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
  HeadingLevel, WidthType, ShadingType, AlignmentType, PageBreak,
  Footer, PageNumber, convertMillimetersToTwip, BorderStyle,
} = require('docx');

const RENK = { koyu: '3F3F3C', orta: '6E6E68', seritKoyu: 'F4F4F2', imzaFiligran: 'CCCCCC' };
const CERCEVESIZ = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function hucre(metin, { kalin = false, renk, beyazYazi = false, align = AlignmentType.LEFT, renkYazi } = {}) {
  return new TableCell({
    borders: CERCEVESIZ,
    shading: renk ? { type: ShadingType.SOLID, color: renk, fill: renk } : undefined,
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text: String(metin), bold: kalin, color: renkYazi || (beyazYazi ? 'FFFFFF' : undefined), font: 'Times New Roman', size: 18 })] })],
  });
}

function bilgiSatiri(etiket, deger) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [hucre(etiket, { kalin: true }), hucre(deger)] })],
  });
}

function kalemTablosu(kalemler, basliklar) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: basliklar.map((b) => hucre(b, { kalin: true, renk: RENK.seritKoyu })) }),
      ...kalemler.map((k) => new TableRow({ children: [hucre(k.ad), hucre(k.aciklama || ''), hucre(k.birimFiyat !== undefined ? k.birimFiyat : ''), hucre(k.maliyet, { align: AlignmentType.RIGHT })] })),
    ],
  });
}

function detayAciklamaOlustur(k) {
  if (k.oran !== undefined) return `${(k.oran * 100).toFixed(0)}% karışım, ${k.miktarKgDa} kg/da`;
  if (k.miktarKgDa !== undefined && k.yilCarpani !== undefined) return `${k.miktarKgDa} kg/da × ${k.yilCarpani} yıl`;
  return k.aciklama || '';
}

function toplamParagrafi(etiket, deger, buyuk = false) {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: `${etiket}: ${deger.toLocaleString('tr-TR')} TL`, bold: true, size: buyuk ? 28 : 20, font: 'Times New Roman' })],
  });
}

/** Imza blogu: cerceve YOK, tek kisi solA yasli, birden fazla kisi esit sutunlara bolunup ORTALANIR */
function imzaBlokuTablosu(imzacilarGirdi) {
  const imzacilar = imzacilarGirdi && imzacilarGirdi.length > 0 ? imzacilarGirdi : [{ adSoyad: '', unvan: '' }];
  const align = imzacilar.length === 1 ? AlignmentType.LEFT : AlignmentType.CENTER;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: CERCEVESIZ.top, bottom: CERCEVESIZ.bottom, left: CERCEVESIZ.left, right: CERCEVESIZ.right, insideHorizontal: CERCEVESIZ.top, insideVertical: CERCEVESIZ.left },
    rows: [
      new TableRow({ children: imzacilar.map(() => hucre('İMZA', { align, renkYazi: RENK.imzaFiligran, kalin: true })) }),
      new TableRow({ children: imzacilar.map((i) => hucre(i.adSoyad || '', { align, kalin: true })) }),
      new TableRow({ children: imzacilar.map((i) => hucre(i.unvan || '', { align })) }),
    ],
  });
}

async function contractToEkgbWord(ekgb) {
  const cocuklar = [];

  cocuklar.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '4342 SAYILI MERA KANUNU KAPSAMINDA', bold: true, size: 24, font: 'Times New Roman' })] }));
  cocuklar.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${ekgb.il.toLocaleUpperCase('tr-TR')} İLİ ESKİ KONUMUNA GETİRME BEDELİ`, bold: true, size: 24, font: 'Times New Roman' })] }));
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(new Paragraph({ text: 'Mütecaviz Bilgisi', heading: HeadingLevel.HEADING_2 }));
  cocuklar.push(bilgiSatiri('Adı Soyadı / Tüzel Kişilik Adı', ekgb.mutecavizAdSoyad || '-'));
  cocuklar.push(bilgiSatiri('T.C. / VKN', ekgb.mutecavizTcVkn || '-'));
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(new Paragraph({ text: 'İşgal Edilen Yerin Bilgisi', heading: HeadingLevel.HEADING_2 }));
  cocuklar.push(bilgiSatiri('İlçe', ekgb.ilce));
  cocuklar.push(bilgiSatiri('Mahalle / Köy', ekgb.mahalle));
  cocuklar.push(bilgiSatiri('Ada', ekgb.ada || '-'));
  cocuklar.push(bilgiSatiri('Parsel', ekgb.parsel || '-'));
  cocuklar.push(bilgiSatiri('Kullanılan Birim Fiyat Dönemi', ekgb.donemAdi));
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(new Paragraph({ text: 'İşçilik Maliyetleri', heading: HeadingLevel.HEADING_2 }));
  cocuklar.push(kalemTablosu(ekgb.iscilik.detaylar, ['İşlem Adı', 'Açıklama', 'Birim Fiyat', 'Toplam Maliyet']));
  cocuklar.push(toplamParagrafi('İşçilik Toplam', ekgb.iscilik.toplam));
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(new Paragraph({ text: 'Tohum Maliyetleri', heading: HeadingLevel.HEADING_2 }));
  cocuklar.push(kalemTablosu(ekgb.tohum.detaylar.map((t) => ({ ad: t.ad || t.kod, aciklama: detayAciklamaOlustur(t), birimFiyat: t.birimFiyat, maliyet: t.maliyet })), ['Bitki', 'Açıklama', 'Birim Fiyat', 'Toplam Maliyet']));
  cocuklar.push(toplamParagrafi('Tohum Toplam', ekgb.tohum.toplam));
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(new Paragraph({ text: 'Gübreleme Maliyetleri', heading: HeadingLevel.HEADING_2 }));
  cocuklar.push(kalemTablosu(ekgb.gubreleme.detaylar.map((g) => ({ ad: g.ad || g.kod, aciklama: detayAciklamaOlustur(g), birimFiyat: g.birimFiyat, maliyet: g.maliyet })), ['Gübre', 'Açıklama', 'Birim Fiyat', 'Toplam Maliyet']));
  cocuklar.push(toplamParagrafi('Gübreleme Toplam', ekgb.gubreleme.toplam));
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(toplamParagrafi('GENEL TOPLAM', ekgb.genelToplam, true));
  cocuklar.push(new Paragraph({ text: '' }));
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(new Paragraph({ text: 'Hazırlayanlar', heading: HeadingLevel.HEADING_2 }));
  cocuklar.push(imzaBlokuTablosu(ekgb.imzacilar));

  // ---- SAYFA 2: AÇIKLAMALAR ----
  cocuklar.push(new Paragraph({ children: [new PageBreak()] }));
  cocuklar.push(new Paragraph({ text: 'Açıklamalar', heading: HeadingLevel.HEADING_1 }));

  const notlar = [
    'Birim fiyatlar/parametreler için; piyasa fiyat araştırmaları, varsa güncel İl Mera Komisyonu Kararları, Belediye Hizmet Tarifesi, resmi poz değerleri vb. esas alınmaktadır.',
    'Hafriyat taşıma bedeli İBB Çevre Koruma Şube Müdürlüğü Hizmet Tarifesi esas alınarak hesaplanmıştır.',
    'İnşaat/Hafriyat ve Asfalt/Beton alanlarda toprak serme ve tohum/gübre bedeli hesabında, serilecek toprak yüksekliği 20 cm olarak alınmıştır.',
    'Gübreleme: Yanmış hayvan gübresi 1 yıl; Amonyum Sülfat ve Kompoze Gübre 2 yıl uygulanacak şekilde hesaplanmıştır.',
    '4342 sayılı Mera Kanunu kapsamında hazırlanmıştır.',
  ];
  for (const not of notlar) {
    cocuklar.push(new Paragraph({ children: [new TextRun({ text: `• ${not}`, font: 'Times New Roman', size: 18 })] }));
  }
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(new Paragraph({ text: 'Hesaplama Yöntemi Notları', heading: HeadingLevel.HEADING_2 }));
  const yontemNotlari = [
    ['Hafriyat Hacmi (m³)', 'İnşaat/Hafriyat Dökülen Alan (m²) × Toprak Derinliği (m) + Asfalt/Beton Kaplı Alan (m²) × Asfalt/Beton Kalınlığı (m)'],
    ['Toplam Islah Alanı (m²)', 'Sürülen/Tarla Olarak Kullanılan Alan (m²) + İnşaat/Hafriyat Dökülen Alan (m²) + Asfalt/Beton Kaplı Alan (m²)'],
    ['Hafriyat Taşıma İşçiliği', '(((Taşıma yapılan taşıtın kapasitesi m³ × 1.600 kg) − 20 torba toprak ağırlığı kg) / 1 torba toprak ağırlığı × İlave torba ücreti TL) × (Toplam Hafriyat Hacmi m³ / Taşıma yapılan taşıtın kapasitesi m³)'],
    ['Toprak Serme', 'Toprak bedeli + tesviye bedeli (İnşaat/Hafriyat + Asfalt/Beton alanları için)'],
  ];
  for (const [baslik, aciklama] of yontemNotlari) {
    cocuklar.push(new Paragraph({ children: [new TextRun({ text: baslik, bold: true, font: 'Times New Roman', size: 18 })] }));
    cocuklar.push(new Paragraph({ children: [new TextRun({ text: aciklama, font: 'Times New Roman', size: 18 })] }));
  }

  const bilgiMetni = `${ekgb.il} ${ekgb.ilce} ${ekgb.mahalle} — Ada: ${ekgb.ada || '-'} Parsel: ${ekgb.parsel || '-'} — ${ekgb.mutecavizAdSoyad || ''}`;

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

module.exports = { contractToEkgbWord };
