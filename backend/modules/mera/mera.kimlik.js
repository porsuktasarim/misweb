/**
 * mera.kimlik.js
 *
 * "MERA KİMLİĞİ" PDF ureticisi - 3T'nin Ek-3/a Madde 10'u
 * ("Harita, Kroki, Pafta ve Ellerinde Mevcut Diger Bilgiler") icin.
 * TEK BIR PARSEL icin: BASLIK (kalin, "İl İlçe Köy/Mahalle Ada/Parsel
 * Nitelik") + 2 SUTUN (sol: 8 alan, sag: OpenStreetMap ARKA PLANLI
 * statik harita - parselin haritadaki konumu) + "EKLER" listesi
 * (Dosyalar sekmesindeki TUM belgeler, AYNI TIPTEN BIRDEN FAZLA VARSA
 * "Tapu Senedi #01", "Tapu Senedi #02" seklinde numaralanip ALT ALTA
 * SIRALANIR) + ARDINDAN o dosyalarin GERCEK icerikleri (PDF/resim)
 * BU KIMLIK SAYFASININ ARKASINA EKLENEREK TEK BIR PDF'DE BIRLESTIRILIR.
 */

const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLibDocument } = require('pdf-lib');
const StaticMaps = require('staticmaps');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

// Projenin GERCEK deposunda Turkce karakter destegi icin GOMULU
// DejaVu Serif fontlari BURADA duruyor (reporting modulunun diger
// Ek-X ciktilarinda da AYNI fontlar kullaniliyor - TUTARLILIK icin).
// Font dosyasi bu ORTAMDA (sandbox) BULUNAMAZSA (sadece test/gelistirme
// asamasinda olabilir), pdfkit'in VARSAYILAN fontuna DUSULUR - ama bu
// durumda Turkce karakterler (ç,ğ,ı,ö,ş,ü) DOGRU GORUNTULENMEZ, bu
// yuzden CANLI ORTAMDA font dosyasinin GERCEKTEN mevcut olmasi SARTTIR.
const FONT_NORMAL_YOLU = path.join(__dirname, '../reporting/sablonlar/fontlar/DejaVuSerif.ttf');
const FONT_BOLD_YOLU = path.join(__dirname, '../reporting/sablonlar/fontlar/DejaVuSerif-Bold.ttf');
const FONT_MEVCUT = fsSync.existsSync(FONT_NORMAL_YOLU) && fsSync.existsSync(FONT_BOLD_YOLU);

const ALAN_ETIKETLERI_KIMLIK = [
  { alan: 'tapuKimlikNo', etiket: 'Tapu Kimlik No' },
  { alan: 'meraAlaniM2', etiket: 'Mera Alanı', birimM2: true },
  { alan: 'tapuAlaniM2', etiket: 'Tapu Alanı', birimM2: true },
  { alan: 'mulkiyetDurumu', etiket: 'Mülkiyet Durumu' },
  { alan: 'araziKaynagi', etiket: 'Arazi Kaynağı' },
  { alan: 'araziDurumSinifi', etiket: 'Arazi Durum Sınıfı' },
  { alan: 'topraksinifi', etiket: 'Toprak Sınıfı' },
  { alan: 'egimi', etiket: 'Eğimi' },
];

/** GeoJSON (FeatureCollection VEYA tek Feature/Geometry) icindeki TUM [lng,lat] koordinatlarini DUZ bir diziye TOPLAR. */
function geojsonKoordinatlariniTopla(geojson) {
  const koordinatlar = [];
  function gezin(coords) {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number') { koordinatlar.push([coords[0], coords[1]]); return; }
    coords.forEach(gezin);
  }
  const featureListesi = geojson.features || (geojson.type === 'Feature' ? [geojson] : [{ geometry: geojson }]);
  featureListesi.forEach((f) => {
    const geom = f.geometry || f;
    if (geom && geom.coordinates) gezin(geom.coordinates);
  });
  return koordinatlar;
}

/**
 * OpenStreetMap ARKA PLANLI (ucretsiz, KEY GEREKTIRMEZ) statik harita
 * PNG'si uretir - parselin GERCEK sinirlarini (aktif harita dosyasinin
 * GeoJSON turevinden) coklu-cizgi/poligon olarak CIZER, gorunum
 * OTOMATIK olarak bu sinirlarin BBOX'ina gore ORTALANIR/YAKINLASTIRILIR.
 * Parselin harita verisi YOKSA null DONER (cagiran taraf "harita verisi
 * yok" notunu GOSTERIR).
 */
