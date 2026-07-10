/**
 * cks.routes.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const controller = require('./cks.controller');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/cks/',
  filename: (req, file, cb) => {
    const uzanti = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${uzanti}`);
  },
});
const upload = multer({ storage });

router.post('/onizleme', upload.array('dosyalar'), controller.onizlemeHandler);
router.post('/kaydet', controller.kaydetHandler);
router.get('/', controller.listeHandler);
router.delete('/:id', controller.silHandler);
router.get('/:id', controller.getirHandler);

module.exports = router;
