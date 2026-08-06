/**
 * uc-t.controller.js
 */

const fs = require('fs');
const service = require('./uc-t.service');
const exportService = require('./uc-t.export');

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

async function ek3aHayvanVarligiCekHandler(req, res) {
  try {
    const { anaAdimIndex, altAdimIndex, bbhbSonucId } = req.body;
    return basarili(res, await service.ek3aHayvanVarligiCek(req.params.id, anaAdimIndex, altAdimIndex, { bbhbSonucId }), 'Hayvan varlığı verisi çekildi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function ek3aAraziVerileriKaydetHandler(req, res) {
  try {
    const { anaAdimIndex, altAdimIndex, parselIdleri } = req.body;
    return basarili(res, await service.ek3aAraziVerileriKaydet(req.params.id, anaAdimIndex, altAdimIndex, { parselIdleri }), 'Arazi verileri Mera Modülü\'nden hesaplanarak eklendi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function madde10KimlikPdfHandler(req, res) {
  try {
    const { anaAdimIndex, altAdimIndex } = req.query;
    const buffer = await service.madde10KimlikPdfIndir(req.params.id, anaAdimIndex, altAdimIndex);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="mera-kimlikleri.pdf"');
    return res.send(buffer);
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

async function adimVeriKaydetHandler(req, res) {
  try {
    const { anaAdimIndex, altAdimIndex, veri } = req.body;
    return basarili(res, await service.adimVeriKaydet(req.params.id, anaAdimIndex, altAdimIndex, veri), 'Kaydedildi');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function adimDosyaYukleHandler(req, res) {
  try {
    const { anaAdimIndex, altAdimIndex, dosyaAdi } = req.body;
    return basarili(res, await service.adimDosyaYukle(req.params.id, anaAdimIndex, altAdimIndex, dosyaAdi, req.file), 'Dosya yüklendi');
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
    const { anaAdimIndex, altAdimIndex, kararTarihi, kararSayisi, komisyonId } = req.body;
    const katilimcilar = req.body.katilimcilar ? JSON.parse(req.body.katilimcilar) : [];
    const baskanlik = req.body.baskanlik ? JSON.parse(req.body.baskanlik) : null;
    return basarili(
      res,
      await service.karar1Kaydet(req.params.id, anaAdimIndex, altAdimIndex, { kararTarihi, kararSayisi, komisyonId, baskanlik, katilimcilar }, req.file),
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

async function adimDisaAktarHandler(req, res) {
  try {
    const { anaAdimIndex, altAdimIndex, format } = req.params;
    const kayit = await service.getir(req.params.id);
    const alt = kayit.surec[anaAdimIndex]?.altAdimlar[altAdimIndex];
    if (!alt) return basarisiz(res, 'Adım bulunamadı', 404);

    const veri = await exportService.adimDisaAktarVerisi(kayit, alt);
    const dosyaAdiTemel = `${kayit.koyMahalle}_${alt.ekKodu || alt.ad}`.replace(/[^a-zA-Z0-9ıİğĞüÜşŞöÖçÇ_-]/g, '_');

    if (format === 'word') {
      const buffer = await exportService.adimBelgesiWordOlustur(veri);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${dosyaAdiTemel}.docx"`);
      return res.send(buffer);
    }
    if (format === 'pdf') {
      const buffer = await exportService.adimBelgesiPdfOlustur(veri);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${dosyaAdiTemel}.pdf"`);
      return res.send(buffer);
    }
    return basarisiz(res, 'Geçersiz format');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

module.exports = {
  listeHandler, getirHandler, olusturHandler, silHandler,
  adimGuncelleHandler, ek4abSecHandler, ek4abAdaylariHandler,
  bbhbAdaylariHandler, cksAdaylariHandler, ek4aVeriCekHandler, ek4bVeriCekHandler, ek3aHayvanVarligiCekHandler, ek3aAraziVerileriKaydetHandler, madde10KimlikPdfHandler, birlestirVeDevamEtHandler,
  komisyonAdaylariHandler, karar1KaydetHandler, adimPdfGetirHandler, adimVeriKaydetHandler, adimDisaAktarHandler, adimDosyaYukleHandler,
};
