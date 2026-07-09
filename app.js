/**
 * app.js - Uygulama giris noktasi
 */

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const bbhbRoutes = require('./backend/modules/bbhb/bbhb.routes');
const reportRoutes = require('./backend/modules/reporting/report.routes');
const sistemRoutes = require('./backend/modules/sistem/sistem.routes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/public')));

app.use('/api/bbhb', bbhbRoutes);
app.use('/api/raporlar', reportRoutes);
app.use('/api/sistem', sistemRoutes);

const PORT = process.env.PORT || 4342;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mis';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`MİS ${PORT} portunda çalışıyor`));
  })
  .catch((err) => {
    console.error('MongoDB bağlantı hatası:', err.message);
    process.exit(1);
  });

module.exports = app;
