/**
 * uc-t.controller.js
 */

const fs = require('fs');
const service = require('./uc-t.service');

function basarili(res, data, mesaj = null) {
  return res.json({ success: true, data, message: mesaj });
}
function basarisiz(res, mesaj, kod = 400) {
  return res.status(kod).json({ success: false, data: null, message: mesaj });
}

async function listeHandler(req, res) {
  try {
    return basarili(res, await service.listele());
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
    return basarili(res, await service.olustur(req.body), '3T kaydı oluşturuldu');
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

async function adimGuncelleHandler(req, res) {
  try {
    const { anaAdimIndex, altAdimIndex, tamamlandiMi, not } = req.body;
    return basarili(res, await service.adimGuncelle(req.params.id, anaAdimIndex, altAdimIndex, { tamamlandiMi, not }));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function ek4abSecHandler(req, res) {
  try {
    return basarili(res, await service.ek4abSec(req.params.id, req.body.ek4abKaydiId), 'Ek-4ab kaydı bağlandı');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function ek4abAdaylariHandler(req, res) {
  try {
    const { il, ilce, koyMahalle } = req.query;
    return basarili(res, await service.koyIcinEk4abAdaylari(il, ilce, koyMahalle));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function bbhbAdaylariHandler(req, res) {
  try {
    const { il, ilce, koyMahalle } = req.query;
    return basarili(res, await service.koyIcinBbhbAdaylari(il, ilce, koyMahalle));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function cksAdaylariHandler(req, res) {
  try {
    const { il, ilce, koyMahalle } = req.query;
    return basarili(res, await service.koyIcinCksAdaylari(il, ilce, koyMahalle));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function ek4aVeriCekHandler(req, res) {
  try {
    const { anaAdimIndex, altAdimIndex, cksSonucId, atlandi } = req.body;
    return basarili(res, await service.ek4aVeriCek(req.params.id, anaAdimIndex, altAdimIndex, { cksSonucId, atlandi }), 'Ek-4/a verisi çekildi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function ek4bVeriCekHandler(req, res) {
  try {
    const { anaAdimIndex, altAdimIndex, bbhbSonucId } = req.body;
    return basarili(res, await service.ek4bVeriCek(req.params.id, anaAdimIndex, altAdimIndex, { bbhbSonucId }), 'Ek-4/b verisi çekildi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function birlestirVeDevamEtHandler(req, res) {
  try {
    const { anaAdimIndex, altAdimIndex } = req.body;
    return basarili(res, await service.birlestirVeDevamEt(req.params.id, anaAdimIndex, altAdimIndex), 'Birleştirildi, devam edilebilir');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function komisyonAdaylariHandler(req, res) {
  try {
    return basarili(res, await service.komisyonAdaylari(req.query.il));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function karar1KaydetHandler(req, res) {
  try {
    const { anaAdimIndex, altAdimIndex, kararTarihi, kararSayisi, komisyonId, guvenlikSecimi } = req.body;
    const katilimcilar = req.body.katilimcilar ? JSON.parse(req.body.katilimcilar) : [];
    return basarili(
      res,
      await service.karar1Kaydet(req.params.id, anaAdimIndex, altAdimIndex, { kararTarihi, kararSayisi, komisyonId, guvenlikSecimi, katilimcilar }, req.file),
      'Karar kaydedildi'
    );
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function adimPdfGetirHandler(req, res) {
  try {
    const kayit = await service.getir(req.params.id);
    const altAdim = kayit.surec[req.params.anaAdimIndex]?.altAdimlar[req.params.altAdimIndex];
    if (!altAdim || !altAdim.pdfDosyaYolu || !fs.existsSync(altAdim.pdfDosyaYolu)) return basarisiz(res, 'PDF bulunamadı', 404);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(altAdim.pdfOrijinalAd || 'belge')}.pdf"`);
    fs.createReadStream(altAdim.pdfDosyaYolu).pipe(res);
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

module.exports = {
  listeHandler, getirHandler, olusturHandler, silHandler,
  adimGuncelleHandler, ek4abSecHandler, ek4abAdaylariHandler,
  bbhbAdaylariHandler, cksAdaylariHandler, ek4aVeriCekHandler, ek4bVeriCekHandler, birlestirVeDevamEtHandler,
  komisyonAdaylariHandler, karar1KaydetHandler, adimPdfGetirHandler,
};
