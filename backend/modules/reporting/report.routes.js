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

module.exports = router;
