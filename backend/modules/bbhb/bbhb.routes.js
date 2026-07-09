/**
 * bbhb.routes.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const controller = require('./bbhb.controller');

const router = express.Router();

// ONEMLI: multer'in varsayilan { dest: '...' } ayari dosyayi UZANTISIZ
// kaydeder. bbhb.import.js dosya tipini (xlsx/csv) uzantidan anladigi
// icin orijinal uzanti mutlaka korunmali.
const storage = multer.diskStorage({
  destination: 'uploads/turkvet/',
  filename: (req, file, cb) => {
    const uzanti = path.extname(file.originalname);
    const benzersizAd = `${Date.now()}-${Math.round(Math.random() * 1e9)}${uzanti}`;
    cb(null, benzersizAd);
  },
});
const upload = multer({ storage });

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

// Manuel giris formu icin: grup/kategori/yas kurali/katsayi listesi
// ONEMLI: bu route /:id'den ONCE tanimlanmali, yoksa Express "kategoriler"i
// bir ID sanip getirHandler'a yonlendirir.
router.get('/kategoriler', controller.kategorilerHandler);

// Kayitli tum sonuclarin listesi ("Kayıtlı Sonuçlar" sekmesi icin)
router.get('/', controller.listeHandler);

// Bir kaydi kalici olarak sil
router.delete('/:id', controller.silHandler);

// Gecmis bir sonucu getir (tahsis modulu / raporlama icin de kullanilabilir)
router.get('/:id', controller.getirHandler);

module.exports = router;
