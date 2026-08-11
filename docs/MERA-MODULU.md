# Mera Modülü

`/api/mera`, `backend/modules/mera/`, `frontend/public/mera/`.

Her kayıt **tek bir parsele** karşılık gelir (Ada/Parsel bazında).
Sorun giderme geçmişi için bkz. [`GECMIS-HATA-DUZELTMELERI.md`](GECMIS-HATA-DUZELTMELERI.md).

## Alanlar

İl/İlçe/Köy-Mahalle (Yerleşim listesinden), Ada No, Parsel No, Mera
Alanı (m²), Tapu Alanı (m²), Arazi Niteliği (Mera/Yaylak/Kışlak/
Otlak/Çayır/Eyrek Yeri/Harman Yeri/Panayır Yeri/Sıvat Yeri), Arazi
Durum Sınıfı (Çok İyi/İyi/Orta/Zayıf/Belirlenmemiş - enum, otlatma
kapasitesi hesabında hangi sütunun kullanılacağını belirler),
Arazi Kaynağı (5-a/5-b/5-c/5-d), Tespit/Tahdit/Tahsis (her biri ayrı
checkbox+tarih), Islah Durumu (enum: Islah Edilmedi/Islah Ediliyor/
Islah Edildi), Eğimi, Toprak Sınıfı (I-VIII Sınıf), Tapu Kimlik No,
**Mülkiyet Durumu** (bkz. aşağıda), **Durum** (Aktif/Pasif/Silindi,
bkz. aşağıda).

## Durum Yönetimi (Aktif / Pasif / Silindi)

Parsel **asla veritabanından gerçekten silinmez** - sistemin genel
felsefesiyle (notlar/harita versiyonları hiç kaybolmaz) tutarlı
olması için "Sil" ve "Pasife Al" aynı mekanizmayı (durum değişikliği)
kullanır, sadece hedef durum farklıdır. Parsel detay sayfasının
başlığında durum rozeti + "Pasife Al/Aktif Et" ve "Sil" butonları
var. Liste sayfasında "Durum" filtresi (Aktif/Pasif/Tümü, varsayılan
Aktif) ve renkli rozet sütunu.

**Aktif Et/Pasife Al/Sil için açıklama zorunludur** - `prompt()` ile
istenir, boş bırakılırsa işlem yapılmaz. Açıklama log kaydına
"Durum: Aktif -> Pasif - Açıklama: ..." biçiminde yazılır - hem
frontend hem backend zorunlu kılar.

**Gelecek not (kullanıcının kendi ifadesiyle):** "bu sillerin tamamı
sadece admin de olacak şekilde izinlendireceğiz sonra." Şu an gerçek
bir kullanıcı girişi/rolü olmadığı için tüm silme/durum değiştirme
işlemleri herkese açık - `mera.service.js`'deki `dosyaSil()`
fonksiyonu üzerinde bunu işaretleyen yorumlar var, auth sistemi
kurulduğunda buraya yetki kontrolü eklenmesi gerekiyor.

## Notlar ve Log

Bir kez eklenen not asla silinemez, sadece "Düzenle" ile
güncellenebilir - eski hali versiyon geçmişinde ("Önceki hâller")
kalıcı olarak saklanır; her nota ayrıca belge eklenebilir. Her işlem
(oluşturma/güncelleme/not ekleme/not düzenleme/dosya ekleme/durum
değiştirme) ayrı bir "Log" sekmesinde, tarih+işlem+detay+kullanıcı
olarak listelenir.

**Log kayıtları ayrıntılıdır:** `guncelle()` fonksiyonu her alan için
eski/yeni değeri karşılaştırıp sadece gerçekten değişenleri "Etiket:
eski -> yeni" biçiminde yazar (örnek: "Mera Alanı: 20.000 m² ->
22.222 m²"). Sayılar (m²), tarihler, Evet/Hayır alanları uygun
biçimde formatlanır, boş değer "(boş)" gösterilir. Değişiklik yoksa
log kaydı eklenmez.

Kullanıcı adı, sistemde henüz gerçek bir "giriş yapma" (auth)
mekanizması olmadığı için tarayıcıda hatırlanan (localStorage)
serbest bir metin alanından gelir.

## "Dosyalar" Sekmesi

