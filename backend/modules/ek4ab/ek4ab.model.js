/**
 * ek4ab.model.js
 *
 * Kaydedilen Ek-4ab (BBHB + CKS birlesik) sonuclari. Kaynak
 * bbhbSonucId/cksSonucId SADECE referans icin saklanir - asil veri
 * (ciftciler) hesaplama aninda SNAPSHOT olarak kopyalanir (kaynaklar
 * sonradan silinse/degisse bile bu kayit sabit kalir).
 */

const mongoose = require('mongoose');

const ciftciSchema = new mongoose.Schema(
  {
    isletmeciAdi: { type: String, required: true },
    yemBitkisi: Number,
    sebzeBag: Number,
    hububat: Number,
    tarim: { type: Boolean, default: false },
    hayvancilik: { type: Boolean, default: false },
    toplamHayvanVarligi: { type: Number, default: 0 },
    hayvanPivot: { type: [mongoose.Schema.Types.Mixed], default: [] }, // 16 eleman (sayi veya '')
    isletmeciToplamBBHB: { type: Number, default: 0 },
    cksEslesmeVarMi: { type: Boolean, default: false },
  },
  { _id: false }
);

const ek4abSonucSchema = new mongoose.Schema(
  {
    il: { type: String, required: true },
    ilce: { type: String, required: true },
    koyMahalle: { type: String, required: true },
    uretimYili: Number,

    bbhbSonucId: { type: mongoose.Schema.Types.ObjectId, ref: 'BbhbSonuc' },
    cksSonucId: { type: mongoose.Schema.Types.ObjectId, ref: 'CksSonuc' },

    ciftciler: { type: [ciftciSchema], default: [] },
    genelToplamBBHB: { type: Number, default: 0 },
    eslesmeyenSayisi: { type: Number, default: 0 },

    olusturanKullaniciId: { type: String },
    durum: { type: String, enum: ['aktif', 'arsiv'], default: 'aktif' },
  },
  { timestamps: true }
);

ek4abSonucSchema.index({ il: 1, ilce: 1, koyMahalle: 1, durum: 1 });

module.exports = mongoose.model('Ek4abSonuc', ek4abSonucSchema);
