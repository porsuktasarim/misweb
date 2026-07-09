/**
 * bbhb.controller.js
 *
 * INCE HTTP katmani. Is mantigi icermez, sadece bbhb.service.js'i
 * cagirip { success, data, message } formatinda cevap doner.
 */

const fs = require('fs/promises');
const service = require('./bbhb.service');
const { kategorileriKatsayiIleGetir } = require('./bbhb.aciklamalar');
const lang = require('../../../config/lang/tr');

function basarili(res, data, mesaj = null) {
  return res.json({ success: true, data, message: mesaj });
}

function basarisiz(res, mesaj, kod = 400) {
  return res.status(kod).json({ success: false, data: null, message: mesaj });
}

/** Yuklenen gecici Turkvet dosyalarini diskten siler - ISLEM SONUCU NE
 * OLURSA OLSUN (basarili/basarisiz) cagrilir. Dosyalar sisteme KALICI
 * OLARAK SAKLANMAZ, sadece isleme sirasinda gecici olarak diskte durur. */
async function geciciDosyalariSil(dosyalar) {
  await Promise.all(
    (dosyalar || []).map((f) =>
      fs.unlink(f.path).catch(() => {
        /* dosya zaten silinmis olabilir - yoksay */
      })
    )
  );
}

async function manuelHesaplaHandler(req, res) {
  try {
    const { kalemler, baslik } = req.body;
    const sonuc = service.manuelHesapla({ kalemler, baslik });
    return basarili(res, sonuc);
  } catch (err) {
    return basarisiz(res, err.message || lang.ortak.hataOlustu);
  }
}

async function turkvetOnizlemeHandler(req, res) {
  const dosyalar = req.files || [];
  try {
    const dosyaYollari = dosyalar.map((f) => f.path);
    const sonuc = await service.turkvetIleHesapla({ dosyaYollari });
    return basarili(res, sonuc);
  } catch (err) {
    return basarisiz(res, err.message || lang.ortak.hataOlustu);
  } finally {
    // Yuklenen dosyalar hesaplama icin gecici kullanildi, kaliciya saklanmiyor
    await geciciDosyalariSil(dosyalar);
  }
}

async function kaydetHandler(req, res) {
  try {
    const kullaniciId = req.user ? req.user.id : null;
    const kayit = await service.sonucuKaydet(req.body, kullaniciId);
    return basarili(res, kayit, `${lang.bbhb.kisaAd} sonucu kaydedildi`);
  } catch (err) {
    return basarisiz(res, err.message || lang.ortak.hataOlustu);
  }
}

async function getirHandler(req, res) {
  try {
    const kayit = await service.sonucuGetir(req.params.id);
    return basarili(res, kayit);
  } catch (err) {
    return basarisiz(res, err.message || lang.ortak.hataOlustu, 404);
  }
}

async function listeHandler(req, res) {
  try {
    const kayitlar = await service.sonuclariListele();
    return basarili(res, kayitlar);
  } catch (err) {
    return basarisiz(res, err.message || lang.ortak.hataOlustu);
  }
}

async function silHandler(req, res) {
  try {
    await service.sonucuSil(req.params.id);
    return basarili(res, null, 'Kayıt silindi');
  } catch (err) {
    return basarisiz(res, err.message || lang.ortak.hataOlustu, 404);
  }
}

/** Manuel giris ekraninin dinamik olusturdugu form icin: grup/kategori/yas/katsayi listesi */
function kategorilerHandler(req, res) {
  return basarili(res, kategorileriKatsayiIleGetir());
}

module.exports = {
  manuelHesaplaHandler,
  turkvetOnizlemeHandler,
  kaydetHandler,
  getirHandler,
  listeHandler,
  silHandler,
  kategorilerHandler,
};
