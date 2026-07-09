/**
 * app.js - Uygulama giris noktasi
 */

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const bbhbRoutes = require('./backend/modules/bbhb/bbhb.routes');
const reportRoutes = require('./backend/modules/reporting/report.routes');
const sistemRoutes = require('./backend/modules/sistem/sistem.routes');
const yerlesimRoutes = require('./backend/modules/yerlesim/yerlesim.routes');
const yerlesimService = require('./backend/modules/yerlesim/yerlesim.service');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/public')));

app.use('/api/bbhb', bbhbRoutes);
app.use('/api/raporlar', reportRoutes);
app.use('/api/sistem', sistemRoutes);
app.use('/api/yerlesim', yerlesimRoutes);

const PORT = process.env.PORT || 4342;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mis';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    // Il/ilce/mahalle koleksiyonu bossa (ilk calistirma), bundled JSON'dan
    // otomatik yukle - kullanicinin elle bir seed komutu calistirmasina
    // gerek kalmaz.
    try {
      const sonuc = await yerlesimService.gerekirseIlkYuklemeYap();
      if (sonuc.yapildi) {
        console.log(`Yerleşim verisi ilk kez yüklendi: ${sonuc.eklenen} kayıt`);
      }
    } catch (err) {
      console.error('Yerleşim verisi yüklenirken hata:', err.message);
    }

    app.listen(PORT, () => console.log(`MİS ${PORT} portunda çalışıyor`));
  })
  .catch((err) => {
    console.error('MongoDB bağlantı hatası:', err.message);
    process.exit(1);
  });

module.exports = app;
