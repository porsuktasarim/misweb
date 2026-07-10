/**
 * ekgb.pdf.exporter.js
 *
 * EKGB raporu - 2 sayfa. Turkce karakter destegi icin gomulu DejaVu
 * Serif fontu kullanilir (Excel/Word'de gercek Times New Roman
 * kullanilabiliyor cunku onlar sadece font ADI yaziyor - PDF'te
 * gomme gerekiyor, Times New Roman gomulmez/Turkce desteklemez).
 *
 * - Kenar bosluklari: 1cm
 * - Footer (her sayfada): ust satir konum bilgisi, alt satir X/Y sayfa no
 * - Imza blogu: gercek %20 opaklikla "İMZA" filigrani (PDFKit opacity
 *   destekliyor - Excel/Word'de bu ancak acik gri renkle simule edilir)
 */

const PDFDocument = require('pdfkit');
const path = require('path');

const FONT_NORMAL = path.join(__dirname, '../sablonlar/fontlar/DejaVuSerif.ttf');
const FONT_KALIN = path.join(__dirname, '../sablonlar/fontlar/DejaVuSerif-Bold.ttf');
const CM = 28.3465;
const FOOTER_YUKSEKLIK = CM * 0.9; // footer, alt 1cm kenar boslugu icinde

function detayAciklamaOlustur(k) {
  if (k.oran !== undefined) return `${(k.oran * 100).toFixed(0)}% karışım, ${k.miktarKgDa} kg/da`;
  if (k.miktarKgDa !== undefined && k.yilCarpani !== undefined) return `${k.miktarKgDa} kg/da × ${k.yilCarpani} yıl`;
  return k.aciklama || '';
}

