/**
 * ek4ab.excel.exporter.js
 *
 * Ek-4ab "Tespit ve Tahdit Çalışmalarına Esas Olan Çiftçi Aile, Geçim
 * Kaynağı ve Hayvan Varlığı Bildirim Cetveli" - BBHB (Ek-4/b) ve CKS
 * (Ek-4/a) verilerinin TEK tabloda birlesimi + Teknik Ekip imza blogu.
 *
 * GORUNUM: tablo govdesinde kenar cizgisi VAR, ama BASLIK (satir 1-2),
 * NOT satiri ve IMZA BLOGU'NDA kenar cizgisi YOK (kullanicinin acik
 * istegi).
 *
 * Satir duzeni:
 *   1     : Baslik (kenarliksiz)
 *   2     : Ili / Ilcesi / Koyu-Mahalle (12'ser sutun, kenarliksiz)
 *   3     : BOS satir (2. satirdan sonra ayirici bosluk)
 *   4-5   : UST grup basliklari (2 satir birlesik)
 *   6-7   : ORTA+ALT katman (Yem Bitkisi(da) vb. + hayvan kategorileri)
 *   8+    : Veri satirlari
 *   ...   : TOPLAM satiri
 *   ...   : NOT satiri (kenarliksiz)
 *   ...   : IMZA BLOGU (kenarliksiz - ekip adi + 4'erli imzaci gruplari,
 *           her grup oncesi 3 satirlik imza boslugu, ortadaki satirda
 *           %25 opaklik gri "İMZA" filigrani)
 */

const ExcelJS = require('exceljs');
const { SUTUN_HARITASI } = require('../sablonlar/bbhb-tablo-semasi');
const { cmSutunGenisligi, cmSatirYuksekligiPuan } = require('../sablonlar/excel-birimler');
const { imzaGruplariniOlustur } = require('../../personel/imza-gruplama');

const YAZI_TIPI = 'Times New Roman';
const YAZI_BOYUTU = 7;
const SATIR_YUKSEKLIGI = cmSatirYuksekligiPuan(0.45);
const SUTUN_GENISLIGI = cmSutunGenisligi(1);
const BIR_CM_INC = 1 / 2.54;
const IMZA_FILIGRAN_RENK = 'FFBFBFBF'; // ~%25 opaklik siyah (beyaz zemin uzerinde)

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
const SON_SUTUN = TOPLAM_BBHB_SON;           // 36

// Satir numaralari (2. satirdan sonraki 1 bos satir dahil edilerek)
const SATIR_BASLIK = 1;
const SATIR_KONUM = 2;
const SATIR_BOSLUK = 3;
const SATIR_UST_BAS = 4;
const SATIR_UST_SON = 5;
const SATIR_ORTA_BAS = 6;
const SATIR_ORTA_SON = 7;
const VERI_BASLANGIC_SATIR = 8;

const KENAR = { style: 'thin', color: { argb: 'FF000000' } };
const TUM_KENARLAR = { top: KENAR, left: KENAR, bottom: KENAR, right: KENAR };

function hucreStil(hucre, { bold = false, align = 'center', kaydir = true, numFormat, kenarsiz = false, renk } = {}) {
  hucre.font = { name: YAZI_TIPI, size: YAZI_BOYUTU, bold, color: { argb: renk || 'FF1C1E1B' } };
  if (!kenarsiz) hucre.border = TUM_KENARLAR;
  if (numFormat) hucre.numFmt = numFormat;
  hucre.alignment = { vertical: 'middle', horizontal: align, wrapText: kaydir };
}

/** Baslangic-bitis (satir+sutun) araligini birlestirip TEK stil uygular (master hucre ezilme hatasindan kacinir) */
function birlesikYaz(sheet, { satirBas, satirSon = satirBas, sutunBas, sutunSon = sutunBas, metin, bold = true, align = 'center', kenarsiz = false, renk }) {
  const hucre = sheet.getCell(satirBas, sutunBas);
  hucre.value = metin;
  hucreStil(hucre, { bold, align, kenarsiz, renk });
  if (satirBas !== satirSon || sutunBas !== sutunSon) {
    sheet.mergeCells(satirBas, sutunBas, satirSon, sutunSon);
  }
}

