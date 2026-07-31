/**
 * meraVerimAyarlari.controller.js
 */

const service = require('./meraVerimAyarlari.service');

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

async function hesaplaHandler(req, res) {
  try {
    const { il, araziDurumSinifi, alanM2 } = req.query;
    return basarili(res, await service.otlatmaKapasitesiHesapla({ il, araziDurumSinifi, alanM2: Number(alanM2) }));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function tabloVersiyonEkleHandler(req, res) {
  try {
    const { tabloAdi } = req.params;
    const { satirlar, yaziTarihi, yaziSayisi, kullaniciAdi } = req.body;
    return basarili(res, await service.tabloVersiyonEkle(tabloAdi, satirlar, yaziTarihi, yaziSayisi, kullaniciAdi, 'elle'), 'Yeni versiyon eklendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function tabloAktifVersiyonSecHandler(req, res) {
  try {
    const { tabloAdi } = req.params;
    return basarili(res, await service.tabloAktifVersiyonSec(tabloAdi, Number(req.body.versiyonIndex)), 'Aktif versiyon değiştirildi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function tabloExcelYukleHandler(req, res) {
  try {
    const { tabloAdi } = req.params;
    const { yaziTarihi, yaziSayisi, kullaniciAdi } = req.body;
    if (!req.file) return basarisiz(res, 'Dosya seçilmedi.');
    return basarili(res, await service.tabloExcelYukle(tabloAdi, req.file.path, yaziTarihi, yaziSayisi, kullaniciAdi), 'Excel yüklendi, yeni versiyon eklendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function sablonIndirHandler(req, res) {
  try {
    const { tabloAdi } = req.params;
    const buffer = await service.sablonIndir(tabloAdi);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${tabloAdi}-sablon.xlsx"`);
    return res.send(buffer);
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

module.exports = {
  getirHandler, guncelleHandler, hesaplaHandler,
  tabloVersiyonEkleHandler, tabloAktifVersiyonSecHandler, tabloExcelYukleHandler, sablonIndirHandler,
};
