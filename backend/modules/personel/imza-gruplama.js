/**
 * imza-gruplama.js
 *
 * Imza blogunda yan yana EN FAZLA 4 kisi olacak sekilde gruplama yapar.
 * SIRALAMA DEGISTIRILMEZ - sadece kac kisinin hangi satirda olacagi
 * belirlenir. Kullanicinin acik kurallari:
 *
 *   - Kalan (N mod 4) = 0 -> normal 4'erli gruplar.
 *   - Kalan = 1 -> normal 4'erli gruplar, SON grup 1 kisi kalir (bu
 *     durumda o kisi GORSEL olarak sola yaslanir - bkz. exporter).
 *   - Kalan = 2 (N>=6) -> SON IKI grup 3'er kisi olacak sekilde
 *     yeniden dengelenir, geri kalanlar (bastan) 4'er.
 *   - Kalan = 3 -> ILK grup 3 kisi, SONRAKI gruplarin hepsi 4'er.
 */

function imzaGruplariniOlustur(imzacilar) {
  const n = imzacilar.length;
  if (n === 0) return [];

  const kalan = n % 4;
  const gruplar = [];

  if (kalan === 3) {
    gruplar.push(imzacilar.slice(0, 3));
    let i = 3;
    while (i < n) {
      gruplar.push(imzacilar.slice(i, i + 4));
      i += 4;
    }
    return gruplar;
  }

  if (kalan === 2 && n >= 6) {
    const sonIkiGrupOncesi = n - 6;
    let i = 0;
    while (i < sonIkiGrupOncesi) {
      gruplar.push(imzacilar.slice(i, i + 4));
      i += 4;
    }
    gruplar.push(imzacilar.slice(i, i + 3));
    gruplar.push(imzacilar.slice(i + 3, i + 6));
    return gruplar;
  }

  // kalan 0, 1, veya (kalan 2 ve n<6 - tek grup zaten yeterli)
  let i = 0;
  while (i < n) {
    gruplar.push(imzacilar.slice(i, i + 4));
    i += 4;
  }
  return gruplar;
}

module.exports = { imzaGruplariniOlustur };
