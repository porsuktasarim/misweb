/**
 * cks.import.js
 *
 * Ciftci Kayit Sistemi (CKS) "Koy Genelinde Parsel Uretim Belgesi"
 * disa aktarimini (.xls/.xlsx/.csv) okuyup normalize kayit listesine
 * cevirir. Basliklar ISIM bazli bulunur (sabit satir/sutun numarasina
 * guvenilmez) - Turkvet import.js ile ayni tasarim ilkesi.
 */

const XLSX = require('xlsx');
const path = require('path');

const BASLIK_ANAHTARLARI = {
  isletmeciAdi: ['işletme adı', 'isletme adi'],
  tcVkn: ['tc / vergi no', 'tc/vergi no', 'tc vergi no'],
  il: ['il'],
  ilce: ['ilçe', 'ilce'],
  koy: ['köy', 'koy'],
  adaNo: ['ada\nno', 'ada no'],
  parselNo: ['parsel\nno', 'parsel no'],
  urun: ['ürün', 'urun'],
  ekiliAlan: ['ekili \nalan (da)', 'ekili alan (da)', 'ekili alan(da)'],
};

/** Baslik satirini (basliklar birden fazla satir olabilir, ISLETME ADI ve URUN gecen satiri arar) bulur */
function baslikSatiriniBul(satirlar) {
  for (let i = 0; i < satirlar.length; i++) {
    const normalize = satirlar[i].map((v) =>
      String(v || '').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ')
    );
    const isletmeVar = normalize.some((h) => h.includes('işletme adı') || h.includes('isletme adi'));
    const urunVar = normalize.some((h) => h.includes('ürün') || h.includes('urun'));
    if (isletmeVar && urunVar) return i;
  }
  throw new Error('Beklenen başlık satırı bulunamadı (İşletme Adı + Ürün sütunları)');
}

function basliklariEslestir(hamBaslikSatiri) {
  const normalize = hamBaslikSatiri.map((v) =>
    String(v || '').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ')
  );
  const eslesme = {};
  for (const [anahtar, adaylar] of Object.entries(BASLIK_ANAHTARLARI)) {
    const normalizeAdaylar = adaylar.map((a) => a.replace(/\s+/g, ' '));
    const index = normalize.findIndex((baslik) => normalizeAdaylar.includes(baslik));
    if (index === -1) {
      throw new Error(`Beklenen sütun bulunamadı: "${adaylar[0]}"`);
    }
    eslesme[anahtar] = index;
  }
  return eslesme;
}

/**
 * @param {string} dosyaYolu
 * @returns {Promise<Array>} normalize kayitlar: {isletmeciAdi, tcVkn, il, ilce, koy, adaNo, parselNo, urun, ekiliAlan}
 */
async function dosyaOku(dosyaYolu) {
  const workbook = XLSX.readFile(dosyaYolu);
  const sheetAdi = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetAdi];
  const satirlar = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

  const baslikSatirIndex = baslikSatiriniBul(satirlar);
  const eslesme = basliklariEslestir(satirlar[baslikSatirIndex]);

  const kayitlar = [];
  for (let i = baslikSatirIndex + 1; i < satirlar.length; i++) {
    const satir = satirlar[i];
    if (!satir || satir.every((h) => String(h).trim() === '')) continue;

    const isletmeciAdi = String(satir[eslesme.isletmeciAdi] || '').trim();
    const urun = String(satir[eslesme.urun] || '').trim();
    if (!isletmeciAdi || !urun) continue;

    const ekiliAlanHam = String(satir[eslesme.ekiliAlan] || '0').replace(',', '.');
    const ekiliAlan = parseFloat(ekiliAlanHam) || 0;

    kayitlar.push({
      isletmeciAdi,
      tcVkn: String(satir[eslesme.tcVkn] || '').trim(),
      il: String(satir[eslesme.il] || '').trim(),
      ilce: String(satir[eslesme.ilce] || '').trim(),
      koy: String(satir[eslesme.koy] || '').trim(),
      adaNo: String(satir[eslesme.adaNo] || '').trim(),
      parselNo: String(satir[eslesme.parselNo] || '').trim(),
      urun,
      ekiliAlan,
      kaynak: 'cks_excel',
      kaynakReferans: `${path.basename(dosyaYolu)}:${i + 1}`,
    });
  }

  return kayitlar;
}

module.exports = { dosyaOku };
