/**
 * uc-t.service.js
 */

const UcT = require('./uc-t.model');
const { TESPIT_TAHDIT_ANA_ADIMLAR, TAHSIS_ANA_ADIMLAR, anaAdimlariKopyala } = require('./uc-t.model');
const Ek4abSonuc = require('../ek4ab/ek4ab.model');
const BbhbSonuc = require('../bbhb/bbhb.model');
const CksSonuc = require('../cks/cks.model');
const ek4abService = require('../ek4ab/ek4ab.service');
const ilMeraKomisyonuService = require('../personel/ilMeraKomisyonu.service');
const MeraParseli = require('../mera/mera.model');
const meraKimlik = require('../mera/mera.kimlik');
const BelgeAyarlari = require('../belge-ayarlari/belgeAyarlari.model');
const fs = require('fs/promises');

async function listele() {
  return UcT.find({ aktif: true }).sort({ createdAt: -1 });
}

/**
 * ADIM 1: İl Mera Komisyonu Kararı. PDF (varsa - multer zaten diske
 * yazdi, sadece yolunu aliyoruz) + karar tarih/sayisi + SECILEN
 * komisyonun ONAYLI SNAPSHOT'i (kurum basina asil/yedekten HANGISI
 * imzaladiysa o) kaydedilir. Guvenlik kurumu (Polis/Jandarma/Ikisi)
 * secimine gore ilgili kurum satir(lar)i katilimcilara dahil edilir -
 * bu FILTRELEME FRONTEND'DE yapilip HAZIR katilimci listesi
 * gonderilir (backend sadece SNAPSHOT'i saklar, tekrar sorgu atmaz).
 */
async function karar1Kaydet(id, anaAdimIndex, altAdimIndex, { kararTarihi, kararSayisi, komisyonId, baskanlik, katilimcilar }, dosya) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  if (!kararTarihi || !kararSayisi) throw new Error('Karar tarihi ve sayısı zorunludur.');
  if (!komisyonId) throw new Error('İl Mera Komisyonu seçilmelidir.');

  const altAdim = kayit.surec[anaAdimIndex].altAdimlar[altAdimIndex];

  if (dosya) {
    // Eski PDF varsa (guncelleme durumu) diskten SIL
    if (altAdim.pdfDosyaYolu) await fs.unlink(altAdim.pdfDosyaYolu).catch(() => {});
    altAdim.pdfDosyaYolu = dosya.path;
    altAdim.pdfOrijinalAd = dosya.originalname;
  }

  altAdim.veri = {
    kararTarihi, kararSayisi, komisyonId,
    baskanlik: baskanlik || null, // { tip: 'vali'|'valiYardimcisi'|'ilMudur', adSoyad, unvan, vekilMi }
    katilimcilar: katilimcilar || [],
  };
  altAdim.tamamlandiMi = true;
  altAdim.tamamlanmaTarihi = new Date();

  await kayit.save();
  return kayit;
}

async function getir(id) {
  const kayit = await UcT.findById(id).populate('ek4abKaydiId');
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  return kayit;
}

async function olustur({ il, ilce, koyMahalle, tespitTahditVar = true, tahsisVar = true }) {
  if (!il || !ilce || !koyMahalle) throw new Error('İl, ilçe ve köy/mahalle zorunludur.');
  if (!tespitTahditVar && !tahsisVar) throw new Error('En az bir aşama (Tespit/Tahdit veya Tahsis) seçilmelidir.');

  const surec = [
    ...(tespitTahditVar ? anaAdimlariKopyala(TESPIT_TAHDIT_ANA_ADIMLAR) : []),
    ...(tahsisVar ? anaAdimlariKopyala(TAHSIS_ANA_ADIMLAR) : []),
  ];

  return UcT.create({ il, ilce, koyMahalle, tespitTahditVar, tahsisVar, surec });
}

async function sil(id) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  await UcT.findByIdAndDelete(id);
  return kayit;
}

/** Bir alt adımın (ana adım + alt adım indeksiyle) durumunu günceller. */
async function adimGuncelle(id, anaAdimIndex, altAdimIndex, { tamamlandiMi, not }) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);

  const anaAdim = kayit.surec[anaAdimIndex];
  if (!anaAdim) throw new Error('Ana adım bulunamadı.');
  const altAdim = anaAdim.altAdimlar[altAdimIndex];
  if (!altAdim) throw new Error('Alt adım bulunamadı.');

  if (tamamlandiMi !== undefined) {
    altAdim.tamamlandiMi = !!tamamlandiMi;
    altAdim.tamamlanmaTarihi = tamamlandiMi ? new Date() : undefined;
  }
  if (not !== undefined) altAdim.not = not;

  await kayit.save();
  return kayit;
}

