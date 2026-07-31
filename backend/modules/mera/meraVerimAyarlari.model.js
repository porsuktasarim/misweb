/**
 * meraVerimAyarlari.model.js
 *
 * TEK KAYITLIK (singleton) mera verim/otlatma kapasitesi ayarlari.
 * Kaynak: Ek-1 (Yagis Kusaklarina Gore Verim Tablolari) ve Ek-2
 * (Illerin Yillik Ortalama Yagis Miktarlari).
 *
 * HER TABLO (Tablo-1/2/3, Iller) ARTIK VERSIYONLU: yeni veri EKLENDIGINDE
 * ESKI VERI SILINMEZ - yeni bir versiyon olarak eklenir, AKTIF versiyon
 * (hesaplamada kullanilan) degisir ama ONCEKI versiyonlar KONTROL/
 * DENETIM icin KALICI olarak saklanir. HER versiyon, hangi RESMI
 * YAZIYLA geldigini gosteren yaziTarihi+yaziSayisi ile ZORUNLU olarak
 * etiketlenir (orn. "31.07.2025 tarihli E-37234586-115.02-20335113
 * sayili yazi").
 *
 * DOGRULANMIS ILISKI: Tablo-2 (Uretilen Yesil) = Tablo-1
 * (Yararlanilabilir Yesil) x 2; Tablo-3 (Uretilen Kuru) = Tablo-1 x
 * 0.5 - HER hucrede eksiksiz dogrulandi (ilk seed verisi bu iliskiyle
 * hesaplanmistir). "Yararlanilabilir Kuru Ot" (4. deger) KAYNAKTA hic
 * tablo olarak YOK - HER ZAMAN Tablo-3 x 0.5 olarak TURETILIR, ayri
 * bir tablo/versiyon OLARAK SAKLANMAZ.
 */

const mongoose = require('mongoose');

const yagisKusagiSatiriSchema = new mongoose.Schema(
  { bant: { type: String, required: true }, cokIyi: Number, iyi: Number, orta: Number, zayif: Number },
  { _id: false }
);

const ilYagisSchema = new mongoose.Schema(
  { il: { type: String, required: true }, bant: { type: String, required: true } },
  { _id: false }
);

/** Bir TABLONUN (Tablo-1/2/3 veya Iller) TEK BIR versiyonu - satirlar + KAYNAK RESMI YAZI bilgisi. */
const tabloVersiyonSchema = new mongoose.Schema(
  {
    // yagisKusagiSatirlari (Tablo-1/2/3) VEYA ilYagisSatirlari (Iller) -
    // Mixed tutulur ki AYNI sema TUM 4 tablo icin yeniden kullanilabilsin.
    satirlar: { type: mongoose.Schema.Types.Mixed, default: [] },
    yaziTarihi: { type: Date, required: true },
    yaziSayisi: { type: String, required: true },
    yuklemeTarihi: { type: Date, default: Date.now },
    yukleyenKullanici: { type: String, default: '' },
    kaynakTipi: { type: String, enum: ['elle', 'excel'], default: 'elle' },
  },
  { _id: false }
);

const versiyonluTabloSchema = new mongoose.Schema(
  {
    aktifIndex: { type: Number, default: 0 },
    versiyonlar: { type: [tabloVersiyonSchema], default: [] },
  },
  { _id: false }
);

const meraVerimAyarlariSchema = new mongoose.Schema(
  {
    tablo1YararlanilabilirYesil: { type: versiyonluTabloSchema, default: () => ({}) },
    tablo2UretilenYesil: { type: versiyonluTabloSchema, default: () => ({}) },
    tablo3UretilenKuru: { type: versiyonluTabloSchema, default: () => ({}) },
    illerYagisKusaklari: { type: versiyonluTabloSchema, default: () => ({}) },
    // Kapasite hesabi (5. kutucuk) SADECE Yararlanilabilir Yesil Ot
    // (Tablo-1) uzerinden yapilir - bu yuzden SADECE yesil tuketim
    // orani tutulur (kuru tuketim orani ARTIK KULLANILMIYOR).
    gunlukYesilOtTuketimiKg: { type: Number, default: 50 },
    donemGunSayisi: { type: Number, default: 180 },
    // Ileride "Islah ve Amenajman" modulunde kullanilmasi
    // ONGORULEN standart yil gun sayisi (orn. yillik hesaplarda).
    standartYilGunSayisi: { type: Number, default: 365 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeraVerimAyarlari', meraVerimAyarlariSchema);
