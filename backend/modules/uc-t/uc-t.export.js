/**
 * uc-t.export.js
 *
 * 3T adimlarinin ürettigi resmi metinleri Word/PDF olarak disa
 * aktarir. Belge Ayarlari'ndan (imzaRengi, wordYaziTipi) OKUR - bu
 * degerler TUM ciktilarda TUTARLI kullanilir.
 *
 * HER BELGENIN SOL UST KOSESINDE "(Ek-X)" ETIKETI - imzaRengi ile.
 *
 * IKI FARKLI IMZA SEKLI:
 *  - 'tek'   : Duyuru (Ek-1), Tebliğ Belgesi (Ek-3) - SAYFANIN SAG
 *              (3.) SUTUNUNDA ORTALI: tarih -> 3 satir bosluk (2.
 *              satirda "İMZA", imzaRengi ile) -> Ad Soyad (kalin) ->
 *              Unvan -> "İl Mera Komisyonu Başkanı". Ad/Unvan, Adim
 *              1'de belirlenen GERCEK baskandan (Vali Yardimcisi/Il
 *              Muduru/Teknik Personel) gelir.
 *  - 'dortlu': Duyuru Tutanağı (Ek-2) - govde metninin SONUNDAKI
 *              "imza altına alınmıştır." cumlesine tarih DOGRUDAN
 *              EKLENIR (ayni cumle). Altta 4 ESIT SUTUN: imza cizgisi
 *              -> 1 satir bosluk -> "Adı Soyadı"/"Ünvanı" etiketleri
 *              (imzaRengi ile, BOS SABLON).
 */

const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
  Footer, PageNumber,
} = require('docx');
const PDFDocument = require('pdfkit');
const IlMeraKomisyonu = require('../personel/ilMeraKomisyonu.model');
const TeknikEkip = require('../personel/teknikEkip.model');
const belgeAyarlariService = require('../belge-ayarlari/belgeAyarlari.service');

const FONT_NORMAL = path.join(__dirname, '../reporting/sablonlar/fontlar/DejaVuSerif.ttf');
const FONT_KALIN = path.join(__dirname, '../reporting/sablonlar/fontlar/DejaVuSerif-Bold.ttf');

const UYELIK_DURUMU_METINLERI = { merkezBaskan: 'Merkez Mera Teknik Ekip Başkanı', ilceBaskan: 'İlçe Mera Teknik Ekip Başkanı', uye: 'Üye' };

/**
 * N kisiyi, MAKSIMUM 4 SUTUNLU satirlara dagitir (kullanicinin acik
 * kurali): kalan (N%4) 0 ise TUM satirlar 4'lu; kalan 1 ise SON satir
 * TEK kisilik olur (sola yaslanir - "orphan" gorunumunu onlemek icin
 * tam genislik yerine sola dayali kucuk bir kutu); kalan 2 VEYA 3 ise
 * O KISA satir EN BASA alinir, kalanlar 4'lu devam eder (orn. 7 kisi
 * -> [3,4], 4+3 DEGIL).
 */
function imzaSatirUzunluklariniHesapla(kisiSayisi) {
  const tamSatirSayisi = Math.floor(kisiSayisi / 4);
  const kalan = kisiSayisi % 4;
  if (kalan === 0) return Array(tamSatirSayisi).fill(4);
  if (kalan === 1) return [...Array(tamSatirSayisi).fill(4), 1];
  return [kalan, ...Array(tamSatirSayisi).fill(4)];
}

function kisileriSatirlaraDagit(kisiler) {
  const uzunluklar = imzaSatirUzunluklariniHesapla(kisiler.length);
  const satirlar = [];
  let index = 0;
  for (const uzunluk of uzunluklar) {
    satirlar.push(kisiler.slice(index, index + uzunluk));
    index += uzunluk;
  }
  return satirlar;
}

/** Adim 1'de (varsa) belirlenmis GERCEK baskanlik bilgisini (Vali Yardimcisi/Il Muduru/Teknik Personel) dondurur. */
function baskanlikBilgisiniBul(kayit) {
  const karar1Adim = kayit.surec.flatMap((a) => a.altAdimlar).find((a) => a.tip === 'ilMeraKomisyonuKarari');
  const b = karar1Adim?.veri?.baskanlik;
  if (b && b.adSoyad) return { adSoyad: b.adSoyad, unvan: b.unvan };
  return { adSoyad: '……………………………', unvan: '……………………………' };
}

