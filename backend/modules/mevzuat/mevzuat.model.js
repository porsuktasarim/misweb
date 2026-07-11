/**
 * mevzuat.model.js
 *
 * Anayasadan yonetmelige, mahkeme kararlarina kadar HER TURLU hukuki
 * kaynagi (+ mevzuat.gov.tr'de yayimlanmayan uygulama talimati/gorus
 * PDF'lerini) tek yerde toplayan modul.
 *
 * Icerik 2 sekilde eklenebilir:
 *   'mevzuat_gov' -> mevzuat.gov.tr URL'si yapistirilir, icerik OTOMATIK
 *                    cekilir, HAFTALIK (Pazartesi 04:00) degisiklik
 *                    kontrolu yapilir, degisirse eski surum SAKLANIR.
 *   'pdf'         -> elle PDF yuklenir (uygulama talimatlari, gorusler
 *                    vb. mevzuat.gov.tr'de olmayan belgeler icin).
 *                    Otomatik kontrol YAPILMAZ (kaynak URL'si yok).
 */

const mongoose = require('mongoose');

const surumSchema = new mongoose.Schema(
  {
    icerik: String,           // o anki (degisiklikten ONCEKI) duz metin
    htmlIcerik: String,
    pdfDosyaYolu: String,      // eger o surum PDF formatindaysa (bkz. mevzuat.gov-cek.js PDF tespiti)
    kaynakHash: String,
    degisiklikNotu: String,
    kontrolTarihi: Date,
  },
  { timestamps: true }
);

const mevzuatSchema = new mongoose.Schema(
  {
    ad: { type: String, required: true },
    tur: {
      type: String,
      enum: [
        'Anayasa', 'Kanun', 'KHK', 'Tüzük', 'Yönetmelik', 'Tebliğ',
        'Genelge', 'Yönerge', 'Cumhurbaşkanlığı Kararnamesi',
        'Cumhurbaşkanlığı Kararı', 'Mahkeme Kararı', 'Uygulama Talimatı',
        'Görüş', 'Diğer',
      ],
      required: true,
    },
    resmiGazeteTarihi: Date,
    resmiGazeteSayisi: String,
    mevzuatNo: String,
    konu: String,
    etiketler: { type: [String], default: [] },

    icerikTipi: { type: String, enum: ['pdf', 'mevzuat_gov'], required: true },

    // 'mevzuat_gov' icin:
    mevzuatGovUrl: String,
    mevzuatGovId: String,  // bedesten API'nin dahili kimligi - SECILEN aday
                            // KESIN olarak saklanir, haftalik kontrolde
                            // TEKRAR ARAMA/BELIRSIZLIK YASANMAZ
    icerik: String,       // duz metin (arama + fark karsilastirma icin)
    htmlIcerik: String,    // bicimlendirilmis goruntu icin

    // 'pdf' icin (yerel diskte saklanir, established multer deseniyle ayni):
    pdfDosyaYolu: String,
    pdfOrijinalAd: String,

    kaynakHash: String,
    sonKontrol: Date,
    guncellemeBekliyor: { type: Boolean, default: false },
    guncellemeTarihi: Date,

    surumler: { type: [surumSchema], default: [] },

    aktif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mevzuatSchema.index({ tur: 1 });
mevzuatSchema.index({ guncellemeBekliyor: 1 });
mevzuatSchema.index({ ad: 'text', icerik: 'text', konu: 'text', etiketler: 'text' });

module.exports = mongoose.model('Mevzuat', mevzuatSchema);
