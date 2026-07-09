/**
 * ekgb.core.js
 *
 * SAF hesaplama cekirdegi - Excel sablonundaki formullerin BIREBIR
 * yeniden yazimidir. Express/DB bilmez. Girdi: alan bilgileri + o
 * donemin fiyat haritasi -> Cikti: detayli kalem kalem dokum + toplam.
 *
 * Alan tipleri (Excel'deki *A, *B, *C isaretlemesiyle ayni):
 *   A = Sürülen/Tarla Olarak Kullanılan Alan
 *   B = İnşaat/Hafriyat Dökülen Alan (+ Toprak Derinliği)
 *   C = Asfalt/Beton Kaplı Alan (+ Asfalt/Beton Kalınlığı)
 * "Yalnizca ilgili alanlari doldurunuz" - kullanilmayan alanlar 0 girilir.
 */

const {
  EKGB_TOHUM_ORANLARI,
  EKGB_GUBRE_PARAMETRELERI,
  EKGB_SABIT_PARAMETRELER,
} = require('./ekgb.kalemler');

function yuvarla(sayi) {
  return Math.round((sayi + Number.EPSILON) * 100) / 100;
}

/**
 * @param {object} alanBilgileri
 * @param {number} alanBilgileri.surulenAlanM2 - (A)
 * @param {number} alanBilgileri.insaatHafriyatAlanM2 - (B)
 * @param {number} alanBilgileri.toprakDerinligiM - (B ile ilişkili)
 * @param {number} alanBilgileri.asfaltBetonAlanM2 - (C)
 * @param {number} alanBilgileri.asfaltBetonKalinligiM - (C ile ilişkili)
 * @param {number} alanBilgileri.telOrguUzunlugu
 * @param {object} fiyatHaritasi - { [kalemKod]: fiyat }
 * @returns {object} detayli hesaplama sonucu
 */