/** (Ek-2) DUYURU TUTANAĞI icin export verisini, KAYITLI 3T verisinden YENIDEN uretir. */
async function duyuruTutanagiVerileriniOlustur(kayit, veri) {
  let komisyon = null;
  if (veri.komisyonId) komisyon = await IlMeraKomisyonu.findById(veri.komisyonId);
  const yil = komisyon ? komisyon.yil : '20..';

  const duyuruAdim = kayit.surec.flatMap((a) => a.altAdimlar).find((a) => a.tip === 'duyuru');
  const baslangicTarihi = duyuruAdim?.veri?.baslangicTarihi;
  const tarihGosterim = baslangicTarihi ? new Date(baslangicTarihi).toLocaleDateString('tr-TR') : `…/…/${yil}`;

  const kurumListesi = [...(veri.gonderimKurumlari || []), ...(veri.digerKurumlar ? [veri.digerKurumlar] : [])].join(', ') || '……………………………';

  // ONEMLI: tarih artik AYRI SATIR DEGIL - "imza altına alınmıştır."
  // cumlesinin HEMEN SONUNA eklenir (kullanicinin acik istegi).
  const govdeMetni = `4342 Sayılı Mera Kanunu'na göre ${kayit.il} İli ${kayit.ilce} İlçesi ${kayit.koyMahalle} Köyü/Mahallesi sınırları içerisinde bulunan mera / yaylak / kışlak / otlak / çayırların tespit ve tahdit çalışmalarına ${tarihGosterim} tarihinde başlanacağını belirten duyuru, 4342 Sayılı Mera Kanunu'nun 7 nci maddesi gereği …/…/${yil} ile …/…/${yil} tarihleri arasında ilan edilmek ve ${kurumListesi}'na asılmak üzere ${kayit.il} İli Mera Komisyonundan teslim alınıp, belirtilen tarihler arasında usulüne uygun şekilde ilan yapıldığını gösterir işbu tutanak tarafımızdan düzenlenerek imza altına alınmıştır. …../…../${yil}`;

  return { ekKodu: '(Ek-2)', baslik: 'DUYURU TUTANAĞI', govdeMetni, imzaTipi: 'dortlu' };
}

/** (Ek-1) DUYURU icin export verisini uretir. */
function duyuruVerileriniOlustur(kayit, veri) {
  const tarihGosterim = veri.baslangicTarihi ? new Date(veri.baslangicTarihi).toLocaleDateString('tr-TR') : '…/…/20….';
  const yil = veri.baslangicTarihi ? new Date(veri.baslangicTarihi).getFullYear() : '20..';
  const komisyonAdi = `${kayit.il} İl Mera Komisyonu`;

  // IKI AYRI PARAGRAF (govdeParagraflari dizisi olarak - Word'de HER
  // BIRI GERCEKTEN ayri bir Paragraph nesnesi olacak).
  const govdeParagraflari = [
    `4342 Sayılı Mera Kanunu gereği, ${tarihGosterim} tarihinde ${kayit.il} İli ${kayit.ilce} İlçesi ${kayit.koyMahalle} Köy/Mahallesinde ${komisyonAdi} Teknik Ekiplerince, mera, yaylak, kışlak, otlak, umuma ait çayırların tespit ve tahdit çalışmalarına başlanılacaktır.`,
    `4342 Sayılı Mera Kanunu'nun 7 nci maddesi gereği ilan olunur.`,
  ];

  const baskan = baskanlikBilgisiniBul(kayit);
  return {
    ekKodu: '(Ek-1)', baslik: 'DUYURU', govdeParagraflari,
    tarihSatiri: `…../…../${yil}`,
    imzaTipi: 'tek', imzaAdSoyad: baskan.adSoyad, imzaUnvan: baskan.unvan, imzaAltYazi: 'İl Mera Komisyonu Başkanı',
  };
}

