/**
 * ekgb.excel.exporter.js
 *
 * EKGB raporu - TEK SAYFA (worksheet), icinde bir sayfa sonu (page break)
 * ile "Hesap" ve "Açıklamalar" bolumleri ayrilir. Boylece yazdirirken
 * tek is olarak (ayri sekmeler secmeden) cikar.
 *
 * - Kenar bosluklari: 1cm (sag/sol/ust/alt)
 * - Alt kenar boslugunda footer: ust satir konum bilgisi, alt satir
 *   sayfa numarasi (1/2, 2/2)
 * - Izgara cizgileri KAPALI (temiz gorunum)
 * - Imza blogu: cerceve YOK, "İMZA" %20 saydamlik benzeri acik gri
 *   filigran metni ad-soyaddan once; TEK imzaci solA yasli, BIRDEN
 *   FAZLA imzaci esit sutunlara bolunup ORTALANIR
 */

const ExcelJS = require('exceljs');

const RENK = {
  koyu: 'FF3F3F3C',
  orta: 'FF6E6E68',
  seritKoyu: 'FFF4F4F2',
  toplam: 'FFDCDCD7',
  imzaFiligran: 'FFCCCCCC', // ~%20 siyah opaklik beyaz zemin uzerinde
};
const YAZI_TIPI = 'Times New Roman';
const BIR_CM_INC = 1 / 2.54;
const AC_SUTUN = 6;

function hucreStil(hucre, { fill, bold = false, renkBeyaz = false, align = 'left', boyut = 9, renk } = {}) {
  hucre.font = { name: YAZI_TIPI, size: boyut, bold, color: { argb: renk || (renkBeyaz ? 'FFFFFFFF' : 'FF1C1E1B') } };
  if (fill) hucre.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  hucre.alignment = { vertical: 'middle', horizontal: align, wrapText: true };
}

function baslikSatiriEkle(sheet, metin, { boyut = 12 } = {}) {
  const row = sheet.addRow([metin]);
  sheet.mergeCells(`A${row.number}:${sheet.getColumn(AC_SUTUN).letter}${row.number}`);
  hucreStil(row.getCell(1), { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'center', boyut });
  row.height = 22;
  return row;
}

function altBaslikEkle(sheet, metin) {
  const row = sheet.addRow([metin]);
  sheet.mergeCells(`A${row.number}:${sheet.getColumn(AC_SUTUN).letter}${row.number}`);
  hucreStil(row.getCell(1), { fill: RENK.orta, bold: true, renkBeyaz: true, boyut: 10 });
  return row;
}

function kalemTablosuEkle(sheet, kalemler, sutunBasliklari) {
  const baslikRow = sheet.addRow(sutunBasliklari);
  baslikRow.eachCell((h) => hucreStil(h, { fill: RENK.seritKoyu, bold: true, align: 'center' }));
  for (const k of kalemler) {
    const row = sheet.addRow([k.ad, k.aciklama || '', k.birimFiyat !== undefined ? k.birimFiyat : '', k.maliyet]);
    row.eachCell((h, i) => hucreStil(h, { align: i === 4 ? 'right' : 'left' }));
  }
}

function toplamSatiriEkle(sheet, etiket, deger) {
  const row = sheet.addRow([etiket, '', '', deger]);
  row.eachCell((h) => hucreStil(h, { fill: RENK.toplam, bold: true, align: 'right' }));
  sheet.mergeCells(`A${row.number}:C${row.number}`);
  row.getCell(1).alignment = { horizontal: 'left' };
  return row;
}

/** Tohum orani/gubre miktari bilgisinden okunabilir aciklama metni kurar */
function detayAciklamaOlustur(k) {
  if (k.oran !== undefined) return `${(k.oran * 100).toFixed(0)}% karışım, ${k.miktarKgDa} kg/da`;
  if (k.miktarKgDa !== undefined && k.yilCarpani !== undefined) return `${k.miktarKgDa} kg/da × ${k.yilCarpani} yıl`;
  return k.aciklama || '';
}

