/**
 * report.routes.js
 */

const express = require('express');
const controller = require('./report.controller');

const router = express.Router();

// GET /api/raporlar/bbhb/:id/excel|word|pdf
router.get('/bbhb/:id/:format', controller.bbhbRaporHandler);

// GET /api/raporlar/ekgb/:id/excel|word|pdf
router.get('/ekgb/:id/:format', controller.ekgbRaporHandler);

// GET /api/raporlar/cks/:id/excel|word|pdf
router.get('/cks/:id/:format', controller.cksRaporHandler);

// GET /api/raporlar/ek4ab/:id/excel (şimdilik sadece Excel)
router.get('/ek4ab/:id/:format', controller.ek4abRaporHandler);

module.exports = router;
