/**
 * mera.model.js
 *
 * Mera Modülü: her kayit TEK BIR PARSELE karsilik gelir (Ada/Parsel
 * bazinda). 3T surecindeki Ek-3/a (madde 7 - Arazinin Cinsi/Miktari/
 * Parca Adedi/Mevki) ve Ek-4/c-h asamalarinin GERCEK VERI KAYNAGI
 * BURASI OLACAK (henuz o entegrasyon yapilmadi - ayri bir asama).
 *
 * NOTLAR: EKLENEN bir not ASLA SILINEMEZ - sadece DUZENLENEBILIR, ve
 * duzenleme ESKI METNI versiyon gecmisinde SAKLAR (kaybolmaz). Dosya
 * eklenebilir. Her islem (olusturma/guncelleme/not/dosya) AYRI bir
 * LOG kaydi olarak tutulur (kim/ne zaman/ne yapti) - sistemde henuz
 * GERCEK bir "kullanici girisi" olmadigi icin (Personel Yonetimi'nde
 * Kullanicilar bolumu hala iskelet) `kullaniciAdi` SERBEST METIN
 * olarak elle girilir - auth sistemi kurulunca buraya BAGLANABILIR.
 */

const mongoose = require('mongoose');

const ARAZI_NITELIKLERI = ['Mera', 'Yaylak', 'Kışlak', 'Otlak', 'Çayır', 'Eyrek Yeri', 'Harman Yeri', 'Panayır Yeri', 'Sıvat Yeri'];
const ARAZI_KAYNAKLARI = ['5-a', '5-b', '5-c', '5-d'];
// Ek-1 verim tablolarindaki (kullanicinin resmi kaynagi) 4 durum
// sinifi + "Belirlenmemis" (henuz degerlendirilmemis parseller icin
// VARSAYILAN) - bu sinif, verim/otlatma kapasitesi hesabinda hangi
// SUTUN kullanilacagini BELIRLER.
const ARAZI_DURUM_SINIFLARI = ['Çok İyi', 'İyi', 'Orta', 'Zayıf', 'Belirlenmemiş'];
// Standart Arazi Kullanim Kabiliyet Siniflandirmasi (Tarim Arazilerinin
// Korunmasi mevzuatinda kullanilan I-VIII sinif sistemi).
const TOPRAK_SINIFLARI = ['I. Sınıf', 'II. Sınıf', 'III. Sınıf', 'IV. Sınıf', 'V. Sınıf', 'VI. Sınıf', 'VII. Sınıf', 'VIII. Sınıf'];
const ISLAH_DURUMLARI = ['Islah Edilmedi', 'Islah Ediliyor', 'Islah Edildi'];
// Parsel KAYITLARI ASLA GERCEKTEN SILINMEZ (sistemin genel felsefesi -
// notlar/harita versiyonlari gibi) - "Sil" ARTIK "Pasife Al" ile AYNI
// PRENSIPTE calisir: kayit veritabaninda KALIR, sadece durum degisir.
// "Silindi" durumu, GERCEKTEN kaza ile olusturulmus/gecersiz kayitlar
// icin - listede GORUNMEZ ama VERI KAYBOLMAZ, istenirse geri donulur.
const PARSEL_DURUMLARI = ['Aktif', 'Pasif', 'Silindi'];

const notVersiyonSchema = new mongoose.Schema(
  { metin: { type: String, required: true }, degistirmeTarihi: { type: Date, default: Date.now }, degistirenKullanici: { type: String, default: '' } },
  { _id: false }
);

const notDosyaSchema = new mongoose.Schema(
  { dosyaYolu: String, orijinalAd: String, yuklemeTarihi: { type: Date, default: Date.now } },
  { _id: false }
);

const notSchema = new mongoose.Schema(
  {
    metin: { type: String, required: true },
    olusturmaTarihi: { type: Date, default: Date.now },
    olusturanKullanici: { type: String, default: '' },
    // ESKI halleri - DUZENLEME oncesi metin BURAYA eklenir, notun
    // KENDISI (metin alani) hep GUNCEL hali gosterir. Bu yuzden not
    // "silinemez" (en eski hali bile versiyonlar[0] olarak KALICI).
    versiyonlar: { type: [notVersiyonSchema], default: [] },
    dosyaEkleri: { type: [notDosyaSchema], default: [] },
  },
  { timestamps: true }
);

