/**
 * bbhb.controller.js
 *
 * INCE HTTP katmani. Is mantigi icermez, sadece bbhb.service.js'i
 * cagirip { success, data, message } formatinda cevap doner.
 */

const service = require('./bbhb.service');
const lang = require('../../../config/lang/tr');

function basarili(res, data, mesaj = null) {
  return res.json({ success: true, data, message: mesaj });
}

function basarisiz(res, mesaj, kod = 400) {
  return res.status(kod).json({ success: false, data: null, message: mesaj });
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
  try {
    // req.files: multer ile yuklenen dosyalarin sunucudaki gecici yollari
    const dosyaYollari = (req.files || []).map((f) => f.path);
    const sonuc = await service.turkvetIleHesapla({ dosyaYollari });
    return basarili(res, sonuc);
  } catch (err) {
    return basarisiz(res, err.message || lang.ortak.hataOlustu);
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

module.exports = {
  manuelHesaplaHandler,
  turkvetOnizlemeHandler,
  kaydetHandler,
  getirHandler,
};
