/**
 * uc-t.export.js
 *
 * 3T adimlarinin ürettigi resmi metinleri Word/PDF olarak disa
 * aktarir. Belge Ayarlari'ndan (imzaRengi, wordYaziTipi) OKUR - bu
 * degerler TUM ciktilarda TUTARLI kullanilir.
 *
 * HER BELGENIN SOL UST KOSESINDE "(Ek-X)" ETIKETI - imzaRengi ile.
 *
 * IKI FARKLI IMZA SEKLI:
 *  - 'tek'   : Duyuru (Ek-1), Tebliğ Belgesi (Ek-3) - SAYFANIN SAG
 *              (3.) SUTUNUNDA ORTALI: tarih -> 3 satir bosluk (2.
 *              satirda "İMZA", imzaRengi ile) -> Ad Soyad (kalin) ->
 *              Unvan -> "İl Mera Komisyonu Başkanı". Ad/Unvan, Adim
 *              1'de belirlenen GERCEK baskandan (Vali Yardimcisi/Il
 *              Muduru/Teknik Personel) gelir.
 *  - 'dortlu': Duyuru Tutanağı (Ek-2) - govde metninin SONUNDAKI
 *              "imza altına alınmıştır." cumlesine tarih DOGRUDAN
 *              EKLENIR (ayni cumle). Altta 4 ESIT SUTUN: imza cizgisi
 *              -> 1 satir bosluk -> "Adı Soyadı"/"Ünvanı" etiketleri
 *              (imzaRengi ile, BOS SABLON).
 */

const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
} = require('docx');
const PDFDocument = require('pdfkit');
const IlMeraKomisyonu = require('../personel/ilMeraKomisyonu.model');
const belgeAyarlariService = require('../belge-ayarlari/belgeAyarlari.service');

const FONT_NORMAL = path.join(__dirname, '../reporting/sablonlar/fontlar/DejaVuSerif.ttf');
const FONT_KALIN = path.join(__dirname, '../reporting/sablonlar/fontlar/DejaVuSerif-Bold.ttf');

/** Adim 1'de (varsa) belirlenmis GERCEK baskanlik bilgisini (Vali Yardimcisi/Il Muduru/Teknik Personel) dondurur. */
function baskanlikBilgisiniBul(kayit) {
  const karar1Adim = kayit.surec.flatMap((a) => a.altAdimlar).find((a) => a.tip === 'ilMeraKomisyonuKarari');
  const b = karar1Adim?.veri?.baskanlik;
  if (b && b.adSoyad) return { adSoyad: b.adSoyad, unvan: b.unvan };
  return { adSoyad: '……………………………', unvan: '……………………………' };
}

/** (Ek-2) DUYURU TUTANAĞI icin export verisini, KAYITLI 3T verisinden YENIDEN uretir. */
async function duyuruTutanagiVerileriniOlustur(kayit, veri) {
  let komisyon = null;
  if (veri.komisyonId) komisyon = await IlMeraKomisyonu.findById(veri.komisyonId);
  const yil = komisyon ? komisyon.yil : '20..';

  const duyuruAdim = kayit.surec.flatMap((a) => a.altAdimlar).find((a) => a.tip === 'duyuru');
  const baslangicTarihi = duyuruAdim?.veri?.baslangicTarihi;
  const tarihGosterim = baslangicTarihi ? new Date(baslangicTarihi).toLocaleDateString('tr-TR') : `…/…/${yil}`;

  const kurumListesi = [...(veri.gonderimKurumlari || []), ...(veri.digerKurumlar ? [veri.digerKurumlar] : [])].join(', ') || '……………………………';

  // ONEMLI: tarih artik AYRI SATIR DEGIL - "imza altına alınmıştır."
  // cumlesinin HEMEN SONUNA eklenir (kullanicinin acik istegi).
  const govdeMetni = `4342 Sayılı Mera Kanunu'na göre ${kayit.il} İli ${kayit.ilce} İlçesi ${kayit.koyMahalle} Köyü/Mahallesi sınırları içerisinde bulunan mera / yaylak / kışlak / otlak / çayırların tespit ve tahdit çalışmalarına ${tarihGosterim} tarihinde başlanacağını belirten duyuru, 4342 Sayılı Mera Kanunu'nun 7 nci maddesi gereği …/…/${yil} ile …/…/${yil} tarihleri arasında ilan edilmek ve ${kurumListesi}'na asılmak üzere ${kayit.il} İli Mera Komisyonundan teslim alınıp, belirtilen tarihler arasında usulüne uygun şekilde ilan yapıldığını gösterir işbu tutanak tarafımızdan düzenlenerek imza altına alınmıştır. …../…../${yil}`;

  return { ekKodu: '(Ek-2)', baslik: 'DUYURU TUTANAĞI', govdeMetni, imzaTipi: 'dortlu' };
}

