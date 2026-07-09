/**
 * config/lang/tr.js
 *
 * Sistemdeki TUM gorunur metinler buradan okunur.
 * Kod icinde hicbir yerde literal Turkce string yazilmaz.
 *
 * Kural: Anahtarlar (orn. lang.bbhb.kisaAd) SABIT kalir.
 * Bir terim degisirse (orn. "BBHB" -> "BuBH") sadece buradaki
 * DEGER degisir, kodun geri kalanina dokunulmaz.
 */

module.exports = {
  uygulama: {
    ad: 'Mera İzleme Sistemi',
    kisaAd: 'MİS',
  },

  ortak: {
    il: 'İl',
    ilce: 'İlçe',
    mahalle: 'Mahalle',
    toplam: 'Toplam',
    genelToplam: 'Genel Toplam',
    tarih: 'Tarih',
    kaydet: 'Kaydet',
    yukle: 'Yükle',
    indir: 'İndir',
    onizleme: 'Önizleme',
    isletmeci: 'İşletmeci',
    grup: 'Grup',
    cins: 'Cins',
    kategori: 'Kategori',
    katsayi: 'Katsayı',
    adet: 'Adet',
    ozet: 'Özet',
    siniflandirmaKriterleri: 'Sınıflandırma Kriterleri',
    hataOlustu: 'Bir hata oluştu',
  },

  formatlar: {
    excel: 'Excel',
    word: 'Word',
    pdf: 'PDF',
  },

  bbhb: {
    kisaAd: 'BBHB',
    tamAd: 'Büyükbaş Hayvan Birimi',

    kaynakTipi: {
      manuel: 'Manuel Giriş',
      turkvet: 'Türkvet Dosyası',
    },

    gruplar: {
      kulturIrki: 'Kültür Irkı',
      kulturMelezi: 'Kültür Melezi',
      yerliIrk: 'Yerli Irk',
      buyukbasErkek: 'Büyükbaş Erkek',
      manda: 'Manda',
      kucukbas: 'Küçükbaş',
      tekTirnakli: 'Tek Tırnaklı',
    },

    kategoriler: {
      inek: 'İnek',
      dana: 'Dana',
      duve: 'Düve',
      boga: 'Boğa',
      okuz: 'Öküz',
      mandaErkek: 'Erkek',
      mandaDisi: 'Dişi',
      koyun: 'Koyun',
      kec: 'Keçi',
      kuzu: 'Kuzu',
      oglak: 'Oğlak',
      at: 'At',
      katir: 'Katır',
      esek: 'Eşek',
    },

    alanlar: {
      isletmeciToplamBBHB: 'İşletmeci Toplam BBHB',
      genelToplamBBHB: 'Genel Toplam BBHB',
      kuralSetiVersiyonu: 'Kural Seti Versiyonu',
      kaynakTipi: 'Kaynak Tipi',
      olusturmaTarihi: 'Oluşturma Tarihi',
    },
  },

  // ÇKS modülü geldiğinde ayni desenle buraya eklenecek:
  // cks: { kisaAd: 'ÇKS', tamAd: '...', ... },
};
