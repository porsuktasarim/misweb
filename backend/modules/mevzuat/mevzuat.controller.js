/**
 * mevzuat.controller.js
 */

const fs = require('fs');
const service = require('./mevzuat.service');

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

async function ekleHandler(req, res) {
  try {
    const govde = { ...req.body, etiketler: req.body.etiketler ? JSON.parse(req.body.etiketler) : [] };
    let kayit;
    if (req.body.icerikTipi === 'pdf') {
      kayit = await service.eklePdf(govde, req.file);
    } else if (req.body.icerikTipi === 'mevzuat_gov') {
      kayit = await service.ekleMevzuatGov(govde);
    } else {
      return basarisiz(res, 'Geçersiz içerik tipi (pdf veya mevzuat_gov olmalı)');
    }
    return basarili(res, kayit, 'Mevzuat eklendi');
  } catch (err) {
    return basarisiz(res, err.message);
  } finally {
    // PDF disariya BASARILI sekilde kaydedildiyse dosya kalir (pdfDosyaYolu
    // olarak referans veriliyor); hata durumunda gecici dosyayi temizle.
  }
}

async function guncelleHandler(req, res) {
  try {
    return basarili(res, await service.guncelle(req.params.id, req.body), 'Güncellendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function silHandler(req, res) {
  try {
    await service.sil(req.params.id);
    return basarili(res, null, 'Silindi');
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

async function pdfGetirHandler(req, res) {
  try {
    const kayit = await service.getir(req.params.id);
    if (!kayit.pdfDosyaYolu || !fs.existsSync(kayit.pdfDosyaYolu)) {
      return basarisiz(res, 'PDF bulunamadı', 404);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(kayit.pdfOrijinalAd || kayit.ad)}.pdf"`);
    fs.createReadStream(kayit.pdfDosyaYolu).pipe(res);
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

async function manuelYenileHandler(req, res) {
  try {
    const { kayit, degisti } = await service.manuelYenile(req.params.id);
    return basarili(res, kayit, degisti ? 'Değişiklik tespit edildi, güncellendi.' : 'Değişiklik yok, güncel.');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function guncellemeyiOnaylaHandler(req, res) {
  try {
    return basarili(res, await service.guncellemeyiOnayla(req.params.id), 'Onaylandı');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function istatistikHandler(req, res) {
  try {
    return basarili(res, await service.istatistik());
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

module.exports = {
  listeHandler, getirHandler, ekleHandler, guncelleHandler, silHandler,
  pdfGetirHandler, manuelYenileHandler, guncellemeyiOnaylaHandler, istatistikHandler,
};
