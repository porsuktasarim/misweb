/**
 * pdf.exporter.js
 *
 * Ortak rapor contract'ini .pdf dosyasina cevirir (pdfkit ile).
 */

const PDFDocument = require('pdfkit');
const lang = require('../../../../config/lang/tr');

async function contractToPdf(contract) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const parcalar = [];
    doc.on('data', (parca) => parcalar.push(parca));
    doc.on('end', () => resolve(Buffer.concat(parcalar)));
    doc.on('error', reject);

    const baslikMetni =
      `${contract.baslik.il} / ${contract.baslik.ilce}` +
      (contract.baslik.mahalle ? ` / ${contract.baslik.mahalle}` : '');

    doc.fontSize(16).text(baslikMetni, { align: 'center' });
    doc.moveDown();
    doc.fontSize(13).text(`${contract.modulAdi} Raporu`);
    doc.moveDown();

    for (const isletmeci of contract.isletmeciler) {
      doc.fontSize(12).text(isletmeci.isletmeciAdi, { underline: true });
      doc.fontSize(10);
      for (const k of isletmeci.kayitlar) {
        doc.text(
          `${k.grup} - ${k.kategori} | ${lang.ortak.adet}: ${k.adet} | ${lang.ortak.katsayi}: ${k.katsayi} | ${contract.modulAdi}: ${k.deger}`
        );
      }
      doc.fontSize(11).text(`${lang.ortak.toplam}: ${isletmeci.isletmeciToplami}`, {
        align: 'right',
      });
      doc.moveDown();
    }

    doc.fontSize(13).text(`${lang.ortak.genelToplam}: ${contract.genelToplam}`, {
      align: 'right',
    });
    doc.moveDown();

    doc.fontSize(12).text(lang.ortak.siniflandirmaKriterleri, { underline: true });
    doc.fontSize(9);
    for (const kriter of contract.siniflandirmaKriterleri) {
      doc.text(`${kriter.grup} - ${kriter.kategori}: ${kriter.katsayi}`);
    }

    doc.end();
  });
}

module.exports = { contractToPdf };
