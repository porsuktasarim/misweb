/**
 * teknikEkip.service.js
 */

const TeknikEkip = require('./teknikEkip.model');
const { imzaKurumMetniOlustur } = require('./personel.kurumlar');
const { dosyaOku } = require('./teknikEkip.import');

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

/** "1 Nolu Şile Teknik Ekibi" gibi görüntü adını üretir */
function ekipAdiOlustur(ekip) {
  return ekip.ekipNo ? `${ekip.ekipNo} Nolu ${ekip.ilce} Teknik Ekibi` : `${ekip.ilce} Teknik Ekip`;
}

async function ekipOlustur({ yil, ilce, il, ekipNo }) {
  const mevcut = await TeknikEkip.findOne({ yil, ilce, ekipNo: ekipNo || null });
  if (mevcut) throw new Error(`${yil} yılı için bu numaralı "${ilce}" ekibi zaten var`);
  return TeknikEkip.create({ yil, ilce, il, ekipNo: ekipNo || undefined, uyeler: [] });
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

/** Dosyadan okunan uyeleri MEVCUT uye listesine EKLER (yerine koymaz). */
async function topluUyeYukle(id, dosyaYolu) {
  const yeniUyelerHam = await dosyaOku(dosyaYolu);
  if (yeniUyelerHam.length === 0) throw new Error('Dosyada geçerli üye satırı bulunamadı');

  const kayit = await TeknikEkip.findById(id);
  if (!kayit) throw new Error(`Teknik ekip bulunamadı: ${id}`);

  const yeniUyeler = uyeleriHesapla(yeniUyelerHam);
  kayit.uyeler = [...kayit.uyeler, ...yeniUyeler];
  await kayit.save();
  return { kayit, eklenenSayisi: yeniUyeler.length };
}

module.exports = {
  hepsiniListele,
  ekipGetir,
  ekipOlustur,
  ekipAdiOlustur,
  uyeleriGuncelle,
  ekipSil,
  topluUyeYukle,
};
