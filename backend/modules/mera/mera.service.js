/**
 * mera.service.js
 */

const MeraParseli = require('./mera.model');
const path = require('path');
const lang = require('../../../config/lang/tr');
const meraImport = require('./mera.import');
const meraExport = require('./mera.export');
const haritaDonustur = require('./mera.harita-donustur');
const BelgeAyarlari = require('../belge-ayarlari/belgeAyarlari.model');

function logEkle(kayit, islem, detay, kullaniciAdi) {
  kayit.loglar.push({ islem, detay, kullaniciAdi: kullaniciAdi || '', tarih: new Date() });
}

async function listele({ il, ilce, koyMahalle, durum, arama } = {}) {
  const filtre = {};
  if (il) filtre.il = il;
  if (ilce) filtre.ilce = ilce;
  if (koyMahalle) filtre.koyMahalle = koyMahalle;
  // Varsayilan: "Silindi" durumundaki parseller listede GORUNMEZ (ama
  // veritabaninda KALICI olarak durur) - durum ACIKCA istenirse
  // (orn. "Aktif"/"Pasif"/"Silindi") o filtre uygulanir, "Tumu"
  // istenirse HICBIR durum filtresi uygulanmaz (hepsi gorunur).
  //
  // ONEMLI DUZELTME (gercek bir hata): `durum` alani SONRADAN
  // eklendigi icin ESKI kayitlarda bu alan HIC YOK (Mongoose
  // varsayilanlari GERIYE DONUK olarak eski belgelere ISLENMEZ) - "Aktif"
  // icin TAM ESLESME (`durum: 'Aktif'`) arandiginda bu ESKI kayitlar
  // YAKALANMIYORDU (alan yok = 'Aktif'e esit degil), liste BOS
  // gorunuyordu. `$in: ['Aktif', null]` KULLANIMI - MongoDB'de bu,
  // hem durum='Aktif' OLAN HEM DE alanin HIC OLMADIGI belgeleri
  // eslestirir (bilinen bir MongoDB davranisi) - ESKI kayitlar da
  // "Aktif" sayilir (semanin varsayilaniyla TUTARLI).
  if (durum === 'Tümü') { /* filtre yok */ }
  else if (durum === 'Aktif') filtre.durum = { $in: ['Aktif', null] };
  else if (durum) filtre.durum = durum;
  else filtre.durum = { $ne: 'Silindi' };

  // Il/Ilce/Koy-Mahalle/Ada/Parsel BAZLI serbest metin arama - Turkce
  // buyuk/kucuk harf donusumune GUVENILEMEDIGI (MongoDB regex bunu
  // dogru yapmaz) icin JS tarafinda (bellek-ici) filtrelenir - projenin
  // genelindeki desenle AYNI (bkz. diger modullerdeki Turkce arama notu).
  let sonuclar = await MeraParseli.find(filtre).sort({ il: 1, ilce: 1, koyMahalle: 1, adaNo: 1, parselNo: 1 });
  if (arama && arama.trim()) {
    const aramaKucuk = arama.trim().toLocaleLowerCase('tr-TR');
    sonuclar = sonuclar.filter((p) => [p.il, p.ilce, p.koyMahalle, p.adaNo, p.parselNo]
      .some((deger) => String(deger || '').toLocaleLowerCase('tr-TR').includes(aramaKucuk)));
  }
  return sonuclar;
}

async function getir(id) {
  const kayit = await MeraParseli.findById(id);
  if (!kayit) throw new Error(`${lang.mera.parselBulunamadi}: ${id}`);
  return kayit;
}

async function olustur(veri, kullaniciAdi) {
  const kayit = new MeraParseli(veri);
  logEkle(kayit, 'olusturuldu', `${veri.il}/${veri.ilce}/${veri.koyMahalle} - Ada:${veri.adaNo || '-'} Parsel:${veri.parselNo || '-'}`, kullaniciAdi);
  await kayit.save();
  return kayit;
}

const ALAN_ETIKETLERI = {
  il: 'İl', ilce: 'İlçe', koyMahalle: 'Köy/Mahalle', adaNo: 'Ada No', parselNo: 'Parsel No',
  meraAlaniM2: 'Mera Alanı', tapuAlaniM2: 'Tapu Alanı',
  araziNiteligi: 'Arazi Niteliği', araziDurumSinifi: 'Arazi Durum Sınıfı', araziKaynagi: 'Arazi Kaynağı',
  tespitYapildiMi: 'Tespit', tespitTarihi: 'Tespit Tarihi',
  tahditYapildiMi: 'Tahdit', tahditTarihi: 'Tahdit Tarihi',
  tahsisYapildiMi: 'Tahsis', tahsisTarihi: 'Tahsis Tarihi',
  islahDurumu: 'Islah Durumu', egimi: 'Eğimi', topraksinifi: 'Toprak Sınıfı', tapuKimlikNo: 'Tapu Kimlik No',
  mulkiyetDurumu: 'Mülkiyet Durumu',
};

