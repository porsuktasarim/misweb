/**
 * uc-t.service.js
 */

const UcT = require('./uc-t.model');
const Ek4abSonuc = require('../ek4ab/ek4ab.model');
const BbhbSonuc = require('../bbhb/bbhb.model');
const CksSonuc = require('../cks/cks.model');
const ek4abService = require('../ek4ab/ek4ab.service');

async function listele() {
  return UcT.find({ aktif: true }).sort({ createdAt: -1 });
}

async function getir(id) {
  const kayit = await UcT.findById(id).populate('ek4abKaydiId');
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  return kayit;
}

async function olustur({ il, ilce, koyMahalle }) {
  if (!il || !ilce || !koyMahalle) throw new Error('İl, ilçe ve köy/mahalle zorunludur.');
  return UcT.create({ il, ilce, koyMahalle });
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

module.exports = {
  listele, getir, olustur, sil, adimGuncelle, ek4abSec, koyIcinEk4abAdaylari,
  koyIcinBbhbAdaylari, koyIcinCksAdaylari, ek4aVeriCek, ek4bVeriCek, birlestirVeDevamEt,
};
