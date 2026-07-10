/**
 * ek4ab.service.js
 */

const { birlestir } = require('./ek4ab.core');
const bbhbService = require('../bbhb/bbhb.service');
const cksService = require('../cks/cks.service');
const Ek4abSonuc = require('./ek4ab.model');

/**
 * @param {object} params
 * @param {string} params.bbhbSonucId
 * @param {number} [params.bbhbBolumIndex=0]
 * @param {string} [params.cksSonucId] - opsiyonel, verilmezse tum CKS alanlari bos kalir
 */
async function onizlemeOlustur({ bbhbSonucId, bbhbBolumIndex = 0, cksSonucId }) {
  const bbhbSonuc = await bbhbService.sonucuGetir(bbhbSonucId);
  const bbhbBolum = bbhbSonuc.bolumler[bbhbBolumIndex];
  if (!bbhbBolum) throw new Error(`BBHB sonucunda ${bbhbBolumIndex}. bölüm bulunamadı`);

  const cksSonuc = cksSonucId ? await cksService.sonucuGetir(cksSonucId) : null;

  const { birlesikListe, eslesmeyenSayisi } = birlestir(bbhbBolum, cksSonuc);

  return {
    il: bbhbBolum.il,
    ilce: bbhbBolum.ilce,
    koyMahalle: bbhbBolum.mahalle,
    uretimYili: cksSonuc ? cksSonuc.uretimYili : undefined,
    bbhbSonucId,
    cksSonucId: cksSonucId || null,
    ciftciler: birlesikListe,
    genelToplamBBHB: bbhbBolum.bolumToplamBBHB,
    eslesmeyenSayisi,
  };
}

async function sonucuKaydet(veri, olusturanKullaniciId) {
  return Ek4abSonuc.create({ ...veri, olusturanKullaniciId, durum: 'aktif' });
}

async function sonucuGetir(id) {
  const kayit = await Ek4abSonuc.findById(id);
  if (!kayit) throw new Error(`Ek-4ab sonucu bulunamadı: ${id}`);
  return kayit;
}

async function sonuclariListele() {
  return Ek4abSonuc.find({ durum: 'aktif' }).sort({ createdAt: -1 });
}

async function sonucuSil(id) {
  const kayit = await Ek4abSonuc.findByIdAndDelete(id);
  if (!kayit) throw new Error(`Ek-4ab sonucu bulunamadı: ${id}`);
  return kayit;
}

module.exports = { onizlemeOlustur, sonucuKaydet, sonucuGetir, sonuclariListele, sonucuSil };