/** Bir alan degerini LOG'da GORUNTULENECEK bicimde formatlar (birim/tarih/evet-hayir). */
function alanDegeriGoster(alan, deger) {
  if (deger === null || deger === undefined || deger === '') return '(boş)';
  if (alan === 'meraAlaniM2' || alan === 'tapuAlaniM2') return `${Number(deger).toLocaleString('tr-TR')} m²`;
  if (alan.endsWith('Tarihi')) return new Date(deger).toLocaleDateString('tr-TR');
  if (alan.endsWith('YapildiMi')) return deger ? 'Evet' : 'Hayır';
  return String(deger);
}

/** Karsilastirma icin degeri NORMALLESTIRIR (tarih/bos deger farklarindan yanlis "degisti" sonucunu ONLER). */
function alanKarsilastirmaDegeri(alan, deger) {
  if (deger === null || deger === undefined || deger === '') return '';
  if (alan.endsWith('Tarihi')) return new Date(deger).toISOString().slice(0, 10);
  return String(deger);
}

async function guncelle(id, veri, kullaniciAdi) {
  const kayit = await getir(id);
  const ALAN_LISTESI = [
    'il', 'ilce', 'koyMahalle', 'adaNo', 'parselNo', 'meraAlaniM2', 'tapuAlaniM2',
    'araziNiteligi', 'araziDurumSinifi', 'araziKaynagi',
    'tespitYapildiMi', 'tespitTarihi', 'tahditYapildiMi', 'tahditTarihi', 'tahsisYapildiMi', 'tahsisTarihi',
    'islahDurumu', 'egimi', 'topraksinifi', 'tapuKimlikNo', 'mulkiyetDurumu',
  ];
  // HER ALAN icin ESKI/YENI degeri KARSILASTIRIP sadece GERCEKTEN
  // degisenleri "Etiket: eski -> yeni" bicimindeki AYRINTILI log'a
  // ekliyoruz (kullanicinin ornegi: "Mera Alanı: 20.000 m² -> 22.222
  // m²") - genel "guncellendi" mesaji YETERSIZ bulundu.
  const degisiklikler = [];
  ALAN_LISTESI.forEach((alan) => {
    if (veri[alan] === undefined) return;
    const eskiKarsilastirma = alanKarsilastirmaDegeri(alan, kayit[alan]);
    const yeniKarsilastirma = alanKarsilastirmaDegeri(alan, veri[alan]);
    if (eskiKarsilastirma !== yeniKarsilastirma) {
      degisiklikler.push(`${ALAN_ETIKETLERI[alan] || alan}: ${alanDegeriGoster(alan, kayit[alan])} -> ${alanDegeriGoster(alan, veri[alan])}`);
    }
    kayit[alan] = veri[alan];
  });

  if (degisiklikler.length) {
    logEkle(kayit, 'guncellendi', degisiklikler.join(' | '), kullaniciAdi);
  }
  await kayit.save();
  return kayit;
}

/**
 * Parsel ASLA veritabanindan GERCEKTEN silinmez (sistemin genel
 * felsefesi - notlar/harita versiyonlari gibi). "Sil" ve "Pasife Al"
 * AYNI mekanizmayi (durum degisikligi) kullanir - SADECE hedef durum
 * farklidir. Gecerli degerler: 'Aktif' | 'Pasif' | 'Silindi'.
 */
/**
 * Parsel ASLA veritabanindan GERCEKTEN silinmez (sistemin genel
 * felsefesi - notlar/harita versiyonlari gibi). "Sil" ve "Pasife Al"
 * AYNI mekanizmayi (durum degisikligi) kullanir - SADECE hedef durum
 * farklidir. Gecerli degerler: 'Aktif' | 'Pasif' | 'Silindi'.
 * ACIKLAMA (aciklama) ZORUNLUDUR - HANGI GEREKCEYLE durumun degistigi
 * HER ZAMAN log'a YAZILIR (denetlenebilirlik icin).
 */
