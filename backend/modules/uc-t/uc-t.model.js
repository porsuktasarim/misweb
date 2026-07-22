/**
 * uc-t.model.js
 *
 * 3T (Tespit - Tahdit - Tahsis) surecinin ANA kaydi.
 *
 * SUREC bir AGAC olarak modellenir: ANA ADIMLAR (Talimatin kendi
 * bolumlerine karsilik gelir) -> ALT ADIMLAR (tek tek belgeler/isler).
 *
 * IKI AYRI FAZ var, KAYIT OLUSTURULURKEN AYRI AYRI VEYA BIRLIKTE
 * SECILEBILIR (kullanicinin acik istegi - bazi koylerde Tespit/Tahdit
 * zaten tamamlanmis, sadece Tahsis takip edilmek istenebiliyor):
 *   1) TESPIT VE TAHDIT (0, A, B, C bolumleri)
 *   2) TAHSIS (D bolumu)
 */

const mongoose = require('mongoose');

const TESPIT_TAHDIT_ANA_ADIMLAR = [
  {
    ad: '0. Süreç Başlangıcı',
    altAdimlar: [
      { ad: 'İl Mera Komisyonu Kararı (Tespit ve Tahdit çalışmalarına başlanmasına ilişkin)', ekKodu: null, ciktiVarMi: false },
    ],
  },
  {
    ad: 'A. Tespit ve Tahdit Öncesi Hazırlık',
    altAdimlar: [
      { ad: 'Duyuru (30 gün önceden Köy Muhtarlığı/Belediye Başkanlığına)', ekKodu: 'Ek-1', ciktiVarMi: true },
      { ad: 'Duyuru Tutanağı', ekKodu: 'Ek-2', ciktiVarMi: true },
      { ad: 'Tebliğ Belgesi (ilgili kurumlara: Orman, Tarım Reformu, Tapu, Milli Emlak)', ekKodu: 'Ek-3', ciktiVarMi: true },
      { ad: 'Bilgi Cetveli', ekKodu: 'Ek-3/a', ciktiVarMi: true },
    ],
  },
  {
    ad: 'B. Tespit ve Tahdit Çalışmaları',
    altAdimlar: [
      { ad: 'Tespit Tutanağı', ekKodu: 'Ek-4', ciktiVarMi: true },
      { ad: 'Çiftçi Aile ve Geçim Kaynağı Bildirim Cetveli', ekKodu: 'Ek-4/a', ciktiVarMi: true, tip: 'ek4a' },
      { ad: 'Hayvan Varlığı Cetveli', ekKodu: 'Ek-4/b', ciktiVarMi: true, tip: 'ek4b' },
      { ad: '4/a ve 4/b Birleştirme Onayı (Ek-4ab oluşturur)', ekKodu: null, ciktiVarMi: false, tip: 'birlestir' },
      { ad: 'Kroki ve 1/5000\'lik Harita', ekKodu: 'Ek-4/c', ciktiVarMi: true },
      { ad: 'Mera/Yaylak/Kışlak/Otlak/Çayır Tutanağı', ekKodu: 'Ek-4/d', ciktiVarMi: true },
      { ad: 'Durum ve Sınıf Saptaması (Verim ve Botanik Kompozisyon)', ekKodu: 'Ek-11/a, Ek-11/b', ciktiVarMi: true },
      { ad: 'İhtiyaç Tespit Raporu', ekKodu: 'Ek-4/e', ciktiVarMi: true },
      { ad: 'Mera Alanı Etüt Raporu (Hazine arazisi ise)', ekKodu: 'Ek-4/f', ciktiVarMi: true },
      { ad: 'Sınırlandırma ve İşaretlerin Konulması Tutanağı (köy/belediye)', ekKodu: 'Ek-4/g veya Ek-4/h', ciktiVarMi: true },
    ],
  },
  {
    ad: 'C. Tespit ve Tahdit Sonuçlarının Askıya Çıkarılması',
    altAdimlar: [
      { ad: 'Tespit ve Tahdit Askı İlanı Cetveli', ekKodu: 'Ek-5', ciktiVarMi: true },
      { ad: 'Tespit ve Tahdit Askı İlan Tutanağı', ekKodu: 'Ek-6', ciktiVarMi: true },
      { ad: 'İtiraz Değerlendirme ve Kesinleşme (itiraz varsa 60 gün içinde sonuçlandırılır)', ekKodu: null, ciktiVarMi: false },
    ],
  },
];

