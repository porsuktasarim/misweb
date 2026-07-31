/**
 * meraVerimAyarlari.service.js
 */

const MeraVerimAyarlari = require('./meraVerimAyarlari.model');
const VARSAYILAN = require('./meraVerimVarsayilanVeri');
const meraVerimImport = require('./meraVerimAyarlari.import');
const meraVerimExport = require('./meraVerimAyarlari.export');

const TABLO_ADLARI = ['tablo1YararlanilabilirYesil', 'tablo2UretilenYesil', 'tablo3UretilenKuru', 'illerYagisKusaklari'];
// Ilk kurulumda (sistem varsayilani) - kullanicinin GERCEK resmi bir
// yazisi OLMADIGI icin, kaynagin ne oldugu ACIKCA belirtilir.
const ILK_KURULUM_YAZI_SAYISI = 'İlk kurulum (kullanıcı tarafından paylaşılan resmi Ek-1/Ek-2 görselleri)';
const ILK_KURULUM_YAZI_TARIHI = new Date('2026-07-30');

function ilkVersiyon(satirlar) {
  return { aktifIndex: 0, versiyonlar: [{ satirlar, yaziTarihi: ILK_KURULUM_YAZI_TARIHI, yaziSayisi: ILK_KURULUM_YAZI_SAYISI, yuklemeTarihi: new Date(), kaynakTipi: 'elle' }] };
}

/**
 * ESKI SEMA GOCU (migration) - GUVENLIK AGI: bu servis daha once DUZ
 * DIZI semasi kullaniyordu (orn. tablo1YararlanilabilirYesil DOGRUDAN
 * bir dizi idi), SONRA versiyonlu {aktifIndex, versiyonlar} semasina
 * GECIRILDI. Eger veritabaninda HALA eski duz-dizi formatinda bir
 * belge varsa, normal Mongoose okumasi (sema-cast) bunu SESSIZCE BOS/
 * varsayilan gosterebilir - VERI KAYBI GIBI GORUNUR (esasen kaybolmaz,
 * ama YENI sema uzerinden ERISILEMEZ olur). Bu fonksiyon, Mongoose'un
 * SEMA-CAST katmanini BYPASS EDEN ham (raw) MongoDB sorgusuyla eski
 * formati TESPIT EDIP OTOMATIK GOCURUR - HICBIR VERI SILINMEZ, sadece
 * yeni semaya UYGUN HALE getirilir (eski veri "İlk kurulum (otomatik
 * göç...)" notuyla bir versiyon olarak islenir).
 */
async function eskiSemadanGocEt() {
  const ham = await MeraVerimAyarlari.collection.findOne({});
  if (!ham) return;

  const guncellenecekAlanlar = {};
  for (const tabloAdi of TABLO_ADLARI) {
    const deger = ham[tabloAdi];
    if (Array.isArray(deger) && deger.length) {
      guncellenecekAlanlar[tabloAdi] = {
        aktifIndex: 0,
        versiyonlar: [{
          satirlar: deger,
          yaziTarihi: ILK_KURULUM_YAZI_TARIHI,
          yaziSayisi: `${ILK_KURULUM_YAZI_SAYISI} (otomatik göç - eski veri formatı tespit edildi, hiçbir satır silinmedi)`,
          yuklemeTarihi: new Date(),
          kaynakTipi: 'elle',
        }],
      };
    }
  }
  if (Object.keys(guncellenecekAlanlar).length) {
    await MeraVerimAyarlari.collection.updateOne({ _id: ham._id }, { $set: guncellenecekAlanlar });
  }
}

async function ayarlariGetir() {
  await eskiSemadanGocEt();
  let kayit = await MeraVerimAyarlari.findOne();
  if (!kayit) {
    kayit = await MeraVerimAyarlari.create({
      tablo1YararlanilabilirYesil: ilkVersiyon(VARSAYILAN.TABLO1_YARARLANILABILIR_YESIL),
      tablo2UretilenYesil: ilkVersiyon(VARSAYILAN.TABLO2_URETILEN_YESIL),
      tablo3UretilenKuru: ilkVersiyon(VARSAYILAN.TABLO3_URETILEN_KURU),
      illerYagisKusaklari: ilkVersiyon(VARSAYILAN.ILLER_YAGIS_KUSAKLARI),
    });
  }
  return kayit;
}

