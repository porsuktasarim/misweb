# Mera İzleme Sistemi (MİS) — Mimari Rehberi

Bu doküman, projenin klasör yapısını, tasarım ilkelerini ve modüllerin
birbiriyle nasıl konuştuğunu açıklar. Yeni bir modül eklerken veya
mevcut kodda değişiklik yaparken önce burayı okuyun.

## 1. Genel İlke: Bağımsız Yetenekler

Her hesaplama/iş mantığı modülü (BBHB, ÇKS, ...) **bağımsız bir yetenek**
olarak tasarlanır:

- Kendi ekranından çalıştırılabilir
- Başka bir modül tarafından (HTTP değil, doğrudan fonksiyon çağrısıyla)
  kullanılabilir
- Hesaplama mantığı; controller, route, ekran kodundan tamamen bağımsızdır
- Sonuçlar kaydedilir, değişmez (immutable), referansla paylaşılır

## 2. Katman Ayrımı (her hesaplama modülü için ortak desen)

```
backend/modules/<modul>/
  <modul>.core.js        SAF hesaplama çekirdeği. Express/DB bağımlılığı yok.
                          Girdi: normalize veri + kural seti → Çıktı: sonuç
  <modul>.rules.js        Kural/katsayı tablosu (veri olarak, kod olarak değil)
  <modul>.classifier.js   Ham kayıtları standart kategorilere sınıflandırır
  <modul>.import.js       Dış dosya (Excel/CSV) → normalize kayıt dönüşümü
  <modul>.service.js      Orkestrasyon katmanı. DİĞER MODÜLLER BUNU ÇAĞIRIR.
  <modul>.model.js        Mongoose şeması — sonuçların kalıcı kaydı
  <modul>.controller.js   İnce HTTP katmanı — sadece service'i çağırır
  <modul>.routes.js
```

**Kural:** Bir modülün hesaplama mantığına ihtiyaç duyan başka bir modül,
`<modul>.service.js` dosyasını `require` eder. HTTP isteği atmaz, kod
tekrarlamaz.

## 3. Mevcut / Planlanan Modüller

| Modül | Durum | Açıklama |
|---|---|---|
| `bbhb` | Geliştiriliyor | Büyükbaş Hayvan Birimi hesaplama motoru |
| `cks` | Planlanan | ÇKS hesaplama motoru |
| `reporting` | Planlanan | Genel/ortak rapor altyapısı (Excel/Word/PDF) |
| `tahsis` | Planlanan | BBHB sonucunu referansla kullanan tahsis süreci |

## 4. BBHB Modülü — Özet

- **Girdi yolları:** Manuel giriş (kategori + adet) veya Türkvet
  Excel/CSV yükleme (çoklu dosya, birleştirme, işletmeci bazlı gruplama)
- **Sınıflandırma:** `bbhb.classifier.js`, ham kaydı (tür/cinsiyet/yaş/ırk)
  19 sabit kategoriden birine eşler (bkz. `bbhb.rules.js`)
- **Sonuç modeli:** Her çalıştırma yeni ve değişmez bir kayıt oluşturur;
  `kuralSetiVersiyonu` alanı hangi katsayı tablosuyla hesaplandığını saklar
  (kurallar ileride değişse bile geçmiş sonuçlar bozulmaz)
- **Diğer modüllerle ilişki:** Tahsis modülü sonuca `bbhbSonucId` ile
  referans verir, kopyalamaz

## 5. Raporlama Modülü — Özet

Raporlama, BBHB'ye özel değildir; **ortak bir veri sözleşmesi (contract)**
üzerinden çalışır:

```
[BBHB sonucu] ──┐
                 ├─► report.builder.js ─► contract ─► kullanıcı format seçer
[ÇKS sonucu]  ───┘                                     ├─ Excel
                                                        ├─ Word
                                                        └─ PDF
```

```
backend/modules/reporting/
  report.contract.js       Standart rapor veri şekli
  report.builder.js
    adapters/
      bbhb.adapter.js       BBHB sonucu → contract
      cks.adapter.js         (ÇKS geldiğinde eklenecek)
  exporters/
    excel.exporter.js        ExcelJS
    word.exporter.js         docx
    pdf.exporter.js
  report.controller.js       ?format=excel|word|pdf
  report.routes.js
```

Exporter'lar hiçbir zaman "BBHB" veya "ÇKS" bilmez — sadece contract'ı
bilir. Yeni bir modül eklendiğinde sadece yeni bir adapter yazılır,
exporter'lara dokunulmaz.

## 6. Dil / Terim Yapısı

Tüm ekran metinleri, kategori adları, rapor başlıkları kodda **doğrudan
yazılmaz**; merkezi bir sözlük dosyasından (`config/lang/tr.js`) okunur.
Bkz. ayrı `tr.js` örneği. Amaç: "BBHB" gibi bir terim değişirse (örn.
"BüBH" olursa) tek dosyada tek değişiklikle tüm sistem güncellenir.

