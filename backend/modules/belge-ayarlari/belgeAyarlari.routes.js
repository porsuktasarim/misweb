/**
 * belgeAyarlari.routes.js
 */

const express = require('express');
const controller = require('./belgeAyarlari.controller');

const router = express.Router();

router.get('/', controller.getirHandler);
router.put('/', controller.guncelleHandler);

module.exports = router;