async function parselHaritasiUret(kayit, genislikPx = 480, yukseklikPx = 340) {
  const sonHaritaDosyasi = kayit.haritaDosyalari && kayit.haritaDosyalari.length
    ? kayit.haritaDosyalari[kayit.haritaDosyalari.length - 1] : null;
  if (!sonHaritaDosyasi || !sonHaritaDosyasi.geojsonYolu) return null;

  let geojson;
  try {
    geojson = JSON.parse(await fs.readFile(sonHaritaDosyasi.geojsonYolu, 'utf-8'));
  } catch (err) {
    return null;
  }
  const koordinatlar = geojsonKoordinatlariniTopla(geojson);
  if (!koordinatlar.length) return null;

  const map = new StaticMaps({ width: genislikPx, height: yukseklikPx });
  if (koordinatlar.length >= 3) {
    map.addPolygon({ coords: [...koordinatlar, koordinatlar[0]], color: '#2e7d32FF', width: 3, fill: '#2e7d3244' });
  } else {
    map.addLine({ coords: koordinatlar, color: '#2e7d32FF', width: 3 });
  }
  await map.render();
  return map.image.buffer('image/png');
}

/**
 * Dosyalar sekmesindeki (kayit.dosyalar) TUM belgeleri, DOSYA TIPI
 * ADINA gore GRUPLAYIP numaralandirir: AYNI tipten BIRDEN FAZLA
 * dosya varsa "Tapu Senedi #01", "Tapu Senedi #02" seklinde, TEK
 * dosya varsa numarasiz ("Fotoğraf"). AYNI TIPTEKI dosyalar ALT ALTA
 * (grup halinde) siralanir.
 */
function eklerListesiOlustur(dosyalar, dosyaTipiAdSozlugu) {
  const gruplar = {};
  dosyalar.forEach((d) => {
    const tipAdi = dosyaTipiAdSozlugu[d.dosyaTipiAnahtari] || 'Diğer Belge';
    if (!gruplar[tipAdi]) gruplar[tipAdi] = [];
    gruplar[tipAdi].push(d);
  });

  const sonuc = [];
  Object.entries(gruplar).forEach(([tipAdi, grupDosyalari]) => {
    grupDosyalari.forEach((d, i) => {
      const goruntulenenAd = grupDosyalari.length > 1 ? `${tipAdi} #${String(i + 1).padStart(2, '0')}` : tipAdi;
      sonuc.push({ goruntulenenAd, dosya: d });
    });
  });
  return sonuc;
}

/** "Mera Kimliği" SAYFA 1'ini (baslik + 2 sutun + ekler listesi) pdfkit ile OLUSTURUP Buffer olarak DONDURUR. */
async function kimlikSayfasiOlustur(kayit, dosyaTipiAdSozlugu) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const parcalar = [];
    doc.on('data', (c) => parcalar.push(c));
    doc.on('end', () => resolve(Buffer.concat(parcalar)));
    doc.on('error', reject);

    if (FONT_MEVCUT) {
      doc.registerFont('Normal', FONT_NORMAL_YOLU);
      doc.registerFont('Kalin', FONT_BOLD_YOLU);
    }
    const fontNormal = FONT_MEVCUT ? 'Normal' : 'Helvetica';
    const fontKalin = FONT_MEVCUT ? 'Kalin' : 'Helvetica-Bold';

    // BASLIK: "İl İlçe Köy/Mahalle Ada/Parsel Nitelik" - KALIN.
    const baslikMetni = `${kayit.il} ${kayit.ilce} ${kayit.koyMahalle} ${kayit.adaNo || '-'}/${kayit.parselNo || '-'} ${kayit.araziNiteligi || ''}`.trim();
    doc.font(fontKalin).fontSize(15).text(baslikMetni, { align: 'center' });
    doc.moveDown(1);

    const sayfaGenisligi = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const solSutunGenisligi = sayfaGenisligi * 0.45;
    const sagSutunX = doc.page.margins.left + solSutunGenisligi + 20;
    const sagSutunGenisligi = sayfaGenisligi - solSutunGenisligi - 20;
    const sutunBaslangicY = doc.y;

    // SOL SUTUN: 8 alan.
    doc.font(fontNormal).fontSize(10);
    let satirY = sutunBaslangicY;
    ALAN_ETIKETLERI_KIMLIK.forEach(({ alan, etiket, birimM2 }) => {
      let deger = kayit[alan];
      if (birimM2 && deger != null) deger = `${Number(deger).toLocaleString('tr-TR')} m²`;
      if (deger == null || deger === '') deger = '—';
      doc.font(fontKalin).text(`${etiket}: `, doc.page.margins.left, satirY, { continued: true, width: solSutunGenisligi });
      doc.font(fontNormal).text(String(deger));
      satirY = doc.y + 4;
    });

    // SAG SUTUN: statik harita goruntusu (varsa).
    return parselHaritasiUret(kayit, Math.round(sagSutunGenisligi), 260).then((haritaBuffer) => {
      if (haritaBuffer) {
        doc.image(haritaBuffer, sagSutunX, sutunBaslangicY, { width: sagSutunGenisligi });
      } else {
        doc.font(fontNormal).fontSize(9).fillColor('#888')
          .text('Bu parsel için harita verisi henüz yüklenmemiş.', sagSutunX, sutunBaslangicY, { width: sagSutunGenisligi });
        doc.fillColor('#000');
      }

      const enAltY = Math.max(satirY, sutunBaslangicY + 270);
      doc.y = enAltY + 20;

      // EKLER listesi.
      const dosyalar = kayit.dosyalar || [];
      doc.font(fontKalin).fontSize(12).text('Ekler', doc.page.margins.left, doc.y);
      doc.moveDown(0.3);
      doc.font(fontNormal).fontSize(10);
      if (!dosyalar.length) {
        doc.fillColor('#888').text('Bu parsel için eklenmiş belge bulunmamaktadır.');
        doc.fillColor('#000');
      } else {
        const ekListesi = eklerListesiOlustur(dosyalar, dosyaTipiAdSozlugu);
        ekListesi.forEach((e, i) => {
          doc.text(`${i + 1}. ${e.goruntulenenAd}`);
        });
      }

      doc.end();
    }).catch(reject);
  });
}

