/**
 * mevzuat.controller.js
 */

const fs = require('fs');
const service = require('./mevzuat.service');
const { mevzuatWordOlustur, mevzuatPdfOlustur } = require('./mevzuat.export');

const TURKCE_ASCII = { ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' };
function dosyaAdiUret(ad, uzanti) {
  const guvenliAd = String(ad || 'mevzuat').trim().replace(/\s+/g, '_').slice(0, 80);
  const asciiTemiz = guvenliAd.split('').map((h) => TURKCE_ASCII[h] || h).join('').replace(/[^a-zA-Z0-9._-]/g, '');
  return { ascii: `${asciiTemiz}.${uzanti}`, utf8: `${guvenliAd}.${uzanti}` };
}
function mevzuatContentDisposition(ad, uzanti) {
  const { ascii, utf8 } = dosyaAdiUret(ad, uzanti);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(utf8)}`;
}

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

async function mevzuatGovAramaHandler(req, res) {
  try {
    const { url, resmiGazeteSayisi } = req.body;
    return basarili(res, await service.mevzuatGovArama({ url, resmiGazeteSayisi }));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function ekleHandler(req, res) {
  try {
    const govde = {
      ...req.body,
      etiketler: req.body.etiketler ? JSON.parse(req.body.etiketler) : [],
      aday: req.body.aday ? JSON.parse(req.body.aday) : undefined,
    };
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

async function wordDisaAktarHandler(req, res) {
  try {
    const kayit = await service.getir(req.params.id);
    const buffer = await mevzuatWordOlustur(kayit);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', mevzuatContentDisposition(kayit.ad, 'docx'));
    res.send(buffer);
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function pdfDisaAktarHandler(req, res) {
  try {
    const kayit = await service.getir(req.params.id);
    const buffer = await mevzuatPdfOlustur(kayit);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', mevzuatContentDisposition(kayit.ad, 'pdf'));
    res.send(buffer);
  } catch (err) {
    return basarisiz(res, err.message);
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
  listeHandler, getirHandler, mevzuatGovAramaHandler, ekleHandler, guncelleHandler, silHandler,
  pdfGetirHandler, wordDisaAktarHandler, pdfDisaAktarHandler,
  manuelYenileHandler, guncellemeyiOnaylaHandler, istatistikHandler,
};
