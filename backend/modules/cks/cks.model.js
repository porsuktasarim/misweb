/**
 * cks.model.js
 *
 * Kaydedilen CKS (Ek-4/a) sonuclari. BBHB/EKGB ile ayni ilke:
 * her yukleme YENI ve DEGISMEZ bir kayit olusturur.
 */

const mongoose = require('mongoose');

const ciftciSchema = new mongoose.Schema(
  {
    isletmeciAdi: { type: String, required: true },
    tcVkn: String,
    yemBitkisi: { type: Number, default: 0 },
    sebzeMeyve: { type: Number, default: 0 },
    hububatYagli: { type: Number, default: 0 },
    tarim: { type: Boolean, default: false },
  },
  { _id: false }
);

const cksSonucSchema = new mongoose.Schema(
  {
    il: { type: String, required: true },
    ilce: { type: String, required: true },
    koyMahalle: { type: String, required: true },
    uretimYili: { type: Number },

    kaynakDosyalar: { type: [String], default: [] },
    ciftciler: { type: [ciftciSchema], default: [] },

    olusturanKullaniciId: { type: String },
    durum: { type: String, enum: ['aktif', 'arsiv'], default: 'aktif' },
  },
  { timestamps: true }
);

cksSonucSchema.index({ il: 1, ilce: 1, koyMahalle: 1, durum: 1 });

module.exports = mongoose.model('CksSonuc', cksSonucSchema);
