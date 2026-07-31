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
 * KAPASITESI hesaplar. KAYNAK BELGEDE (kullanicinin Ek-1'i) SADECE 3
 * tablo var (Uretilen Yesil, Yararlanilabilir Yesil, Uretilen Kuru) -
 * ama "Yararlanilabilir Kuru Ot" (4. tablo) HIC YOK. Kullanici bunu
 * SAYISAL OLARAK DOGRULADI: Yararlanilabilir Kuru = Uretilen Kuru x
 * 0.5 (orn. 202.5 x 0.5 = 101.25 kg/da) - bu sekilde hem yesil hem
 * kuru uzerinden hesaplanan DONEMLIK BBHB AYNI CIKIYOR (2.25), ki bu
 * kendi icinde TUTARLI oldugunun kaniti. Bu yuzden Tablo-4 AYRI bir
 * duzenlenebilir tablo olarak SAKLANMAZ - HER ZAMAN Tablo-3'ten
 * TURETILIR (Tablo-3 degisirse otomatik guncellenir).
 *
 * GOSTERIM SIRASI (kullanicinin acik istegi): Uretilen Yesil ->
 * Yararlanilabilir Yesil -> Uretilen Kuru -> Yararlanilabilir Kuru.
 *
 * NIHAI OTLATMA KAPASITESI (toplam + donemlik BBHB) SADECE
 * Yararlanilabilir Yesil Ot uzerinden hesaplanir - digerleri
 * bilgi/karsilastirma amaclidir, "resmi" kapasite degeri degildir.
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

  const tabloyaGoreHesapla = (tablo, gunlukTuketimKg, katsayi = 1) => {
    const satir = tablo.find((s) => s.bant === ilKaydi.bant);
    if (!satir) return null;
    const kgDa = satir[durumAnahtari] * katsayi;
    const toplamKg = kgDa * dekar;
    const gunlukBbhb = toplamKg / gunlukTuketimKg;
    const donemlikBbhb = toplamKg / (gunlukTuketimKg * ayarlar.donemGunSayisi);
    return { kgDa, toplamKg, gunlukBbhb, donemlikBbhb };
  };

  const uretilenYesilOt = tabloyaGoreHesapla(ayarlar.tablo2UretilenYesil, ayarlar.gunlukYesilOtTuketimiKg);
  const yararlanilabilirYesilOt = tabloyaGoreHesapla(ayarlar.tablo1YararlanilabilirYesil, ayarlar.gunlukYesilOtTuketimiKg);
  const uretilenKuruOt = tabloyaGoreHesapla(ayarlar.tablo3UretilenKuru, ayarlar.gunlukKuruOtTuketimiKg);
  // Tablo-4 (Yararlanilabilir Kuru) = Tablo-3 x 0.5 (TURETILMIS - kaynak belgede yok, kullanici tarafindan sayisal olarak dogrulandi).
  const yararlanilabilirKuruOt = tabloyaGoreHesapla(ayarlar.tablo3UretilenKuru, ayarlar.gunlukKuruOtTuketimiKg, 0.5);

  return {
    hesaplanabilir: true,
    yagisKusagi: ilKaydi.bant,
    dekar,
    donemGunSayisi: ayarlar.donemGunSayisi,
    uretilenYesilOt,
    yararlanilabilirYesilOt,
    uretilenKuruOt,
    yararlanilabilirKuruOt,
    // NIHAI OTLATMA KAPASITESI - sadece Yararlanilabilir Yesil Ot'tan.
    toplamKapasiteBbhb: yararlanilabilirYesilOt.gunlukBbhb,
    donemlikOtlatmaKapasitesiBbhb: yararlanilabilirYesilOt.donemlikBbhb,
  };
}

module.exports = { ayarlariGetir, ayarlariGuncelle, otlatmaKapasitesiHesapla };
