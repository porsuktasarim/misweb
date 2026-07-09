/**
 * sistem.routes.js
 *
 * Sisteme dair genel bilgiler (versiyon vb.) - footer gibi ortak
 * arayuz parcalari icin kullanilir.
 */

const express = require('express');
const packageJson = require('../../../package.json');
const lang = require('../../../config/lang/tr');

const router = express.Router();

router.get('/versiyon', (req, res) => {
  res.json({
    success: true,
    data: {
      ad: lang.uygulama.ad,
      versiyon: packageJson.version,
    },
    message: null,
  });
});

module.exports = router;
