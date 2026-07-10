/**
 * excel-birimler.js
 *
 * Excel'de "sutun genisligi" gercek bir fiziksel birim DEGILDIR -
 * calisma kitabinin varsayilan (Normal stil) fontuna gore karakter
 * sayisi birimidir (Excel bunu boyle hesaplar, hangi font hucreye
 * uygulanirsa uygulansin degismez). BBHB/CKS raporlarinda kullanilan
 * standart yakinsama (Calibri 11 varsayilan, MDW=7px) ile:
 *
 *   piksel = cm * 96 / 2.54
 *   sutun_birimi = (piksel - 5) / 7
 *
 * Satir yuksekligi ise DOGRUDAN puan (point) cinsindendir, font'tan
 * bagimsizdir: 1 cm = 72/2.54 puan.
 */

function cmSutunGenisligi(cm) {
  const piksel = (cm * 96) / 2.54;
  return (piksel - 5) / 7;
}

function cmSatirYuksekligiPuan(cm) {
  return (cm * 72) / 2.54;
}

module.exports = { cmSutunGenisligi, cmSatirYuksekligiPuan };
