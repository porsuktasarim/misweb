/**
 * bbhb.service.js
 *
 * Orkestrasyon katmani. DIGER MODULLER (orn. tahsis) BU DOSYAYI CAGIRIR.
 *
 * ONEMLI TASARIM KARARI: Sonuc her zaman "bolumler" dizisi seklinde
 * doner - tek bir il/ilce/mahalle degil. Cunku Turkvet dosyasi birden
 * fazla mahalleden kayit icerebilir; her farkli (il, ilce, mahalle)
 * ucluesu kendi bolumunu olusturur, rapor da bolum bolum uretilir.
 * Manuel giris de ayni seklide TEK bolumluk bir sonuc olarak sarilir -
 * boylece model/raporlama katmani kaynagi (manuel/turkvet) hic bilmez.
 */

const { isletmeciBazindaHesapla } = require('./bbhb.core');
const { topluSiniflandir } = require('./bbhb.classifier');
const { cokluDosyaOku } = require('./bbhb.import');
const { AKTIF_VERSIYON } = require('./bbhb.rules');
const BbhbSonuc = require('./bbhb.model');

/** Ayni isletmeci+grup+kategori icin adet=1 olan kayitlari toplar */
function adetleriTopla(kayitlar) {
  const map = new Map();
  for (const k of kayitlar) {
    const anahtar = `${k.isletmeciId}::${k.grup}::${k.kategori}`;
    if (!map.has(anahtar)) map.set(anahtar, { ...k, adet: 0 });
    map.get(anahtar).adet += k.adet;
  }
  return Array.from(map.values());
}

/** Ham kayitlari (il, ilce, mahalle) ucluesune gore bolumlere ayirir */
function bolumlereAyir(hamKayitlar) {
  const map = new Map();
  for (const kayit of hamKayitlar) {
    const anahtar = `${kayit.il}::${kayit.ilce}::${kayit.mahalle}`;
    if (!map.has(anahtar)) {
      map.set(anahtar, {
        il: kayit.il,
        ilce: kayit.ilce,
        mahalle: kayit.mahalle,
        kayitlar: [],
      });
    }
    map.get(anahtar).kayitlar.push(kayit);
  }
  return Array.from(map.values());
}

/**
 * MANUEL YOL
 * Kaynakta il/ilce/mahalle bilgisi olmadigi icin kullanicidan alinir.
 * Sonuc yine de TEK elemanli bir "bolumler" dizisi olarak doner.
 *
 * @param {object} params
 * @param {Array<{isletmeciId, isletmeciAdi, grup, kategori, adet}>} params.kalemler
 * @param {{il, ilce, mahalle}} params.baslik
 */
function manuelHesapla({ kalemler, baslik }) {
  const { isletmeciSonuclari, genelToplamBBHB: bolumToplamBBHB } =
    isletmeciBazindaHesapla(kalemler, AKTIF_VERSIYON);

  return {
    kaynakTipi: 'manuel',
    kaynakDosyalar: [],
    bolumler: [
      {
        il: baslik.il,
        ilce: baslik.ilce,
        mahalle: baslik.mahalle,
        isletmeciSonuclari,
        bolumToplamBBHB,
      },
    ],
    genelToplamBBHB: bolumToplamBBHB,
    kuralSetiVersiyonu: AKTIF_VERSIYON,
  };
}

/**
 * TURKVET YOLU
 * İl/ilçe/mahalle dosyanin kendisinden okunur - kullanicidan istenmez.
 * Birden fazla mahalle varsa, sonuc birden fazla bolum icerir.
 *
 * @param {object} params
 * @param {string[]} params.dosyaYollari
 */
async function turkvetIleHesapla({ dosyaYollari }) {
  // 1-2. Dosyalari oku, birlestir
  const hamKayitlar = await cokluDosyaOku(dosyaYollari);

  // Il/ilce/mahalle bazinda bolumlere ayir
  const bolumGruplari = bolumlereAyir(hamKayitlar);

  const bolumler = [];
  let genelToplamBBHB = 0;

  for (const { il, ilce, mahalle, kayitlar } of bolumGruplari) {
    // 3-4. Isletmeci bilgisi kayitta var, siniflandir
    const siniflandirilmisKayitlar = topluSiniflandir(kayitlar);
    const sayilmisKayitlar = adetleriTopla(siniflandirilmisKayitlar);

    // 5. Hesapla (bu bolum icin)
    const { isletmeciSonuclari, genelToplamBBHB: bolumToplamBBHB } =
      isletmeciBazindaHesapla(sayilmisKayitlar, AKTIF_VERSIYON);

    bolumler.push({ il, ilce, mahalle, isletmeciSonuclari, bolumToplamBBHB });
    genelToplamBBHB += bolumToplamBBHB;
  }

  // 6. Sonucu don (henuz kaydetmeden - controller onizleme gosterip soracak)
  return {
    kaynakTipi: 'turkvet',
    kaynakDosyalar: dosyaYollari.map((p) => p.split('/').pop()),
    bolumler,
    genelToplamBBHB: Number(genelToplamBBHB.toFixed(2)),
    kuralSetiVersiyonu: AKTIF_VERSIYON,
  };
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

/** Kayitli sonuclarin listesini dondurur (en yeni en ustte). */
async function sonuclariListele() {
  return BbhbSonuc.find({ durum: 'aktif' })
    .sort({ createdAt: -1 })
    .select('bolumler genelToplamBBHB kaynakTipi kaynakDosyalar kuralSetiVersiyonu createdAt');
}

/**
 * Kaydi siler. NOT: Su an icin referans butunlugu kontrolu yok - ileride
 * tahsis modulu bu sonuca referans veriyorsa, silme oncesi kontrol
 * eklenmelidir (kullanici bu riski bilerek "istenilse silinsin" istedi).
 */
async function sonucuSil(bbhbSonucId) {
  const kayit = await BbhbSonuc.findByIdAndDelete(bbhbSonucId);
  if (!kayit) throw new Error(`BBHB sonucu bulunamadi: ${bbhbSonucId}`);
  return kayit;
}

module.exports = {
  manuelHesapla,
  turkvetIleHesapla,
  sonucuKaydet,
  sonucuGetir,
  sonuclariListele,
  sonucuSil,
};
