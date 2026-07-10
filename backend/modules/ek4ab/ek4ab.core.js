/**
 * ek4ab.core.js
 *
 * BBHB (Ek-4/b) ve CKS (Ek-4/a) sonuclarini TEK satirda birlestiren
 * saf mantik. "Kayitli BBHB'deki kisiler listelenecek, kayitli CKS'de
 * var ise bos sutunlar doldurulacak" - yani ANA LISTE HER ZAMAN BBHB'DIR,
 * CKS sadece EK bilgi kaynagidir (kisi CKS'de yoksa o sutunlar bos kalir).
 *
 * Eslestirme isim uzerinden yapilir (normalize edilmis - buyuk harf,
 * bosluk temizlenmis, Turkce locale) - iki farkli kaynak sistemin
 * (Turkvet/BBHB ve CKS) ayni kisiyi farkli yazim bicimiyle
 * kaydetmis olma ihtimaline karsi.
 *
 * BU MODUL ILERIDE "TAHSIS" MODULUNE EVRILECEK - simdilik sadece
 * Ek-4ab birlesik cetvelini uretiyor.
 */

const { isletmeciSatiriDizisi } = require('../reporting/sablonlar/bbhb-tablo-semasi');

function adiNormalize(ad) {
  return String(ad || '').trim().toLocaleUpperCase('tr-TR').replace(/\s+/g, ' ');
}

/**
 * @param {object} bbhbBolum - bbhbSonuc.bolumler[N] (tek bir bolum)
 * @param {object|null} cksSonuc - secilen CKS sonucu (null olabilir - CKS secilmemis olabilir)
 * @returns {Array} birlesik ciftci listesi (alfabetik sirali)
 */
function birlestir(bbhbBolum, cksSonuc) {
  const cksHaritasi = new Map();
  if (cksSonuc) {
    for (const c of cksSonuc.ciftciler) {
      cksHaritasi.set(adiNormalize(c.isletmeciAdi), c);
    }
  }

  const birlesikListe = bbhbBolum.isletmeciSonuclari.map((is) => {
    const toplamHayvanVarligi = is.detaylar.reduce((t, d) => t + d.adet, 0);
    // BBHB modelinde alan adlari "grup"/"kategori" - pivot fonksiyonu
    // "grupKodu"/"kategoriKodu" bekliyor (raporlama adaptorunde de
    // ayni donusum yapiliyor).
    const kayitlarNormalize = is.detaylar.map((d) => ({
      grupKodu: d.grup,
      kategoriKodu: d.kategori,
      adet: d.adet,
    }));
    const hayvanPivot = isletmeciSatiriDizisi(kayitlarNormalize);
    const cksEslesme = cksHaritasi.get(adiNormalize(is.isletmeciAdi));

    return {
      isletmeciAdi: is.isletmeciAdi,
      yemBitkisi: cksEslesme ? cksEslesme.yemBitkisi : null,
      sebzeBag: cksEslesme ? cksEslesme.sebzeMeyve : null,
      hububat: cksEslesme ? cksEslesme.hububatYagli : null,
      tarim: cksEslesme ? cksEslesme.tarim : false,
      hayvancilik: toplamHayvanVarligi > 0,
      toplamHayvanVarligi,
      hayvanPivot, // 16 elemanli dizi - bbhb-tablo-semasi.js sutun sirasiyla ayni
      isletmeciToplamBBHB: is.isletmeciToplamBBHB,
      cksEslesmeVarMi: Boolean(cksEslesme),
    };
  });

  birlesikListe.sort((a, b) => a.isletmeciAdi.localeCompare(b.isletmeciAdi, 'tr-TR'));

  const eslesmeyenSayisi = birlesikListe.filter((c) => !c.cksEslesmeVarMi).length;

  return { birlesikListe, eslesmeyenSayisi };
}

module.exports = { birlestir, adiNormalize };
