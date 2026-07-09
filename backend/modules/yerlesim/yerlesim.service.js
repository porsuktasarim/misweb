/**
 * yerlesim.service.js
 *
 * Il/Ilce/Mahalle-Koy CRUD orkestrasyonu + bundled JSON'dan ilk
 * yukleme (seed).
 */

const fs = require('fs/promises');
const path = require('path');
const YerlesimYeri = require('./yerlesim.model');

const SEED_DOSYASI = path.join(__dirname, 'veri/il-ilce-mahalle.json');

/** Distinct il listesi (alfabetik, Turkce sıralama) */
async function illeriGetir() {
  const iller = await YerlesimYeri.distinct('il');
  return iller.sort((a, b) => a.localeCompare(b, 'tr-TR'));
}

/** Bir ile ait distinct ilce listesi */
async function ilceleriGetir(il) {
  const ilceler = await YerlesimYeri.distinct('ilce', { il });
  return ilceler.sort((a, b) => a.localeCompare(b, 'tr-TR'));
}

/** Bir il+ilceye ait mahalle listesi (id dahil - duzenle/sil icin) */
async function mahalleleriGetir(il, ilce) {
  const kayitlar = await YerlesimYeri.find({ il, ilce }).select('mahalle').lean();
  return kayitlar
    .map((k) => ({ id: k._id, mahalle: k.mahalle }))
    .sort((a, b) => a.mahalle.localeCompare(b.mahalle, 'tr-TR'));
}

async function ekle({ il, ilce, mahalle }) {
  return YerlesimYeri.create({ il: il.trim(), ilce: ilce.trim(), mahalle: mahalle.trim() });
}

async function guncelle(id, { il, ilce, mahalle }) {
  const kayit = await YerlesimYeri.findByIdAndUpdate(
    id,
    { il: il.trim(), ilce: ilce.trim(), mahalle: mahalle.trim() },
    { new: true, runValidators: true }
  );
  if (!kayit) throw new Error(`Kayıt bulunamadı: ${id}`);
  return kayit;
}

async function sil(id) {
  const kayit = await YerlesimYeri.findByIdAndDelete(id);
  if (!kayit) throw new Error(`Kayıt bulunamadı: ${id}`);
  return kayit;
}

/** Bir ilin adini degistirir - o ile ait TUM kayitlarda toplu guncelleme yapar. */
async function ilGuncelle(eskiIl, yeniIl) {
  const sonuc = await YerlesimYeri.updateMany({ il: eskiIl }, { $set: { il: yeniIl.trim() } });
  if (sonuc.matchedCount === 0) throw new Error(`İl bulunamadı: ${eskiIl}`);
  return sonuc;
}

/** Bir ile ait TUM ilce ve koy/mahalleleri (kademeli) siler. */
async function ilSil(il) {
  const sonuc = await YerlesimYeri.deleteMany({ il });
  if (sonuc.deletedCount === 0) throw new Error(`İl bulunamadı: ${il}`);
  return sonuc;
}

/** Bir ilcenin adini degistirir - o il+ilceye ait TUM kayitlarda toplu guncelleme yapar. */
async function ilceGuncelle(il, eskiIlce, yeniIlce) {
  const sonuc = await YerlesimYeri.updateMany({ il, ilce: eskiIlce }, { $set: { ilce: yeniIlce.trim() } });
  if (sonuc.matchedCount === 0) throw new Error(`İlçe bulunamadı: ${eskiIlce}`);
  return sonuc;
}

/** Bir ilceye ait TUM koy/mahalleleri (kademeli) siler. */
async function ilceSil(il, ilce) {
  const sonuc = await YerlesimYeri.deleteMany({ il, ilce });
  if (sonuc.deletedCount === 0) throw new Error(`İlçe bulunamadı: ${ilce}`);
  return sonuc;
}

/** Koleksiyon bossa, bundled JSON'dan otomatik yukler (app.js baslangicinda cagrilir). */
async function gerekirseIlkYuklemeYap() {
  const mevcutSayi = await YerlesimYeri.countDocuments();
  if (mevcutSayi > 0) {
    return { yapildi: false, mevcutSayi };
  }

  const hamVeri = JSON.parse(await fs.readFile(SEED_DOSYASI, 'utf-8'));
  const PARCA_BOYUTU = 2000;
  let eklenen = 0;

  for (let i = 0; i < hamVeri.length; i += PARCA_BOYUTU) {
    const parca = hamVeri.slice(i, i + PARCA_BOYUTU);
    try {
      const sonuc = await YerlesimYeri.insertMany(parca, { ordered: false });
      eklenen += sonuc.length;
    } catch (err) {
      // ordered:false ile tekil dublicate hatalari diger kayitlari engellemez
      if (err.insertedDocs) eklenen += err.insertedDocs.length;
    }
  }

  return { yapildi: true, eklenen };
}

/** Manuel tetiklenen yeniden ice aktarma (Ayarlar ekranindaki buton icin) */
async function yenidenIceAktar() {
  await YerlesimYeri.deleteMany({});
  return gerekirseIlkYuklemeYap();
}

module.exports = {
  illeriGetir,
  ilceleriGetir,
  mahalleleriGetir,
  ekle,
  guncelle,
  sil,
  ilGuncelle,
  ilSil,
  ilceGuncelle,
  ilceSil,
  gerekirseIlkYuklemeYap,
  yenidenIceAktar,
};