/** (Ek-1) DUYURU icin export verisini uretir. */
function duyuruVerileriniOlustur(kayit, veri) {
  const tarihGosterim = veri.baslangicTarihi ? new Date(veri.baslangicTarihi).toLocaleDateString('tr-TR') : '…/…/20….';
  const yil = veri.baslangicTarihi ? new Date(veri.baslangicTarihi).getFullYear() : '20..';
  const komisyonAdi = `${kayit.il} İl Mera Komisyonu`;

  // IKI AYRI PARAGRAF (govdeParagraflari dizisi olarak - Word'de HER
  // BIRI GERCEKTEN ayri bir Paragraph nesnesi olacak).
  const govdeParagraflari = [
    `4342 Sayılı Mera Kanunu gereği, ${tarihGosterim} tarihinde ${kayit.il} İli ${kayit.ilce} İlçesi ${kayit.koyMahalle} Köy/Mahallesinde ${komisyonAdi} Teknik Ekiplerince, mera, yaylak, kışlak, otlak, umuma ait çayırların tespit ve tahdit çalışmalarına başlanılacaktır.`,
    `4342 Sayılı Mera Kanunu'nun 7 nci maddesi gereği ilan olunur.`,
  ];

  const baskan = baskanlikBilgisiniBul(kayit);
  return {
    ekKodu: '(Ek-1)', baslik: 'DUYURU', govdeParagraflari,
    tarihSatiri: `…../…../${yil}`,
    imzaTipi: 'tek', imzaAdSoyad: baskan.adSoyad, imzaUnvan: baskan.unvan, imzaAltYazi: 'İl Mera Komisyonu Başkanı',
  };
}

/** (Ek-3) TEBLİĞ BELGESİ icin export verisini uretir - ARTIK USTTE ALICI BASLIGI YOK. */
function tebligBelgesiVerileriniOlustur(kayit, veri) {
  const duyuruAdim = kayit.surec.flatMap((a) => a.altAdimlar).find((a) => a.tip === 'duyuru');
  const tarih = duyuruAdim?.veri?.baslangicTarihi;
  const tarihGosterim = tarih ? new Date(tarih).toLocaleDateString('tr-TR') : '…/…/20….';
  const yil = tarih ? new Date(tarih).getFullYear() : '20..';
  const komisyonAdi = `${kayit.il} İl Mera Komisyonu`;

  const govdeParagraflari = [
    `4342 Sayılı Mera Kanunu gereği, ${tarihGosterim} tarihinde ${kayit.il} İli ${kayit.ilce} İlçesi ${kayit.koyMahalle} Köy/Mahallesinde ${komisyonAdi} Teknik Ekiplerince mera, yaylak, kışlak, otlak, umuma ait çayırların tespit ve tahdit çalışmalarına başlanacaktır.`,
    `4342 Sayılı Mera Kanunu'nun 7 nci maddesi gereği başlama tarihi ile çalışma yapılacak yeri bildiren alanlarda mevcut mera, yaylak, kışlak, otlak ve umuma ait çayır alanları mevcut ise bu alanların durumunu belirten bilgi ve belgelerin, 4342 sayılı Mera Kanunu'nun 8 inci maddesi gereği tebliğden itibaren otuz gün içerisinde Komisyonumuza teslim edilmesi tebliğ olunur.`,
  ];

  const baskan = baskanlikBilgisiniBul(kayit);
  return {
    ekKodu: '(Ek-3)', baslik: 'TEBLİĞ BELGESİ', govdeParagraflari,
    tarihSatiri: `…../…../${yil}`,
    imzaTipi: 'tek', imzaAdSoyad: baskan.adSoyad, imzaUnvan: baskan.unvan, imzaAltYazi: 'İl Mera Komisyonu Başkanı',
    altNot: 'Ek: Mera, Yaylak, Kışlak, Otlak, Umuma ait Çayır Bilgi Cetveli (Ek-3/a)',
  };
}