/** (Ek-3) TEBLİĞ BELGESİ icin export verisini uretir - ARTIK USTTE ALICI BASLIGI YOK. */
function tebligBelgesiVerileriniOlustur(kayit, veri) {
  const duyuruAdim = kayit.surec.flatMap((a) => a.altAdimlar).find((a) => a.tip === 'duyuru');
  const tarih = duyuruAdim?.veri?.baslangicTarihi;
  const tarihGosterim = tarih ? new Date(tarih).toLocaleDateString('tr-TR') : '…/…/20….';
  const yil = tarih ? new Date(tarih).getFullYear() : '20..';
  const komisyonAdi = `${kayit.il} İl Mera Komisyonu`;

  const govdeParagraflari = [
    `4342 Sayılı Mera Kanunu gereği, ${tarihGosterim} tarihinde ${kayit.il} İli ${kayit.ilce} İlçesi ${kayit.koyMahalle} Köy/Mahallesinde ${komisyonAdi} Teknik Ekiplerince mera, yaylak, kışlak, otlak, umuma ait çayırların tespit ve tahdit çalışmalarına başlanacaktır.`,
    `4342 Sayılı Mera Kanunu'nun 7 nci maddesi gereği başlama tarihi ile çalışma yapılacak yeri bildiren alanlarda mevcut mera, yaylak, kışlak, otlak ve umuma ait çayır alanları mevcut ise bu alanların durumunu belirten bilgi ve belgelerin, 4342 sayılı Mera Kanunu'nun 8 inci maddesi gereği tebliğden itibaren otuz gün içerisinde Komisyonumuza teslim edilmesi tebliğ olunur.`,
  ];

  const baskan = baskanlikBilgisiniBul(kayit);
  return {
    ekKodu: '(Ek-3)', baslik: 'TEBLİĞ BELGESİ', govdeParagraflari,
    tarihSatiri: `…../…../${yil}`,
    imzaTipi: 'tek', imzaAdSoyad: baskan.adSoyad, imzaUnvan: baskan.unvan, imzaAltYazi: 'İl Mera Komisyonu Başkanı',
    altNot: 'Ek: Mera, Yaylak, Kışlak, Otlak, Umuma ait Çayır Bilgi Cetveli (Ek-3/a)',
  };
}

/** (Ek-3/a) BİLGİ CETVELİ icin export verisini uretir - IMZASIZ (cetvel/tablo formati). */
async function ek3aVerileriniOlustur(kayit, veri) {
  const t = veri.hayvanVarligiTablosu;
  const hucre = (h) => (h && h.adet > 0 ? `${h.adet} adet (${h.bbhb.toFixed(2)} BBHB)` : '-');

  // Imza: "Komisyon ve Teknik Ekip Secimi" on-adiminda SECILEN Teknik
  // Ekip'in GERCEK uyeleri - digerlerindeki AYNI imza kurallariyla
  // (bosluk+"İMZA" gri+bosluk+Ad Soyad kalin+Unvan) N SUTUN halinde.
  const kteAdim = kayit.surec.flatMap((a) => a.altAdimlar).find((a) => a.tip === 'komisyonTeknikEkipSecimi');
  let imzaKisileri = [];
  if (kteAdim?.veri?.teknikEkipId) {
    const ekip = await TeknikEkip.findById(kteAdim.veri.teknikEkipId);
    if (ekip) {
      imzaKisileri = ekip.uyeler.map((u) => ({
        adSoyad: u.adSoyad,
        unvan: u.unvan || '',
        kurum: u.imzaKurumMetni || '',
        uyelikDurumu: UYELIK_DURUMU_METINLERI[u.uyelikDurumu] || UYELIK_DURUMU_METINLERI.uye,
      }));
    }
  }

  const yararlanma = [...(veri.yararlanmaSekilleri || []), ...(veri.digerYararlanmaSekli ? [veri.digerYararlanmaSekli] : [])].join(', ') || '……………………………';

  const madde7Tablosu = {
    basliklar: ['Cinsi', 'Miktarı Dekar', 'Parça Adedi', 'Mevki', 'Diğer Bilgiler (Kime Ait Olduğu, Nizalılık Durumu)'],
    // Mera Modulu'nde SECILEN parseller uzerinden HESAPLANMIS satirlar
    // VARSA (uc-t.service.js -> ek3aAraziVerileriKaydet) ONLAR
    // KULLANILIR - YOKSA (henuz parsel secilmemisse) BOS satirlar.
    satirlar: veri.madde7Satirlari || ['Mera', 'Yaylak', 'Kışlak', 'Otlak', 'Çayır'].map((c) => [c, '', '', '', '']),
  };
  const madde8Tablosu = {
    basliklar: ['', 'Kültür', 'Kültür Melezi', 'Yerli'],
    satirlar: t
      ? [
          ['Büyükbaş', hucre(t.buyukbas.kultur), hucre(t.buyukbas.kulturMelezi), hucre(t.buyukbas.yerli)],
          ['Küçükbaş', hucre(t.kucukbas.kultur), hucre(t.kucukbas.kulturMelezi), hucre(t.kucukbas.yerli)],
          ['Diğerleri', hucre(t.digerleri.kultur), hucre(t.digerleri.kulturMelezi), hucre(t.digerleri.yerli)],
        ]
      : [['Büyükbaş', '', '', ''], ['Küçükbaş', '', '', ''], ['Diğerleri', '', '', '']],
  };

  // SIRALI icerik: paragraflarla tablolar MADDELERIN ARASINA GIRECEK
  // sekilde (madde 7'den hemen sonra tablosu, madde 8'den hemen
  // sonra tablosu) TEK bir dizide tutulur.
  const icerikParcalari = [
    { tip: 'paragraf', metin: 'Tespit ve Tahdit Çalışması Yapılacak Alanın :' },
    { tip: 'paragraf', metin: `1. İli: ${kayit.il}` },
    { tip: 'paragraf', metin: `2. İlçesi: ${kayit.ilce}` },
    { tip: 'paragraf', metin: `3. Mahalle: ${kayit.koyMahalle}` },
    { tip: 'paragraf', metin: `4. Köyü: ${kayit.koyMahalle}` },
    { tip: 'paragraf', metin: `5. Aile Sayısı: ${veri.aileSayisi ?? '……'}` },
    { tip: 'paragraf', metin: `6. Çiftçi Aile Sayısı: ${veri.ciftciAileSayisi ?? '……'}` },
    { tip: 'paragraf', metin: `7. Arazinin:` },
    { tip: 'tablo', ...madde7Tablosu },
    { tip: 'paragraf', metin: `8. Mevcut Hayvan Varlığı: Hayvan sayıları ayrıntılı olarak belirtilecek` },
    { tip: 'tablo', ...madde8Tablosu },
    { tip: 'paragraf', metin: `9. Kullanılan Alanlardan Yararlanma Şekli: ${yararlanma}` },
    { tip: 'paragraf', metin: `10. Harita, Kroki, Pafta ve Ellerinde Mevcut Diğer Bilgiler: ${veri.secilenParselIdleri && veri.secilenParselIdleri.length ? `Ekte sunulan ${veri.secilenParselIdleri.length} adet Mera Kimliği belgesinde yer almaktadır.` : '……………………………'}` },
    { tip: 'paragraf', metin: `11. 5 inci Maddedeki Şartları Taşıyıp Taşımadığı ile İlgili Belgeler: ${veri.madde11Notu || '……'}` },
    { tip: 'paragraf', metin: `12. Kullanılan Alanlardan Yararlanma Miktar ve Şekli: ${veri.madde12Metni || '……'}` },
  ];

  return {
    ekKodu: '(Ek-3/a)',
    altBaslik: `Mera Kanunu'nun 8 inci Maddesi Gereği`,
    baslik: 'MERA, YAYLAK, KIŞLAK, OTLAK, ÇAYIR BİLGİ CETVELİ',
    icerikParcalari,
    imzaTipi: imzaKisileri.length ? 'cokluKisi' : undefined,
    imzaKisileri,
    sayfaAltbilgisi: '(Ek-3/A)',
  };
}

