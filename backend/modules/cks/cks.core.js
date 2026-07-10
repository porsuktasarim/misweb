/**
 * cks.core.js
 *
 * SAF derleme motoru. Normalize CKS kayitlarini isletmeci (ciftci
 * ailesi) bazinda gruplayip, her urunu kategoriye ayirip (bkz.
 * cks.urun-siniflandirma.js) kategori bazinda Ekili Alan (da)
 * toplamlarini hesaplar. Ek-4/a formunun tek satirlik
 * "Çiftçi Ailesi / Yem Bitkisi / Sebze-Meyve / Hububat-Yağlı Tohumlar /
 * Tarım" sutunlarina birebir karsilik gelir.
 *
 * "Tarım" (Geçim Kaynağı) isareti: isletmecinin CKS listesinde en az
 * bir kaydi varsa (yani herhangi bir uretimi varsa) isaretlenir.
 * "Hayvancılık" ve "Hayvan Varlığı" bu modulde HIC DOLDURULMAZ - o
 * bilgi BBHB/Turkvet kaynaklidir, CKS listesinde yoktur.
 */

const { kategoriBelirle } = require('./cks.urun-siniflandirma');

function yuvarla(sayi) {
  return Math.round((sayi + Number.EPSILON) * 1000) / 1000;
}

/**
 * @param {Array} kayitlar - cks.import.js ciktisi (normalize kayitlar)
 * @returns {{ciftciler: Array, siniflandirmaUyarilari: Array}}
 */
function derle(kayitlar) {
  const gruplar = new Map();
  const uyarilar = new Map(); // urun -> {kategori, eminlik} (varsayilan/tahmini olanlari izler)

  for (const kayit of kayitlar) {
    const anahtar = kayit.isletmeciAdi;
    if (!gruplar.has(anahtar)) {
      gruplar.set(anahtar, {
        isletmeciAdi: kayit.isletmeciAdi,
        tcVkn: kayit.tcVkn,
        yemBitkisi: 0,
        sebzeMeyve: 0,
        hububatYagli: 0,
        detaylar: [],
      });
    }
    const grup = gruplar.get(anahtar);
    const { kategori, eminlik } = kategoriBelirle(kayit.urun);

    grup[kategori] = yuvarla(grup[kategori] + kayit.ekiliAlan);
    grup.detaylar.push({ urun: kayit.urun, ekiliAlan: kayit.ekiliAlan, kategori, adaNo: kayit.adaNo, parselNo: kayit.parselNo });

    if (eminlik !== 'kesin' && !uyarilar.has(kayit.urun)) {
      uyarilar.set(kayit.urun, { urun: kayit.urun, kategori, eminlik });
    }
  }

  const ciftciler = Array.from(gruplar.values())
    .map((g) => ({ ...g, tarim: g.yemBitkisi > 0 || g.sebzeMeyve > 0 || g.hububatYagli > 0 }))
    .sort((a, b) => a.isletmeciAdi.localeCompare(b.isletmeciAdi, 'tr-TR'));

  return {
    ciftciler,
    siniflandirmaUyarilari: Array.from(uyarilar.values()).filter((u) => u.eminlik === 'varsayilan'),
  };
}

module.exports = { derle };