async function durumDegistir(id, yeniDurum, aciklama, kullaniciAdi) {
  const kayit = await getir(id);
  const GECERLI_DURUMLAR = MeraParseli.PARSEL_DURUMLARI;
  if (!GECERLI_DURUMLAR.includes(yeniDurum)) throw new Error(`Geçersiz durum: ${yeniDurum}`);
  if (!aciklama || !aciklama.trim()) throw new Error('Durum değişikliği için açıklama zorunludur.');
  const eskiDurum = kayit.durum;
  if (eskiDurum === yeniDurum) return kayit;
  kayit.durum = yeniDurum;
  logEkle(kayit, 'durumDegistirildi', `Durum: ${eskiDurum || 'Aktif'} -> ${yeniDurum} - Açıklama: ${aciklama.trim()}`, kullaniciAdi);
  await kayit.save();
  return kayit;
}

/** GERIYE DONUK UYUMLULUK icin - "Sil" ARTIK YUMUSAK (durum='Silindi'), gercekten SILMEZ. */
async function sil(id, aciklama, kullaniciAdi) {
  return durumDegistir(id, 'Silindi', aciklama, kullaniciAdi);
}

/** Not EKLER - notlar ASLA SILINEMEZ, sadece notDuzenle ile GUNCELLENEBILIR (versiyon gecmisiyle). */
async function notEkle(id, metin, kullaniciAdi) {
  const kayit = await getir(id);
  if (!metin || !metin.trim()) throw new Error(lang.mera.notMetniBosOlamaz);
  kayit.notlar.push({ metin: metin.trim(), olusturanKullanici: kullaniciAdi || '', olusturmaTarihi: new Date() });
  logEkle(kayit, 'notEklendi', metin.trim().slice(0, 80), kullaniciAdi);
  await kayit.save();
  return kayit;
}

/** Notu DUZENLER - ESKI metin versiyon gecmisine eklenir (KAYBOLMAZ), yeni metin GUNCEL hali olur. */
async function notDuzenle(id, notIndex, yeniMetin, kullaniciAdi) {
  const kayit = await getir(id);
  const not_ = kayit.notlar[notIndex];
  if (!not_) throw new Error(lang.mera.notBulunamadi);
  if (!yeniMetin || !yeniMetin.trim()) throw new Error(lang.mera.notMetniBosOlamaz);
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
  if (!not_) throw new Error(lang.mera.notBulunamadi);
  if (!dosya) throw new Error(lang.mera.dosyaSecilmedi);
  not_.dosyaEkleri.push({ dosyaYolu: dosya.path, orijinalAd: dosya.originalname, yuklemeTarihi: new Date() });
  logEkle(kayit, 'dosyaEklendi', `Not #${notIndex + 1} - ${dosya.originalname}`, kullaniciAdi);
  await kayit.save();
  return kayit;
}

/**
 * Excel/CSV dosyasindan TOPLU YUKLEME - eslesen (il+ilce+koyMahalle+
 * adaNo+parselNo) kayit VARSA GUNCELLENIR, YOKSA YENI olusturulur
 * (UPSERT) - ayni sablon TEKRAR yuklenirse kayit COGALMAZ.
 */
async function topluYukle(dosyaYolu, kullaniciAdi) {
  const parseller = await meraImport.dosyaOku(dosyaYolu);
  let eklenen = 0;
  let guncellenen = 0;

  for (const veri of parseller) {
    const mevcut = await MeraParseli.findOne({ il: veri.il, ilce: veri.ilce, koyMahalle: veri.koyMahalle, adaNo: veri.adaNo, parselNo: veri.parselNo });
    if (mevcut) {
      Object.assign(mevcut, veri);
      logEkle(mevcut, 'guncellendi', 'Toplu yükleme ile güncellendi', kullaniciAdi);
      await mevcut.save();
      guncellenen += 1;
    } else {
      const yeni = new MeraParseli(veri);
      logEkle(yeni, 'olusturuldu', 'Toplu yükleme ile oluşturuldu', kullaniciAdi);
      await yeni.save();
      eklenen += 1;
    }
  }

  return { toplam: parseller.length, eklenen, guncellenen };
}

async function sablonIndir() {
  return meraExport.sablonOlustur();
}

async function raporIndir(filtre) {
  const parseller = await listele(filtre);
  return meraExport.raporOlustur(parseller);
}

const HARITA_FORMAT_UZANTILARI = { '.geojson': 'geojson', '.json': 'json', '.kml': 'kml', '.gpx': 'gpx', '.kmz': 'kmz' };