function imzaBlokuEkle(sheet, imzacilarGirdi) {
  const imzacilar = imzacilarGirdi && imzacilarGirdi.length > 0 ? imzacilarGirdi : [{ adSoyad: '', unvan: '' }];
  const tekKisi = imzacilar.length === 1;

  const filigranRow = sheet.addRow([]);
  const adRow = sheet.addRow([]);
  const unvanRow = sheet.addRow([]);
  filigranRow.height = 26;

  if (tekKisi) {
    // Sola yasli, tam genislik degil - sadece ilk 2 sutun
    hucreStil(filigranRow.getCell(1), { renk: RENK.imzaFiligran, bold: true, boyut: 14, align: 'left' });
    filigranRow.getCell(1).value = 'İMZA';
    hucreStil(adRow.getCell(1), { bold: true, align: 'left' });
    adRow.getCell(1).value = imzacilar[0].adSoyad || '';
    hucreStil(unvanRow.getCell(1), { align: 'left' });
    unvanRow.getCell(1).value = imzacilar[0].unvan || '';
    return;
  }

  // Birden fazla imzaci: AC_SUTUN'u N esit parcaya bol, her parcada ORTALA
  const n = imzacilar.length;
  imzacilar.forEach((imzaci, i) => {
    const baslaSutun = Math.floor((i * AC_SUTUN) / n) + 1;
    const bitisSutun = Math.floor(((i + 1) * AC_SUTUN) / n);
    const baslaHarf = sheet.getColumn(baslaSutun).letter;
    const bitisHarf = sheet.getColumn(Math.max(bitisSutun, baslaSutun)).letter;

    if (bitisHarf !== baslaHarf) sheet.mergeCells(`${baslaHarf}${filigranRow.number}:${bitisHarf}${filigranRow.number}`);
    hucreStil(filigranRow.getCell(baslaSutun), { renk: RENK.imzaFiligran, bold: true, boyut: 14, align: 'center' });
    filigranRow.getCell(baslaSutun).value = 'İMZA';

    if (bitisHarf !== baslaHarf) sheet.mergeCells(`${baslaHarf}${adRow.number}:${bitisHarf}${adRow.number}`);
    hucreStil(adRow.getCell(baslaSutun), { bold: true, align: 'center' });
    adRow.getCell(baslaSutun).value = imzaci.adSoyad || '';

    if (bitisHarf !== baslaHarf) sheet.mergeCells(`${baslaHarf}${unvanRow.number}:${bitisHarf}${unvanRow.number}`);
    hucreStil(unvanRow.getCell(baslaSutun), { align: 'center' });
    unvanRow.getCell(baslaSutun).value = imzaci.unvan || '';
  });
}

function footerAyarla(sheet, ekgb) {
  const bilgi = `${ekgb.il} ${ekgb.ilce} ${ekgb.mahalle} — Ada: ${ekgb.ada || '-'} Parsel: ${ekgb.parsel || '-'} — ${ekgb.mutecavizAdSoyad || ''}`;
  sheet.headerFooter.oddFooter = `&8&C${bilgi}\n&P/&N`;
  sheet.headerFooter.evenFooter = `&8&C${bilgi}\n&P/&N`;
}

