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
 * ONEMLI (guvenlik/dogruluk karari): URL'deki MevzuatTur sayisal kodu
 * ("...&MevzuatTur=7" gibi) hangi belge turune karsilik geldigi
 * mevzuat.gov.tr tarafindan RESMI OLARAK BELGELENMEMIS ve GOZLEMLERE
 * GORE TUTARSIZ. Daha once bu kod bir tahmin tablosuyla (KANUN,
 * YONETMELIK vb.) aramayi daraltmak icin kullaniliyordu, ama bu YANLIS
 * turde bir belgeyi (orn. istenen Yonetmelik yerine ayni numarali bir
 * Cumhurbaskani Karari) SESSIZCE getirebiliyordu - mevzuat takibi gibi
 * hassas bir islev icin bu kabul edilemez bir risk. Bu yuzden artik
 * TAHMIN EDILMIYOR: ayni mevzuat numarasina birden fazla FARKLI turde
 * belge cikarsa, hangisi oldugu netlesene kadar HATA VERILIP
 * kullaniciya adaylar listelenir.
 *
 * ONEMLI: Bu dosyadaki dis servis cagrisi, gelistirme kum havuzunda
 * (sandbox) agin bu alan adina KAPALI olmasi nedeniyle buradan
 * GERCEK ISTEKLERLE test EDILEMEDI - sadece taklit edilmis (mock)
 * fetch yanitlariyla test edildi. Mantik dogru kuruldu ve hata
 * yakalama saglam ama canli sunucuda ilk kullanimda dogrulanmasi
 * onerilir.
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
 * mevzuat.gov.tr URL'sindeki MevzuatTur sayisal kodunun hangi belge
 * turune karsilik geldigi RESMI OLARAK BELGELENMEMIS ve GOZLEMLERE
 * GORE TUTARSIZ (ayni kod farkli zamanlarda farkli turlere denk
 * gelebiliyor). Bu yuzden bu kod ARTIK ARAMAYI DARALTMAK ICIN
 * KULLANILMIYOR - sadece, birden fazla sonuc arasinda hangisinin
 * dogru oldugunu SEC MEK icin bir ipucu olarak, arama sonucundaki
 * HAM alanlarla (cevrilmeden) karsilastiriliyor. Boylece yanlis bir
 * eslestirme tablosu yuzunden BASKA BIR TURDEKI belgeyi (orn. Kanun
 * yerine Cumhurbaskani Karari) SESSIZCE getirme riski ortadan kalkar.
 */
function hamTurAlanlariEslesiyorMu(belge, hamMevzuatTur) {
  const adaylar = [belge.mevzuatTur, belge.tur, belge.mevzuatTurId, belge.mevzuatTurKodu, belge.mevzuatTurNo];
  return adaylar.some((deger) => deger !== undefined && deger !== null && String(deger) === String(hamMevzuatTur));
}

/**
 * @param {string} url - mevzuat.gov.tr URL'si (orn. .../mevzuat?MevzuatNo=4342&MevzuatTur=1)
 * @returns {Promise<{ad, htmlIcerik, metinIcerik, hash, resmiGazeteTarihi, resmiGazeteSayisi, mevzuatNo}>}
 */
