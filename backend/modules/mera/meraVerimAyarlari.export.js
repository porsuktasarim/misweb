/**
 * meraVerimAyarlari.export.js
 *
 * Mera Verim Ayarlari'ndaki 4 tablo (Tablo-1/2/3, Iller) icin Excel
 * SABLONU uretir - kullanici bunu indirip doldurup GERI YUKLEYEBILIR.
 */

const ExcelJS = require('exceljs');

const RENK_BASLIK = 'FF3F3F3C';

function baslikSatiriUygula(sheet, basliklar, genislikler) {
  sheet.columns = basliklar.map((b, i) => ({ header: b, width: genislikler[i] }));
  const satir = sheet.getRow(1);
  satir.font = { name: 'Times New Roman', bold: true, color: { argb: 'FFFFFFFF' } };
  satir.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RENK_BASLIK } };
  satir.alignment = { vertical: 'middle', horizontal: 'center' };
}

async function yagisKusagiSablonuOlustur() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Veri');
  baslikSatiriUygula(sheet, ['Yağış (mm)', 'Çok İyi', 'İyi', 'Orta', 'Zayıf'], [14, 12, 12, 12, 12]);
  sheet.addRow(['200-350', 180, 135, 90, 45]);
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return workbook.xlsx.writeBuffer();
}

async function illerSablonuOlustur() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Veri');
  baslikSatiriUygula(sheet, ['İl', 'Yağış Kuşağı'], [16, 14]);
  sheet.addRow(['İstanbul', '800-950']);
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return workbook.xlsx.writeBuffer();
}

module.exports = { yagisKusagiSablonuOlustur, illerSablonuOlustur };
