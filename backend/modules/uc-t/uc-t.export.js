/**
 * uc-t.export.js
 *
 * 3T adimlarinin ürettigi resmi metinleri Word/PDF olarak disa
 * aktarir. GENEL AMACLI: { baslik, govdeMetni, tarihSatiri, imzaTipi,
 * ... } seklinde veri alir.
 *
 * IKI FARKLI IMZA SEKLI VAR (orijinal Ek-1/Ek-2 sablonlarina gore):
 *  - 'tek'   : Duyuru (Ek-1) - SAG tarafta, TEK kisi, SADECE unvan
 *              ("Komisyon Başkanı" - isim YAZILMAZ, orijinal sablonda
 *              da isim yok).
 *  - 'dortlu': Duyuru Tutanağı (Ek-2) - 4 ESIT SUTUNA bolunmus, her
 *              birinde COK ACIK GRI bir imza CIZGISI + altinda ayni
 *              gri renkte "Adı Soyadı" / "Ünvanı" ETIKETLERI (BOS
 *              SABLON - Koylerde Muhtar+3 Ihtiyar Heyeti Uyesi,
 *              Belediyelerde Belediye Baskani+3 yetkili BASILIP ELLE
 *              doldurur - sistem bu kisilerin isimlerini bilmiyor).
 *
 * Adim TIPINE gore (duyuru, duyuruTutanagi, ...) veriyi HAZIRLAYAN
 * fonksiyonlar ayri tutulur - Word/PDF URETICILERI ORTAKTIR.
 */

const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
} = require('docx');
const PDFDocument = require('pdfkit');
const IlMeraKomisyonu = require('../personel/ilMeraKomisyonu.model');

const FONT_NORMAL = path.join(__dirname, '../reporting/sablonlar/fontlar/DejaVuSerif.ttf');
const FONT_KALIN = path.join(__dirname, '../reporting/sablonlar/fontlar/DejaVuSerif-Bold.ttf');
const GRI_RENK = '999999';

/** (Ek-2) DUYURU TUTANAĞI icin export verisini, KAYITLI 3T verisinden YENIDEN uretir. */
async function duyuruTutanagiVerileriniOlustur(kayit, veri) {
  let komisyon = null;
  if (veri.komisyonId) komisyon = await IlMeraKomisyonu.findById(veri.komisyonId);
  const yil = komisyon ? komisyon.yil : '20..';

  // Baslangic tarihi ARTIK BU ADIMDA TUTULMUYOR - Duyuru (Ek-1)
  // adimindan OKUNUYOR (tek kaynak).
  const duyuruAdim = kayit.surec.flatMap((a) => a.altAdimlar).find((a) => a.tip === 'duyuru');
  const baslangicTarihi = duyuruAdim?.veri?.baslangicTarihi;
  const tarihGosterim = baslangicTarihi ? new Date(baslangicTarihi).toLocaleDateString('tr-TR') : `…/…/${yil}`;

  const kurumListesi = [...(veri.gonderimKurumlari || []), ...(veri.digerKurumlar ? [veri.digerKurumlar] : [])].join(', ') || '……………………………';

  const govdeMetni = `4342 Sayılı Mera Kanunu'na göre ${kayit.il} İli ${kayit.ilce} İlçesi ${kayit.koyMahalle} Köyü/Mahallesi sınırları içerisinde bulunan mera / yaylak / kışlak / otlak / çayırların tespit ve tahdit çalışmalarına ${tarihGosterim} tarihinde başlanacağını belirten duyuru, 4342 Sayılı Mera Kanunu'nun 7 nci maddesi gereği …/…/${yil} ile …/…/${yil} tarihleri arasında ilan edilmek ve ${kurumListesi}'na asılmak üzere ${kayit.il} İli Mera Komisyonundan teslim alınıp, belirtilen tarihler arasında usulüne uygun şekilde ilan yapıldığını gösterir işbu tutanak tarafımızdan düzenlenerek imza altına alınmıştır.`;

  return {
    baslik: 'DUYURU TUTANAĞI (Ek-2)',
    govdeMetni,
    tarihSatiri: `…../…../${yil}`,
    imzaTipi: 'dortlu',
  };
}

