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
const ekgbRoutes = require('./backend/modules/ekgb/ekgb.routes');
const ekgbDonemService = require('./backend/modules/ekgb/ekgb.donem.service');
const cksRoutes = require('./backend/modules/cks/cks.routes');
const ek4abRoutes = require('./backend/modules/ek4ab/ek4ab.routes');
const teknikEkipRoutes = require('./backend/modules/personel/teknikEkip.routes');
const mevzuatRoutes = require('./backend/modules/mevzuat/mevzuat.routes');
const mevzuatService = require('./backend/modules/mevzuat/mevzuat.service');
const cron = require('node-cron');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/public')));

app.use('/api/bbhb', bbhbRoutes);
app.use('/api/raporlar', reportRoutes);
app.use('/api/sistem', sistemRoutes);
app.use('/api/yerlesim', yerlesimRoutes);
app.use('/api/ekgb', ekgbRoutes);
app.use('/api/cks', cksRoutes);
app.use('/api/ek4ab', ek4abRoutes);
app.use('/api/teknik-ekip', teknikEkipRoutes);
app.use('/api/mevzuat', mevzuatRoutes);

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

    try {
      const sonuc = await ekgbDonemService.gerekirseIlkDonemiYukle();
      if (sonuc.yapildi) {
        console.log('EKGB 2026 birim fiyat dönemi ilk kez yüklendi');
      }
    } catch (err) {
      console.error('EKGB dönemi yüklenirken hata:', err.message);
    }

    // Mevzuat haftalik kontrol - her PAZARTESI saat 04:00 (Europe/Istanbul)
    cron.schedule('0 4 * * 1', () => {
      mevzuatService.haftalikKontrol().catch((err) => {
        console.error('[Mevzuat] Haftalık kontrol hatası:', err.message);
      });
    }, { timezone: 'Europe/Istanbul' });
    console.log('[Cron] Mevzuat haftalık kontrol zamanlandı (her Pazartesi 04:00)');

    app.listen(PORT, () => console.log(`MİS ${PORT} portunda çalışıyor`));
  })
  .catch((err) => {
    console.error('MongoDB bağlantı hatası:', err.message);
    process.exit(1);
  });

module.exports = app;
