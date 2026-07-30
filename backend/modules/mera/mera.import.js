/**
 * mera.import.js
 *
 * Mera parsellerini toplu yuklemek icin dosya okuyucu (.xlsx/.xls/.csv).
 * Basliklar Turkce-duyarli, ESNEK eslestirilir (buyuk/kucuk harf, Turkce
 * karakter farki onemli degil) - teknikEkip.import.js ile AYNI desen.
 *
 * Eslesen (il+ilce+koyMahalle+adaNo+parselNo) bir kayit VARSA
 * GUNCELLENIR, YOKSA YENI olusturulur (UPSERT) - boylece ayni sablon
 * TEKRAR yuklenirse KAYIT COGALTMAZ, sadece GUNCELLER.
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs/promises');
const { ARAZI_NITELIKLERI, ARAZI_KAYNAKLARI, TOPRAK_SINIFLARI } = require('./mera.model');

const BASLIK_ANAHTARLARI = {
  il: ['il'],
  ilce: ['ilçe', 'ilce'],
  koyMahalle: ['köy/mahalle', 'koy/mahalle', 'köy-mahalle', 'mahalle/köy', 'mahalle', 'köy', 'koy'],
  adaNo: ['ada no', 'ada'],
  parselNo: ['parsel no', 'parsel'],
  meraAlaniM2: ['mera alanı (m²)', 'mera alani (m2)', 'mera alanı m2', 'mera alani m2'],
  tapuAlaniM2: ['tapu alanı (m²)', 'tapu alani (m2)', 'tapu alanı m2', 'tapu alani m2'],
  araziNiteligi: ['arazi niteliği', 'arazi niteligi'],
  araziDurumSinifi: ['arazi durum sınıfı', 'arazi durum sinifi'],
  araziKaynagi: ['arazi kaynağı', 'arazi kaynagi'],
  tespitYapildiMi: ['tespit yapıldı mı', 'tespit yapildi mi', 'tespit'],
  tespitTarihi: ['tespit tarihi'],
  tahditYapildiMi: ['tahdit yapıldı mı', 'tahdit yapildi mi', 'tahdit'],
  tahditTarihi: ['tahdit tarihi'],
  tahsisYapildiMi: ['tahsis yapıldı mı', 'tahsis yapildi mi', 'tahsis'],
  tahsisTarihi: ['tahsis tarihi'],
  islahDurumu: ['islah durumu'],
  egimi: ['eğimi', 'egimi'],
  topraksinifi: ['toprak sınıfı', 'toprak sinifi'],
  tapuKimlikNo: ['tapu kimlik no'],
};

const EVET_DEGERLERI = ['evet', 'e', 'yes', 'true', '1', 'x'];

function normalizeTr(s) {
  return String(s || '').trim().toLocaleLowerCase('tr-TR');
}

function basliklariEslestir(hamBaslikSatiri) {
  const normalize = hamBaslikSatiri.map((v) => normalizeTr(v));
  const eslesme = {};
  for (const [anahtar, adaylar] of Object.entries(BASLIK_ANAHTARLARI)) {
    eslesme[anahtar] = normalize.findIndex((baslik) => adaylar.includes(baslik));
  }
  if (eslesme.il === -1 || eslesme.ilce === -1 || eslesme.koyMahalle === -1) {
    throw new Error('Şablonda "İl", "İlçe" ve "Köy/Mahalle" sütunları zorunludur');
  }
  return eslesme;
}

function enumDogrula(deger, izinliListe, alanAdi, satirNo) {
  if (!deger) return undefined;
  const eslesen = izinliListe.find((v) => normalizeTr(v) === normalizeTr(deger));
  if (!eslesen) throw new Error(`Satır ${satirNo}: "${alanAdi}" için geçersiz değer "${deger}" - izinli değerler: ${izinliListe.join(', ')}`);
  return eslesen;
}

/** Turkce GUN.AY.YIL formatini (orn "01.03.2026" = 1 Mart) DOGRU ayristirir - new Date() bunu ABD (AY.GUN.YIL) sanip YANLIS parse ediyordu. */
function tarihAyristir(deger) {
  if (!deger) return undefined;
  const metin = String(deger).trim();
  const turkceEslesme = metin.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (turkceEslesme) {
    const [, gun, ay, yil] = turkceEslesme;
    const d = new Date(Number(yil), Number(ay) - 1, Number(gun));
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  const d = new Date(metin);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function satirdanParselOlustur(satir, eslesme, satirNo) {
  const deger = (anahtar) => (eslesme[anahtar] >= 0 ? String(satir[eslesme[anahtar]] ?? '').trim() : '');

  const il = deger('il');
  const ilce = deger('ilce');
  const koyMahalle = deger('koyMahalle');
  if (!il || !ilce || !koyMahalle) return null;

  const sayiAyristir = (v) => (v ? Number(String(v).replace(',', '.')) : undefined);

  return {
    il, ilce, koyMahalle,
    adaNo: deger('adaNo'),
    parselNo: deger('parselNo'),
    meraAlaniM2: sayiAyristir(deger('meraAlaniM2')),
    tapuAlaniM2: sayiAyristir(deger('tapuAlaniM2')),
    araziNiteligi: enumDogrula(deger('araziNiteligi'), ARAZI_NITELIKLERI, 'Arazi Niteliği', satirNo),
    araziDurumSinifi: deger('araziDurumSinifi'),
    araziKaynagi: enumDogrula(deger('araziKaynagi'), ARAZI_KAYNAKLARI, 'Arazi Kaynağı', satirNo),
    tespitYapildiMi: EVET_DEGERLERI.includes(normalizeTr(deger('tespitYapildiMi'))),
    tespitTarihi: tarihAyristir(deger('tespitTarihi')),
    tahditYapildiMi: EVET_DEGERLERI.includes(normalizeTr(deger('tahditYapildiMi'))),
    tahditTarihi: tarihAyristir(deger('tahditTarihi')),
    tahsisYapildiMi: EVET_DEGERLERI.includes(normalizeTr(deger('tahsisYapildiMi'))),
    tahsisTarihi: tarihAyristir(deger('tahsisTarihi')),
    islahDurumu: deger('islahDurumu'),
    egimi: deger('egimi'),
    topraksinifi: enumDogrula(deger('topraksinifi'), TOPRAK_SINIFLARI, 'Toprak Sınıfı', satirNo),
    tapuKimlikNo: deger('tapuKimlikNo'),
  };
}

/** @returns {Promise<Array>} parsel verisi dizisi (validasyon HATASI olursa fonksiyon THROW eder) */
async function dosyaOku(dosyaYolu) {
  const uzanti = path.extname(dosyaYolu).toLowerCase();

  let workbook;
  if (uzanti === '.csv') {
    const metin = await fs.readFile(dosyaYolu, 'utf-8');
    workbook = XLSX.read(metin, { type: 'string' });
  } else {
    workbook = XLSX.readFile(dosyaYolu);
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const satirlar = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  if (satirlar.length < 2) return [];

  const eslesme = basliklariEslestir(satirlar[0]);
  const parseller = [];
  for (let i = 1; i < satirlar.length; i++) {
    const parsel = satirdanParselOlustur(satirlar[i], eslesme, i + 1);
    if (parsel) parseller.push(parsel);
  }
  return parseller;
}

module.exports = { dosyaOku };
