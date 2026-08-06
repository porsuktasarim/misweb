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
    return basarili(res, await service.sil(req.params.id, req.body.aciklama, req.body.kullaniciAdi), 'Parsel silindi (pasif duruma alındı, veri kaybolmadı)');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function durumDegistirHandler(req, res) {
  try {
    return basarili(res, await service.durumDegistir(req.params.id, req.body.durum, req.body.aciklama, req.body.kullaniciAdi), 'Durum güncellendi');
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
    return basarili(res, {
      araziNitelikleri: service.ARAZI_NITELIKLERI, araziKaynaklari: service.ARAZI_KAYNAKLARI,
      araziDurumSiniflari: service.ARAZI_DURUM_SINIFLARI, topraksiniflari: service.TOPRAK_SINIFLARI,
      islahDurumlari: service.ISLAH_DURUMLARI, parselDurumlari: service.PARSEL_DURUMLARI,
      mulkiyetDurumlari: await service.mulkiyetDurumlariGetir(),
    });
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function topluYukleHandler(req, res) {
  try {
    if (!req.file) return basarisiz(res, 'Dosya seçilmedi.');
    return basarili(res, await service.topluYukle(req.file.path, req.body.kullaniciAdi), 'Toplu yükleme tamamlandı');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function sablonIndirHandler(req, res) {
  try {
    const buffer = await service.sablonIndir();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="mera-toplu-yukleme-sablonu.xlsx"');
    return res.send(buffer);
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function raporIndirHandler(req, res) {
  try {
    const buffer = await service.raporIndir(req.query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="mera-parselleri-raporu.xlsx"');
    return res.send(buffer);
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function haritaDosyaYukleHandler(req, res) {
  try {
    return basarili(res, await service.haritaDosyaYukle(req.params.id, req.file, req.body.kullaniciAdi), 'Harita dosyası yüklendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function komsuParsellerHandler(req, res) {
  try {
    const { il, ilce, koyMahalle } = req.query;
    return basarili(res, await service.komsuParseller(il, ilce, koyMahalle, req.params.id));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function dosyaYukleHandler(req, res) {
  try {
    return basarili(res, await service.dosyaYukle(req.params.id, req.file, req.body.dosyaTipiAnahtari, req.body.kullaniciAdi), 'Dosya yüklendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function dosyaSilHandler(req, res) {
  try {
    return basarili(res, await service.dosyaSil(req.params.id, req.params.dosyaIndex, req.body.aciklama, req.body.kullaniciAdi), 'Dosya silindi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function kimlikPdfHandler(req, res) {
  try {
    const buffer = await service.kimlikPdfIndir(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="mera-kimligi.pdf"');
    return res.send(buffer);
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

module.exports = {
  listeHandler, getirHandler, olusturHandler, guncelleHandler, silHandler, durumDegistirHandler,
  notEkleHandler, notDuzenleHandler, notDosyaEkleHandler, sabitlerHandler,
  topluYukleHandler, sablonIndirHandler, raporIndirHandler,
  haritaDosyaYukleHandler, komsuParsellerHandler, dosyaYukleHandler, dosyaSilHandler, kimlikPdfHandler,
};
