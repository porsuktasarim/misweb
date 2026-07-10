/**
 * cks.service.js
 *
 * Orkestrasyon: dosya okuma + derleme + kaydetme/listeleme/silme.
 */

const { dosyaOku } = require('./cks.import');
const { derle } = require('./cks.core');
const CksSonuc = require('./cks.model');

/**
 * Onizleme - henuz kaydetmez.
 * @param {object} params
 * @param {string[]} params.dosyaYollari
 * @param {{il, ilce, koyMahalle, uretimYili}} params.baslik
 */
async function onizlemeOlustur({ dosyaYollari, baslik }) {
  const tumKayitlar = [];
  for (const dosyaYolu of dosyaYollari) {
    const kayitlar = await dosyaOku(dosyaYolu);
    tumKayitlar.push(...kayitlar);
  }

  const { ciftciler, siniflandirmaUyarilari } = derle(tumKayitlar);

  return {
    il: baslik.il,
    ilce: baslik.ilce,
    koyMahalle: baslik.koyMahalle,
    uretimYili: baslik.uretimYili,
    kaynakDosyalar: dosyaYollari.map((p) => p.split('/').pop()),
    ciftciler,
    siniflandirmaUyarilari,
  };
}

async function sonucuKaydet(veri, olusturanKullaniciId) {
  const { siniflandirmaUyarilari, ...kayitVerisi } = veri;
  return CksSonuc.create({ ...kayitVerisi, olusturanKullaniciId, durum: 'aktif' });
}

async function sonucuGetir(id) {
  const kayit = await CksSonuc.findById(id);
  if (!kayit) throw new Error(`ÇKS sonucu bulunamadı: ${id}`);
  return kayit;
}

async function sonuclariListele() {
  return CksSonuc.find({ durum: 'aktif' }).sort({ createdAt: -1 });
}

async function sonucuSil(id) {
  const kayit = await CksSonuc.findByIdAndDelete(id);
  if (!kayit) throw new Error(`ÇKS sonucu bulunamadı: ${id}`);
  return kayit;
}

module.exports = { onizlemeOlustur, sonucuKaydet, sonucuGetir, sonuclariListele, sonucuSil };
