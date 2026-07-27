/**
 * ilMeraKomisyonu.model.js
 *
 * Yil + il bazinda İl Mera Komisyonu uye listesi. Kurumlar ARTIK
 * SERBEST METIN DEGIL - kullanicinin belirttigi SABIT, imza sirasina
 * gore siralanmis kurum listesinden secilir.
 *
 * Vali Yardimcisi ve İl Muduru: unvan OTOMATIK/SABIT (degistirilmez),
 * YEDEGI YOK (bunlar bir "baskanlik vekalet zinciri"nin parcasidir -
 * Vali izinliyse Vali Yardimcisi, o da izinliyse İl Muduru baskanlik
 * eder; bu ZINCIR her KARARDA - 3T Adim 1'de - ayrica sorulur, burada
 * SADECE Vali Yardimcisi ve İl Muduru'nun SABIT bilgileri tutulur).
 *
 * Muhtar: sabit kayitta YER ALMAZ - her karar HANGI koy/mahalle
 * icinse O muhtar oldugu icin, muhtar bilgisi HER 3T KARARINDA ayrica
 * girilir (bkz. uc-t modulu, Adim 1).
 *
 * Diger TUM kurumlarin (Teknik Personel, DSİ, OGM, Defterdarlık,
 * Milli Emlak, Kadastro, Ziraat Odasi, Jandarma, Polis) hem ASIL hem
 * YEDEK temsilcisi var.
 */

const mongoose = require('mongoose');

/**
 * 4342 Sayılı Mera Kanunu'nun 3'üncü maddesine gore: Komisyona normalde
 * Vali Yardımcısı BAŞKANLIK eder; O YOKSA İl Müdürü, O DA YOKSA Teknik
 * Personel (ziraat mühendisi) başkanlık eder - Vali'nin KENDİSİ bu
 * BAŞKANLIK ZİNCİRİNİN parçası DEĞİLDİR; Vali sadece komisyonu ONAYLAR
 * (valilik onayı) ve İSTERSE (ZORUNLU OLMAKSIZIN) katılımcı/imzacı
 * olabilir - bu yuzden 'baskanlikZinciri' ISARETLENMEMIS (Vali icin).
 */
const KOMISYON_KURUMLARI = [
  { kod: 'vali', ad: 'Vali', otomatikUnvan: true, yedekVar: false, koyeOzgu: false },
  { kod: 'valiYardimcisi', ad: 'Vali Yardımcısı', otomatikUnvan: true, yedekVar: false, koyeOzgu: false, baskanlikZinciri: 1 },
  { kod: 'ilMudur', ad: 'İl Müdürü', otomatikUnvan: true, yedekVar: false, koyeOzgu: false, baskanlikZinciri: 2 },
  { kod: 'teknikPersonel', ad: 'Teknik Personel', otomatikUnvan: false, yedekVar: true, koyeOzgu: false, baskanlikZinciri: 3 },
  { kod: 'dsi', ad: 'Devlet Su İşleri Bölge Müdürlüğü', otomatikUnvan: false, yedekVar: true, koyeOzgu: false },
  { kod: 'ogm', ad: 'Orman Bölge Müdürlüğü', otomatikUnvan: false, yedekVar: true, koyeOzgu: false },
  { kod: 'muhtar', ad: 'Muhtarlık', otomatikUnvan: false, yedekVar: true, koyeOzgu: true },
  { kod: 'defterdarlik', ad: 'Defterdarlık', otomatikUnvan: false, yedekVar: true, koyeOzgu: false },
  { kod: 'milliEmlakMudurlugu', ad: 'Milli Emlak Müdürlüğü', otomatikUnvan: false, yedekVar: true, koyeOzgu: false },
  { kod: 'milliEmlakDairesi', ad: 'Milli Emlak Dairesi Başkanlığı', otomatikUnvan: false, yedekVar: true, koyeOzgu: false },
  { kod: 'kadastro', ad: 'İl Kadastro Müdürlüğü', otomatikUnvan: false, yedekVar: true, koyeOzgu: false },
  { kod: 'ziraatOdasi', ad: 'Ziraat Odası Başkanlığı', otomatikUnvan: false, yedekVar: true, koyeOzgu: false },
  { kod: 'jandarma', ad: 'İl Jandarma Komutanlığı', otomatikUnvan: false, yedekVar: true, koyeOzgu: false, guvenlikTipi: 'jandarma' },
  { kod: 'polis', ad: 'İl Emniyet Müdürlüğü', otomatikUnvan: false, yedekVar: true, koyeOzgu: false, guvenlikTipi: 'polis' },
];

const KURUM_KODLARI = KOMISYON_KURUMLARI.map((k) => k.kod);

const uyeSchema = new mongoose.Schema(
  {
    kurumKod: { type: String, required: true, enum: KURUM_KODLARI },
    asilAdSoyad: String,
    asilUnvan: String,   // valiYardimcisi/ilMudur icin SABIT (frontend kilitler), digerlerinde serbest
    yedekAdSoyad: String, // valiYardimcisi/ilMudur/muhtar icin kullanilmaz
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
module.exports.KOMISYON_KURUMLARI = KOMISYON_KURUMLARI;
