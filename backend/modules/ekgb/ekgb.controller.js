/**
 * ekgb.controller.js
 */

const service = require('./ekgb.service');
const donemService = require('./ekgb.donem.service');
const { EKGB_KALEMLER } = require('./ekgb.kalemler');
const lang = require('../../../config/lang/tr');

function basarili(res, data, mesaj = null) {
  return res.json({ success: true, data, message: mesaj });
}
function basarisiz(res, mesaj, kod = 400) {
  return res.status(kod).json({ success: false, data: null, message: mesaj });
}

// ---- Kalem tanimlari ----
function kalemlerHandler(req, res) {
  return basarili(res, EKGB_KALEMLER);
}

// ---- Donemler ----
async function donemlerHandler(req, res) {
  try {
    return basarili(res, await donemService.donemleriListele());
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function donemGetirHandler(req, res) {
  try {
    return basarili(res, await donemService.donemGetir(req.params.id));
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

async function donemEkleHandler(req, res) {
  try {
    const kayit = await donemService.donemEkle(req.body);
    return basarili(res, kayit, 'Dönem eklendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function donemGuncelleHandler(req, res) {
  try {
    const kayit = await donemService.donemGuncelle(req.params.id, req.body);
    return basarili(res, kayit, 'Dönem güncellendi');
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

// ---- Hesaplama ----
async function onizlemeHandler(req, res) {
  try {
    const sonuc = await service.onizlemeHesapla(req.body);
    return basarili(res, sonuc);
  } catch (err) {
    return basarisiz(res, err.message || lang.ortak.hataOlustu);
  }
}

async function kaydetHandler(req, res) {
  try {
    const kullaniciId = req.user ? req.user.id : null;
    const kayit = await service.sonucuKaydet(req.body, kullaniciId);
    return basarili(res, kayit, 'EKGB sonucu kaydedildi');
  } catch (err) {
    return basarisiz(res, err.message || lang.ortak.hataOlustu);
  }
}

async function getirHandler(req, res) {
  try {
    return basarili(res, await service.sonucuGetir(req.params.id));
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

async function listeHandler(req, res) {
  try {
    return basarili(res, await service.sonuclariListele());
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function silHandler(req, res) {
  try {
    await service.sonucuSil(req.params.id);
    return basarili(res, null, 'Kayıt silindi');
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

module.exports = {
  kalemlerHandler,
  donemlerHandler,
  donemGetirHandler,
  donemEkleHandler,
  donemGuncelleHandler,
  onizlemeHandler,
  kaydetHandler,
  getirHandler,
  listeHandler,
  silHandler,
};
