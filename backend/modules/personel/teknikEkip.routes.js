/**
 * teknikEkip.routes.js
 */

const express = require('express');
const controller = require('./teknikEkip.controller');

const router = express.Router();

router.get('/kurumlar', controller.kurumlarHandler);
router.get('/', controller.listeHandler);
router.post('/', controller.olusturHandler);
router.get('/:id', controller.getirHandler);
router.put('/:id/uyeler', controller.uyeleriGuncelleHandler);
router.delete('/:id', controller.silHandler);

module.exports = router;
