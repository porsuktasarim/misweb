/**
 * belgeAyarlari.controller.js
 */

const service = require('./belgeAyarlari.service');

function basarili(res, data, mesaj = null) {
  return res.json({ success: true, data, message: mesaj });
}
function basarisiz(res, mesaj, kod = 400) {
  return res.status(kod).json({ success: false, data: null, message: mesaj });
}

async function getirHandler(req, res) {
  try {
    return basarili(res, await service.ayarlariGetir());
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function guncelleHandler(req, res) {
  try {
    return basarili(res, await service.ayarlariGuncelle(req.body), 'Kaydedildi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

module.exports = { getirHandler, guncelleHandler };
