/**
 * ekgb.excel.exporter.js
 *
 * EKGB (Eski Konumuna Getirme Bedeli) raporu - 2 SAYFA:
 *  1. "Hesap" - mutecaviz/yer bilgisi, kalem kalem dokum, genel toplam,
 *     imza blogu (sayfa SONUNDA, serbest sayida kisi, 3-4 satirlik alan)
 *  2. "Açıklamalar" - hesaplama yontemi notlari
 *
 * Ayni gri ton + Times New Roman kurumsal standardi (BBHB ile ortak).
 */

const ExcelJS = require('exceljs');

const RENK = {
  koyu: 'FF3F3F3C',
  orta: 'FF6E6E68',
  seritKoyu: 'FFF4F4F2',
  toplam: 'FFDCDCD7',
  ozetEtiket: 'FFD9D9D4',
};
const YAZI_TIPI = 'Times New Roman';
const BIR_CM_INC = 1 / 2.54;

function hucreStil(hucre, { fill, bold = false, renkBeyaz = false, align = 'left', boyut = 9 } = {}) {
  hucre.font = { name: YAZI_TIPI, size: boyut, bold, color: { argb: renkBeyaz ? 'FFFFFFFF' : 'FF1C1E1B' } };
  if (fill) hucre.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  hucre.alignment = { vertical: 'middle', horizontal: align, wrapText: true };
}

const AC_SUTUN = 6;

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

