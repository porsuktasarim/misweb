/**
 * mevzuat.icerik-bicimlendir.js
 *
 * mevzuat.gov.tr kaynagindan gelen HAM HTML'i, Turkce mevzuat yazim
 * kurallarina uygun, OKUNAKLI bir govdeye donusturur. mevzuat.gov-cek.js
 * bu modulu icerik cekme sirasinda kullanir.
 *
 * ISLEDIGI SORUNLAR (kullanicinin sirali geri bildirimine gore):
 *  1. Ust bilgi tablosu ("Kanun Numarası : 5488" gibi 4 satirlik blok):
 *     ilk ":" oncesi KALIN, varsa 2. ":" oncesindeki kelime(ler) İTALİK.
 *  2. Baslik (kanun/yonetmelik adi): tek satir, KALIN, biraz BUYUK.
 *  3. "MADDE 1", "EK MADDE 1- (Ek: ...)" gibi madde basliklari KALIN.
 *  4. Her maddenin oncesinde/sonrasinda BOSLUK (kendi <p> blogu).
 *  5. "a) ... b) ... c) ..." alt-madde (fikra) isaretleri AYRI SATIRDA -
 *     kaynakta hic ayirici OLMASA BILE.
 *  6. Bilinmeyen/bozuk etiketler (orn. kapanmamis <b>) temizlenir/onarilir.
 *
 * MIMARI: TEK BIRLESIK AYIRICI SISTEMI kullanilir. <br/> VE <p>/<div>
 * sinirlari AYRI AYRI islenip TEK bir "guclu/zayif kirilma yertutucusu"
 * formatina cevrilir; TUM orijinal p/div/br etiketleri SONRA silinir;
 * en son, kendi <p> sarmalayicilarimiz yertutuculardan insa edilir. Bu
 * sayede IC ICE <p> etiketleri gibi yapisal celiskiler olusmaz.
 */

const IZIN_VERILEN_ETIKETLER = ['b', 'i', 'strong', 'em', 'br', 'p', 'div', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th'];
const PARAGRAF_YERTUTUCU = '\u0000PARA\u0000';
const ZAYIF_YERTUTUCU = '\u0000WEAK\u0000';

// mevzuat.gov.tr kaynagi Turkce karakterleri SAYISAL (&#231;) veya
// ADLANDIRILMIS (&ccedil;) HTML varliklariyla kodluyor olabilir. Bunlar
// cozulmezse hem ekranda (tarayici otomatik cozer, sorun olmaz) HEM DE
// disa aktarma (Word/PDF - KENDI ayristirmamizi kullaniyoruz, tarayici
// YOK) sirasinda LITERAL "&#231;" gibi METIN olarak sizip KARAKTER
// HATALARINA yol aciyordu. Bu yuzden EN BASTA, tum varliklar cozulur.
const ADLANDIRILMIS_VARLIKLAR = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ccedil: 'ç', Ccedil: 'Ç', gcirc: 'ğ', Gcirc: 'Ğ', uuml: 'ü', Uuml: 'Ü',
  ouml: 'ö', Ouml: 'Ö', scedil: 'ş', Scedil: 'Ş', idot: 'ı', Idot: 'İ',
  szlig: 'ß', eacute: 'é', egrave: 'è', acirc: 'â', icirc: 'î', ucirc: 'û',
};

/** TUM HTML varliklarini (sayisal + adlandirilmis) GERCEK karaktere cevirir - AMA
 * &amp;/&lt;/&gt;/&quot; (YAPISAL, etiket ayrıştırmasını etkileyebilecek varlıklar)
 * HARIC - onlar yapisalVarliklariCoz ile SONRA (tum etiket islemleri bittikten
 * sonra) cozulur, aksi halde erken cozulen bir "&lt;" gercek "<" karakterine
 * donusup etiket-ayirma regex'lerimizi YANILTABILIRDI. */
