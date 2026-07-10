/**
 * cks.excel.exporter.js
 *
 * Ek-4/a "Tespit ve Tahdit Çalışmalarına Esas Olan Çiftçi Aile ve Geçim
 * Kaynağı Bildirim Cetveli" - kullanicinin resmi form fotografina
 * birebir uygun yapida, gri ton renk semasi + Times New Roman.
 *
 * Sutunlar: Sıra No | Çiftçi Ailesi Adı Soyadı |
 *   Hayvan Varlığı | Yem Bitkisi | Sebze/Meyve | Hububat/Yağlı Tohumlar |
 *   Tarım | Hayvancılık
 * (Hayvan Varlığı ve Hayvancılık CKS'de HIC doldurulmaz - o veri BBHB
 * kaynaklidir.)
 */

const ExcelJS = require('exceljs');

const RENK = { koyu: 'FF3F3F3C', orta: 'FF6E6E68', seritKoyu: 'FFF4F4F2', imzaFiligran: 'FFCCCCCC' };
const YAZI_TIPI = 'Times New Roman';
const BIR_CM_INC = 1 / 2.54;
const TOPLAM_SUTUN = 8; // A..H

function hucreStil(hucre, { fill, bold = false, renkBeyaz = false, align = 'center', boyut = 9, renk } = {}) {
  hucre.font = { name: YAZI_TIPI, size: boyut, bold, color: { argb: renk || (renkBeyaz ? 'FFFFFFFF' : 'FF1C1E1B') } };
  if (fill) hucre.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  hucre.alignment = { vertical: 'middle', horizontal: align, wrapText: true };
}