/** Adim TIPINE gore dogru veri-uretici fonksiyonu cagirir + Belge Ayarlarini ekler. */
async function adimDisaAktarVerisi(kayit, alt) {
  let v;
  if (alt.tip === 'duyuruTutanagi') v = await duyuruTutanagiVerileriniOlustur(kayit, alt.veri || {});
  else if (alt.tip === 'duyuru') v = duyuruVerileriniOlustur(kayit, alt.veri || {});
  else if (alt.tip === 'tebligBelgesi') v = tebligBelgesiVerileriniOlustur(kayit, alt.veri || {});
  else if (alt.tip === 'ek3aBilgiCetveli') v = await ek3aVerileriniOlustur(kayit, alt.veri || {});
  else throw new Error('Bu adım için dışa aktarma henüz desteklenmiyor.');

  const ayarlar = await belgeAyarlariService.ayarlariGetir();
  v.imzaRengi = ayarlar.imzaRengi;
  v.wordYaziTipi = ayarlar.wordYaziTipi;
  return v;
}

// ============ WORD ============

/** 1.5 satir araligi (docx'te 360=1.5x, 240=1x) TUM paragraflara UYGULANIR. */
function pOlustur(opsiyonlar) {
  const { spacing, ...gerisi } = opsiyonlar;
  return new Paragraph({ ...gerisi, spacing: { line: 360, lineRule: 'auto', ...(spacing || {}) } });
}

