/**
 * pdf.exporter.js
 *
 * Excel/Word ile AYNI sablonu (bkz. sablonlar/bbhb-tablo-semasi.js)
 * kullanir. PDFKit'in hazir tablo destegi olmadigi icin izgara elle
 * (x/y koordinatlariyla) cizilir.
 *
 * ONEMLI DUZELTME: Onceki surum varsayilan PDF fontunu kullaniyordu ve
 * bu font Turkce karakterleri (İ, ı, Ş, ş, Ğ, ğ, Ç, ç, Ö, ö, Ü, ü)
 * DESTEKLEMEDIGI icin metinler bozuk cikiyordu. Simdi Turkce karakter
 * destegi tam olan DejaVu Serif fontu (acik lisans) gomuluyor.
 *
 * Sayfa: A4 yatay, kenar bosluklari 1cm, basliklar ortali.
 */

const PDFDocument = require('pdfkit');
const path = require('path');
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

const FONT_NORMAL = path.join(__dirname, '../sablonlar/fontlar/DejaVuSerif.ttf');
const FONT_KALIN = path.join(__dirname, '../sablonlar/fontlar/DejaVuSerif-Bold.ttf');

const RENK = {
  koyu: '#3F3F3C', orta: '#6E6E68', katsayi: '#EDEBE4',
  seritKoyu: '#F4F4F2', toplam: '#DCDCD7', ozetEtiket: '#D9D9D4',
  beyazYazi: '#FFFFFF', koyuYazi: '#1C1E1B',
};

const CM = 28.3465; // punto cinsinden 1cm
const SATIR_YUKSEKLIGI = 14;
const YAZI_BOYUTU = 6.5;
const TOPLAM_SUTUN_SAYISI = 1 + ISLETMECI_ADI_SUTUN_SAYISI + TUM_ALTLAR.length + 1; // 26

function sutunGenislikleriniHesapla(kullanilabilirGenislik) {
  const birim = kullanilabilirGenislik / TOPLAM_SUTUN_SAYISI;
  return new Array(TOPLAM_SUTUN_SAYISI).fill(birim);
}

function hucreCiz(doc, { x, y, w, h, metin, fill, kalin = false, renkYazi = RENK.koyuYazi, align = 'center' }) {
  if (fill) {
    doc.rect(x, y, w, h).fill(fill);
  }
  doc.rect(x, y, w, h).strokeColor('#CCCCCC').lineWidth(0.4).stroke();
  if (metin !== undefined && metin !== null && metin !== '') {
    doc.font(kalin ? FONT_KALIN : FONT_NORMAL).fontSize(YAZI_BOYUTU).fillColor(renkYazi);
    doc.text(String(metin), x + 2, y + h / 2 - YAZI_BOYUTU / 2, { width: w - 4, align });
  }
}