async function contractToCksExcel(cks) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('EK-4a');

  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    margins: { left: BIR_CM_INC, right: BIR_CM_INC, top: BIR_CM_INC, bottom: BIR_CM_INC, header: 0, footer: 0.2 },
  };
  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 30;
  for (let i = 3; i <= TOPLAM_SUTUN; i++) sheet.getColumn(i).width = 15;

  const bilgi = `${cks.il} ${cks.ilce} ${cks.koyMahalle}`;
  sheet.headerFooter.oddFooter = `&8&C${bilgi}\n&P/&N`;

  // ---- BAŞLIK ----
  const r1 = sheet.addRow(['( Ek-4/a )']);
  hucreStil(r1.getCell(1), { align: 'left', bold: true });
  const r2 = sheet.addRow(['TESPİT VE TAHDİT ÇALIŞMALARINA ESAS OLAN']);
  sheet.mergeCells(`A${r2.number}:H${r2.number}`);
  hucreStil(r2.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'center', boyut: 12 });
  const r3 = sheet.addRow(['ÇİFTÇİ AİLE VE GEÇİM KAYNAĞI BİLDİRİM CETVELİ']);
  sheet.mergeCells(`A${r3.number}:H${r3.number}`);
  hucreStil(r3.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'center', boyut: 12 });
  sheet.addRow([]);

  const ili = sheet.addRow(['İli', '', cks.il]);
  hucreStil(ili.getCell(1), { bold: true, align: 'left' });
  hucreStil(ili.getCell(3), { align: 'left' });
  const ilcesi = sheet.addRow(['İlçesi', '', cks.ilce]);
  hucreStil(ilcesi.getCell(1), { bold: true, align: 'left' });
  hucreStil(ilcesi.getCell(3), { align: 'left' });
  const koyu = sheet.addRow(['Köyü/Mahalle', '', cks.koyMahalle]);
  hucreStil(koyu.getCell(1), { bold: true, align: 'left' });
  hucreStil(koyu.getCell(3), { align: 'left' });
  if (cks.uretimYili) {
    const yil = sheet.addRow(['Üretim Yılı', '', cks.uretimYili]);
    hucreStil(yil.getCell(1), { bold: true, align: 'left' });
    hucreStil(yil.getCell(3), { align: 'left' });
  }
  sheet.addRow([]);

  // ---- TABLO BAŞLIKLARI (2 satır, gruplu) ----
  const grupRow = sheet.addRow([]);
  const altRow = sheet.addRow([]);

  grupRow.getCell(1).value = 'Sıra No';
  hucreStil(grupRow.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true });
  sheet.mergeCells(`A${grupRow.number}:A${altRow.number}`);

  grupRow.getCell(2).value = 'Adı Soyadı';
  hucreStil(grupRow.getCell(2), { fill: RENK.koyu, bold: true, renkBeyaz: true });
  sheet.mergeCells(`B${grupRow.number}:B${altRow.number}`);
  altRow.getCell(2).value = ''; // tek sutun - kullanicinin karariyla "Aile"+"Çiftçi Ailesi" birlestirildi

  grupRow.getCell(3).value = 'Ekilişi (da) ve Hayvan Varlığı (BBHB)';
  hucreStil(grupRow.getCell(3), { fill: RENK.orta, bold: true, renkBeyaz: true });
  sheet.mergeCells(`C${grupRow.number}:F${grupRow.number}`);
  ['Hayvan Varlığı', 'Yem Bitkisi', 'Sebze/Meyve', 'Hububat/\nYağlı Tohumlar'].forEach((baslik, i) => {
    const hucre = altRow.getCell(3 + i);
    hucre.value = baslik;
    hucreStil(hucre, { fill: RENK.orta, bold: true, renkBeyaz: true });
  });

  grupRow.getCell(7).value = 'Geçim Kaynağı';
  hucreStil(grupRow.getCell(7), { fill: RENK.orta, bold: true, renkBeyaz: true });
  sheet.mergeCells(`G${grupRow.number}:H${grupRow.number}`);
  ['Tarım', 'Hayvancılık'].forEach((baslik, i) => {
    const hucre = altRow.getCell(7 + i);
    hucre.value = baslik;
    hucreStil(hucre, { fill: RENK.orta, bold: true, renkBeyaz: true });
  });

  // ---- VERİ SATIRLARI ----
  cks.ciftciler.forEach((c, i) => {
    const zemin = i % 2 === 0 ? 'FFFFFFFF' : RENK.seritKoyu;
    const row = sheet.addRow([
      i + 1,
      c.isletmeciAdi,
      '', // Hayvan Varlığı - CKS'de doldurulmaz
      c.yemBitkisi || '',
      c.sebzeMeyve || '',
      c.hububatYagli || '',
      c.tarim ? 'X' : '',
      '', // Hayvancılık - CKS'de doldurulmaz
    ]);
    row.eachCell({ includeEmpty: true }, (h, sutunNo) => {
      hucreStil(h, { fill: zemin, align: sutunNo === 2 ? 'left' : 'center' });
    });
  });

  sheet.addRow([]);

  // ---- NOTLAR ----
  const notRow = sheet.addRow(['Not:', '1. Teknik Ekip Üyelerince İmzalanacaktır.']);
  hucreStil(notRow.getCell(1), { bold: true, align: 'left' });
  sheet.mergeCells(`B${notRow.number}:H${notRow.number}`);
  hucreStil(notRow.getCell(2), { align: 'left' });
  const notRow2 = sheet.addRow(['', '2. Muhtar ve İhtiyar Heyetince İmzalanarak Mühürlenecektir.']);
  sheet.mergeCells(`B${notRow2.number}:H${notRow2.number}`);
  hucreStil(notRow2.getCell(2), { align: 'left' });
  sheet.addRow([]);
  sheet.addRow([]);

  // ---- İMZA BLOKLARI ----
  function imzaBlokuEkle(baslikMetni, imzacilarGirdi) {
    const baslikSatiri = sheet.addRow([baslikMetni]);
    sheet.mergeCells(`A${baslikSatiri.number}:H${baslikSatiri.number}`);
    hucreStil(baslikSatiri.getCell(1), { fill: RENK.orta, bold: true, renkBeyaz: true, align: 'left' });

    const imzacilar = imzacilarGirdi && imzacilarGirdi.length > 0 ? imzacilarGirdi : [{ adSoyad: '', unvan: '' }];
    const n = imzacilar.length;
    const filigranRow = sheet.addRow([]);
    const adRow = sheet.addRow([]);
    const unvanRow = sheet.addRow([]);
    filigranRow.height = 24;

    imzacilar.forEach((imzaci, i) => {
      const baslaSutun = Math.floor((i * TOPLAM_SUTUN) / n) + 1;
      const bitisSutun = Math.max(Math.floor(((i + 1) * TOPLAM_SUTUN) / n), baslaSutun);
      const baslaHarf = sheet.getColumn(baslaSutun).letter;
      const bitisHarf = sheet.getColumn(bitisSutun).letter;

      if (bitisHarf !== baslaHarf) sheet.mergeCells(`${baslaHarf}${filigranRow.number}:${bitisHarf}${filigranRow.number}`);
      hucreStil(filigranRow.getCell(baslaSutun), { renk: RENK.imzaFiligran, bold: true, boyut: 13, align: n === 1 ? 'left' : 'center' });
      filigranRow.getCell(baslaSutun).value = 'İMZA';

      if (bitisHarf !== baslaHarf) sheet.mergeCells(`${baslaHarf}${adRow.number}:${bitisHarf}${adRow.number}`);
      hucreStil(adRow.getCell(baslaSutun), { bold: true, align: n === 1 ? 'left' : 'center' });
      adRow.getCell(baslaSutun).value = imzaci.adSoyad || '';

      if (bitisHarf !== baslaHarf) sheet.mergeCells(`${baslaHarf}${unvanRow.number}:${bitisHarf}${unvanRow.number}`);
      hucreStil(unvanRow.getCell(baslaSutun), { align: n === 1 ? 'left' : 'center' });
      unvanRow.getCell(baslaSutun).value = imzaci.unvan || '';
    });
    sheet.addRow([]);
  }

  imzaBlokuEkle('TEKNİK EKİP ÜYELERİ', cks.teknikEkipImzacilari);
  imzaBlokuEkle('MUHTAR VE İHTİYAR HEYETİ', cks.muhtarHeyetiImzacilari);

  return workbook.xlsx.writeBuffer();
}

module.exports = { contractToCksExcel };
