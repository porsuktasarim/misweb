/**
 * ekgb.kalemler.js
 *
 * "Eski Konumuna Getirme Bedeli" (EKGB) hesaplamasinin SABIT yapisal
 * bilgisi: kalem tanimlari (ad/birim/kaynak), tohum karisim oranlari,
 * gubre parametreleri, sabit muhendislik katsayilari.
 *
 * BURADA FIYAT YOK - fiyatlar donemseldir ve ekgb.donem.model.js
 * uzerinden Ayarlar ekranindan YONETILIR (eklenebilir/duzenlenebilir,
 * SILINEMEZ - gecmis hesaplamalarin dayandigi fiyatlar kaybolmaz).
 *
 * Kaynak: kullanicinin sagladigi resmi "Eski Haline Getirme Bedeli"
 * hesap sablonu (4342 sayili Mera Kanunu kapsaminda).
 */

// ---- 25 kalemlik birim fiyat listesi (donemsel olarak fiyatlandirilir) ----
const EKGB_KALEMLER = [
  { kod: 'derinSurum', ad: 'Derin Sürüm (Dipkazan)', birim: 'TL/da', kaynak: 'Piyasa/Çiftçi ücretleri, İBB ve OGM rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'OGM H - ORMAN FİDANLIK ÇALIŞMALARI Dipkazan' },
  { kod: 'surum', ad: 'Sürüm (Pulluk)', birim: 'TL/da', kaynak: 'Piyasa/Çiftçi ücretleri, İBB ve OGM rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'OGM H - ORMAN FİDANLIK ÇALIŞMALARI Pulluk' },
  { kod: 'ikileme', ad: 'İkileme (Kazayağı-Diskarrow)', birim: 'TL/da', kaynak: 'Piyasa/Çiftçi ücretleri, İBB ve OGM rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'OGM H - ORMAN FİDANLIK ÇALIŞMALARI Diskaro' },
  { kod: 'tirmik', ad: 'Tırmık', birim: 'TL/da', kaynak: 'Piyasa/Çiftçi ücretleri, İBB ve OGM rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'OGM H - ORMAN FİDANLIK ÇALIŞMALARI Tesviye' },
  { kod: 'gubrelemeMakineli', ad: 'Gübreleme (Makineli – 2 yıl)', birim: 'TL/da', kaynak: 'Piyasa/Çiftçi ücretleri, İBB ve OGM rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'OGM H - ORMAN FİDANLIK ÇALIŞMALARI Gübre' },
  { kod: 'ekimMibzer', ad: 'Ekim (Mibzerle – 2 yıl)', birim: 'TL/da', kaynak: 'Piyasa/Çiftçi ücretleri, İBB ve OGM rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'OGM H - ORMAN FİDANLIK ÇALIŞMALARI Tohum' },
  { kod: 'temizlikTesviye', ad: 'Temizlik / Tesviye', birim: 'TL/da', kaynak: 'Piyasa/Çiftçi ücretleri, İBB ve OGM rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'OGM H - ORMAN FİDANLIK ÇALIŞMALARI Tesviye' },
  { kod: 'asfaltBetonSokumu', ad: 'Asfalt / Beton Sökümü', birim: 'TL/m3', kaynak: 'Piyasa/Çiftçi ücretleri, İBB, OGM, KGM vb. rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'KGM/18.190' },
  { kod: 'telOrguKaldirma', ad: 'Tel Örgü Kaldırılması', birim: 'TL/m', kaynak: 'Piyasa/Çiftçi ücretleri, İBB, OGM, KGM vb. rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: '(KGM/70.052 + KGM/70.053) / 2' },
  { kod: 'nakliyeUcreti', ad: 'Nakliye ücreti (tek yön)', birim: 'TL/km', kaynak: 'İBB rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'İBB Çevre Koruma Şube Müdürlüğü' },
  { kod: 'dokumSahasiGirisUcreti', ad: 'Döküm sahası araç giriş ücreti', birim: 'TL/adet', kaynak: 'İBB rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'İBB Çevre Koruma Şube Müdürlüğü' },
  { kod: 'yuklemeIscilik1200', ad: "Yükleme işçiliği (1.200 kg'a kadar)", birim: 'TL', kaynak: 'İBB rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'İBB Çevre Koruma Şube Müdürlüğü' },
  { kod: 'yuklemeIscilikFazla60', ad: 'Yükleme işçiliği (her 60 kg fazlası)', birim: 'TL', kaynak: 'İBB rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'İBB Çevre Koruma Şube Müdürlüğü' },
  { kod: 'insaatYikintiBertaraf', ad: 'İnşaat yıkıntı atıklarının bertarafı', birim: 'ton', kaynak: 'İBB rayiçleri, İl Mera Komisyonu Kararları', resmiAciklama: 'İBB Çevre Koruma Şube Müdürlüğü' },
  { kod: 'toprakFiyati', ad: 'Toprak fiyatı', birim: 'm3', kaynak: 'Piyasa/İBB ve kamu tüzel kişilikleri rayiçleri/fiyatları, İl Mera Komisyonu Kararları', resmiAciklama: '' },
  { kod: 'italyanCimi', ad: 'İtalyan çimi (Lolium multiflorum)', birim: 'TL/kg', kaynak: 'Piyasa fiyatları, İl Mera Komisyonu Kararları', resmiAciklama: '' },
  { kod: 'domuzAyrigi', ad: 'Domuz ayrığı (Dactylis glomerata)', birim: 'TL/kg', kaynak: 'Piyasa fiyatları, İl Mera Komisyonu Kararları', resmiAciklama: '' },
  { kod: 'yuksekCayirYumagi', ad: 'Yüksek çayır yumağı (Festuca pratensis)', birim: 'TL/kg', kaynak: 'Piyasa fiyatları, İl Mera Komisyonu Kararları', resmiAciklama: '' },
  { kod: 'cayirSalkimOtu', ad: 'Çayır salkım otu (Poa pratensis)', birim: 'TL/kg', kaynak: 'Piyasa fiyatları, İl Mera Komisyonu Kararları', resmiAciklama: '' },
  { kod: 'yonca', ad: 'Yonca (Medicago sativa)', birim: 'TL/kg', kaynak: 'Piyasa fiyatları, İl Mera Komisyonu Kararları', resmiAciklama: '' },
  { kod: 'akUcgul', ad: 'Ak üçgül (Trifolium repens)', birim: 'TL/kg', kaynak: 'Piyasa fiyatları, İl Mera Komisyonu Kararları', resmiAciklama: '' },
  { kod: 'korunga', ad: 'Korunga (Onobrychis sativa)', birim: 'TL/kg', kaynak: 'Piyasa fiyatları, İl Mera Komisyonu Kararları', resmiAciklama: '' },
  { kod: 'amonyumSulfat', ad: 'Amonyum Sülfat %21 N', birim: 'TL/kg', kaynak: 'Piyasa fiyatları, İl Mera Komisyonu Kararları', resmiAciklama: '' },
  { kod: 'yanmisHayvanGubresi', ad: 'Yanmış Hayvan Gübresi', birim: 'TL/kg', kaynak: 'Piyasa fiyatları, İl Mera Komisyonu Kararları', resmiAciklama: '' },
  { kod: 'komposeGubre', ad: 'Kompoze Gübre 20-20-0', birim: 'TL/kg', kaynak: 'Piyasa fiyatları, İl Mera Komisyonu Kararları', resmiAciklama: '' },
];

// ---- Tohum karisim oranlari (toplam = 1.00) ----
const EKGB_TOHUM_ORANLARI = [
  { kalemKod: 'italyanCimi', oran: 0.20 },
  { kalemKod: 'domuzAyrigi', oran: 0.10 },
  { kalemKod: 'yuksekCayirYumagi', oran: 0.15 },
  { kalemKod: 'cayirSalkimOtu', oran: 0.15 },
  { kalemKod: 'yonca', oran: 0.15 },
  { kalemKod: 'akUcgul', oran: 0.15 },
  { kalemKod: 'korunga', oran: 0.10 },
];

// ---- Gubre parametreleri: sabit miktar (kg/da) + uygulama yili carpani ----
const EKGB_GUBRE_PARAMETRELERI = [
  { kalemKod: 'amonyumSulfat', miktarKgDa: 20, yilCarpani: 2 },
  { kalemKod: 'yanmisHayvanGubresi', miktarKgDa: 2000, yilCarpani: 1 },
  { kalemKod: 'komposeGubre', miktarKgDa: 20, yilCarpani: 2 },
];

// ---- Sabit muhendislik parametreleri (donemden bagimsiz, formule gomulu) ----
const EKGB_SABIT_PARAMETRELER = {
  tasitKapasitesiM3: 14,       // Hafriyat taşıma yapılan taşıtın kapasitesi
  topraginOzgulAgirligiKgM3: 1600, // Toprağın özgül ağırlığı
  dekaraTohumMiktariKg: 12,    // Dekara kullanılacak tohum miktarı
  torbaAgirligiKg: 60,         // 1 torba hafriyat
  topraakSermeKalinligi: 0.2,  // Serilecek toprak yüksekliği (20 cm) - toprak serme formülünde 1/0.2 katsayısı
};

function kalemBul(kod) {
  const kalem = EKGB_KALEMLER.find((k) => k.kod === kod);
  if (!kalem) throw new Error(`Bilinmeyen EKGB kalemi: ${kod}`);
  return kalem;
}

module.exports = {
  EKGB_KALEMLER,
  EKGB_TOHUM_ORANLARI,
  EKGB_GUBRE_PARAMETRELERI,
  EKGB_SABIT_PARAMETRELER,
  kalemBul,
};