function hesapla(alanBilgileri, fiyatHaritasi) {
  const {
    surulenAlanM2 = 0,
    insaatHafriyatAlanM2 = 0,
    toprakDerinligiM = 0,
    asfaltBetonAlanM2 = 0,
    asfaltBetonKalinligiM = 0,
    telOrguUzunlugu = 0,
  } = alanBilgileri;

  const P = EKGB_SABIT_PARAMETRELER;

  function fiyat(kod) {
    const deger = fiyatHaritasi[kod];
    if (deger === undefined) throw new Error(`Bu dönemde fiyatı tanımlı olmayan kalem: ${kod}`);
    return deger;
  }

  // ---- Alan hesapları (O12, AO12) ----
  const hafriyatHacmiM3 = insaatHafriyatAlanM2 * toprakDerinligiM + asfaltBetonAlanM2 * asfaltBetonKalinligiM;
  const toplamIslahAlaniM2 = surulenAlanM2 + insaatHafriyatAlanM2 + asfaltBetonAlanM2;
  const toplamIslahAlaniDa = toplamIslahAlaniM2 / 1000;
  const bcAlaniDa = (insaatHafriyatAlanM2 + asfaltBetonAlanM2) / 1000;

  // ---- İŞÇİLİK (AQ17:AQ27) ----
  const iscilikKalemleri = [
    { kod: 'derinSurum', ad: 'Derin Sürüm (Dipkazan)', aciklama: '*A + *B + *C', alanDa: toplamIslahAlaniDa },
    { kod: 'surum', ad: 'Sürüm (Pulluk)', aciklama: '*A + *B + *C', alanDa: toplamIslahAlaniDa },
    { kod: 'ikileme', ad: 'İkileme (Kazayağı-Diskarrow)', aciklama: '*A + *B + *C', alanDa: toplamIslahAlaniDa },
    { kod: 'tirmik', ad: 'Tırmık', aciklama: '*A + *B + *C', alanDa: toplamIslahAlaniDa },
    { kod: 'gubrelemeMakineli', ad: 'Gübreleme (Makineli - 2 yıl)', aciklama: '*A + *B + *C', alanDa: toplamIslahAlaniDa },
    { kod: 'ekimMibzer', ad: 'Ekim (Mibzerle - 2 yıl)', aciklama: '*A + *B + *C', alanDa: toplamIslahAlaniDa },
    { kod: 'temizlikTesviye', ad: 'Temizlik/Tesviye', aciklama: '*A + *B + *C', alanDa: toplamIslahAlaniDa },
  ].map((k) => ({
    ...k,
    birimFiyat: fiyat(k.kod),
    maliyet: yuvarla(k.alanDa * fiyat(k.kod)),
  }));

  // Hafriyat Taşıma (R24/AQ24) - BK42 notundaki "Hafriyat Taşıma İşçiliği" formülü
  const hafriyatTasimaMaliyet = yuvarla(
    (((P.tasitKapasitesiM3 * P.topraginOzgulAgirligiKgM3 - 20 * P.torbaAgirligiKg) / P.torbaAgirligiKg) *
      fiyat('yuklemeIscilikFazla60')) *
      (hafriyatHacmiM3 / P.tasitKapasitesiM3)
  );

  // Toprak Serme (R25*AK25) - sadece B+C alanı
  const toprakSermeBirimMaliyet = (1 / P.topraakSermeKalinligi) * fiyat('temizlikTesviye') + fiyat('toprakFiyati') / (1 / P.topraakSermeKalinligi);
  const toprakSermeMaliyet = yuvarla(toprakSermeBirimMaliyet * bcAlaniDa);

  // Asfalt/Beton Sökümü (R26*AK26) - sadece C alanı hacmi
  const asfaltBetonHacmiM3 = asfaltBetonAlanM2 * asfaltBetonKalinligiM;
  const asfaltSokumMaliyet = yuvarla(fiyat('asfaltBetonSokumu') * asfaltBetonHacmiM3);

  // Tel Örgü Kaldırılması ve Sınır Düzenleme (R27*AK27)
  const telOrguMaliyet = yuvarla(fiyat('telOrguKaldirma') * telOrguUzunlugu);

  const iscilikDetaylari = [
    ...iscilikKalemleri,
    { kod: 'hafriyatTasima', ad: 'Hafriyat Taşıma', aciklama: 'Hesaplama adımları arka sayfadadır. (m3) *B + *C', maliyet: hafriyatTasimaMaliyet },
    { kod: 'toprakSerme', ad: 'Toprak Serme', aciklama: 'Toprak bedeli + tesviye *B + *C', maliyet: toprakSermeMaliyet },
    { kod: 'asfaltSokumu', ad: 'Asfalt/Beton Sökümü', aciklama: '(m3) *C', maliyet: asfaltSokumMaliyet },
    { kod: 'telOrgu', ad: 'Tel Örgü Kaldırılması ve Sınır Düzenleme', aciklama: '(TL/m)', maliyet: telOrguMaliyet },
  ];
  const iscilikToplam = yuvarla(iscilikDetaylari.reduce((t, k) => t + k.maliyet, 0));

  // ---- TOHUM (AB33:AB40) ----
  const tohumDetaylari = EKGB_TOHUM_ORANLARI.map((t) => {
    const miktarKgDa = yuvarla(P.dekaraTohumMiktariKg * t.oran);
    const birimFiyat = fiyat(t.kalemKod);
    const maliyet = yuvarla(miktarKgDa * birimFiyat * toplamIslahAlaniDa);
    return { kod: t.kalemKod, oran: t.oran, miktarKgDa, birimFiyat, maliyet };
  });
  const tohumToplam = yuvarla(tohumDetaylari.reduce((t, k) => t + k.maliyet, 0));

  // ---- GÜBRELEME (AV33:AV39) ----
  const gubreDetaylari = EKGB_GUBRE_PARAMETRELERI.map((g) => {
    const birimFiyat = fiyat(g.kalemKod);
    const maliyet = yuvarla(birimFiyat * g.miktarKgDa * toplamIslahAlaniDa * g.yilCarpani);
    return { kod: g.kalemKod, miktarKgDa: g.miktarKgDa, yilCarpani: g.yilCarpani, birimFiyat, maliyet };
  });
  const gubreToplam = yuvarla(gubreDetaylari.reduce((t, k) => t + k.maliyet, 0));

  // ---- GENEL TOPLAM (AT43) ----
  const genelToplam = yuvarla(iscilikToplam + tohumToplam + gubreToplam);

  return {
    alanOzeti: {
      hafriyatHacmiM3: yuvarla(hafriyatHacmiM3),
      toplamIslahAlaniM2: yuvarla(toplamIslahAlaniM2),
      toplamIslahAlaniDa: yuvarla(toplamIslahAlaniDa),
    },
    iscilik: { detaylar: iscilikDetaylari, toplam: iscilikToplam },
    tohum: { detaylar: tohumDetaylari, toplam: tohumToplam },
    gubreleme: { detaylar: gubreDetaylari, toplam: gubreToplam },
    genelToplam,
  };
}

module.exports = { hesapla };