async function contractToEkgbPdf(ekgb) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: CM, bottom: CM + FOOTER_YUKSEKLIK, left: CM, right: CM },
      bufferPages: true,
    });
    const parcalar = [];
    doc.on('data', (p) => parcalar.push(p));
    doc.on('end', () => resolve(Buffer.concat(parcalar)));
    doc.on('error', reject);

    const genislik = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    function baslik(metin, boyut = 13) {
      doc.font(FONT_KALIN).fontSize(boyut).text(metin, { align: 'center' });
    }
    function altBaslik(metin) {
      doc.moveDown(0.5);
      doc.font(FONT_KALIN).fontSize(11).fillColor('#3F3F3C').text(metin);
      doc.fillColor('#1C1E1B');
    }
    function bilgiSatiri(etiket, deger) {
      doc.font(FONT_NORMAL).fontSize(9).text(`${etiket}: `, { continued: true }).font(FONT_KALIN).text(String(deger));
    }
    function kalemSatiri(k) {
      doc.font(FONT_NORMAL).fontSize(8.5).text(
        `${k.ad || k.kod}${k.aciklama ? ' — ' + k.aciklama : ''}${k.birimFiyat !== undefined ? ' | Birim: ' + k.birimFiyat : ''} | Toplam: ${k.maliyet.toLocaleString('tr-TR')} TL`
      );
    }
    function toplamSatiri(etiket, deger, buyuk = false) {
      doc.font(FONT_KALIN).fontSize(buyuk ? 13 : 10).text(`${etiket}: ${deger.toLocaleString('tr-TR')} TL`, { align: 'right' });
    }

    // ---- SAYFA 1: HESAP ----
    baslik('4342 SAYILI MERA KANUNU KAPSAMINDA');
    baslik(`${ekgb.il.toLocaleUpperCase('tr-TR')} İLİ ESKİ KONUMUNA GETİRME BEDELİ`);
    doc.moveDown();

    altBaslik('Mütecaviz Bilgisi');
    bilgiSatiri('Adı Soyadı / Tüzel Kişilik Adı', ekgb.mutecavizAdSoyad || '-');
    bilgiSatiri('T.C. / VKN', ekgb.mutecavizTcVkn || '-');

    altBaslik('İşgal Edilen Yerin Bilgisi');
    bilgiSatiri('İlçe', ekgb.ilce);
    bilgiSatiri('Mahalle / Köy', ekgb.mahalle);
    bilgiSatiri('Ada', ekgb.ada || '-');
    bilgiSatiri('Parsel', ekgb.parsel || '-');
    bilgiSatiri('Kullanılan Birim Fiyat Dönemi', ekgb.donemAdi);

    altBaslik('İşçilik Maliyetleri');
    ekgb.iscilik.detaylar.forEach(kalemSatiri);
    toplamSatiri('İşçilik Toplam', ekgb.iscilik.toplam);

    altBaslik('Tohum Maliyetleri');
    ekgb.tohum.detaylar.forEach((t) => kalemSatiri({ ad: t.ad || t.kod, aciklama: detayAciklamaOlustur(t), birimFiyat: t.birimFiyat, maliyet: t.maliyet }));
    toplamSatiri('Tohum Toplam', ekgb.tohum.toplam);

    altBaslik('Gübreleme Maliyetleri');
    ekgb.gubreleme.detaylar.forEach((g) => kalemSatiri({ ad: g.ad || g.kod, aciklama: detayAciklamaOlustur(g), birimFiyat: g.birimFiyat, maliyet: g.maliyet }));
    toplamSatiri('Gübreleme Toplam', ekgb.gubreleme.toplam);

    doc.moveDown();
    toplamSatiri('GENEL TOPLAM', ekgb.genelToplam, true);
    doc.moveDown(2);

    altBaslik('Hazırlayanlar');
    const imzacilar = ekgb.imzacilar && ekgb.imzacilar.length > 0 ? ekgb.imzacilar : [{ adSoyad: '', unvan: '' }];
    const tekKisi = imzacilar.length === 1;
    const y0 = doc.y + 10;

    imzacilar.forEach((im, i) => {
      let x, w, align;
      if (tekKisi) {
        x = doc.page.margins.left;
        w = genislik / 3;
        align = 'left';
      } else {
        w = genislik / imzacilar.length;
        x = doc.page.margins.left + i * w;
        align = 'center';
      }

      // "İMZA" filigrani - GERCEK %20 opaklik (PDFKit destekliyor)
      doc.save();
      doc.opacity(0.2);
      doc.font(FONT_KALIN).fontSize(16).fillColor('#000000').text('İMZA', x, y0, { width: w, align });
      doc.restore();

      doc.font(FONT_KALIN).fontSize(9).fillColor('#1C1E1B').text(im.adSoyad || '', x, y0 + 22, { width: w, align });
      doc.font(FONT_NORMAL).fontSize(8).text(im.unvan || '', x, y0 + 36, { width: w, align });
    });

    // ---- SAYFA 2: AÇIKLAMALAR ----
    doc.addPage();
    baslik('AÇIKLAMALAR', 13);
    doc.moveDown();

    const notlar = [
      'Birim fiyatlar/parametreler için; piyasa fiyat araştırmaları, varsa güncel İl Mera Komisyonu Kararları, Belediye Hizmet Tarifesi, resmi poz değerleri vb. esas alınmaktadır.',
      'Hafriyat taşıma bedeli İBB Çevre Koruma Şube Müdürlüğü Hizmet Tarifesi esas alınarak hesaplanmıştır.',
      'İnşaat/Hafriyat ve Asfalt/Beton alanlarda toprak serme ve tohum/gübre bedeli hesabında, serilecek toprak yüksekliği 20 cm olarak alınmıştır.',
      'Gübreleme: Yanmış hayvan gübresi 1 yıl; Amonyum Sülfat ve Kompoze Gübre 2 yıl uygulanacak şekilde hesaplanmıştır.',
      '4342 sayılı Mera Kanunu kapsamında hazırlanmıştır.',
    ];
    doc.font(FONT_NORMAL).fontSize(9.5);
    for (const not of notlar) {
      doc.text(`• ${not}`, { width: genislik });
      doc.moveDown(0.4);
    }

    doc.moveDown();
    altBaslik('Hesaplama Yöntemi Notları');
    const yontemNotlari = [
      ['Hafriyat Hacmi (m³)', 'İnşaat/Hafriyat Dökülen Alan (m²) × Toprak Derinliği (m) + Asfalt/Beton Kaplı Alan (m²) × Asfalt/Beton Kalınlığı (m)'],
      ['Toplam Islah Alanı (m²)', 'Sürülen/Tarla Olarak Kullanılan Alan (m²) + İnşaat/Hafriyat Dökülen Alan (m²) + Asfalt/Beton Kaplı Alan (m²)'],
      ['Hafriyat Taşıma İşçiliği', '(((Taşıma yapılan taşıtın kapasitesi m³ × 1.600 kg) − 20 torba toprak ağırlığı kg) / 1 torba toprak ağırlığı × İlave torba ücreti TL) × (Toplam Hafriyat Hacmi m³ / Taşıma yapılan taşıtın kapasitesi m³)'],
      ['Toprak Serme', 'Toprak bedeli + tesviye bedeli (İnşaat/Hafriyat + Asfalt/Beton alanları için)'],
    ];
    for (const [b, a] of yontemNotlari) {
      doc.font(FONT_KALIN).fontSize(9.5).text(b);
      doc.font(FONT_NORMAL).fontSize(9).text(a, { width: genislik });
      doc.moveDown(0.5);
    }

    // ---- FOOTER (her sayfaya, sonradan tum sayfalar uzerinde geziliyor) ----
    const bilgiMetni = `${ekgb.il} ${ekgb.ilce} ${ekgb.mahalle} — Ada: ${ekgb.ada || '-'} Parsel: ${ekgb.parsel || '-'} — ${ekgb.mutecavizAdSoyad || ''}`;
    const sayfaAraligi = doc.bufferedPageRange();
    const toplamSayfa = sayfaAraligi.count;

    for (let i = 0; i < toplamSayfa; i++) {
      doc.switchToPage(i);
      // ONEMLI: doc.text() normalde alt kenar boslugunu asinca OTOMATIK
      // yeni sayfa acar - footer tam da o bosluk icine yazildigi icin
      // gecici olarak alt kenar boslugunu 0'a cekip bunu engelliyoruz.
      const eskiAltBosluk = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      const footerY = doc.page.height - CM - FOOTER_YUKSEKLIK + 6;
      doc.font(FONT_NORMAL).fontSize(7).fillColor('#6E6E68')
        .text(bilgiMetni, doc.page.margins.left, footerY, { width: genislik, align: 'center', lineBreak: false });
      doc.font(FONT_NORMAL).fontSize(7)
        .text(`${i + 1}/${toplamSayfa}`, doc.page.margins.left, footerY + 12, { width: genislik, align: 'center', lineBreak: false });
      doc.fillColor('#1C1E1B');

      doc.page.margins.bottom = eskiAltBosluk;
    }

    doc.end();
  });
}

module.exports = { contractToEkgbPdf };
