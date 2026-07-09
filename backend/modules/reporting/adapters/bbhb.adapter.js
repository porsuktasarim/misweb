/**
 * bbhb.adapter.js
 *
 * BBHB sonuc dokumanini (bbhb.model.js seklinde) ortak rapor
 * contract'ina cevirir. BBHB'ye ozel tek dosya budur - exporter'lar
 * bunu hic bilmez.
 */

const lang = require('../../../../config/lang/tr');
const { katsayiTablosunuGetir } = require('../../bbhb/bbhb.rules');

function bbhbToContract(bbhbSonuc) {
  const isletmeciler = bbhbSonuc.isletmeciSonuclari.map((is) => ({
    isletmeciAdi: is.isletmeciAdi,
    kayitlar: is.detaylar.map((d) => ({
      grup: lang.bbhb.gruplar[d.grup] || d.grup,
      kategori: lang.bbhb.kategoriler[d.kategori] || d.kategori,
      adet: d.adet,
      katsayi: d.katsayi,
      deger: d.bbhb,
    })),
    isletmeciToplami: is.isletmeciToplamBBHB,
  }));

  const siniflandirmaKriterleri = katsayiTablosunuGetir(
    bbhbSonuc.kuralSetiVersiyonu
  ).map((s) => ({
    grup: lang.bbhb.gruplar[s.grup] || s.grup,
    kategori: lang.bbhb.kategoriler[s.kategori] || s.kategori,
    katsayi: s.katsayi,
  }));

  return {
    modulAdi: lang.bbhb.kisaAd,
    baslik: {
      il: bbhbSonuc.il,
      ilce: bbhbSonuc.ilce,
      mahalle: bbhbSonuc.mahalle,
    },
    isletmeciler,
    genelToplam: bbhbSonuc.genelToplamBBHB,
    ozet: {
      [lang.bbhb.alanlar.kaynakTipi]: lang.bbhb.kaynakTipi[bbhbSonuc.kaynakTipi],
      [lang.bbhb.alanlar.kuralSetiVersiyonu]: bbhbSonuc.kuralSetiVersiyonu,
      [lang.ortak.isletmeci + ' Sayisi']: isletmeciler.length,
    },
    siniflandirmaKriterleri,
    olusturmaTarihi: bbhbSonuc.createdAt || new Date(),
  };
}

module.exports = { bbhbToContract };
