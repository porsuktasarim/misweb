/**
 * personel.kurumlar.js
 *
 * Teknik ekip / komisyon uyelerinin "katildigi kurum" listesi ve imza
 * satirindaki KURUM METNININ nasil olusturulacagina dair mantik.
 *
 * Bazi kurumlar (Muhtarlik, Mahalli Bilirkisi, Belediye Baskanligi ve
 * diger "elle yazilan yer acilan" kurumlar) icin kullanicinin
 * girdigi/sectigi ek bilgi ile kurum adi BIRLESTIRILEREK imza metni
 * olusturulur - bu birlestirme kurala gore FARKLI SEKILDE yapilir
 * (orn. "Muhtarlik" -> "...Muhtarligi", "Belediye Baskanligi" ->
 * "...Belediyesi" gibi Turkce ek degisimi).
 */

// 30 buyuksehir ili (6360 sayili Kanun kapsaminda)
const BUYUKSEHIR_ILLERI = [
  'ADANA', 'ANKARA', 'ANTALYA', 'AYDIN', 'BALIKESİR', 'BURSA', 'DENİZLİ',
  'DİYARBAKIR', 'ERZURUM', 'ESKİŞEHİR', 'GAZİANTEP', 'HATAY', 'İSTANBUL',
  'İZMİR', 'KAHRAMANMARAŞ', 'KAYSERİ', 'KOCAELİ', 'KONYA', 'MALATYA',
  'MANİSA', 'MARDİN', 'MERSİN', 'MUĞLA', 'ORDU', 'SAKARYA', 'SAMSUN',
  'ŞANLIURFA', 'TEKİRDAĞ', 'TRABZON', 'VAN',
];

/**
 * Kurum tanimlari. `elleGirisTipi` degeri:
 *   null            -> manuel giris/arama YOK (sabit metin kullanilir)
 *   'serbest'       -> serbest metin (basit birlestirme: "{metin} {kurumAdi}")
 *   'koyMahalle'    -> Yerlesim Listesi'nden koy/mahalle arama
 *   'ilVeyaIlce'    -> Yerlesim Listesi'nden il VEYA ilce arama (Belediye icin)
 */
const KURUMLAR = [
  { kod: 'ilTarimOrman', ad: 'İl Tarım ve Orman Müdürlüğü', elleGirisTipi: null },
  { kod: 'ilceTarimOrman', ad: 'İlçe Tarım ve Orman Müdürlüğü', elleGirisTipi: null },
  { kod: 'kadastroMudurlugu', ad: 'Kadastro Müdürlüğü', elleGirisTipi: 'serbest' },
  { kod: 'milliEmlakDairesi', ad: 'Milli Emlak Dairesi Başkanlığı', elleGirisTipi: 'serbest' },
  { kod: 'emlakMudurlugu', ad: 'Emlak Müdürlüğü', elleGirisTipi: 'serbest' },
  { kod: 'milliEmlakMudurlugu', ad: 'Milli Emlak Müdürlüğü', elleGirisTipi: 'serbest' },
  { kod: 'ormanBolgeMudurlugu', ad: 'Orman Bölge Müdürlüğü', elleGirisTipi: 'serbest' },
  { kod: 'ormanIsletmeMudurlugu', ad: 'Orman İşletme Müdürlüğü', elleGirisTipi: 'serbest' },
  { kod: 'belediyeBaskanligi', ad: 'Belediye Başkanlığı', elleGirisTipi: 'ilVeyaIlce' },
  { kod: 'muhtarlik', ad: 'Muhtarlık', elleGirisTipi: 'koyMahalle' },
  { kod: 'mahalliBilirkisi', ad: 'Mahalli Bilirkişi', elleGirisTipi: 'koyMahalle' },
];

function kurumBul(kod) {
  const kurum = KURUMLAR.find((k) => k.kod === kod);
  if (!kurum) throw new Error(`Bilinmeyen kurum kodu: ${kod}`);
  return kurum;
}

/**
 * İmza satırında görünecek kurum metnini üretir.
 *
 * @param {string} kurumKod
 * @param {object} girdi
 * @param {string} [girdi.serbestMetin] - 'serbest' tipi kurumlar için
 * @param {{il, ilce, mahalle, tip}} [girdi.secilenYer] - 'koyMahalle'/'ilVeyaIlce' tipi için
 *   tip: 'il' | 'ilce' | 'mahalle'
 */
function imzaKurumMetniOlustur(kurumKod, girdi = {}) {
  const kurum = kurumBul(kurumKod);

  switch (kurumKod) {
    case 'ilTarimOrman':
    case 'ilceTarimOrman':
      return kurum.ad;

    case 'muhtarlik':
      if (!girdi.secilenYer) return 'Köyü/Mahallesi Muhtarlığı';
      return `${girdi.secilenYer.mahalle} Köyü/Mahallesi Muhtarlığı`;

    case 'mahalliBilirkisi':
      if (!girdi.secilenYer) return 'Köyü/Mahallesi Mahalli Bilirkişisi';
      return `${girdi.secilenYer.mahalle} Köyü/Mahallesi Mahalli Bilirkişisi`;

    case 'belediyeBaskanligi': {
      if (!girdi.secilenYer) return 'Belediyesi';
      if (girdi.secilenYer.tip === 'il') {
        const ilBuyukHarf = girdi.secilenYer.il.toLocaleUpperCase('tr-TR');
        if (BUYUKSEHIR_ILLERI.includes(ilBuyukHarf)) {
          return `${girdi.secilenYer.il} Büyükşehir Belediyesi`;
        }
        return `${girdi.secilenYer.il} Merkez Belediyesi`;
      }
      return `${girdi.secilenYer.ilce} Belediyesi`;
    }

    default:
      // 'serbest' tipi kurumlar: "{metin} {Kurum Adı}"
      if (!girdi.serbestMetin) return kurum.ad;
      return `${girdi.serbestMetin} ${kurum.ad}`;
  }
}

module.exports = { KURUMLAR, BUYUKSEHIR_ILLERI, kurumBul, imzaKurumMetniOlustur };
