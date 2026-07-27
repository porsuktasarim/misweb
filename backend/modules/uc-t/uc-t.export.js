/**
 * uc-t.export.js
 *
 * 3T adimlarinin ürettigi resmi metinleri Word/PDF olarak disa
 * aktarir. GENEL AMACLI: { baslik, govdeMetni, tarihSatiri,
 * imzaAdSoyad, imzaUnvan, imzaAltYazi } seklinde veri alir, sayfayi
 * DIKEYDE UCE BOLUNMUS gibi dusunup imza bilgisini 3. (sag) sutunda
 * ORTALI gosterir - Ek-4ab'deki imza satiri deseniyle tutarli.
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

/** (Ek-2) DUYURU TUTANAĞI icin export verisini, KAYITLI 3T verisinden YENIDEN uretir. */
async function duyuruTutanagiVerileriniOlustur(kayit, veri) {
  let komisyon = null;
  if (veri.komisyonId) komisyon = await IlMeraKomisyonu.findById(veri.komisyonId);
  const yil = komisyon ? komisyon.yil : '20..';
  const tarihGosterim = veri.baslangicTarihi ? new Date(veri.baslangicTarihi).toLocaleDateString('tr-TR') : `…/…/${yil}`;
  const kurumListesi = [...(veri.gonderimKurumlari || []), ...(veri.digerKurumlar ? [veri.digerKurumlar] : [])].join(', ') || '……………………………';
  const vy = komisyon ? komisyon.uyeler.find((u) => u.kurumKod === 'valiYardimcisi') : null;
  const imzaAdSoyad = vy?.asilAdSoyad || '……………………………';

  const govdeMetni = `4342 Sayılı Mera Kanunu'na göre ${kayit.il} İli ${kayit.ilce} İlçesi ${kayit.koyMahalle} Köyü/Mahallesi sınırları içerisinde bulunan mera / yaylak / kışlak / otlak / çayırların tespit ve tahdit çalışmalarına ${tarihGosterim} tarihinde başlanacağını belirten duyuru, 4342 Sayılı Mera Kanunu'nun 7 nci maddesi gereği …/…/${yil} ile …/…/${yil} tarihleri arasında ilan edilmek ve ${kurumListesi}'na asılmak üzere ${kayit.il} İli Mera Komisyonundan teslim alınıp, belirtilen tarihler arasında usulüne uygun şekilde ilan yapıldığını gösterir işbu tutanak tarafımızdan düzenlenerek imza altına alınmıştır.`;

  return {
    baslik: 'DUYURU TUTANAĞI (Ek-2)',
    govdeMetni,
    tarihSatiri: `…../…../${yil}`,
    imzaAdSoyad, imzaUnvan: 'Vali Yardımcısı', imzaAltYazi: 'İl Mera Komisyonu Başkanı',
  };
}

/** (Ek-1) DUYURU icin export verisini uretir. */
function duyuruVerileriniOlustur(kayit, veri) {
  const tarihGosterim = veri.baslangicTarihi ? new Date(veri.baslangicTarihi).toLocaleDateString('tr-TR') : '…/…/20….';
  const govdeMetni = `4342 Sayılı Mera Kanunu gereği, ${tarihGosterim} tarihinde ${kayit.il} İli ${kayit.ilce} İlçesi ${kayit.koyMahalle} Köy/Mahallesinde Mera Komisyonu/Teknik Ekiplerince, mera, yaylak, kışlak, otlak, umuma ait çayırların tespit ve tahdit çalışmalarına başlanacaktır. 4342 Sayılı Mera Kanunu'nun 7 nci maddesi gereği ilan olunur.`;
  return { baslik: 'DUYURU (Ek-1)', govdeMetni, tarihSatiri: '', imzaAdSoyad: '', imzaUnvan: '', imzaAltYazi: '' };
}

/** Adim TIPINE gore dogru veri-uretici fonksiyonu cagirir. */
async function adimDisaAktarVerisi(kayit, alt) {
  if (alt.tip === 'duyuruTutanagi') return duyuruTutanagiVerileriniOlustur(kayit, alt.veri || {});
  if (alt.tip === 'duyuru') return duyuruVerileriniOlustur(kayit, alt.veri || {});
  throw new Error('Bu adım için dışa aktarma henüz desteklenmiyor.');
}

async function adimBelgesiWordOlustur(v) {
  const cocuklar = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: v.baslik, bold: true, size: 28, font: 'Times New Roman' })] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 300 }, children: [new TextRun({ text: v.govdeMetni, size: 22, font: 'Times New Roman' })] }),
  ];

  if (v.tarihSatiri) {
    cocuklar.push(new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: v.tarihSatiri, size: 22, font: 'Times New Roman' })] }));
  }

  if (v.imzaAdSoyad) {
    const hucreKenarsiz = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };
    const bosHucre = () => new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, borders: hucreKenarsiz, children: [new Paragraph('')] });
    cocuklar.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: [
        bosHucre(),
        bosHucre(),
        new TableCell({
          width: { size: 34, type: WidthType.PERCENTAGE },
          borders: hucreKenarsiz,
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.imzaAdSoyad, bold: true, size: 22, font: 'Times New Roman' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.imzaUnvan, size: 22, font: 'Times New Roman' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.imzaAltYazi, size: 22, font: 'Times New Roman' })] }),
          ],
        }),
      ] })],
    }));
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

    doc.font('kalin').fontSize(13).text(v.baslik, { align: 'center' });
    doc.moveDown(1);
    doc.font('normal').fontSize(10).text(v.govdeMetni, { align: 'justify' });
    doc.moveDown(1.5);

    if (v.tarihSatiri) {
      doc.text(v.tarihSatiri);
      doc.moveDown(3);
    }

    if (v.imzaAdSoyad) {
      const sayfaGenisligi = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const sutunGenisligi = sayfaGenisligi / 3;
      const ucuncuSutunX = doc.page.margins.left + sutunGenisligi * 2;
      const yPos = doc.y;
      doc.font('kalin').fontSize(10).text(v.imzaAdSoyad, ucuncuSutunX, yPos, { width: sutunGenisligi, align: 'center' });
      doc.font('normal').fontSize(10).text(v.imzaUnvan, ucuncuSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
      doc.text(v.imzaAltYazi, ucuncuSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
    }

    doc.end();
  });
}

module.exports = { adimDisaAktarVerisi, adimBelgesiWordOlustur, adimBelgesiPdfOlustur };
