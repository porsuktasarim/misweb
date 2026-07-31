/**
 * meraVerimVarsayilanVeri.js
 *
 * Kullanicinin verdigi Ek-1/Ek-2 resmi cetvellerinden BIREBIR alinan
 * VARSAYILAN veri - MeraVerimAyarlari ilk olusturuldugunda BURADAN
 * seed edilir. Tablo-2 = Tablo-1 x 2, Tablo-3 = Tablo-1 x 0.5 iliskisi
 * DOGRULANARAK (bkz. model dosyasindaki not) hesaplanmistir.
 */

const TABLO1_YARARLANILABILIR_YESIL = [
  { bant: '200-350', cokIyi: 180, iyi: 135, orta: 90, zayif: 45 },
  { bant: '350-500', cokIyi: 270, iyi: 225, orta: 135, zayif: 68 },
  { bant: '500-650', cokIyi: 360, iyi: 270, orta: 180, zayif: 90 },
  { bant: '650-800', cokIyi: 450, iyi: 338, orta: 225, zayif: 113 },
  { bant: '800-950', cokIyi: 540, iyi: 405, orta: 270, zayif: 135 },
  { bant: '950-1100', cokIyi: 630, iyi: 473, orta: 315, zayif: 158 },
  { bant: '1100-1250', cokIyi: 720, iyi: 540, orta: 360, zayif: 180 },
];

// Tablo-2 = Tablo-1 x 2 (kaynaktaki HER hucrede dogrulandi)
const TABLO2_URETILEN_YESIL = TABLO1_YARARLANILABILIR_YESIL.map((s) => ({ bant: s.bant, cokIyi: s.cokIyi * 2, iyi: s.iyi * 2, orta: s.orta * 2, zayif: s.zayif * 2 }));

// Tablo-3 = Tablo-1 x 0.5 (kaynaktaki HER hucrede dogrulandi)
const TABLO3_URETILEN_KURU = TABLO1_YARARLANILABILIR_YESIL.map((s) => ({ bant: s.bant, cokIyi: s.cokIyi * 0.5, iyi: s.iyi * 0.5, orta: s.orta * 0.5, zayif: s.zayif * 0.5 }));

const ILLER_YAGIS_KUSAKLARI = [
  { il: 'Adana', bant: '650-800' }, { il: 'Adıyaman', bant: '650-800' }, { il: 'Afyonkarahisar', bant: '350-500' },
  { il: 'Ağrı', bant: '500-650' }, { il: 'Amasya', bant: '350-500' }, { il: 'Ankara', bant: '350-500' },
  { il: 'Antalya', bant: '950-1100' }, { il: 'Artvin', bant: '650-800' }, { il: 'Aydın', bant: '650-800' },
  { il: 'Balıkesir', bant: '500-650' }, { il: 'Bilecik', bant: '350-500' }, { il: 'Bingöl', bant: '800-950' },
  { il: 'Bitlis', bant: '1100-1250' }, { il: 'Bolu', bant: '500-650' }, { il: 'Burdur', bant: '350-500' },
  { il: 'Bursa', bant: '650-800' }, { il: 'Çanakkale', bant: '500-650' }, { il: 'Çankırı', bant: '350-500' },
  { il: 'Çorum', bant: '350-500' }, { il: 'Denizli', bant: '500-650' }, { il: 'Diyarbakır', bant: '350-500' },
  { il: 'Edirne', bant: '500-650' }, { il: 'Elazığ', bant: '350-500' }, { il: 'Erzincan', bant: '350-500' },
  { il: 'Erzurum', bant: '350-500' }, { il: 'Eskişehir', bant: '350-500' }, { il: 'Gaziantep', bant: '500-650' },
  { il: 'Giresun', bant: '1100-1250' }, { il: 'Gümüşhane', bant: '350-500' }, { il: 'Hakkari', bant: '650-800' },
  { il: 'Hatay', bant: '1100-1250' }, { il: 'Isparta', bant: '500-650' }, { il: 'Mersin', bant: '500-650' },
  { il: 'İstanbul', bant: '800-950' }, { il: 'İzmir', bant: '650-800' }, { il: 'Kars', bant: '500-650' },
  { il: 'Kastamonu', bant: '350-500' }, { il: 'Kayseri', bant: '350-500' }, { il: 'Kırklareli', bant: '500-650' },
  { il: 'Kırşehir', bant: '350-500' }, { il: 'Kocaeli', bant: '800-950' }, { il: 'Konya', bant: '200-350' },
  { il: 'Kütahya', bant: '500-650' }, { il: 'Malatya', bant: '350-500' }, { il: 'Manisa', bant: '650-800' },
  { il: 'Kahramanmaraş', bant: '650-800' }, { il: 'Mardin', bant: '650-800' }, { il: 'Muğla', bant: '1100-1250' },
  { il: 'Muş', bant: '650-800' }, { il: 'Nevşehir', bant: '350-500' }, { il: 'Niğde', bant: '200-350' },
  { il: 'Ordu', bant: '950-1100' }, { il: 'Rize', bant: '1100-1250' }, { il: 'Sakarya', bant: '800-950' },
  { il: 'Samsun', bant: '650-800' }, { il: 'Siirt', bant: '650-800' }, { il: 'Sinop', bant: '650-800' },
  { il: 'Sivas', bant: '350-500' }, { il: 'Tekirdağ', bant: '500-650' }, { il: 'Tokat', bant: '350-500' },
  { il: 'Trabzon', bant: '800-950' }, { il: 'Tunceli', bant: '800-950' }, { il: 'Şanlıurfa', bant: '350-500' },
  { il: 'Uşak', bant: '500-650' }, { il: 'Van', bant: '350-500' }, { il: 'Yozgat', bant: '500-650' },
  { il: 'Zonguldak', bant: '1100-1250' }, { il: 'Aksaray', bant: '200-350' }, { il: 'Bayburt', bant: '350-500' },
  { il: 'Karaman', bant: '200-350' }, { il: 'Kırıkkale', bant: '350-500' }, { il: 'Batman', bant: '350-500' },
  { il: 'Şırnak', bant: '650-800' }, { il: 'Bartın', bant: '950-1100' }, { il: 'Ardahan', bant: '500-650' },
  { il: 'Iğdır', bant: '200-350' }, { il: 'Yalova', bant: '650-800' }, { il: 'Karabük', bant: '350-500' },
  { il: 'Kilis', bant: '350-500' }, { il: 'Osmaniye', bant: '800-950' }, { il: 'Düzce', bant: '800-950' },
];

module.exports = { TABLO1_YARARLANILABILIR_YESIL, TABLO2_URETILEN_YESIL, TABLO3_URETILEN_KURU, ILLER_YAGIS_KUSAKLARI };
