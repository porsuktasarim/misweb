/**
 * ek4ab.routes.js
 */

const express = require('express');
const controller = require('./ek4ab.controller');

const router = express.Router();

router.post('/onizleme', controller.onizlemeHandler);
router.post('/kaydet', controller.kaydetHandler);
router.get('/', controller.listeHandler);
router.delete('/:id', controller.silHandler);
router.get('/:id', controller.getirHandler);

module.exports = router;
