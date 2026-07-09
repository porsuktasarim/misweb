/**
 * ekgb.donem.model.js
 *
 * Birim fiyat DONEMI - "her sene hatta yilda birkac kez yeniden
 * belirlenebilen" fiyat listesi. Her donem, 25 kalemin o donemdeki
 * fiyatini tasir.
 *
 * ONEMLI: Bu kayitlar EKLENEBILIR ve DUZENLENEBILIR ama SILINEMEZ -
 * gecmiste bu donem fiyatiyla hesaplanmis EkgbSonuc kayitlarinin
 * dayanagi kaybolmamali (audit/hukuki savunulabilirlik).
 */

const mongoose = require('mongoose');

const fiyatSchema = new mongoose.Schema(
  {
    kalemKod: { type: String, required: true },
    fiyat: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ekgbDonemSchema = new mongoose.Schema(
  {
    donemAdi: { type: String, required: true, trim: true }, // orn: "2026 - 2. Dönem"
    yururlukTarihi: { type: Date, required: true },
    fiyatlar: { type: [fiyatSchema], default: [] },
  },
  { timestamps: true }
);

ekgbDonemSchema.index({ yururlukTarihi: -1 });

module.exports = mongoose.model('EkgbDonem', ekgbDonemSchema);