/**
 * TAM "Mera Kimliği" PDF'sini uretir: kimlik SAYFASI + Dosyalar
 * sekmesindeki TUM belgelerin GERCEK icerikleri (PDF ise sayfalari
 * DOGRUDAN, resim ise BIR PDF SAYFASINA CEVRILEREK) ARKASINA
 * EKLENIR - TEK bir PDF Buffer olarak DONER.
 */
async function kimlikPdfOlustur(kayit, dosyaTipiAdSozlugu) {
  const kimlikSayfasiBuffer = await kimlikSayfasiOlustur(kayit, dosyaTipiAdSozlugu);
  const birlesikPdf = await PDFLibDocument.load(kimlikSayfasiBuffer);

  const GORUNTU_UZANTILARI = ['.jpg', '.jpeg', '.png'];
  for (const dosya of (kayit.dosyalar || [])) {
    try {
      const uzanti = (dosya.formatUzantisi || '').toLowerCase();
      const icerik = await fs.readFile(dosya.dosyaYolu);
      if (uzanti === '.pdf') {
        const ekPdf = await PDFLibDocument.load(icerik, { ignoreEncryption: true });
        const sayfalar = await birlesikPdf.copyPages(ekPdf, ekPdf.getPageIndices());
        sayfalar.forEach((s) => birlesikPdf.addPage(s));
      } else if (GORUNTU_UZANTILARI.includes(uzanti)) {
        const resim = uzanti === '.png' ? await birlesikPdf.embedPng(icerik) : await birlesikPdf.embedJpg(icerik);
        const sayfa = birlesikPdf.addPage([resim.width, resim.height]);
        sayfa.drawImage(resim, { x: 0, y: 0, width: resim.width, height: resim.height });
      }
      // Digger formatlar (orn. .docx, .xlsx) SAYFA olarak EKLENEMEZ -
      // Ekler LISTESINDE ADI GORUNUR ama icerigi PDF'e GOMULMEZ
      // (kullaniciya bilgi kaybi OLMAZ, dosya kendisi HALA indirilebilir).
    } catch (err) {
      console.error(`Ek dosya PDF'e eklenemedi (${dosya.orijinalAd}):`, err.message);
    }
  }

  const sonBuffer = await birlesikPdf.save();
  return Buffer.from(sonBuffer);
}

/**
 * BIRDEN FAZLA parselin "Mera Kimliği" PDF'lerini ARKA ARKAYA (her
 * biri kendi ekleriyle birlikte) TEK bir PDF'de birlestirir - Ek-3/a
 * Madde 10 ("Harita, Kroki, Pafta ve Ellerinde Mevcut Diger Bilgiler")
 * icin: Madde 7'de SECILEN parsellerin HEPSININ kimlik+ekleri TEK
 * PDF halinde indirilebilir olur.
 */
async function coklulKimlikPdfOlustur(parselListesi, dosyaTipiAdSozlugu) {
  if (!parselListesi.length) throw new Error('En az bir parsel gereklidir.');
  const ilkPdfBuffer = await kimlikPdfOlustur(parselListesi[0], dosyaTipiAdSozlugu);
  const birlesikPdf = await PDFLibDocument.load(ilkPdfBuffer);

  for (let i = 1; i < parselListesi.length; i++) {
    const sonrakiBuffer = await kimlikPdfOlustur(parselListesi[i], dosyaTipiAdSozlugu);
    const sonrakiPdf = await PDFLibDocument.load(sonrakiBuffer);
    const sayfalar = await birlesikPdf.copyPages(sonrakiPdf, sonrakiPdf.getPageIndices());
    sayfalar.forEach((s) => birlesikPdf.addPage(s));
  }

  const sonBuffer = await birlesikPdf.save();
  return Buffer.from(sonBuffer);
}

module.exports = { kimlikPdfOlustur, coklulKimlikPdfOlustur, parselHaritasiUret, eklerListesiOlustur };
