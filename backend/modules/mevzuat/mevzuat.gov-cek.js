/**
 * mevzuat.gov-cek.js
 *
 * mevzuat.gov.tr'den mevzuat ARAMA ve ICERIK CEKME islevleri.
 * mevzuat.gov.tr'nin kendisi HTML sayfasi sunuyor olsa da, arka planda
 * bedesten.adalet.gov.tr uzerinden JSON tabanli bir API'den veri
 * cekiyor (mevzuat.gov.tr'nin resmi sayfasinin kendisi de bu API'yi
 * kullaniyor) - bu daha guvenilir, HTML parse etmekten cok daha az
 * kirilgan.
 *
 * IKI ASAMALI AKIS (kullanicinin acik istegi uzerine):
 *   1) mevzuatGovAra(kaynak)   -> ADAY LISTESI dondurur, icerik CEKMEZ.
 *      Aday birden fazlaysa kullanici HANGISI oldugunu SECER (veya
 *      "bunlar degil" deyip farkli arar) - sistem ARTIK TAHMIN ETMIYOR.
 *   2) mevzuatIcerigiCek(id)   -> kullanicinin SECTIGI adayin tam
 *      icerigini ceker (HTML/PDF ayrimi + Turkce metin temizligi dahil).
 *
 * ARAMA KAYNAGI: URL (MevzuatNo+MevzuatTur) VEYA Resmi Gazete Sayisi.
 * Resmi Gazete Sayisi ile arama, o SAYIDA yayimlanan TUM mevzuati
 * getirir (bir gazete sayisinda birden fazla mevzuat olabilir).
 *
 * ONEMLI: Bu dosyadaki dis servis cagrilari, gelistirme kum havuzunda
 * (sandbox) agin bu alan adina KAPALI olmasi nedeniyle GERCEK
 * ISTEKLERLE test EDILEMEDI - sadece taklit edilmis (mock) fetch
 * yanitlariyla test edildi. Canli sunucuda ilk kullanimda
 * dogrulanmasi onerilir - ozellikle Resmi Gazete Sayisi arama
 * govdesindeki alan adi (`resmiGazeteSayisi`) TEYIT EDILMEDI.
 */

const crypto = require('crypto');
const { htmlDuzenle, belgeYapisiniBicimlendir } = require('./mevzuat.icerik-bicimlendir');

const BEDESTEN_BASE = 'https://bedesten.adalet.gov.tr/mevzuat';
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'AdaletApplicationName': 'UyapMevzuat',
  'Origin': 'https://mevzuat.adalet.gov.tr',
  'Referer': 'https://mevzuat.adalet.gov.tr/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

/** Temizlenmis HTML'den (etiketler kaldirilarak) DUZ METIN uretir - arama/fark/hash icin. */
function htmldenMetneCevir(temizHtml) {
  return temizHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
    .slice(0, 200000);
}

function belgeOzetiCikar(b) {
  return {
    id: b.id || b.mevzuatId,
    ad: b.mevzuatAdi || b.ad || '(adsız)',
    resmiGazeteTarihi: b.resmiGazeteTarihi || null,
    resmiGazeteSayisi: b.resmiGazeteSayisi || '',
    mevzuatNo: b.mevzuatNo || '',
  };
}

/**
 * Arama - ICERIK CEKMEZ, sadece ADAY LISTESI dondurur. Kullanici
 * (frontend) bu listeden DOGRU olani SECER; sistem TAHMIN ETMEZ.
 *
 * @param {object} kaynak
 * @param {string} [kaynak.url] - mevzuat.gov.tr URL'si (MevzuatNo cikarilir)
 * @param {string} [kaynak.resmiGazeteSayisi] - Resmi Gazete Sayisi ile arama
 * @returns {Promise<{adaylar: Array}>}
 */
