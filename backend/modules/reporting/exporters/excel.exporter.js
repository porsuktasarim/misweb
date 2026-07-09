/**
 * excel.exporter.js
 *
 * Resmi BBHB raporu sablonu (Ek-4/ab tarzi), gri ton renk semasi.
 * Sutun semasi backend/modules/reporting/sablonlar/bbhb-tablo-semasi.js
 * dosyasindan gelir (Word/PDF ile ORTAK, tek kaynak).
 *
 * Sayfa: yatay (landscape), kenar boslugu 1cm, basliklar ortali.
 * Isletmeci Adi alani TEK genis sutun DEGIL, 8 adet 3.75 genislikte
 * sutunun BIRLESTIRILMESIYLE olusturulur (kullanicinin acik istegi).
 */

const ExcelJS = require('exceljs');
const lang = require('../../../../config/lang/tr');
const { katsayiBul } = require('../../bbhb/bbhb.rules');
const {
  SUTUN_HARITASI,
  TUM_ALTLAR,
  SABIT_ONCESI,
  ISLETMECI_ADI_SUTUN_SAYISI,
  TOPLAM_SUTUN_INDEX,
  isletmeciSatiriDizisi,
  kriterParagraflariOlustur,
  bolumBasligiMetni,
} = require('../sablonlar/bbhb-tablo-semasi');

const RENK = {
  koyu: 'FF3F3F3C',
  orta: 'FF6E6E68',
  katsayi: 'FFEDEBE4',
  seritAcik: 'FFFFFFFF',
  seritKoyu: 'FFF4F4F2',
  toplam: 'FFDCDCD7',
  ozetEtiket: 'FFD9D9D4',
};

const YAZI_TIPI = 'Times New Roman';
const YAZI_BOYUTU = 8;
const SATIR_YUKSEKLIGI = 15;
const BIR_CM_INC = 1 / 2.54;

const ISLETMECI_ADI_BASLANGIC = 2; // B
const ISLETMECI_ADI_BITIS = 1 + ISLETMECI_ADI_SUTUN_SAYISI; // I (9)

function sutunHarfi(sheet, index) {
  return sheet.getColumn(index).letter;
}

function isletmeciAlaniniBirlestir(sheet, satirNo1, satirNo2 = satirNo1) {
  sheet.mergeCells(
    `${sutunHarfi(sheet, ISLETMECI_ADI_BASLANGIC)}${satirNo1}:${sutunHarfi(sheet, ISLETMECI_ADI_BITIS)}${satirNo2}`
  );
}

function hucreStil(hucre, { fill, bold = false, renkBeyaz = false, align = 'center' } = {}) {
  hucre.font = {
    name: YAZI_TIPI,
    size: YAZI_BOYUTU,
    bold,
    color: { argb: renkBeyaz ? 'FFFFFFFF' : 'FF1C1E1B' },
  };
  if (fill) {
    hucre.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  }
  hucre.alignment = { vertical: 'middle', horizontal: align, wrapText: true };
}

/** [siraNo, isletmeciAdi, ...bosluklar(7), ...pivotDegerler, toplam] - 26 hucrelik satir dizisi kurar */
function veriSatiriDizisi(siraNo, isletmeciAdi, pivotDegerler, toplam) {
  const bosluklar = new Array(ISLETMECI_ADI_SUTUN_SAYISI - 1).fill('');
  return [siraNo, isletmeciAdi, ...bosluklar, ...pivotDegerler, toplam];
}

