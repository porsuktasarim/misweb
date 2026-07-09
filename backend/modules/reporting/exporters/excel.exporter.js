/**
 * excel.exporter.js
 *
 * Ortak rapor contract'ini .xlsx dosyasina cevirir.
 * BBHB/CKS bilmez, sadece contract seklini bilir.
 */

const ExcelJS = require('exceljs');
const lang = require('../../../../config/lang/tr');

async function contractToExcel(contract) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(contract.modulAdi);

  // Baslik
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value =
    `${contract.baslik.il} / ${contract.baslik.ilce}` +
    (contract.baslik.mahalle ? ` / ${contract.baslik.mahalle}` : '');
  sheet.getCell('A1').font = { bold: true, size: 14 };

  sheet.addRow([]);

  // Tablo basliklari
  const basliklar = [
    lang.ortak.isletmeci,
    lang.ortak.grup,
    lang.ortak.cins,
    lang.ortak.adet,
    lang.ortak.katsayi,
    contract.modulAdi,
  ];
  const baslikRow = sheet.addRow(basliklar);
  baslikRow.font = { bold: true };

  // Isletmeci detaylari
  for (const isletmeci of contract.isletmeciler) {
    for (const kayit of isletmeci.kayitlar) {
      sheet.addRow([
        isletmeci.isletmeciAdi,
        kayit.grup,
        kayit.kategori,
        kayit.adet,
        kayit.katsayi,
        kayit.deger,
      ]);
    }
    const toplamRow = sheet.addRow([
      `${isletmeci.isletmeciAdi} - ${lang.ortak.toplam}`,
      '',
      '',
      '',
      '',
      isletmeci.isletmeciToplami,
    ]);
    toplamRow.font = { italic: true };
  }

  sheet.addRow([]);
  const genelToplamRow = sheet.addRow([
    lang.ortak.genelToplam,
    '',
    '',
    '',
    '',
    contract.genelToplam,
  ]);
  genelToplamRow.font = { bold: true };

  // Ozet
  sheet.addRow([]);
  sheet.addRow([lang.ortak.ozet]).font = { bold: true };
  for (const [anahtar, deger] of Object.entries(contract.ozet)) {
    sheet.addRow([anahtar, deger]);
  }

  // Siniflandirma kriterleri (rapor sonunda)
  sheet.addRow([]);
  sheet.addRow([lang.ortak.siniflandirmaKriterleri]).font = { bold: true };
  sheet.addRow([lang.ortak.grup, lang.ortak.cins, lang.ortak.katsayi]).font = {
    bold: true,
  };
  for (const kriter of contract.siniflandirmaKriterleri) {
    sheet.addRow([kriter.grup, kriter.kategori, kriter.katsayi]);
  }

  sheet.columns.forEach((col) => {
    col.width = 22;
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = { contractToExcel };
