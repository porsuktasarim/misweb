/**
 * ek4ab.controller.js
 */

const service = require('./ek4ab.service');
const lang = require('../../../config/lang/tr');

function basarili(res, data, mesaj = null) {
  return res.json({ success: true, data, message: mesaj });
}
function basarisiz(res, mesaj, kod = 400) {
  return res.status(kod).json({ success: false, data: null, message: mesaj });
}

async function onizlemeHandler(req, res) {
  try {
    const sonuc = await service.onizlemeOlustur(req.body);
    return basarili(res, sonuc);
  } catch (err) {
    return basarisiz(res, err.message || lang.ortak.hataOlustu);
  }
}

async function kaydetHandler(req, res) {
  try {
    const kullaniciId = req.user ? req.user.id : null;
    const kayit = await service.sonucuKaydet(req.body, kullaniciId);
    return basarili(res, kayit, 'Ek-4ab sonucu kaydedildi');
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

module.exports = { onizlemeHandler, kaydetHandler, getirHandler, listeHandler, silHandler };
