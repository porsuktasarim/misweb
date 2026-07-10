/**
 * ek4ab.excel.exporter.js
 *
 * Ek-4ab "Tespit ve Tahdit Çalışmalarına Esas Olan Çiftçi Aile, Geçim
 * Kaynağı ve Hayvan Varlığı Bildirim Cetveli" - BBHB (Ek-4/b) ve CKS
 * (Ek-4/a) verilerinin TEK tabloda birlesimi.
 *
 * Sutun duzeni (kullanicinin acik tarifi):
 *   A       (1)  : Sıra No
 *   B-I     (8)  : Adı Soyadı (Çiftçi Ailesi)
 *   J-K     (2)  : Yem Bitkisi (da)
 *   L-M     (2)  : Sebze-Bağ (da)
 *   N-O     (2)  : Hububat (da)
 *   P       (1)  : Tarım (X)
 *   Q       (1)  : Hayvancılık (X)
 *   R       (1)  : Toplam Hayvan Varlığı (adet)
 *   S-AH    (16) : Hayvan kategorileri (bbhb-tablo-semasi.js ile AYNI sıra)
 *   AI-AJ   (2)  : Toplam BBHB
 *
 * Tum sutunlar 1cm, tum satirlar 0.45cm (BBHB/CKS standardiyla ayni).
 */

const ExcelJS = require('exceljs');
const { SUTUN_HARITASI } = require('../sablonlar/bbhb-tablo-semasi');
const { cmSutunGenisligi, cmSatirYuksekligiPuan } = require('../sablonlar/excel-birimler');

const RENK = { koyu: 'FF3F3F3C', orta: 'FF6E6E68', seritKoyu: 'FFF4F4F2', toplam: 'FFDCDCD7' };
const YAZI_TIPI = 'Times New Roman';
const YAZI_BOYUTU = 7;
const SATIR_YUKSEKLIGI = cmSatirYuksekligiPuan(0.45);
const SUTUN_GENISLIGI = cmSutunGenisligi(1);
const BIR_CM_INC = 1 / 2.54;

const SIRA_NO = 1;
const AD_SOYAD_BAS = 2;
const AD_SOYAD_SAYI = 8;
const AD_SOYAD_SON = AD_SOYAD_BAS + AD_SOYAD_SAYI - 1; // 9 (I)
const YEM_BITKISI_BAS = AD_SOYAD_SON + 1;   // 10 (J)
const YEM_BITKISI_SON = YEM_BITKISI_BAS + 1; // 11 (K)
const SEBZE_BAG_BAS = YEM_BITKISI_SON + 1;   // 12 (L)
const SEBZE_BAG_SON = SEBZE_BAG_BAS + 1;     // 13 (M)
const HUBUBAT_BAS = SEBZE_BAG_SON + 1;       // 14 (N)
const HUBUBAT_SON = HUBUBAT_BAS + 1;         // 15 (O)
const TARIM = HUBUBAT_SON + 1;               // 16 (P)
const HAYVANCILIK = TARIM + 1;               // 17 (Q)
const TOPLAM_HAYVAN = HAYVANCILIK + 1;       // 18 (R)
const HAYVAN_BAS = TOPLAM_HAYVAN + 1;        // 19 (S)
const TUM_ALTLAR = SUTUN_HARITASI.flatMap((g) => g.altlar.map((a) => ({ ...a, grupKodu: g.grup })));
const HAYVAN_SON = HAYVAN_BAS + TUM_ALTLAR.length - 1; // 34 (AH)
const TOPLAM_BBHB_BAS = HAYVAN_SON + 1;      // 35 (AI)
const TOPLAM_BBHB_SON = TOPLAM_BBHB_BAS + 1; // 36 (AJ)
const SON_SUTUN = TOPLAM_BBHB_SON;

function sutunHarfi(sheet, index) {
  return sheet.getColumn(index).letter;
}

function hucreStil(hucre, { fill, bold = false, renkBeyaz = false, align = 'center', kaydir = true, numFormat } = {}) {
  hucre.font = { name: YAZI_TIPI, size: YAZI_BOYUTU, bold, color: { argb: renkBeyaz ? 'FFFFFFFF' : 'FF1C1E1B' } };
  if (fill) hucre.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  if (numFormat) hucre.numFmt = numFormat;
  hucre.alignment = { vertical: 'middle', horizontal: align, wrapText: kaydir };
}

