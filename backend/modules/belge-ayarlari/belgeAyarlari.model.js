/**
 * belgeAyarlari.model.js
 *
 * TEK KAYITLIK (singleton) GÖRÜNÜM AYARLARI - hem 3T'nin ürettiği
 * Word/PDF çıktılarında (Duyuru, Duyuru Tutanağı, Tebliğ Belgesi vb.)
 * kullanılan "İMZA" rengi/yazı tipi, HEM DE arayüzdeki (ekrandaki)
 * FARKLI TEMA PARÇALARININ (Ayarlar sayfası, Verim Bilgileri tablosu
 * vb.) BAŞLIK ve METİN font boyutları BURADAN yönetilir - genişletilebilir
 * bir liste (yeni bir "tema parçası" gerektiğinde SADECE varsayılan
 * veriye yeni bir satır eklenir, kod değişmez).
 */

const mongoose = require('mongoose');

const temaBolumuSchema = new mongoose.Schema(
  {
    anahtar: { type: String, required: true }, // sabit kod, orn 'ayarlarSayfasi'
    ad: { type: String, required: true }, // ekranda gosterilen ad
    baslikBoyutuPx: { type: Number, default: 16 },
    metinBoyutuPx: { type: Number, default: 13 },
  },
  { _id: false }
);

const VARSAYILAN_TEMA_BOLUMLERI = [
  { anahtar: 'ayarlarSayfasi', ad: 'Ayarlar Sayfası', baslikBoyutuPx: 15, metinBoyutuPx: 12 },
  { anahtar: 'verimTablosu', ad: 'Verim Bilgileri / Otlatma Kapasitesi Tablosu', baslikBoyutuPx: 13, metinBoyutuPx: 11 },
];

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
    // Ekrandaki (Word/PDF DEGIL) FARKLI tema parcalarinin baslik/metin
    // font boyutlari - genisletilebilir liste.
    temaBolumleri: { type: [temaBolumuSchema], default: VARSAYILAN_TEMA_BOLUMLERI },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BelgeAyarlari', belgeAyarlariSchema);
module.exports.VARSAYILAN_TEMA_BOLUMLERI = VARSAYILAN_TEMA_BOLUMLERI;
