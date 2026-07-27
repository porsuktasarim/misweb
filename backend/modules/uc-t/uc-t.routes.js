/**
 * uc-t.routes.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('./uc-t.controller');

const router = express.Router();

// ONEMLI: Dockerfile SADECE uploads/turkvet'i garanti ediyor - bu
// klasor yoksa multer diskStorage HATA verir (otomatik olusturmaz).
fs.mkdirSync('uploads/uc-t/', { recursive: true });

const storage = multer.diskStorage({
  destination: 'uploads/uc-t/',
  filename: (req, file, cb) => {
    const uzanti = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${uzanti}`);
  },
});
const pdfFiltresi = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') return cb(new Error('Sadece PDF dosyası yüklenebilir.'));
  cb(null, true);
};
const upload = multer({ storage, fileFilter: pdfFiltresi, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/ek4ab-adaylari', controller.ek4abAdaylariHandler);
router.get('/bbhb-adaylari', controller.bbhbAdaylariHandler);
router.get('/cks-adaylari', controller.cksAdaylariHandler);
router.get('/komisyon-adaylari', controller.komisyonAdaylariHandler);
router.get('/', controller.listeHandler);
router.post('/', controller.olusturHandler);
router.get('/:id', controller.getirHandler);
router.delete('/:id', controller.silHandler);
router.put('/:id/adim', controller.adimGuncelleHandler);
router.put('/:id/adim-veri', controller.adimVeriKaydetHandler);
router.put('/:id/ek4ab-sec', controller.ek4abSecHandler);
router.put('/:id/ek4a-veri-cek', controller.ek4aVeriCekHandler);
router.put('/:id/ek4b-veri-cek', controller.ek4bVeriCekHandler);
router.put('/:id/birlestir', controller.birlestirVeDevamEtHandler);
router.put('/:id/karar1-kaydet', upload.single('pdf'), controller.karar1KaydetHandler);
router.get('/:id/adim-pdf/:anaAdimIndex/:altAdimIndex', controller.adimPdfGetirHandler);
router.get('/:id/adim-disa-aktar/:anaAdimIndex/:altAdimIndex/:format', controller.adimDisaAktarHandler);

module.exports = router;
