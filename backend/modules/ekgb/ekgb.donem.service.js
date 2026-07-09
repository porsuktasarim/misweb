/**
 * ekgb.donem.service.js
 *
 * Birim fiyat donemlerinin yonetimi. EKLENEBILIR + DUZENLENEBILIR,
 * SILME UC NOKTASI YOK (bilinclii - eski donemler hep kalmali).
 */

const EkgbDonem = require('./ekgb.donem.model');
const { EKGB_KALEMLER } = require('./ekgb.kalemler');

function fiyatlariDogrula(fiyatlar) {
  const gecerliKodlar = new Set(EKGB_KALEMLER.map((k) => k.kod));
  for (const f of fiyatlar) {
    if (!gecerliKodlar.has(f.kalemKod)) {
      throw new Error(`Bilinmeyen kalem kodu: ${f.kalemKod}`);
    }
  }
  const eksikler = EKGB_KALEMLER.filter((k) => !fiyatlar.some((f) => f.kalemKod === k.kod));
  if (eksikler.length > 0) {
    throw new Error(`Eksik kalem fiyatları: ${eksikler.map((k) => k.ad).join(', ')}`);
  }
}

async function donemleriListele() {
  return EkgbDonem.find().sort({ yururlukTarihi: -1 });
}

async function donemGetir(id) {
  const donem = await EkgbDonem.findById(id);
  if (!donem) throw new Error(`Dönem bulunamadı: ${id}`);
  return donem;
}

async function donemEkle({ donemAdi, yururlukTarihi, fiyatlar }) {
  fiyatlariDogrula(fiyatlar);
  return EkgbDonem.create({ donemAdi, yururlukTarihi, fiyatlar });
}

/** Duzenleme izinlidir (kullanicinin acik istegi) - ama SILME yok. */
async function donemGuncelle(id, { donemAdi, yururlukTarihi, fiyatlar }) {
  fiyatlariDogrula(fiyatlar);
  const donem = await EkgbDonem.findByIdAndUpdate(
    id,
    { donemAdi, yururlukTarihi, fiyatlar },
    { new: true, runValidators: true }
  );
  if (!donem) throw new Error(`Dönem bulunamadı: ${id}`);
  return donem;
}

/** Donem fiyatlarini {kalemKod: fiyat} haritasina cevirir - core.js bunu bekler. */
function fiyatHaritasinaCevir(donem) {
  const harita = {};
  for (const f of donem.fiyatlar) harita[f.kalemKod] = f.fiyat;
  return harita;
}

module.exports = {
  donemleriListele,
  donemGetir,
  donemEkle,
  donemGuncelle,
  fiyatHaritasinaCevir,
};
