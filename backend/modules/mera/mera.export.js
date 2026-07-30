/**
 * mera.export.js
 *
 * Mera parselleri icin (1) TOPLU YUKLEME SABLONU (bos, aciklamali,
 * ornek satirli) ve (2) TUM ALANLARI iceren RAPOR (dolu kayitlar)
 * uretir - ikisi de AYNI sutun semasini kullanir (tek kaynak).
 */

const ExcelJS = require('exceljs');
const { ARAZI_NITELIKLERI, ARAZI_KAYNAKLARI, TOPRAK_SINIFLARI } = require('./mera.model');

const SUTUNLAR = [
  { baslik: 'İl', anahtar: 'il', genislik: 14 },
  { baslik: 'İlçe', anahtar: 'ilce', genislik: 14 },
  { baslik: 'Köy/Mahalle', anahtar: 'koyMahalle', genislik: 16 },
  { baslik: 'Ada No', anahtar: 'adaNo', genislik: 10 },
  { baslik: 'Parsel No', anahtar: 'parselNo', genislik: 10 },
  { baslik: 'Mera Alanı (m²)', anahtar: 'meraAlaniM2', genislik: 14 },
  { baslik: 'Tapu Alanı (m²)', anahtar: 'tapuAlaniM2', genislik: 14 },
  { baslik: 'Arazi Niteliği', anahtar: 'araziNiteligi', genislik: 14 },
  { baslik: 'Arazi Durum Sınıfı', anahtar: 'araziDurumSinifi', genislik: 16 },
  { baslik: 'Arazi Kaynağı', anahtar: 'araziKaynagi', genislik: 12 },
  { baslik: 'Tespit Yapıldı Mı', anahtar: 'tespitYapildiMi', genislik: 14 },
  { baslik: 'Tespit Tarihi', anahtar: 'tespitTarihi', genislik: 12 },
  { baslik: 'Tahdit Yapıldı Mı', anahtar: 'tahditYapildiMi', genislik: 14 },
  { baslik: 'Tahdit Tarihi', anahtar: 'tahditTarihi', genislik: 12 },
  { baslik: 'Tahsis Yapıldı Mı', anahtar: 'tahsisYapildiMi', genislik: 14 },
  { baslik: 'Tahsis Tarihi', anahtar: 'tahsisTarihi', genislik: 12 },
  { baslik: 'Islah Durumu', anahtar: 'islahDurumu', genislik: 16 },
  { baslik: 'Eğimi', anahtar: 'egimi', genislik: 10 },
  { baslik: 'Toprak Sınıfı', anahtar: 'topraksinifi', genislik: 12 },
  { baslik: 'Tapu Kimlik No', anahtar: 'tapuKimlikNo', genislik: 16 },
];

const RENK_BASLIK = 'FF3F3F3C';
const RENK_ORNEK_SATIR = 'FFFFF3CD'; // acik sari - "bu bir ornektir, silip kendi verinizi yazin"

function baslikSatiriUygula(sheet) {
  sheet.columns = SUTUNLAR.map((s) => ({ header: s.baslik, key: s.anahtar, width: s.genislik }));
  const baslikSatiri = sheet.getRow(1);
  baslikSatiri.font = { name: 'Times New Roman', bold: true, color: { argb: 'FFFFFFFF' } };
  baslikSatiri.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RENK_BASLIK } };
  baslikSatiri.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  baslikSatiri.height = 32;
}

/** TOPLU YUKLEME SABLONU: bos + aciklama notu + 1 ORNEK satir (sari vurgulu, silinip kendi verisi yazilmali). */
async function sablonOlustur() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Mera Parselleri');
  baslikSatiriUygula(sheet);

  const ornekSatir = sheet.addRow({
    il: 'İstanbul', ilce: 'Silivri', koyMahalle: 'Bekirli', adaNo: '123', parselNo: '45',
    meraAlaniM2: 15000, tapuAlaniM2: 15200, araziNiteligi: 'Mera', araziDurumSinifi: 'Kesinleşmiş',
    araziKaynagi: '5-a', tespitYapildiMi: 'Evet', tespitTarihi: '01.03.2026',
    tahditYapildiMi: 'Hayır', tahditTarihi: '', tahsisYapildiMi: 'Hayır', tahsisTarihi: '',
    islahDurumu: 'Islah çalışması planlanıyor', egimi: '%5', topraksinifi: 'IV. Sınıf', tapuKimlikNo: '1234567890',
  });
  ornekSatir.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RENK_ORNEK_SATIR } }; cell.font = { name: 'Times New Roman', italic: true }; });

  const notSatiri = sheet.addRow(['Yukarıdaki sarı satır ÖRNEKTİR - silip kendi verilerinizi yazın. "Evet/Hayır" sütunlarında sadece bu iki değer kabul edilir.']);
  sheet.mergeCells(`A${notSatiri.number}:${String.fromCharCode(64 + SUTUNLAR.length)}${notSatiri.number}`);
  notSatiri.font = { name: 'Times New Roman', italic: true, size: 9, color: { argb: 'FF808080' } };

  const enumNotSatiri = sheet.addRow([
    `Arazi Niteliği seçenekleri: ${ARAZI_NITELIKLERI.join(', ')} | Arazi Kaynağı: ${ARAZI_KAYNAKLARI.join(', ')} | Toprak Sınıfı: ${TOPRAK_SINIFLARI.join(', ')}`,
  ]);
  sheet.mergeCells(`A${enumNotSatiri.number}:${String.fromCharCode(64 + SUTUNLAR.length)}${enumNotSatiri.number}`);
  enumNotSatiri.font = { name: 'Times New Roman', italic: true, size: 9, color: { argb: 'FF808080' } };

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return workbook.xlsx.writeBuffer();
}

/** RAPOR: TUM alanlari iceren, DOLU kayit listesi. */
async function raporOlustur(parseller) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Mera Parselleri');
  baslikSatiriUygula(sheet);

  const evetHayir = (v) => (v ? 'Evet' : 'Hayır');
  const tarihStr = (d) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');

  parseller.forEach((p) => {
    sheet.addRow({
      il: p.il, ilce: p.ilce, koyMahalle: p.koyMahalle, adaNo: p.adaNo, parselNo: p.parselNo,
      meraAlaniM2: p.meraAlaniM2, tapuAlaniM2: p.tapuAlaniM2, araziNiteligi: p.araziNiteligi,
      araziDurumSinifi: p.araziDurumSinifi, araziKaynagi: p.araziKaynagi,
      tespitYapildiMi: evetHayir(p.tespitYapildiMi), tespitTarihi: tarihStr(p.tespitTarihi),
      tahditYapildiMi: evetHayir(p.tahditYapildiMi), tahditTarihi: tarihStr(p.tahditTarihi),
      tahsisYapildiMi: evetHayir(p.tahsisYapildiMi), tahsisTarihi: tarihStr(p.tahsisTarihi),
      islahDurumu: p.islahDurumu, egimi: p.egimi, topraksinifi: p.topraksinifi, tapuKimlikNo: p.tapuKimlikNo,
    });
  });

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + SUTUNLAR.length)}1` };
  return workbook.xlsx.writeBuffer();
}

module.exports = { sablonOlustur, raporOlustur };
