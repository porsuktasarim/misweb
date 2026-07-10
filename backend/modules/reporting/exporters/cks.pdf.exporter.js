/**
 * cks.pdf.exporter.js
 *
 * Ek-4/a formu - manuel cizilmis tablo (PDFKit'te hazir tablo yok).
 * Turkce karakter destegi icin gomulu DejaVu Serif font.
 */

const PDFDocument = require('pdfkit');
const path = require('path');

const FONT_NORMAL = path.join(__dirname, '../sablonlar/fontlar/DejaVuSerif.ttf');
const FONT_KALIN = path.join(__dirname, '../sablonlar/fontlar/DejaVuSerif-Bold.ttf');
const CM = 28.3465;
const RENK = { koyu: '#3F3F3C', orta: '#6E6E68', seritKoyu: '#F4F4F2', beyazYazi: '#FFFFFF', koyuYazi: '#1C1E1B' };
const FOOTER_YUKSEKLIK = CM * 0.9;

const SUTUN_ETIKETLERI = ['Sıra\nNo', 'İkamet Eden Aile Temsilcisinin\nAdı Soyadı (Aile)', 'Hayvan\nVarlığı', 'Yem\nBitkisi', 'Sebze/\nMeyve', 'Hububat/\nYağlı Tohumlar', 'Tarım', 'Hayvancılık'];
const SUTUN_ORANLARI = [0.6, 2.6, 1, 1, 1, 1.3, 0.8, 1]; // toplam ~9.3 birim

function hucreCiz(doc, { x, y, w, h, metin, fill, kalin = false, renkYazi = RENK.koyuYazi, align = 'center', boyut = 8 }) {
  if (fill) doc.rect(x, y, w, h).fill(fill);
  doc.rect(x, y, w, h).strokeColor('#CCCCCC').lineWidth(0.4).stroke();
  if (metin !== undefined && metin !== null && metin !== '') {
    doc.font(kalin ? FONT_KALIN : FONT_NORMAL).fontSize(boyut).fillColor(renkYazi);
    doc.text(String(metin), x + 2, y + h / 2 - boyut / 2, { width: w - 4, align });
  }
}