/**
 * GENEL AMAÇLI: herhangi bir adimin `veri` alanini set edip
 * TAMAMLANDI isaretler - Duyuru/Duyuru Tutanagi gibi PDF YUKLEMEYEN,
 * SADECE bilgi girisi + uretilen kopyalanabilir metin iceren
 * adimlar icin (ileride benzer adimlarda da yeniden kullanilabilir).
 */
async function adimVeriKaydet(id, anaAdimIndex, altAdimIndex, veri) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  const altAdim = kayit.surec[anaAdimIndex].altAdimlar[altAdimIndex];
  altAdim.veri = veri;
  altAdim.tamamlandiMi = true;
  altAdim.tamamlanmaTarihi = new Date();
  await kayit.save();
  return kayit;
}

/**
 * GENEL AMACLI dosya yukleme - Duyuru Tutanagi/Teblig Belgesi gibi
 * PDF EKLENEBILEN (ama zorunlu olmayan) adimlar icin. `dosyaAdi`
 * BOSSA kullanici tarafindan verilmemis demektir - VARSAYILAN adi
 * (frontend'de uretilir, orn. "3T_Silivri_Bekirli_ek-3") kullanilir.
 */
async function adimDosyaYukle(id, anaAdimIndex, altAdimIndex, dosyaAdi, dosya) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  if (!dosya) throw new Error('Dosya seçilmedi.');

  const altAdim = kayit.surec[anaAdimIndex].altAdimlar[altAdimIndex];
  if (altAdim.pdfDosyaYolu) await fs.unlink(altAdim.pdfDosyaYolu).catch(() => {});
  altAdim.pdfDosyaYolu = dosya.path;
  altAdim.pdfOrijinalAd = dosyaAdi || dosya.originalname;

  await kayit.save();
  return kayit;
}

/** Bu 3T kaydına TEMEL alınacak Ek-4ab kaydını SEÇER (elle - Birleştirme adımı OTOMATİK de yapabilir). */
async function ek4abSec(id, ek4abKaydiId) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);

  if (ek4abKaydiId) {
    const ek4ab = await Ek4abSonuc.findById(ek4abKaydiId);
    if (!ek4ab) throw new Error('Seçilen Ek-4ab kaydı bulunamadı.');
    kayit.ek4abKaydiId = ek4abKaydiId;
  } else {
    kayit.ek4abKaydiId = undefined;
  }

  await kayit.save();
  return kayit;
}

async function koyIcinEk4abAdaylari(il, ilce, koyMahalle) {
  return Ek4abSonuc.find({ il, ilce, koyMahalle }).select('il ilce koyMahalle uretimYili genelToplamBBHB createdAt').sort({ createdAt: -1 });
}

/**
 * ONEMLI: Mongo'da TAM ESLESME (il/ilce/mahalle) aramak, farkli
 * kaynaklardan (manuel giris, Turkvet import, Yerlesim secici)
 * gelen kucuk buyuk harf/bosluk farklarinda SESSIZCE hicbir sonuc
 * DONDURMUYORDU (kullanicinin karsilastigi "kayit bulunamadi"
 * sorunu). Bu yuzden - tipki Yerlesim aramasinda oldugu gibi -
 * TUM kayitlar cekilip Turkce-duyarli, kirpilmis/kucuk harfe
 * cevrilmis JS karsilastirmasi yapiliyor.
 */
function esitMi(a, b) {
  return (a || '').trim().toLocaleLowerCase('tr-TR') === (b || '').trim().toLocaleLowerCase('tr-TR');
}

/** BBHB sonuclari icinde, bu koye ait BOLUMUN INDEKSINI de dondurerek eslesenleri bulur. */
async function bbhbAdaylariBul(il, ilce, koyMahalle) {
  const tumKayitlar = await BbhbSonuc.find().select('kaynakTipi hesaplamaTarihi bolumler createdAt').sort({ createdAt: -1 });
  const sonuc = [];
  for (const k of tumKayitlar) {
    const bolumIndex = k.bolumler.findIndex((b) => esitMi(b.il, il) && esitMi(b.ilce, ilce) && esitMi(b.mahalle, koyMahalle));
    if (bolumIndex === -1) continue;
    const bolum = k.bolumler[bolumIndex];
    sonuc.push({
      _id: k._id, bolumIndex, kaynakTipi: k.kaynakTipi, hesaplamaTarihi: k.hesaplamaTarihi, createdAt: k.createdAt,
      bolumToplamBBHB: bolum.bolumToplamBBHB, isletmeciSayisi: bolum.isletmeciSonuclari.length,
    });
  }
  return sonuc;
}

