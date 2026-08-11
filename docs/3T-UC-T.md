# 3T (Tespit-Tahdit-Tahsis) Modülü

4342 sayılı Kanun Uygulama Talimatı'nın A/B/C bölümlerine birebir
karşılık gelen bir **süreç ağacı** (ana adım → alt adım). Her 3T
kaydı bir köy/mahalleye bağlıdır. Sağ sütunda süreç durumu (Ek-1..
Ek-6), sol sütunda seçili adımın veri girişi.

Sorun giderme geçmişi için bkz. [`GECMIS-HATA-DUZELTMELERI.md`](GECMIS-HATA-DUZELTMELERI.md).

`uc-t.model.js` bu geliştirme ortamında bulunmuyor (hiç değişmediği
için hiçbir pakete dahil edilmemişti, kullanıcının gerçek deposunda
mevcut) - `altAdim.veri`'nin esnek/tip-serbest yapısı mevcut kod
incelenerek doğrulanıp model dosyasına gerek kalmadan entegrasyonlar
yapıldı.

## 0. Adım - Komisyon ve Teknik Ekip Seçimi

İki alt adımdan oluşur: önce "Komisyon ve Teknik Ekip Seçimi" (bu 3T
kaydı için genel referans İl Mera Komisyonu + Teknik Ekip seçilir -
yıl girilince o yıla ait kayıt varsa otomatik önerilir, değiştirilebilir),
sonra "İl Mera Komisyonu Kararı". Karar formunun kendi komisyon
seçimi bağımsızdır (ön-adımdan varsayılan gelir ama üzerine
yazılabilir); Karar Tarihi girilince o yıla ait komisyon varsa yine
otomatik önerilir - komisyon seçimi ve karar tarihi birbirini
kilitlemez.

