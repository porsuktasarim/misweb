/**
 * yerlesim.routes.js
 */

const express = require('express');
const controller = require('./yerlesim.controller');

const router = express.Router();

router.get('/iller', controller.illerHandler);
router.get('/ilceler/:il', controller.ilcelerHandler);
router.get('/mahalleler/:il/:ilce', controller.mahallelerHandler);
router.post('/', controller.ekleHandler);
router.put('/:id', controller.guncelleHandler);
router.delete('/:id', controller.silHandler);
router.post('/yeniden-ice-aktar', controller.yenidenIceAktarHandler);

// Il/ilce seviyesinde duzenleme ve kademeli silme
router.put('/il/:il', controller.ilGuncelleHandler);
router.delete('/il/:il', controller.ilSilHandler);
router.put('/ilce/:il/:ilce', controller.ilceGuncelleHandler);
router.delete('/ilce/:il/:ilce', controller.ilceSilHandler);

module.exports = router;
