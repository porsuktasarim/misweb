/**
 * cks.urun-siniflandirma.js
 *
 * Ek-4/a formunun "Ekilişi (da)" bolumundeki 3 kategoriye (Yem Bitkisi,
 * Sebze/Meyve, Hububat/Yağlı Tohumlar) urun adindan siniflandirma yapar.
 *
 * TASARIM KARARI (kullanici onayiyla):
 * - Form sadece 3 sutun icerir; meyve/bag/bahce ve yagli tohum urunleri
 *   icin ayri sutun yok. Bu yuzden:
 *     "Sebze" sutunu -> "Sebze/Meyve" (sebzeler + meyve/bag/bahce urunleri)
 *     "Hububat" sutunu -> "Hububat/Yağlı Tohumlar" (tahillar + yagli tohum)
 * - ARPA(YEMLİK) hayvan yemi amacli yetistirilse de HUBUBAT'a yazilir
 *   (botanik olarak tahil - kullanicinin acik karari).
 *
 * ONCELIK SIRASI: 1) OZEL_ATAMALAR (tam eslesme) 2) anahtar kelime
 * eslesmesi (yem bitkisi ONCE kontrol edilir - orn. "YULAF(YEŞİL OT)"
 * hem "YULAF" hem "YEŞİL OT" iceriyor, YEŞİL OT'un yem bitkisi sayilmasi
 * dogru oldugu icin sira onemli) 3) hicbiri eslesmezse SEBZE/MEYVE
 * varsayilir (en genis kategori).
 */

const OZEL_ATAMALAR = {
  'ARPA(YEMLİK)': 'hububatYagli',
};

// SIRAYLA kontrol edilir - yem bitkisi anahtar kelimeleri hububat'tan
// ONCE gelir (orn. "YULAF" hem tahil hem yesil ot yem bitkisi olabilir).
const YEM_BITKISI_ANAHTAR_KELIMELER = [
  'YEŞİL OT', 'SİLAJLIK', 'ÇAYIR OTU', 'YONCA', 'KORUNGA', 'FİĞ',
  'ÜÇGÜL', 'İTALYAN ÇİMİ', 'HAYVAN PANCARI', 'SUDAN OTU',
];

const HUBUBAT_YAGLI_ANAHTAR_KELIMELER = [
  'ARPA', 'BUĞDAY', 'MISIR', 'ÇAVDAR', 'YULAF', 'ÇELTİK', 'TRİTİKALE',
  'AYÇİÇEĞİ', 'SOYA', 'KANOLA', 'KOLZA', 'YERFISTIĞI', 'SUSAM',
];

/**
 * @param {string} urunAdi - ham urun adi (orn. "ARPA(muhtelif)")
 * @returns {{kategori: 'yemBitkisi'|'hububatYagli'|'sebzeMeyve', eminlik: 'kesin'|'tahmini'|'varsayilan'}}
 */
function kategoriBelirle(urunAdi) {
  if (OZEL_ATAMALAR[urunAdi]) {
    return { kategori: OZEL_ATAMALAR[urunAdi], eminlik: 'kesin' };
  }

  const buyukHarf = String(urunAdi || '').toLocaleUpperCase('tr-TR');

  for (const kelime of YEM_BITKISI_ANAHTAR_KELIMELER) {
    if (buyukHarf.includes(kelime)) return { kategori: 'yemBitkisi', eminlik: 'tahmini' };
  }
  for (const kelime of HUBUBAT_YAGLI_ANAHTAR_KELIMELER) {
    if (buyukHarf.includes(kelime)) return { kategori: 'hububatYagli', eminlik: 'tahmini' };
  }
  return { kategori: 'sebzeMeyve', eminlik: 'varsayilan' };
}

module.exports = { kategoriBelirle };
