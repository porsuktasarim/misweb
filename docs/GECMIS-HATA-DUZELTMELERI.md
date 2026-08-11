# Geçmiş Hata Düzeltmeleri ve Teşhis Günlüğü

Bu dosya, ana `README.md`'yi sade tutmak için ayrılmış, kronolojik bir
sorun-giderme günlüğüdür. Güncel davranışı öğrenmek için değil,
**belirli bir hatanın nasıl bulunup çözüldüğünü** anlamak için
kullanılır.

## Ek-3/a Madde 7 (Parsel Seç) - Kaydetme Sorunu (5 Aşamalı Çözüm)

Bu, tek bir hatanın kullanıcı geri bildirimleriyle adım adım
derinleşen teşhisinin tam kaydıdır.

### Aşama 1: İlk fark edilme

**Kullanıcının bildirdiği hata:** "parselleri seçip kaydetmeme rağmen
kaydolmuyor ve çıktıda görünmüyor."

**Bulunan (kısmi) neden:** `uc-t.service.js`'deki `adimVeriKaydet()`
(Ek-3/a'nın ana "Kaydet" butonunun kullandığı genel endpoint)
`altAdim.veri = veri;` şeklinde tam üzerine yazma yapıyordu.
Frontend'deki `ek3aKaydet()` (ana Kaydet butonu), Madde 8'in (BBHB)
verisini kaybolmasın diye `...hayvanVerisi` ile `veri` objesine
bilerek geri ekliyordu - ama Madde 7'nin (`madde7Satirlari`,
`secilenParselIdleri`) aynı koruması unutulmuştu.

**Düzeltme:** `ek3aKaydet()`'in `veri` objesi `hayvanVerisi` ile aynı
desende, mevcut `kayit.surec[...].veri.madde7Satirlari` ve
`secilenParselIdleri`'ni de koruyarak eklendi.

### Aşama 2: "Hâlâ olmuyor" - kapsamlı yeniden inceleme

**Kullanıcının bildirdiği hata:** "formu doldurmadan tamamlandı
işaretle nin yanındaki kaydete basıyorum ama ne pdf'te oluyor, ne de
parseller kaydediliyor."

`ek3aKaydet()`, `ek3aParselSecKaydet()`, `renderSurec()`,
`uc-t.routes.js`, `adimVeriKaydetHandler`, `uc-t.export.js`'in
`madde7Satirlari` kullanımı, `adimDisaAktarHandler` - hepsi tek tek
yeniden okunup doğru olduğu doğrulandı. Statik analizle ek bir mantık
hatası bulunamadı - bu noktada deployment/cache şüphesiyle kod genelde
savunmacı hale getirildi (`try/catch` eklendi, sessiz hatalar artık
görünür).

### Aşama 3: Mongoose Mixed-type + markModified() teorisi