async function mevzuatGovAra({ url, resmiGazeteSayisi }) {
  let govde;

  if (resmiGazeteSayisi) {
    govde = {
      data: { resmiGazeteSayisi: String(resmiGazeteSayisi).trim(), pageSize: 50, pageNumber: 1, sortFields: ['RESMI_GAZETE_TARIHI'], sortDirection: 'desc' },
      applicationName: 'UyapMevzuat',
      paging: true,
    };
  } else if (url) {
    const urlObj = new URL(url);
    const mevzuatNo = urlObj.searchParams.get('MevzuatNo');
    if (!mevzuatNo) throw new Error('Geçersiz mevzuat.gov.tr URL\'si: MevzuatNo parametresi bulunamadı.');
    govde = {
      data: { mevzuatNo, pageSize: 20, pageNumber: 1, sortFields: ['RESMI_GAZETE_TARIHI'], sortDirection: 'desc' },
      applicationName: 'UyapMevzuat',
      paging: true,
    };
  } else {
    throw new Error('Arama için mevzuat.gov.tr URL\'si veya Resmi Gazete Sayısı gerekli.');
  }

  const aramaYaniti = await fetch(`${BEDESTEN_BASE}/searchDocuments`, {
    method: 'POST', headers: HEADERS, body: JSON.stringify(govde), signal: AbortSignal.timeout(20000),
  });
  if (!aramaYaniti.ok) throw new Error(`mevzuat.gov.tr araması başarısız (HTTP ${aramaYaniti.status})`);
  const aramaSonucu = await aramaYaniti.json();
  const belgeler = aramaSonucu?.data?.mevzuatList || [];

  return { adaylar: belgeler.map(belgeOzetiCikar) };
}

/**
 * Kullanicinin SECTIGI belirli bir mevzuatId icin TAM ICERIGI ceker.
 * @param {string} mevzuatId
 * @returns {Promise<{htmlIcerik, metinIcerik, hash, pdfBuffer}>}
 */
async function mevzuatIcerigiCek(mevzuatId) {
  if (!mevzuatId) throw new Error('Mevzuat kimliği (ID) gerekli.');

  let htmlIcerik = '';
  let metinIcerik = '';
  let pdfBuffer = null;

  // ONEMLI: bedesten API bazi belgeleri (orn. bazi Yonetmelik/Teblig
  // turleri) HTML DEGIL, HAM PDF baytlari olarak donduruyor. Bunu HTML
  // sanip dogrudan UTF-8'e cevirmek BOZUK/OKUNMAZ metin uretiyordu.
  // Bu yuzden once PDF imzasini ("%PDF" ile baslar mi) kontrol ediyoruz.
  const icerikYaniti = await fetch(`${BEDESTEN_BASE}/getDocumentContent`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ data: { documentType: 'MEVZUAT', id: mevzuatId }, applicationName: 'UyapMevzuat' }),
    signal: AbortSignal.timeout(30000),
  });
  if (icerikYaniti.ok) {
    const icerikSonucu = await icerikYaniti.json();
    const base64Icerik = icerikSonucu?.data?.content;
    if (base64Icerik) {
      const hamBuffer = Buffer.from(base64Icerik, 'base64');
      const pdfMi = hamBuffer.slice(0, 5).toString('ascii') === '%PDF-';

      if (pdfMi) {
        pdfBuffer = hamBuffer;
        // PDF'ten METIN CIKAR (fark/diff karsilastirmasi ve arama icin) -
        // ham PDF baytlarini asla dogrudan metin gibi kullanma.
        // NOT: pdf-parse v2+ sinif tabanli API kullanir.
        try {
          const { PDFParse } = require('pdf-parse');
          const parser = new PDFParse({ data: hamBuffer });
          const ayiklanan = await parser.getText();
          metinIcerik = (ayiklanan.text || '').replace(/\s+/g, ' ').trim().slice(0, 200000);
        } catch (e) {
          console.error('[Mevzuat] PDF metin çıkarma hatası:', e.message);
        }
      } else {
        // ONEMLI: ham HTML'i DOGRUDAN kullanmadan once htmlDuzenle +
        // belgeYapisiniBicimlendir ile isle - sabit-genislik <br/>/bosluk
        // artiklarini temizler, ust bilgi tablosunu/basligi/madde
        // basliklarini bicimlendirir (bkz. mevzuat.icerik-bicimlendir.js).
        const hamHtml = hamBuffer.toString('utf-8');
        const temizlenmisHtml = htmlDuzenle(hamHtml);
        htmlIcerik = belgeYapisiniBicimlendir(temizlenmisHtml);
        metinIcerik = htmldenMetneCevir(temizlenmisHtml);
      }
    }
  }

  const hashKaynagi = metinIcerik || (pdfBuffer ? pdfBuffer.toString('base64') : mevzuatId);
  const hash = crypto.createHash('md5').update(hashKaynagi).digest('hex');

  return { htmlIcerik: htmlIcerik.slice(0, 500000), metinIcerik, hash, pdfBuffer };
}

module.exports = { mevzuatGovAra, mevzuatIcerigiCek, htmldenMetneCevir };