function ozelKarakterOlmayanVarliklariCoz(metin) {
  const YAPISAL_KODLAR = new Set([38, 60, 62, 34]); // & < > "
  return metin
    .replace(/&#x([0-9a-fA-F]+);/g, (t, hex) => {
      const kod = parseInt(hex, 16);
      return YAPISAL_KODLAR.has(kod) ? t : String.fromCodePoint(kod);
    })
    .replace(/&#(\d+);/g, (t, dec) => {
      const kod = parseInt(dec, 10);
      return YAPISAL_KODLAR.has(kod) ? t : String.fromCodePoint(kod);
    })
    .replace(/&(nbsp|ccedil|Ccedil|gcirc|Gcirc|uuml|Uuml|ouml|Ouml|scedil|Scedil|idot|Idot|szlig|eacute|egrave|acirc|icirc|ucirc);/g,
      (t, ad) => (ad === 'nbsp' ? ' ' : ADLANDIRILMIS_VARLIKLAR[ad]));
}

/** YAPISAL varliklari (&amp; &lt; &gt; &quot; &apos;) cozer - SADECE tum etiket islemleri BITTIKTEN SONRA cagrilmali. */
function yapisalVarliklariCoz(metin) {
  return metin
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // EN SON - digerleri yanlislikla ikinci kez cozulmesin
}

/** (6) Beyaz listede OLMAYAN her etiketi (bilinmeyen/ozel) KALDIRIR - ic metni KORUR. */
function bilinmeyenEtiketleriTemizle(html) {
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (tamEslesme, etiketAdi) => (
    IZIN_VERILEN_ETIKETLER.includes(etiketAdi.toLowerCase()) ? tamEslesme : ''
  ));
}

/** (6) "<b>Amaç<b> ..." gibi KAPATILMAMIŞ b/i/strong ciftlerini onarir (2. acilisi kapanis sayar). */
function bozukEtiketleriOnar(html) {
  let onarilan = html;
  onarilan = onarilan.replace(/<b>([^<]*)<b>/gi, '<b>$1</b>');
  onarilan = onarilan.replace(/<i>([^<]*)<i>/gi, '<i>$1</i>');
  onarilan = onarilan.replace(/<strong>([^<]*)<strong>/gi, '<strong>$1</strong>');
  return onarilan;
}

function gucluKirilmaMi(sonrakiMetin) {
  const k = sonrakiMetin.trimStart();
  if (/^(MADDE|Madde|GEÇİCİ MADDE|Geçici Madde|EK MADDE|Ek Madde)\s/.test(k)) return true;
  if (/^(BİRİNCİ|İKİNCİ|ÜÇÜNCÜ|DÖRDÜNCÜ|BEŞİNCİ|ALTINCI|YEDİNCİ|SEKİZİNCİ|DOKUZUNCU|ONUNCU)\s+(BÖLÜM|KISIM)\b/.test(k)) return true;
  // "Kanun Numarası :" gibi UST BILGI satirlari da GERCEK kirilmadir
  if (/^[A-ZÇĞİÖŞÜ][^:{}<>]{2,70}:/.test(k)) return true;
  return false;
}

function zayifKirilmaMi(sonrakiMetin) {
  return /^[a-zçğıöşü]\)\s/.test(sonrakiMetin.trimStart());
}

/**
 * (1,2,5) Ham HTML'i TEMIZLER - sabit-genislik <br/>/bosluk artiklarini
 * kaldirir, gercek paragraf/alt-madde sinirlarini TEK bir yertutucu
 * sistemine cevirir, SONRA tum orijinal p/div/br etiketlerini siler.
 */