Genel Bilgiler/Notlar/Log yanına eklendi. Genel amaçlı belge yükleme
(harita/CBS dosyalarından ayrı bir alan - `MeraParseli.dosyalar`) +
**harita dosyaları (orijinal format ve otomatik üretilen GeoJSON
türevi dahil) aynı listede birlikte** gösterilir. Her satırda: dosya
adı, tip, kaynak (Dosyalar/Harita vN), tarih, İndir butonu.

**PDF veya görsel (.pdf/.jpg/.jpeg/.png/.gif/.webp) dosyaya
tıklanınca Bootstrap modal içinde popup önizleme açılır** (görseller
`<img>`, PDF `<iframe>` ile) - diğer formatlar doğrudan indirilir.

**Genel amaçlı dosyalar silinebilir** (açıklama zorunlu, aynı
mekanizma). Harita/CBS dosyaları bilerek bu kapsamın dışında
bırakıldı - onlar versiyonlu ve değişmez kalmaya devam ediyor.
Fiziksel dosya diskte kalır (sadece veritabanı referansı kaldırılır).

### Yönetilebilir Belge Tipleri + Otomatik Adlandırma

`BelgeAyarlari.meraDosyaTipleri` dizisi - varsayılan olarak Tapu
Senedi, Tespit Tutanağı, Fotoğraf (hepsi otomatik adlandırmalı) ve
Diğer Belge (orijinal ad korunur) geliyor, Sistem Ayarları'ndan
eklenip çıkarılabilir. "Otomatik Adlandırma" açık olan bir tip
seçilirse dosya `İl-İlçe-Mahalle-Ada-Parsel-Tip-vN` biçiminde
otomatik adlandırılır (harita dosyalarıyla aynı mantık) - test
edildi: `Istanbul-Silivri-Bekirli-123-45-Tapu-Senedi-v1.pdf`.

## Mülkiyet Durumu

Ek-3/a madde 7 entegrasyonu için gerekli oldu (bkz.
[`3T-EK3A.md`](3T-EK3A.md)) - madde 7'nin "Diğer Bilgiler (Kime Ait
Olduğu, Nizalılık Durumu)" sütunu parsel bazında bir mülkiyet durumu
bilgisi gerektiriyordu.

- `BelgeAyarlari.meraMulkiyetDurumlari` - yönetilebilir liste
  (varsayılan: Kamu Orta Malı, Maliye Hazinesi, Davalı, İlçe
  Belediyesi, Büyükşehir Belediyesi, Köy/Mahalle Muhtarlığı) - Sistem
  Ayarları'nda "etiket" (chip) arayüzüyle eklenip çıkarılabilir.
- `MeraParseli.mulkiyetDurumu` - sabit enum değil, yukarıdaki listeye
  bağlı serbest metin alanı.
- Toplu Excel yükleme/rapor/şablonuna "Mülkiyet Durumu" sütunu
  eklendi.

## Arama ve Filtreleme

