/**
 * mevzuat.service.js
 */

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const Mevzuat = require('./mevzuat.model');
const { mevzuatGovCek } = require('./mevzuat.gov-cek');

const PDF_KLASORU = 'uploads/mevzuat';

/**
 * mevzuat.gov.tr'den PDF FORMATINDA gelen icerigi (bkz. mevzuat.gov-cek.js
 * PDF tespiti) yerel diske kaydeder - established multer/uploads deseniyle
 * AYNI klasor kullanilir.
 */
async function pdfBufferıDiskeKaydet(buffer, ad) {
  await fs.mkdir(PDF_KLASORU, { recursive: true });
  const dosyaAdi = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
  const dosyaYolu = path.join(PDF_KLASORU, dosyaAdi);
  await fs.writeFile(dosyaYolu, buffer);
  return dosyaYolu;
}

async function listele({ tur, ara } = {}) {
  const filtre = { aktif: true };
  if (tur) filtre.tur = tur;
  if (ara) filtre.$text = { $search: ara };
  return Mevzuat.find(filtre)
    .sort(ara ? { score: { $meta: 'textScore' } } : { tur: 1, ad: 1 })
    .select('-icerik -htmlIcerik -surumler');
}

async function getir(id) {
  const kayit = await Mevzuat.findById(id);
  if (!kayit) throw new Error(`Mevzuat bulunamadı: ${id}`);
  return kayit;
}

async function ekleMevzuatGov({ ad, tur, konu, etiketler, mevzuatGovUrl }) {
  const cekilen = await mevzuatGovCek(mevzuatGovUrl);

  let pdfDosyaYolu;
  if (cekilen.pdfBuffer) {
    pdfDosyaYolu = await pdfBufferıDiskeKaydet(cekilen.pdfBuffer, ad || cekilen.ad);
  }

  return Mevzuat.create({
    ad: ad || cekilen.ad,
    tur,
    konu,
    etiketler: etiketler || [],
    icerikTipi: 'mevzuat_gov',
    mevzuatGovUrl,
    icerik: cekilen.metinIcerik,
    htmlIcerik: cekilen.htmlIcerik,
    mevzuatNo: cekilen.mevzuatNo,
    resmiGazeteTarihi: cekilen.resmiGazeteTarihi,
    resmiGazeteSayisi: cekilen.resmiGazeteSayisi,
    kaynakHash: cekilen.hash,
    sonKontrol: new Date(),
    ...(pdfDosyaYolu ? { pdfDosyaYolu } : {}),
  });
}

async function eklePdf({ ad, tur, konu, etiketler, resmiGazeteTarihi, resmiGazeteSayisi, mevzuatNo }, dosya) {
  if (!dosya) throw new Error('PDF dosyası zorunludur.');
  return Mevzuat.create({
    ad, tur, konu, etiketler: etiketler || [],
    resmiGazeteTarihi, resmiGazeteSayisi, mevzuatNo,
    icerikTipi: 'pdf',
    pdfDosyaYolu: dosya.path,
    pdfOrijinalAd: dosya.originalname,
  });
}

async function guncelle(id, veri) {
  const kayit = await Mevzuat.findById(id);
  if (!kayit) throw new Error(`Mevzuat bulunamadı: ${id}`);
  const izinliAlanlar = ['ad', 'tur', 'resmiGazeteTarihi', 'resmiGazeteSayisi', 'mevzuatNo', 'konu', 'etiketler', 'aktif'];
  izinliAlanlar.forEach((alan) => { if (veri[alan] !== undefined) kayit[alan] = veri[alan]; });
  await kayit.save();
  return kayit;
}

async function sil(id) {
  const kayit = await Mevzuat.findById(id);
  if (!kayit) throw new Error(`Mevzuat bulunamadı: ${id}`);
  if (kayit.pdfDosyaYolu) await fs.unlink(kayit.pdfDosyaYolu).catch(() => {});
  await Mevzuat.findByIdAndDelete(id);
  return kayit;
}

async function guncellemeyiOnayla(id) {
  const kayit = await Mevzuat.findById(id);
  if (!kayit) throw new Error(`Mevzuat bulunamadı: ${id}`);
  kayit.guncellemeBekliyor = false;
  await kayit.save();
  return kayit;
}