const TAHSIS_ANA_ADIMLAR = [
  {
    ad: 'D. Tahsis Çalışmaları',
    altAdimlar: [
      { ad: 'Tahsis İçin İhtiyaç Tespit Tutanağı', ekKodu: 'Ek-7', ciktiVarMi: true },
      { ad: 'Aile ve Çiftçi Aile Bildirim Cetveli', ekKodu: 'Ek-7/a', ciktiVarMi: true },
      { ad: 'Geçim Kaynağı Tutanağı', ekKodu: 'Ek-7/b', ciktiVarMi: true },
      { ad: 'Hayvan Varlığı Cetveli', ekKodu: 'Ek-7/c', ciktiVarMi: true },
      { ad: 'Arazinin Kroki ve Haritası', ekKodu: 'Ek-7/d', ciktiVarMi: true },
      { ad: 'Arazinin 1/5000\'lik Haritası (Sulama ve Geçit Yerleri)', ekKodu: 'Ek-7/e', ciktiVarMi: true },
      { ad: 'Çiftçi Ailesinin Otlatma Hakkı', ekKodu: 'Ek-7/f', ciktiVarMi: true },
      { ad: 'Komisyon Tahsis Kararı Raporu (Vali Onayına)', ekKodu: 'Ek-8', ciktiVarMi: true },
      { ad: 'Tahsis Askı Cetveli İlanı', ekKodu: 'Ek-9', ciktiVarMi: true },
      { ad: 'Tahsis Askı İlan Tutanağı', ekKodu: 'Ek-10', ciktiVarMi: true },
      { ad: 'İtiraz Değerlendirme ve Kesinleşme (kesinleşince özel sicile kayıt)', ekKodu: null, ciktiVarMi: false },
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

    // 'manuel' (varsayilan, sadece isaretleme) | 'ek4a' | 'ek4b' | 'birlestir'
    tip: { type: String, default: 'manuel' },

    kaynakBbhbSonucId: { type: mongoose.Schema.Types.ObjectId, ref: 'BbhbSonuc' },
    kaynakCksSonucId: { type: mongoose.Schema.Types.ObjectId, ref: 'CksSonuc' },
    veri: mongoose.Schema.Types.Mixed,
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

    // Bu kayitta hangi fazlarin takip edildigi (SADECE bilgi amacli -
    // surec dizisinin ICERIGI zaten buna gore olusturulur).
    tespitTahditVar: { type: Boolean, default: true },
    tahsisVar: { type: Boolean, default: true },

    surec: { type: [anaAdimSchema], default: [] },

    ek4abKaydiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ek4abSonuc' },

    aktif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ucTSchema.index({ il: 1, ilce: 1, koyMahalle: 1 });

/** Bir ana-adim listesini (varsayilanlardan) DERIN KOPYALAR - referans paylasimi olmasin. */
function anaAdimlariKopyala(liste) {
  return liste.map((ana) => ({
    ad: ana.ad,
    altAdimlar: ana.altAdimlar.map((alt) => ({ ...alt })),
  }));
}

module.exports = mongoose.model('UcT', ucTSchema);
module.exports.TESPIT_TAHDIT_ANA_ADIMLAR = TESPIT_TAHDIT_ANA_ADIMLAR;
module.exports.TAHSIS_ANA_ADIMLAR = TAHSIS_ANA_ADIMLAR;
module.exports.anaAdimlariKopyala = anaAdimlariKopyala;
