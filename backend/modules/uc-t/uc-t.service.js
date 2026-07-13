/**
 * uc-t.service.js
 */

const UcT = require('./uc-t.model');
const Ek4abSonuc = require('../ek4ab/ek4ab.model');
const BbhbSonuc = require('../bbhb/bbhb.model');
const CksSonuc = require('../cks/cks.model');
const { birlestir } = require('../ek4ab/ek4ab.core');

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

/** Bu 3T kaydına TEMEL alınacak Ek-4ab kaydını SEÇER (bağımsız Ek-4ab modülünden referans). */
async function ek4abSec(id, ek4abKaydiId) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);

  if (ek4abKaydiId) {
    const ek4ab = await Ek4abSonuc.findById(ek4abKaydiId);
    if (!ek4ab) throw new Error('Seçilen Ek-4ab kaydı bulunamadı.');
    kayit.ek4abKaydiId = ek4abKaydiId;
  } else {
    kayit.ek4abKaydiId = undefined; // secimi kaldir
  }

  await kayit.save();
  return kayit;
}

/** Ayni koy/mahalle icin mevcut Ek-4ab kayitlarini (secim listesi icin) getirir. */
async function koyIcinEk4abAdaylari(il, ilce, koyMahalle) {
  return Ek4abSonuc.find({ il, ilce, koyMahalle }).select('il ilce koyMahalle uretimYili genelToplamBBHB createdAt').sort({ createdAt: -1 });
}

/** Ayni koy/mahalleyi iceren bir BOLUME sahip BBHB kayitlarini (secim icin) getirir. */
async function koyIcinBbhbAdaylari(il, ilce, koyMahalle) {
  const kayitlar = await BbhbSonuc.find({ 'bolumler.il': il, 'bolumler.ilce': ilce, 'bolumler.mahalle': koyMahalle })
    .select('kaynakTipi hesaplamaTarihi bolumler createdAt')
    .sort({ createdAt: -1 });
  return kayitlar.map((k) => {
    const bolum = k.bolumler.find((b) => b.il === il && b.ilce === ilce && b.mahalle === koyMahalle);
    return {
      _id: k._id,
      kaynakTipi: k.kaynakTipi,
      hesaplamaTarihi: k.hesaplamaTarihi,
      createdAt: k.createdAt,
      bolumToplamBBHB: bolum ? bolum.bolumToplamBBHB : 0,
      isletmeciSayisi: bolum ? bolum.isletmeciSonuclari.length : 0,
    };
  });
}

/** Ayni koy/mahalle icin mevcut ÇKS kayitlarini (secim icin) getirir. */
async function koyIcinCksAdaylari(il, ilce, koyMahalle) {
  return CksSonuc.find({ il, ilce, koyMahalle }).select('uretimYili createdAt ciftciler').sort({ createdAt: -1 });
}

function bbhbBolumBul(bbhbSonuc, il, ilce, koyMahalle) {
  const bolum = bbhbSonuc.bolumler.find((b) => b.il === il && b.ilce === ilce && b.mahalle === koyMahalle);
  if (!bolum) throw new Error('Seçilen BBHB kaydında bu köy/mahalleye ait bölüm bulunamadı.');
  return bolum;
}

/**
 * EK-4/A: Cıftçi Aile ve Geçim Kaynağı Bildirim Cetveli - BBHB
 * (hayvan varlığı) + ÇKS (ekiliş/geçim kaynağı) BİRLEŞTİRİLEREK
 * üretilir. AYNI mantık Ek-4ab modülünde de kullanılıyor
 * (ek4ab.core.js birlestir()) - TEK KAYNAKTAN, tekrar yazılmadı.
 */
async function ek4aVeriCek(id, anaAdimIndex, altAdimIndex, { bbhbSonucId, cksSonucId }) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  if (!bbhbSonucId) throw new Error('BBHB kaydı seçilmelidir.');

  const bbhbSonuc = await BbhbSonuc.findById(bbhbSonucId);
  if (!bbhbSonuc) throw new Error('Seçilen BBHB kaydı bulunamadı.');
  const bolum = bbhbBolumBul(bbhbSonuc, kayit.il, kayit.ilce, kayit.koyMahalle);

  let cksSonuc = null;
  if (cksSonucId) {
    cksSonuc = await CksSonuc.findById(cksSonucId);
    if (!cksSonuc) throw new Error('Seçilen ÇKS kaydı bulunamadı.');
  }

  const { birlesikListe, eslesmeyenSayisi } = birlestir(bolum, cksSonuc);

  const altAdim = kayit.surec[anaAdimIndex].altAdimlar[altAdimIndex];
  altAdim.kaynakBbhbSonucId = bbhbSonucId;
  altAdim.kaynakCksSonucId = cksSonucId || undefined;
  altAdim.veri = { ciftciler: birlesikListe, eslesmeyenSayisi, bolumToplamBBHB: bolum.bolumToplamBBHB };
  altAdim.tamamlandiMi = true;
  altAdim.tamamlanmaTarihi = new Date();

  await kayit.save();
  return kayit;
}

