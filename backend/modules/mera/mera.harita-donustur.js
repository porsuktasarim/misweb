/**
 * mera.harita-donustur.js
 *
 * Yuklenen HERHANGI bir CBS dosyasini (KML/KMZ/GPX/GeoJSON/JSON) TEK
 * bir formata - GeoJSON'a - CEVIRIR. ORIJINAL dosya HER ZAMAN oldugu
 * gibi (formati DEGISTIRILMEDEN) AYRICA saklanir (ilk kural) - bu
 * donusum SADECE bir "kolaylik kopyasi" uretir: (a) haritada TUTARLI/
 * GUVENILIR sekilde CIZILEBILMESI icin (KMZ gibi formatlar Leaflet
 * tarafindan DOGRUDAN CIZILEMIYOR), (b) PARSEL OZNITELIKLERININ
 * (ıslah durumu, egim, alan vb.) dosyanin ICINE GOMULEBILMESI icin
 * (GeoJSON'un "properties" alani bunun icin IDEAL).
 */

const AdmZip = require('adm-zip');
const { DOMParser } = require('@xmldom/xmldom');
const togeojson = require('@tmcw/togeojson');
const fs = require('fs/promises');
const path = require('path');

// GeoJSON feature'larina GOMULECEK parsel alanlari - kullanicinin
// acikca istedigi "ıslah durumu, egim vb." dahil, GENIS TUTULDU.
const PARSEL_OZELLIK_ALANLARI = [
  'il', 'ilce', 'koyMahalle', 'adaNo', 'parselNo',
  'araziNiteligi', 'araziDurumSinifi', 'araziKaynagi',
  'islahDurumu', 'egimi', 'topraksinifi',
  'meraAlaniM2', 'tapuAlaniM2', 'tapuKimlikNo',
];

async function hamGeojsonUret(dosyaYolu, formatTipi) {
  if (formatTipi === 'geojson' || formatTipi === 'json') {
    return JSON.parse(await fs.readFile(dosyaYolu, 'utf-8'));
  }
  if (formatTipi === 'kml') {
    const xml = await fs.readFile(dosyaYolu, 'utf-8');
    return togeojson.kml(new DOMParser().parseFromString(xml, 'text/xml'));
  }
  if (formatTipi === 'gpx') {
    const xml = await fs.readFile(dosyaYolu, 'utf-8');
    return togeojson.gpx(new DOMParser().parseFromString(xml, 'text/xml'));
  }
  if (formatTipi === 'kmz') {
    // KMZ = icinde .kml barındıran bir ZIP arsivi - once ACILIR,
    // icindeki KML CIKARILIR, sonra AYNI sekilde cevrilir.
    const zip = new AdmZip(dosyaYolu);
    const kmlEntry = zip.getEntries().find((e) => e.entryName.toLowerCase().endsWith('.kml'));
    if (!kmlEntry) throw new Error('KMZ dosyası içinde .kml bulunamadı.');
    const xml = kmlEntry.getData().toString('utf-8');
    return togeojson.kml(new DOMParser().parseFromString(xml, 'text/xml'));
  }
  throw new Error(`GeoJSON'a çevrilemeyen format: ${formatTipi}`);
}

/** Dosyayi GeoJSON'a cevirir VE parselin (kayit) GUNCEL ozniteliklerini HER feature'in properties'ine GOMER. */
async function dosyayiGeojsoneCevir(dosyaYolu, formatTipi, kayit) {
  const geojson = await hamGeojsonUret(dosyaYolu, formatTipi);
  if (geojson && Array.isArray(geojson.features)) {
    const ozellikler = {};
    PARSEL_OZELLIK_ALANLARI.forEach((alan) => { if (kayit[alan] !== undefined && kayit[alan] !== null) ozellikler[alan] = kayit[alan]; });
    geojson.features.forEach((f) => { f.properties = { ...(f.properties || {}), ...ozellikler }; });
  }
  return geojson;
}

/** Cevrilen GeoJSON'u DISKE yazar (orijinal dosyanin YANINA, ayni ad + .geojson uzantisiyla) - kaydedilen dosya YOLUNU dondurur. */
async function geojsonKaydet(orijinalDosyaYolu, geojson) {
  const uzanti = path.extname(orijinalDosyaYolu);
  const hedefYol = orijinalDosyaYolu.slice(0, -uzanti.length) + '.geojson';
  await fs.writeFile(hedefYol, JSON.stringify(geojson));
  return hedefYol;
}

module.exports = { dosyayiGeojsoneCevir, geojsonKaydet };
