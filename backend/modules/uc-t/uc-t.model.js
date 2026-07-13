/**
 * uc-t.model.js
 *
 * 3T (Tespit - Tahdit - Tahsis) surecinin ANA kaydi. Bu ILK ADIMDA
 * (kullanicinin acik talimatiyla) SADECE su kapsam var:
 *   1. Kayit hangi Il/Ilce/Koy-Mahalle icin acildi (Yerlesim'den secim)
 *   2. Tespit ve Tahdit asamasinda gerekli evraklarin (Ek-1..Ek-6)
 *      TAMAMLANIP TAMAMLANMADIGINI ISARETLEME (kontrol listesi -
 *      HENUZ bu evraklarin kendisi sistemde URETILMIYOR, sadece
 *      TAKIP EDILIYOR)
 *   3. Bu kayda TEMEL teskil edecek Ek-4ab kaydinin SECILMESI (mevcut
 *      bagimsiz Ek-4ab modulunden - Ek-4ab'nin KENDISI DEGISTIRILMEDI,
 *      sadece REFERANS olarak baglaniyor)
 *
 * TAHSIS (Ek-7, 7/a-f, Ek-8, Ek-9, Ek-10) SONRAKI ADIMDA eklenecek -
 * bu dosyada YOK.
 */

const mongoose = require('mongoose');

/**
 * Tespit ve Tahdit asamasinda 4342 sayili Kanun Uygulama Talimati'na
 * gore gerekli olan evraklarin SABIT listesi - her yeni 3T kaydi
 * acildiginda bu liste OLDUGU GIBI kopyalanir, kullanici her birini
 * TAMAMLANDI olarak isaretler.
 */
const VARSAYILAN_TESPIT_TAHDIT_EVRAKLARI = [
  { ekKodu: 'Ek-1', ad: 'Duyuru (30 gün önceden)' },
  { ekKodu: 'Ek-2', ad: 'Duyuru Tutanağı' },
  { ekKodu: 'Ek-3', ad: 'Tebliğ Belgesi' },
  { ekKodu: 'Ek-3/a', ad: 'Mera/Yaylak/Kışlak/Otlak/Çayır Bilgi Cetveli' },
  { ekKodu: 'Ek-4', ad: 'Tespit Tutanağı' },
  { ekKodu: 'Ek-4/a', ad: 'Çiftçi Aile ve Geçim Kaynağı Bildirim Cetveli' },
  { ekKodu: 'Ek-4/b', ad: 'Hayvan Varlığı Cetveli' },
  { ekKodu: 'Ek-4/c', ad: 'Kroki ve 1/5000\'lik Harita' },
  { ekKodu: 'Ek-4/d', ad: 'Mera/Yaylak/Kışlak/Otlak/Çayır Tutanağı' },
  { ekKodu: 'Ek-4/e', ad: 'İhtiyaç Tespit Raporu' },
  { ekKodu: 'Ek-4/f', ad: 'Mera Alanı Etüt Raporu (varsa)' },
  { ekKodu: 'Ek-4/g veya Ek-4/h', ad: 'Sınırlandırma ve İşaretlerin Konulması Tutanağı (köy/belediye)' },
  { ekKodu: 'Ek-5', ad: 'Tespit ve Tahdit Askı İlanı Cetveli' },
  { ekKodu: 'Ek-6', ad: 'Tespit ve Tahdit Askı İlanı Tutanağı' },
];

const evrakSchema = new mongoose.Schema(
  {
    ekKodu: { type: String, required: true },
    ad: { type: String, required: true },
    tamamlandiMi: { type: Boolean, default: false },
    tamamlanmaTarihi: Date,
    not: String,
  },
  { _id: false }
);

const ucTSchema = new mongoose.Schema(
  {
    il: { type: String, required: true },
    ilce: { type: String, required: true },
    koyMahalle: { type: String, required: true },

    tespitTahditEvraklari: { type: [evrakSchema], default: () => VARSAYILAN_TESPIT_TAHDIT_EVRAKLARI.map((e) => ({ ...e })) },

    // Bu 3T kaydinin TEMEL aldigi Ek-4ab kaydi (bagimsiz Ek-4ab
    // modulunden SECILIR, degistirilmez).
    ek4abKaydiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ek4abSonuc' },

    aktif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ucTSchema.index({ il: 1, ilce: 1, koyMahalle: 1 });

module.exports = mongoose.model('UcT', ucTSchema);
module.exports.VARSAYILAN_TESPIT_TAHDIT_EVRAKLARI = VARSAYILAN_TESPIT_TAHDIT_EVRAKLARI;
