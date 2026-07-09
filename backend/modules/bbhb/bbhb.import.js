/**
 * bbhb.import.js
 *
 * Turkvet Excel/CSV dosyalarini okuyup normalize hayvan kaydi
 * formatina cevirir. Coklu dosya destekler, birlestirir.
 *
 * Beklenen sutun basliklari (gercek Turkvet disa aktarim
 * formatiyla eslenmelidir - asagidaki isimler ornektir):
 *   Isletmeci Id | Isletmeci Adi | Tur | Cinsiyet | Dogum Tarihi | Irk
 *
 * Cikti (normalize kayit):
 *   { isletmeciId, isletmeciAdi, tur, cinsiyet, yasAy, irk,
 *     kaynak, kaynakReferans }
 */

const ExcelJS = require('exceljs');
const path = require('path');

const TUR_ESLEME = {
  'sığır': 'sigir',
  'sigir': 'sigir',
  'manda': 'manda',
  'koyun': 'koyun',
  'keçi': 'kec',
  'keci': 'kec',
  'at': 'at',
  'katır': 'katir',
  'katir': 'katir',
  'eşek': 'esek',
  'esek': 'esek',
};

const CINSIYET_ESLEME = {
  'dişi': 'disi',
  'disi': 'disi',
  'erkek': 'erkek',
};

function turNormalizeEt(hamDeger) {
  const key = String(hamDeger || '').trim().toLocaleLowerCase('tr-TR');
  const sonuc = TUR_ESLEME[key];
  if (!sonuc) throw new Error(`Bilinmeyen tur degeri: "${hamDeger}"`);
  return sonuc;
}

function cinsiyetNormalizeEt(hamDeger) {
  const key = String(hamDeger || '').trim().toLocaleLowerCase('tr-TR');
  const sonuc = CINSIYET_ESLEME[key];
  if (!sonuc) throw new Error(`Bilinmeyen cinsiyet degeri: "${hamDeger}"`);
  return sonuc;
}

function yasAyHesapla(dogumTarihi, referansTarih = new Date()) {
  const d = new Date(dogumTarihi);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Gecersiz dogum tarihi: "${dogumTarihi}"`);
  }
  const ayFarki =
    (referansTarih.getFullYear() - d.getFullYear()) * 12 +
    (referansTarih.getMonth() - d.getMonth());
  return Math.max(ayFarki, 0);
}

/**
 * Tek bir Excel/CSV dosyasini okuyup normalize kayit dizisine cevirir.
 * @param {string} dosyaYolu
 * @returns {Promise<Array>}
 */
async function dosyaOku(dosyaYolu) {
  const workbook = new ExcelJS.Workbook();
  const uzanti = path.extname(dosyaYolu).toLowerCase();

  if (uzanti === '.csv') {
    await workbook.csv.readFile(dosyaYolu);
  } else {
    await workbook.xlsx.readFile(dosyaYolu);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error(
      `Dosya okunamadı, geçerli bir Excel/CSV dosyası olduğundan emin olun: "${path.basename(
        dosyaYolu
      )}"`
    );
  }

  const kayitlar = [];
  let basliklar = [];

  worksheet.eachRow((row, rowNumber) => {
    const degerler = row.values.slice(1); // ExcelJS 1-indexli, ilk eleman bos

    if (rowNumber === 1) {
      basliklar = degerler.map((v) =>
        String(v || '').trim().toLocaleLowerCase('tr-TR')
      );
      return;
    }

    const satir = {};
    basliklar.forEach((baslik, i) => {
      satir[baslik] = degerler[i];
    });

    kayitlar.push({
      isletmeciId: String(satir['isletmeci id'] || '').trim(),
      isletmeciAdi: String(satir['isletmeci adi'] || '').trim(),
      tur: turNormalizeEt(satir['tur']),
      cinsiyet: cinsiyetNormalizeEt(satir['cinsiyet']),
      yasAy: yasAyHesapla(satir['dogum tarihi']),
      irk: String(satir['irk'] || '').trim(),
      kaynak: 'turkvet_excel',
      kaynakReferans: `${path.basename(dosyaYolu)}:${rowNumber}`,
    });
  });

  return kayitlar;
}

/**
 * Birden fazla dosyayi okuyup tek bir normalize kayit listesinde birlestirir.
 * @param {string[]} dosyaYollari
 * @returns {Promise<Array>}
 */
async function cokluDosyaOku(dosyaYollari) {
  const tumKayitlar = [];
  for (const dosyaYolu of dosyaYollari) {
    const kayitlar = await dosyaOku(dosyaYolu);
    tumKayitlar.push(...kayitlar);
  }
  return tumKayitlar;
}

/**
 * Normalize kayitlari isletmeci bazinda gruplar.
 * @param {Array} kayitlar
 * @returns {Map<string, {isletmeciId, isletmeciAdi, kayitlar: Array}>}
 */
function isletmeciBazindaGrupla(kayitlar) {
  const gruplar = new Map();
  for (const kayit of kayitlar) {
    if (!gruplar.has(kayit.isletmeciId)) {
      gruplar.set(kayit.isletmeciId, {
        isletmeciId: kayit.isletmeciId,
        isletmeciAdi: kayit.isletmeciAdi,
        kayitlar: [],
      });
    }
    gruplar.get(kayit.isletmeciId).kayitlar.push(kayit);
  }
  return gruplar;
}

module.exports = { dosyaOku, cokluDosyaOku, isletmeciBazindaGrupla };
