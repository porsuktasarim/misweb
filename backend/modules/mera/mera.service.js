/**
 * mera.service.js
 */

const MeraParseli = require('./mera.model');

function logEkle(kayit, islem, detay, kullaniciAdi) {
  kayit.loglar.push({ islem, detay, kullaniciAdi: kullaniciAdi || '', tarih: new Date() });
}

async function listele({ il, ilce, koyMahalle } = {}) {
  const filtre = {};
  if (il) filtre.il = il;
  if (ilce) filtre.ilce = ilce;
  if (koyMahalle) filtre.koyMahalle = koyMahalle;
  return MeraParseli.find(filtre).sort({ il: 1, ilce: 1, koyMahalle: 1, adaNo: 1, parselNo: 1 });
}

async function getir(id) {
  const kayit = await MeraParseli.findById(id);
  if (!kayit) throw new Error(`Mera parseli bulunamadı: ${id}`);
  return kayit;
}

async function olustur(veri, kullaniciAdi) {
  const kayit = new MeraParseli(veri);
  logEkle(kayit, 'olusturuldu', `${veri.il}/${veri.ilce}/${veri.koyMahalle} - Ada:${veri.adaNo || '-'} Parsel:${veri.parselNo || '-'}`, kullaniciAdi);
  await kayit.save();
  return kayit;
}

async function guncelle(id, veri, kullaniciAdi) {
  const kayit = await getir(id);
  const ALAN_LISTESI = [
    'il', 'ilce', 'koyMahalle', 'adaNo', 'parselNo', 'meraAlaniM2', 'tapuAlaniM2',
    'araziNiteligi', 'araziDurumSinifi', 'araziKaynagi',
    'tespitYapildiMi', 'tespitTarihi', 'tahditYapildiMi', 'tahditTarihi', 'tahsisYapildiMi', 'tahsisTarihi',
    'islahDurumu', 'egimi', 'topraksinifi', 'tapuKimlikNo',
  ];
  ALAN_LISTESI.forEach((alan) => { if (veri[alan] !== undefined) kayit[alan] = veri[alan]; });
  logEkle(kayit, 'guncellendi', 'Parsel bilgileri güncellendi', kullaniciAdi);
  await kayit.save();
  return kayit;
}

async function sil(id) {
  const kayit = await MeraParseli.findByIdAndDelete(id);
  if (!kayit) throw new Error(`Mera parseli bulunamadı: ${id}`);
  return kayit;
}

/** Not EKLER - notlar ASLA SILINEMEZ, sadece notDuzenle ile GUNCELLENEBILIR (versiyon gecmisiyle). */
async function notEkle(id, metin, kullaniciAdi) {
  const kayit = await getir(id);
  if (!metin || !metin.trim()) throw new Error('Not metni boş olamaz.');
  kayit.notlar.push({ metin: metin.trim(), olusturanKullanici: kullaniciAdi || '', olusturmaTarihi: new Date() });
  logEkle(kayit, 'notEklendi', metin.trim().slice(0, 80), kullaniciAdi);
  await kayit.save();
  return kayit;
}

/** Notu DUZENLER - ESKI metin versiyon gecmisine eklenir (KAYBOLMAZ), yeni metin GUNCEL hali olur. */
async function notDuzenle(id, notIndex, yeniMetin, kullaniciAdi) {
  const kayit = await getir(id);
  const not_ = kayit.notlar[notIndex];
  if (!not_) throw new Error('Not bulunamadı.');
  if (!yeniMetin || !yeniMetin.trim()) throw new Error('Not metni boş olamaz.');
  not_.versiyonlar.push({ metin: not_.metin, degistirmeTarihi: new Date(), degistirenKullanici: kullaniciAdi || '' });
  not_.metin = yeniMetin.trim();
  logEkle(kayit, 'notDuzenlendi', `Not #${notIndex + 1} düzenlendi`, kullaniciAdi);
  await kayit.save();
  return kayit;
}

/** Nota DOSYA EKLER (notun kendisi silinemez/degistirilemez kuralindan BAGIMSIZ - dosya EKLENEBILIR, cikarilamaz). */
async function notDosyaEkle(id, notIndex, dosya, kullaniciAdi) {
  const kayit = await getir(id);
  const not_ = kayit.notlar[notIndex];
  if (!not_) throw new Error('Not bulunamadı.');
  if (!dosya) throw new Error('Dosya seçilmedi.');
  not_.dosyaEkleri.push({ dosyaYolu: dosya.path, orijinalAd: dosya.originalname, yuklemeTarihi: new Date() });
  logEkle(kayit, 'dosyaEklendi', `Not #${notIndex + 1} - ${dosya.originalname}`, kullaniciAdi);
  await kayit.save();
  return kayit;
}

module.exports = {
  listele, getir, olustur, guncelle, sil, notEkle, notDuzenle, notDosyaEkle,
  ARAZI_NITELIKLERI: MeraParseli.ARAZI_NITELIKLERI, ARAZI_KAYNAKLARI: MeraParseli.ARAZI_KAYNAKLARI, TOPRAK_SINIFLARI: MeraParseli.TOPRAK_SINIFLARI,
};
