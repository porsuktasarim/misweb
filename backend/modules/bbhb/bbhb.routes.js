/**
 * bbhb.routes.js
 */

const express = require('express');
const multer = require('multer');
const controller = require('./bbhb.controller');

const router = express.Router();
const upload = multer({ dest: 'uploads/turkvet/' });

// Manuel giris ile hesapla (kaydetmeden - kullanici sonucu gorur, sonra kaydet cagirir)
router.post('/manuel/hesapla', controller.manuelHesaplaHandler);

// Turkvet dosyalarini yukle, onizleme sonucu don (kaydetmeden)
router.post(
  '/turkvet/onizleme',
  upload.array('dosyalar'),
  controller.turkvetOnizlemeHandler
);

// Onizlemeyi onayla, kalici kayit olustur
router.post('/kaydet', controller.kaydetHandler);

// Gecmis bir sonucu getir (tahsis modulu / raporlama icin de kullanilabilir)
router.get('/:id', controller.getirHandler);

module.exports = router;
