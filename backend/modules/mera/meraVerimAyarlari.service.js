/**
 * meraVerimAyarlari.service.js
 */

const MeraVerimAyarlari = require('./meraVerimAyarlari.model');
const VARSAYILAN = require('./meraVerimVarsayilanVeri');

async function ayarlariGetir() {
  let kayit = await MeraVerimAyarlari.findOne();
  if (!kayit) {
    kayit = await MeraVerimAyarlari.create({
      tablo1YararlanilabilirYesil: VARSAYILAN.TABLO1_YARARLANILABILIR_YESIL,
      tablo2UretilenYesil: VARSAYILAN.TABLO2_URETILEN_YESIL,
      tablo3UretilenKuru: VARSAYILAN.TABLO3_URETILEN_KURU,
      illerYagisKusaklari: VARSAYILAN.ILLER_YAGIS_KUSAKLARI,
    });
  }
  return kayit;
}

async function ayarlariGuncelle(veri) {
  const kayit = await ayarlariGetir();
  const ALANLAR = ['tablo1YararlanilabilirYesil', 'tablo2UretilenYesil', 'tablo3UretilenKuru', 'illerYagisKusaklari', 'gunlukYesilOtTuketimiKg', 'gunlukKuruOtTuketimiKg', 'donemGunSayisi'];
  ALANLAR.forEach((alan) => { if (veri[alan] !== undefined) kayit[alan] = veri[alan]; });
  await kayit.save();
  return kayit;
}

/**
 * Verilen il + arazi durum sinifi + alan (m2) icin OTLATMA
 * KAPASITESI hesaplar - Ek-1'deki 3 tablonun (Tablo-1 Yararlanilabilir
 * Yesil, Tablo-2 Uretilen Yesil, Tablo-3 Uretilen Kuru) HER BIRI icin
 * AYRI AYRI: kg/da, toplam kg, gunluk BBHB, donemlik (varsayilan 180
 * gun) otlatma kapasitesi BBHB. TEK bir "nihai" deger URETILMEZ - 3
 * SONUC BIRLIKTE gosterilir (kullanicinin acik karari - onceki bir
 * taslakta "4. turetilmis tablo + nihai deger" vardi, KALDIRILDI).
 */
async function otlatmaKapasitesiHesapla({ il, araziDurumSinifi, alanM2 }) {
  const ayarlar = await ayarlariGetir();

  if (!il) throw new Error('İl bilgisi gereklidir.');
  if (!alanM2 || alanM2 <= 0) throw new Error('Alan (m²) bilgisi gereklidir.');
  if (!araziDurumSinifi || araziDurumSinifi === 'Belirlenmemiş') {
    return { hesaplanabilir: false, mesaj: 'Arazi Durum Sınıfı "Belirlenmemiş" olduğu için verim/otlatma kapasitesi hesaplanamıyor. Genel Bilgiler sekmesinden bir durum sınıfı (Çok İyi/İyi/Orta/Zayıf) seçin.' };
  }

  const ilKaydi = ayarlar.illerYagisKusaklari.find((i) => i.il.toLocaleLowerCase('tr-TR') === il.toLocaleLowerCase('tr-TR'));
  if (!ilKaydi) {
    return { hesaplanabilir: false, mesaj: `"${il}" için yağış kuşağı bilgisi bulunamadı - Ayarlar > Mera Verim Ayarları'ndan il listesini kontrol edin.` };
  }

  const durumAnahtari = { 'Çok İyi': 'cokIyi', İyi: 'iyi', Orta: 'orta', Zayıf: 'zayif' }[araziDurumSinifi];
  const dekar = alanM2 / 1000;

  const tabloyaGoreHesapla = (tablo, gunlukTuketimKg) => {
    const satir = (tablo || []).find((s) => s.bant === ilKaydi.bant);
    // Satir bulunamazsa (orn. veri eksikse) SESSIZCE null DONDURMEK
    // YERINE 0'li bir yapi donduruyoruz - boylece frontend'de
    // "undefined.kgDa" gibi bir CRASH olusmaz, panel "0" gosterir
    // (veri eksikligini fark etmeyi kolaylastirir, sayfa kilitlenmez).
    if (!satir) return { kgDa: 0, toplamKg: 0, gunlukBbhb: 0, donemlikBbhb: 0, veriEksik: true };
    const kgDa = satir[durumAnahtari] || 0;
    const toplamKg = kgDa * dekar;
    const gunlukBbhb = toplamKg / gunlukTuketimKg;
    const donemlikBbhb = toplamKg / (gunlukTuketimKg * ayarlar.donemGunSayisi);
    return { kgDa, toplamKg, gunlukBbhb, donemlikBbhb };
  };

  return {
    hesaplanabilir: true,
    yagisKusagi: ilKaydi.bant,
    dekar,
    donemGunSayisi: ayarlar.donemGunSayisi,
    tablo1YararlanilabilirYesil: tabloyaGoreHesapla(ayarlar.tablo1YararlanilabilirYesil, ayarlar.gunlukYesilOtTuketimiKg),
    tablo2UretilenYesil: tabloyaGoreHesapla(ayarlar.tablo2UretilenYesil, ayarlar.gunlukYesilOtTuketimiKg),
    tablo3UretilenKuru: tabloyaGoreHesapla(ayarlar.tablo3UretilenKuru, ayarlar.gunlukKuruOtTuketimiKg),
  };
}

module.exports = { ayarlariGetir, ayarlariGuncelle, otlatmaKapasitesiHesapla };
