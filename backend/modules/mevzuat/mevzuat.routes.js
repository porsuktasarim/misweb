/**
 * mevzuat.routes.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const controller = require('./mevzuat.controller');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/mevzuat/',
  filename: (req, file, cb) => {
    const uzanti = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${uzanti}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/istatistik', controller.istatistikHandler);
router.get('/', controller.listeHandler);
router.post('/', upload.single('pdf'), controller.ekleHandler);
router.get('/:id', controller.getirHandler);
router.put('/:id', controller.guncelleHandler);
router.delete('/:id', controller.silHandler);
router.get('/:id/pdf', controller.pdfGetirHandler);
router.post('/:id/yenile', controller.manuelYenileHandler);
router.post('/:id/onayla', controller.guncellemeyiOnaylaHandler);

module.exports = router;