function bolumYaz(sheet, bolum) {
  const baslikMetni = bolumBasligiMetni(bolum.baslik);

  const r1 = sheet.addRow([baslikMetni]);
  sheet.mergeCells(`A${r1.number}:${sutunHarfi(sheet, TOPLAM_SUTUN_INDEX)}${r1.number}`);
  hucreStil(r1.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'center' });

  const r2 = sheet.addRow(['BÜYÜK BAŞ HAYVAN BİRİMİ (BBHB) RAPORU']);
  sheet.mergeCells(`A${r2.number}:${sutunHarfi(sheet, TOPLAM_SUTUN_INDEX)}${r2.number}`);
  hucreStil(r2.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'center' });

  const r3 = sheet.addRow([`Tarih: ${new Date().toLocaleDateString('tr-TR')}`]);
  hucreStil(r3.getCell(1), {});

  // Baslik satirlari (grup adlari + alt kategoriler)
  const grupBaslikRow = sheet.addRow([]);
  const altBaslikRow = sheet.addRow([]);

  grupBaslikRow.getCell(1).value = 'Sıra\nNo';
  hucreStil(grupBaslikRow.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true });
  sheet.mergeCells(`A${grupBaslikRow.number}:A${altBaslikRow.number}`);

  grupBaslikRow.getCell(ISLETMECI_ADI_BASLANGIC).value = 'İkamet Eden Aile Temsilcisinin\nAdı Soyadı (Aile)';
  hucreStil(grupBaslikRow.getCell(ISLETMECI_ADI_BASLANGIC), { fill: RENK.koyu, bold: true, renkBeyaz: true });
  isletmeciAlaniniBirlestir(sheet, grupBaslikRow.number, altBaslikRow.number);

  let sutunIndex = SABIT_ONCESI + 1;
  for (const grup of SUTUN_HARITASI) {
    const baslaIndex = sutunIndex;
    const bitisIndex = sutunIndex + grup.altlar.length - 1;
    const hucre = grupBaslikRow.getCell(baslaIndex);
    hucre.value = grup.baslik;
    hucreStil(hucre, { fill: RENK.orta, bold: true, renkBeyaz: true });
    if (bitisIndex > baslaIndex) {
      sheet.mergeCells(`${sutunHarfi(sheet, baslaIndex)}${grupBaslikRow.number}:${sutunHarfi(sheet, bitisIndex)}${grupBaslikRow.number}`);
    }
    for (const alt of grup.altlar) {
      const altHucre = altBaslikRow.getCell(sutunIndex);
      altHucre.value = alt.etiket;
      hucreStil(altHucre, { fill: RENK.orta, bold: true, renkBeyaz: true });
      sutunIndex += 1;
    }
  }

  const toplamBaslikHucre = grupBaslikRow.getCell(TOPLAM_SUTUN_INDEX);
  toplamBaslikHucre.value = 'Toplam\nBBHB';
  hucreStil(toplamBaslikHucre, { fill: RENK.orta, bold: true, renkBeyaz: true });
  sheet.mergeCells(`${sutunHarfi(sheet, TOPLAM_SUTUN_INDEX)}${grupBaslikRow.number}:${sutunHarfi(sheet, TOPLAM_SUTUN_INDEX)}${altBaslikRow.number}`);

  // Katsayi satiri - SABIT kanun tablosu, veriden bagimsiz her zaman dolu
  const katsayiRow = sheet.addRow([]);
  hucreStil(katsayiRow.getCell(1), { fill: RENK.katsayi, bold: true });
  hucreStil(katsayiRow.getCell(ISLETMECI_ADI_BASLANGIC), { fill: RENK.katsayi, bold: true });
  isletmeciAlaniniBirlestir(sheet, katsayiRow.number);
  let ki = SABIT_ONCESI + 1;
  for (const alt of TUM_ALTLAR) {
    const hucre = katsayiRow.getCell(ki);
    hucre.value = katsayiBul(alt.grupKodu, alt.kodlar[0]);
    hucreStil(hucre, { fill: RENK.katsayi, bold: true });
    ki += 1;
  }
  hucreStil(katsayiRow.getCell(TOPLAM_SUTUN_INDEX), { fill: RENK.katsayi, bold: true });

  // Isletmeci satirlari
  const sutunToplamlari = new Array(TUM_ALTLAR.length).fill(0);
  let siraNo = 1;
  for (const isletmeci of bolum.isletmeciler) {
    const pivotDegerler = isletmeciSatiriDizisi(isletmeci.kayitlar);
    const row = sheet.addRow(veriSatiriDizisi(siraNo, isletmeci.isletmeciAdi, pivotDegerler, isletmeci.isletmeciToplami));
    isletmeciAlaniniBirlestir(sheet, row.number);

    const zeminRenk = siraNo % 2 === 0 ? RENK.seritKoyu : RENK.seritAcik;
    row.eachCell({ includeEmpty: true }, (hucre, sutunNo) => {
      hucreStil(hucre, {
        fill: zeminRenk,
        bold: sutunNo === TOPLAM_SUTUN_INDEX,
        align: sutunNo === ISLETMECI_ADI_BASLANGIC ? 'left' : 'center',
      });
    });

    pivotDegerler.forEach((deger, idx) => {
      if (typeof deger === 'number') sutunToplamlari[idx] += deger;
    });
    siraNo += 1;
  }

  // TOPLAM satiri
  const toplamRow = sheet.addRow(veriSatiriDizisi('TOPLAM', '', sutunToplamlari.map((t) => t || ''), bolum.bolumToplami));
  isletmeciAlaniniBirlestir(sheet, toplamRow.number);
  toplamRow.eachCell({ includeEmpty: true }, (hucre) => {
    hucreStil(hucre, { fill: RENK.toplam, bold: true });
  });

  sheet.addRow([]);

  // OZET BILGILER
  const toplamHayvan = bolum.isletmeciler.flatMap((is) => is.kayitlar).reduce((t, k) => t + k.adet, 0);

  const ozetBaslikRow = sheet.addRow(['ÖZET BİLGİLER']);
  sheet.mergeCells(`A${ozetBaslikRow.number}:${sutunHarfi(sheet, TOPLAM_SUTUN_INDEX)}${ozetBaslikRow.number}`);
  hucreStil(ozetBaslikRow.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'left' });

  const ozetSatirlari = [
    ['Toplam Hayvan Sayısı', `${toplamHayvan} baş`],
    ['Toplam BBHB', bolum.bolumToplami],
    ['İşletmeci Sayısı', bolum.isletmeciler.length],
  ];
  for (const [etiket, deger] of ozetSatirlari) {
    const row = sheet.addRow([etiket]);
    hucreStil(row.getCell(1), { fill: RENK.ozetEtiket, bold: true, align: 'left' });
    sheet.mergeCells(`A${row.number}:${sutunHarfi(sheet, ISLETMECI_ADI_BITIS)}${row.number}`);
    const degerHucre = row.getCell(ISLETMECI_ADI_BITIS + 1);
    degerHucre.value = deger;
    hucreStil(degerHucre, { align: 'left' });
  }

  sheet.addRow([]);
  sheet.addRow([]);
}

