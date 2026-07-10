/**
 * cks.excel.exporter.js
 *
 * Ek-4/a formu. BBHB ile AYNI olcu standardi: tum sutunlar 1cm, tum
 * satirlar 0.45cm. Adi Soyadi alani (genis metin gerektirdigi icin)
 * TEK genis sutun DEGIL, 8 adet 1cm sutunun BIRLESTIRILMESIYLE
 * olusturulur - BBHB'deki isletmeci adi alaniyla AYNI mantik.
 *
 * Sutun duzeni: A=Sira No, B-I=Adi Soyadi (8 birlesik), J=Hayvan
 * Varligi, K=Yem Bitkisi, L=Sebze/Meyve, M=Hububat/Yagli Tohumlar,
 * N=Tarim, O=Hayvancilik.
 */

const ExcelJS = require('exceljs');
const { cmSutunGenisligi, cmSatirYuksekligiPuan } = require('../sablonlar/excel-birimler');

const RENK = { koyu: 'FF3F3F3C', orta: 'FF6E6E68', seritKoyu: 'FFF4F4F2', imzaFiligran: 'FFCCCCCC' };
const YAZI_TIPI = 'Times New Roman';
const YAZI_BOYUTU = 7;
const SATIR_YUKSEKLIGI = cmSatirYuksekligiPuan(0.45);
const SUTUN_GENISLIGI = cmSutunGenisligi(1);
const BIR_CM_INC = 1 / 2.54;

const ADI_SOYADI_BASLANGIC = 2; // B
const ADI_SOYADI_SUTUN_SAYISI = 8;
const ADI_SOYADI_BITIS = ADI_SOYADI_BASLANGIC + ADI_SOYADI_SUTUN_SAYISI - 1; // I (9)
const HAYVAN_VARLIGI = ADI_SOYADI_BITIS + 1;     // J (10)
const YEM_BITKISI = HAYVAN_VARLIGI + 1;           // K (11)
const SEBZE_MEYVE = YEM_BITKISI + 1;              // L (12)
const HUBUBAT_YAGLI = SEBZE_MEYVE + 1;            // M (13)
const TARIM = HUBUBAT_YAGLI + 1;                  // N (14)
const HAYVANCILIK = TARIM + 1;                    // O (15)
const TOPLAM_SUTUN = HAYVANCILIK;                 // 15

function sutunHarfi(sheet, index) {
  return sheet.getColumn(index).letter;
}

function adiSoyadiBirlestir(sheet, satirNo1, satirNo2 = satirNo1) {
  sheet.mergeCells(`${sutunHarfi(sheet, ADI_SOYADI_BASLANGIC)}${satirNo1}:${sutunHarfi(sheet, ADI_SOYADI_BITIS)}${satirNo2}`);
}

function hucreStil(hucre, { fill, bold = false, renkBeyaz = false, align = 'center', kaydir = true, renk } = {}) {
  hucre.font = { name: YAZI_TIPI, size: YAZI_BOYUTU, bold, color: { argb: renk || (renkBeyaz ? 'FFFFFFFF' : 'FF1C1E1B') } };
  if (fill) hucre.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  hucre.alignment = { vertical: 'middle', horizontal: align, wrapText: kaydir };
}

