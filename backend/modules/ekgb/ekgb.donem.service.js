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

/**
 * Koleksiyon bossa, kullanicinin sagladigi "Eski Haline Getirme Bedeli
 * 2026" referans dosyasindaki 2026 sutunu degerleriyle ilk donemi
 * otomatik olusturur (app.js baslangicinda cagrilir).
 */
async function gerekirseIlkDonemiYukle() {
  const mevcutSayi = await EkgbDonem.countDocuments();
  if (mevcutSayi > 0) return { yapildi: false, mevcutSayi };

  const fiyatlar2026 = [
    { kalemKod: 'derinSurum', fiyat: 511.87 },
    { kalemKod: 'surum', fiyat: 354.94 },
    { kalemKod: 'ikileme', fiyat: 266.21 },
    { kalemKod: 'tirmik', fiyat: 342.9 },
    { kalemKod: 'gubrelemeMakineli', fiyat: 179.9 },
    { kalemKod: 'ekimMibzer', fiyat: 658.24 },
    { kalemKod: 'temizlikTesviye', fiyat: 342.9 },
    { kalemKod: 'asfaltBetonSokumu', fiyat: 288.9 },
    { kalemKod: 'telOrguKaldirma', fiyat: 121.25 },
    { kalemKod: 'nakliyeUcreti', fiyat: 5 },
    { kalemKod: 'dokumSahasiGirisUcreti', fiyat: 5771 },
    { kalemKod: 'yuklemeIscilik1200', fiyat: 162 },
    { kalemKod: 'yuklemeIscilikFazla60', fiyat: 11 },
    { kalemKod: 'insaatYikintiBertaraf', fiyat: 405 },
    { kalemKod: 'toprakFiyati', fiyat: 800 },
    { kalemKod: 'italyanCimi', fiyat: 220 },
    { kalemKod: 'domuzAyrigi', fiyat: 600 },
    { kalemKod: 'yuksekCayirYumagi', fiyat: 500 },
    { kalemKod: 'cayirSalkimOtu', fiyat: 750 },
    { kalemKod: 'yonca', fiyat: 800 },
    { kalemKod: 'akUcgul', fiyat: 900 },
    { kalemKod: 'korunga', fiyat: 300 },
    { kalemKod: 'amonyumSulfat', fiyat: 25 },
    { kalemKod: 'yanmisHayvanGubresi', fiyat: 3 },
    { kalemKod: 'komposeGubre', fiyat: 40 },
  ];

  fiyatlariDogrula(fiyatlar2026);
  const donem = await EkgbDonem.create({
    donemAdi: '2026',
    yururlukTarihi: new Date(2026, 0, 1),
    fiyatlar: fiyatlar2026,
  });
  return { yapildi: true, donemId: donem._id };
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
  gerekirseIlkDonemiYukle,
};
