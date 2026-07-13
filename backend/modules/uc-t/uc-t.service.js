/**
 * uc-t.service.js
 */

const UcT = require('./uc-t.model');
const Ek4abSonuc = require('../ek4ab/ek4ab.model');

async function listele() {
  return UcT.find({ aktif: true }).sort({ createdAt: -1 });
}

async function getir(id) {
  const kayit = await UcT.findById(id).populate('ek4abKaydiId');
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  return kayit;
}

async function olustur({ il, ilce, koyMahalle }) {
  if (!il || !ilce || !koyMahalle) throw new Error('İl, ilçe ve köy/mahalle zorunludur.');
  return UcT.create({ il, ilce, koyMahalle });
}

async function sil(id) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  await UcT.findByIdAndDelete(id);
  return kayit;
}

/** Bir alt adımın (ana adım + alt adım indeksiyle) durumunu günceller. */
async function adimGuncelle(id, anaAdimIndex, altAdimIndex, { tamamlandiMi, not }) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);

  const anaAdim = kayit.surec[anaAdimIndex];
  if (!anaAdim) throw new Error('Ana adım bulunamadı.');
  const altAdim = anaAdim.altAdimlar[altAdimIndex];
  if (!altAdim) throw new Error('Alt adım bulunamadı.');

  if (tamamlandiMi !== undefined) {
    altAdim.tamamlandiMi = !!tamamlandiMi;
    altAdim.tamamlanmaTarihi = tamamlandiMi ? new Date() : undefined;
  }
  if (not !== undefined) altAdim.not = not;

  await kayit.save();
  return kayit;
}

/** Bu 3T kaydına TEMEL alınacak Ek-4ab kaydını SEÇER (bağımsız Ek-4ab modülünden referans). */
async function ek4abSec(id, ek4abKaydiId) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);

  if (ek4abKaydiId) {
    const ek4ab = await Ek4abSonuc.findById(ek4abKaydiId);
    if (!ek4ab) throw new Error('Seçilen Ek-4ab kaydı bulunamadı.');
    kayit.ek4abKaydiId = ek4abKaydiId;
  } else {
    kayit.ek4abKaydiId = undefined; // secimi kaldir
  }

  await kayit.save();
  return kayit;
}

/** Ayni koy/mahalle icin mevcut Ek-4ab kayitlarini (secim listesi icin) getirir. */
async function koyIcinEk4abAdaylari(il, ilce, koyMahalle) {
  return Ek4abSonuc.find({ il, ilce, koyMahalle }).select('il ilce koyMahalle uretimYili genelToplamBBHB createdAt').sort({ createdAt: -1 });
}

module.exports = { listele, getir, olustur, sil, adimGuncelle, ek4abSec, koyIcinEk4abAdaylari };
