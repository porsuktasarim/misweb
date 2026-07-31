/**
 * meraVerimAyarlari.routes.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('./meraVerimAyarlari.controller');

const router = express.Router();

fs.mkdirSync('uploads/mera-verim/', { recursive: true });
const storage = multer.diskStorage({
  destination: 'uploads/mera-verim/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const tabloFiltresi = (req, file, cb) => {
  if (!['.xlsx', '.xls', '.csv'].includes(path.extname(file.originalname).toLowerCase())) return cb(new Error('Sadece .xlsx, .xls veya .csv dosyası yüklenebilir.'));
  cb(null, true);
};
const upload = multer({ storage, fileFilter: tabloFiltresi, limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/', controller.getirHandler);
router.put('/', controller.guncelleHandler);
router.get('/hesapla', controller.hesaplaHandler);
router.get('/:tabloAdi/sablon-indir', controller.sablonIndirHandler);
router.post('/:tabloAdi/versiyon', controller.tabloVersiyonEkleHandler);
router.put('/:tabloAdi/aktif-versiyon', controller.tabloAktifVersiyonSecHandler);
router.post('/:tabloAdi/excel-yukle', upload.single('dosya'), controller.tabloExcelYukleHandler);

module.exports = router;