**Başkanlık zinciri** (4342 sayılı Kanun m.3'e göre): normalde Vali
Yardımcısı başkanlık eder; o yoksa İl Müdürü, o da yoksa Teknik
Personel (ziraat mühendisi) başkanlık eder - Vali'nin kendisi bu
zincirin parçası değildir, sadece komisyonu onaylar (valilik onayı)
ve isterse (zorunlu olmaksızın) katılımcı/imzacı olabilir.

**Komisyon üyeleri** kanunun 11 kişilik listesine birebir uygun: Vali
(opsiyonel), Vali Yardımcısı, İl Müdürü, Teknik Personel, DSİ Bölge
Müdürlüğü, Orman Bölge Müdürlüğü, Muhtarlık, Defterdarlık, Milli
Emlak Müdürlüğü VEYA Milli Emlak Dairesi Başkanlığı (ikisi birden
değil - komisyon kaydında bir "Milli Emlak Türü" seçimi var), İl
Kadastro Müdürlüğü, Ziraat Odası Başkanlığı, İl Jandarma Komutanlığı,
İl Emniyet Müdürlüğü. Köye özgü Muhtar bilgisi (varsa o yılın Teknik
Ekip listesinden otomatik doldurulur, düzenlenebilir), PDF karar
belgesi yükleme + indirmeden açılır-kapanır görüntüleme.

## Adım 2 (Duyuru/Ek-1) ve Adım 3 (Duyuru Tutanağı/Ek-2)

İl/ilçe/köy otomatik alınır; Tespit ve Tahdit Başlangıç Tarihi
sadece Duyuru'da girilir, Duyuru Tutanağı bunu Duyuru'dan okur (tek
kaynak). Duyuru Tutanağı'nda ayrıca gönderim kurumları işaretlemeli
listesi (Köy/Mahalle Muhtarlığı, Belediye Başkanlığı, Orman Bölge
Müdürlüğü, DSİ, Büyükşehir Belediyesi, Komşu İlçe Belediyeleri, Komşu
Mahalle Muhtarlıkları, Milli Emlak Dairesi Başkanlığı/Müdürlüğü +
serbest "diğer kurumlar").

**İmza blokları:** Duyuru (Ek-1) ve Tebliğ Belgesi (Ek-3) sağ (3.)
sütunda ortalı - tarih, 3 satır boşluk (2.sinde "İMZA" - Sistem
Ayarları'ndaki renkte), Ad Soyad (gerçek başkandan), Unvan, "İl Mera
Komisyonu Başkanı". Duyuru Tutanağı (Ek-2): tarih ayrı satır değil,
"...imza altına alınmıştır." cümlesinin hemen sonuna eklenir; 4 eşit
sütun: gri imza çizgisi + 1 satır boşluk + "Adı Soyadı"/"Ünvanı"
etiketleri (boş şablon - Köylerde Muhtar+3 İhtiyar Heyeti Üyesi,
Belediyelerde Belediye Başkanı+3 yetkili elle doldurur). Her belgenin
sol üst köşesinde "(Ek-1)"/"(Ek-2)"/"(Ek-3)" etiketi.

**Tebliğ Belgesi (Ek-3):** il/ilçe/köy + başlangıç tarihi (Duyuru'dan)
otomatik, komisyon adı "{İl} İl Mera Komisyonu Teknik Ekiplerince"
formatında, gövde metninde m.7 (başlama) ve m.8 (30 gün belge
teslimi) paragrafları, altında "Ek: ... Bilgi Cetveli (Ek-3/a)" notu.

Tüm çıktılarda satır aralığı 1.5. Duyuru Tutanağı ve Tebliğ Belgesi'ne
dosya eklenebilir (PDF, opsiyonel) - varsayılan olarak
"3T_{İlçe}_{KöyMahalle}_ek-X" deseni önerilir.

## Ek-3/a Bilgi Cetveli

Başlık "(Ek-3/a)" + iki satırlı "Mera Kanunu'nun 8 inci Maddesi
Gereği" / "MERA, YAYLAK, KIŞLAK, OTLAK, ÇAYIR BİLGİ CETVELİ" +
"Tespit ve Tahdit Çalışması Yapılacak Alanın :" alt başlığı. "1.
İli: {değer}" şeklinde 12 madde numaralı gösterilir; otomatik gelen
1-4 (İli/İlçesi/Mahalle/Köyü) değiştirilemez (salt okunur). Aile
Sayısı elle; Çiftçi Aile Sayısı ÇKS kaydından seçilerek
(`ciftciler.length`).

### Madde 7 - Arazinin Cinsi/Miktarı (Mera Modülü Entegrasyonu)

Tablo: satırlar Mera/Yaylak/Kışlak/Otlak/Çayır, sütunlar Miktarı
(Dekar)/Parça Adedi/Mevki/Diğer Bilgiler.

1. **"Parsel Seç" butonu** - Madde 7 bölümüne eklendi, tıklanınca bir
   popup (Bootstrap modal) açılır.
2. **Popup**, o 3T kaydının köy/mahallesindeki tüm Aktif Mera
   parsellerini `/api/mera` endpoint'i üzerinden çekip listeler - her
   satırda checkbox, Ada/Parsel, Cinsi (araziNiteligi), Dekar (Tapu
   Alanı varsa öncelikli, yoksa Mera Alanı, m²'den /1000 çevrilerek),
   Mülkiyet Durumu.
3. **"Kaydet"** - seçilen parsel ID'lerini `uc-t.service.js` →
   `ek3aAraziVerileriKaydet`'e gönderir - bu fonksiyon parselleri
   Cinsi'ne göre gruplayıp Miktarı Dekar (toplam), Parça Adedi
   (sayı), Diğer Bilgiler sütununa o cinsteki parsellerin Mülkiyet
   Durumu değerlerinin benzersiz birleşimini hesaplayıp `altAdim.
   veri.madde7Satirlari`'a yazar. Madde 7 tablosunda olmayan arazi
   nitelikleri (Eyrek Yeri, Harman Yeri vb.) sessizce atlanır.
4. **"Mevki" sütunu** Mera modelinde henüz izlenmediği için boş
   bırakılır (elle doldurulabilir).
5. `uc-t.export.js`'in `ek3aVerileriniOlustur` fonksiyonu kayıtlı
   `madde7Satirlari`'ı kullanır (varsa), yoksa boş satırlara geri
   döner.
6. Popup'ta önceden seçilmiş parseller (varsa) checkbox'ları
   işaretli açılır - tekrar düzenlenebilir.

**Önemli:** Bu akışta `veri` alanını tam üzerine yazan başka bir
fonksiyon (`ek3aHayvanVarligiCek` gibi) çağrılırsa madde7Satirlari
silinebilir - bkz. [`GECMIS-HATA-DUZELTMELERI.md`](GECMIS-HATA-DUZELTMELERI.md#ek-3a-madde-7-parsel-seç---kaydetme-sorunu-5-aşamalı-çözüm)
bu hata sınıfının tam teşhisi için.

### Madde 8 - Mevcut Hayvan Varlığı

Gerçek 3x3 tablo: satırlar Büyükbaş/Küçükbaş/Diğerleri, sütunlar
Kültür/Kültür Melezi/Yerli; her hücre "X adet (Y BBHB)" formatında
(BBHB kaydındaki önceden hesaplanmış 'bbhb' alanı doğrudan toplanır).
Manda ve Büyükbaş Erkek (boğa/öküz) BBHB kuralında ırk ayrımı
taşımadığı için ("manda büyükbaş sayılır" talimatı gereği) Büyükbaş
satırının Yerli sütununa eklenir; aynı gerekçeyle Küçükbaş ve
Diğerleri (tek tırnaklı) toplamları da Yerli sütununda gösterilir -
bu varsayım ekranda açıkça belirtilir.

### Madde 9 - Kullanılan Alanlardan Yararlanma Şekli

Otlatılarak / Kuru ot (saman) olarak biçilerek / Yeşil ot (yem)
olarak biçilerek / Silaj yapılarak / Dinlendirilerek (nadasa
bırakılarak) + serbest "diğer".

### Madde 10 - Harita, Kroki, Pafta ve Ellerinde Mevcut Diğer Bilgiler (Mera Kimlikleri)

Madde 7'de seçilen parsellerin **Mera Kimliği PDF'leri** buradan
indirilebilir (bkz. [`MERA-MODULU.md`](MERA-MODULU.md#mera-kimliği-pdf)).

1. `coklulKimlikPdfOlustur()` (`mera.kimlik.js`) - Madde 7'de seçilen
   birden fazla parselin Mera Kimliği PDF'lerini art arda tek bir
   PDF'de birleştirir.
2. `uc-t.service.js` → `madde10KimlikPdfIndir()` - 3T kaydının Madde
   7'de seçilen parsel ID'lerini bulup yukarıdaki fonksiyonu çağırır.
   Parsel seçilmemişse açıkça "Önce Madde 7'de 'Parsel Seç' ile en az
   bir parsel seçip kaydetmelisiniz." hatası fırlatır.
3. Endpoint: `GET /api/uc-t/:id/madde10-kimlik-pdf`.
4. Frontend: parsel seçilmişse "Mera Kimlikleri (PDF) - N parsel"
   indirme linki (yeni sekmede açılır), seçilmemişse yönlendirici
   not. Bu alan hem panel ilk açıldığında hem "Parsel Seç"
   popup'ından kaydedildiğinde anında güncellenir.
5. `uc-t.export.js`'in madde 10 paragraf metni de güncellendi - parsel
   seçiliyse "Ekte sunulan N adet Mera Kimliği belgesinde yer
   almaktadır." yazıyor.

**Mühendislik notu:** Ek-3/a'nın Word/PDF export'u ile Madde 10'un
Mera Kimlikleri PDF'i iki ayrı indirme olarak kalıyor - tek bir
birleşik belge oluşturulmadı (kapsam dışı bırakıldı, gerekirse
ileride `pdf-lib` ile birleştirilebilir).

### Madde 11-12

Madde 11 basit not alanı; Madde 12 serbest metin.

### Teknik Ekip İmza Bloğu

"Komisyon ve Teknik Ekip Seçimi" ön-adımında seçilen Teknik Ekip'in
gerçek üyeleriyle, `imzaTipi: 'cokluKisi'`. Maksimum 4 sütun - N kişi
satırlara dengeli dağıtılır (kalan 0 ise hepsi 4'lü; kalan 1 ise son
satır tek kişilik ve sola yaslı; kalan 2/3 ise o kısa satır en başa
alınır, örn. 7 kişi → [3,4], 4+3 değil). Her imzacı kutusunda 4
satır: Adı Soyadı / Ünvanı / Kurumu / Üyelik Durumu (Merkez Mera
Teknik Ekip Başkanı / İlçe Mera Teknik Ekip Başkanı / Üye). Her satır
tek satıra sığacak şekilde otomatik küçültülür, aynı türdeki tüm
kutularda aynı boyut kullanılır.

### Sayfa Altbilgisi ve Export

"(Ek-3/A) | {sayfa}/{toplam}" formatında. Word/PDF export (paragraf+
tablo karışık sıralı içerik desteğiyle). Dosya ekleme (PDF,
varsayılan ad "3T_{İlçe}_{KöyMahalle}_ek-3a").

**Tahsis (Ek-7 ve sonrası) henüz eklenmedi.**

## Ek-4/a ve Ek-4/b

BBHB+ÇKS kayıtlarından seçilerek otomatik hesaplanır (Ek-4/a için
Ek-4ab'nin `birlestir()` çekirdeği yeniden kullanılır; Ek-4/b için
BBHB'nin detaylı kategori kırılımları köy düzeyinde toplanır) - ikisi
ayrı ayrı tamamlanabilir, ardından "4/a ve 4/b Birleştirme Onayı"
adımı ile devam edilir. Diğer adımlar (Ek-4/c-h, Ek-5, Ek-6) şimdilik
manuel tamamlandı işaretlemesi + not alanı ile takip edilir.