async function ayarlariGuncelle(veri) {
  const kayit = await ayarlariGetir();
  const ALANLAR = ['gunlukYesilOtTuketimiKg', 'donemGunSayisi', 'standartYilGunSayisi'];
  ALANLAR.forEach((alan) => { if (veri[alan] !== undefined) kayit[alan] = veri[alan]; });
  await kayit.save();
  return kayit;
}

function tabloAdiDogrula(tabloAdi) {
  if (!TABLO_ADLARI.includes(tabloAdi)) throw new Error(`Geçersiz tablo adı: ${tabloAdi}`);
}

/**
 * Bir tabloya YENI VERSIYON ekler - ESKI VERSIYONLAR SILINMEZ, listede
 * KALIR (denetlenebilir), sadece AKTIF versiyon degisir (hesaplamada
 * ARTIK bu kullanilir). yaziTarihi + yaziSayisi ZORUNLUDUR (hangi
 * resmi yaziyla geldigini gosterir).
 */
async function tabloVersiyonEkle(tabloAdi, satirlar, yaziTarihi, yaziSayisi, kullaniciAdi, kaynakTipi) {
  tabloAdiDogrula(tabloAdi);
  if (!yaziTarihi) throw new Error('Gönderildiği yazı tarihi zorunludur.');
  if (!yaziSayisi || !yaziSayisi.trim()) throw new Error('Gönderildiği yazı sayısı zorunludur.');
  if (!satirlar || !satirlar.length) throw new Error('En az bir satır veri gereklidir.');

  const kayit = await ayarlariGetir();
  const tablo = kayit[tabloAdi];
  tablo.versiyonlar.push({
    satirlar, yaziTarihi: new Date(yaziTarihi), yaziSayisi: yaziSayisi.trim(),
    yuklemeTarihi: new Date(), yukleyenKullanici: kullaniciAdi || '', kaynakTipi: kaynakTipi || 'elle',
  });
  tablo.aktifIndex = tablo.versiyonlar.length - 1; // en son eklenen OTOMATIK aktif olur
  kayit.markModified(tabloAdi);
  await kayit.save();
  return kayit;
}

/** Hangi versiyonun AKTIF (hesaplamada kullanilan) oldugunu DEGISTIRIR - versiyonun KENDISI silinmez/degismez. */
async function tabloAktifVersiyonSec(tabloAdi, versiyonIndex) {
  tabloAdiDogrula(tabloAdi);
  const kayit = await ayarlariGetir();
  const tablo = kayit[tabloAdi];
  if (versiyonIndex < 0 || versiyonIndex >= tablo.versiyonlar.length) throw new Error('Geçersiz versiyon.');
  tablo.aktifIndex = versiyonIndex;
  kayit.markModified(tabloAdi);
  await kayit.save();
  return kayit;
}

async function tabloExcelYukle(tabloAdi, dosyaYolu, yaziTarihi, yaziSayisi, kullaniciAdi) {
  tabloAdiDogrula(tabloAdi);
  const satirlar = tabloAdi === 'illerYagisKusaklari'
    ? await meraVerimImport.illerTablosuOku(dosyaYolu)
    : await meraVerimImport.yagisKusagiTablosuOku(dosyaYolu);
  return tabloVersiyonEkle(tabloAdi, satirlar, yaziTarihi, yaziSayisi, kullaniciAdi, 'excel');
}

async function sablonIndir(tabloAdi) {
  tabloAdiDogrula(tabloAdi);
  return tabloAdi === 'illerYagisKusaklari' ? meraVerimExport.illerSablonuOlustur() : meraVerimExport.yagisKusagiSablonuOlustur();
}

/** Bir tablonun AKTIF versiyonundaki satirlari dondurur (hesaplamada kullanilir). */
function aktifSatirlar(tablo) {
  if (!tablo || !tablo.versiyonlar || !tablo.versiyonlar.length) return [];
  return tablo.versiyonlar[tablo.aktifIndex]?.satirlar || [];
}