/** Adim TIPINE gore dogru veri-uretici fonksiyonu cagirir + Belge Ayarlarini ekler. */
async function adimDisaAktarVerisi(kayit, alt) {
  let v;
  if (alt.tip === 'duyuruTutanagi') v = await duyuruTutanagiVerileriniOlustur(kayit, alt.veri || {});
  else if (alt.tip === 'duyuru') v = duyuruVerileriniOlustur(kayit, alt.veri || {});
  else if (alt.tip === 'tebligBelgesi') v = tebligBelgesiVerileriniOlustur(kayit, alt.veri || {});
  else throw new Error('Bu adım için dışa aktarma henüz desteklenmiyor.');

  const ayarlar = await belgeAyarlariService.ayarlariGetir();
  v.imzaRengi = ayarlar.imzaRengi;
  v.wordYaziTipi = ayarlar.wordYaziTipi;
  return v;
}

// ============ WORD ============

/** 1.5 satir araligi (docx'te 360=1.5x, 240=1x) TUM paragraflara UYGULANIR. */
function pOlustur(opsiyonlar) {
  const { spacing, ...gerisi } = opsiyonlar;
  return new Paragraph({ ...gerisi, spacing: { line: 360, lineRule: 'auto', ...(spacing || {}) } });
}

async function adimBelgesiWordOlustur(v) {
  const yaziTipi = v.wordYaziTipi || 'Times New Roman';
  const imzaRengiHex = (v.imzaRengi || '#999999').replace('#', '');
  const cocuklar = [];

  if (v.ekKodu) {
    cocuklar.push(pOlustur({ spacing: { after: 200 }, children: [new TextRun({ text: v.ekKodu, color: imzaRengiHex, size: 20, font: yaziTipi })] }));
  }

  if (v.aliciBasligi) {
    v.aliciBasligi.split('\n').forEach((satir) => {
      cocuklar.push(pOlustur({ spacing: { after: 40 }, children: [new TextRun({ text: satir, size: 22, font: yaziTipi })] }));
    });
    cocuklar.push(pOlustur({ text: '', spacing: { after: 200 } }));
  }

  cocuklar.push(pOlustur({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: v.baslik, bold: true, size: 28, font: yaziTipi })] }));

  // GOVDE: HER PARAGRAF GERCEKTEN AYRI Paragraph nesnesi (docx.js
  // metin icindeki \n karakterini paragraf sayilmiyor - bu yuzden
  // govdeMetni/govdeParagraflari birbirinden AYRISTIRILIYOR).
  const paragraflar = v.govdeParagraflari || (v.govdeMetni ? [v.govdeMetni] : []);
  paragraflar.forEach((p) => {
    cocuklar.push(pOlustur({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 300 }, children: [new TextRun({ text: p, size: 22, font: yaziTipi })] }));
  });

  const hucreKenarsiz = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

  if (v.imzaTipi === 'tek') {
    // Duyuru/Tebliğ Belgesi: SAG (3.) SUTUNDA ORTALI - tarih + 3 satir
    // (2.sinde "İMZA") + Ad Soyad + Unvan + "İl Mera Komisyonu Başkanı".
    const bosHucre = () => new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, borders: hucreKenarsiz, children: [pOlustur({ text: '' })] });
    const sagSutunParagraflari = [
      pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.tarihSatiri || '', size: 22, font: yaziTipi })] }),
      pOlustur({ text: '' }),
      pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'İMZA', color: imzaRengiHex, size: 20, font: yaziTipi })] }),
      pOlustur({ text: '' }),
      pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.imzaAdSoyad, bold: true, size: 22, font: yaziTipi })] }),
      pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.imzaUnvan, size: 22, font: yaziTipi })] }),
      pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.imzaAltYazi, size: 22, font: yaziTipi })] }),
    ];
    cocuklar.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: [bosHucre(), bosHucre(), new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, borders: hucreKenarsiz, children: sagSutunParagraflari })] })],
    }));
  } else if (v.imzaTipi === 'dortlu') {
    // Duyuru Tutanağı: 4 ESIT SUTUN - CIZGI YOK, "İMZA" yazisi +
    // "Adı Soyadı"/"Ünvanı" etiketleri (BOS SABLON, hepsi imzaRengi).
    const imzaSutunHucresi = () => new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE }, borders: hucreKenarsiz,
      children: [
        pOlustur({ text: '' }),
        pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'İMZA', size: 18, color: imzaRengiHex, font: yaziTipi })] }),
        pOlustur({ text: '' }),
        pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Adı Soyadı', size: 18, color: imzaRengiHex, font: yaziTipi })] }),
        pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ünvanı', size: 18, color: imzaRengiHex, font: yaziTipi })] }),
      ],
    });
    cocuklar.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [imzaSutunHucresi(), imzaSutunHucresi(), imzaSutunHucresi(), imzaSutunHucresi()] })] }));
  }

  if (v.altNot) {
    cocuklar.push(pOlustur({ spacing: { before: 400 }, children: [new TextRun({ text: v.altNot, italics: true, size: 20, font: yaziTipi })] }));
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children: cocuklar,
    }],
  });
  return Packer.toBuffer(doc);
}