const EK4B_KATEGORI_ETIKETLERI = { inek: 'İnek', duveDana: 'Dana-Düve', koyun: 'Koyun', kec: 'Keçi' };

/**
 * EK-4/B: Hayvan Varlığı Cetveli - KÖY DÜZEYİNDE (işletmeci bazlı
 * değil) Kültür / Kültür Melezi / Yerli Irk × İnek / Dana-Düve VE
 * Küçükbaş × Koyun / Keçi kırılımında TOPLAM adet. Kaynak: SEÇİLEN
 * BBHB kaydının bu köye ait bölümündeki TÜM işletmecilerin detaylı
 * kategori kırılımlarının TOPLAMI.
 */
async function ek4bVeriCek(id, anaAdimIndex, altAdimIndex, { bbhbSonucId }) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);
  if (!bbhbSonucId) throw new Error('BBHB kaydı seçilmelidir.');

  const bbhbSonuc = await BbhbSonuc.findById(bbhbSonucId);
  if (!bbhbSonuc) throw new Error('Seçilen BBHB kaydı bulunamadı.');
  const bolum = bbhbBolumBul(bbhbSonuc, kayit.il, kayit.ilce, kayit.koyMahalle);

  // grup -> { inek, duveDana } / kucukbas -> { koyun, kec } TOPLAMLARI
  const toplamlar = {
    kulturIrki: { inek: 0, duveDana: 0 },
    kulturMelezi: { inek: 0, duveDana: 0 },
    yerliIrk: { inek: 0, duveDana: 0 },
    kucukbas: { koyun: 0, kec: 0 },
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
  altAdim.veri = { kategoriToplamlari: toplamlar, etiketler: EK4B_KATEGORI_ETIKETLERI, bbhbToplam: bolum.bolumToplamBBHB };
  altAdim.tamamlandiMi = true;
  altAdim.tamamlanmaTarihi = new Date();

  await kayit.save();
  return kayit;
}

/**
 * BİRLEŞTİRME ONAYI: Ek-4/a ve Ek-4/b'nin İKİSİ DE tamamlanmış
 * olmalıdır. Bu adım YENİ veri ÜRETMEZ, sadece "her ikisi de hazır,
 * devam edilebilir" onayını verir.
 */
async function birlestirVeDevamEt(id, anaAdimIndex, altAdimIndex) {
  const kayit = await UcT.findById(id);
  if (!kayit) throw new Error(`3T kaydı bulunamadı: ${id}`);

  const altAdimlar = kayit.surec[anaAdimIndex].altAdimlar;
  const ek4a = altAdimlar.find((a) => a.tip === 'ek4a');
  const ek4b = altAdimlar.find((a) => a.tip === 'ek4b');
  if (!ek4a || !ek4a.tamamlandiMi) throw new Error('Önce Ek-4/a tamamlanmalıdır.');
  if (!ek4b || !ek4b.tamamlandiMi) throw new Error('Önce Ek-4/b tamamlanmalıdır.');

  const altAdim = altAdimlar[altAdimIndex];
  altAdim.veri = { ek4aOzet: { ciftciSayisi: ek4a.veri.ciftciler.length }, ek4bOzet: { bbhbToplam: ek4b.veri.bbhbToplam } };
  altAdim.tamamlandiMi = true;
  altAdim.tamamlanmaTarihi = new Date();

  await kayit.save();
  return kayit;
}

module.exports = {
  listele, getir, olustur, sil, adimGuncelle, ek4abSec, koyIcinEk4abAdaylari,
  koyIcinBbhbAdaylari, koyIcinCksAdaylari, ek4aVeriCek, ek4bVeriCek, birlestirVeDevamEt,
};