Liste sayfasında, "Yeni Parsel" butonu ile "Durum" filtresi arasında
bir arama kutusu var - İl/İlçe/Köy-Mahalle/Ada/Parsel alanlarının
hepsinde serbest metin arar (debounce'lu, 300ms), Türkçe büyük/küçük
harf kurallarına uygun (JS tarafında, MongoDB regex'e güvenilmeden).

## Toplu Yükleme / Rapor

"Toplu Yükleme Şablonu" indirilebilir (.xlsx, açıklamalı + 1 örnek
satır + geçerli seçenek listeleri notu), .xlsx/.xls/.csv yüklenebilir
- eşleşen (İl+İlçe+Köy/Mahalle+Ada+Parsel) kayıt varsa güncellenir,
yoksa oluşturulur (UPSERT, aynı şablon tekrar yüklenirse çoğalmaz).
Türkçe gün.ay.yıl tarih formatı doğru ayrıştırılır (round-trip test
edildi). "Rapor İndir": tüm kayıtların tüm alanlarını içeren tek
tıkla Excel raporu (filtre destekli).

## Harita Alt-Modülü

Parsel detay sayfasında, **sadece Genel Bilgiler sekmesinde**
(2 tur düzeltme sonrası - önce yanlış bölmede, sonra tüm sekmelerde
sabit görünüyordu). "Büyüt" butonu haritayı `mera/harita.html`'de
yeni sekmede tam sayfa açar (Leaflet'i DOM içinde taşımanın
risklerinden kaçınmak için) - **mühendislik notu:** bu sayfanın
harita mantığı `detay.html`'deki ile büyük ölçüde aynı ama kod olarak
ayrı (paylaşılan bir modüle çıkarılmadı, zaman kısıtı) - ileride
ortak bir `mis-harita.js`'e taşınması önerilir.

**Gerekli npm paketi yok** - tüm harita kütüphaneleri tarayıcıda CDN
üzerinden yüklenir:
- **Leaflet 1.9.4** (`unpkg.com/leaflet@1.9.4`) - ücretsiz, key yok.
- **OpenStreetMap** tile katmanı (varsayılan) - ücretsiz, key yok.
- **Esri World Imagery** (uydu görünümü, tek tık geçiş) - ücretsiz, key yok.
- **leaflet-omnivore 0.3.4** (`unpkg.com/leaflet-omnivore@0.3.4` -
  **dikkat**: `@mapbox/` önekiyle DEĞİL, scoped paket yok) - KML/GPX
  dosyalarını Leaflet katmanına çevirir (sadece görüntüleme için).

**Özellikler:**
- Katman değiştirme: "Uydu Görünümü" butonu OSM↔Esri geçişi.
- Dosya yükleme: `.geojson/.json/.kml/.gpx/.kmz` kabul edilir, format
  dönüştürülmeden olduğu gibi saklanır.
- Otomatik adlandırma: `IL-ILCE-MAHALLE-ADA-PARSEL-vN.uzanti`
  (Türkçe karakterler ASCII'ye çevrilir).
- **Versiyonlama:** yeni yükleme eski versiyonu silmez, yeni versiyon
  eklenir, versiyon seçiciden istenilen versiyon görüntülenebilir.
- **Çevre parsel gösterimi:** "Çevre Parselleri Göster" checkbox'ı,
  aynı köy/mahalledeki diğer parselleri soluk/kesikli çizgiyle
  overlay eder.
- **Çoklu katman + tıklamalı stil kontrolü:** Birden fazla KML/
  GeoJSON katmanı (aktif parsel + çevre parseller) aynı anda
  görünebilir, her birinin kendi stili var. "Katmanlar" paneli
  (Leaflet'in kendi control mekanizmasıyla, sağ üst köşede) - her
  katmanın yanında tıklanabilir bir nokta, tıklanınca mini panel:
  Çizgi Rengi, Çizgi Kalınlığı, İçi Dolu, Doluluk Rengi - canlı
  uygulanır. Bu değişiklikler oturum içidir, DB'ye kaydedilmez.
  Varsayılan renkler `BelgeAyarlari.haritaStili` altında Sistem
  Ayarları'ndan yönetilir (Üst Katman = aktif parsel, Alt Katmanlar =
  çevre parseller).

**Bilinen sınırlama:** Bu ortamda gerçek bir tarayıcı/harita render
testi yapılamadı (headless browser yok) - backend mantığı (adlandırma/
versiyonlama/dönüşüm) izole test edildi, kod sentaks olarak
doğrulandı, ama gerçek harita görüntüleme canlı ortamda ayrıca
doğrulanmalı.

### Otomatik GeoJSON Dönüşümü

Kullanıcının "en iyi veri saklama formatı hangisi?" sorusuna cevaben
GeoJSON önerildi (öznitelik/properties desteği doğal, ek kütüphane
gerektirmeden render edilir, düz metin). Bunun üzerine "yüklenen
dosyayı otomatik GeoJSON'a çevir" istendi - hem parsel bilgilerinin
dosyaya gömülmesini sağlıyor, hem KMZ'nin "haritada gösterilemiyor"
sorununu çözüyor.

**Gerekli kurulum** (`package.json`'a eklendi, `npm install` yeterli):
```bash
npm install @tmcw/togeojson @xmldom/xmldom adm-zip
```
- `@tmcw/togeojson`: KML/GPX → GeoJSON dönüşümü (sunucu tarafında).
- `@xmldom/xmldom`: Node.js'te `DOMParser` yok - togeojson bir DOM
  nesnesi beklediği için gerekli.
- `adm-zip`: KMZ aslında içinde `.kml` barındıran bir ZIP arşivi - bu
  paket zip'i açıp içindeki KML'i çıkarmak için kullanılır.

**Nasıl çalışıyor:** `mera.harita-donustur.js` - bir harita dosyası
yüklendiğinde: 1) orijinal dosya her zaman olduğu gibi (format
değiştirilmeden) saklanır. 2) Ayrıca otomatik GeoJSON'a çevrilir ve
parselin güncel bilgileri (il/ilçe/mahalle/ada/parsel, alan, arazi
niteliği/durum sınıfı/kaynağı, tespit/tahdit/tahsis, ıslah durumu,
eğim, toprak sınıfı, tapu kimlik no) her feature'ın `properties`
alanına gömülür. 3) Bu türetilmiş dosya `geojsonYolu` alanında
saklanır. Dönüşüm başarısız olursa (bozuk dosya vb.) sessizce
geçilir - orijinal dosya yine de kaydedilir. **Test edildi** (gerçek
KML ve KMZ dosyalarıyla): dönüşüm + öznitelik gömme başarılı, geri
okunup doğrulandı.

**Harita gösterimi `geojsonYolu`'nu önceliklı kullanır** - bu alan
varsa (yeni yüklenen her dosya için garanti var) doğrudan o
kullanılır, format ne olursa olsun (KMZ dahil) güvenle çizilir.
Yoksa (özellik eklenmeden önce yüklenmiş eski kayıtlar için) eski
format-bazlı mantığa geri düşülür.

## Verim Bilgileri / Otlatma Kapasitesi

Kullanıcının paylaştığı resmi Ek-1 (Yağış Kuşaklarına Göre Yeşil/Kuru
Ot Verim Tabloları) ve Ek-2 (İllerin Yıllık Ortalama Yağış Miktarları,
81 il) cetvellerinden gelir.

### Versiyonlu Tablo Verisi

`MeraVerimAyarlari` modelindeki tablolar (Tablo-1/2/3, İller) düz
dizi değil, **versiyonlu**: her biri `{aktifIndex, versiyonlar:
[{satirlar, yaziTarihi, yaziSayisi, yuklemeTarihi, yukleyenKullanici,
kaynakTipi}]}`. Yeni veri eklendiğinde eski veri silinmez - yeni bir
versiyon olarak eklenir ve otomatik aktif olur, önceki versiyonlar
"Versiyon Geçmişi" altında kalıcı olarak görüntülenebilir, istenirse
tekrar "Aktif Yap" ile geri dönülebilir. Her versiyon, hangi resmi
yazıyla geldiğini gösteren Yazı Tarihi + Yazı Sayısı alanlarını
zorunlu olarak taşır.

Veri ekleme iki yöntemli: "Elle Gir" (aktif versiyonun kopyasıyla
başlayan, satır ekle/sil destekli düzenlenebilir tablo) veya "Excel
Yükle" (şablon indirilebilir, Türkçe başlık eşleştirmeli).

**Doğrulama:** kaynaktaki tablolar arasında tam bir ilişki var -
Tablo-2 (Üretilen Yeşil) = Tablo-1 (Yararlanılabilir Yeşil) × 2;
Tablo-3 (Üretilen Kuru) = Tablo-1 × 0,5 - her hücrede doğrulandı, bu
sayede kaynaktaki bir tarama hatası güvenle düzeltildi.

### Hesaplama Mantığı (5 Kutucuk, Tek Kutu İçinde)

VERİM hesabı (kg/da, toplam kg) her tablo için ayrı ayrı yapılır:
1) Tablo-1 (Yararlanılabilir Yeşil), 2) Tablo-2 (Üretilen Yeşil),
3) Tablo-3 (Üretilen Kuru), 4) "Yararlanılabilir Kuru Ot" (kaynakta
ayrı tablo olarak yok, her zaman Tablo-3 × 0,5 olarak türetilir) - bu
4 kutunun hiçbirinde kendi BBHB değeri yok. 5. kutucuk ise tek, ayrı
bir BBHB hesabı: Günlük BBHB + Otlatma Kapasitesi (Dönemlik BBHB) -
sadece Tablo-1 ve Günlük Yeşil Ot Tüketimi (50 kg) üzerinden.

