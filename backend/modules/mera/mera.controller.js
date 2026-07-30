/**
 * mera.controller.js
 */

const service = require('./mera.service');

function basarili(res, data, mesaj = null) {
  return res.json({ success: true, data, message: mesaj });
}
function basarisiz(res, mesaj, kod = 400) {
  return res.status(kod).json({ success: false, data: null, message: mesaj });
}

async function listeHandler(req, res) {
  try {
    return basarili(res, await service.listele(req.query));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function getirHandler(req, res) {
  try {
    return basarili(res, await service.getir(req.params.id));
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

async function olusturHandler(req, res) {
  try {
    return basarili(res, await service.olustur(req.body, req.body.kullaniciAdi), 'Parsel oluşturuldu');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function guncelleHandler(req, res) {
  try {
    return basarili(res, await service.guncelle(req.params.id, req.body, req.body.kullaniciAdi), 'Parsel güncellendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function silHandler(req, res) {
  try {
    return basarili(res, await service.sil(req.params.id), 'Parsel silindi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function notEkleHandler(req, res) {
  try {
    return basarili(res, await service.notEkle(req.params.id, req.body.metin, req.body.kullaniciAdi), 'Not eklendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function notDuzenleHandler(req, res) {
  try {
    return basarili(res, await service.notDuzenle(req.params.id, req.params.notIndex, req.body.metin, req.body.kullaniciAdi), 'Not güncellendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function notDosyaEkleHandler(req, res) {
  try {
    return basarili(res, await service.notDosyaEkle(req.params.id, req.params.notIndex, req.file, req.body.kullaniciAdi), 'Dosya eklendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function sabitlerHandler(req, res) {
  try {
    return basarili(res, { araziNitelikleri: service.ARAZI_NITELIKLERI, araziKaynaklari: service.ARAZI_KAYNAKLARI, topraksiniflari: service.TOPRAK_SINIFLARI });
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

module.exports = {
  listeHandler, getirHandler, olusturHandler, guncelleHandler, silHandler,
  notEkleHandler, notDuzenleHandler, notDosyaEkleHandler, sabitlerHandler,
};
