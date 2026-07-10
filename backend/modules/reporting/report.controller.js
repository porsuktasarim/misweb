/**
 * report.controller.js
 */

const { raporUret } = require('./report.builder');
const bbhbService = require('../bbhb/bbhb.service');
const ekgbService = require('../ekgb/ekgb.service');
const cksService = require('../cks/cks.service');
const { contractToEkgbExcel } = require('./exporters/ekgb.excel.exporter');
const { contractToEkgbWord } = require('./exporters/ekgb.word.exporter');
const { contractToEkgbPdf } = require('./exporters/ekgb.pdf.exporter');
const { contractToCksExcel } = require('./exporters/cks.excel.exporter');
const { contractToCksWord } = require('./exporters/cks.word.exporter');
const { contractToCksPdf } = require('./exporters/cks.pdf.exporter');
const lang = require('../../../config/lang/tr');

const ICERIK_TIPLERI = {
  excel: {
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uzanti: 'xlsx',
  },
  word: {
    contentType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uzanti: 'docx',
  },
  pdf: { contentType: 'application/pdf', uzanti: 'pdf' },
};

const EKGB_URETICILER = {
  excel: contractToEkgbExcel,
  word: contractToEkgbWord,
  pdf: contractToEkgbPdf,
};

const CKS_URETICILER = {
  excel: contractToCksExcel,
  word: contractToCksWord,
  pdf: contractToCksPdf,
};

async function bbhbRaporHandler(req, res) {
  try {
    const { id, format } = req.params;
    const bbhbSonuc = await bbhbService.sonucuGetir(id);
    const buffer = await raporUret('bbhb', bbhbSonuc, format);

    const bilgi = ICERIK_TIPLERI[format];
    if (!bilgi) {
      return res
        .status(400)
        .json({ success: false, data: null, message: 'Gecersiz format' });
    }

    res.setHeader('Content-Type', bilgi.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${lang.bbhb.kisaAd}-${id}.${bilgi.uzanti}"`
    );
    return res.send(buffer);
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, data: null, message: err.message || lang.ortak.hataOlustu });
  }
}

async function ekgbRaporHandler(req, res) {
  try {
    const { id, format } = req.params;
    const ekgbSonuc = await ekgbService.sonucuGetir(id);
    const uretici = EKGB_URETICILER[format];
    const bilgi = ICERIK_TIPLERI[format];
    if (!uretici || !bilgi) {
      return res.status(400).json({ success: false, data: null, message: 'Gecersiz format' });
    }
    const buffer = await uretici(ekgbSonuc);

    res.setHeader('Content-Type', bilgi.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="EKGB-${id}.${bilgi.uzanti}"`);
    return res.send(buffer);
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, data: null, message: err.message || lang.ortak.hataOlustu });
  }
}

async function cksRaporHandler(req, res) {
  try {
    const { id, format } = req.params;
    const cksSonuc = await cksService.sonucuGetir(id);
    const uretici = CKS_URETICILER[format];
    const bilgi = ICERIK_TIPLERI[format];
    if (!uretici || !bilgi) {
      return res.status(400).json({ success: false, data: null, message: 'Gecersiz format' });
    }
    const buffer = await uretici(cksSonuc);

    res.setHeader('Content-Type', bilgi.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="CKS-${id}.${bilgi.uzanti}"`);
    return res.send(buffer);
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, data: null, message: err.message || lang.ortak.hataOlustu });
  }
}

module.exports = { bbhbRaporHandler, ekgbRaporHandler, cksRaporHandler };
