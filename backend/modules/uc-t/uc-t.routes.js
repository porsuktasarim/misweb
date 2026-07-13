/**
 * uc-t.routes.js
 */

const express = require('express');
const controller = require('./uc-t.controller');

const router = express.Router();

router.get('/ek4ab-adaylari', controller.ek4abAdaylariHandler);
router.get('/', controller.listeHandler);
router.post('/', controller.olusturHandler);
router.get('/:id', controller.getirHandler);
router.delete('/:id', controller.silHandler);
router.put('/:id/evrak', controller.evrakGuncelleHandler);
router.put('/:id/ek4ab-sec', controller.ek4abSecHandler);

module.exports = router;
