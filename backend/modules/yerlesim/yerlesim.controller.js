/**
 * yerlesim.controller.js
 */

const service = require('./yerlesim.service');

function basarili(res, data, mesaj = null) {
  return res.json({ success: true, data, message: mesaj });
}
function basarisiz(res, mesaj, kod = 400) {
  return res.status(kod).json({ success: false, data: null, message: mesaj });
}

async function illerHandler(req, res) {
  try {
    return basarili(res, await service.illeriGetir());
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function ilcelerHandler(req, res) {
  try {
    return basarili(res, await service.ilceleriGetir(req.params.il));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function mahallelerHandler(req, res) {
  try {
    return basarili(res, await service.mahalleleriGetir(req.params.il, req.params.ilce));
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function ekleHandler(req, res) {
  try {
    const { il, ilce, mahalle } = req.body;
    if (!il || !ilce || !mahalle) {
      return basarisiz(res, 'İl, ilçe ve mahalle/köy adı zorunludur');
    }
    const kayit = await service.ekle({ il, ilce, mahalle });
    return basarili(res, kayit, 'Eklendi');
  } catch (err) {
    if (err.code === 11000) return basarisiz(res, 'Bu il/ilçe/mahalle zaten kayıtlı');
    return basarisiz(res, err.message);
  }
}

async function guncelleHandler(req, res) {
  try {
    const { il, ilce, mahalle } = req.body;
    const kayit = await service.guncelle(req.params.id, { il, ilce, mahalle });
    return basarili(res, kayit, 'Güncellendi');
  } catch (err) {
    return basarisiz(res, err.message, 404);
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

async function yenidenIceAktarHandler(req, res) {
  try {
    const sonuc = await service.yenidenIceAktar();
    return basarili(res, sonuc, 'Resmi liste yeniden içe aktarıldı');
  } catch (err) {
    return basarisiz(res, err.message);
  }
}

async function ilGuncelleHandler(req, res) {
  try {
    const { yeniIl } = req.body;
    if (!yeniIl || !yeniIl.trim()) return basarisiz(res, 'Yeni il adı zorunludur');
    await service.ilGuncelle(req.params.il, yeniIl);
    return basarili(res, null, 'İl güncellendi');
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

async function ilSilHandler(req, res) {
  try {
    await service.ilSil(req.params.il);
    return basarili(res, null, 'İl ve altındaki tüm ilçe/köy-mahalleler silindi');
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

async function ilceGuncelleHandler(req, res) {
  try {
    const { yeniIlce } = req.body;
    if (!yeniIlce || !yeniIlce.trim()) return basarisiz(res, 'Yeni ilçe adı zorunludur');
    await service.ilceGuncelle(req.params.il, req.params.ilce, yeniIlce);
    return basarili(res, null, 'İlçe güncellendi');
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

async function ilceSilHandler(req, res) {
  try {
    await service.ilceSil(req.params.il, req.params.ilce);
    return basarili(res, null, 'İlçe ve altındaki tüm köy-mahalleler silindi');
  } catch (err) {
    return basarisiz(res, err.message, 404);
  }
}

module.exports = {
  illerHandler,
  ilcelerHandler,
  mahallelerHandler,
  ekleHandler,
  guncelleHandler,
  silHandler,
  yenidenIceAktarHandler,
  ilGuncelleHandler,
  ilSilHandler,
  ilceGuncelleHandler,
  ilceSilHandler,
};