const logSchema = new mongoose.Schema(
  {
    islem: { type: String, required: true }, // 'olusturuldu' | 'guncellendi' | 'notEklendi' | 'notDuzenlendi' | 'dosyaEklendi' | 'haritaDosyasiEklendi'
    detay: { type: String, default: '' },
    kullaniciAdi: { type: String, default: '' },
    tarih: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Harita alt-modulu: parsele YUKLENEN CBS (GIS) dosyalari (GeoJSON/
// JSON/KML/GPX). FORMAT DONUSTURULMEZ - kullanici hangi formatta
// yuklerse O FORMATTA saklanir (dosyaYolu orijinal uzantisiyla).
// VERSIYONLUDUR: ayni parsele TEKRAR dosya yuklendiginde ESKI
// VERSIYON SILINMEZ, yeni bir versiyon EKLENIR (versiyonNo artarak).
const haritaDosyaSchema = new mongoose.Schema(
  {
    dosyaYolu: { type: String, required: true },
    // Kullaniciya gosterilen/indirilen AD - IL-ILCE-MAHALLE-ADA-PARSEL-vN
    // formatinda OTOMATIK uretilir (orijinal dosya adi DEGIL).
    orijinalAd: { type: String, required: true },
    formatTipi: { type: String, required: true }, // 'geojson' | 'json' | 'kml' | 'gpx' | 'kmz' | 'diger'
    versiyonNo: { type: Number, required: true },
    yuklemeTarihi: { type: Date, default: Date.now },
    yukleyenKullanici: { type: String, default: '' },
    // ORIJINAL dosya (dosyaYolu) HER ZAMAN oldugu gibi (FORMAT
    // DEGISTIRILMEDEN) saklanir - degismez. AYRICA, YUKLEME SIRASINDA
    // OTOMATIK olarak GeoJSON'a CEVRILIP (KML/KMZ/GPX -> GeoJSON,
    // GeoJSON/JSON zaten oyleyse OZELLIKLERI ZENGINLESTIRILEREK) BU
    // ALANA yazilir - parsel bilgileri (ıslah durumu, egim, alan vb.)
    // HER feature'in properties'ine GOMULUR, boylece indirilen GeoJSON
    // TEK BASINA parselin GUNCEL verisini de tasir. Harita GORUNTULEME
    // HER ZAMAN bu (garanti calisir/veri-zengin) dosyayi TERCIH EDER,
    // yoksa orijinale (formatTipi'ne gore) doner.
        geojsonYolu: { type: String, default: null },
  },
  { _id: false }
);

// Mera detayindaki "Dosyalar" sekmesi icin GENEL AMACLI belge ekleri
// (harita/CBS dosyalarindan AYRI - onlar haritaDosyalari'nda kalir,
// AMA "Dosyalar" sekmesinde HER IKISI de BIRLIKTE listelenir). Bazi
// TEMEL belge TIPLERI (Ayarlar > Sistem Ayarlari'ndan yonetilir,
// asagida BelgeAyarlari.meraDosyaTipleri) icin OTOMATIK ADLANDIRMA
// sablonu uygulanir - digerleri orijinal dosya adiyla saklanir.
const dosyaSchema = new mongoose.Schema(
  {
    dosyaYolu: { type: String, required: true },
    orijinalAd: { type: String, required: true }, // gosterilen/indirilen ad (sablonlu VEYA orijinal yuklenen ad)
    dosyaTipiAnahtari: { type: String, default: '' }, // BelgeAyarlari.meraDosyaTipleri[].anahtar - bos ise "Diger"
    formatUzantisi: { type: String, default: '' }, // '.pdf', '.jpg' vb. - onizleme (popup) turunu BELIRLER
    yuklemeTarihi: { type: Date, default: Date.now },
    yukleyenKullanici: { type: String, default: '' },
  },
  { _id: false }
);

const meraParseliSchema = new mongoose.Schema(
  {
    il: { type: String, required: true },
    ilce: { type: String, required: true },
    koyMahalle: { type: String, required: true },
    adaNo: { type: String, default: '' },
    parselNo: { type: String, default: '' },
    meraAlaniM2: { type: Number },
    tapuAlaniM2: { type: Number },
    araziNiteligi: { type: String, enum: ARAZI_NITELIKLERI },
    araziDurumSinifi: { type: String, enum: ARAZI_DURUM_SINIFLARI, default: 'Belirlenmemiş' },
    araziKaynagi: { type: String, enum: ARAZI_KAYNAKLARI },
    tespitYapildiMi: { type: Boolean, default: false },
    tespitTarihi: { type: Date },
    tahditYapildiMi: { type: Boolean, default: false },
    tahditTarihi: { type: Date },
    tahsisYapildiMi: { type: Boolean, default: false },
    tahsisTarihi: { type: Date },
    islahDurumu: { type: String, enum: ISLAH_DURUMLARI, default: 'Islah Edilmedi' },
    egimi: { type: String, default: '' },
    topraksinifi: { type: String, enum: TOPRAK_SINIFLARI },
    tapuKimlikNo: { type: String, default: '' },
    // Sabit ENUM DEGIL - Sistem Ayarlari'ndaki (BelgeAyarlari.
    // meraMulkiyetDurumlari) YONETILEBILIR listeden gelir. 3T'nin
    // Ek-3/a madde 7'sindeki "Diger Bilgiler (Kime Ait Oldugu...)"
    // sutununu doldurmak icin KULLANILIR.
    mulkiyetDurumu: { type: String, default: '' },
    // Parsel ASLA gercekten silinmez - "Sil" butonu bu alani
    // 'Silindi' yapar, veri KALICI olarak durur (bkz. yukaridaki not).
    durum: { type: String, enum: PARSEL_DURUMLARI, default: 'Aktif' },
    notlar: { type: [notSchema], default: [] },
    dosyalar: { type: [dosyaSchema], default: [] },
    haritaDosyalari: { type: [haritaDosyaSchema], default: [] },
    loglar: { type: [logSchema], default: [] },
  },
  { timestamps: true }
);

meraParseliSchema.index({ il: 1, ilce: 1, koyMahalle: 1 });

module.exports = mongoose.model('MeraParseli', meraParseliSchema);
module.exports.ARAZI_NITELIKLERI = ARAZI_NITELIKLERI;
module.exports.ARAZI_KAYNAKLARI = ARAZI_KAYNAKLARI;
module.exports.ARAZI_DURUM_SINIFLARI = ARAZI_DURUM_SINIFLARI;
module.exports.TOPRAK_SINIFLARI = TOPRAK_SINIFLARI;
module.exports.ISLAH_DURUMLARI = ISLAH_DURUMLARI;
module.exports.PARSEL_DURUMLARI = PARSEL_DURUMLARI;
