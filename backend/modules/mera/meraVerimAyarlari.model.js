/**
 * meraVerimAyarlari.model.js
 *
 * TEK KAYITLIK (singleton) mera verim/otlatma kapasitesi ayarlari -
 * kullanicinin verdigi resmi Ek-1 (Yagis Kusaklarina Gore Verim
 * Tablolari) ve Ek-2 (Illerin Yillik Ortalama Yagis Miktarlari)
 * cetvellerinden gelir, Ayarlar sayfasindan DUZENLENEBILIR.
 *
 * ONEMLI DOGRULAMA: kaynaktaki 3 tablo arasinda TAM bir matematiksel
 * iliski var - Tablo-2 (Uretilen Yesil Ot) = Tablo-1 (Yararlanilabilir
 * Yesil Ot) x 2; Tablo-3 (Uretilen Kuru Ot) = Tablo-1 x 0.5 - HER
 * hucrede eksiksiz dogrulandi. Bu sayede goruntudeki birkac net tarama
 * hatasi (orn. "2540" degeri) bu iliskiyle DUZELTILEREK seed edildi.
 * Yine de UCU AYRI VE DUZENLENEBILIR tutulur (ileride tablolar
 * birbirinden BAGIMSIZ guncellenebilsin diye).
 */

const mongoose = require('mongoose');

const yagisKusagiSatiriSchema = new mongoose.Schema(
  { bant: { type: String, required: true }, cokIyi: Number, iyi: Number, orta: Number, zayif: Number },
  { _id: false }
);

const ilYagisSchema = new mongoose.Schema(
  { il: { type: String, required: true }, bant: { type: String, required: true } },
  { _id: false }
);

const meraVerimAyarlariSchema = new mongoose.Schema(
  {
    tablo1YararlanilabilirYesil: { type: [yagisKusagiSatiriSchema], default: [] },
    tablo2UretilenYesil: { type: [yagisKusagiSatiriSchema], default: [] },
    tablo3UretilenKuru: { type: [yagisKusagiSatiriSchema], default: [] },
    illerYagisKusaklari: { type: [ilYagisSchema], default: [] },
    gunlukYesilOtTuketimiKg: { type: Number, default: 50 },
    gunlukKuruOtTuketimiKg: { type: Number, default: 12.5 },
    donemGunSayisi: { type: Number, default: 180 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeraVerimAyarlari', meraVerimAyarlariSchema);