async function contractToExcel(contract) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(contract.modulAdi);

  // Sayfa duzeni: yatay, kenar bosluklari 1cm
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: BIR_CM_INC, right: BIR_CM_INC, top: BIR_CM_INC, bottom: BIR_CM_INC,
      header: 0, footer: 0,
    },
  };

  // Sutun genislikleri: Sira No + Isletmeci Adi alani (8x) + veri sutunlari hepsi 3.75
  for (let i = 1; i <= TOPLAM_SUTUN_INDEX; i++) {
    sheet.getColumn(i).width = 3.75;
  }

  for (const bolum of contract.bolumler) {
    bolumYaz(sheet, bolum);
  }

  if (contract.bolumler.length > 1) {
    const genelOzetRow = sheet.addRow(['GENEL ÖZET (Tüm Bölümler)']);
    sheet.mergeCells(`A${genelOzetRow.number}:${sutunHarfi(sheet, TOPLAM_SUTUN_INDEX)}${genelOzetRow.number}`);
    hucreStil(genelOzetRow.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'left' });

    const row = sheet.addRow(['Genel Toplam BBHB']);
    hucreStil(row.getCell(1), { fill: RENK.ozetEtiket, bold: true, align: 'left' });
    sheet.mergeCells(`A${row.number}:${sutunHarfi(sheet, ISLETMECI_ADI_BITIS)}${row.number}`);
    const degerHucre = row.getCell(ISLETMECI_ADI_BITIS + 1);
    degerHucre.value = contract.genelToplam;
    hucreStil(degerHucre, { align: 'left' });

    sheet.addRow([]);
  }

  const kriterBaslikRow = sheet.addRow([lang.ortak.siniflandirmaKriterleri]);
  sheet.mergeCells(`A${kriterBaslikRow.number}:${sutunHarfi(sheet, TOPLAM_SUTUN_INDEX)}${kriterBaslikRow.number}`);
  hucreStil(kriterBaslikRow.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'left' });

  for (const paragraf of kriterParagraflariOlustur()) {
    const row = sheet.addRow([paragraf]);
    sheet.mergeCells(`A${row.number}:${sutunHarfi(sheet, TOPLAM_SUTUN_INDEX)}${row.number}`);
    hucreStil(row.getCell(1), { align: 'left' });
    row.height = 24;
  }

  sheet.eachRow((row) => {
    if (!row.height) row.height = SATIR_YUKSEKLIGI;
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = { contractToExcel };