async function koyIcinBbhbAdaylari(il, ilce, koyMahalle) {
  return bbhbAdaylariBul(il, ilce, koyMahalle);
}

/** ÇKS sonuclari icinde bu koye ait olanlari (Turkce-duyarli JS karsilastirmasiyla) bulur. */
async function koyIcinCksAdaylari(il, ilce, koyMahalle) {
  const tumKayitlar = await CksSonuc.find().select('il ilce koyMahalle uretimYili createdAt ciftciler').sort({ createdAt: -1 });
  return tumKayitlar.filter((k) => esitMi(k.il, il) && esitMi(k.ilce, ilce) && esitMi(k.koyMahalle, koyMahalle));
}

/**
 * EK-4/A: SADECE ÇKS'den ceker (aile/ciftci ailesi + ekilis/gecim
 * kaynagi). "ÇKS'ye kayıtlı kimse bulunmamaktadır" isaretlenirse
 * (atlandi=true) hicbir kayit gerekmeden adim TAMAMLANDI sayilir.
 */
async function ek4aVeriCek(id, anaAdimIndex, altAdimIndex, { cksSonucId, atlandi }) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);

  const altAdim = kayit.surec[anaAdimIndex].altAdimlar[altAdimIndex];

  if (atlandi) {
    altAdim.kaynakCksSonucId = undefined;
    altAdim.veri = { atlandiMi: true, ciftciler: [] };
    altAdim.tamamlandiMi = true;
    altAdim.tamamlanmaTarihi = new Date();
    await kayit.save();
    return kayit;
  }

  if (!cksSonucId) throw new Error('ÇKS kaydı seçilmeli veya "ÇKS\'ye kayıtlı kimse bulunmamaktadır" işaretlenmelidir.');
  const cksSonuc = await CksSonuc.findById(cksSonucId);
  if (!cksSonuc) throw new Error('Seçilen ÇKS kaydı bulunamadı.');

  altAdim.kaynakCksSonucId = cksSonucId;
  altAdim.veri = {
    atlandiMi: false,
    ciftciler: cksSonuc.ciftciler.map((c) => ({
      isletmeciAdi: c.isletmeciAdi, yemBitkisi: c.yemBitkisi, sebzeBag: c.sebzeMeyve, hububat: c.hububatYagli, tarim: c.tarim,
    })),
  };
  altAdim.tamamlandiMi = true;
  altAdim.tamamlanmaTarihi = new Date();

  await kayit.save();
  return kayit;
}

const EK4B_KATEGORI_ETIKETLERI = { inek: 'İnek', duveDana: 'Dana-Düve', koyun: 'Koyun', kec: 'Keçi' };

/** EK-4/B: SADECE BBHB'den ceker - koy duzeyinde kategori toplamlari. */
async function ek4bVeriCek(id, anaAdimIndex, altAdimIndex, { bbhbSonucId }) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  if (!bbhbSonucId) throw new Error('BBHB kaydı seçilmelidir.');

  const bbhbSonuc = await BbhbSonuc.findById(bbhbSonucId);
  if (!bbhbSonuc) throw new Error('Seçilen BBHB kaydı bulunamadı.');
  const bolumIndex = bbhbSonuc.bolumler.findIndex((b) => esitMi(b.il, kayit.il) && esitMi(b.ilce, kayit.ilce) && esitMi(b.mahalle, kayit.koyMahalle));
  if (bolumIndex === -1) throw new Error('Seçilen BBHB kaydında bu köy/mahalleye ait bölüm bulunamadı.');
  const bolum = bbhbSonuc.bolumler[bolumIndex];

  const toplamlar = {
    kulturIrki: { inek: 0, duveDana: 0 }, kulturMelezi: { inek: 0, duveDana: 0 },
    yerliIrk: { inek: 0, duveDana: 0 }, kucukbas: { koyun: 0, kec: 0 },
  };
  for (const isletmeci of bolum.isletmeciSonuclari) {
    for (const d of isletmeci.detaylar) {
      if (['kulturIrki', 'kulturMelezi', 'yerliIrk'].includes(d.grup)) {
        if (d.kategori === 'inek') toplamlar[d.grup].inek += d.adet;
        else if (d.kategori === 'duve' || d.kategori === 'dana') toplamlar[d.grup].duveDana += d.adet;
      } else if (d.grup === 'kucukbas') {
        if (d.kategori === 'koyun' || d.kategori === 'kuzu') toplamlar.kucukbas.koyun += d.adet;
        else if (d.kategori === 'kec' || d.kategori === 'oglak') toplamlar.kucukbas.kec += d.adet;
      }
    }
  }

  const altAdim = kayit.surec[anaAdimIndex].altAdimlar[altAdimIndex];
  altAdim.kaynakBbhbSonucId = bbhbSonucId;
  altAdim.veri = { bbhbBolumIndex: bolumIndex, kategoriToplamlari: toplamlar, etiketler: EK4B_KATEGORI_ETIKETLERI, bbhbToplam: bolum.bolumToplamBBHB };
  altAdim.tamamlandiMi = true;
  altAdim.tamamlanmaTarihi = new Date();

  await kayit.save();
  return kayit;
}

