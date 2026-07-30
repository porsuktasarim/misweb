/**
 * mera.routes.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('./mera.controller');

const router = express.Router();

fs.mkdirSync('uploads/mera/', { recursive: true });

const storage = multer.diskStorage({
  destination: 'uploads/mera/',
  filename: (req, file, cb) => {
    const uzanti = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${uzanti}`);
  },
});
// Not'a eklenecek BELGE herhangi bir turde olabilir (PDF, fotograf,
// vb.) - bu yuzden PDF filtresi UYGULANMAZ, sadece boyut sinirlanir.
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/sabitler', controller.sabitlerHandler);
router.get('/', controller.listeHandler);
router.post('/', controller.olusturHandler);
router.get('/:id', controller.getirHandler);
router.put('/:id', controller.guncelleHandler);
router.delete('/:id', controller.silHandler);
router.post('/:id/notlar', controller.notEkleHandler);
router.put('/:id/notlar/:notIndex', controller.notDuzenleHandler);
router.post('/:id/notlar/:notIndex/dosya', upload.single('dosya'), controller.notDosyaEkleHandler);

module.exports = router;
