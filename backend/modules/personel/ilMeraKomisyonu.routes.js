/**
 * ilMeraKomisyonu.routes.js
 */

const express = require('express');
const controller = require('./ilMeraKomisyonu.controller');

const router = express.Router();

router.get('/il-listesi', controller.ilIcinListeHandler);
router.get('/', controller.listeHandler);
router.post('/', controller.olusturHandler);
router.get('/:id', controller.getirHandler);
router.put('/:id/uyeler', controller.uyeleriGuncelleHandler);
router.delete('/:id', controller.silHandler);

module.exports = router;