/**
 * EK-3/A MADDE 8 icin: orijinal cetvel 3x3'luk bir tablo istiyor -
 * SATIRLAR Büyükbaş/Küçükbaş/Diğerleri, SÜTUNLAR Kültür/Kültür
 * Melezi/Yerli. BBHB kuralinda SADECE sigir (kulturIrki/kulturMelezi/
 * yerliIrk) bu 3 irka ayrilir; Manda VE Büyükbaş Erkek (boğa/öküz)
 * kendi irk ayrimi OLMADIGI icin - "manda büyükbaş sayılacak"
 * talimati geregi BÜYÜKBAŞ satirina, YERLİ sütununa eklenir (net bir
 * ayrim verilmediginden en makul varsayim - YANLIŞSA KOLAYCA
 * DEĞİŞTİRİLEBİLİR). Küçükbaş ve Diğerleri (tek tırnaklı) icin de
 * irk ayrimi HİÇ YOK, bu yuzden TOPLAMLARI ayni gerekceyle "Yerli"
 * sütununda gösterilir. Her hucre {adet, bbhb} - EKRANDA "X adet
 * (Y BBHB)" seklinde gosterilir (BBHB detay satirlarindaki ONCEDEN
 * HESAPLANMIS 'bbhb' alani DOGRUDAN TOPLANIR, katsayi tekrar
 * hesaplanmaz).
 */
async function ek3aHayvanVarligiCek(id, anaAdimIndex, altAdimIndex, { bbhbSonucId }) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  if (!bbhbSonucId) throw new Error('BBHB kaydı seçilmelidir.');

  const bbhbSonuc = await BbhbSonuc.findById(bbhbSonucId);
  if (!bbhbSonuc) throw new Error('Seçilen BBHB kaydı bulunamadı.');
  const bolumIndex = bbhbSonuc.bolumler.findIndex((b) => esitMi(b.il, kayit.il) && esitMi(b.ilce, kayit.ilce) && esitMi(b.mahalle, kayit.koyMahalle));
  if (bolumIndex === -1) throw new Error('Seçilen BBHB kaydında bu köy/mahalleye ait bölüm bulunamadı.');
  const bolum = bbhbSonuc.bolumler[bolumIndex];

  const bosHucre = () => ({ kultur: { adet: 0, bbhb: 0 }, kulturMelezi: { adet: 0, bbhb: 0 }, yerli: { adet: 0, bbhb: 0 } });
  const tablo = { buyukbas: bosHucre(), kucukbas: bosHucre(), digerleri: bosHucre() };

  const ekle = (satir, sutun, d) => { tablo[satir][sutun].adet += d.adet; tablo[satir][sutun].bbhb += d.bbhb; };

  for (const isletmeci of bolum.isletmeciSonuclari) {
    for (const d of isletmeci.detaylar) {
      if (d.grup === 'kulturIrki') ekle('buyukbas', 'kultur', d);
      else if (d.grup === 'kulturMelezi') ekle('buyukbas', 'kulturMelezi', d);
      else if (d.grup === 'yerliIrk') ekle('buyukbas', 'yerli', d);
      else if (d.grup === 'buyukbasErkek' || d.grup === 'manda') ekle('buyukbas', 'yerli', d);
      else if (d.grup === 'kucukbas') ekle('kucukbas', 'yerli', d);
      else if (d.grup === 'tekTirnakli') ekle('digerleri', 'yerli', d);
    }
  }

  const altAdim = kayit.surec[anaAdimIndex].altAdimlar[altAdimIndex];
  altAdim.kaynakBbhbSonucId = bbhbSonucId;
  altAdim.veri = { bbhbBolumIndex: bolumIndex, hayvanVarligiTablosu: tablo, bbhbToplam: bolum.bolumToplamBBHB };
  altAdim.tamamlandiMi = true;
  altAdim.tamamlanmaTarihi = new Date();

    await kayit.save();
  return kayit;
}

