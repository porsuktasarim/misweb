/**
 * teknikEkip.routes.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const controller = require('./teknikEkip.controller');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/teknik-ekip/',
  filename: (req, file, cb) => {
    const uzanti = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${uzanti}`);
  },
});
const upload = multer({ storage });

router.get('/kurumlar', controller.kurumlarHandler);
router.get('/', controller.listeHandler);
router.post('/', controller.olusturHandler);
router.get('/:id', controller.getirHandler);
router.put('/:id/uyeler', controller.uyeleriGuncelleHandler);
router.post('/:id/uyeler/toplu-yukle', upload.single('dosya'), controller.topluYukleHandler);
router.delete('/:id', controller.silHandler);

module.exports = router;
