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

const BEDESTEN_BASE = 'https://bedesten.adalet.gov.tr/mevzuat';
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'AdaletApplicationName': 'UyapMevzuat',
  'Origin': 'https://mevzuat.adalet.gov.tr',
  'Referer': 'https://mevzuat.adalet.gov.tr/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

/**
 * Ham HTML'i TEMIZLER (goruntuleme icin, ETIKETLER KORUNUR).
 *
 * mevzuat.gov.tr kaynagi, SABIT GENISLIKTE (eski basim/PDF duzenine
 * gore) bicimlendirilmis HTML doner: cumlelerin ORTASINDA bile <br/>
 * ile satir kaydiriliyor, hizalama icin onlarca bosluk ekleniyor
 * (orn. "numarası          :    4342"). Bunu OLDUGU GIBI gostermek,
 * modern (degisken genislikte) bir kutuda metnin sag tarafinda bosluk
 * birakip garip kirilmalara yol aciyordu (kullanicinin bildirdigi sorun).
 *
 * Kural: ARDISIK 2+ <br/> = GERCEK paragraf sonu (korunur). TEK <br/>
 * ise, hemen sonrasinda YENI BIR MADDE baslamiyorsa sadece satir
 * kaydirma ARTEFAKTIDIR - BOSLUKLA degistirilip metin DOGAL AKMASI
 * saglanir (Turkce mevzuat yazim kurallarina uygun, akici govde).
 * AYNI KURAL <p>/<div> BLOK ELEMANLARI ICIN DE UYGULANIR (orn.
 * basliklarin "<p>MERA</p><p>KANUNU</p>" gibi kelime kelime AYRI
 * bloklara bolunmesi) - onceki blok NOKTALAMA ILE BITMIYORSA devam
 * ettigi varsayilip birlestirilir.
 */
function htmlDuzenle(html) {
  let temiz = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  const PARAGRAF_YERTUTUCU = '\u0000PARA\u0000';

  // Ardisik 2+ <br/> (aralarinda sadece bosluk olabilir) -> paragraf sonu
  temiz = temiz.replace(/(?:<br\s*\/?>\s*){2,}/gi, PARAGRAF_YERTUTUCU);

  // Kalan TEK <br/>'ler: hemen sonrasi "MADDE"/"GEÇİCİ MADDE"/"EK
  // MADDE" ile basliyorsa GERCEK paragraf sonu, degilse sadece
  // satir-kaydirma artefakti (boslukla birlestir).
  temiz = temiz.replace(/<br\s*\/?>\s*/gi, (eslesme, ofset, tumMetin) => {
    const sonrasi = tumMetin.slice(ofset + eslesme.length, ofset + eslesme.length + 40);
    const yeniMaddeMi = /^(MADDE|Madde|GEÇİCİ MADDE|Geçici Madde|EK MADDE|Ek Madde)\s/.test(sonrasi);
    return yeniMaddeMi ? PARAGRAF_YERTUTUCU : ' ';
  });

  temiz = temiz.split(PARAGRAF_YERTUTUCU).join('<br/><br/>');

  // --- BLOK ELEMAN (p/div) SINIRLARI: BASLIKLAR gibi kisa metin
  // parcalarinin AYRI blok elemanlara bolunmesi de AYNI "yapay
  // kirilma" sorununu yaratiyor (orn. "<p>MERA</p><p>KANUNU</p>" ->
  // ekranda "MERA" ve "KANUNU" AYRI SATIRLARDA gorunur). Kural: onceki
  // blogun metni NOKTALAMA ILE BITMIYORSA (., :, ;, !, ?) ayni
  // cumlenin/basligin DEVAMI kabul edilip BOSLUKLA birlestirilir;
  // noktalama ile bitiyorsa GERCEK blok sonu oldugu icin DOKUNULMAZ.
  temiz = temiz.replace(/<\/(p|div)>\s*<\1[^>]*>/gi, (eslesme, etiket, ofset, tumMetin) => {
    const oncekiMetin = tumMetin.slice(0, ofset).replace(/<[^>]+>/g, '').trimEnd();
    const sonKarakter = oncekiMetin.slice(-1);
    const noktalamaVarMi = ['.', ':', ';', '!', '?'].includes(sonKarakter);
    return noktalamaVarMi ? eslesme : ' ';
  });

  // Hizalama icin eklenmis FAZLA bosluklari (2+) TEK bosluğa indir
  temiz = temiz.replace(/[ \t]{2,}/g, ' ');
  // Noktalama ONCESI bosluk artiklarini temizle ("numarası :" -> "numarası:")
  temiz = temiz.replace(/ +([:.,;])/g, '$1');

  return temiz.trim();
}

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
        // ONEMLI: ham HTML'i DOGRUDAN kullanmadan once htmlDuzenle ile
        // temizle - kaynaktaki sabit-genislik <br/>/bosluk artiklarini
        // temizleyip metnin DOGAL AKMASINI saglar (bkz. htmlDuzenle).
        const hamHtml = hamBuffer.toString('utf-8');
        htmlIcerik = htmlDuzenle(hamHtml);
        metinIcerik = htmldenMetneCevir(htmlIcerik);
      }
    }
  }

  const hashKaynagi = metinIcerik || (pdfBuffer ? pdfBuffer.toString('base64') : mevzuatId);
  const hash = crypto.createHash('md5').update(hashKaynagi).digest('hex');

  return { htmlIcerik: htmlIcerik.slice(0, 500000), metinIcerik, hash, pdfBuffer };
}

module.exports = { mevzuatGovAra, mevzuatIcerigiCek, htmlDuzenle, htmldenMetneCevir };