/** Tek bir mevzuat_gov kaydini kontrol edip degisirse surumu arsivler */
async function tekKayitKontrolEt(kayit, degisiklikNotu) {
  const cekilen = await mevzuatGovCek(kayit.mevzuatGovUrl);
  const yeniHash = cekilen.hash;

  if (yeniHash && yeniHash !== kayit.kaynakHash) {
    // Eski surumu (PDF dosyasi dahil) arsivle - dosya SILINMEZ, referans tasinir
    kayit.surumler.push({
      icerik: kayit.icerik,
      htmlIcerik: kayit.htmlIcerik,
      pdfDosyaYolu: kayit.pdfDosyaYolu,
      kaynakHash: kayit.kaynakHash,
      degisiklikNotu,
      kontrolTarihi: new Date(),
    });

    if (cekilen.pdfBuffer) {
      kayit.pdfDosyaYolu = await pdfBufferıDiskeKaydet(cekilen.pdfBuffer, kayit.ad);
      kayit.icerik = cekilen.metinIcerik; // PDF'ten cikarilan metin (arama/fark icin)
      kayit.htmlIcerik = '';
    } else {
      kayit.icerik = cekilen.metinIcerik;
      kayit.htmlIcerik = cekilen.htmlIcerik;
      kayit.pdfDosyaYolu = undefined;
    }

    kayit.kaynakHash = yeniHash;
    kayit.guncellemeBekliyor = true;
    kayit.guncellemeTarihi = new Date();
    kayit.sonKontrol = new Date();
    await kayit.save();
    return true;
  }
  kayit.sonKontrol = new Date();
  await kayit.save();
  return false;
}

async function manuelYenile(id) {
  const kayit = await Mevzuat.findById(id);
  if (!kayit) throw new Error(`Mevzuat bulunamadı: ${id}`);
  if (kayit.icerikTipi !== 'mevzuat_gov') throw new Error('Yalnızca mevzuat.gov.tr kaynakları yenilenebilir.');
  const degisti = await tekKayitKontrolEt(kayit, 'Manuel yenileme');
  return { kayit, degisti };
}

/**
 * HAFTALIK KONTROL - cron tarafindan her Pazartesi 04:00'da cagrilir.
 * icerik_tipi='mevzuat_gov' olan TUM aktif kayitlari sirayla kontrol eder.
 */
async function haftalikKontrol() {
  console.log('[Mevzuat] Haftalık kontrol başladı:', new Date().toLocaleString('tr-TR'));
  const kayitlar = await Mevzuat.find({ icerikTipi: 'mevzuat_gov', aktif: true, mevzuatGovUrl: { $exists: true, $ne: '' } });

  let degisenSayisi = 0;
  for (const kayit of kayitlar) {
    try {
      const degisti = await tekKayitKontrolEt(kayit, `Otomatik haftalık kontrol — önceki hash: ${kayit.kaynakHash}`);
      if (degisti) {
        degisenSayisi += 1;
        console.log(`[Mevzuat] Değişiklik tespit edildi: ${kayit.ad}`);
      }
    } catch (err) {
      console.error(`[Mevzuat] Kontrol hatası (${kayit.ad}):`, err.message);
    }
  }
  console.log(`[Mevzuat] Haftalık kontrol tamamlandı. ${kayitlar.length} kayıt kontrol edildi, ${degisenSayisi} değişiklik bulundu.`);
}

async function istatistik() {
  const [toplam, bekleyen] = await Promise.all([
    Mevzuat.countDocuments({ aktif: true }),
    Mevzuat.countDocuments({ aktif: true, guncellemeBekliyor: true }),
  ]);
  const guncellemeler = await Mevzuat.find({ aktif: true, guncellemeBekliyor: true })
    .select('ad tur guncellemeTarihi')
    .limit(10);
  return { toplam, bekleyen, guncellemeler };
}

module.exports = {
  listele, getir, ekleMevzuatGov, eklePdf, guncelle, sil,
  guncellemeyiOnayla, manuelYenile, haftalikKontrol, istatistik,
};
