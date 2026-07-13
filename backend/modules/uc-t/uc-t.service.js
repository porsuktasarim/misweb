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

/** Tek bir tespit/tahdit evrakının tamamlandı durumunu günceller (indeks ile). */
async function evrakDurumunuGuncelle(id, evrakIndex, { tamamlandiMi, not }) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  const evrak = kayit.tespitTahditEvraklari[evrakIndex];
  if (!evrak) throw new Error('Evrak bulunamadı.');

  evrak.tamamlandiMi = !!tamamlandiMi;
  evrak.tamamlanmaTarihi = tamamlandiMi ? new Date() : undefined;
  if (not !== undefined) evrak.not = not;

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

module.exports = { listele, getir, olustur, sil, evrakDurumunuGuncelle, ek4abSec, koyIcinEk4abAdaylari };
