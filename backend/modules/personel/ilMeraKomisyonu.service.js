/**
 * ilMeraKomisyonu.service.js
 */

const IlMeraKomisyonu = require('./ilMeraKomisyonu.model');

/** Tum yillari gruplu dondurur (Teknik Ekip'teki ayni desen) */
async function hepsiniListele() {
  const kayitlar = await IlMeraKomisyonu.find().sort({ yil: -1, il: 1 });
  const yillikGruplar = new Map();
  for (const k of kayitlar) {
    if (!yillikGruplar.has(k.yil)) yillikGruplar.set(k.yil, []);
    yillikGruplar.get(k.yil).push(k);
  }
  return Array.from(yillikGruplar.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([yil, komisyonlar]) => ({ yil, komisyonlar }));
}

async function komisyonGetir(id) {
  const kayit = await IlMeraKomisyonu.findById(id);
  if (!kayit) throw new Error(`İl Mera Komisyonu kaydı bulunamadı: ${id}`);
  return kayit;
}

/** Bir il+yil icin (3T'nin il'ine gore) TEK komisyon kaydini bulur - Ek-4ab'deki koy eslesme deseniyle ayni. */
async function ilVeYilaGoreBul(il, yil) {
  return IlMeraKomisyonu.findOne({ il, yil });
}

/** Bir il icin TUM yillara ait komisyon kayitlarini (secim listesi icin) getirir. */
async function ilIcinKomisyonlar(il) {
  return IlMeraKomisyonu.find({ il }).sort({ yil: -1 });
}

async function komisyonOlustur({ yil, il }) {
  const mevcut = await IlMeraKomisyonu.findOne({ yil, il });
  if (mevcut) throw new Error(`${yil} yılı için "${il}" ili komisyonu zaten var`);
  return IlMeraKomisyonu.create({ yil, il, uyeler: [] });
}

async function uyeleriGuncelle(id, uyeler) {
  const kayit = await IlMeraKomisyonu.findById(id);
  if (!kayit) throw new Error(`İl Mera Komisyonu kaydı bulunamadı: ${id}`);
  kayit.uyeler = uyeler;
  await kayit.save();
  return kayit;
}

async function komisyonSil(id) {
  const kayit = await IlMeraKomisyonu.findByIdAndDelete(id);
  if (!kayit) throw new Error(`İl Mera Komisyonu kaydı bulunamadı: ${id}`);
  return kayit;
}

module.exports = {
  hepsiniListele, komisyonGetir, ilVeYilaGoreBul, ilIcinKomisyonlar,
  komisyonOlustur, uyeleriGuncelle, komisyonSil,
};
