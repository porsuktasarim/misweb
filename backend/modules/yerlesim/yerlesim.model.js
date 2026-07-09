/**
 * yerlesim.model.js
 *
 * Il / Ilce / Mahalle-Koy hiyerarsisi DUZ (flat) bir koleksiyon olarak
 * tutulur - her dokuman tek bir mahalle/koy'u temsil eder. Il ve ilce
 * listeleri bu koleksiyondan DISTINCT sorgularla turetilir.
 *
 * Kaynak: nejdetkadir/il-ilce-semt-mahalleler (acik lisans, doğru
 * Turkce karakter kodlamasiyla - bkz. veri/il-ilce-mahalle.json)
 */

const mongoose = require('mongoose');

const yerlesimSchema = new mongoose.Schema(
  {
    il: { type: String, required: true, trim: true },
    ilce: { type: String, required: true, trim: true },
    mahalle: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

yerlesimSchema.index({ il: 1, ilce: 1, mahalle: 1 }, { unique: true });
yerlesimSchema.index({ il: 1 });
yerlesimSchema.index({ il: 1, ilce: 1 });

module.exports = mongoose.model('YerlesimYeri', yerlesimSchema);