/** Dosya adinda GUVENLI OLMAYAN karakterleri (bosluk, Turkce ozel karakter vb.) temizler - SADECE dosya adi icin, orijinal VERI/format DEGISMEZ. */
function dosyaAdiTemizle(metin) {
  const harfDonusumleri = { ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' };
  return String(metin || '')
    .split('').map((h) => harfDonusumleri[h] ?? h).join('')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Parsele YENI bir harita (CBS) dosyasi EKLER - FORMAT DONUSTURULMEZ
 * (kullanici hangi formatta yuklerse O FORMATTA saklanir). ESKI
 * VERSIYONLAR SILINMEZ - yeni versiyon EKLENIR (versiyonNo artarak),
 * otomatik olarak "IL-ILCE-MAHALLE-ADA-PARSEL-vN" adiyla adlandirilir.
 */
async function haritaDosyaYukle(id, dosya, kullaniciAdi) {
  const kayit = await getir(id);
  if (!dosya) throw new Error(lang.mera.dosyaSecilmedi);

  const uzanti = path.extname(dosya.originalname).toLowerCase();
  const formatTipi = HARITA_FORMAT_UZANTILARI[uzanti] || 'diger';
  const versiyonNo = kayit.haritaDosyalari.length + 1;
  const parcalar = [kayit.il, kayit.ilce, kayit.koyMahalle, kayit.adaNo, kayit.parselNo].map(dosyaAdiTemizle).filter(Boolean);
  const orijinalAd = `${parcalar.join('-')}-v${versiyonNo}${uzanti}`;

  // ORIJINAL dosya HER ZAMAN OLDUGU GIBI saklanir (degismez). AYRICA
  // otomatik olarak GeoJSON'a CEVRILIP (KML/KMZ/GPX -> GeoJSON;
  // GeoJSON/JSON zaten oyleyse OZELLIKLERI ZENGINLESTIRILEREK)
  // parselin GUNCEL bilgileri (ıslah durumu, egim vb.) HER feature'in
  // properties'ine GOMULUR - boylece (a) indirilen GeoJSON TEK BASINA
  // parselin verisini de tasir, (b) KMZ gibi Leaflet'in DOGRUDAN
  // GOSTEREMEDIGI formatlar da ARTIK haritada CIZILEBILIR hale gelir.
  // Donusum BASARISIZ olursa (bozuk dosya vb.) SESSIZCE GECILIR -
  // ORIJINAL dosya YINE DE kaydedilmis olur, sadece harita gosterimi
  // o versiyon icin calismayabilir.
  let geojsonYolu = null;
  try {
    const geojson = await haritaDonustur.dosyayiGeojsoneCevir(dosya.path, formatTipi, kayit);
    geojsonYolu = await haritaDonustur.geojsonKaydet(dosya.path, geojson);
  } catch (err) {
    console.error(`Harita dosyası GeoJSON'a çevrilemedi (${orijinalAd}):`, err.message);
  }

  kayit.haritaDosyalari.push({
    dosyaYolu: dosya.path, orijinalAd, formatTipi, versiyonNo, geojsonYolu,
    yuklemeTarihi: new Date(), yukleyenKullanici: kullaniciAdi || '',
  });
  logEkle(kayit, 'haritaDosyasiEklendi', `${orijinalAd} (v${versiyonNo})${geojsonYolu ? '' : ' - GeoJSON dönüşümü başarısız, sadece orijinal format kaydedildi'}`, kullaniciAdi);
  await kayit.save();
  return kayit;
}

/**
 * Ayni koy/mahalledeki DIGER parselleri (haricId HARIC), HER BIRININ
 * varsa EN SON harita dosyasi bilgisiyle birlikte dondurur - "Cevre
 * Parselleri Goster" secenegi icin.
 */
async function komsuParseller(il, ilce, koyMahalle, haricId) {
  const parseller = await MeraParseli.find({ il, ilce, koyMahalle, _id: { $ne: haricId } })
    .select('adaNo parselNo haritaDosyalari');
  return parseller
    .map((p) => ({
      _id: p._id, adaNo: p.adaNo, parselNo: p.parselNo,
      sonHaritaDosyasi: p.haritaDosyalari.length ? p.haritaDosyalari[p.haritaDosyalari.length - 1] : null,
    }))
    .filter((p) => p.sonHaritaDosyasi);
}

/**
 * Parselin "Dosyalar" sekmesine GENEL AMACLI bir belge EKLER (harita/
 * CBS dosyalarindan AYRI). dosyaTipiAnahtari, Sistem Ayarlari'ndaki
 * (BelgeAyarlari.meraDosyaTipleri) YONETILEBILIR bir tipe karsilik
 * gelir - o tip "otomatikAdlandirma: true" ise dosya "IL-ILCE-
 * MAHALLE-ADA-PARSEL-{TIP}-vN" seklinde OTOMATIK adlandirilir (harita
 * dosyalariyla AYNI mantik); false ise (veya tip belirtilmezse)
 * kullanicinin YUKLEDIGI ORIJINAL dosya adi KORUNUR.
 */
/** Sistem Ayarlari'ndaki (BelgeAyarlari) YONETILEBILIR mulkiyet durumu listesini getirir. */
async function mulkiyetDurumlariGetir() {
  const ayarlar = await BelgeAyarlari.findOne();
  return (ayarlar && ayarlar.meraMulkiyetDurumlari) || [];
}

async function dosyaYukle(id, dosya, dosyaTipiAnahtari, kullaniciAdi) {
  const kayit = await getir(id);
  if (!dosya) throw new Error(lang.mera.dosyaSecilmedi);

  const ayarlar = await BelgeAyarlari.findOne();
  const dosyaTipleri = (ayarlar && ayarlar.meraDosyaTipleri) || [];
  const tip = dosyaTipleri.find((t) => t.anahtar === dosyaTipiAnahtari);

  const uzanti = path.extname(dosya.originalname);
  let orijinalAd = dosya.originalname;
  if (tip && tip.otomatikAdlandirma) {
    const ayniTipSayisi = kayit.dosyalar.filter((d) => d.dosyaTipiAnahtari === dosyaTipiAnahtari).length;
    const parcalar = [kayit.il, kayit.ilce, kayit.koyMahalle, kayit.adaNo, kayit.parselNo, tip.ad].map(dosyaAdiTemizle).filter(Boolean);
    orijinalAd = `${parcalar.join('-')}-v${ayniTipSayisi + 1}${uzanti}`;
  }

  kayit.dosyalar.push({
    dosyaYolu: dosya.path, orijinalAd, dosyaTipiAnahtari: dosyaTipiAnahtari || '',
    formatUzantisi: uzanti.toLowerCase(), yuklemeTarihi: new Date(), yukleyenKullanici: kullaniciAdi || '',
  });
  logEkle(kayit, 'dosyaEklendi', `${orijinalAd}${tip ? ` (${tip.ad})` : ''}`, kullaniciAdi);
  await kayit.save();
  return kayit;
}

/**
 * Genel amacli bir DOSYAYI SILER (harita/CBS dosyalari BU FONKSIYONUN
 * KAPSAMI DISINDA - onlar versiyonlu/degismez kalmaya devam eder).
 * ACIKLAMA ZORUNLUDUR ve log'a yazilir - dosyanin KENDISI listeden
 * kalkar (fiziksel dosya diskte KALIR, kaza ile veri kaybi riskini
 * azaltmak icin - sadece kayit referansi kaldirilir).
 *
 * ILERIDE (kullanicinin notu): bu ve digger TUM "sil" islemleri
 * SADECE ADMIN yetkisine SAHIP kullanicilara ACILACAK - auth sistemi
 * kuruldugunda buraya yetki kontrolu EKLENMELI (henuz sistemde
 * gercek bir "kullanici girisi/rolu" olmadigi icin su an HERKES
 * kullanabiliyor).
 */
async function dosyaSil(id, dosyaIndex, aciklama, kullaniciAdi) {
  const kayit = await getir(id);
  const dosya = kayit.dosyalar[dosyaIndex];
  if (!dosya) throw new Error('Dosya bulunamadı.');
  if (!aciklama || !aciklama.trim()) throw new Error('Dosya silme için açıklama zorunludur.');
  const silinenAd = dosya.orijinalAd;
  kayit.dosyalar.splice(dosyaIndex, 1);
  logEkle(kayit, 'dosyaSilindi', `${silinenAd} - Açıklama: ${aciklama.trim()}`, kullaniciAdi);
  await kayit.save();
  return kayit;
}

module.exports = {
  listele, getir, olustur, guncelle, sil, durumDegistir, notEkle, notDuzenle, notDosyaEkle,
  topluYukle, sablonIndir, raporIndir, haritaDosyaYukle, komsuParseller, dosyaYukle, dosyaSil, mulkiyetDurumlariGetir,
  ARAZI_NITELIKLERI: MeraParseli.ARAZI_NITELIKLERI, ARAZI_KAYNAKLARI: MeraParseli.ARAZI_KAYNAKLARI,
  ARAZI_DURUM_SINIFLARI: MeraParseli.ARAZI_DURUM_SINIFLARI, TOPRAK_SINIFLARI: MeraParseli.TOPRAK_SINIFLARI,
  ISLAH_DURUMLARI: MeraParseli.ISLAH_DURUMLARI, PARSEL_DURUMLARI: MeraParseli.PARSEL_DURUMLARI,
};