// ============ PDF ============

function adimBelgesiPdfOlustur(v) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 } });
    const parcalar = [];
    doc.on('data', (c) => parcalar.push(c));
    doc.on('end', () => resolve(Buffer.concat(parcalar)));
    doc.on('error', reject);

    doc.registerFont('normal', FONT_NORMAL);
    doc.registerFont('kalin', FONT_KALIN);
    const imzaRengi = v.imzaRengi || '#999999';
    const SATIR_ARALIGI = { lineGap: 5 }; // ~1.5 satir araligi yaklasik degeri

    if (v.ekKodu) {
      doc.fillColor(imzaRengi).font('normal').fontSize(10).text(v.ekKodu, { align: 'left' });
      doc.fillColor('#000000');
      doc.moveDown(0.5);
    }

    if (v.aliciBasligi) {
      doc.font('normal').fontSize(10).text(v.aliciBasligi, SATIR_ARALIGI);
      doc.moveDown(1);
    }

    doc.font('kalin').fontSize(13).text(v.baslik, { align: 'center' });
    doc.moveDown(1);

    const paragraflar = v.govdeParagraflari || (v.govdeMetni ? [v.govdeMetni] : []);
    doc.font('normal').fontSize(10);
    paragraflar.forEach((p) => {
      doc.text(p, { align: 'justify', ...SATIR_ARALIGI });
      doc.moveDown(1);
    });

    const sayfaGenisligi = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    if (v.imzaTipi === 'tek') {
      // SAG (3.) SUTUNDA ORTALI: tarih + 3 satir (2.sinde İMZA) + Ad
      // Soyad + Unvan + rol.
      const sutunGenisligi = sayfaGenisligi / 3;
      const sagSutunX = doc.page.margins.left + sutunGenisligi * 2;
      doc.font('normal').fontSize(10).text(v.tarihSatiri || '', sagSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
      doc.moveDown(1);
      doc.fillColor(imzaRengi).text('İMZA', sagSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
      doc.fillColor('#000000');
      doc.moveDown(1);
      doc.font('kalin').text(v.imzaAdSoyad, sagSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
      doc.font('normal').text(v.imzaUnvan, sagSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
      doc.text(v.imzaAltYazi, sagSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
    } else if (v.imzaTipi === 'dortlu') {
      // Duyuru Tutanağı: 4 ESIT SUTUN - CIZGI YOK, "İMZA" yazisi +
      // "Adı Soyadı"/"Ünvanı" etiketleri (BOS SABLON, imzaRengi).
      doc.moveDown(1.5);
      const sutunGenisligi = sayfaGenisligi / 4;
      const baslangicY = doc.y;
      doc.fillColor(imzaRengi).font('normal').fontSize(9);
      for (let i = 0; i < 4; i++) {
        const x = doc.page.margins.left + i * sutunGenisligi;
        doc.text('İMZA', x, baslangicY, { width: sutunGenisligi, align: 'center' });
      }
      doc.fontSize(8);
      for (let i = 0; i < 4; i++) {
        const x = doc.page.margins.left + i * sutunGenisligi;
        doc.text('Adı Soyadı', x, baslangicY + 30, { width: sutunGenisligi, align: 'center' });
        doc.text('Ünvanı', x, baslangicY + 42, { width: sutunGenisligi, align: 'center' });
      }
      doc.fillColor('#000000');
    }

    if (v.altNot) {
      doc.moveDown(3);
      doc.font('normal').fontSize(9).text(v.altNot);
    }

    doc.end();
  });
}

module.exports = { adimDisaAktarVerisi, adimBelgesiWordOlustur, adimBelgesiPdfOlustur };
