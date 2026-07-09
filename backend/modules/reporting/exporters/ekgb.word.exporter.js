/**
 * ekgb.word.exporter.js
 *
 * EKGB raporu - Excel ile ayni icerik, 2 sayfa (page break ile ayrilir).
 */

const {
  Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
  HeadingLevel, WidthType, ShadingType, AlignmentType, PageBreak,
  convertMillimetersToTwip,
} = require('docx');

const RENK = { koyu: '3F3F3C', orta: '6E6E68', seritKoyu: 'F4F4F2', toplam: 'DCDCD7' };

function hucre(metin, { kalin = false, renk, beyazYazi = false, align = AlignmentType.LEFT } = {}) {
  return new TableCell({
    shading: renk ? { type: ShadingType.SOLID, color: renk, fill: renk } : undefined,
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text: String(metin), bold: kalin, color: beyazYazi ? 'FFFFFF' : undefined, font: 'Times New Roman', size: 18 })] })],
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

function toplamParagrafi(etiket, deger, buyuk = false) {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: `${etiket}: ${deger.toLocaleString('tr-TR')} TL`, bold: true, size: buyuk ? 28 : 20, font: 'Times New Roman' })],
  });
}

async function contractToEkgbWord(ekgb) {
  const cocuklar = [];

  cocuklar.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '4342 SAYILI MERA KANUNU KAPSAMINDA', bold: true, size: 24, font: 'Times New Roman' })] }));
  cocuklar.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${ekgb.il.toLocaleUpperCase('tr-TR')} İLİ ESKİ KONUMUNA GETİRME BEDELİ`, bold: true, size: 24, font: 'Times New Roman' })] }));
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(new Paragraph({ text: 'Mütecaviz Bilgisi', heading: HeadingLevel.HEADING_2 }));
  cocuklar.push(bilgiSatiri('Adı Soyadı / Tüzel Kişilik Adı', ekgb.mutecavizAdSoyad));
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
  cocuklar.push(kalemTablosu(ekgb.tohum.detaylar.map((t) => ({ ad: t.kod, aciklama: `${(t.oran * 100).toFixed(0)}%`, birimFiyat: t.birimFiyat, maliyet: t.maliyet })), ['Bitki', 'Oran', 'Birim Fiyat', 'Toplam Maliyet']));
  cocuklar.push(toplamParagrafi('Tohum Toplam', ekgb.tohum.toplam));
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(new Paragraph({ text: 'Gübreleme Maliyetleri', heading: HeadingLevel.HEADING_2 }));
  cocuklar.push(kalemTablosu(ekgb.gubreleme.detaylar.map((g) => ({ ad: g.kod, aciklama: `${g.miktarKgDa} kg/da × ${g.yilCarpani} yıl`, birimFiyat: g.birimFiyat, maliyet: g.maliyet })), ['Gübre', 'Açıklama', 'Birim Fiyat', 'Toplam Maliyet']));
  cocuklar.push(toplamParagrafi('Gübreleme Toplam', ekgb.gubreleme.toplam));
  cocuklar.push(new Paragraph({ text: '' }));

  cocuklar.push(toplamParagrafi('GENEL TOPLAM', ekgb.genelToplam, true));
  cocuklar.push(new Paragraph({ text: '' }));
  cocuklar.push(new Paragraph({ text: '' }));

  // İmza bloğu - sayfa sonunda, kisi sayisi kadar sutun
  cocuklar.push(new Paragraph({ text: 'Hazırlayanlar', heading: HeadingLevel.HEADING_2 }));
  const imzacilar = ekgb.imzacilar && ekgb.imzacilar.length > 0 ? ekgb.imzacilar : [{ adSoyad: '', unvan: '' }];
  cocuklar.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: imzacilar.map(() => hucre('İmzası:', { align: AlignmentType.CENTER })) }),
        new TableRow({ children: imzacilar.map((i) => hucre(i.adSoyad || '', { kalin: true, align: AlignmentType.CENTER })) }),
        new TableRow({ children: imzacilar.map((i) => hucre(i.unvan || '', { align: AlignmentType.CENTER })) }),
      ],
    })
  );

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
        children: cocuklar,
      },
    ],
  });
  return Packer.toBuffer(doc);
}

module.exports = { contractToEkgbWord };
