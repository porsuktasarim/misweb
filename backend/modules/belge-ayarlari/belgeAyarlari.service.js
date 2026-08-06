/**
 * belgeAyarlari.service.js
 */

const BelgeAyarlari = require('./belgeAyarlari.model');

/** TEK kayit var - yoksa VARSAYILANLARLA olusturup dondurur (ilk cagrida). */
async function ayarlariGetir() {
  let kayit = await BelgeAyarlari.findOne();
  if (!kayit) kayit = await BelgeAyarlari.create({});
  return kayit;
}

async function ayarlariGuncelle({ imzaRengi, wordYaziTipi, temaBolumleri, haritaStili, meraDosyaTipleri }) {
  let kayit = await BelgeAyarlari.findOne();
  if (!kayit) kayit = new BelgeAyarlari({});
  if (imzaRengi) kayit.imzaRengi = imzaRengi;
  if (wordYaziTipi) kayit.wordYaziTipi = wordYaziTipi;
  if (temaBolumleri) kayit.temaBolumleri = temaBolumleri;
  if (haritaStili) {
    if (haritaStili.ustKatman) kayit.haritaStili.ustKatman = haritaStili.ustKatman;
    if (haritaStili.altKatmanlar) kayit.haritaStili.altKatmanlar = haritaStili.altKatmanlar;
  }
  if (meraDosyaTipleri) kayit.meraDosyaTipleri = meraDosyaTipleri;
  await kayit.save();
  return kayit;
}

module.exports = { ayarlariGetir, ayarlariGuncelle };
