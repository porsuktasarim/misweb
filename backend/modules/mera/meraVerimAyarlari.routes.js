/**
 * meraVerimAyarlari.routes.js
 */

const express = require('express');
const controller = require('./meraVerimAyarlari.controller');

const router = express.Router();

router.get('/', controller.getirHandler);
router.put('/', controller.guncelleHandler);
router.get('/hesapla', controller.hesaplaHandler);

module.exports = router;
