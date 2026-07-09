/**
 * bbhb.service.js
 *
 * Orkestrasyon katmani. DIGER MODULLER (orn. tahsis) BU DOSYAYI CAGIRIR.
 * HTTP bilmez, ama DB (model) ve diger bbhb.* dosyalarini bir araya getirir.
 */

const { isletmeciBazindaHesapla } = require('./bbhb.core');
const { topluSiniflandir } = require('./bbhb.classifier');
const { dosyaOku, cokluDosyaOku } = require('./bbhb.import');
const { AKTIF_VERSIYON } = require('./bbhb.rules');
const BbhbSonuc = require('./bbhb.model');

/**
 * MANUEL YOL
 * @param {object} params
 * @param {Array<{isletmeciId, isletmeciAdi, grup, kategori, adet}>} params.kalemler
 * @param {{il, ilce, mahalle}} params.baslik
 */
function manuelHesapla({ kalemler, baslik }) {
  const { isletmeciSonuclari, genelToplamBBHB } =
    isletmeciBazindaHesapla(kalemler, AKTIF_VERSIYON);

  return {
    ...baslik,
    kaynakTipi: 'manuel',
    kaynakDosyalar: [],
    isletmeciSonuclari,
    genelToplamBBHB,
    kuralSetiVersiyonu: AKTIF_VERSIYON,
  };
}

/**
 * TURKVET YOLU
 * @param {object} params
 * @param {string[]} params.dosyaYollari - yuklenen dosyalarin sunucudaki yollari
 * @param {{il, ilce, mahalle}} params.baslik
 */
async function turkvetIleHesapla({ dosyaYollari, baslik }) {
  // 1-2. Dosyalari oku, birlestir
  const hamKayitlar = await cokluDosyaOku(dosyaYollari);

  // 3-4. Siniflandir (isletmeci bilgisi kayitta zaten var, core asamasinda gruplanacak)
  const siniflandirilmisKayitlar = topluSiniflandir(hamKayitlar);

  // Ayni isletmeci+grup+kategori icin adet=1 olan kayitlari topla
  const sayilmisKayitlar = adetleriTopla(siniflandirilmisKayitlar);

  // 5. Hesapla
  const { isletmeciSonuclari, genelToplamBBHB } =
    isletmeciBazindaHesapla(sayilmisKayitlar, AKTIF_VERSIYON);

  // 6. Sonucu don (henuz kaydetmeden - controller onizleme gosterip soracak)
  return {
    ...baslik,
    kaynakTipi: 'turkvet',
    kaynakDosyalar: dosyaYollari.map((p) => p.split('/').pop()),
    isletmeciSonuclari,
    genelToplamBBHB,
    kuralSetiVersiyonu: AKTIF_VERSIYON,
  };
}

/** {isletmeciId, isletmeciAdi, grup, kategori, adet:1}[] -> adet:N olarak toplar */
function adetleriTopla(kayitlar) {
  const map = new Map();
  for (const k of kayitlar) {
    const anahtar = `${k.isletmeciId}::${k.grup}::${k.kategori}`;
    if (!map.has(anahtar)) {
      map.set(anahtar, { ...k, adet: 0 });
    }
    map.get(anahtar).adet += k.adet;
  }
  return Array.from(map.values());
}

/**
 * 7. Onizlemeden sonra kullanici "kaydet" derse cagrilir.
 * ONEMLI: Guncelleme yapmaz, her zaman YENI kayit olusturur (immutable).
 */
async function sonucuKaydet(hesaplamaSonucu, olusturanKullaniciId) {
  const kayit = await BbhbSonuc.create({
    ...hesaplamaSonucu,
    olusturanKullaniciId,
    durum: 'aktif',
  });
  return kayit;
}

/** Diger moduller (orn. tahsis) referansla sonucu okumak icin bunu kullanir. */
async function sonucuGetir(bbhbSonucId) {
  const kayit = await BbhbSonuc.findById(bbhbSonucId);
  if (!kayit) throw new Error(`BBHB sonucu bulunamadi: ${bbhbSonucId}`);
  return kayit;
}

module.exports = {
  manuelHesapla,
  turkvetIleHesapla,
  sonucuKaydet,
  sonucuGetir,
};