/**
 * OTLATMA KAPASITESI HESABI - YENIDEN TASARLANDI (kullanicinin acik
 * karari): VERIM (kg/da, toplam kg) HER TABLO icin AYRI AYRI
 * hesaplanir (Tablo-1/2/3 + TURETILMIS "Yararlanilabilir Kuru Ot" =
 * Tablo-3 x 0.5) - bunlarin HICBIRINDE kendi BBHB degeri YOK. BBHB
 * VE DONEMLIK OTLATMA KAPASITESI ise TEK, AYRI bir hesap - SADECE
 * Tablo-1 (Yararlanilabilir Yesil Ot) uzerinden, GUNLUK YESIL OT
 * TUKETIMI (varsayilan 50 kg) ile hesaplanir. Gerekce (kullanicinin
 * acik ifadesi): "aynı yerdeki otları aynı miktardaki hayvan
 * kullanabilir, kuru ya da yeşil olması tüketimdeki tercih biçimi" -
 * yani kapasite TEKTİR, farkli tablo TURLERI sadece BILGI/KARSILASTIRMA
 * amaclidir.
 */
async function otlatmaKapasitesiHesapla({ il, araziDurumSinifi, alanM2 }) {
  const ayarlar = await ayarlariGetir();

  if (!il) throw new Error('İl bilgisi gereklidir.');
  if (!alanM2 || alanM2 <= 0) throw new Error('Alan (m²) bilgisi gereklidir.');
  if (!araziDurumSinifi || araziDurumSinifi === 'Belirlenmemiş') {
    return { hesaplanabilir: false, mesaj: 'Arazi Durum Sınıfı "Belirlenmemiş" olduğu için verim/otlatma kapasitesi hesaplanamıyor. Genel Bilgiler sekmesinden bir durum sınıfı (Çok İyi/İyi/Orta/Zayıf) seçin.' };
  }

  const iller = aktifSatirlar(ayarlar.illerYagisKusaklari);
  const ilKaydi = iller.find((i) => i.il.toLocaleLowerCase('tr-TR') === il.toLocaleLowerCase('tr-TR'));
  if (!ilKaydi) {
    return { hesaplanabilir: false, mesaj: `"${il}" için yağış kuşağı bilgisi bulunamadı - Ayarlar > Mera Verim Ayarları'ndan il listesini kontrol edin.` };
  }

  const durumAnahtari = { 'Çok İyi': 'cokIyi', İyi: 'iyi', Orta: 'orta', Zayıf: 'zayif' }[araziDurumSinifi];
  const dekar = alanM2 / 1000;

  const verimHesapla = (tablo, katsayi = 1) => {
    const satirlar = aktifSatirlar(tablo);
    const satir = satirlar.find((s) => s.bant === ilKaydi.bant);
    const kgDa = (satir ? satir[durumAnahtari] || 0 : 0) * katsayi;
    return { kgDa, toplamKg: kgDa * dekar };
  };

  const tablo1 = verimHesapla(ayarlar.tablo1YararlanilabilirYesil);
  const tablo2 = verimHesapla(ayarlar.tablo2UretilenYesil);
  const tablo3 = verimHesapla(ayarlar.tablo3UretilenKuru);
  // Yararlanilabilir Kuru Ot = Uretilen Kuru Ot (Tablo-3) x 0.5 - KAYNAKTA
  // AYRI BIR TABLO OLARAK YOK, HER ZAMAN Tablo-3'ten TURETILIR.
  const yararlanilabilirKuru = verimHesapla(ayarlar.tablo3UretilenKuru, 0.5);

  // TEK BBHB HESABI - SADECE Tablo-1 (Yararlanilabilir Yesil Ot) uzerinden.
  const gunlukBbhb = tablo1.toplamKg / ayarlar.gunlukYesilOtTuketimiKg;
  const donemlikBbhb = tablo1.toplamKg / (ayarlar.gunlukYesilOtTuketimiKg * ayarlar.donemGunSayisi);

  return {
    hesaplanabilir: true,
    yagisKusagi: ilKaydi.bant,
    dekar,
    donemGunSayisi: ayarlar.donemGunSayisi,
    tablo1YararlanilabilirYesil: tablo1,
    tablo2UretilenYesil: tablo2,
    tablo3UretilenKuru: tablo3,
    yararlanilabilirKuru,
    gunlukBbhb,
    donemlikBbhb,
  };
}

module.exports = {
  ayarlariGetir, ayarlariGuncelle, tabloVersiyonEkle, tabloAktifVersiyonSec, tabloExcelYukle, sablonIndir,
  otlatmaKapasitesiHesapla,
};