async function mevzuatGovCek(url) {
  const urlObj = new URL(url);
  const mevzuatNo = urlObj.searchParams.get('MevzuatNo');
  const hamMevzuatTur = urlObj.searchParams.get('MevzuatTur');
  if (!mevzuatNo) throw new Error('Geçersiz mevzuat.gov.tr URL\'si: MevzuatNo parametresi bulunamadı.');

  // ONEMLI: MevzuatTur ile ARAMAYI DARALTMIYORUZ (yukaridaki aciklamaya
  // bak) - sadece mevzuat no ile GENIS arama yapip, birden fazla sonuc
  // varsa HAM tur koduyla eslesen tek adayi sec, eslesen yoksa/belirsizse
  // KULLANICIYA ACIKCA SOR (sessizce yanlis belgeyi getirme).
  const govde = {
    data: { mevzuatNo, pageSize: 20, pageNumber: 1, sortFields: ['RESMI_GAZETE_TARIHI'], sortDirection: 'desc' },
    applicationName: 'UyapMevzuat',
    paging: true,
  };
  const aramaYaniti = await fetch(`${BEDESTEN_BASE}/searchDocuments`, {
    method: 'POST', headers: HEADERS, body: JSON.stringify(govde), signal: AbortSignal.timeout(20000),
  });
  if (!aramaYaniti.ok) throw new Error(`mevzuat.gov.tr araması başarısız (HTTP ${aramaYaniti.status})`);
  const aramaSonucu = await aramaYaniti.json();
  const belgeler = aramaSonucu?.data?.mevzuatList || [];
  if (belgeler.length === 0) throw new Error(`${mevzuatNo} numaralı mevzuat bulunamadı.`);

  let belge;
  if (belgeler.length === 1) {
    belge = belgeler[0];
  } else if (hamMevzuatTur) {
    const turEslesenler = belgeler.filter((b) => hamTurAlanlariEslesiyorMu(b, hamMevzuatTur));
    if (turEslesenler.length === 1) {
      belge = turEslesenler[0];
    } else {
      // BELIRSIZ - sessizce yanlis belgeyi almak yerine, adaylari
      // listeleyip kullanicidan netlestirmesini iste.
      const adaylarListesi = belgeler
        .map((b, i) => `${i + 1}. "${b.mevzuatAdi || b.ad || '(adsız)'}" — R.G. ${b.resmiGazeteTarihi || '?'}, Sayı: ${b.resmiGazeteSayisi || '?'}`)
        .join('\n');
      throw new Error(
        `"${mevzuatNo}" numarası birden fazla farklı türde belgeye ait, hangisi olduğu netleştirilemedi:\n${adaylarListesi}\n` +
        `Lütfen doğru belgenin tam URL'sini (mevzuat.gov.tr'de belgeyi açıp adres çubuğundan) veya adını belirtin.`
      );
    }
  } else {
    // MevzuatTur URL'de yoktu ve birden fazla sonuc var - yine belirsiz.
    const adaylarListesi = belgeler
      .map((b, i) => `${i + 1}. "${b.mevzuatAdi || b.ad || '(adsız)'}" — R.G. ${b.resmiGazeteTarihi || '?'}, Sayı: ${b.resmiGazeteSayisi || '?'}`)
      .join('\n');
    throw new Error(`"${mevzuatNo}" numarası birden fazla belgeye ait:\n${adaylarListesi}\nLütfen tam mevzuat.gov.tr URL'sini (MevzuatTur dahil) kullanın.`);
  }

  const mevzuatId = belge.id || belge.mevzuatId;
  const ad = belge.mevzuatAdi || belge.ad || '';
  const resmiGazeteSayisi = belge.resmiGazeteSayisi || '';
  const resmiGazeteTarihi = belge.resmiGazeteTarihi ? new Date(belge.resmiGazeteTarihi) : null;
  if (!mevzuatId) throw new Error('Mevzuat kimliği (ID) bulunamadı.');

  // 2. Adim: icerigi cek. ONEMLI: bedesten API bazi belgeleri (orn.
  // bazi Yonetmelik/Teblig turleri) HTML DEGIL, HAM PDF baytlari
  // olarak donduruyor. Bunu HTML sanip dogrudan UTF-8'e cevirmek
  // BOZUK/OKUNMAZ metin uretiyordu (kullanicinin karsilastigi sorun).
  // Bu yuzden once PDF imzasini ("%PDF" ile baslar mi) kontrol ediyoruz.
  let htmlIcerik = '';
  let metinIcerik = '';
  let pdfBuffer = null;
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
        // NOT: pdf-parse v2+ sinif tabanli API kullanir (eski surumdeki
        // dogrudan fonksiyon cagrisi ARTIK CALISMAZ).
        try {
          const { PDFParse } = require('pdf-parse');
          const parser = new PDFParse({ data: hamBuffer });
          const ayiklanan = await parser.getText();
          metinIcerik = (ayiklanan.text || '').replace(/\s+/g, ' ').trim().slice(0, 200000);
        } catch (e) {
          console.error('[Mevzuat] PDF metin çıkarma hatası:', e.message);
        }
      } else {
        htmlIcerik = hamBuffer.toString('utf-8');
        metinIcerik = htmldenMetneCevir(htmlIcerik);
      }
    }
  }
  // Icerik cekilemese bile ad/tarih varsa devam - en azindan kayit olusturulabilsin

  // Hash: METIN varsa ondan, yoksa (metin cikarma basarisiz oldugunda)
  // PDF baytlarindan hesaplanir - degisiklik tespiti her durumda calisir.
  const hashKaynagi = metinIcerik || (pdfBuffer ? pdfBuffer.toString('base64') : mevzuatId);
  const hash = crypto.createHash('md5').update(hashKaynagi).digest('hex');

  return {
    ad, htmlIcerik: htmlIcerik.slice(0, 500000), metinIcerik, hash,
    resmiGazeteTarihi, resmiGazeteSayisi, mevzuatNo, pdfBuffer,
  };
}

module.exports = { mevzuatGovCek };
