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
  gerekirseIlkYuklemeYap,
  yenidenIceAktar,
};