async function contractToEkgbExcel(ekgb) {
  const workbook = new ExcelJS.Workbook();

  // ================= SAYFA 1: HESAP =================
  const s1 = workbook.addWorksheet('Hesap');
  s1.pageSetup = {
    orientation: 'portrait',
    fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    margins: { left: BIR_CM_INC, right: BIR_CM_INC, top: BIR_CM_INC, bottom: BIR_CM_INC, header: 0, footer: 0 },
  };
  for (let i = 1; i <= AC_SUTUN; i++) s1.getColumn(i).width = 20;

  baslikSatiriEkle(s1, '4342 SAYILI MERA KANUNU KAPSAMINDA');
  baslikSatiriEkle(s1, `${ekgb.il.toLocaleUpperCase('tr-TR')} İLİ ESKİ KONUMUNA GETİRME BEDELİ`);
  s1.addRow([]);

  altBaslikEkle(s1, 'MÜTECAVİZ BİLGİSİ');
  s1.addRow(['Adı Soyadı / Tüzel Kişilik Adı', '', '', ekgb.mutecavizAdSoyad]).eachCell((h) => hucreStil(h));
  s1.addRow(['T.C. / VKN', '', '', ekgb.mutecavizTcVkn || '-']).eachCell((h) => hucreStil(h));
  s1.addRow([]);

  altBaslikEkle(s1, 'İŞGAL EDİLEN YERİN BİLGİSİ');
  s1.addRow(['İlçe', '', '', ekgb.ilce]).eachCell((h) => hucreStil(h));
  s1.addRow(['Mahalle / Köy', '', '', ekgb.mahalle]).eachCell((h) => hucreStil(h));
  s1.addRow(['Ada', '', '', ekgb.ada || '-']).eachCell((h) => hucreStil(h));
  s1.addRow(['Parsel', '', '', ekgb.parsel || '-']).eachCell((h) => hucreStil(h));
  s1.addRow(['Kullanılan Birim Fiyat Dönemi', '', '', ekgb.donemAdi]).eachCell((h) => hucreStil(h));
  s1.addRow([]);

  altBaslikEkle(s1, 'ALAN BİLGİLERİ');
  const ab = ekgb.alanBilgileri;
  s1.addRow(['Sürülen/Tarla Olarak Kullanılan Alan (m²)', '', '', ab.surulenAlanM2]).eachCell((h) => hucreStil(h));
  s1.addRow(['İnşaat/Hafriyat Dökülen Alan (m²)', '', '', ab.insaatHafriyatAlanM2]).eachCell((h) => hucreStil(h));
  s1.addRow(['Toprak Derinliği (m)', '', '', ab.toprakDerinligiM]).eachCell((h) => hucreStil(h));
  s1.addRow(['Asfalt/Beton Kaplı Alan (m²)', '', '', ab.asfaltBetonAlanM2]).eachCell((h) => hucreStil(h));
  s1.addRow(['Asfalt/Beton Kalınlığı (m)', '', '', ab.asfaltBetonKalinligiM]).eachCell((h) => hucreStil(h));
  s1.addRow(['Tel Örgü Uzunluğu (m)', '', '', ab.telOrguUzunlugu]).eachCell((h) => hucreStil(h));
  s1.addRow(['Toplam Islah Alanı (m²)', '', '', ekgb.alanOzeti.toplamIslahAlaniM2]).eachCell((h) => hucreStil(h, { bold: true }));
  s1.addRow([]);

  altBaslikEkle(s1, 'İŞÇİLİK MALİYETLERİ');
  kalemTablosuEkle(s1, ekgb.iscilik.detaylar, ['İşlem Adı', 'Açıklama', 'Birim Fiyat (TL)', 'Toplam Maliyet (TL)']);
  toplamSatiriEkle(s1, 'İşçilik Toplam', ekgb.iscilik.toplam);
  s1.addRow([]);

  altBaslikEkle(s1, 'TOHUM MALİYETLERİ');
  kalemTablosuEkle(
    s1,
    ekgb.tohum.detaylar.map((t) => ({ ad: t.kod, aciklama: `${(t.oran * 100).toFixed(0)}% karışım, ${t.miktarKgDa} kg/da`, birimFiyat: t.birimFiyat, maliyet: t.maliyet })),
    ['Bitki Adı', 'Açıklama', 'Birim Fiyat (TL/kg)', 'Toplam Maliyet (TL)']
  );
  toplamSatiriEkle(s1, 'Tohum Toplam', ekgb.tohum.toplam);
  s1.addRow([]);

  altBaslikEkle(s1, 'GÜBRELEME MALİYETLERİ');
  kalemTablosuEkle(
    s1,
    ekgb.gubreleme.detaylar.map((g) => ({ ad: g.kod, aciklama: `${g.miktarKgDa} kg/da × ${g.yilCarpani} yıl`, birimFiyat: g.birimFiyat, maliyet: g.maliyet })),
    ['Gübre Adı', 'Açıklama', 'Birim Fiyat (TL/kg)', 'Toplam Maliyet (TL)']
  );
  toplamSatiriEkle(s1, 'Gübreleme Toplam', ekgb.gubreleme.toplam);
  s1.addRow([]);

  const genelToplamRow = s1.addRow(['GENEL TOPLAM (TL)', '', '', ekgb.genelToplam]);
  genelToplamRow.eachCell((h) => hucreStil(h, { fill: RENK.koyu, bold: true, renkBeyaz: true, align: 'right', boyut: 12 }));
  s1.mergeCells(`A${genelToplamRow.number}:C${genelToplamRow.number}`);
  genelToplamRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  s1.addRow([]);
  s1.addRow([]);

  // İMZA BLOĞU - sayfanın sonunda, serbest sayida kisi (yan yana sutun),
  // 3-4 satirlik SABIT yukseklikte alan (kisi sayisina gore satir artmaz)
  altBaslikEkle(s1, 'HAZIRLAYANLAR');
  const imzaBaslangicSatir = s1.rowCount + 1;
  const imzacilar = ekgb.imzacilar && ekgb.imzacilar.length > 0 ? ekgb.imzacilar : [{ adSoyad: '', unvan: '' }];

  // Her imzaci kendi sutun grubuna (2 sutun genislikte) yerlesir
  const imzaSatirlari = { imza: [], adSoyad: [], unvan: [] };
  imzacilar.forEach(() => {
    imzaSatirlari.imza.push('');
    imzaSatirlari.adSoyad.push('');
    imzaSatirlari.unvan.push('');
  });

  const imzaRow = s1.addRow([]);
  imzaRow.height = 40; // imza icin bosluk
  const adSoyadRow = s1.addRow(imzacilar.map((i) => i.adSoyad || ''));
  const unvanRow = s1.addRow(imzacilar.map((i) => i.unvan || ''));

  [adSoyadRow, unvanRow].forEach((row) => {
    row.eachCell((h) => hucreStil(h, { align: 'center', bold: row === adSoyadRow }));
  });
  imzaRow.eachCell({ includeEmpty: true }, (h) => hucreStil(h, {}));
  s1.addRow(['İmzası', ...new Array(Math.max(imzacilar.length - 1, 0)).fill('')]).eachCell((h) => hucreStil(h, { align: 'center', boyut: 8 }));
  // Not: imza satirlarinin ETIKETLERI (İmzası/Adı Soyadı/Unvanı) sol basta
  // tek sutunda; kisiler saga dogru ek sutunlarda siralanir.

  // ================= SAYFA 2: AÇIKLAMALAR =================
  const s2 = workbook.addWorksheet('Açıklamalar');
  s2.pageSetup = {
    orientation: 'portrait',
    margins: { left: BIR_CM_INC, right: BIR_CM_INC, top: BIR_CM_INC, bottom: BIR_CM_INC, header: 0, footer: 0 },
  };
  s2.getColumn(1).width = 100;

  baslikSatiriEkle(s2, 'AÇIKLAMALAR', { boyut: 12 });
  s2.addRow([]);

  const notlar = [
    'Birim fiyatlar/parametreler için; piyasa fiyat araştırmaları, varsa güncel İl Mera Komisyonu Kararları, Belediye Hizmet Tarifesi, resmi poz değerleri vb. esas alınmaktadır.',
    'Hafriyat taşıma bedeli İBB Çevre Koruma Şube Müdürlüğü Hizmet Tarifesi esas alınarak hesaplanmıştır.',
    'İnşaat/Hafriyat (B tipi) ve Asfalt/Beton (C tipi) alanlarda toprak serme ve tohum/gübre bedeli hesabında, serilecek toprak yüksekliği 20 cm olarak alınmıştır.',
    'Gübreleme: Yanmış hayvan gübresi 1 yıl; Amonyum Sülfat ve Kompoze Gübre 2 yıl uygulanacak şekilde hesaplanmıştır.',
    '4342 sayılı Mera Kanunu kapsamında hazırlanmıştır.',
  ];
  for (const not of notlar) {
    const row = s2.addRow([`• ${not}`]);
    hucreStil(row.getCell(1), { align: 'left' });
    row.height = 30;
  }
  s2.addRow([]);

  altBaslikEkle(s2, 'HESAPLAMA YÖNTEMİ NOTLARI');
  const yontemNotlari = [
    ['Hafriyat Hacmi (m³)', 'İnşaat/Hafriyat Dökülen Alan (m²) × Toprak Derinliği (m) + Asfalt/Beton Kaplı Alan (m²) × Asfalt/Beton Kalınlığı (m)'],
    ['Toplam Islah Alanı (m²)', 'Sürülen/Tarla Olarak Kullanılan Alan (m²) + İnşaat/Hafriyat Dökülen Alan (m²) + Asfalt/Beton Kaplı Alan (m²)'],
    ['Hafriyat Taşıma İşçiliği', '(((Taşıma yapılan taşıtın kapasitesi m³ × 1.600 kg) − 20 torba toprak ağırlığı kg) / 1 torba toprak ağırlığı × İlave torba ücreti TL) × (Toplam Hafriyat Hacmi m³ / Taşıma yapılan taşıtın kapasitesi m³)'],
    ['Toprak Serme', 'Toprak bedeli + tesviye bedeli (İnşaat/Hafriyat + Asfalt/Beton alanları için)'],
  ];
  for (const [baslik, aciklama] of yontemNotlari) {
    const row = s2.addRow([baslik]);
    hucreStil(row.getCell(1), { bold: true });
    const row2 = s2.addRow([aciklama]);
    hucreStil(row2.getCell(1), { align: 'left' });
    row2.height = 34;
  }

  return workbook.xlsx.writeBuffer();
}

module.exports = { contractToEkgbExcel };