/** Iki kurum icin kurum adinin ALTINA eklenen sabit unvan satiri */
const EK_UNVAN_HARITASI = {
  ilTarimOrman: 'Merkez Teknik Ekip Başkanı',
  ilceTarimOrman: 'İlçe Teknik Ekip Başkanı',
};

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

  // ---- SATIR 1: BAŞLIK (kenarlıksız) ----
  birlesikYaz(sheet, {
    satirBas: SATIR_BASLIK, sutunBas: 1, sutunSon: SON_SUTUN,
    metin: 'TESPİT VE TAHDİT ÇALIŞMALARINA ESAS OLAN ÇİFTÇİ AİLE, GEÇİM KAYNAĞI VE HAYVAN VARLIĞI BİLDİRİM CETVELİ',
    kenarsiz: true,
  });

  // ---- SATIR 2: İli / İlçesi / Köyü-Mahalle (12'şer sütun, kenarlıksız) ----
  birlesikYaz(sheet, { satirBas: SATIR_KONUM, sutunBas: 1, sutunSon: 12, metin: `İli: ${ek4ab.il}`, align: 'left', kenarsiz: true });
  birlesikYaz(sheet, { satirBas: SATIR_KONUM, sutunBas: 13, sutunSon: 24, metin: `İlçesi: ${ek4ab.ilce}`, align: 'left', kenarsiz: true });
  birlesikYaz(sheet, { satirBas: SATIR_KONUM, sutunBas: 25, sutunSon: 36, metin: `Köyü/Mahalle: ${ek4ab.koyMahalle}`, align: 'left', kenarsiz: true });

  // ---- SATIR 3: BOŞ (2. satırdan sonra ayırıcı) ----
  sheet.getRow(SATIR_BOSLUK).height = SATIR_YUKSEKLIGI;

  // ---- SATIR 4-5: ÜST katman ----
  birlesikYaz(sheet, { satirBas: SATIR_UST_BAS, satirSon: SATIR_ORTA_SON, sutunBas: SIRA_NO, metin: 'Sıra\nNo' });
  birlesikYaz(sheet, { satirBas: SATIR_UST_BAS, satirSon: SATIR_ORTA_SON, sutunBas: AD_SOYAD_BAS, sutunSon: AD_SOYAD_SON, metin: 'Adı Soyadı\n(Çiftçi Ailesi)' });
  birlesikYaz(sheet, { satirBas: SATIR_UST_BAS, satirSon: SATIR_ORTA_SON, sutunBas: TOPLAM_BBHB_BAS, sutunSon: TOPLAM_BBHB_SON, metin: 'Toplam\nBBHB' });

  birlesikYaz(sheet, { satirBas: SATIR_UST_BAS, satirSon: SATIR_UST_SON, sutunBas: YEM_BITKISI_BAS, sutunSon: HUBUBAT_SON, metin: '(Ek-4/a)\nÇİFTÇİ AİLE BİLDİRİM CETVELİ' });
  birlesikYaz(sheet, { satirBas: SATIR_UST_BAS, satirSon: SATIR_UST_SON, sutunBas: TARIM, sutunSon: HAYVANCILIK, metin: '(Ek-4/a)\nGEÇİM KAYNAĞI' });
  birlesikYaz(sheet, { satirBas: SATIR_UST_BAS, satirSon: SATIR_UST_SON, sutunBas: TOPLAM_HAYVAN, sutunSon: HAYVAN_SON, metin: '(Ek-4/b)\nBÜYÜKBAŞ VE KÜÇÜKBAŞ HAYVAN VARLIĞI' });

  // ---- SATIR 6-7: ORTA+ALT katman ----
  birlesikYaz(sheet, { satirBas: SATIR_ORTA_BAS, satirSon: SATIR_ORTA_SON, sutunBas: YEM_BITKISI_BAS, sutunSon: YEM_BITKISI_SON, metin: 'Yem Bitkisi\n(da)' });
  birlesikYaz(sheet, { satirBas: SATIR_ORTA_BAS, satirSon: SATIR_ORTA_SON, sutunBas: SEBZE_BAG_BAS, sutunSon: SEBZE_BAG_SON, metin: 'Sebze-Bağ\n(da)' });
  birlesikYaz(sheet, { satirBas: SATIR_ORTA_BAS, satirSon: SATIR_ORTA_SON, sutunBas: HUBUBAT_BAS, sutunSon: HUBUBAT_SON, metin: 'Hububat\n(da)' });
  birlesikYaz(sheet, { satirBas: SATIR_ORTA_BAS, satirSon: SATIR_ORTA_SON, sutunBas: TARIM, metin: 'Tarım\n(X)' });
  birlesikYaz(sheet, { satirBas: SATIR_ORTA_BAS, satirSon: SATIR_ORTA_SON, sutunBas: HAYVANCILIK, metin: 'Hayvancılık\n(X)' });
  birlesikYaz(sheet, { satirBas: SATIR_ORTA_BAS, satirSon: SATIR_ORTA_SON, sutunBas: TOPLAM_HAYVAN, metin: 'Toplam\nHayvan\nVarlığı\n(adet)' });

  let sutunIndex = HAYVAN_BAS;
  for (const grup of SUTUN_HARITASI) {
    const baslaIndex = sutunIndex;
    const bitisIndex = sutunIndex + grup.altlar.length - 1;
    birlesikYaz(sheet, { satirBas: SATIR_ORTA_BAS, sutunBas: baslaIndex, sutunSon: bitisIndex, metin: grup.baslik });
    for (const alt of grup.altlar) {
      birlesikYaz(sheet, { satirBas: SATIR_ORTA_SON, sutunBas: sutunIndex, metin: alt.etiket });
      sutunIndex += 1;
    }
  }

  // ---- VERİ SATIRLARI ----
  const sutunToplamlari = new Array(TUM_ALTLAR.length).fill(0);
  let yemToplam = 0, sebzeToplam = 0, hububatToplam = 0, hayvanVarligiToplam = 0;

  ek4ab.ciftciler.forEach((c, i) => {
    const row = sheet.addRow([]);

    row.getCell(SIRA_NO).value = i + 1;
    hucreStil(row.getCell(SIRA_NO), { align: 'center' });

    row.getCell(AD_SOYAD_BAS).value = c.isletmeciAdi;
    sheet.mergeCells(row.number, AD_SOYAD_BAS, row.number, AD_SOYAD_SON);
    hucreStil(row.getCell(AD_SOYAD_BAS), { align: 'left', kaydir: false });

    row.getCell(YEM_BITKISI_BAS).value = c.yemBitkisi || '';
    sheet.mergeCells(row.number, YEM_BITKISI_BAS, row.number, YEM_BITKISI_SON);
    hucreStil(row.getCell(YEM_BITKISI_BAS), { align: 'center' });

    row.getCell(SEBZE_BAG_BAS).value = c.sebzeBag || '';
    sheet.mergeCells(row.number, SEBZE_BAG_BAS, row.number, SEBZE_BAG_SON);
    hucreStil(row.getCell(SEBZE_BAG_BAS), { align: 'center' });

    row.getCell(HUBUBAT_BAS).value = c.hububat || '';
    sheet.mergeCells(row.number, HUBUBAT_BAS, row.number, HUBUBAT_SON);
    hucreStil(row.getCell(HUBUBAT_BAS), { align: 'center' });

    row.getCell(TARIM).value = c.tarim ? 'X' : '';
    hucreStil(row.getCell(TARIM), { align: 'center' });

    row.getCell(HAYVANCILIK).value = c.hayvancilik ? 'X' : '';
    hucreStil(row.getCell(HAYVANCILIK), { align: 'center' });

    row.getCell(TOPLAM_HAYVAN).value = c.toplamHayvanVarligi || '';
    hucreStil(row.getCell(TOPLAM_HAYVAN), { align: 'center' });

    c.hayvanPivot.forEach((deger, idx) => {
      row.getCell(HAYVAN_BAS + idx).value = deger || '';
      hucreStil(row.getCell(HAYVAN_BAS + idx), { align: 'center' });
      if (typeof deger === 'number') sutunToplamlari[idx] += deger;
    });

    row.getCell(TOPLAM_BBHB_BAS).value = c.isletmeciToplamBBHB;
    sheet.mergeCells(row.number, TOPLAM_BBHB_BAS, row.number, TOPLAM_BBHB_SON);
    hucreStil(row.getCell(TOPLAM_BBHB_BAS), { align: 'center', bold: true, numFormat: '0.00' });

    if (typeof c.yemBitkisi === 'number') yemToplam += c.yemBitkisi;
    if (typeof c.sebzeBag === 'number') sebzeToplam += c.sebzeBag;
    if (typeof c.hububat === 'number') hububatToplam += c.hububat;
    hayvanVarligiToplam += c.toplamHayvanVarligi || 0;
  });

  // ---- TOPLAM SATIRI ----
  const toplamRow = sheet.addRow([]);
  toplamRow.getCell(SIRA_NO).value = 'TOPLAM';
  sheet.mergeCells(toplamRow.number, SIRA_NO, toplamRow.number, AD_SOYAD_SON);
  hucreStil(toplamRow.getCell(SIRA_NO), { bold: true, align: 'right' });

  toplamRow.getCell(YEM_BITKISI_BAS).value = yemToplam || '';
  sheet.mergeCells(toplamRow.number, YEM_BITKISI_BAS, toplamRow.number, YEM_BITKISI_SON);
  hucreStil(toplamRow.getCell(YEM_BITKISI_BAS), { bold: true, align: 'center' });

  toplamRow.getCell(SEBZE_BAG_BAS).value = sebzeToplam || '';
  sheet.mergeCells(toplamRow.number, SEBZE_BAG_BAS, toplamRow.number, SEBZE_BAG_SON);
  hucreStil(toplamRow.getCell(SEBZE_BAG_BAS), { bold: true, align: 'center' });

  toplamRow.getCell(HUBUBAT_BAS).value = hububatToplam || '';
  sheet.mergeCells(toplamRow.number, HUBUBAT_BAS, toplamRow.number, HUBUBAT_SON);
  hucreStil(toplamRow.getCell(HUBUBAT_BAS), { bold: true, align: 'center' });

  hucreStil(toplamRow.getCell(TARIM), {});
  hucreStil(toplamRow.getCell(HAYVANCILIK), {});

  toplamRow.getCell(TOPLAM_HAYVAN).value = hayvanVarligiToplam || '';
  hucreStil(toplamRow.getCell(TOPLAM_HAYVAN), { bold: true, align: 'center' });

  sutunToplamlari.forEach((t, idx) => {
    toplamRow.getCell(HAYVAN_BAS + idx).value = t || '';
    hucreStil(toplamRow.getCell(HAYVAN_BAS + idx), { bold: true, align: 'center' });
  });

  toplamRow.getCell(TOPLAM_BBHB_BAS).value = ek4ab.genelToplamBBHB;
  sheet.mergeCells(toplamRow.number, TOPLAM_BBHB_BAS, toplamRow.number, TOPLAM_BBHB_SON);
  hucreStil(toplamRow.getCell(TOPLAM_BBHB_BAS), { bold: true, align: 'center', numFormat: '0.00' });

  // ---- NOT (kenarlıksız) ----
  const notRow = sheet.addRow([]);
  const yilMetni = ek4ab.uretimYili ? `${ek4ab.uretimYili} yılı` : 'ilgili yıl';
  notRow.getCell(1).value = `Not: Yukarıdaki hayvan sayıları ve ekiliş alanı verileri ${yilMetni} ÇKS (Çiftçi Kayıt Sistemi) ve Türkvet kayıtlarından alınmıştır.`;
  sheet.mergeCells(notRow.number, 1, notRow.number, SON_SUTUN);
  hucreStil(notRow.getCell(1), { align: 'left', kenarsiz: true });

  // ---- İMZA BLOĞU (kenarlıksız) ----
  if (ek4ab.imzacilar && ek4ab.imzacilar.length > 0) {
    sheet.addRow([]);

    const ekipAdiRow = sheet.addRow([]);
    ekipAdiRow.getCell(1).value = (ek4ab.teknikEkipAdi || 'TEKNİK EKİP').toLocaleUpperCase('tr-TR');
    sheet.mergeCells(ekipAdiRow.number, 1, ekipAdiRow.number, SON_SUTUN);
    hucreStil(ekipAdiRow.getCell(1), { bold: true, align: 'left', kenarsiz: true });
    ekipAdiRow.getCell(1).font = { ...ekipAdiRow.getCell(1).font, size: 10 };

    const gruplar = imzaGruplariniOlustur(ek4ab.imzacilar);
    const SUTUN_GENISLIGI_TEK_KISI = Math.round(SON_SUTUN / 4); // tekil imzaci icin 4 esit parcadan İLKİ

    gruplar.forEach((grup, grupIndex) => {
      const n = grup.length;
      const sonGrupMu = grupIndex === gruplar.length - 1;
      // DUZELTME: "sola yaslı" ilk basta yanlis anlasilmisti - dogrusu:
      // 4 esit parcaya bolunen alanin ILK CEYREGINDE, o ceyrek icinde
      // ORTALANARAK gosterilsin (tam kenara yapismasin).
      const tekKisiIlkCeyrekte = sonGrupMu && n === 1;

      // 3 satirlik imza boslugu - ORTADAKI satirda %25 opaklik gri "İMZA"
      const bosluk1 = sheet.addRow([]);
      const bosluk2 = sheet.addRow([]);
      const bosluk3 = sheet.addRow([]);
      const adRow = sheet.addRow([]);
      const unvanRow = sheet.addRow([]);
      const kurumRow = sheet.addRow([]);
      const ekUnvanRow = sheet.addRow([]);

      grup.forEach((imzaci, i) => {
        let baslaSutun, bitisSutun;
        if (tekKisiIlkCeyrekte) {
          baslaSutun = 1;
          bitisSutun = SUTUN_GENISLIGI_TEK_KISI;
        } else {
          baslaSutun = Math.floor((i * SON_SUTUN) / n) + 1;
          bitisSutun = Math.max(Math.floor(((i + 1) * SON_SUTUN) / n), baslaSutun);
        }
        const align = 'center'; // her iki durumda da kendi alaninin ortasinda

        birlesikYaz(sheet, { satirBas: bosluk1.number, sutunBas: baslaSutun, sutunSon: bitisSutun, metin: '', kenarsiz: true });
        birlesikYaz(sheet, { satirBas: bosluk2.number, sutunBas: baslaSutun, sutunSon: bitisSutun, metin: 'İMZA', kenarsiz: true, renk: IMZA_FILIGRAN_RENK, bold: true, align });
        birlesikYaz(sheet, { satirBas: bosluk3.number, sutunBas: baslaSutun, sutunSon: bitisSutun, metin: '', kenarsiz: true });
        birlesikYaz(sheet, { satirBas: adRow.number, sutunBas: baslaSutun, sutunSon: bitisSutun, metin: imzaci.adSoyad || '', kenarsiz: true, bold: true, align });
        birlesikYaz(sheet, { satirBas: unvanRow.number, sutunBas: baslaSutun, sutunSon: bitisSutun, metin: imzaci.unvan || '', kenarsiz: true, bold: false, align });
        birlesikYaz(sheet, { satirBas: kurumRow.number, sutunBas: baslaSutun, sutunSon: bitisSutun, metin: imzaci.imzaKurumMetni || '', kenarsiz: true, bold: false, align });

        const ekUnvan = EK_UNVAN_HARITASI[imzaci.kurumKod] || '';
        birlesikYaz(sheet, { satirBas: ekUnvanRow.number, sutunBas: baslaSutun, sutunSon: bitisSutun, metin: ekUnvan, kenarsiz: true, bold: false, align });
      });
    });
  }

  sheet.eachRow((row) => {
    if (!row.height) row.height = SATIR_YUKSEKLIGI;
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = { contractToEk4abExcel };