/** Baslangic-bitis sutun (ve istege bagli satir) araligini birlestirip TEK stil uygular (master hucre ezilme hatasindan kacinir) */
function birlesikBaslikYaz(sheet, { satirBas, satirSon = satirBas, sutunBas, sutunSon = sutunBas, metin, fill, renkBeyaz = true }) {
  const hucre = sheet.getCell(satirBas, sutunBas);
  hucre.value = metin;
  hucreStil(hucre, { fill, bold: true, renkBeyaz });
  if (satirBas !== satirSon || sutunBas !== sutunSon) {
    sheet.mergeCells(satirBas, sutunBas, satirSon, sutunSon);
  }
}

async function contractToEk4abExcel(ek4ab) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Ek-4ab');

  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: BIR_CM_INC, right: BIR_CM_INC, top: BIR_CM_INC, bottom: BIR_CM_INC, header: 0, footer: 0.2 },
  };
  for (let i = 1; i <= SON_SUTUN; i++) sheet.getColumn(i).width = SUTUN_GENISLIGI;

  const bilgi = `${ek4ab.il} ${ek4ab.ilce} ${ek4ab.koyMahalle}`;
  sheet.headerFooter.oddFooter = `&8&C${bilgi}\n&P/&N`;

  // ---- SATIR 1: BAŞLIK ----
  birlesikBaslikYaz(sheet, {
    satirBas: 1, sutunBas: 1, sutunSon: SON_SUTUN,
    metin: 'TESPİT VE TAHDİT ÇALIŞMALARINA ESAS OLAN ÇİFTÇİ AİLE, GEÇİM KAYNAĞI VE HAYVAN VARLIĞI BİLDİRİM CETVELİ',
    fill: RENK.koyu,
  });

  // ---- SATIR 2: İli / İlçesi / Mahallesi-Köyü ----
  const konumRow = sheet.getRow(2);
  konumRow.getCell(1).value = `İli: ${ek4ab.il}`;
  sheet.mergeCells(2, 1, 2, 9);
  hucreStil(konumRow.getCell(1), { align: 'left', bold: true });
  konumRow.getCell(10).value = `İlçesi: ${ek4ab.ilce}`;
  sheet.mergeCells(2, 10, 2, 17);
  hucreStil(konumRow.getCell(10), { align: 'left', bold: true });
  konumRow.getCell(18).value = `Mahallesi/Köyü: ${ek4ab.koyMahalle}`;
  sheet.mergeCells(2, 18, 2, SON_SUTUN);
  hucreStil(konumRow.getCell(18), { align: 'left', bold: true });

  // ---- SATIR 3-4-5: 3 KATMANLI TABLO BAŞLIĞI ----
  // Sira No, Adi Soyadi, Toplam BBHB: 3 satir (3-5) boyunca dikey birlesik
  birlesikBaslikYaz(sheet, { satirBas: 3, satirSon: 5, sutunBas: SIRA_NO, metin: 'Sıra\nNo', fill: RENK.koyu });
  birlesikBaslikYaz(sheet, { satirBas: 3, satirSon: 5, sutunBas: AD_SOYAD_BAS, sutunSon: AD_SOYAD_SON, metin: 'Adı Soyadı\n(Çiftçi Ailesi)', fill: RENK.koyu });
  birlesikBaslikYaz(sheet, { satirBas: 3, satirSon: 5, sutunBas: TOPLAM_BBHB_BAS, sutunSon: TOPLAM_BBHB_SON, metin: 'Toplam\nBBHB', fill: RENK.koyu });

  // Ust grup basliklari (satir 3, sadece 1 satir - alt kirilimlari satir 4'te)
  birlesikBaslikYaz(sheet, { satirBas: 3, sutunBas: YEM_BITKISI_BAS, sutunSon: HUBUBAT_SON, metin: '(Ek-4/a)\nÇİFTÇİ AİLE BİLDİRİM CETVELİ', fill: RENK.koyu });
  birlesikBaslikYaz(sheet, { satirBas: 3, sutunBas: TARIM, sutunSon: HAYVANCILIK, metin: '(Ek-4/a)\nGEÇİM KAYNAĞI', fill: RENK.koyu });
  birlesikBaslikYaz(sheet, { satirBas: 3, sutunBas: TOPLAM_HAYVAN, sutunSon: HAYVAN_SON, metin: '(Ek-4/b)\nBÜYÜKBAŞ VE KÜÇÜKBAŞ HAYVAN VARLIĞI', fill: RENK.koyu });

  // Orta katman (satir 4-5 dikey birlesik oldugu icin bunlar 2 satir kaplar)
  birlesikBaslikYaz(sheet, { satirBas: 4, satirSon: 5, sutunBas: YEM_BITKISI_BAS, sutunSon: YEM_BITKISI_SON, metin: 'Yem Bitkisi\n(da)', fill: RENK.orta });
  birlesikBaslikYaz(sheet, { satirBas: 4, satirSon: 5, sutunBas: SEBZE_BAG_BAS, sutunSon: SEBZE_BAG_SON, metin: 'Sebze-Bağ\n(da)', fill: RENK.orta });
  birlesikBaslikYaz(sheet, { satirBas: 4, satirSon: 5, sutunBas: HUBUBAT_BAS, sutunSon: HUBUBAT_SON, metin: 'Hububat\n(da)', fill: RENK.orta });
  birlesikBaslikYaz(sheet, { satirBas: 4, satirSon: 5, sutunBas: TARIM, metin: 'Tarım\n(X)', fill: RENK.orta });
  birlesikBaslikYaz(sheet, { satirBas: 4, satirSon: 5, sutunBas: HAYVANCILIK, metin: 'Hayvancılık\n(X)', fill: RENK.orta });
  birlesikBaslikYaz(sheet, { satirBas: 4, satirSon: 5, sutunBas: TOPLAM_HAYVAN, metin: 'Toplam\nHayvan\nVarlığı\n(adet)', fill: RENK.orta });

  // 7 hayvan grubu basligi (satir 4, alt kategoriler satir 5'te)
  let sutunIndex = HAYVAN_BAS;
  for (const grup of SUTUN_HARITASI) {
    const baslaIndex = sutunIndex;
    const bitisIndex = sutunIndex + grup.altlar.length - 1;
    birlesikBaslikYaz(sheet, { satirBas: 4, sutunBas: baslaIndex, sutunSon: bitisIndex, metin: grup.baslik, fill: RENK.orta });
    for (const alt of grup.altlar) {
      birlesikBaslikYaz(sheet, { satirBas: 5, sutunBas: sutunIndex, metin: alt.etiket, fill: RENK.orta });
      sutunIndex += 1;
    }
  }

  // ---- VERİ SATIRLARI ----
  const sutunToplamlari = new Array(TUM_ALTLAR.length).fill(0);
  let yemToplam = 0, sebzeToplam = 0, hububatToplam = 0, hayvanVarligiToplam = 0;

  ek4ab.ciftciler.forEach((c, i) => {
    const zemin = i % 2 === 0 ? 'FFFFFFFF' : RENK.seritKoyu;
    const row = sheet.addRow([]);

    row.getCell(SIRA_NO).value = i + 1;
    hucreStil(row.getCell(SIRA_NO), { fill: zemin, align: 'center' });

    row.getCell(AD_SOYAD_BAS).value = c.isletmeciAdi;
    sheet.mergeCells(row.number, AD_SOYAD_BAS, row.number, AD_SOYAD_SON);
    hucreStil(row.getCell(AD_SOYAD_BAS), { fill: zemin, align: 'left', kaydir: false });

    row.getCell(YEM_BITKISI_BAS).value = c.yemBitkisi || '';
    sheet.mergeCells(row.number, YEM_BITKISI_BAS, row.number, YEM_BITKISI_SON);
    hucreStil(row.getCell(YEM_BITKISI_BAS), { fill: zemin, align: 'center' });

    row.getCell(SEBZE_BAG_BAS).value = c.sebzeBag || '';
    sheet.mergeCells(row.number, SEBZE_BAG_BAS, row.number, SEBZE_BAG_SON);
    hucreStil(row.getCell(SEBZE_BAG_BAS), { fill: zemin, align: 'center' });

    row.getCell(HUBUBAT_BAS).value = c.hububat || '';
    sheet.mergeCells(row.number, HUBUBAT_BAS, row.number, HUBUBAT_SON);
    hucreStil(row.getCell(HUBUBAT_BAS), { fill: zemin, align: 'center' });

    row.getCell(TARIM).value = c.tarim ? 'X' : '';
    hucreStil(row.getCell(TARIM), { fill: zemin, align: 'center' });

    row.getCell(HAYVANCILIK).value = c.hayvancilik ? 'X' : '';
    hucreStil(row.getCell(HAYVANCILIK), { fill: zemin, align: 'center' });

    row.getCell(TOPLAM_HAYVAN).value = c.toplamHayvanVarligi || '';
    hucreStil(row.getCell(TOPLAM_HAYVAN), { fill: zemin, align: 'center' });

    c.hayvanPivot.forEach((deger, idx) => {
      row.getCell(HAYVAN_BAS + idx).value = deger || '';
      hucreStil(row.getCell(HAYVAN_BAS + idx), { fill: zemin, align: 'center' });
      if (typeof deger === 'number') sutunToplamlari[idx] += deger;
    });

    row.getCell(TOPLAM_BBHB_BAS).value = c.isletmeciToplamBBHB;
    sheet.mergeCells(row.number, TOPLAM_BBHB_BAS, row.number, TOPLAM_BBHB_SON);
    hucreStil(row.getCell(TOPLAM_BBHB_BAS), { fill: zemin, align: 'center', bold: true, numFormat: '0.00' });

    if (typeof c.yemBitkisi === 'number') yemToplam += c.yemBitkisi;
    if (typeof c.sebzeBag === 'number') sebzeToplam += c.sebzeBag;
    if (typeof c.hububat === 'number') hububatToplam += c.hububat;
    hayvanVarligiToplam += c.toplamHayvanVarligi || 0;
  });

  // ---- TOPLAM SATIRI ----
  const toplamRow = sheet.addRow([]);
  toplamRow.getCell(SIRA_NO).value = 'TOPLAM';
  sheet.mergeCells(toplamRow.number, SIRA_NO, toplamRow.number, AD_SOYAD_SON);
  hucreStil(toplamRow.getCell(SIRA_NO), { fill: RENK.toplam, bold: true, align: 'right' });

  toplamRow.getCell(YEM_BITKISI_BAS).value = yemToplam || '';
  sheet.mergeCells(toplamRow.number, YEM_BITKISI_BAS, toplamRow.number, YEM_BITKISI_SON);
  hucreStil(toplamRow.getCell(YEM_BITKISI_BAS), { fill: RENK.toplam, bold: true, align: 'center' });

  toplamRow.getCell(SEBZE_BAG_BAS).value = sebzeToplam || '';
  sheet.mergeCells(toplamRow.number, SEBZE_BAG_BAS, toplamRow.number, SEBZE_BAG_SON);
  hucreStil(toplamRow.getCell(SEBZE_BAG_BAS), { fill: RENK.toplam, bold: true, align: 'center' });

  toplamRow.getCell(HUBUBAT_BAS).value = hububatToplam || '';
  sheet.mergeCells(toplamRow.number, HUBUBAT_BAS, toplamRow.number, HUBUBAT_SON);
  hucreStil(toplamRow.getCell(HUBUBAT_BAS), { fill: RENK.toplam, bold: true, align: 'center' });

  hucreStil(toplamRow.getCell(TARIM), { fill: RENK.toplam });
  hucreStil(toplamRow.getCell(HAYVANCILIK), { fill: RENK.toplam });

  toplamRow.getCell(TOPLAM_HAYVAN).value = hayvanVarligiToplam || '';
  hucreStil(toplamRow.getCell(TOPLAM_HAYVAN), { fill: RENK.toplam, bold: true, align: 'center' });

  sutunToplamlari.forEach((t, idx) => {
    toplamRow.getCell(HAYVAN_BAS + idx).value = t || '';
    hucreStil(toplamRow.getCell(HAYVAN_BAS + idx), { fill: RENK.toplam, bold: true, align: 'center' });
  });

  toplamRow.getCell(TOPLAM_BBHB_BAS).value = ek4ab.genelToplamBBHB;
  sheet.mergeCells(toplamRow.number, TOPLAM_BBHB_BAS, toplamRow.number, TOPLAM_BBHB_SON);
  hucreStil(toplamRow.getCell(TOPLAM_BBHB_BAS), { fill: RENK.toplam, bold: true, align: 'center', numFormat: '0.00' });

  // ---- NOT ----
  const notRow = sheet.addRow([]);
  const yilMetni = ek4ab.uretimYili ? `${ek4ab.uretimYili} yılı` : 'ilgili yıl';
  notRow.getCell(1).value = `Not: Yukarıdaki hayvan sayıları ve ekiliş alanı verileri ${yilMetni} ÇKS (Çiftçi Kayıt Sistemi) ve Türkvet kayıtlarından alınmıştır.`;
  sheet.mergeCells(notRow.number, 1, notRow.number, SON_SUTUN);
  hucreStil(notRow.getCell(1), { align: 'left' });

  sheet.eachRow((row) => {
    if (!row.height) row.height = SATIR_YUKSEKLIGI;
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = { contractToEk4abExcel };