/** (Ek-1) DUYURU icin export verisini uretir. */
function duyuruVerileriniOlustur(kayit, veri) {
  const tarihGosterim = veri.baslangicTarihi ? new Date(veri.baslangicTarihi).toLocaleDateString('tr-TR') : '…/…/20….';
  const yil = veri.baslangicTarihi ? new Date(veri.baslangicTarihi).getFullYear() : '20..';
  const govdeMetni = `4342 Sayılı Mera Kanunu gereği, ${tarihGosterim} tarihinde ${kayit.il} İli ${kayit.ilce} İlçesi ${kayit.koyMahalle} Köy/Mahallesinde Mera Komisyonu/Teknik Ekiplerince, mera, yaylak, kışlak, otlak, umuma ait çayırların tespit ve tahdit çalışmalarına başlanacaktır. 4342 Sayılı Mera Kanunu'nun 7 nci maddesi gereği ilan olunur.`;
  return {
    baslik: 'DUYURU (Ek-1)',
    govdeMetni,
    tarihSatiri: `…../…../${yil}`,
    imzaTipi: 'tek',
    imzaAltYazi: 'Komisyon Başkanı',
  };
}

/** (Ek-3) TEBLİĞ BELGESİ icin export verisini uretir. */
function tebligBelgesiVerileriniOlustur(kayit, veri) {
  const duyuruAdim = kayit.surec.flatMap((a) => a.altAdimlar).find((a) => a.tip === 'duyuru');
  const tarih = duyuruAdim?.veri?.baslangicTarihi;
  const tarihGosterim = tarih ? new Date(tarih).toLocaleDateString('tr-TR') : '…/…/20….';

  const sabitAlicilar = ['İlgili Orman Teşkilatı', 'İlgili Tarım Reformu Teşkilatı', 'Tapu Müdürlüğü', 'Milli Emlak'];
  const secilenAlicilar = veri.aliciKurumlar || sabitAlicilar;
  const aliciSatirlari = [
    `${kayit.koyMahalle} Muhtarlığına`,
    `${kayit.ilce} Belediye Başkanlığına`,
    ...secilenAlicilar.map((a) => `${a}na`),
    ...(veri.digerKurumlar ? [veri.digerKurumlar] : []),
  ].join('\n');

  const govdeMetni = `4342 Sayılı Mera Kanunu gereği, ${tarihGosterim} tarihinde ${kayit.il} İli ${kayit.ilce} İlçesi ${kayit.koyMahalle} Köy/Mahallesinde Mera Komisyonu/Teknik Ekiplerince mera, yaylak, kışlak, otlak, umuma ait çayırların tespit ve tahdit çalışmalarına başlanacaktır.\n\n4342 Sayılı Mera Kanunu'nun 7 nci maddesi gereği başlama tarihi ile çalışma yapılacak yeri bildiren alanlarda mevcut mera, yaylak, kışlak, otlak ve umuma ait çayır alanları mevcut ise bu alanların durumunu belirten bilgi ve belgelerin, 4342 sayılı Mera Kanunu'nun 8 inci maddesi gereği tebliğden itibaren otuz gün içerisinde Komisyonumuza teslim edilmesi tebliğ olunur.`;

  return {
    baslik: 'TEBLİĞ BELGESİ (Ek-3)',
    aliciBasligi: aliciSatirlari,
    govdeMetni,
    tarihSatiri: '…../…../20..',
    imzaTipi: 'tek',
    imzaAltYazi: 'Komisyon Başkanı',
    altNot: 'Ek: Mera, Yaylak, Kışlak, Otlak, Umuma ait Çayır Bilgi Cetveli (Ek-3/a)',
  };
}

/** Adim TIPINE gore dogru veri-uretici fonksiyonu cagirir. */
async function adimDisaAktarVerisi(kayit, alt) {
  if (alt.tip === 'duyuruTutanagi') return duyuruTutanagiVerileriniOlustur(kayit, alt.veri || {});
  if (alt.tip === 'duyuru') return duyuruVerileriniOlustur(kayit, alt.veri || {});
  if (alt.tip === 'tebligBelgesi') return tebligBelgesiVerileriniOlustur(kayit, alt.veri || {});
  throw new Error('Bu adım için dışa aktarma henüz desteklenmiyor.');
}

