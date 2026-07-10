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

  /** searchDocuments cagrisini yapar, {data:{mevzuatList}} icindeki listeyi dondurur */
  async function ara(turFiltresiUygula) {
    const govde = {
      data: {
        mevzuatNo, pageSize: 10, pageNumber: 1,
        sortFields: ['RESMI_GAZETE_TARIHI'], sortDirection: 'desc',
        ...(turFiltresiUygula && bedestenTur ? { mevzuatTurList: [bedestenTur] } : {}),
      },
      applicationName: 'UyapMevzuat',
      paging: true,
    };
    const yanit = await fetch(`${BEDESTEN_BASE}/searchDocuments`, {
      method: 'POST', headers: HEADERS, body: JSON.stringify(govde), signal: AbortSignal.timeout(20000),
    });
    if (!yanit.ok) throw new Error(`mevzuat.gov.tr araması başarısız (HTTP ${yanit.status})`);
    const sonuc = await yanit.json();
    return sonuc?.data?.mevzuatList || [];
  }

  // 1. Adim: mevzuat no + tur ile ara. TUR KODU ESLEMESI HER ZAMAN
  // GUVENILIR OLMAYABILIR (mevzuat.gov.tr'nin ic tur siniflandirmasi
  // URL'deki MevzuatTur parametresiyle birebir orusmeyebilir) - bu
  // yuzden sonuc BOS gelirse, TUR FILTRESI OLMADAN (sadece mevzuat no
  // ile) genis bir aramayla TEKRAR deneniyor.
  let belgeler = bedestenTur ? await ara(true) : await ara(false);
  if (belgeler.length === 0 && bedestenTur) {
    belgeler = await ara(false);
  }
  if (belgeler.length === 0) throw new Error(`${mevzuatNo} numaralı mevzuat bulunamadı.`);

  // Birden fazla sonuc varsa (turSuz genis aramada olabilir), URL'deki
  // turle ESLESEN kaydi ONCELIKLENDIR - yoksa ilkini (tarihe gore en
  // guncel) kullan.
  let belge = belgeler[0];
  if (belgeler.length > 1 && bedestenTur) {
    const turEslesen = belgeler.find((b) => (b.mevzuatTur || b.tur || '').toString().toUpperCase() === bedestenTur);
    if (turEslesen) belge = turEslesen;
  }

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
