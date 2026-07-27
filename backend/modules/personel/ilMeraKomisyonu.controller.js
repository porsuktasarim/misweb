/**
 * ilMeraKomisyonu.controller.js
 */

const service = require('./ilMeraKomisyonu.service');

function basarili(res, data, mesaj = null) {
  return res.json({ success: true, data, message: mesaj });
}
function basarisiz(res, mesaj, kod = 400) {
  return res.status(kod).json({ success: false, data: null, message: mesaj });
}

async function listeHandler(req, res) {
  try {
    return basarili(res, await service.hepsiniListele());
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function ilIcinListeHandler(req, res) {
  try {
    return basarili(res, await service.ilIcinKomisyonlar(req.query.il));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function getirHandler(req, res) {
  try {
    return basarili(res, await service.komisyonGetir(req.params.id));
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

async function olusturHandler(req, res) {
  try {
    return basarili(res, await service.komisyonOlustur(req.body), 'Komisyon kaydı oluşturuldu');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function uyeleriGuncelleHandler(req, res) {
  try {
    return basarili(res, await service.uyeleriGuncelle(req.params.id, req.body.uyeler), 'Üyeler güncellendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function silHandler(req, res) {
  try {
    await service.komisyonSil(req.params.id);
    return basarili(res, null, 'Silindi');
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

module.exports = { listeHandler, ilIcinListeHandler, getirHandler, olusturHandler, uyeleriGuncelleHandler, silHandler };
