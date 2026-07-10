/**
 * teknikEkip.import.js
 *
 * Teknik ekip uyelerini toplu yuklemek icin dosya okuyucu.
 * Desteklenen formatlar: .xlsx, .xls, .csv (xlsx paketiyle), .json.
 *
 * Beklenen sutunlar (Adi Soyadi + Unvani + Kurum ZORUNLU, digerleri
 * kuruma gore doldurulur):
 *   Adı Soyadı | Unvanı | Kurum | Ek Bilgi/Serbest Metin | İl | İlçe | Mahalle/Köy
 *
 * "Kurum" sutunu KURUM ADI olarak yazilir (orn. "Muhtarlık",
 * "İlçe Tarım ve Orman Müdürlüğü") - kod degil, okunakli isim.
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs/promises');
const { KURUMLAR } = require('./personel.kurumlar');

const BASLIK_ANAHTARLARI = {
  adSoyad: ['adı soyadı', 'adi soyadi', 'ad soyad'],
  unvan: ['unvanı', 'unvani', 'unvan'],
  kurum: ['kurum'],
  serbestMetin: ['ek bilgi/serbest metin', 'ek bilgi', 'serbest metin'],
  il: ['il'],
  ilce: ['ilçe', 'ilce'],
  mahalle: ['mahalle/köy', 'mahalle/koy', 'mahalle', 'köy', 'koy'],
};

function kurumAdindanKodBul(kurumAdi) {
  const normalize = String(kurumAdi || '').trim().toLocaleLowerCase('tr-TR');
  const kurum = KURUMLAR.find((k) => k.ad.toLocaleLowerCase('tr-TR') === normalize);
  if (!kurum) throw new Error(`Bilinmeyen kurum adı: "${kurumAdi}" - şablondaki kurum adlarından birini kullanın`);
  return kurum;
}

function basliklariEslestir(hamBaslikSatiri) {
  const normalize = hamBaslikSatiri.map((v) => String(v || '').trim().toLocaleLowerCase('tr-TR'));
  const eslesme = {};
  for (const [anahtar, adaylar] of Object.entries(BASLIK_ANAHTARLARI)) {
    const index = normalize.findIndex((baslik) => adaylar.includes(baslik));
    eslesme[anahtar] = index; // -1 olabilir (opsiyonel sutun)
  }
  if (eslesme.adSoyad === -1 || eslesme.unvan === -1 || eslesme.kurum === -1) {
    throw new Error('Şablonda "Adı Soyadı", "Unvanı" ve "Kurum" sütunları zorunludur');
  }
  return eslesme;
}

function satirdanUyeOlustur(satirVeya, eslesme) {
  const deger = (anahtar) => (eslesme[anahtar] >= 0 ? String(satirVeya[eslesme[anahtar]] || '').trim() : '');

  const adSoyad = deger('adSoyad');
  const unvan = deger('unvan');
  const kurumAdi = deger('kurum');
  if (!adSoyad || !kurumAdi) return null;

  const kurum = kurumAdindanKodBul(kurumAdi);
  const serbestMetin = deger('serbestMetin');
  const il = deger('il');
  const ilce = deger('ilce');
  const mahalle = deger('mahalle');

  const uye = { adSoyad, unvan, kurumKod: kurum.kod };

  if (kurum.elleGirisTipi === 'serbest') {
    uye.serbestMetin = serbestMetin;
  } else if (kurum.elleGirisTipi === 'koyMahalle') {
    if (il && ilce && mahalle) uye.secilenYer = { tip: 'mahalle', il, ilce, mahalle };
  } else if (kurum.elleGirisTipi === 'ilVeyaIlce') {
    if (il && ilce) uye.secilenYer = { tip: 'ilce', il, ilce };
    else if (il) uye.secilenYer = { tip: 'il', il };
  }

  return uye;
}

/** JSON formatinda: [{ adSoyad, unvan, kurum, serbestMetin, il, ilce, mahalle }, ...] beklenir */
function jsonDosyasindanOku(icerik) {
  const veri = JSON.parse(icerik);
  if (!Array.isArray(veri)) throw new Error('JSON dosyası bir dizi (array) içermelidir');
  return veri
    .map((satir) => {
      const kurumAdi = satir.kurum || satir.Kurum;
      if (!satir.adSoyad && !satir['Adı Soyadı']) return null;
      const kurum = kurumAdindanKodBul(kurumAdi);
      const uye = {
        adSoyad: satir.adSoyad || satir['Adı Soyadı'],
        unvan: satir.unvan || satir['Unvanı'] || '',
        kurumKod: kurum.kod,
      };
      const il = satir.il || satir['İl'];
      const ilce = satir.ilce || satir['İlçe'];
      const mahalle = satir.mahalle || satir['Mahalle/Köy'] || satir.koy;
      if (kurum.elleGirisTipi === 'serbest') uye.serbestMetin = satir.serbestMetin || satir['Ek Bilgi/Serbest Metin'] || '';
      else if (kurum.elleGirisTipi === 'koyMahalle' && il && ilce && mahalle) uye.secilenYer = { tip: 'mahalle', il, ilce, mahalle };
      else if (kurum.elleGirisTipi === 'ilVeyaIlce') {
        if (il && ilce) uye.secilenYer = { tip: 'ilce', il, ilce };
        else if (il) uye.secilenYer = { tip: 'il', il };
      }
      return uye;
    })
    .filter(Boolean);
}

/**
 * @param {string} dosyaYolu
 * @returns {Promise<Array>} - { adSoyad, unvan, kurumKod, serbestMetin?, secilenYer? }[]
 */
async function dosyaOku(dosyaYolu) {
  const uzanti = path.extname(dosyaYolu).toLowerCase();

  if (uzanti === '.json') {
    const icerik = await fs.readFile(dosyaYolu, 'utf-8');
    return jsonDosyasindanOku(icerik);
  }

  let workbook;
  if (uzanti === '.csv') {
    // ONEMLI: XLSX.readFile CSV'lerde kodlamayi (UTF-8) bazen yanlis
    // algiliyor (Latin-1 sanip Turkce karakterleri bozuyor). Dosyayi
    // ACIKCA UTF-8 metin olarak okuyup XLSX.read'e STRING olarak
    // vermek bu sorunu cozer.
    const metin = await fs.readFile(dosyaYolu, 'utf-8');
    workbook = XLSX.read(metin, { type: 'string' });
  } else {
    workbook = XLSX.readFile(dosyaYolu);
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const satirlar = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  if (satirlar.length < 2) return [];

  const eslesme = basliklariEslestir(satirlar[0]);
  const uyeler = [];
  for (let i = 1; i < satirlar.length; i++) {
    const uye = satirdanUyeOlustur(satirlar[i], eslesme);
    if (uye) uyeler.push(uye);
  }
  return uyeler;
}

module.exports = { dosyaOku };
