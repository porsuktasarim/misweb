/**
 * uc-t.model.js
 *
 * 3T (Tespit - Tahdit - Tahsis) surecinin ANA kaydi.
 *
 * SUREC bir AGAC olarak modellenir: ANA ADIMLAR (Talimatin kendi A/B/C
 * bolumlerine karsilik gelir) -> her birinin ALT ADIMLARI (Ek-1, Ek-2,
 * Ek-4/a gibi TEK TEK belgeler/isler). Kullanici bir ALT ADIMA tiklar,
 * o adimin veri girisini yapar (SIMDILIK sadece "tamamlandi" isareti +
 * not - ILERIDE her adim tipine ozel gercek veri formlarina
 * genisleyecek), kaydeder, alt adim TAMAMLANDI olarak isaretlenir.
 *
 * TAHSIS (Ek-7, 7/a-f, Ek-8, Ek-9, Ek-10) SONRAKI ADIMDA eklenecek -
 * bu dosyada YOK.
 */

const mongoose = require('mongoose');

/**
 * Talimatin kendi A/B/C bolum yapisina birebir karsilik gelen
 * VARSAYILAN surec agaci - her yeni 3T kaydi acildiginda kopyalanir.
 */
const VARSAYILAN_SUREC = [
  {
    ad: 'A. Tespit ve Tahdit Öncesi Hazırlık',
    altAdimlar: [
      { ad: 'Duyuru', ekKodu: 'Ek-1', ciktiVarMi: true },
      { ad: 'Duyuru Tutanağı', ekKodu: 'Ek-2', ciktiVarMi: true },
      { ad: 'Tebliğ Belgesi', ekKodu: 'Ek-3', ciktiVarMi: true },
      { ad: 'Bilgi Cetveli', ekKodu: 'Ek-3/a', ciktiVarMi: true },
    ],
  },
  {
    ad: 'B. Tespit ve Tahdit Çalışmaları',
    altAdimlar: [
      { ad: 'Tespit Tutanağı', ekKodu: 'Ek-4', ciktiVarMi: true },
      { ad: 'Çiftçi Aile ve Geçim Kaynağı Bildirim Cetveli', ekKodu: 'Ek-4/a', ciktiVarMi: true },
      { ad: 'Hayvan Varlığı Cetveli', ekKodu: 'Ek-4/b', ciktiVarMi: true },
      { ad: 'Kroki ve 1/5000\'lik Harita', ekKodu: 'Ek-4/c', ciktiVarMi: true },
      { ad: 'Mera/Yaylak/Kışlak/Otlak/Çayır Tutanağı', ekKodu: 'Ek-4/d', ciktiVarMi: true },
      { ad: 'İhtiyaç Tespit Raporu', ekKodu: 'Ek-4/e', ciktiVarMi: true },
      { ad: 'Mera Alanı Etüt Raporu (varsa)', ekKodu: 'Ek-4/f', ciktiVarMi: true },
      { ad: 'Sınırlandırma ve İşaretlerin Konulması Tutanağı', ekKodu: 'Ek-4/g veya Ek-4/h', ciktiVarMi: true },
    ],
  },
  {
    ad: 'C. Askıya Çıkarma',
    altAdimlar: [
      { ad: 'Tespit ve Tahdit Askı İlanı Cetveli', ekKodu: 'Ek-5', ciktiVarMi: true },
      { ad: 'Tespit ve Tahdit Askı İlan Tutanağı', ekKodu: 'Ek-6', ciktiVarMi: true },
    ],
  },
];

const altAdimSchema = new mongoose.Schema(
  {
    ad: { type: String, required: true },
    ekKodu: String,
    ciktiVarMi: { type: Boolean, default: true },
    tamamlandiMi: { type: Boolean, default: false },
    tamamlanmaTarihi: Date,
    not: String,
  },
  { _id: false }
);

const anaAdimSchema = new mongoose.Schema(
  {
    ad: { type: String, required: true },
    altAdimlar: { type: [altAdimSchema], default: [] },
  },
  { _id: false }
);

const ucTSchema = new mongoose.Schema(
  {
    il: { type: String, required: true },
    ilce: { type: String, required: true },
    koyMahalle: { type: String, required: true },

    surec: {
      type: [anaAdimSchema],
      default: () => VARSAYILAN_SUREC.map((a) => ({ ad: a.ad, altAdimlar: a.altAdimlar.map((al) => ({ ...al })) })),
    },

    // Bu 3T kaydinin TEMEL aldigi Ek-4ab kaydi (bagimsiz Ek-4ab
    // modulunden SECILIR, degistirilmez).
    ek4abKaydiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ek4abSonuc' },

    aktif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ucTSchema.index({ il: 1, ilce: 1, koyMahalle: 1 });

module.exports = mongoose.model('UcT', ucTSchema);
module.exports.VARSAYILAN_SUREC = VARSAYILAN_SUREC;
