/**
 * rapor-dosya-adi.js
 *
 * Indirilen rapor dosyalarinin adini TEK KAYNAKTAN uretir.
 * Format: {onEk}_{il}_{ilce}_{koyMahalle}_{tarih}_{rastgele}.{uzanti}
 *   - BBHB   -> onEk = "bbhb"  (TEK alt cizgi)
 *   - CKS    -> onEk = "cks"   (TEK alt cizgi)
 *   - Ek-4ab -> onEk = "4ab"   (TEK alt cizgi)
 *
 * Tarihten sonra rastgele bir parca eklenir (ayni raporun birden fazla
 * kez indirilmesinde dosya adi CAKISMASIN diye).
 *
 * HTTP Content-Disposition basligi icin hem ASCII (donusturulmus,
 * uyumluluk icin) hem UTF-8 (Turkce karakterler dogru gorunsun diye,
 * RFC 5987 filename*=) versiyonlari uretilir.
 */

const TURKCE_ASCII_HARITASI = {
  ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', I: 'I', İ: 'I',
  ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U',
};

function asciiyeCevir(metin) {
  return String(metin || '')
    .split('')
    .map((h) => TURKCE_ASCII_HARITASI[h] || h)
    .join('')
    .replace(/[^a-zA-Z0-9._-]/g, ''); // kalan guvensiz karakterleri temizle
}

function parcaTemizle(metin) {
  // Bosluklari kaldirir, alt cizgiyle CAKISMAMASI icin metindeki alt
  // cizgileri de kaldirir (ayirici alt cizgilerle karismasin diye).
  return String(metin || '').trim().replace(/\s+/g, '').replace(/_/g, '');
}

function rastgeleParca() {
  return Math.random().toString(36).slice(2, 8);
}

function tarihParcasi() {
  return new Date().toLocaleDateString('tr-TR').split('.').join('.'); // GG.AA.YYYY
}

/**
 * @param {'bbhb'|'cks'|'4ab'} tip
 * @param {{il, ilce, koyMahalle}} konum
 * @param {string} uzanti - 'xlsx' | 'docx' | 'pdf'
 * @returns {{ascii: string, utf8: string}} - Content-Disposition icin iki varyant
 */
function raporDosyaAdiOlustur(tip, konum, uzanti) {
  const onEkHaritasi = { bbhb: 'bbhb', cks: 'cks', '4ab': '4ab' };
  const onEk = onEkHaritasi[tip] || tip;

  const parcalar = [onEk, parcaTemizle(konum.il), parcaTemizle(konum.ilce), parcaTemizle(konum.koyMahalle), tarihParcasi(), rastgeleParca()];
  const utf8Ad = `${parcalar.join('_')}.${uzanti}`;
  const asciiAd = `${asciiyeCevir(parcalar.join('_'))}.${uzanti}`;

  return { ascii: asciiAd, utf8: utf8Ad };
}

/** Ifade edilen dosya adlarini dogrudan Content-Disposition basligina yazilabilir hale getirir */
function contentDispositionDegeri(tip, konum, uzanti) {
  const { ascii, utf8 } = raporDosyaAdiOlustur(tip, konum, uzanti);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(utf8)}`;
}

module.exports = { raporDosyaAdiOlustur, contentDispositionDegeri };
