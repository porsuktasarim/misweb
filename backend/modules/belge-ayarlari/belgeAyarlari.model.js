/**
 * belgeAyarlari.model.js
 *
 * TEK KAYITLIK (singleton) SISTEM AYARLARI (eski adi "Gorunum
 * Ayarlari" idi - kapsam genisledi, artik SADECE gorsel DEGIL, Mera
 * dosya TIPLERI gibi veri-tanimlama ayarlarini da barindiriyor). Uc
 * ana bolum: (1) 3T'nin urettigi Word/PDF ciktilarindaki "İMZA"
 * rengi/yazi tipi, (2) arayuzdeki (ekrandaki) FARKLI tema
 * parcalarinin (Sol Menu, Ust Menu, Ana Icerik Sol/Sag vb.) BASLIK
 * ve METIN font boyutlari, (3) Mera Modulu icin YONETILEBILIR belge
 * tipleri (Tapu Senedi, Tespit Tutanagi vb.) - hepsi GENISLETILEBILIR
 * listeler (yeni bir satir eklendiginde kod DEGISMEZ).
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
  { anahtar: 'solMenu', ad: 'Sol Menü', baslikBoyutuPx: 11, metinBoyutuPx: 13 },
  { anahtar: 'ustMenu', ad: 'Üst Menü', baslikBoyutuPx: 15, metinBoyutuPx: 13 },
  { anahtar: 'anaIcerikSol', ad: 'Ana İçerik - Sol Bölge', baslikBoyutuPx: 18, metinBoyutuPx: 13 },
  { anahtar: 'anaIcerikSag', ad: 'Ana İçerik - Sağ Bölge', baslikBoyutuPx: 16, metinBoyutuPx: 13 },
];

// Harita alt-modulundeki KML/GeoJSON katmanlari icin VARSAYILAN
// stil - "ustKatman" AKTIF parselin dosyasi (belirgin), "altKatmanlar"
// CEVRE parsellerin dosyalari (soluk/arka plan) icindir. Kullanici
// haritada TEK TEK katman bazinda bunlari GECICI (oturum ici, DB'ye
// KAYDEDILMEZ) olarak DEGISTIREBILIR - buradaki degerler sadece
// BASLANGIC/VARSAYILAN degerdir.
const haritaKatmanStiliSchema = new mongoose.Schema(
  {
    cizgiRengi: { type: String, required: true },
    cizgiKalinligi: { type: Number, required: true },
    doluMu: { type: Boolean, required: true },
    doluRengi: { type: String, required: true },
  },
  { _id: false }
);

const VARSAYILAN_HARITA_STILI = {
  ustKatman: { cizgiRengi: '#2e7d32', cizgiKalinligi: 3, doluMu: true, doluRengi: '#2e7d32' },
  altKatmanlar: { cizgiRengi: '#9e9e9e', cizgiKalinligi: 1.5, doluMu: false, doluRengi: '#9e9e9e' },
};

// Mera parseli "Dosyalar" sekmesinde yuklenebilecek BELGE TIPLERI -
// KULLANICI TARAFINDAN Sistem Ayarlari'ndan EKLENIP CIKARILABILIR
// (genisletilebilir liste, kod degisikligi GEREKMEZ). "otomatikAdlandirma"
// true ise dosya "IL-ILCE-MAHALLE-ADA-PARSEL-{TIP}-vN" seklinde
// OTOMATIK adlandirilir (harita dosyalariyla AYNI mantik), false ise
// kullanicinin yukledigi ORIJINAL dosya adi KORUNUR.
const meraDosyaTipiSchema = new mongoose.Schema(
  {
    anahtar: { type: String, required: true },
    ad: { type: String, required: true },
    otomatikAdlandirma: { type: Boolean, default: true },
  },
  { _id: false }
);

const VARSAYILAN_MERA_DOSYA_TIPLERI = [
  { anahtar: 'tapuSenedi', ad: 'Tapu Senedi', otomatikAdlandirma: true },
  { anahtar: 'tespitTutanagi', ad: 'Tespit Tutanağı', otomatikAdlandirma: true },
  { anahtar: 'fotograf', ad: 'Fotoğraf', otomatikAdlandirma: true },
  { anahtar: 'diger', ad: 'Diğer Belge', otomatikAdlandirma: false },
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
    // Harita katmanlarinin VARSAYILAN gorunumu (ust katman = aktif
    // parsel, alt katmanlar = cevre parseller).
    haritaStili: {
      ustKatman: { type: haritaKatmanStiliSchema, default: () => VARSAYILAN_HARITA_STILI.ustKatman },
      altKatmanlar: { type: haritaKatmanStiliSchema, default: () => VARSAYILAN_HARITA_STILI.altKatmanlar },
    },
    // Mera parseli "Dosyalar" sekmesindeki YONETILEBILIR belge tipleri.
    meraDosyaTipleri: { type: [meraDosyaTipiSchema], default: VARSAYILAN_MERA_DOSYA_TIPLERI },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BelgeAyarlari', belgeAyarlariSchema);
module.exports.VARSAYILAN_TEMA_BOLUMLERI = VARSAYILAN_TEMA_BOLUMLERI;
module.exports.VARSAYILAN_HARITA_STILI = VARSAYILAN_HARITA_STILI;
module.exports.VARSAYILAN_MERA_DOSYA_TIPLERI = VARSAYILAN_MERA_DOSYA_TIPLERI;
