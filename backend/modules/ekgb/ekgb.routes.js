/**
 * ekgb.routes.js
 */

const express = require('express');
const controller = require('./ekgb.controller');

const router = express.Router();

// Kalem tanimlari (sabit yapisal veri - donem fiyat formu bunu kullanir)
router.get('/kalemler', controller.kalemlerHandler);

// Birim fiyat donemleri - EKLE/DUZENLE var, SIL YOK (bilinclii)
router.get('/donemler', controller.donemlerHandler);
router.get('/donemler/:id', controller.donemGetirHandler);
router.post('/donemler', controller.donemEkleHandler);
router.put('/donemler/:id', controller.donemGuncelleHandler);

// Hesaplama + kayitli sonuclar
router.post('/onizleme', controller.onizlemeHandler);
router.post('/kaydet', controller.kaydetHandler);
router.get('/', controller.listeHandler);
router.delete('/:id', controller.silHandler);
router.get('/:id', controller.getirHandler);

module.exports = router;