function htmlDuzenle(html) {
  let temiz = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // ONEMLI: YAPISAL OLMAYAN varliklar (Turkce karakterler vb.) EN BASTA
  // cozulur. YAPISAL olanlar (&amp; &lt; &gt; &quot;) ETIKET ISLEMLERI
  // BITENE KADAR ERTELENIR (bkz. fonksiyon yorumu).
  temiz = ozelKarakterOlmayanVarliklariCoz(temiz);

  temiz = bilinmeyenEtiketleriTemizle(temiz);
  temiz = bozukEtiketleriOnar(temiz);

  // --- 1) <br/> sinirlari -> yertutucu ---
  temiz = temiz.replace(/(?:<br\s*\/?>\s*){2,}/gi, PARAGRAF_YERTUTUCU);
  temiz = temiz.replace(/<br\s*\/?>\s*/gi, (eslesme, ofset, tumMetin) => {
    const sonrasi = tumMetin.slice(ofset + eslesme.length, ofset + eslesme.length + 70);
    if (gucluKirilmaMi(sonrasi)) return PARAGRAF_YERTUTUCU;
    if (zayifKirilmaMi(sonrasi)) return ZAYIF_YERTUTUCU;
    return ' ';
  });

  // --- 2) <p>/<div> SINIRLARI -> AYNI yertutucu sistemi (onceki blok
  // noktalamayla bitiyorsa VEYA sonraki blok guclu-kirilma oruntusune
  // uyuyorsa GERCEK sinir; degilse birlestir) ---
  temiz = temiz.replace(/<\/(p|div)>\s*<\1[^>]*>/gi, (eslesme, etiket, ofset, tumMetin) => {
    const oncekiMetin = tumMetin.slice(0, ofset).replace(/<[^>]+>/g, '').trimEnd();
    const sonKarakter = oncekiMetin.slice(-1);
    const noktalamaVarMi = ['.', ':', ';', '!', '?'].includes(sonKarakter);
    const sonrakiMetin = tumMetin.slice(ofset + eslesme.length, ofset + eslesme.length + 70).replace(/<[^>]+>/g, '');
    if (noktalamaVarMi || gucluKirilmaMi(sonrakiMetin)) return PARAGRAF_YERTUTUCU;
    return ' ';
  });

  // --- 3) ARTIK yapisal anlami TASINMIS olan TUM orijinal p/div/br
  // etiketlerini SIL (kendi <p> sarmalayicilarimizi biz kuracagiz) ---
  temiz = temiz.replace(/<\/?(p|div|br)\b[^>]*\/?>/gi, '');

  // --- 3b) Artik etiket-siniri regex'leri BITTIGI icin YAPISAL
  // varliklari (&amp; &lt; &gt; &quot;) GUVENLE cozebiliriz ---
  temiz = yapisalVarliklariCoz(temiz);

  // --- 4) (5) Alt-madde ("a) ... b) ...") isaretlerini AYRI SATIRA al -
  // kaynakta hic ayirici OLMASA BILE ---
  temiz = temiz.replace(/([,;:.]\s*)([a-zçğıöşü])\)(\s)/g, (tam, once, harf, sonra) => `${once}${ZAYIF_YERTUTUCU}${harf})${sonra}`);

  // --- 5) Yertutuculari GERCEK ayiricilara cevir ---
  temiz = temiz.split(PARAGRAF_YERTUTUCU).join('<br/><br/>');
  temiz = temiz.split(ZAYIF_YERTUTUCU).join('<br/>');

  temiz = temiz.replace(/[ \t]{2,}/g, ' ');
  temiz = temiz.replace(/ +([:.,;])/g, '$1');

  return temiz.trim();
}

/** (1) "Etiket : değer [Etiket2 : değer2]" satirini KALIN/İTALİK olarak bicimlendirir. */
function bilgiSatiriniBicimlendir(satir) {
  const parcalar = satir.split(':');
  if (parcalar.length < 2) return satir;

  let sonuc = `<b>${parcalar[0].trim()}</b>`;
  for (let i = 1; i < parcalar.length; i++) {
    const sonParca = i === parcalar.length - 1;
    if (sonParca) {
      sonuc += `: ${parcalar[i].trim()}`;
      continue;
    }
    const parca = parcalar[i];
    const etiketEslesme = parca.match(/([A-Za-zÇĞİÖŞÜçğıöşü]+(?:\s+[A-Za-zÇĞİÖŞÜçğıöşü]+)?)\s*$/);
    if (etiketEslesme) {
      const oncesi = parca.slice(0, etiketEslesme.index).trim();
      sonuc += `: ${oncesi ? oncesi + ' ' : ''}<i>${etiketEslesme[1]}</i>`;
    } else {
      sonuc += `: ${parca.trim()}`;
    }
  }
  return sonuc;
}

