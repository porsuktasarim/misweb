/**
 * teknikEkip.model.js
 *
 * Yil + ilce bazinda teknik ekip kayitlari. Her yil icin birden fazla
 * ilce ekibi olabilir (orn. "2026 - Adalar", "2026 - Silivri").
 * Personel bilgileri her sene degisebildigi icin CRUD tam serbest
 * (EKGB donemleri gibi "silinemez" kisitlamasi YOK).
 */

const mongoose = require('mongoose');

const uyeSchema = new mongoose.Schema(
  {
    adSoyad: { type: String, required: true },
    unvan: { type: String },
    kurumKod: { type: String, required: true },
    // 'serbest' tipi kurumlar icin:
    serbestMetin: { type: String },
    // 'koyMahalle' / 'ilVeyaIlce' tipi kurumlar icin:
    secilenYer: {
      tip: { type: String, enum: ['il', 'ilce', 'mahalle'] },
      il: String,
      ilce: String,
      mahalle: String,
    },
    // Hesaplanmis imza metni (kaydetme aninda uretilip SNAPSHOT olarak tutulur)
    imzaKurumMetni: { type: String },
  },
  { _id: false }
);

const teknikEkipSchema = new mongoose.Schema(
  {
    yil: { type: Number, required: true },
    ilce: { type: String, required: true },
    il: { type: String },
    ekipNo: { type: Number }, // orn. "1 Nolu Şile Teknik Ekibi" -> ekipNo=1
    uyeler: { type: [uyeSchema], default: [] },
  },
  { timestamps: true }
);

teknikEkipSchema.index({ yil: 1, ilce: 1, ekipNo: 1 }, { unique: true });

module.exports = mongoose.model('TeknikEkip', teknikEkipSchema);
