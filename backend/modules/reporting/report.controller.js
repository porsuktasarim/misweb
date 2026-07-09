/**
 * report.controller.js
 */

const { raporUret } = require('./report.builder');
const bbhbService = require('../bbhb/bbhb.service');
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

module.exports = { bbhbRaporHandler };