**Kural:** Kod içindeki anahtarlar (`lang.bbhb.kisaAd` gibi) sabit kalır,
sadece sözlükteki değer değişir. Kod hiçbir yerde `"BBHB"` string'ini
literal olarak içermez.

## 7. Geliştirme Sırası (BBHB için)

1. `bbhb.core.js` + `bbhb.rules.js` — hesaplama motoru
2. `bbhb.import.js` — Türkvet veri okuyucu
3. `bbhb.classifier.js` — sınıflandırma kuralları
4. `bbhb.model.js` — sonuç modeli
5. `reporting/` — raporlama
6. `bbhb.controller.js` + arayüz

## 8. Genel Kod Kuralları

- Stack: Node.js 20, Express.js, Mongoose 8, MongoDB 7, Bootstrap 5,
  Vanilla JS, ExcelJS, docx, Docker/Coolify
- Arayüz dili: Türkçe (bkz. Bölüm 6 — merkezi sözlük üzerinden)
- Kapsam: 4342 sayılı Mera Kanunu, il/ilçe müdürlükleri
- Kurallar/katsayılar kod içine gömülmez, `*.rules.js` dosyalarında veri
  olarak tutulur ve versiyonlanır
- Her hesaplama modülü: core (saf) → service (orkestrasyon) →
  controller (HTTP) katmanlarına ayrılır

## 9. Güncel Durum Notu (10. paket sonrası)

BBHB modülü tamamlandı: hesaplama motoru, Türkvet + manuel girdi,
il/ilçe/mahalle bazlı bölümleme, Excel/Word/PDF raporlama (ortak şema
`reporting/sablonlar/bbhb-tablo-semasi.js`), Kayıtlı Sonuçlar ekranı.

Yeni eklenen dosyalar:
- `backend/modules/bbhb/bbhb.aciklamalar.js` - kategori yaş/cinsiyet/ırk
  açıklamaları (TEK KAYNAK; hem raporlama hem manuel giriş formu buradan
  okur, `GET /api/bbhb/kategoriler` ile dışa açılır)
- `backend/modules/reporting/sablonlar/bbhb-tablo-semasi.js` - Excel/
  Word/PDF'in ORTAK sütun şeması ve kriter paragrafları
- `backend/modules/reporting/sablonlar/fontlar/` - PDF'te Türkçe
  karakter desteği için gömülü DejaVu Serif fontu (Times New Roman
  PDFKit'te embed edilemiyor ve Türkçe karakter içermiyor - Excel/Word'de
  gerçek Times New Roman kullanılabiliyor çünkü onlar sadece font ADI
  yazıyor, kullanıcının sistemindeki fontu kullanıyor)
- `frontend/public/assets/js/mis-menu.js` + `shell.js` - modüler kabuk

Sıradaki adaylar: ÇKS modülü, Tahsis modülü, Tahmini Canlı Ağırlık/Kaba
Yem/Mera Miktarı hesaplama bölümleri (formülleri henüz tanımlı değil),
imzalı rapor çıktısı.

## 10. Güncel Durum Notu (20. paket sonrası)

BBHB'ye ek olarak 2 yeni bağımsız modül tamamlandı:

- **EKGB** (`backend/modules/ekgb/`) — Eski Konumuna Getirme Bedeli.
  `ekgb.kalemler.js` (25 sabit kalem), `ekgb.donem.model.js` +
  `ekgb.donem.service.js` (dönemsel fiyat - EKLE/DÜZENLE var, SİL YOK),
  `ekgb.core.js` (Excel formüllerinin birebir portu - gerçek dosyayla
  santimine kadar doğrulandı). Rapor 2 sayfa: hesap+imza / açıklamalar.

- **ÇKS** (`backend/modules/cks/`) — Çiftçi Kayıt Sistemi listesinden
  Ek-4/a "Çiftçi Aile ve Geçim Kaynağı Bildirim Cetveli" üretir.
  `cks.urun-siniflandirma.js` anahtar-kelime tabanlı otomatik
  kategorilendirme yapar (Yem Bitkisi / Sebze-Meyve / Hububat-Yağlı
  Tohumlar), bilinmeyen ürünler varsayılan kategoriye düşer ve
  önizlemede uyarı gösterilir.

- **`reporting/sablonlar/excel-birimler.js`** — Excel'in font-bağımlı
  "karakter birimi" sütun genişliğini gerçek cm'ye çeviren ortak
  dönüştürücü (BBHB + ÇKS Excel exporter'ları bunu kullanır, tüm
  sütunlar 1cm, tüm satırlar 0.45cm standardında).

**Öğrenilen kritik ders (ExcelJS):** Birleştirilmiş (merge) hücrelerde
TÜM hücreler aynı stil nesnesini paylaşır — bir döngüyle her sütuna
farklı stil (hizalama vb.) yazmaya çalışmak, son yazılanın öncekileri
EZMESİNE yol açar. Kural: merge edilmiş bir alanda stil SADECE master
(ilk/sol üst) hücreye, TEK SEFER uygulanmalı; döngüde diğer hücreler
atlanmalı.

