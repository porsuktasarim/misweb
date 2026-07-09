/**
 * report.builder.js
 *
 * Hangi modulden geldigine bakip dogru adapter'i secer, contract'i
 * uretir ve istenen formata gore dogru exporter'i cagirir.
 */

const { contractDogrula } = require('./report.contract');
const { bbhbToContract } = require('./adapters/bbhb.adapter');
const { contractToExcel } = require('./exporters/excel.exporter');
const { contractToWord } = require('./exporters/word.exporter');
const { contractToPdf } = require('./exporters/pdf.exporter');

const ADAPTER_ESLEME = {
  bbhb: bbhbToContract,
  // cks: cksToContract,  // CKS eklendiginde buraya eklenir
};

const EXPORTER_ESLEME = {
  excel: contractToExcel,
  word: contractToWord,
  pdf: contractToPdf,
};

/**
 * @param {string} modulAdi - 'bbhb' | 'cks'
 * @param {object} modulSonucu - ilgili modulun ham sonuc dokumani
 * @param {string} format - 'excel' | 'word' | 'pdf'
 * @returns {Promise<Buffer>}
 */
async function raporUret(modulAdi, modulSonucu, format) {
  const adapter = ADAPTER_ESLEME[modulAdi];
  if (!adapter) throw new Error(`Bilinmeyen modul: ${modulAdi}`);

  const exporter = EXPORTER_ESLEME[format];
  if (!exporter) throw new Error(`Bilinmeyen rapor formati: ${format}`);

  const contract = adapter(modulSonucu);
  contractDogrula(contract);

  return exporter(contract);
}

module.exports = { raporUret };
