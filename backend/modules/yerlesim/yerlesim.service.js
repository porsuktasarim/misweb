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

/**
 * Arama fonksiyonlari icin BELLEK ICI onbellek. MongoDB'nin $regex + 'i'
 * secenegi Turkce karakterlerde (ı/İ/ş/ğ) TAM Unicode buyuk-kucuk harf
 * katlamasi YAPMIYOR (PCRE varsayilan olarak sadece ASCII katliyor) -
 * bu yuzden "şile" aramasi alakasiz sonuclar dondurebiliyordu. Node'un
 * KENDI toLocaleLowerCase('tr-TR') motoru Turkce'yi doğru isliyor, o
 * yuzden arama artik JS TARAFINDA (Mongo regex kullanilmadan) yapiliyor.
 */
let aramaOnbellegi = null;

async function aramaOnbellegeYukle() {
  if (aramaOnbellegi) return aramaOnbellegi;
  const kayitlar = await YerlesimYeri.find().select('il ilce mahalle').lean();
  aramaOnbellegi = kayitlar.map((k) => ({
    il: k.il,
    ilce: k.ilce,
    mahalle: k.mahalle,
    birlesikKucuk: `${k.il} ${k.ilce} ${k.mahalle}`.toLocaleLowerCase('tr-TR'),
  }));
  return aramaOnbellegi;
}

/** Veri degistiginde (ekle/duzenle/sil/ice-aktar) onbellek gecersiz kilinir - dis modullerden de cagrilabilir */
function aramaOnbellegiGecersizKil() {
  aramaOnbellegi = null;
}

/**
 * Sorgu kelimelerinin dogru alanlarda gecip gecmedigini kontrol eder.
 * ILK KELIME MUTLAKA MAHALLE ADINDA gecmeli (aksi halde "ovacık" gibi
 * bir arama, alakasiz sekilde "Ovacık" ADLI ILCEDEKI butun koyleri de
 * yanlislikla eslestiriyordu - ilce adinin kendisi arama teriminde
 * gectigi icin). Sonraki kelimeler (varsa) il/ilce/mahalle'nin
 * HERHANGI BIRINDE gecebilir - "kızılca şile" gibi ayirt edici
 * aramalar icin.
 */
function koyMahalleEslesiyorMu(kayit, sorgu) {
  const kelimeler = sorgu.toLocaleLowerCase('tr-TR').trim().split(/\s+/).filter(Boolean);
  if (kelimeler.length === 0) return false;
  const mahalleKucuk = kayit.mahalle.toLocaleLowerCase('tr-TR');
  if (!mahalleKucuk.includes(kelimeler[0])) return false;
  return kelimeler.slice(1).every((k) => kayit.birlesikKucuk.includes(k));
}

/**
 * Koy/mahalle adinda ARAMA (ulke geneli, il/ilce onceden secilmeden).
 * "kızılca" veya "kızılca şile" veya "kızılca istanbul" gibi coklu
 * kelimeli sorgular da desteklenir (butun kelimeler eslesmeli).
 * Muhtarlik/Mahalli Bilirkisi kurum secimi icin kullanilir.
 */
async function koyMahalleAra(sorgu, limit = 200) {
  if (!sorgu || sorgu.trim().length < 2) return [];
  const onbellek = await aramaOnbellegeYukle();
  const sonuc = onbellek
    .filter((k) => koyMahalleEslesiyorMu(k, sorgu))
    .map((k) => ({ il: k.il, ilce: k.ilce, mahalle: k.mahalle }))
    .sort((a, b) => a.mahalle.localeCompare(b.mahalle, 'tr-TR'))
    .slice(0, limit); // ONEMLI: once sirala, SONRA kes - aksi halde ilk 50'ye giren rastgele/alakasiz kayitlar limiti tuketiyordu
  return sonuc;
}

/**
 * Il VEYA ilce adinda ARAMA (ulke geneli) - Belediye Baskanligi kurum
 * secimi icin. Sonucta hem il-seviyesi hem ilce-seviyesi eslesmeler
 * ayri ayri (tip: 'il' | 'ilce') donebilir.
 */
