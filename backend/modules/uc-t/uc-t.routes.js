/**
 * uc-t.routes.js
 */

const express = require('express');
const controller = require('./uc-t.controller');

const router = express.Router();

router.get('/ek4ab-adaylari', controller.ek4abAdaylariHandler);
router.get('/bbhb-adaylari', controller.bbhbAdaylariHandler);
router.get('/cks-adaylari', controller.cksAdaylariHandler);
router.get('/', controller.listeHandler);
router.post('/', controller.olusturHandler);
router.get('/:id', controller.getirHandler);
router.delete('/:id', controller.silHandler);
router.put('/:id/adim', controller.adimGuncelleHandler);
router.put('/:id/ek4ab-sec', controller.ek4abSecHandler);
router.put('/:id/ek4a-veri-cek', controller.ek4aVeriCekHandler);
router.put('/:id/ek4b-veri-cek', controller.ek4bVeriCekHandler);
router.put('/:id/birlestir', controller.birlestirVeDevamEtHandler);

module.exports = router;