/**
 * EK-3/A MADDE 7 - Mera Modulu ENTEGRASYONU: kullanicinin secip
 * "Parsel Sec" popup'indan onayladigi Mera parselleri, CINSI'ne
 * (araziNiteligi - Mera/Yaylak/Kislak/Otlak/Cayir) gore GRUPLANIR:
 * Miktari Dekar (tapuAlaniM2 VARSA ONCELIKLI, yoksa meraAlaniM2 -
 * m2'den DEKARA /1000 CEVRILEREK TOPLANIR), Parca Adedi (o cinsteki
 * SECILEN parsel SAYISI), Diger Bilgiler (Kime Ait Oldugu) sutunu o
 * cinsteki parsellerin mulkiyetDurumu degerlerinin BENZERSIZ
 * BIRLESIMI. "Mevki" sutunu Mera modelinde HENUZ IZLENMEDIGI icin
 * BOS birakilir (elle doldurulabilir). Madde 7 tablosu SADECE 5
 * SABIT satir icerdigi icin (Mera/Yaylak/Kislak/Otlak/Cayir),
 * BUNLARIN DISINDAKI arazi nitelikleri (Eyrek Yeri vb.) bu tabloya
 * DAHIL EDILMEZ (sessizce atlanir).
 *
 * ONEMLI: `altAdim.veri` diger alanlari (aileSayisi, hayvanVarligiTablosu
 * vb.) EZMEDEN, SADECE ilgili iki alani (secilenParselIdleri,
 * madde7Satirlari) EKLER/GUNCELLER - boylece bu popup BAGIMSIZ olarak
 * (ana formu tekrar kaydetmeden) kullanilabilir.
 */
async function ek3aAraziVerileriKaydet(id, anaAdimIndex, altAdimIndex, { parselIdleri }) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  if (!parselIdleri || !parselIdleri.length) throw new Error('En az bir parsel seçilmelidir.');

  const parseller = await MeraParseli.find({ _id: { $in: parselIdleri } });

  const CINS_SATIRLARI = ['Mera', 'Yaylak', 'Kışlak', 'Otlak', 'Çayır'];
  const gruplar = {};
  CINS_SATIRLARI.forEach((c) => { gruplar[c] = { miktarDekar: 0, parcaAdedi: 0, mulkiyetDurumlari: new Set() }; });

  parseller.forEach((p) => {
    if (!CINS_SATIRLARI.includes(p.araziNiteligi)) return; // Madde 7 tablosunda OLMAYAN cinsler (Eyrek Yeri vb.) sessizce atlanir
    const alanM2 = p.tapuAlaniM2 || p.meraAlaniM2 || 0;
    gruplar[p.araziNiteligi].miktarDekar += alanM2 / 1000;
    gruplar[p.araziNiteligi].parcaAdedi += 1;
    if (p.mulkiyetDurumu) gruplar[p.araziNiteligi].mulkiyetDurumlari.add(p.mulkiyetDurumu);
  });

  const madde7Satirlari = CINS_SATIRLARI.map((c) => [
    c,
    gruplar[c].miktarDekar > 0 ? gruplar[c].miktarDekar.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) : '',
    gruplar[c].parcaAdedi > 0 ? String(gruplar[c].parcaAdedi) : '',
    '',
    Array.from(gruplar[c].mulkiyetDurumlari).join(', '),
  ]);

  const altAdim = kayit.surec[anaAdimIndex].altAdimlar[altAdimIndex];
  altAdim.veri = { ...(altAdim.veri || {}), secilenParselIdleri: parselIdleri, madde7Satirlari };
  altAdim.tamamlandiMi = true;
  altAdim.tamamlanmaTarihi = new Date();

  await kayit.save();
  return kayit;
}