Sıradaki adaylar: EKGB'nin ikinci hesaplama yöntemi, Tahmini Canlı
Ağırlık/Kaba Yem/Mera Miktarı bölümleri, Personel ekleme ayar sayfası
(EKGB/ÇKS imza bloklarının oradan seçime çevrilmesi için), Tahsis
modülü.

## 11. Güncel Durum Notu (32. paket sonrası)

Önceki notta "sıradaki adaylar" olarak sayılan Personel modülü ve
Tahsis'in temeli (Ek-4ab) tamamlandı; ayrıca yeni bir Mevzuat modülü
eklendi.

- **Ek-4ab** (`backend/modules/ek4ab/`) — BBHB + ÇKS'yi isim
  eşleştirmeyle birleştiren ilk modül. `ek4ab.core.js` saf birleştirme
  mantığını, `personel/imza-gruplama.js` ve `personel/personel.kurumlar.js`
  imza sıralama/gruplama kurallarını içerir. Bu üçü TEK BAŞINA test
  edilebilir (DB gerektirmez) - yeni bir raporlama modülü eklenirken
  aynı ayrıştırma örnek alınmalı.

- **Personel Yönetimi** (`backend/modules/personel/`) — Teknik Ekip
  Üyeleri tamamlandı (Kullanıcılar ve İl Mera Komisyonu Üyeleri HENÜZ
  YOK, Ayarlar sayfasında placeholder olarak duruyor). Kurum bazlı
  imza metni üretimi (`imzaKurumMetniOlustur`) ve toplu üye yükleme
  (`teknikEkip.import.js`) ayrı fonksiyonlarda - CSV YÜKLEMESİNDE
  ÖNEMLİ BİR HATA bulundu ve düzeltildi: `XLSX.readFile` CSV'lerde
  Türkçe karakterleri (UTF-8) yanlış algılıyordu - CSV için dosya
  ÖNCE UTF-8 metin olarak okunup `XLSX.read(metin, {type:'string'})`
  ile veriliyor artık (bbhb.import.js ve cks.import.js'te de aynı
  düzeltme yapıldı).

- **Mevzuat** (`backend/modules/mevzuat/`) — mevzuat.gov.tr'den
  otomatik içerik çekme, PDF yükleme, haftalık (Pazartesi 04:00)
  değişiklik kontrolü, sürüm geçmişi, jsdiff ile kelime-bazlı fark
  görünümü. **KRİTİK ÖĞRENİLEN DERS:** bedesten.adalet.gov.tr API'si
  bazı belgeleri HTML değil HAM PDF baytları olarak döndürüyor -
  `mevzuat.gov-cek.js` içeriği "%PDF-" imzasına göre kontrol eder,
  PDF ise diske kaydedip `pdf-parse`(v2 - sınıf tabanlı API,
  `new PDFParse({data}).getText()`) ile metin çıkarır. Bu kontrol
  YAPILMADAN önce icerik doğrudan UTF-8'e çevriliyordu ve okunmaz
  çöp üretiyordu.

- **Türkçe arama kök nedeni** (`yerlesim.service.js`) — MongoDB'nin
  `$regex` + `'i'` seçeneği Türkçe karakterlerde (ı/İ/ş/ğ) TAM
  Unicode büyük-küçük harf katlaması YAPMIYOR (PCRE varsayılan olarak
  sadece ASCII katlıyor). Bu yüzden Türkçe metin araması gereken HER
  YERDE MongoDB regex yerine, veriyi belleğe alıp
  `toLocaleLowerCase('tr-TR')` ile JS tarafında filtrelemek gerekiyor
  (bkz. `aramaOnbellegi` deseni). Gelecekte benzer bir arama
  eklenirse bu deseni tekrar kullan, Mongo regex'e güvenme.

- **Dosya adı standardı** — `reporting/sablonlar/rapor-dosya-adi.js`
  artık BBHB/ÇKS/Ek-4ab'nin TÜMÜNDE kullanılıyor. Yeni bir rapor
  modülü eklenirken bu dosyadaki `raporDosyaAdiOlustur`/
  `contentDispositionDegeri` fonksiyonları kullanılmalı, elle
  Content-Disposition yazılmamalı (Türkçe karakter/RFC 5987 kodlaması
  zaten çözülmüş durumda).

**Test edilemeyen kısım:** `mevzuat.gov-cek.js`'nin gerçek
bedesten.adalet.gov.tr çağrıları - geliştirme kum havuzunun ağ
erişimi bu alan adına kapalı, sadece taklit edilmiş (mock) fetch
yanıtlarıyla test edildi. Canlı ortamda ilk kullanımda doğrulanmalı.

Sıradaki adaylar: Personel Yönetimi'nde Kullanıcılar + İl Mera
Komisyonu Üyeleri bölümleri, Ek-4ab'nin Word/PDF çıktısı, Tahsis
modülünün geri kalanı (Ek-4ab zaten temelini attı).