Gerekçe (kullanıcının kendi ifadesi): "aynı yerdeki otları aynı
miktardaki hayvan kullanabilir, kuru ya da yeşil olması tüketimdeki
tercih biçimi" - yani kapasite tektir, diğer 4 kutu sadece verim
karşılaştırması amaçlıdır.

**Örnek** (İstanbul, İyi, 50 da - kod ile birebir doğrulandı):
Tablo-1 → 20.250 kg, günlük 405 BBHB, dönemlik 2,25 BBHB; Tablo-2 →
40.500 kg, günlük 810 BBHB, dönemlik 4,5 BBHB; Tablo-3 → 10.125 kg,
günlük 810 BBHB, dönemlik 4,5 BBHB.

Arazi Durum Sınıfı "Belirlenmemiş" ise hesaplama yapılamaz, kullanıcıya
uyarı gösterilir. **Otlatma kapasitesi hesabında alan önceliği:** Tapu
Alanı önceliklidir (daha kesin/resmi kabul edilir), boş ise Mera
Alanı'na düşülür (`kayit.tapuAlaniM2 || kayit.meraAlaniM2`).

Ayarlar: Günlük Yeşil Ot Tüketimi, Dönem (gün), "Standart Yıl Günü"
(varsayılan 365, ileride "Islah ve Amenajman" modülünde kullanılması
öngörülüyor).

