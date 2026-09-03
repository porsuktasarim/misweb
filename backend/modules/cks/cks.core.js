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
 * KULLANICININ ACIK ISTEGI: ÇKS dosyasi (Koy Genelinde Parsel Uretim
 * Belgesi) TEK BASINA BIRDEN FAZLA yerlesime (il/ilce/koy uclusune)
 * AIT kayitlar ICEREBILIR - onceden bu bilgi (cks.import.js zaten
 * DOSYADAN OKUYORDU) KULLANILMIYOR, TUM kayitlar kullanicinin ELLE
 * girdigi TEK bir "baslik" (il/ilce/koyMahalle) ALTINDA
 * BIRLESTIRILIYORDU - bu, FARKLI yerlesimlerin YANLISLIKLA TEK bir
 * ÇKS raporunun ICINE KARISMASINA sebep oluyordu.
 *
 * ARTIK: gruplama ANAHTARI (il, ilce, koy) UCLUSUNU DE ICERIYOR - HER
 * FARKLI yerlesim kendi BAGIMSIZ "yerlesim" grubuna DUSER, HER
 * yerlesimin KENDI ciftci listesi VE siniflandirma uyarilari OLUR.
 *
 * @param {Array} kayitlar - cks.import.js ciktisi (normalize kayitlar)
 * @returns {{yerlesimler: Array<{il, ilce, koyMahalle, ciftciler, siniflandirmaUyarilari}>}}
 */
function derle(kayitlar) {
  const yerlesimGruplari = new Map(); // "il::ilce::koy" -> { il, ilce, koyMahalle, ciftciGruplari: Map, uyarilar: Map }

  for (const kayit of kayitlar) {
    const yerlesimAnahtari = `${kayit.il}::${kayit.ilce}::${kayit.koy}`;
    if (!yerlesimGruplari.has(yerlesimAnahtari)) {
      yerlesimGruplari.set(yerlesimAnahtari, {
        il: kayit.il,
        ilce: kayit.ilce,
        koyMahalle: kayit.koy,
        ciftciGruplari: new Map(),
        uyarilar: new Map(),
      });
    }
    const yerlesim = yerlesimGruplari.get(yerlesimAnahtari);

    const ciftciAnahtari = kayit.isletmeciAdi;
    if (!yerlesim.ciftciGruplari.has(ciftciAnahtari)) {
      yerlesim.ciftciGruplari.set(ciftciAnahtari, {
        isletmeciAdi: kayit.isletmeciAdi,
        tcVkn: kayit.tcVkn,
        yemBitkisi: 0,
        sebzeMeyve: 0,
        hububatYagli: 0,
        detaylar: [],
      });
    }
    const grup = yerlesim.ciftciGruplari.get(ciftciAnahtari);
    const { kategori, eminlik } = kategoriBelirle(kayit.urun);

    grup[kategori] = yuvarla(grup[kategori] + kayit.ekiliAlan);
    grup.detaylar.push({ urun: kayit.urun, ekiliAlan: kayit.ekiliAlan, kategori, adaNo: kayit.adaNo, parselNo: kayit.parselNo });

    if (eminlik !== 'kesin' && !yerlesim.uyarilar.has(kayit.urun)) {
      yerlesim.uyarilar.set(kayit.urun, { urun: kayit.urun, kategori, eminlik });
    }
  }

  const yerlesimler = Array.from(yerlesimGruplari.values()).map((yerlesim) => ({
    il: yerlesim.il,
    ilce: yerlesim.ilce,
    koyMahalle: yerlesim.koyMahalle,
    ciftciler: Array.from(yerlesim.ciftciGruplari.values())
      .map((g) => ({ ...g, tarim: g.yemBitkisi > 0 || g.sebzeMeyve > 0 || g.hububatYagli > 0 }))
      .sort((a, b) => a.isletmeciAdi.localeCompare(b.isletmeciAdi, 'tr-TR')),
    siniflandirmaUyarilari: Array.from(yerlesim.uyarilar.values()).filter((u) => u.eminlik === 'varsayilan'),
  }));

  // Yerlesimleri de TUTARLI bir sirada (il, ilce, koy alfabetik) dondur.
  yerlesimler.sort((a, b) =>
    `${a.il}${a.ilce}${a.koyMahalle}`.localeCompare(`${b.il}${b.ilce}${b.koyMahalle}`, 'tr-TR')
  );

  return { yerlesimler };
}

module.exports = { derle };
