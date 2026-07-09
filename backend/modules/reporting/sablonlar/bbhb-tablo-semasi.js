/**
 * bbhb-tablo-semasi.js
 *
 * BBHB raporunun (Excel/Word/PDF - UCU DE AYNI SEMAYI KULLANIR) resmi
 * sutun yerlesimini ve siniflandirma kriteri paragraflarini TEK YERDEN
 * tanimlar. Boylece 3 exporter arasinda kopyala-yapistir kaynakli
 * tutarsizlik riski olmaz (bkz. gecmiste grup/kategori karismasi hatasi).
 *
 * SUTUN DUZENI (soldan saga):
 *   1        : Sira No
 *   2-9      : Isletmeci Adi (8 sutun BIRLESTIRILEREK tek hucre gibi
 *              gosterilir - kullanicinin istegi: "3.75 genislikte 8
 *              sutunu birlestir", 30 genislikte TEK sutun degil)
 *   10-25    : 16 alt kategori (adet)
 *   26       : Toplam BBHB
 */

const { kriterParagraflariOlustur } = require('../../bbhb/bbhb.aciklamalar');

const SUTUN_HARITASI = [
  { grup: 'kulturIrki', baslik: 'Kültür Irkı', altlar: [
    { etiket: 'İnek', kodlar: ['inek'] },
    { etiket: 'Dana-Düve', kodlar: ['dana', 'duve'] },
  ]},
  { grup: 'kulturMelezi', baslik: 'Kültür Melezi', altlar: [
    { etiket: 'İnek', kodlar: ['inek'] },
    { etiket: 'Dana-Düve', kodlar: ['dana', 'duve'] },
  ]},
  { grup: 'yerliIrk', baslik: 'Yerli Irk', altlar: [
    { etiket: 'İnek', kodlar: ['inek'] },
    { etiket: 'Dana-Düve', kodlar: ['dana', 'duve'] },
  ]},
  { grup: 'buyukbasErkek', baslik: 'Büyükbaş Diğer', altlar: [
    { etiket: 'Boğa', kodlar: ['boga'] },
    { etiket: 'Öküz', kodlar: ['okuz'] },
  ]},
  { grup: 'manda', baslik: 'Manda', altlar: [
    { etiket: 'Erkek', kodlar: ['mandaErkek'] },
    { etiket: 'Dişi', kodlar: ['mandaDisi'] },
  ]},
  { grup: 'kucukbas', baslik: 'Küçükbaş', altlar: [
    { etiket: 'Koyun', kodlar: ['koyun'] },
    { etiket: 'Keçi', kodlar: ['kec'] },
    { etiket: 'Kuzu/Oğlak', kodlar: ['kuzu', 'oglak'] },
  ]},
  { grup: 'tekTirnakli', baslik: 'Tek Tırnaklı', altlar: [
    { etiket: 'At', kodlar: ['at'] },
    { etiket: 'Katır', kodlar: ['katir'] },
    { etiket: 'Eşek', kodlar: ['esek'] },
  ]},
];

const SIRA_NO_SUTUN_SAYISI = 1;
const ISLETMECI_ADI_SUTUN_SAYISI = 8;
const SABIT_ONCESI = SIRA_NO_SUTUN_SAYISI + ISLETMECI_ADI_SUTUN_SAYISI; // 9

const TUM_ALTLAR = SUTUN_HARITASI.flatMap((g) =>
  g.altlar.map((alt) => ({ ...alt, grupKodu: g.grup }))
);

const TOPLAM_SUTUN_INDEX = SABIT_ONCESI + TUM_ALTLAR.length + 1; // 26 (Z)

/** İşletmecinin kayitlarindan sutun sirasina gore adet dizisi cikarir */
function isletmeciSatiriDizisi(kayitlar) {
  return TUM_ALTLAR.map((alt) => {
    const toplam = kayitlar
      .filter((k) => k.grupKodu === alt.grupKodu && alt.kodlar.includes(k.kategoriKodu))
      .reduce((t, k) => t + k.adet, 0);
    return toplam || '';
  });
}

// ---- Siniflandirma kriterleri paragraflari artik bbhb.aciklamalar.js'den
// geliyor (yukarida import edildi) - burada TEKRAR TANIMLANMAZ.

function bolumBasligiMetni(baslik) {
  return (
    `${baslik.il} İli ${baslik.ilce} İlçesi` +
    (baslik.mahalle ? ` ${baslik.mahalle} Köyü/Mahallesi` : '')
  ).toLocaleUpperCase('tr-TR');
}

module.exports = {
  SUTUN_HARITASI,
  TUM_ALTLAR,
  SABIT_ONCESI,
  ISLETMECI_ADI_SUTUN_SAYISI,
  TOPLAM_SUTUN_INDEX,
  isletmeciSatiriDizisi,
  kriterParagraflariOlustur,
  bolumBasligiMetni,
};
