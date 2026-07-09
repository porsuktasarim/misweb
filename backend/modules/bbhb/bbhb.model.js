/**
 * bbhb.model.js
 *
 * Her hesaplama calistirmasi YENI ve DEGISMEZ (immutable) bir kayit
 * olusturur. Bir kayit birden fazla "bolum" icerebilir - her bolum
 * kendi (il, ilce, mahalle) ucluesune ve kendi isletmeci sonuclarina
 * sahiptir. Turkvet dosyasi birden fazla mahalleden veri iceriyorsa,
 * her mahalle kendi bolumune duser.
 */

const mongoose = require('mongoose');

const detaySchema = new mongoose.Schema(
  {
    grup: { type: String, required: true },
    kategori: { type: String, required: true },
    adet: { type: Number, required: true, min: 0 },
    katsayi: { type: Number, required: true },
    bbhb: { type: Number, required: true },
  },
  { _id: false }
);

const isletmeciSonucSchema = new mongoose.Schema(
  {
    isletmeciId: { type: String, required: true },
    isletmeciAdi: { type: String, required: true },
    detaylar: { type: [detaySchema], default: [] },
    isletmeciToplamBBHB: { type: Number, required: true },
  },
  { _id: false }
);

const bolumSchema = new mongoose.Schema(
  {
    il: { type: String, required: true },
    ilce: { type: String, required: true },
    mahalle: { type: String },
    isletmeciSonuclari: { type: [isletmeciSonucSchema], default: [] },
    bolumToplamBBHB: { type: Number, required: true },
  },
  { _id: false }
);

const bbhbSonucSchema = new mongoose.Schema(
  {
    // Kaynak bilgisi
    kaynakTipi: { type: String, enum: ['manuel', 'turkvet'], required: true },
    kaynakDosyalar: { type: [String], default: [] },

    // Yas hesaplamasinda kullanilan referans tarih (rapor/yukleme tarihi
    // DEGIL) - kaydedildigi ayin 1. gunu, hesaplama aninda sabitlenir.
    hesaplamaTarihi: { type: Date, required: true },

    // Hesaplama sonucu - il/ilce/mahalle bazinda bolumlenmis
    bolumler: { type: [bolumSchema], default: [] },
    genelToplamBBHB: { type: Number, required: true },

    // Denetlenebilirlik
    kuralSetiVersiyonu: { type: String, required: true },
    olusturanKullaniciId: { type: String },

    // Bu kaydin en guncel calistirma mi, yoksa arsiv mi oldugunu belirtir.
    durum: { type: String, enum: ['aktif', 'arsiv'], default: 'aktif' },
  },
  { timestamps: true }
);

bbhbSonucSchema.index({ 'bolumler.il': 1, 'bolumler.ilce': 1, 'bolumler.mahalle': 1, durum: 1 });

module.exports = mongoose.model('BbhbSonuc', bbhbSonucSchema);
