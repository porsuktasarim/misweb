/**
 * pdf.exporter.js
 *
 * Ortak rapor contract'ini .pdf dosyasina cevirir. Her bolum kendi
 * basligiyla art arda yazilir.
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

    doc.fontSize(16).text(`${contract.modulAdi} Raporu`, { align: 'center' });
    doc.moveDown();

    for (const bolum of contract.bolumler) {
      const baslikMetni =
        `${bolum.baslik.il} / ${bolum.baslik.ilce}` +
        (bolum.baslik.mahalle ? ` / ${bolum.baslik.mahalle}` : '');

      doc.fontSize(14).text(baslikMetni, { underline: true });
      doc.moveDown(0.5);

      for (const isletmeci of bolum.isletmeciler) {
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
        doc.moveDown(0.3);
      }

      doc.fontSize(12).text(`${baslikMetni} - ${lang.ortak.toplam}: ${bolum.bolumToplami}`, {
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