async function ilVeyaIlceAra(sorgu, limit = 200) {
  if (!sorgu || sorgu.trim().length < 2) return [];
  const onbellek = await aramaOnbellegeYukle();
  const sorguKucuk = sorgu.toLocaleLowerCase('tr-TR').trim();

  const ilSeti = new Set();
  const ilceHaritasi = new Map();
  for (const k of onbellek) {
    if (k.il.toLocaleLowerCase('tr-TR').includes(sorguKucuk)) ilSeti.add(k.il);
    if (k.ilce.toLocaleLowerCase('tr-TR').includes(sorguKucuk)) ilceHaritasi.set(`${k.il}::${k.ilce}`, { il: k.il, ilce: k.ilce });
  }

  const sonuc = [
    ...Array.from(ilSeti).map((il) => ({ tip: 'il', il })),
    ...Array.from(ilceHaritasi.values()).map((k) => ({ tip: 'ilce', il: k.il, ilce: k.ilce })),
  ];
  return sonuc.slice(0, limit);
}

async function ekle({ il, ilce, mahalle }) {
  const kayit = await YerlesimYeri.create({ il: il.trim(), ilce: ilce.trim(), mahalle: mahalle.trim() });
  aramaOnbellegiGecersizKil();
  return kayit;
}

async function guncelle(id, { il, ilce, mahalle }) {
  const kayit = await YerlesimYeri.findByIdAndUpdate(
    id,
    { il: il.trim(), ilce: ilce.trim(), mahalle: mahalle.trim() },
    { new: true, runValidators: true }
  );
  if (!kayit) throw new Error(`Kayıt bulunamadı: ${id}`);
  aramaOnbellegiGecersizKil();
  return kayit;
}

async function sil(id) {
  const kayit = await YerlesimYeri.findByIdAndDelete(id);
  if (!kayit) throw new Error(`Kayıt bulunamadı: ${id}`);
  aramaOnbellegiGecersizKil();
  return kayit;
}

/** Bir ilin adini degistirir - o ile ait TUM kayitlarda toplu guncelleme yapar. */
async function ilGuncelle(eskiIl, yeniIl) {
  const sonuc = await YerlesimYeri.updateMany({ il: eskiIl }, { $set: { il: yeniIl.trim() } });
  if (sonuc.matchedCount === 0) throw new Error(`İl bulunamadı: ${eskiIl}`);
  aramaOnbellegiGecersizKil();
  return sonuc;
}

/** Bir ile ait TUM ilce ve koy/mahalleleri (kademeli) siler. */
async function ilSil(il) {
  const sonuc = await YerlesimYeri.deleteMany({ il });
  if (sonuc.deletedCount === 0) throw new Error(`İl bulunamadı: ${il}`);
  aramaOnbellegiGecersizKil();
  return sonuc;
}

/** Bir ilcenin adini degistirir - o il+ilceye ait TUM kayitlarda toplu guncelleme yapar. */
async function ilceGuncelle(il, eskiIlce, yeniIlce) {
  const sonuc = await YerlesimYeri.updateMany({ il, ilce: eskiIlce }, { $set: { ilce: yeniIlce.trim() } });
  if (sonuc.matchedCount === 0) throw new Error(`İlçe bulunamadı: ${eskiIlce}`);
  aramaOnbellegiGecersizKil();
  return sonuc;
}

/** Bir ilceye ait TUM koy/mahalleleri (kademeli) siler. */
async function ilceSil(il, ilce) {
  const sonuc = await YerlesimYeri.deleteMany({ il, ilce });
  if (sonuc.deletedCount === 0) throw new Error(`İlçe bulunamadı: ${ilce}`);
  aramaOnbellegiGecersizKil();
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

  aramaOnbellegiGecersizKil();
  return { yapildi: true, eklenen };
}

/** Manuel tetiklenen yeniden ice aktarma (Ayarlar ekranindaki buton icin) */
async function yenidenIceAktar() {
  await YerlesimYeri.deleteMany({});
  aramaOnbellegiGecersizKil();
  return gerekirseIlkYuklemeYap();
}

module.exports = {
  illeriGetir,
  ilceleriGetir,
  mahalleleriGetir,
  koyMahalleAra,
  ilVeyaIlceAra,
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
