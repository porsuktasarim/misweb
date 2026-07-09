/**
 * excel.exporter.js
 *
 * Ortak rapor contract'ini .xlsx dosyasina cevirir.
 * Birden fazla bolum varsa, her bolum kendi baslik satirlariyla
 * ayni sayfada alt alta yazilir.
 */

const ExcelJS = require('exceljs');
const lang = require('../../../../config/lang/tr');

async function contractToExcel(contract) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(contract.modulAdi);

  for (const bolum of contract.bolumler) {
    const baslikMetni =
      `${bolum.baslik.il} / ${bolum.baslik.ilce}` +
      (bolum.baslik.mahalle ? ` / ${bolum.baslik.mahalle}` : '');

    const baslikRow = sheet.addRow([baslikMetni]);
    baslikRow.font = { bold: true, size: 14 };
    sheet.mergeCells(`A${baslikRow.number}:F${baslikRow.number}`);

    sheet.addRow([]);

    const tabloBaslikRow = sheet.addRow([
      lang.ortak.isletmeci,
      lang.ortak.grup,
      lang.ortak.cins,
      lang.ortak.adet,
      lang.ortak.katsayi,
      contract.modulAdi,
    ]);
    tabloBaslikRow.font = { bold: true };

    for (const isletmeci of bolum.isletmeciler) {
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

    const bolumToplamRow = sheet.addRow([
      `${baslikMetni} - ${lang.ortak.toplam}`,
      '',
      '',
      '',
      '',
      bolum.bolumToplami,
    ]);
    bolumToplamRow.font = { bold: true };

    sheet.addRow([]);
    sheet.addRow([]);
  }

  const genelToplamRow = sheet.addRow([
    lang.ortak.genelToplam,
    '',
    '',
    '',
    '',
    contract.genelToplam,
  ]);
  genelToplamRow.font = { bold: true, size: 12 };

  // Ozet
  sheet.addRow([]);
  sheet.addRow([lang.ortak.ozet]).font = { bold: true };
  for (const [anahtar, deger] of Object.entries(contract.ozet)) {
    sheet.addRow([anahtar, deger]);
  }

  // Siniflandirma kriterleri (rapor sonunda, TEK sefer - tum bolumler icin ortak)
  sheet.addRow([]);
  sheet.addRow([lang.ortak.siniflandirmaKriterleri]).font = { bold: true };
  sheet.addRow([lang.ortak.grup, lang.ortak.cins, lang.ortak.katsayi]).font = {
    bold: true,
  };
  for (const kriter of contract.siniflandirmaKriterleri) {
    sheet.addRow([kriter.grup, kriter.kategori, kriter.katsayi]);
  }

  sheet.columns.forEach((col) => {
    col.width = 24;
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = { contractToExcel };