## Mera Kimliği PDF

Ek-3/a Madde 10 için (bkz. [`3T-EK3A.md`](3T-EK3A.md)). Mera detay
sayfasına "Mera Kimliği (PDF)" indirme butonu eklendi (yeni sekmede
açılır).

**Gerekli kurulum** (`package.json`'a eklendi):
```bash
npm install staticmaps pdf-lib
```
- `staticmaps`: OpenStreetMap tile'larından (ücretsiz, key gerekmez)
  statik harita PNG'si üretir.
- `pdf-lib`: Birden fazla PDF'i/görseli tek bir PDF'de birleştirmek
  için (pdfkit sadece yeni PDF üretir, mevcut PDF'leri birleştiremez).

**`backend/modules/mera/mera.kimlik.js`** - "Mera Kimliği" PDF'sini
üretir, **uçtan uca gerçek veriyle test edildi**:

- **Başlık** (kalın, `İl İlçe Köy/Mahalle Ada/Parsel Nitelik` formatı,
  örnek: "İstanbul Silivri Bekirli 123/45 Mera").
- **Sol sütun**: Tapu Kimlik No, Mera Alanı, Tapu Alanı, Mülkiyet
  Durumu, Arazi Kaynağı, Arazi Durum Sınıfı, Toprak Sınıfı, Eğimi.
- **Sağ sütun**: parselin aktif harita dosyasının GeoJSON türevinden
  okunan sınır koordinatlarıyla OpenStreetMap arka planlı statik
  harita. Harita verisi olmayan parsellerde bilgi notu gösterilir.
- **"Ekler" listesi**: `MeraParseli.dosyalar`'daki tüm belgeler, dosya
  tipi adlarıyla gruplanıp numaralandırılır - aynı tipten birden
  fazla varsa "Tapu Senedi #01", "Tapu Senedi #02", tek taneyse
  numarasız.
- **Belgelerin gerçek içeriği kimlik sayfasının arkasına eklenir**:
  PDF'ler `pdf-lib` ile sayfa sayfa birleştirilir, görseller (.jpg/
  .png) birer PDF sayfasına dönüştürülüp eklenir. Diğer formatlar
  (.docx, .xlsx vb.) sayfa olarak eklenemez ama Ekler listesinde adı
  görünür.

`coklulKimlikPdfOlustur()` - birden fazla parselin kimliğini art arda
tek PDF'de birleştirir (Ek-3/a Madde 10'un kullandığı fonksiyon).

## Parsel Detay Layout

Sayfa başlığından (İl/İlçe/Mahalle/Ada/Parsel) sonra sol bölme
(`mis-icerik-birincil`) kendi içinde ikiye bölünür: `col-lg-7`
(Genel Bilgiler formu/Notlar/Log sekmeleri) + `col-lg-5` (harita,
**sadece Genel Bilgiler sekmesinde**). Sağ bölme (`mis-icerik-
ikincil`) Verim Bilgileri panelini içerir. Sekmeler arası geçişte
Leaflet'in konteyner boyutunu yanlış hesaplamasını önlemek için
`shown.bs.tab` olayında `invalidateSize()` çağrılır.