function bolumCiz(doc, bolum, sutunGenislikleri, solKenar, ustBaslangic) {
  let y = ustBaslangic;
  const toplamGenislik = sutunGenislikleri.reduce((a, b) => a + b, 0);

  // Baslik satirlari (ortali)
  doc.rect(solKenar, y, toplamGenislik, SATIR_YUKSEKLIGI).fill(RENK.koyu);
  doc.font(FONT_KALIN).fontSize(9).fillColor(RENK.beyazYazi)
    .text(bolumBasligiMetni(bolum.baslik), solKenar, y + 3, { width: toplamGenislik, align: 'center' });
  y += SATIR_YUKSEKLIGI;

  doc.rect(solKenar, y, toplamGenislik, SATIR_YUKSEKLIGI).fill(RENK.koyu);
  doc.font(FONT_KALIN).fontSize(9).fillColor(RENK.beyazYazi)
    .text('BÜYÜK BAŞ HAYVAN BİRİMİ (BBHB) RAPORU', solKenar, y + 3, { width: toplamGenislik, align: 'center' });
  y += SATIR_YUKSEKLIGI;

  doc.font(FONT_NORMAL).fontSize(YAZI_BOYUTU).fillColor(RENK.koyuYazi)
    .text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, solKenar, y + 2);
  y += SATIR_YUKSEKLIGI;

  // Sutun x-konumlari
  const xKonumlari = [solKenar];
  for (const g of sutunGenislikleri) xKonumlari.push(xKonumlari[xKonumlari.length - 1] + g);

  // Grup baslik satiri
  hucreCiz(doc, { x: xKonumlari[0], y, w: sutunGenislikleri[0], h: SATIR_YUKSEKLIGI * 2, metin: 'Sıra No', fill: RENK.koyu, kalin: true, renkYazi: RENK.beyazYazi });
  const isletmeciGenislik = sutunGenislikleri.slice(1, 1 + ISLETMECI_ADI_SUTUN_SAYISI).reduce((a, b) => a + b, 0);
  hucreCiz(doc, { x: xKonumlari[1], y, w: isletmeciGenislik, h: SATIR_YUKSEKLIGI * 2, metin: 'İkamet Eden Aile Temsilcisinin Adı Soyadı (Aile)', fill: RENK.koyu, kalin: true, renkYazi: RENK.beyazYazi });

  let sutunIdx = 1 + ISLETMECI_ADI_SUTUN_SAYISI;
  for (const grup of SUTUN_HARITASI) {
    const genislik = sutunGenislikleri.slice(sutunIdx, sutunIdx + grup.altlar.length).reduce((a, b) => a + b, 0);
    hucreCiz(doc, { x: xKonumlari[sutunIdx], y, w: genislik, h: SATIR_YUKSEKLIGI, metin: grup.baslik, fill: RENK.orta, kalin: true, renkYazi: RENK.beyazYazi });
    let altIdx = sutunIdx;
    for (const alt of grup.altlar) {
      hucreCiz(doc, { x: xKonumlari[altIdx], y: y + SATIR_YUKSEKLIGI, w: sutunGenislikleri[altIdx], h: SATIR_YUKSEKLIGI, metin: alt.etiket, fill: RENK.orta, kalin: true, renkYazi: RENK.beyazYazi });
      altIdx += 1;
    }
    sutunIdx += grup.altlar.length;
  }
  const sonIdx = TOPLAM_SUTUN_SAYISI - 1;
  hucreCiz(doc, { x: xKonumlari[sonIdx], y, w: sutunGenislikleri[sonIdx], h: SATIR_YUKSEKLIGI * 2, metin: 'Toplam BBHB', fill: RENK.orta, kalin: true, renkYazi: RENK.beyazYazi });
  y += SATIR_YUKSEKLIGI * 2;

  // Katsayi satiri
  hucreCiz(doc, { x: xKonumlari[0], y, w: sutunGenislikleri[0], h: SATIR_YUKSEKLIGI, metin: '', fill: RENK.katsayi });
  hucreCiz(doc, { x: xKonumlari[1], y, w: isletmeciGenislik, h: SATIR_YUKSEKLIGI, metin: '', fill: RENK.katsayi });
  let ki = 1 + ISLETMECI_ADI_SUTUN_SAYISI;
  for (const alt of TUM_ALTLAR) {
    hucreCiz(doc, { x: xKonumlari[ki], y, w: sutunGenislikleri[ki], h: SATIR_YUKSEKLIGI, metin: katsayiBul(alt.grupKodu, alt.kodlar[0]), fill: RENK.katsayi, kalin: true });
    ki += 1;
  }
  hucreCiz(doc, { x: xKonumlari[sonIdx], y, w: sutunGenislikleri[sonIdx], h: SATIR_YUKSEKLIGI, metin: '', fill: RENK.katsayi });
  y += SATIR_YUKSEKLIGI;

  // Isletmeci satirlari
  const sutunToplamlari = new Array(TUM_ALTLAR.length).fill(0);
  let siraNo = 1;
  for (const isletmeci of bolum.isletmeciler) {
    const zemin = siraNo % 2 === 0 ? RENK.seritKoyu : '#FFFFFF';
    hucreCiz(doc, { x: xKonumlari[0], y, w: sutunGenislikleri[0], h: SATIR_YUKSEKLIGI, metin: siraNo, fill: zemin });
    hucreCiz(doc, { x: xKonumlari[1], y, w: isletmeciGenislik, h: SATIR_YUKSEKLIGI, metin: isletmeci.isletmeciAdi, fill: zemin, align: 'left' });

    const pivotDegerler = isletmeciSatiriDizisi(isletmeci.kayitlar);
    let vi = 1 + ISLETMECI_ADI_SUTUN_SAYISI;
    pivotDegerler.forEach((deger, idx) => {
      hucreCiz(doc, { x: xKonumlari[vi], y, w: sutunGenislikleri[vi], h: SATIR_YUKSEKLIGI, metin: deger, fill: zemin });
      if (typeof deger === 'number') sutunToplamlari[idx] += deger;
      vi += 1;
    });
    hucreCiz(doc, { x: xKonumlari[sonIdx], y, w: sutunGenislikleri[sonIdx], h: SATIR_YUKSEKLIGI, metin: isletmeci.isletmeciToplami, fill: zemin, kalin: true });

    y += SATIR_YUKSEKLIGI;
    siraNo += 1;
  }

  // TOPLAM satiri
  hucreCiz(doc, { x: xKonumlari[0], y, w: sutunGenislikleri[0] + isletmeciGenislik, h: SATIR_YUKSEKLIGI, metin: 'TOPLAM', fill: RENK.toplam, kalin: true, align: 'left' });
  let ti = 1 + ISLETMECI_ADI_SUTUN_SAYISI;
  sutunToplamlari.forEach((t) => {
    hucreCiz(doc, { x: xKonumlari[ti], y, w: sutunGenislikleri[ti], h: SATIR_YUKSEKLIGI, metin: t || '', fill: RENK.toplam, kalin: true });
    ti += 1;
  });
  hucreCiz(doc, { x: xKonumlari[sonIdx], y, w: sutunGenislikleri[sonIdx], h: SATIR_YUKSEKLIGI, metin: bolum.bolumToplami, fill: RENK.toplam, kalin: true });
  y += SATIR_YUKSEKLIGI + 6;

  // OZET BILGILER
  const toplamHayvan = bolum.isletmeciler.flatMap((is) => is.kayitlar).reduce((t, k) => t + k.adet, 0);
  doc.rect(solKenar, y, toplamGenislik, SATIR_YUKSEKLIGI).fill(RENK.koyu);
  doc.font(FONT_KALIN).fontSize(8).fillColor(RENK.beyazYazi).text('ÖZET BİLGİLER', solKenar + 4, y + 3);
  y += SATIR_YUKSEKLIGI;

  const ozetSatirlari = [
    ['Toplam Hayvan Sayısı', `${toplamHayvan} baş`],
    ['Toplam BBHB', String(bolum.bolumToplami)],
    ['İşletmeci Sayısı', String(bolum.isletmeciler.length)],
  ];
  for (const [etiket, deger] of ozetSatirlari) {
    doc.rect(solKenar, y, toplamGenislik, SATIR_YUKSEKLIGI).fill(RENK.ozetEtiket);
    doc.font(FONT_KALIN).fontSize(YAZI_BOYUTU).fillColor(RENK.koyuYazi).text(etiket, solKenar + 4, y + 3);
    doc.font(FONT_NORMAL).fontSize(YAZI_BOYUTU).fillColor(RENK.koyuYazi).text(deger, solKenar + 200, y + 3);
    y += SATIR_YUKSEKLIGI;
  }

  return y + 10;
}

