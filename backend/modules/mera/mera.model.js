/**
 * mera.model.js
 *
 * Mera Modülü: her kayit TEK BIR PARSELE karsilik gelir (Ada/Parsel
 * bazinda). 3T surecindeki Ek-3/a (madde 7 - Arazinin Cinsi/Miktari/
 * Parca Adedi/Mevki) ve Ek-4/c-h asamalarinin GERCEK VERI KAYNAGI
 * BURASI OLACAK (henuz o entegrasyon yapilmadi - ayri bir asama).
 *
 * NOTLAR: EKLENEN bir not ASLA SILINEMEZ - sadece DUZENLENEBILIR, ve
 * duzenleme ESKI METNI versiyon gecmisinde SAKLAR (kaybolmaz). Dosya
 * eklenebilir. Her islem (olusturma/guncelleme/not/dosya) AYRI bir
 * LOG kaydi olarak tutulur (kim/ne zaman/ne yapti) - sistemde henuz
 * GERCEK bir "kullanici girisi" olmadigi icin (Personel Yonetimi'nde
 * Kullanicilar bolumu hala iskelet) `kullaniciAdi` SERBEST METIN
 * olarak elle girilir - auth sistemi kurulunca buraya BAGLANABILIR.
 */

const mongoose = require('mongoose');

const ARAZI_NITELIKLERI = ['Mera', 'Yaylak', 'Kışlak', 'Otlak', 'Çayır', 'Eyrek Yeri', 'Harman Yeri', 'Panayır Yeri', 'Sıvat Yeri'];
const ARAZI_KAYNAKLARI = ['5-a', '5-b', '5-c', '5-d'];
// Standart Arazi Kullanim Kabiliyet Siniflandirmasi (Tarim Arazilerinin
// Korunmasi mevzuatinda kullanilan I-VIII sinif sistemi).
const TOPRAK_SINIFLARI = ['I. Sınıf', 'II. Sınıf', 'III. Sınıf', 'IV. Sınıf', 'V. Sınıf', 'VI. Sınıf', 'VII. Sınıf', 'VIII. Sınıf'];

const notVersiyonSchema = new mongoose.Schema(
  { metin: { type: String, required: true }, degistirmeTarihi: { type: Date, default: Date.now }, degistirenKullanici: { type: String, default: '' } },
  { _id: false }
);

const notDosyaSchema = new mongoose.Schema(
  { dosyaYolu: String, orijinalAd: String, yuklemeTarihi: { type: Date, default: Date.now } },
  { _id: false }
);

const notSchema = new mongoose.Schema(
  {
    metin: { type: String, required: true },
    olusturmaTarihi: { type: Date, default: Date.now },
    olusturanKullanici: { type: String, default: '' },
    // ESKI halleri - DUZENLEME oncesi metin BURAYA eklenir, notun
    // KENDISI (metin alani) hep GUNCEL hali gosterir. Bu yuzden not
    // "silinemez" (en eski hali bile versiyonlar[0] olarak KALICI).
    versiyonlar: { type: [notVersiyonSchema], default: [] },
    dosyaEkleri: { type: [notDosyaSchema], default: [] },
  },
  { timestamps: true }
);

const logSchema = new mongoose.Schema(
  {
    islem: { type: String, required: true }, // 'olusturuldu' | 'guncellendi' | 'notEklendi' | 'notDuzenlendi' | 'dosyaEklendi'
    detay: { type: String, default: '' },
    kullaniciAdi: { type: String, default: '' },
    tarih: { type: Date, default: Date.now },
  },
  { _id: false }
);

const meraParseliSchema = new mongoose.Schema(
  {
    il: { type: String, required: true },
    ilce: { type: String, required: true },
    koyMahalle: { type: String, required: true },
    adaNo: { type: String, default: '' },
    parselNo: { type: String, default: '' },
    meraAlaniM2: { type: Number },
    tapuAlaniM2: { type: Number },
    araziNiteligi: { type: String, enum: ARAZI_NITELIKLERI },
    araziDurumSinifi: { type: String, default: '' },
    araziKaynagi: { type: String, enum: ARAZI_KAYNAKLARI },
    tespitYapildiMi: { type: Boolean, default: false },
    tespitTarihi: { type: Date },
    tahditYapildiMi: { type: Boolean, default: false },
    tahditTarihi: { type: Date },
    tahsisYapildiMi: { type: Boolean, default: false },
    tahsisTarihi: { type: Date },
    islahDurumu: { type: String, default: '' },
    egimi: { type: String, default: '' },
    topraksinifi: { type: String, enum: TOPRAK_SINIFLARI },
    tapuKimlikNo: { type: String, default: '' },
    notlar: { type: [notSchema], default: [] },
    loglar: { type: [logSchema], default: [] },
  },
  { timestamps: true }
);

meraParseliSchema.index({ il: 1, ilce: 1, koyMahalle: 1 });

module.exports = mongoose.model('MeraParseli', meraParseliSchema);
module.exports.ARAZI_NITELIKLERI = ARAZI_NITELIKLERI;
module.exports.ARAZI_KAYNAKLARI = ARAZI_KAYNAKLARI;
module.exports.TOPRAK_SINIFLARI = TOPRAK_SINIFLARI;