async function adimBelgesiWordOlustur(v) {
  const yaziTipi = v.wordYaziTipi || 'Times New Roman';
  const imzaRengiHex = (v.imzaRengi || '#999999').replace('#', '');
  const cocuklar = [];

  if (v.ekKodu) {
    cocuklar.push(pOlustur({ spacing: { after: 200 }, children: [new TextRun({ text: v.ekKodu, color: imzaRengiHex, size: 20, font: yaziTipi })] }));
  }

  if (v.aliciBasligi) {
    v.aliciBasligi.split('\n').forEach((satir) => {
      cocuklar.push(pOlustur({ spacing: { after: 40 }, children: [new TextRun({ text: satir, size: 22, font: yaziTipi })] }));
    });
    cocuklar.push(pOlustur({ text: '', spacing: { after: 200 } }));
  }

  if (v.altBaslik) {
    cocuklar.push(pOlustur({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: v.altBaslik, bold: true, size: 24, font: yaziTipi })] }));
  }
  cocuklar.push(pOlustur({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: v.baslik, bold: true, size: 28, font: yaziTipi })] }));

  // GOVDE: icerikParcalari VARSA (paragraf+tablo KARISIK SIRALI -
  // orn. Ek-3/a) onu, YOKSA eski govdeParagraflari/govdeMetni
  // (SADECE paragraf - Duyuru/Tebliğ/Duyuru Tutanağı) kullanilir.
  // HER PARAGRAF GERCEKTEN AYRI Paragraph nesnesi (docx.js metin
  // icindeki \n karakterini paragraf saymiyor).
  const kenarli = { style: BorderStyle.SINGLE, size: 2, color: '999999' };
  const kenarlikSeti = { top: kenarli, bottom: kenarli, left: kenarli, right: kenarli };
  const tabloOlustur = (tablo) => {
    const genislik = Math.floor(100 / tablo.basliklar.length);
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: tablo.basliklar.map((b) => new TableCell({
          width: { size: genislik, type: WidthType.PERCENTAGE }, borders: kenarlikSeti, shading: { fill: 'F2F2F2' },
          children: [pOlustur({ children: [new TextRun({ text: b, bold: true, size: 16, font: yaziTipi })] })],
        })) }),
        ...tablo.satirlar.map((satir) => new TableRow({ children: satir.map((h) => new TableCell({
          width: { size: genislik, type: WidthType.PERCENTAGE }, borders: kenarlikSeti,
          children: [pOlustur({ children: [new TextRun({ text: h, size: 16, font: yaziTipi })] })],
        })) })),
      ],
    });
  };

  if (v.icerikParcalari) {
    v.icerikParcalari.forEach((parca) => {
      if (parca.tip === 'paragraf') {
        cocuklar.push(pOlustur({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 200 }, children: [new TextRun({ text: parca.metin, size: 22, font: yaziTipi })] }));
      } else if (parca.tip === 'tablo') {
        cocuklar.push(tabloOlustur(parca));
        cocuklar.push(pOlustur({ text: '', spacing: { after: 150 } }));
      }
    });
  } else {
    const paragraflar = v.govdeParagraflari || (v.govdeMetni ? [v.govdeMetni] : []);
    paragraflar.forEach((p) => {
      cocuklar.push(pOlustur({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 300 }, children: [new TextRun({ text: p, size: 22, font: yaziTipi })] }));
    });
  }

  const hucreKenarsiz = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

  if (v.imzaTipi === 'tek') {
    // Duyuru/Tebliğ Belgesi: SAG (3.) SUTUNDA ORTALI - tarih + 3 satir
    // (2.sinde "İMZA") + Ad Soyad + Unvan + "İl Mera Komisyonu Başkanı".
    const bosHucre = () => new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, borders: hucreKenarsiz, children: [pOlustur({ text: '' })] });
    const sagSutunParagraflari = [
      pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.tarihSatiri || '', size: 22, font: yaziTipi })] }),
      pOlustur({ text: '' }),
      pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'İMZA', color: imzaRengiHex, size: 20, font: yaziTipi })] }),
      pOlustur({ text: '' }),
      pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.imzaAdSoyad, bold: true, size: 22, font: yaziTipi })] }),
      pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.imzaUnvan, size: 22, font: yaziTipi })] }),
      pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v.imzaAltYazi, size: 22, font: yaziTipi })] }),
    ];
    cocuklar.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: [bosHucre(), bosHucre(), new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, borders: hucreKenarsiz, children: sagSutunParagraflari })] })],
    }));
  } else if (v.imzaTipi === 'dortlu') {
    // Duyuru Tutanağı: 4 ESIT SUTUN - CIZGI YOK, "İMZA" yazisi +
    // "Adı Soyadı"/"Ünvanı" etiketleri (BOS SABLON, hepsi imzaRengi).
    const imzaSutunHucresi = () => new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE }, borders: hucreKenarsiz,
      children: [
        pOlustur({ text: '' }),
        pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'İMZA', size: 18, color: imzaRengiHex, font: yaziTipi })] }),
        pOlustur({ text: '' }),
        pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Adı Soyadı', size: 18, color: imzaRengiHex, font: yaziTipi })] }),
        pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ünvanı', size: 18, color: imzaRengiHex, font: yaziTipi })] }),
      ],
    });
    cocuklar.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [imzaSutunHucresi(), imzaSutunHucresi(), imzaSutunHucresi(), imzaSutunHucresi()] })] }));
  } else if (v.imzaTipi === 'cokluKisi' && v.imzaKisileri?.length) {
    // Ek-3/a: Teknik Ekip UYELERI - MAKSIMUM 4 SUTUN, satirlar
    // DENGELENIR (imzaSatirUzunluklariniHesapla), her kutuda 4 satir
    // (Ad Soyad/Unvan/Kurum/Uyelik Durumu) TEK SATIRA sigacak, AYNI
    // TURDEKI (orn. tum Ad Soyad'lar) TUM kutularda AYNI boyutta.
    const EN_DAR_SUTUN_TWIP = 9638 / 4; // 4'lu satirdaki sutun genisligi (A4, 1134 twip kenar bosluklu)
    const wordBoyutHesapla = (metinler, baslangic = 20, minimum = 12) => {
      const enUzun = Math.max(...metinler.map((m) => (m || '').length), 1);
      let yp = baslangic;
      while (yp > minimum) {
        if (enUzun * yp * 5 <= EN_DAR_SUTUN_TWIP) return yp;
        yp -= 2;
      }
      return minimum;
    };
    const adSoyadBoyutu = wordBoyutHesapla(v.imzaKisileri.map((k) => k.adSoyad), 22, 14);
    const unvanBoyutu = wordBoyutHesapla(v.imzaKisileri.map((k) => k.unvan), 20, 12);
    const kurumBoyutu = wordBoyutHesapla(v.imzaKisileri.map((k) => k.kurum), 18, 11);
    const uyelikBoyutu = wordBoyutHesapla(v.imzaKisileri.map((k) => k.uyelikDurumu), 18, 11);

    const kisiHucresi = (kisi, genislikYuzde) => new TableCell({
      width: { size: genislikYuzde, type: WidthType.PERCENTAGE }, borders: hucreKenarsiz,
      children: [
        pOlustur({ text: '' }),
        pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'İMZA', size: 16, color: imzaRengiHex, font: yaziTipi })] }),
        pOlustur({ text: '' }),
        pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: kisi.adSoyad, bold: true, size: adSoyadBoyutu, font: yaziTipi })] }),
        pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: kisi.unvan || '', size: unvanBoyutu, font: yaziTipi })] }),
        pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: kisi.kurum || '', size: kurumBoyutu, font: yaziTipi })] }),
        pOlustur({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: kisi.uyelikDurumu || '', size: uyelikBoyutu, font: yaziTipi })] }),
      ],
    });

    kisileriSatirlaraDagit(v.imzaKisileri).forEach((satirKisileri) => {
      if (satirKisileri.length === 1) {
        // TEK kisi kalan satir SOLA YASLANIR (tam genislige gerilmez).
        cocuklar.push(new Table({
          width: { size: 25, type: WidthType.PERCENTAGE },
          alignment: AlignmentType.LEFT,
          rows: [new TableRow({ children: [kisiHucresi(satirKisileri[0], 100)] })],
        }));
      } else {
        const genislikYuzde = Math.floor(100 / satirKisileri.length);
        cocuklar.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({ children: satirKisileri.map((k) => kisiHucresi(k, genislikYuzde)) })],
        }));
      }
    });
  }

  if (v.altNot) {
    cocuklar.push(pOlustur({ spacing: { before: 400 }, children: [new TextRun({ text: v.altNot, italics: true, size: 20, font: yaziTipi })] }));
  }

  const footerAyarlari = v.sayfaAltbilgisi ? {
    default: new Footer({
      children: [pOlustur({ children: [
        new TextRun({ text: `${v.sayfaAltbilgisi} | `, size: 16, font: yaziTipi }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, font: yaziTipi }),
        new TextRun({ text: '/', size: 16, font: yaziTipi }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: yaziTipi }),
      ] })],
    }),
  } : undefined;

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      footers: footerAyarlari,
      children: cocuklar,
    }],
  });
  return Packer.toBuffer(doc);
}