Kullanıcının ikinci gözlemi ("Parsel Seç'in kendi kaydı çalışıyor,
ama sonra genel Kaydet'e basınca siliniyor") backend'deki
`kayit.surec[i].altAdimlar[j].veri` yapısının (iç içe subdocument
dizisi + Mixed tip) Mongoose'un otomatik değişiklik takibi
tarafından güvenilir algılanamayabileceğini düşündürdü.
`kayit.markModified('surec')` eklendi - ama bu da **yeterli
olmadı** (kullanıcı "halen kaydetmiyor" dedi, MongoDB başlangıç
loglarını paylaştı - bu loglar sorgu detayı içermediği için teşhise
yardımcı olmadı).

### Aşama 4: markModified() yerine doğrudan $set

`markModified()`'ın da güvenilmez kaldığı görülünce, "oku → mutasyona
uğrat → save()" deseni tamamen terk edildi. `adimVeriKaydet`,
`ek3aAraziVerileriKaydet`, `ek3aHayvanVarligiCek` fonksiyonları
`Model.findOneAndUpdate()` ile doğrudan, tam yolu (dot-notation, örn.
`surec.2.altAdimlar.3.veri`) belirten bir `$set` sorgusuna yeniden
yazıldı - Mongoose'un değişiklik-algılama katmanını tamamen bypass
eder.

### Aşama 5: Kesin kök neden - teşhis loglarıyla bulundu

Bu noktada `adimVeriKaydet`'e geçici teşhis logları eklendi
(`[TEŞHİS]` etiketiyle, `updateOne` sonucu + yazma öncesi/sonrası
veri karşılaştırması). Kullanıcının paylaştığı log **kesin kanıt**
sağladı: `matchedCount:1, modifiedCount:1` ile yazma işleminin
kendisi başarılıydı (yani Aşama 4'teki düzeltme gerçekten
çalışıyordu) - ama gönderilen `veri` objesinde `madde7Satirlari` HİÇ
YOKTU.

**Gerçek kök neden:** `ek3aKaydet()`, Ek-3/a'da bir BBHB kaydı
seçiliyse önce `/ek3a-hayvan-varligi-cek` endpoint'ini çağırıyor - ve
**bu backend fonksiyonu (`ek3aHayvanVarligiCek`) `veri` alanının
tamamını sadece 3 BBHB alanıyla üzerine yazıyordu**, daha önce
"Parsel Seç" ile kaydedilmiş `madde7Satirlari`'yı hem veritabanından
hem frontend'in hafızasından siliyordu. Sonrasında "önceki madde7
verisini koru" adımı çalıştığında koruyacak hiçbir şey kalmamış
oluyordu. **Bu, kullanıcının "aynısını çiftçi ailesi ve mevcut hayvan
varlığında da yaşamıştık" ifadesini de açıkladı** - aynı "tam üzerine
yazma" hata sınıfı, form genelinde tekrarlanan bir kalıptı.

**Kesin düzeltme:** `ek3aHayvanVarligiCek` artık (tıpkı
`ek3aAraziVerileriKaydet` gibi) önce mevcut `veri`'yi okuyup
koruyarak BBHB alanlarını birleştiriyor - hiçbir alanı silmiyor.
Kullanıcı "sonunda oldu" diyerek doğruladı.

**Genel ders:** Bu form genelinde `altAdim.veri = {...}` şeklinde
TAM ÜZERİNE YAZAN başka fonksiyonlar da olabilir (`adimGuncelle`,
`ek4aVeriCek`, `ek4bVeriCek`, `karar1Kaydet`, `birlestirVeDevamEt` -
bu turlarda bilinçli olarak kapsam dışı bırakıldı, eski
`markModified()` deseninde kaldılar). Benzer bir "veri kayboluyor"
şikayeti bu fonksiyonlardan biriyle ilgili gelirse, İLK kontrol
edilecek şey bu olmalı: bu fonksiyon `veri`'yi MERGE mi ediyor, yoksa
TAMAMEN ÜZERİNE Mİ yazıyor?

## Ek-3/a Madde 10 - Unutulan Entegrasyon

"Mera Kimliği" PDF üreticisi (`mera.kimlik.js`) yazılıp test
edilmişti, ama sadece Mera Modülü'nün kendi detay sayfasına
bağlanmıştı - Ek-3/a formunun Madde 10 alanı hâlâ eski placeholder'ı
gösteriyordu. Kullanıcı "10 adımda düzelmemiş yalnız" diyerek fark
etti. Gerçekten tamamlandı: `coklulKimlikPdfOlustur()` (birden fazla
parselin kimliğini birleştirir), `madde10KimlikPdfIndir()`, yeni
endpoint, frontend'de gerçek indirme linki/uyarı metni.

## Mera Liste Filtresi - "Aktif" Hiçbir Şey Göstermiyordu

`durum` alanı `MeraParseli` şemasına sonradan eklendiği için eski
kayıtlarda bu alan veritabanında hiç yoktu (Mongoose varsayılanları
geriye dönük olarak eski belgelere işlenmez - `meraVerimAyarlari`
için de daha önce aynı hata sınıfı yaşanmıştı). "Aktif" filtresi tam
eşleşme aradığı için eski kayıtlar hiç yakalanmıyordu. Düzeltme:
`{ $in: ['Aktif', null] }` - MongoDB'nin bilinen bir davranışı
sayesinde hem `durum:'Aktif'` olan hem alanın hiç olmadığı belgeleri
eşleştirir.

## Verim Bilgileri Paneli Sonsuza Kadar "Yükleniyor" Kalıyordu

Kök neden: `meraVerimAyarlari.service.js`'deki
`otlatmaKapasitesiHesapla()` hâlâ önceki bir taslak tasarımın alan
adlarını döndürüyordu, ama frontend gerçekten 3-tablo yapısını
bekliyordu - önceki bir turda sadece frontend düzeltilmiş, backend
hiç kontrol edilmemişti. Backend gerçekten 3-tablo yapısına çevrildi,
frontend'e de try/catch eklendi (benzer bir uyumsuzluk tekrar olursa
panel görünür bir hata gösterecek, sonsuza dek takılı kalmayacak).

## leaflet-omnivore CDN Adresi Yanlıştı

`@mapbox/leaflet-omnivore` diye scoped bir paket YOK - gerçek npm
paket adı sadece `leaflet-omnivore`. Yanlış adres 404 verip TÜM
KML/GPX gösterimini sessizce bozuyordu. Doğru adres web'den dosya
içeriği okunarak doğrulanıp düzeltildi.

## Sandbox Sıfırlanması Olayı

Bir turda çalışma alanı (sanal makine) sıfırlanmış bulundu. Kurtarma:
önceki tüm paketler (`misweb proje 054`'ten itibaren) sırayla üst
üste açılarak proje yeniden inşa edildi - bu, gerçek kaynağın her
zaman kullanıcının kendi git deposu olduğunu doğruladı.