async function contractToPdf(contract) {
  return new Promise((resolve, reject) => {
    const kenarBoslugu = CM; // 1cm
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: kenarBoslugu, bottom: kenarBoslugu, left: kenarBoslugu, right: kenarBoslugu },
      bufferPages: true,
    });

    const parcalar = [];
    doc.on('data', (p) => parcalar.push(p));
    doc.on('end', () => resolve(Buffer.concat(parcalar)));
    doc.on('error', reject);

    const solKenar = doc.page.margins.left;
    const kullanilabilirGenislik = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const sutunGenislikleri = sutunGenislikleriniHesapla(kullanilabilirGenislik);

    let y = doc.page.margins.top;
    for (const bolum of contract.bolumler) {
      // Sayfa tasarsa yeni sayfaya gec
      if (y > doc.page.height - 150) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      y = bolumCiz(doc, bolum, sutunGenislikleri, solKenar, y);
    }

    if (y > doc.page.height - 150) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    doc.font(FONT_KALIN).fontSize(11).fillColor(RENK.koyuYazi)
      .text(`${lang.ortak.genelToplam}: ${contract.genelToplam}`, solKenar, y, { align: 'right', width: kullanilabilirGenislik });
    y += 20;

    doc.font(FONT_KALIN).fontSize(10).text(lang.ortak.siniflandirmaKriterleri, solKenar, y);
    y += 16;
    doc.font(FONT_NORMAL).fontSize(YAZI_BOYUTU + 1);
    for (const paragraf of kriterParagraflariOlustur()) {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      doc.text(paragraf, solKenar, y, { width: kullanilabilirGenislik });
      y = doc.y + 4;
    }

    doc.end();
  });
}

module.exports = { contractToPdf };
