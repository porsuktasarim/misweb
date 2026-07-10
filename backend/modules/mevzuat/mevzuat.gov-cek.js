/**
 * mevzuat.gov-cek.js
 *
 * mevzuat.gov.tr URL'sinden mevzuat icerigini otomatik ceker.
 * mevzuat.gov.tr'nin kendisi HTML sayfasi sunuyor olsa da, arka planda
 * bedesten.adalet.gov.tr uzerinden JSON tabanli bir API'den veri
 * cekiyor (mevzuat.gov.tr'nin resmi sayfasinin kendisi de bu API'yi
 * kullaniyor) - bu daha guvenilir, HTML parse etmekten cok daha az
 * kirilgan.
 *
 * ONEMLI: Bu dosyadaki dis servis cagrisi, gelistirme kum havuzunda
 * (sandbox) agin bu alan adina KAPALI olmasi nedeniyle buradan test
 * EDILEMEDI. Mantik dogru kuruldu ve hata yakalama saglam ama canli
 * sunucuda ilk kullanimda dogrulanmasi onerilir.
 */

const crypto = require('crypto');

const BEDESTEN_BASE = 'https://bedesten.adalet.gov.tr/mevzuat';
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'AdaletApplicationName': 'UyapMevzuat',
  'Origin': 'https://mevzuat.adalet.gov.tr',
  'Referer': 'https://mevzuat.adalet.gov.tr/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

const TUR_HARITASI = {
  '1': 'KANUN', '2': 'KHK', '3': 'TUZUK', '4': 'YONETMELIK',
  '7': 'TEBLIGLER', '8': 'CB_KARARNAME', '9': 'CB_KARAR', '10': 'CB_YONETMELIK', '11': 'CB_GENELGE',
};

function htmldenMetneCevir(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
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

/**
 * @param {string} url - mevzuat.gov.tr URL'si (orn. .../mevzuat?MevzuatNo=4342&MevzuatTur=1)
 * @returns {Promise<{ad, htmlIcerik, metinIcerik, hash, resmiGazeteTarihi, resmiGazeteSayisi, mevzuatNo}>}
 */
async function mevzuatGovCek(url) {
  const urlObj = new URL(url);
  const mevzuatNo = urlObj.searchParams.get('MevzuatNo');
  const mevzuatTur = urlObj.searchParams.get('MevzuatTur');
  if (!mevzuatNo) throw new Error('Geçersiz mevzuat.gov.tr URL\'si: MevzuatNo parametresi bulunamadı.');

  const bedestenTur = mevzuatTur ? TUR_HARITASI[mevzuatTur] : null;

  // 1. Adim: mevzuat no ile ara -> ID bul
  const aramaGovdesi = {
    data: { mevzuatNo, pageSize: 5, pageNumber: 1, sortFields: ['RESMI_GAZETE_TARIHI'], sortDirection: 'desc', ...(bedestenTur ? { mevzuatTurList: [bedestenTur] } : {}) },
    applicationName: 'UyapMevzuat',
    paging: true,
  };

  const aramaYaniti = await fetch(`${BEDESTEN_BASE}/searchDocuments`, {
    method: 'POST', headers: HEADERS, body: JSON.stringify(aramaGovdesi), signal: AbortSignal.timeout(20000),
  });
  if (!aramaYaniti.ok) throw new Error(`mevzuat.gov.tr araması başarısız (HTTP ${aramaYaniti.status})`);
  const aramaSonucu = await aramaYaniti.json();
  const belgeler = aramaSonucu?.data?.mevzuatList || [];
  if (belgeler.length === 0) throw new Error(`${mevzuatNo} numaralı mevzuat bulunamadı.`);

  const belge = belgeler[0];
  const mevzuatId = belge.id || belge.mevzuatId;
  const ad = belge.mevzuatAdi || belge.ad || '';
  const resmiGazeteSayisi = belge.resmiGazeteSayisi || '';
  const resmiGazeteTarihi = belge.resmiGazeteTarihi ? new Date(belge.resmiGazeteTarihi) : null;
  if (!mevzuatId) throw new Error('Mevzuat kimliği (ID) bulunamadı.');

  // 2. Adim: icerigi cek (base64 HTML)
  let htmlIcerik = '';
  let metinIcerik = '';
  const icerikYaniti = await fetch(`${BEDESTEN_BASE}/getDocumentContent`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ data: { documentType: 'MEVZUAT', id: mevzuatId }, applicationName: 'UyapMevzuat' }),
    signal: AbortSignal.timeout(30000),
  });
  if (icerikYaniti.ok) {
    const icerikSonucu = await icerikYaniti.json();
    const base64Icerik = icerikSonucu?.data?.content;
    if (base64Icerik) {
      htmlIcerik = Buffer.from(base64Icerik, 'base64').toString('utf-8');
      metinIcerik = htmldenMetneCevir(htmlIcerik);
    }
  }
  // Icerik cekilemese bile ad/tarih varsa devam - en azindan kayit olusturulabilsin

  const hash = crypto.createHash('md5').update(metinIcerik || mevzuatId).digest('hex');

  return {
    ad, htmlIcerik: htmlIcerik.slice(0, 500000), metinIcerik, hash,
    resmiGazeteTarihi, resmiGazeteSayisi, mevzuatNo,
  };
}

module.exports = { mevzuatGovCek };
