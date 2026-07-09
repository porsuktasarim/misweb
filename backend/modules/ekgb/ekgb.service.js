/**
 * ekgb.service.js
 *
 * Hesaplama orkestrasyonu + kayitli sonuclarin CRUD'u.
 * DIGER MODULLER (varsa) BU DOSYAYI CAGIRIR.
 */

const { hesapla } = require('./ekgb.core');
const donemService = require('./ekgb.donem.service');
const EkgbSonuc = require('./ekgb.model');

/**
 * Onizleme hesaplamasi - henuz kaydetmez.
 * @param {object} params
 * @param {string} params.donemId
 * @param {object} params.alanBilgileri
 */
async function onizlemeHesapla({ donemId, alanBilgileri }) {
  const donem = await donemService.donemGetir(donemId);
  const fiyatHaritasi = donemService.fiyatHaritasinaCevir(donem);
  const sonuc = hesapla(alanBilgileri, fiyatHaritasi);
  return { ...sonuc, donemId: donem._id, donemAdi: donem.donemAdi, alanBilgileri };
}

async function sonucuKaydet(veri, olusturanKullaniciId) {
  return EkgbSonuc.create({ ...veri, olusturanKullaniciId, durum: 'aktif' });
}

async function sonucuGetir(id) {
  const kayit = await EkgbSonuc.findById(id);
  if (!kayit) throw new Error(`EKGB sonucu bulunamadı: ${id}`);
  return kayit;
}

async function sonuclariListele() {
  return EkgbSonuc.find({ durum: 'aktif' }).sort({ createdAt: -1 });
}

async function sonucuSil(id) {
  const kayit = await EkgbSonuc.findByIdAndDelete(id);
  if (!kayit) throw new Error(`EKGB sonucu bulunamadı: ${id}`);
  return kayit;
}

module.exports = {
  onizlemeHesapla,
  sonucuKaydet,
  sonucuGetir,
  sonuclariListele,
  sonucuSil,
};