async function contractToCksPdf(cks) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: CM, bottom: CM + FOOTER_YUKSEKLIK, left: CM, right: CM }, bufferPages: true });
    const parcalar = [];
    doc.on('data', (p) => parcalar.push(p));
    doc.on('end', () => resolve(Buffer.concat(parcalar)));
    doc.on('error', reject);

    const solKenar = doc.page.margins.left;
    const genislik = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const oranToplam = SUTUN_ORANLARI.reduce((a, b) => a + b, 0);
    const sutunGenislikleri = SUTUN_ORANLARI.map((o) => (o / oranToplam) * genislik);

    doc.font(FONT_KALIN).fontSize(12).text('4342 SAYILI MERA KANUNU', { align: 'center' });
    doc.font(FONT_KALIN).fontSize(13).text('ÇİFTÇİ AİLE VE GEÇİM KAYNAĞI BİLDİRİM CETVELİ (EK-4/a)', { align: 'center' });
    doc.moveDown(0.5);
    doc.font(FONT_NORMAL).fontSize(9).text(`İli: ${cks.il}   İlçesi: ${cks.ilce}   Köyü/Mahalle: ${cks.koyMahalle}${cks.uretimYili ? `   Üretim Yılı: ${cks.uretimYili}` : ''}`);
    doc.moveDown(0.5);

    let y = doc.y;
    const xKonumlari = [solKenar];
    for (const g of sutunGenislikleri) xKonumlari.push(xKonumlari[xKonumlari.length - 1] + g);

    function baslikSatiriCiz() {
      SUTUN_ETIKETLERI.forEach((etiket, i) => {
        hucreCiz(doc, { x: xKonumlari[i], y, w: sutunGenislikleri[i], h: 26, metin: etiket, fill: i < 2 ? RENK.koyu : RENK.orta, kalin: true, renkYazi: RENK.beyazYazi, boyut: 7.5 });
      });
      y += 26;
    }
    baslikSatiriCiz();

    const SATIR_YUKSEKLIGI = 14;
    cks.ciftciler.forEach((c, i) => {
      if (y > doc.page.height - doc.page.margins.bottom - SATIR_YUKSEKLIGI) {
        doc.addPage();
        y = doc.page.margins.top;
        baslikSatiriCiz();
      }
      const zemin = i % 2 === 0 ? '#FFFFFF' : RENK.seritKoyu;
      const degerler = [i + 1, c.isletmeciAdi, '', c.yemBitkisi || '', c.sebzeMeyve || '', c.hububatYagli || '', c.tarim ? 'X' : '', ''];
      degerler.forEach((deger, k) => {
        hucreCiz(doc, { x: xKonumlari[k], y, w: sutunGenislikleri[k], h: SATIR_YUKSEKLIGI, metin: deger, fill: zemin, align: k === 1 ? 'left' : 'center' });
      });
      y += SATIR_YUKSEKLIGI;
    });

    y += 10;
    if (y > doc.page.height - doc.page.margins.bottom - 80) { doc.addPage(); y = doc.page.margins.top; }
    doc.font(FONT_NORMAL).fontSize(8.5).fillColor(RENK.koyuYazi);
    doc.text('Not:  1. Teknik Ekip Üyelerince İmzalanacaktır.', solKenar, y);
    y = doc.y + 2;
    doc.text('        2. Muhtar ve İhtiyar Heyetince İmzalanarak Mühürlenecektir.', solKenar, y);
    y = doc.y + 16;

    function imzaBlokuCiz(baslikMetni, imzacilarGirdi) {
      if (y > doc.page.height - doc.page.margins.bottom - 70) { doc.addPage(); y = doc.page.margins.top; }
      doc.rect(solKenar, y, genislik, 16).fill(RENK.orta);
      doc.font(FONT_KALIN).fontSize(9).fillColor(RENK.beyazYazi).text(baslikMetni, solKenar + 4, y + 3);
      y += 24;

      const imzacilar = imzacilarGirdi && imzacilarGirdi.length > 0 ? imzacilarGirdi : [{ adSoyad: '', unvan: '' }];
      const tekKisi = imzacilar.length === 1;
      imzacilar.forEach((im, i) => {
        let x, w, align;
        if (tekKisi) { x = solKenar; w = genislik / 3; align = 'left'; }
        else { w = genislik / imzacilar.length; x = solKenar + i * w; align = 'center'; }

        doc.save();
        doc.opacity(0.2);
        doc.font(FONT_KALIN).fontSize(14).fillColor('#000000').text('İMZA', x, y, { width: w, align });
        doc.restore();

        doc.font(FONT_KALIN).fontSize(9).fillColor(RENK.koyuYazi).text(im.adSoyad || '', x, y + 20, { width: w, align });
        doc.font(FONT_NORMAL).fontSize(8).text(im.unvan || '', x, y + 33, { width: w, align });
      });
      y += 50;
    }

    imzaBlokuCiz('TEKNİK EKİP ÜYELERİ', cks.teknikEkipImzacilari);
    imzaBlokuCiz('MUHTAR VE İHTİYAR HEYETİ', cks.muhtarHeyetiImzacilari);

    // FOOTER
    const bilgiMetni = `${cks.il} ${cks.ilce} ${cks.koyMahalle}`;
    const sayfaAraligi = doc.bufferedPageRange();
    const toplamSayfa = sayfaAraligi.count;
    for (let i = 0; i < toplamSayfa; i++) {
      doc.switchToPage(i);
      const eskiAltBosluk = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const footerY = doc.page.height - CM - FOOTER_YUKSEKLIK + 6;
      doc.font(FONT_NORMAL).fontSize(7).fillColor(RENK.orta)
        .text(bilgiMetni, doc.page.margins.left, footerY, { width: genislik, align: 'center', lineBreak: false });
      doc.font(FONT_NORMAL).fontSize(7)
        .text(`${i + 1}/${toplamSayfa}`, doc.page.margins.left, footerY + 12, { width: genislik, align: 'center', lineBreak: false });
      doc.fillColor(RENK.koyuYazi);
      doc.page.margins.bottom = eskiAltBosluk;
    }

    doc.end();
  });
}

module.exports = { contractToCksPdf };
