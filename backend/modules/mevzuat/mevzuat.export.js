/**
 * mevzuat.export.js
 *
 * Bicimlendirilmis mevzuat icerigini (bkz. mevzuat.icerik-bicimlendir.js
 * ciktisi: <p style="...">, <b>, <i>, <br/> etiketleri) Word (.docx) ve
 * PDF olarak disa aktarir.
 *
 * NOT: PDF'te sadece KALIN (DejaVuSerif-Bold) destekleniyor - projede
 * hazir bir ITALIK font dosyasi olmadigi icin İTALİK stiller PDF'te
 * normal gorunur (Word'de dogru sekilde italik cikar).
 */

const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
} = require('docx');
const PDFDocument = require('pdfkit');

const FONT_NORMAL = path.join(__dirname, '../reporting/sablonlar/fontlar/DejaVuSerif.ttf');
const FONT_KALIN = path.join(__dirname, '../reporting/sablonlar/fontlar/DejaVuSerif-Bold.ttf');

/** <b>/<i> disindaki metni DUZ, iceridekini BOLD/ITALIC "run" dizisine cevirir. */
function calismaParcalariniCikar(parcaHtml) {
  const runlar = [];
  const regex = /<b>(.*?)<\/b>|<i>(.*?)<\/i>|([^<]+)/gs;
  let m;
  while ((m = regex.exec(parcaHtml)) !== null) {
    const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    if (m[1] !== undefined) runlar.push({ text: decode(m[1]), bold: true });
    else if (m[2] !== undefined) runlar.push({ text: decode(m[2]), italic: true });
    else if (m[3] !== undefined && m[3] !== '') runlar.push({ text: decode(m[3]) });
  }
  return runlar;
}

/**
 * belgeYapisiniBicimlendir CIKTISINI (bir dizi <p style="...">...</p>)
 * { stil, satirlar: [[{text,bold,italic}, ...], ...] } listesine cevirir
 * (her <p> icindeki <br/> ayri "satir" olur - Word/PDF'te ayri satir).
 */
function htmlIParagraflaraAyir(html) {
  const pRegex = /<p style="([^"]*)">([\s\S]*?)<\/p>/g;
  const paragraflar = [];
  let m;
  while ((m = pRegex.exec(html)) !== null) {
    const stilMetni = m[1];
    const icerik = m[2];
    const baslikMi = stilMetni.includes('font-size');
    const satirlar = icerik.split(/<br\s*\/?>/gi).map(calismaParcalariniCikar).filter((s) => s.length > 0);
    paragraflar.push({ baslikMi, satirlar });
  }
  return paragraflar;
}

async function mevzuatWordOlustur(mevzuat) {
  const paragraflar = htmlIParagraflaraAyir(mevzuat.htmlIcerik || '');
  const docParagraflari = [];

  paragraflar.forEach((p) => {
    p.satirlar.forEach((satir, i) => {
      docParagraflari.push(new Paragraph({
        spacing: { before: p.baslikMi ? 0 : (i === 0 ? 200 : 0), after: p.baslikMi ? 300 : (i === satir.length - 1 ? 200 : 60) },
        alignment: p.baslikMi ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
        children: satir.map((run) => new TextRun({
          text: run.text,
          bold: p.baslikMi || run.bold,
          italics: run.italic,
          size: p.baslikMi ? 28 : 22,
          font: 'Times New Roman',
        })),
      }));
    });
  });

  if (docParagraflari.length === 0) {
    docParagraflari.push(new Paragraph({ children: [new TextRun({ text: mevzuat.icerik || 'İçerik bulunamadı.', font: 'Times New Roman' })] }));
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children: docParagraflari,
    }],
  });

  return Packer.toBuffer(doc);
}

function mevzuatPdfOlustur(mevzuat) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 }, bufferPages: true });
    const parcalar = [];
    doc.on('data', (c) => parcalar.push(c));
    doc.on('end', () => resolve(Buffer.concat(parcalar)));
    doc.on('error', reject);

    doc.registerFont('normal', FONT_NORMAL);
    doc.registerFont('kalin', FONT_KALIN);

    const paragraflar = htmlIParagraflaraAyir(mevzuat.htmlIcerik || '');

    if (paragraflar.length === 0) {
      doc.font('normal').fontSize(10).text(mevzuat.icerik || 'İçerik bulunamadı.');
      doc.end();
      return;
    }

    paragraflar.forEach((p) => {
      p.satirlar.forEach((satir) => {
        if (p.baslikMi) {
          doc.font('kalin').fontSize(14);
          doc.text(satir.map((r) => r.text).join(''), { align: 'center' });
          doc.moveDown(0.7);
          return;
        }
        doc.fontSize(10);
        satir.forEach((run, i) => {
          // NOT: italik icin ayri font dosyasi yok - kalin/normal ile sinirli.
          doc.font(run.bold ? 'kalin' : 'normal');
          doc.text(run.text, { continued: i < satir.length - 1, align: 'justify' });
        });
        doc.moveDown(0.3);
      });
      doc.moveDown(0.2);
    });

    doc.end();
  });
}

module.exports = { mevzuatWordOlustur, mevzuatPdfOlustur };
