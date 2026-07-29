/**
 * belgeAyarlari.model.js
 *
 * TEK KAYITLIK (singleton) belge gorunum ayarlari - 3T'nin ürettigi
 * Word/PDF ciktilarinda (Duyuru, Duyuru Tutanagi, Teblig Belgesi vb.)
 * kullanilan "İMZA" rengi ve yazi tipi BURADAN yonetilir.
 */

const mongoose = require('mongoose');

const belgeAyarlariSchema = new mongoose.Schema(
  {
    // Acik gri varsayilan - imza cizgisi/etiketleri VE "İMZA" yazisi
    // AYNI renkte olur (kullanicinin acik istegi).
    imzaRengi: { type: String, default: '#999999' },
    // Word ciktisinda kullanilacak yazi tipi ADI (Word, sistemde
    // kurulu fontlara gore render eder - Times New Roman COGU
    // kurumsal bilgisayarda hazir bulunur). PDF ise GOMULU font
    // gerektirdigi icin ayri sabit bir font (DejaVu Serif) kullanir -
    // bu ayar SADECE Word'u etkiler.
    wordYaziTipi: { type: String, default: 'Times New Roman' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BelgeAyarlari', belgeAyarlariSchema);
