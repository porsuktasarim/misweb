/**
 * teknikEkip.controller.js
 */

const service = require('./teknikEkip.service');
const { KURUMLAR } = require('./personel.kurumlar');

function basarili(res, data, mesaj = null) {
  return res.json({ success: true, data, message: mesaj });
}
function basarisiz(res, mesaj, kod = 400) {
  return res.status(kod).json({ success: false, data: null, message: mesaj });
}

function kurumlarHandler(req, res) {
  return basarili(res, KURUMLAR);
}

async function listeHandler(req, res) {
  try {
    return basarili(res, await service.hepsiniListele());
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function getirHandler(req, res) {
  try {
    return basarili(res, await service.ekipGetir(req.params.id));
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

async function olusturHandler(req, res) {
  try {
    const kayit = await service.ekipOlustur(req.body);
    return basarili(res, kayit, 'Ekip oluşturuldu');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function uyeleriGuncelleHandler(req, res) {
  try {
    const kayit = await service.uyeleriGuncelle(req.params.id, req.body.uyeler || []);
    return basarili(res, kayit, 'Üyeler kaydedildi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function silHandler(req, res) {
  try {
    await service.ekipSil(req.params.id);
    return basarili(res, null, 'Ekip silindi');
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

module.exports = { kurumlarHandler, listeHandler, getirHandler, olusturHandler, uyeleriGuncelleHandler, silHandler };