/**
 * EK-3/A MADDE 10 - "Harita, Kroki, Pafta ve Ellerinde Mevcut Diger
 * Bilgiler": Madde 7'de SECILEN (secilenParselIdleri) parsellerin
 * HEPSININ "Mera Kimligi" PDF'lerini (harita + alanlar + ekleri) TEK
 * bir PDF'de BIRLESTIRIR. Once Madde 7'de parsel SECILMEMISSE
 * ACIKCA HATA firlatir (frontend bunu YAKALAYIP kullaniciya "once
 * Madde 7'de parsel secin" seklinde gosterir).
 */
async function madde10KimlikPdfIndir(id, anaAdimIndex, altAdimIndex) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  const altAdim = kayit.surec[anaAdimIndex].altAdimlar[altAdimIndex];
  const parselIdleri = (altAdim.veri && altAdim.veri.secilenParselIdleri) || [];
  if (!parselIdleri.length) throw new Error('Önce Madde 7\'de "Parsel Seç" ile en az bir parsel seçip kaydetmelisiniz.');

  const parseller = await MeraParseli.find({ _id: { $in: parselIdleri } });
  if (!parseller.length) throw new Error('Seçilen parseller Mera Modülü\'nde bulunamadı (silinmiş olabilirler).');

  const ayarlar = await BelgeAyarlari.findOne();
  const dosyaTipiAdSozlugu = Object.fromEntries(((ayarlar && ayarlar.meraDosyaTipleri) || []).map((t) => [t.anahtar, t.ad]));

  return meraKimlik.coklulKimlikPdfOlustur(parseller, dosyaTipiAdSozlugu);
}

/**
 * BİRLEŞTİRME: Ek-4/b'de secilen BBHB + Ek-4/a'da secilen ÇKS (varsa)
 * ile, MEVCUT Ek-4ab modulunun AYNI mantigini (onizlemeOlustur ->
 * sonucuKaydet) kullanarak GERCEK bir Ek-4ab (Birlesik Cetvel) kaydi
 * URETIR ve bu 3T kaydina OTOMATIK olarak baglar.
 */
async function birlestirVeDevamEt(id, anaAdimIndex, altAdimIndex) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);

  const altAdimlar = kayit.surec[anaAdimIndex].altAdimlar;
  const ek4a = altAdimlar.find((a) => a.tip === 'ek4a');
  const ek4b = altAdimlar.find((a) => a.tip === 'ek4b');
  if (!ek4a || !ek4a.tamamlandiMi) throw new Error('Önce Ek-4/a tamamlanmalıdır.');
  if (!ek4b || !ek4b.tamamlandiMi) throw new Error('Önce Ek-4/b tamamlanmalıdır.');
  if (!ek4b.kaynakBbhbSonucId) throw new Error('Ek-4/b\'de kullanılan BBHB kaydı bulunamadı.');

  const onizleme = await ek4abService.onizlemeOlustur({
    bbhbSonucId: ek4b.kaynakBbhbSonucId,
    bbhbBolumIndex: ek4b.veri.bbhbBolumIndex,
    cksSonucId: ek4a.veri.atlandiMi ? null : ek4a.kaynakCksSonucId,
  });

  const yeniEk4ab = await ek4abService.sonucuKaydet(onizleme);

  kayit.ek4abKaydiId = yeniEk4ab._id;

  const altAdim = altAdimlar[altAdimIndex];
  altAdim.veri = {
    ek4abKaydiId: yeniEk4ab._id,
    ciftciSayisi: onizleme.ciftciler.length,
    eslesmeyenSayisi: onizleme.eslesmeyenSayisi,
    genelToplamBBHB: onizleme.genelToplamBBHB,
  };
  altAdim.tamamlandiMi = true;
  altAdim.tamamlanmaTarihi = new Date();

  await kayit.save();
  return kayit;
}

/** 3T kaydinin iline gore Il Mera Komisyonu adaylarini (secim listesi icin) getirir. */
async function komisyonAdaylari(il) {
  return ilMeraKomisyonuService.ilIcinKomisyonlar(il);
}

module.exports = {
  listele, getir, olustur, sil, adimGuncelle, adimVeriKaydet, adimDosyaYukle, ek4abSec, koyIcinEk4abAdaylari,
  koyIcinBbhbAdaylari, koyIcinCksAdaylari, ek4aVeriCek, ek4bVeriCek, ek3aHayvanVarligiCek, ek3aAraziVerileriKaydet,
  madde10KimlikPdfIndir, birlestirVeDevamEt, karar1Kaydet, komisyonAdaylari,
};