function duzMetneCevir(parca) {
  return parca.replace(/<[^>]+>/g, '').trim();
}

function bilgiSatiriMi(parca) {
  const duz = duzMetneCevir(parca);
  if (!duz.includes(':')) return false;
  if (duz.length > 200) return false;
  if (/^(MADDE|Madde|GEÇİCİ|Geçici|EK MADDE|Ek Madde)\s/.test(duz)) return false;
  return true;
}

function maddeMi(parca) {
  return /^(MADDE|Madde|GEÇİCİ MADDE|Geçici Madde|EK MADDE|Ek Madde)\b/.test(duzMetneCevir(parca));
}

function bolumBasligiMi(parca) {
  return /^(BİRİNCİ|İKİNCİ|ÜÇÜNCÜ|DÖRDÜNCÜ|BEŞİNCİ|ALTINCI|YEDİNCİ|SEKİZİNCİ|DOKUZUNCU|ONUNCU)\s+(BÖLÜM|KISIM)\b/.test(duzMetneCevir(parca));
}

/** (3) "MADDE 1 –" / "EK MADDE 1- (Ek: ...)" kismini (referans parantezi dahil) KALIN yapar. */
function maddeyiBicimlendir(parca) {
  return parca.replace(
    /^((?:MADDE|Madde|GEÇİCİ MADDE|Geçici Madde|EK MADDE|Ek Madde)\s*\d+\s*[-–—]?\s*(?:\([^)]*\)\s*)?)/,
    '<b>$1</b>'
  );
}

/**
 * (1,2,3,4) htmlDuzenle CIKTISINI, belge YAPISINA gore bicimlendirir:
 * baslik / ust-bilgi-tablosu / bolum-basligi / madde ayri ayri
 * islenip her biri kendi <p> blogunda (madde ONCESI/SONRASI bosluk
 * icin) dondurulur.
 */
function belgeYapisiniBicimlendir(temizHtml) {
  const parcalar = temizHtml.split('<br/><br/>').filter((p) => p.trim() !== '');
  if (parcalar.length === 0) return temizHtml;

  const sonuc = [];
  let baslikIslendi = false;
  let bilgiBlogundaMi = true;

  parcalar.forEach((parca) => {
    if (!baslikIslendi) {
      sonuc.push(`<p style="font-weight:700;font-size:1.15em;margin:0 0 .75em;">${parca}</p>`);
      baslikIslendi = true;
      return;
    }

    if (bilgiBlogundaMi && bilgiSatiriMi(parca)) {
      sonuc.push(`<p style="margin:.15em 0;">${bilgiSatiriniBicimlendir(parca)}</p>`);
      return;
    }
    bilgiBlogundaMi = false;

    if (bolumBasligiMi(parca)) {
      sonuc.push(`<p style="font-weight:700;margin:1.25em 0 .5em;">${parca}</p>`);
      return;
    }

    if (maddeMi(parca)) {
      sonuc.push(`<p style="margin:1em 0;">${maddeyiBicimlendir(parca)}</p>`);
      return;
    }

    sonuc.push(`<p style="margin:.35em 0;">${parca}</p>`);
  });

  return sonuc.join('');
}

/** Erken + geç varlık çözmeyi TEK seferde uygular - etiket ayrıştırması BİTMİŞ, düz metin üzerinde kullanım için (dışa aktarma modülleri gibi). */
function varliklariTamCoz(metin) {
  return yapisalVarliklariCoz(ozelKarakterOlmayanVarliklariCoz(metin));
}

module.exports = { htmlDuzenle, belgeYapisiniBicimlendir, varliklariTamCoz };
