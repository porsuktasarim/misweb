/**
 * bbhb.model.js
 *
 * Her hesaplama calistirmasi YENI ve DEGISMEZ (immutable) bir kayit
 * olusturur. Ayni hesap tekrar calistirilirsa eski kayit GUNCELLENMEZ,
 * yeni bir dokuman eklenir. Boylece:
 *  - Tahsis modulu hangi BBHB hesabina dayandigini kalici referansla izler
 *  - kuralSetiVersiyonu sayesinde katsayilar ileride degisse bile
 *    gecmis sonuclar bozulmaz
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

const bbhbSonucSchema = new mongoose.Schema(
  {
    // Baslik bilgisi (raporlama icin)
    il: { type: String, required: true },
    ilce: { type: String, required: true },
    mahalle: { type: String },

    // Kaynak bilgisi
    kaynakTipi: { type: String, enum: ['manuel', 'turkvet'], required: true },
    kaynakDosyalar: { type: [String], default: [] }, // turkvet icin dosya adlari

    // Hesaplama sonucu
    isletmeciSonuclari: { type: [isletmeciSonucSchema], default: [] },
    genelToplamBBHB: { type: Number, required: true },

    // Denetlenebilirlik
    kuralSetiVersiyonu: { type: String, required: true },
    olusturanKullaniciId: { type: String },

    // Bu kaydin en guncel calistirma mi, yoksa arsiv mi oldugunu belirtir.
    // Ayni parametrelerle tekrar hesap yapildiginda yeni kayit "aktif"
    // olur, oncekiler "arsiv" olarak korunur (silinmez).
    durum: { type: String, enum: ['aktif', 'arsiv'], default: 'aktif' },
  },
  { timestamps: true }
);

bbhbSonucSchema.index({ il: 1, ilce: 1, mahalle: 1, durum: 1 });

module.exports = mongoose.model('BbhbSonuc', bbhbSonucSchema);