// ============ PDF ============

function adimBelgesiPdfOlustur(v) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 }, bufferPages: true });
    const parcalar = [];
    doc.on('data', (c) => parcalar.push(c));
    doc.on('end', () => resolve(Buffer.concat(parcalar)));
    doc.on('error', reject);

    doc.registerFont('normal', FONT_NORMAL);
    doc.registerFont('kalin', FONT_KALIN);
    const imzaRengi = v.imzaRengi || '#999999';
    const SATIR_ARALIGI = { lineGap: 5 }; // ~1.5 satir araligi yaklasik degeri

    if (v.ekKodu) {
      doc.fillColor(imzaRengi).font('normal').fontSize(10).text(v.ekKodu, { align: 'left' });
      doc.fillColor('#000000');
      doc.moveDown(0.5);
    }

    if (v.aliciBasligi) {
      doc.font('normal').fontSize(10).text(v.aliciBasligi, SATIR_ARALIGI);
      doc.moveDown(1);
    }

    doc.font('kalin').fontSize(13);
    if (v.altBaslik) { doc.text(v.altBaslik, { align: 'center' }); doc.moveDown(0.3); }
    doc.text(v.baslik, { align: 'center' });
    doc.moveDown(1);

    const sayfaGenisligi = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    /** Basit kenarlikli tablo cizer (pdfkit'te native tablo yok - manuel dikdortgen+metin). */
    function pdfTabloCiz(tablo) {
      const sutunSayisi = tablo.basliklar.length;
      const sutunGenisligi = sayfaGenisligi / sutunSayisi;
      const satirYuksekligi = 22;
      doc.font('kalin').fontSize(8);
      const baslangicX = doc.page.margins.left;
      let y = doc.y;

      const satirCiz = (hucreler, kalinMi) => {
        if (y + satirYuksekligi > doc.page.height - doc.page.margins.bottom) { doc.addPage(); y = doc.page.margins.top; }
        doc.font(kalinMi ? 'kalin' : 'normal').fontSize(8);
        hucreler.forEach((h, i) => {
          const x = baslangicX + i * sutunGenisligi;
          doc.rect(x, y, sutunGenisligi, satirYuksekligi).stroke('#999999');
          doc.fillColor('#000000').text(h, x + 3, y + 6, { width: sutunGenisligi - 6, height: satirYuksekligi - 6, ellipsis: true });
        });
        y += satirYuksekligi;
      };

      satirCiz(tablo.basliklar, true);
      tablo.satirlar.forEach((satir) => satirCiz(satir, false));
      // ONEMLI: doc.text() son hucrenin DAR genisligini/x konumunu
      // "hatirlar" - SIFIRLANMAZSA sonraki paragraflar o dar sutuna
      // SIKISMIS gibi gorunur. Hem x hem y ACIKCA sifirlanir.
      doc.x = doc.page.margins.left;
      doc.y = y + 8;
    }

    if (v.icerikParcalari) {
      v.icerikParcalari.forEach((parca) => {
        if (parca.tip === 'paragraf') {
          doc.font('normal').fontSize(10).text(parca.metin, doc.page.margins.left, doc.y, { width: sayfaGenisligi, align: 'justify', ...SATIR_ARALIGI });
          doc.moveDown(0.7);
        } else if (parca.tip === 'tablo') {
          pdfTabloCiz(parca);
        }
      });
    } else {
      const paragraflar = v.govdeParagraflari || (v.govdeMetni ? [v.govdeMetni] : []);
      doc.font('normal').fontSize(10);
      paragraflar.forEach((p) => {
        doc.text(p, { align: 'justify', ...SATIR_ARALIGI });
        doc.moveDown(1);
      });
    }

    if (v.imzaTipi === 'tek') {
      // SAG (3.) SUTUNDA ORTALI: tarih + 3 satir (2.sinde İMZA) + Ad
      // Soyad + Unvan + rol.
      const sutunGenisligi = sayfaGenisligi / 3;
      const sagSutunX = doc.page.margins.left + sutunGenisligi * 2;
      doc.font('normal').fontSize(10).text(v.tarihSatiri || '', sagSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
      doc.moveDown(1);
      doc.fillColor(imzaRengi).text('İMZA', sagSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
      doc.fillColor('#000000');
      doc.moveDown(1);
      doc.font('kalin').text(v.imzaAdSoyad, sagSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
      doc.font('normal').text(v.imzaUnvan, sagSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
      doc.text(v.imzaAltYazi, sagSutunX, doc.y, { width: sutunGenisligi, align: 'center' });
    } else if (v.imzaTipi === 'dortlu') {
      // Duyuru Tutanağı: 4 ESIT SUTUN - CIZGI YOK, "İMZA" yazisi +
      // "Adı Soyadı"/"Ünvanı" etiketleri (BOS SABLON, imzaRengi).
      doc.moveDown(1.5);
      const sutunGenisligi = sayfaGenisligi / 4;
      const baslangicY = doc.y;
      doc.fillColor(imzaRengi).font('normal').fontSize(9);
      for (let i = 0; i < 4; i++) {
        const x = doc.page.margins.left + i * sutunGenisligi;
        doc.text('İMZA', x, baslangicY, { width: sutunGenisligi, align: 'center' });
      }
      doc.fontSize(8);
      for (let i = 0; i < 4; i++) {
        const x = doc.page.margins.left + i * sutunGenisligi;
        doc.text('Adı Soyadı', x, baslangicY + 30, { width: sutunGenisligi, align: 'center' });
        doc.text('Ünvanı', x, baslangicY + 42, { width: sutunGenisligi, align: 'center' });
      }
      doc.fillColor('#000000');
    } else if (v.imzaTipi === 'cokluKisi' && v.imzaKisileri?.length) {
      // Ek-3/a: Teknik Ekip UYELERI - MAKSIMUM 4 SUTUN, satirlar
      // DENGELENIR, her kutuda 4 satir (Ad Soyad/Unvan/Kurum/Uyelik
      // Durumu) GERCEK doc.widthOfString OLCUMUYLE tek satira
      // sigacak sekilde kucultulur - AYNI TURDEKI TUM kutularda AYNI
      // boyut kullanilir (en dar - 4'lu satirdaki - sutun baz alinir).
      doc.moveDown(1.5);
      const enDarSutunGenisligi = sayfaGenisligi / 4;
      const pdfBoyutBul = (metinler, baslangic, minimum, fontAdi) => {
        let boyut = baslangic;
        const kenarBosluk = 6;
        while (boyut > minimum) {
          doc.font(fontAdi).fontSize(boyut);
          const hepsiSigiyor = metinler.every((m) => doc.widthOfString(m || '') <= enDarSutunGenisligi - kenarBosluk);
          if (hepsiSigiyor) return boyut;
          boyut -= 0.5;
        }
        return minimum;
      };
      const adSoyadBoyutu = pdfBoyutBul(v.imzaKisileri.map((k) => k.adSoyad), 10, 6, 'kalin');
      const unvanBoyutu = pdfBoyutBul(v.imzaKisileri.map((k) => k.unvan), 9, 5.5, 'normal');
      const kurumBoyutu = pdfBoyutBul(v.imzaKisileri.map((k) => k.kurum), 8, 5, 'normal');
      const uyelikBoyutu = pdfBoyutBul(v.imzaKisileri.map((k) => k.uyelikDurumu), 8, 5, 'normal');

      kisileriSatirlaraDagit(v.imzaKisileri).forEach((satirKisileri) => {
        const tekKisiSolaYasli = satirKisileri.length === 1;
        const sutunGenisligi = tekKisiSolaYasli ? enDarSutunGenisligi : sayfaGenisligi / satirKisileri.length;
        const baslangicY = doc.y;
        satirKisileri.forEach((kisi, i) => {
          const x = doc.page.margins.left + i * sutunGenisligi;
          const hizalama = tekKisiSolaYasli ? 'left' : 'center';
          doc.fillColor(imzaRengi).font('normal').fontSize(8).text('İMZA', x, baslangicY, { width: sutunGenisligi, align: hizalama });
          doc.fillColor('#000000');
          doc.font('kalin').fontSize(adSoyadBoyutu).text(kisi.adSoyad, x, baslangicY + 22, { width: sutunGenisligi, align: hizalama });
          doc.font('normal').fontSize(unvanBoyutu).text(kisi.unvan || '', x, baslangicY + 22 + adSoyadBoyutu + 3, { width: sutunGenisligi, align: hizalama });
          doc.fontSize(kurumBoyutu).text(kisi.kurum || '', x, baslangicY + 22 + adSoyadBoyutu + 3 + unvanBoyutu + 2, { width: sutunGenisligi, align: hizalama });
          doc.fontSize(uyelikBoyutu).text(kisi.uyelikDurumu || '', x, baslangicY + 22 + adSoyadBoyutu + 3 + unvanBoyutu + 2 + kurumBoyutu + 2, { width: sutunGenisligi, align: hizalama });
        });
        doc.x = doc.page.margins.left;
        doc.y = baslangicY + 22 + adSoyadBoyutu + unvanBoyutu + kurumBoyutu + uyelikBoyutu + 20;
      });
    }

    if (v.altNot) {
      doc.moveDown(3);
      doc.font('normal').fontSize(9).text(v.altNot);
    }

    if (v.sayfaAltbilgisi) {
      const sayfaAraligi = doc.bufferedPageRange();
      const eskiAltMarj = doc.page.margins.bottom;
      for (let i = 0; i < sayfaAraligi.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0; // doc.text()'in "sayfada yer yok" diye YENI SAYFA ACMASINI ENGELLER
        doc.font('normal').fontSize(8).fillColor('#666666')
          .text(`${v.sayfaAltbilgisi} | ${i + 1}/${sayfaAraligi.count}`, doc.page.margins.left, doc.page.height - eskiAltMarj + 15, { width: sayfaGenisligi, align: 'left', lineBreak: false });
        doc.fillColor('#000000');
        doc.page.margins.bottom = eskiAltMarj;
      }
    }

    doc.end();
  });
}

module.exports = { adimDisaAktarVerisi, adimBelgesiWordOlustur, adimBelgesiPdfOlustur };