async function contractToCksExcel(cks) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('EK-4a');

  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: BIR_CM_INC, right: BIR_CM_INC, top: BIR_CM_INC, bottom: BIR_CM_INC, header: 0, footer: 0.2 },
  };
  for (let i = 1; i <= TOPLAM_SUTUN; i++) sheet.getColumn(i).width = SUTUN_GENISLIGI;

  const bilgi = `${cks.il} ${cks.ilce} ${cks.koyMahalle}`;
  sheet.headerFooter.oddFooter = `&8&C${bilgi}\n&P/&N`;

  // ---- BAŞLIK ----
  const r1 = sheet.addRow(['( Ek-4/a )']);
  hucreStil(r1.getCell(1), { align: 'left', bold: true });
  const r2 = sheet.addRow(['TESPİT VE TAHDİT ÇALIŞMALARINA ESAS OLAN']);
  sheet.mergeCells(`A${r2.number}:${sutunHarfi(sheet, TOPLAM_SUTUN)}${r2.number}`);
  hucreStil(r2.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'center' });
  const r3 = sheet.addRow(['ÇİFTÇİ AİLE VE GEÇİM KAYNAĞI BİLDİRİM CETVELİ']);
  sheet.mergeCells(`A${r3.number}:${sutunHarfi(sheet, TOPLAM_SUTUN)}${r3.number}`);
  hucreStil(r3.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'center' });
  sheet.addRow([]);

  [['İli', cks.il], ['İlçesi', cks.ilce], ['Köyü/Mahalle', cks.koyMahalle], ...(cks.uretimYili ? [['Üretim Yılı', cks.uretimYili]] : [])].forEach(([etiket, deger]) => {
    const row = sheet.addRow([etiket, '', deger]);
    hucreStil(row.getCell(1), { bold: true, align: 'left' });
    hucreStil(row.getCell(3), { align: 'left' });
  });
  sheet.addRow([]);

  // ---- TABLO BAŞLIKLARI (2 satır, gruplu - yatay+dikey birleşimler) ----
  const grupRow = sheet.addRow([]);
  const altRow = sheet.addRow([]);

  grupRow.getCell(1).value = 'Sıra\nNo';
  hucreStil(grupRow.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true });
  sheet.mergeCells(`A${grupRow.number}:A${altRow.number}`); // dikey birlesim

  grupRow.getCell(ADI_SOYADI_BASLANGIC).value = 'İkamet Eden Aile Temsilcisinin\nAdı Soyadı (Aile)';
  hucreStil(grupRow.getCell(ADI_SOYADI_BASLANGIC), { fill: RENK.koyu, bold: true, renkBeyaz: true });
  adiSoyadiBirlestir(sheet, grupRow.number, altRow.number); // yatay + dikey birlesim (8 sutun x 2 satir)

  grupRow.getCell(HAYVAN_VARLIGI).value = 'Ekilişi (da) ve Hayvan Varlığı (BBHB)';
  hucreStil(grupRow.getCell(HAYVAN_VARLIGI), { fill: RENK.orta, bold: true, renkBeyaz: true });
  sheet.mergeCells(`${sutunHarfi(sheet, HAYVAN_VARLIGI)}${grupRow.number}:${sutunHarfi(sheet, HUBUBAT_YAGLI)}${grupRow.number}`); // yatay birlesim
  ['Hayvan\nVarlığı', 'Yem\nBitkisi', 'Sebze/\nMeyve', 'Hububat/\nYağlı Tohumlar'].forEach((baslik, i) => {
    const hucre = altRow.getCell(HAYVAN_VARLIGI + i);
    hucre.value = baslik;
    hucreStil(hucre, { fill: RENK.orta, bold: true, renkBeyaz: true });
  });

  grupRow.getCell(TARIM).value = 'Geçim Kaynağı';
  hucreStil(grupRow.getCell(TARIM), { fill: RENK.orta, bold: true, renkBeyaz: true });
  sheet.mergeCells(`${sutunHarfi(sheet, TARIM)}${grupRow.number}:${sutunHarfi(sheet, HAYVANCILIK)}${grupRow.number}`); // yatay birlesim
  ['Tarım', 'Hayvancılık'].forEach((baslik, i) => {
    const hucre = altRow.getCell(TARIM + i);
    hucre.value = baslik;
    hucreStil(hucre, { fill: RENK.orta, bold: true, renkBeyaz: true });
  });

  // ---- VERİ SATIRLARI ----
  cks.ciftciler.forEach((c, i) => {
    const zemin = i % 2 === 0 ? 'FFFFFFFF' : RENK.seritKoyu;
    const row = sheet.addRow([
      i + 1, c.isletmeciAdi,
      ...new Array(ADI_SOYADI_SUTUN_SAYISI - 1).fill(''),
      '', c.yemBitkisi || '', c.sebzeMeyve || '', c.hububatYagli || '', c.tarim ? 'X' : '', '',
    ]);
    adiSoyadiBirlestir(sheet, row.number); // her veri satirinda yatay birlesim

    row.eachCell({ includeEmpty: true }, (hucre, sutunNo) => {
      // Adi Soyadi birlesik alaninda (B:I) sadece master (B) hucreyi isle -
      // digerlerini yazarsak paylasilan stil nesnesi ezilir.
      if (sutunNo > ADI_SOYADI_BASLANGIC && sutunNo <= ADI_SOYADI_BITIS) return;
      hucreStil(hucre, {
        fill: zemin,
        align: sutunNo === ADI_SOYADI_BASLANGIC ? 'left' : 'center',
        kaydir: sutunNo !== ADI_SOYADI_BASLANGIC,
      });
    });
  });

  sheet.addRow([]);

  // ---- NOTLAR ----
  const notRow = sheet.addRow(['Not:', '1. Teknik Ekip Üyelerince İmzalanacaktır.']);
  hucreStil(notRow.getCell(1), { bold: true, align: 'left' });
  sheet.mergeCells(`B${notRow.number}:${sutunHarfi(sheet, TOPLAM_SUTUN)}${notRow.number}`);
  hucreStil(notRow.getCell(2), { align: 'left' });
  const notRow2 = sheet.addRow(['', '2. Muhtar ve İhtiyar Heyetince İmzalanarak Mühürlenecektir.']);
  sheet.mergeCells(`B${notRow2.number}:${sutunHarfi(sheet, TOPLAM_SUTUN)}${notRow2.number}`);
  hucreStil(notRow2.getCell(2), { align: 'left' });
  sheet.addRow([]);
  sheet.addRow([]);

  // ---- İMZA BLOKLARI ----
  function imzaBlokuEkle(baslikMetni, imzacilarGirdi) {
    const baslikSatiri = sheet.addRow([baslikMetni]);
    sheet.mergeCells(`A${baslikSatiri.number}:${sutunHarfi(sheet, TOPLAM_SUTUN)}${baslikSatiri.number}`);
    hucreStil(baslikSatiri.getCell(1), { fill: RENK.orta, bold: true, renkBeyaz: true, align: 'left' });

    const imzacilar = imzacilarGirdi && imzacilarGirdi.length > 0 ? imzacilarGirdi : [{ adSoyad: '', unvan: '' }];
    const n = imzacilar.length;
    const filigranRow = sheet.addRow([]);
    const adRow = sheet.addRow([]);
    const unvanRow = sheet.addRow([]);

    imzacilar.forEach((imzaci, i) => {
      const baslaSutun = Math.floor((i * TOPLAM_SUTUN) / n) + 1;
      const bitisSutun = Math.max(Math.floor(((i + 1) * TOPLAM_SUTUN) / n), baslaSutun);
      const baslaHarf = sheet.getColumn(baslaSutun).letter;
      const bitisHarf = sheet.getColumn(bitisSutun).letter;
      const align = n === 1 ? 'left' : 'center';

      if (bitisHarf !== baslaHarf) sheet.mergeCells(`${baslaHarf}${filigranRow.number}:${bitisHarf}${filigranRow.number}`);
      hucreStil(filigranRow.getCell(baslaSutun), { renk: RENK.imzaFiligran, bold: true, align });
      filigranRow.getCell(baslaSutun).value = 'İMZA';

      if (bitisHarf !== baslaHarf) sheet.mergeCells(`${baslaHarf}${adRow.number}:${bitisHarf}${adRow.number}`);
      hucreStil(adRow.getCell(baslaSutun), { bold: true, align });
      adRow.getCell(baslaSutun).value = imzaci.adSoyad || '';

      if (bitisHarf !== baslaHarf) sheet.mergeCells(`${baslaHarf}${unvanRow.number}:${bitisHarf}${unvanRow.number}`);
      hucreStil(unvanRow.getCell(baslaSutun), { align });
      unvanRow.getCell(baslaSutun).value = imzaci.unvan || '';
    });
    sheet.addRow([]);
  }

  imzaBlokuEkle('TEKNİK EKİP ÜYELERİ', cks.teknikEkipImzacilari);
  imzaBlokuEkle('MUHTAR VE İHTİYAR HEYETİ', cks.muhtarHeyetiImzacilari);

  sheet.eachRow((row) => {
    if (!row.height) row.height = SATIR_YUKSEKLIGI;
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = { contractToCksExcel };
