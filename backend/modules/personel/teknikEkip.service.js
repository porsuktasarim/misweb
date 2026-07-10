/**
 * teknikEkip.service.js
 */

const TeknikEkip = require('./teknikEkip.model');
const { imzaKurumMetniOlustur } = require('./personel.kurumlar');

/** Uye listesindeki her uye icin imza kurum metnini (yeniden) hesaplar */
function uyeleriHesapla(uyeler) {
  return uyeler.map((u) => ({
    ...u,
    imzaKurumMetni: imzaKurumMetniOlustur(u.kurumKod, {
      serbestMetin: u.serbestMetin,
      secilenYer: u.secilenYer,
    }),
  }));
}

/** Tum yillari ve o yila ait ilce ekiplerini gruplu dondurur */
async function hepsiniListele() {
  const kayitlar = await TeknikEkip.find().sort({ yil: -1, ilce: 1 });
  const yillikGruplar = new Map();
  for (const k of kayitlar) {
    if (!yillikGruplar.has(k.yil)) yillikGruplar.set(k.yil, []);
    yillikGruplar.get(k.yil).push(k);
  }
  return Array.from(yillikGruplar.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([yil, ekipler]) => ({ yil, ekipler }));
}

async function ekipGetir(id) {
  const kayit = await TeknikEkip.findById(id);
  if (!kayit) throw new Error(`Teknik ekip bulunamadı: ${id}`);
  return kayit;
}

async function ekipOlustur({ yil, ilce, il }) {
  const mevcut = await TeknikEkip.findOne({ yil, ilce });
  if (mevcut) throw new Error(`${yil} yılı için "${ilce}" ekibi zaten var`);
  return TeknikEkip.create({ yil, ilce, il, uyeler: [] });
}

async function uyeleriGuncelle(id, uyeler) {
  const hesaplanmisUyeler = uyeleriHesapla(uyeler);
  const kayit = await TeknikEkip.findByIdAndUpdate(
    id,
    { uyeler: hesaplanmisUyeler },
    { new: true, runValidators: true }
  );
  if (!kayit) throw new Error(`Teknik ekip bulunamadı: ${id}`);
  return kayit;
}

async function ekipSil(id) {
  const kayit = await TeknikEkip.findByIdAndDelete(id);
  if (!kayit) throw new Error(`Teknik ekip bulunamadı: ${id}`);
  return kayit;
}

module.exports = { hepsiniListele, ekipGetir, ekipOlustur, uyeleriGuncelle, ekipSil };
