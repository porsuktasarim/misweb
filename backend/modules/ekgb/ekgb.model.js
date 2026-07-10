/**
 * ekgb.model.js
 *
 * Kaydedilen EKGB (Eski Konumuna Getirme Bedeli) hesap sonuclari.
 * BBHB ile ayni ilke: her hesaplama YENI ve DEGISMEZ bir kayit olusturur,
 * kullanilan donemin adi/fiyatlari SNAPSHOT olarak saklanir (donem
 * ileride duzenlenseionra bile bu kaydin dayandigi fiyatlar degismez).
 */

const mongoose = require('mongoose');

const kalemDetaySchema = new mongoose.Schema(
  {
    kod: String,
    ad: String,
    aciklama: String,
    birimFiyat: Number,
    maliyet: Number,
    oran: Number,        // tohum kalemleri icin karisim orani
    miktarKgDa: Number,   // tohum/gubre kalemleri icin miktar
    yilCarpani: Number,   // gubre kalemleri icin uygulama yili carpani
  },
  { _id: false }
);

const imzaciSchema = new mongoose.Schema(
  { adSoyad: String, unvan: String },
  { _id: false }
);

const ekgbSonucSchema = new mongoose.Schema(
  {
    // Mutecaviz (isgal eden) bilgisi
    mutecavizAdSoyad: { type: String, required: true },
    mutecavizTcVkn: { type: String },

    // Isgal edilen yer bilgisi (Yerlesim Listesi'nden ZORUNLU secim)
    il: { type: String, required: true },
    ilce: { type: String, required: true },
    mahalle: { type: String, required: true },
    ada: { type: String },
    parsel: { type: String },

    // Kullanilan donem (SNAPSHOT - donem sonradan degisse bile bu kayit sabit kalir)
    donemId: { type: mongoose.Schema.Types.ObjectId, ref: 'EkgbDonem', required: true },
    donemAdi: { type: String, required: true },

    // Girdi alan bilgileri
    alanBilgileri: {
      surulenAlanM2: { type: Number, default: 0 },
      insaatHafriyatAlanM2: { type: Number, default: 0 },
      toprakDerinligiM: { type: Number, default: 0 },
      asfaltBetonAlanM2: { type: Number, default: 0 },
      asfaltBetonKalinligiM: { type: Number, default: 0 },
      telOrguUzunlugu: { type: Number, default: 0 },
    },

    // Hesaplama sonucu
    alanOzeti: {
      hafriyatHacmiM3: Number,
      toplamIslahAlaniM2: Number,
      toplamIslahAlaniDa: Number,
    },
    iscilik: { detaylar: [kalemDetaySchema], toplam: Number },
    tohum: { detaylar: [kalemDetaySchema], toplam: Number },
    gubreleme: { detaylar: [kalemDetaySchema], toplam: Number },
    genelToplam: { type: Number, required: true },

    // Imza blogu (serbest sayida kisi, HAZIRLAYANLAR)
    imzacilar: { type: [imzaciSchema], default: [] },

    olusturanKullaniciId: { type: String },
    durum: { type: String, enum: ['aktif', 'arsiv'], default: 'aktif' },
  },
  { timestamps: true }
);

ekgbSonucSchema.index({ il: 1, ilce: 1, mahalle: 1, durum: 1 });

module.exports = mongoose.model('EkgbSonuc', ekgbSonucSchema);
