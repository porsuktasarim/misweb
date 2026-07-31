/**
 * meraVerimAyarlari.import.js
 *
 * Mera Verim Ayarlari'ndaki 4 tablonun (Tablo-1/2/3: yagis kusagi x
 * durum sinifi verim degerleri; Iller: il->yagis kusagi eslesmesi)
 * HER BIRI icin GENEL bir Excel/CSV okuyucu - tabloTipi parametresine
 * gore dogru sema (yagisKusagi VEYA il) uygulanir.
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs/promises');

function normalizeTr(s) {
  return String(s || '').trim().toLocaleLowerCase('tr-TR');
}

const YAGIS_KUSAGI_BASLIKLARI = {
  bant: ['yağış (mm)', 'yagis (mm)', 'bant', 'yağış kuşağı', 'yagis kusagi'],
  cokIyi: ['çok iyi', 'cok iyi', 'ç.iyi'],
  iyi: ['iyi'],
  orta: ['orta'],
  zayif: ['zayıf', 'zayif'],
};

const IL_BASLIKLARI = {
  il: ['il', 'il adı', 'il adi'],
  bant: ['yağış kuşağı', 'yagis kusagi', 'bant', 'yağış (mm)', 'yagis (mm)'],
};

async function dosyaSatirlariniOku(dosyaYolu) {
  const uzanti = path.extname(dosyaYolu).toLowerCase();
  let workbook;
  if (uzanti === '.csv') {
    const metin = await fs.readFile(dosyaYolu, 'utf-8');
    workbook = XLSX.read(metin, { type: 'string' });
  } else {
    workbook = XLSX.readFile(dosyaYolu);
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
}

function basliklariEslestir(hamBaslikSatiri, baslikSozlugu) {
  const normalize = hamBaslikSatiri.map((v) => normalizeTr(v));
  const eslesme = {};
  for (const [anahtar, adaylar] of Object.entries(baslikSozlugu)) {
    eslesme[anahtar] = normalize.findIndex((baslik) => adaylar.includes(baslik));
  }
  return eslesme;
}

/** Tablo-1/2/3 icin: her satir {bant, cokIyi, iyi, orta, zayif}. */
async function yagisKusagiTablosuOku(dosyaYolu) {
  const satirlar = await dosyaSatirlariniOku(dosyaYolu);
  if (satirlar.length < 2) throw new Error('Dosyada veri satırı bulunamadı.');
  const eslesme = basliklariEslestir(satirlar[0], YAGIS_KUSAGI_BASLIKLARI);
  if (eslesme.bant === -1) throw new Error('Şablonda "Yağış (mm)" sütunu zorunludur.');

  const sonuc = [];
  for (let i = 1; i < satirlar.length; i++) {
    const satir = satirlar[i];
    const bant = String(satir[eslesme.bant] ?? '').trim();
    if (!bant) continue;
    const sayi = (idx) => (idx >= 0 ? Number(String(satir[idx] ?? '0').replace(',', '.')) || 0 : 0);
    sonuc.push({ bant, cokIyi: sayi(eslesme.cokIyi), iyi: sayi(eslesme.iyi), orta: sayi(eslesme.orta), zayif: sayi(eslesme.zayif) });
  }
  return sonuc;
}

/** Iller tablosu icin: her satir {il, bant}. */
async function illerTablosuOku(dosyaYolu) {
  const satirlar = await dosyaSatirlariniOku(dosyaYolu);
  if (satirlar.length < 2) throw new Error('Dosyada veri satırı bulunamadı.');
  const eslesme = basliklariEslestir(satirlar[0], IL_BASLIKLARI);
  if (eslesme.il === -1 || eslesme.bant === -1) throw new Error('Şablonda "İl" ve "Yağış Kuşağı" sütunları zorunludur.');

  const sonuc = [];
  for (let i = 1; i < satirlar.length; i++) {
    const satir = satirlar[i];
    const il = String(satir[eslesme.il] ?? '').trim();
    const bant = String(satir[eslesme.bant] ?? '').trim();
    if (!il || !bant) continue;
    sonuc.push({ il, bant });
  }
  return sonuc;
}

module.exports = { yagisKusagiTablosuOku, illerTablosuOku };
