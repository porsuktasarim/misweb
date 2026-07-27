/**
 * ilMeraKomisyonu.model.js
 *
 * Yil + il bazinda İl Mera Komisyonu uye listesi. Teknik Ekip'ten
 * farkli olarak: (1) ILCE degil IL bazinda, (2) her kurumun bir ASIL
 * bir de YEDEK temsilcisi var (ikisi de kaydedilir - HANGISININ
 * belirli bir kararda imzaladigi, o kararin kendisinde - 3T modulunun
 * "İl Mera Komisyonu Kararı" adiminda - SECILIR, burada degil).
 *
 * Guvenlik kurumlari (Emniyet/Jandarma) icin `guvenlikTipi` etiketi
 * tutulur - 3T'deki "Polis mi, Jandarma mi, ikisi mi imzalayacak"
 * secimi bu etikete gore ilgili uye satir(lar)ini filtreler.
 */

const mongoose = require('mongoose');

const uyeSchema = new mongoose.Schema(
  {
    kurumAdi: { type: String, required: true },
    // SADECE guvenlik kurumlari icin doldurulur - digerlerinde null/bos.
    guvenlikTipi: { type: String, enum: ['polis', 'jandarma', null], default: null },

    asilAdSoyad: String,
    asilUnvan: String,
    yedekAdSoyad: String,
    yedekUnvan: String,
  },
  { _id: false }
);

const ilMeraKomisyonuSchema = new mongoose.Schema(
  {
    yil: { type: Number, required: true },
    il: { type: String, required: true },
    uyeler: { type: [uyeSchema], default: [] },
  },
  { timestamps: true }
);

ilMeraKomisyonuSchema.index({ yil: 1, il: 1 }, { unique: true });

module.exports = mongoose.model('IlMeraKomisyonu', ilMeraKomisyonuSchema);