async function contractToEkgbExcel(ekgb) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('EKGB Raporu');

  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = {
    orientation: 'portrait',
    fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    margins: { left: BIR_CM_INC, right: BIR_CM_INC, top: BIR_CM_INC, bottom: BIR_CM_INC, header: 0, footer: 0.2 },
  };
  for (let i = 1; i <= AC_SUTUN; i++) sheet.getColumn(i).width = 20;
  footerAyarla(sheet, ekgb);

  // ================= BÖLÜM 1: HESAP =================
  baslikSatiriEkle(sheet, '4342 SAYILI MERA KANUNU KAPSAMINDA');
  baslikSatiriEkle(sheet, `${ekgb.il.toLocaleUpperCase('tr-TR')} İLİ ESKİ KONUMUNA GETİRME BEDELİ`);
  sheet.addRow([]);

  altBaslikEkle(sheet, 'MÜTECAVİZ BİLGİSİ');
  sheet.addRow(['Adı Soyadı / Tüzel Kişilik Adı', '', '', ekgb.mutecavizAdSoyad || '-']).eachCell((h) => hucreStil(h));
  sheet.addRow(['T.C. / VKN', '', '', ekgb.mutecavizTcVkn || '-']).eachCell((h) => hucreStil(h));
  sheet.addRow([]);

  altBaslikEkle(sheet, 'İŞGAL EDİLEN YERİN BİLGİSİ');
  sheet.addRow(['İlçe', '', '', ekgb.ilce]).eachCell((h) => hucreStil(h));
  sheet.addRow(['Mahalle / Köy', '', '', ekgb.mahalle]).eachCell((h) => hucreStil(h));
  sheet.addRow(['Ada', '', '', ekgb.ada || '-']).eachCell((h) => hucreStil(h));
  sheet.addRow(['Parsel', '', '', ekgb.parsel || '-']).eachCell((h) => hucreStil(h));
  sheet.addRow(['Kullanılan Birim Fiyat Dönemi', '', '', ekgb.donemAdi]).eachCell((h) => hucreStil(h));
  sheet.addRow([]);

  altBaslikEkle(sheet, 'ALAN BİLGİLERİ');
  const ab = ekgb.alanBilgileri;
  sheet.addRow(['Sürülen/Tarla Olarak Kullanılan Alan (m²)', '', '', ab.surulenAlanM2]).eachCell((h) => hucreStil(h));
  sheet.addRow(['İnşaat/Hafriyat Dökülen Alan (m²)', '', '', ab.insaatHafriyatAlanM2]).eachCell((h) => hucreStil(h));
  sheet.addRow(['Toprak Derinliği (m)', '', '', ab.toprakDerinligiM]).eachCell((h) => hucreStil(h));
  sheet.addRow(['Asfalt/Beton Kaplı Alan (m²)', '', '', ab.asfaltBetonAlanM2]).eachCell((h) => hucreStil(h));
  sheet.addRow(['Asfalt/Beton Kalınlığı (m)', '', '', ab.asfaltBetonKalinligiM]).eachCell((h) => hucreStil(h));
  sheet.addRow(['Tel Örgü Uzunluğu (m)', '', '', ab.telOrguUzunlugu]).eachCell((h) => hucreStil(h));
  sheet.addRow(['Toplam Islah Alanı (m²)', '', '', ekgb.alanOzeti.toplamIslahAlaniM2]).eachCell((h) => hucreStil(h, { bold: true }));
  sheet.addRow([]);

  altBaslikEkle(sheet, 'İŞÇİLİK MALİYETLERİ');
  kalemTablosuEkle(sheet, ekgb.iscilik.detaylar, ['İşlem Adı', 'Açıklama', 'Birim Fiyat (TL)', 'Toplam Maliyet (TL)']);
  toplamSatiriEkle(sheet, 'İşçilik Toplam', ekgb.iscilik.toplam);
  sheet.addRow([]);

  altBaslikEkle(sheet, 'TOHUM MALİYETLERİ');
  kalemTablosuEkle(
    sheet,
    ekgb.tohum.detaylar.map((t) => ({ ad: t.ad || t.kod, aciklama: detayAciklamaOlustur(t), birimFiyat: t.birimFiyat, maliyet: t.maliyet })),
    ['Bitki Adı', 'Açıklama', 'Birim Fiyat (TL/kg)', 'Toplam Maliyet (TL)']
  );
  toplamSatiriEkle(sheet, 'Tohum Toplam', ekgb.tohum.toplam);
  sheet.addRow([]);

  altBaslikEkle(sheet, 'GÜBRELEME MALİYETLERİ');
  kalemTablosuEkle(
    sheet,
    ekgb.gubreleme.detaylar.map((g) => ({ ad: g.ad || g.kod, aciklama: detayAciklamaOlustur(g), birimFiyat: g.birimFiyat, maliyet: g.maliyet })),
    ['Gübre Adı', 'Açıklama', 'Birim Fiyat (TL/kg)', 'Toplam Maliyet (TL)']
  );
  toplamSatiriEkle(sheet, 'Gübreleme Toplam', ekgb.gubreleme.toplam);
  sheet.addRow([]);

  const genelToplamRow = sheet.addRow(['GENEL TOPLAM (TL)', '', '', ekgb.genelToplam]);
  genelToplamRow.eachCell((h) => hucreStil(h, { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'right', boyut: 12 }));
  sheet.mergeCells(`A${genelToplamRow.number}:C${genelToplamRow.number}`);
  genelToplamRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.addRow([]);
  sheet.addRow([]);

  altBaslikEkle(sheet, 'HAZIRLAYANLAR');
  imzaBlokuEkle(sheet, ekgb.imzacilar);

  // ---- Buraya kadar olan son satirdan SONRA sayfa sonu (page break) ----
  sheet.getRow(sheet.rowCount).addPageBreak();

  // ================= BÖLÜM 2: AÇIKLAMALAR (aynı sayfa/sekme, yeni baskı sayfası) =================
  baslikSatiriEkle(sheet, 'AÇIKLAMALAR', { boyut: 12 });
  sheet.addRow([]);

  const notlar = [
    'Birim fiyatlar/parametreler için; piyasa fiyat araştırmaları, varsa güncel İl Mera Komisyonu Kararları, Belediye Hizmet Tarifesi, resmi poz değerleri vb. esas alınmaktadır.',
    'Hafriyat taşıma bedeli İBB Çevre Koruma Şube Müdürlüğü Hizmet Tarifesi esas alınarak hesaplanmıştır.',
    'İnşaat/Hafriyat ve Asfalt/Beton alanlarda toprak serme ve tohum/gübre bedeli hesabında, serilecek toprak yüksekliği 20 cm olarak alınmıştır.',
    'Gübreleme: Yanmış hayvan gübresi 1 yıl; Amonyum Sülfat ve Kompoze Gübre 2 yıl uygulanacak şekilde hesaplanmıştır.',
    '4342 sayılı Mera Kanunu kapsamında hazırlanmıştır.',
  ];
  for (const not of notlar) {
    const row = sheet.addRow([`• ${not}`]);
    sheet.mergeCells(`A${row.number}:${sheet.getColumn(AC_SUTUN).letter}${row.number}`);
    hucreStil(row.getCell(1), { align: 'left' });
    row.height = 30;
  }
  sheet.addRow([]);

  altBaslikEkle(sheet, 'HESAPLAMA YÖNTEMİ NOTLARI');
  const yontemNotlari = [
    ['Hafriyat Hacmi (m³)', 'İnşaat/Hafriyat Dökülen Alan (m²) × Toprak Derinliği (m) + Asfalt/Beton Kaplı Alan (m²) × Asfalt/Beton Kalınlığı (m)'],
    ['Toplam Islah Alanı (m²)', 'Sürülen/Tarla Olarak Kullanılan Alan (m²) + İnşaat/Hafriyat Dökülen Alan (m²) + Asfalt/Beton Kaplı Alan (m²)'],
    ['Hafriyat Taşıma İşçiliği', '(((Taşıma yapılan taşıtın kapasitesi m³ × 1.600 kg) − 20 torba toprak ağırlığı kg) / 1 torba toprak ağırlığı × İlave torba ücreti TL) × (Toplam Hafriyat Hacmi m³ / Taşıma yapılan taşıtın kapasitesi m³)'],
    ['Toprak Serme', 'Toprak bedeli + tesviye bedeli (İnşaat/Hafriyat + Asfalt/Beton alanları için)'],
  ];
  for (const [baslik, aciklama] of yontemNotlari) {
    const row = sheet.addRow([baslik]);
    sheet.mergeCells(`A${row.number}:${sheet.getColumn(AC_SUTUN).letter}${row.number}`);
    hucreStil(row.getCell(1), { bold: true });
    const row2 = sheet.addRow([aciklama]);
    sheet.mergeCells(`A${row2.number}:${sheet.getColumn(AC_SUTUN).letter}${row2.number}`);
    hucreStil(row2.getCell(1), { align: 'left' });
    row2.height = 34;
  }

  return workbook.xlsx.writeBuffer();
}

module.exports = { contractToEkgbExcel };