async function adimBelgesiWordOlustur(v) {
  const cocuklar = [];

  if (v.aliciBasligi) {
    v.aliciBasligi.split('\n').forEach((satir) => {
      cocuklar.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: satir, size: 22, font: 'Times New Roman' })] }));
    });
    cocuklar.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  }

  cocuklar.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: v.baslik, bold: true, size: 28, font: 'Times New Roman' })] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 300 }, children: [new TextRun({ text: v.govdeMetni, size: 22, font: 'Times New Roman' })] }),
  );

  if (v.tarihSatiri) {
    cocuklar.push(new Paragraph({ alignment: v.imzaTipi === 'tek' ? AlignmentType.RIGHT : AlignmentType.LEFT, spacing: { after: 600 }, children: [new TextRun({ text: v.tarihSatiri, size: 22, font: 'Times New Roman' })] }));
  }

  const hucreKenarsiz = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

  if (v.imzaTipi === 'tek') {
    // Duyuru (Ek-1): SAGDA, TEK kisi, SADECE unvan (isim yazilmaz).
    const bosHucre = () => new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, borders: hucreKenarsiz, children: [new Paragraph('')] });
    cocuklar.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: [
        bosHucre(), bosHucre(),
        new TableCell({
          width: { size: 34, type: WidthType.PERCENTAGE }, borders: hucreKenarsiz,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.imzaAltYazi, bold: true, size: 22, font: 'Times New Roman' })] })],
        }),
      ] })],
    }));
  } else if (v.imzaTipi === 'dortlu') {
    // Duyuru Tutanağı (Ek-2): 4 ESIT SUTUN, gri imza cizgisi + "Adı
    // Soyadı"/"Ünvanı" etiketleri (BOS SABLON, elle doldurulur).
    const grisSinirAlt = { style: BorderStyle.SINGLE, size: 4, color: 'D8D8D8' };
    const imzaHucresi = () => new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, bottom: grisSinirAlt },
      margins: { bottom: 100 },
      children: [
        new Paragraph({ text: '' }), new Paragraph({ text: '' }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ' ', size: 22 })] }),
      ],
    });
    const etiketHucresi = () => new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE }, borders: hucreKenarsiz,
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Adı Soyadı', size: 18, color: GRI_RENK, font: 'Times New Roman' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ünvanı', size: 18, color: GRI_RENK, font: 'Times New Roman' })] }),
      ],
    });
    cocuklar.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [imzaHucresi(), imzaHucresi(), imzaHucresi(), imzaHucresi()] })] }));
    cocuklar.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [etiketHucresi(), etiketHucresi(), etiketHucresi(), etiketHucresi()] })] }));
  }

  if (v.altNot) {
    cocuklar.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: v.altNot, italics: true, size: 20, font: 'Times New Roman' })] }));
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children: cocuklar,
    }],
  });
  return Packer.toBuffer(doc);
}

function adimBelgesiPdfOlustur(v) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 } });
    const parcalar = [];
    doc.on('data', (c) => parcalar.push(c));
    doc.on('end', () => resolve(Buffer.concat(parcalar)));
    doc.on('error', reject);

    doc.registerFont('normal', FONT_NORMAL);
    doc.registerFont('kalin', FONT_KALIN);

    if (v.aliciBasligi) {
      doc.font('normal').fontSize(10).text(v.aliciBasligi);
      doc.moveDown(1);
    }

    doc.font('kalin').fontSize(13).text(v.baslik, { align: 'center' });
    doc.moveDown(1);
    doc.font('normal').fontSize(10).text(v.govdeMetni, { align: 'justify' });
    doc.moveDown(1.5);

    const sayfaGenisligi = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    if (v.tarihSatiri) {
      doc.text(v.tarihSatiri, { align: v.imzaTipi === 'tek' ? 'right' : 'left' });
      doc.moveDown(3);
    }

    if (v.imzaTipi === 'tek') {
      // Duyuru (Ek-1): SAGDA, TEK kisi, SADECE unvan.
      doc.font('kalin').fontSize(10).text(v.imzaAltYazi, { align: 'right' });
    } else if (v.imzaTipi === 'dortlu') {
      // Duyuru Tutanağı (Ek-2): 4 ESIT SUTUN, gri imza cizgisi + etiketler.
      const sutunGenisligi = sayfaGenisligi / 4;
      const cizgiY = doc.y + 30;
      doc.strokeColor('#D8D8D8').lineWidth(1);
      for (let i = 0; i < 4; i++) {
        const x1 = doc.page.margins.left + i * sutunGenisligi + 10;
        const x2 = doc.page.margins.left + (i + 1) * sutunGenisligi - 10;
        doc.moveTo(x1, cizgiY).lineTo(x2, cizgiY).stroke();
      }
      doc.fillColor('#999999').font('normal').fontSize(8);
      for (let i = 0; i < 4; i++) {
        const x = doc.page.margins.left + i * sutunGenisligi;
        doc.text('Adı Soyadı', x, cizgiY + 6, { width: sutunGenisligi, align: 'center' });
        doc.text('Ünvanı', x, cizgiY + 18, { width: sutunGenisligi, align: 'center' });
      }
      doc.fillColor('#000000');
    }

    if (v.altNot) {
      doc.moveDown(2);
      doc.font('normal').fontSize(9).text(v.altNot, { oblique: true });
    }

    doc.end();
  });
}

module.exports = { adimDisaAktarVerisi, adimBelgesiWordOlustur, adimBelgesiPdfOlustur };
