# Mera İzleme Sistemi (MİS)

4342 sayılı Mera Kanunu kapsamında il/ilçe müdürlükleri için geliştirilen,
modüler yapı taşlarından oluşan hesaplama, raporlama ve mevzuat takip
sistemi.

## Kurulum

```bash
npm install
cp .env.example .env
npm run dev
```

Docker/Coolify ile: repo kökündeki `docker-compose.yml` kullanılır.

## Mimari

Genel tasarım ilkeleri için bkz. [`docs/MIMARI_REHBERI.md`](docs/MIMARI_REHBERI.md).
Özetle: her hesaplama modülü bağımsız bir yetenek olarak tasarlanır -
kendi ekranından çalışabilir, başka modüllerden fonksiyon çağrısıyla
kullanılabilir, hesaplama mantığı HTTP/controller katmanından ayrıdır.

## Modüller

- **BBHB** — Büyükbaş Hayvan Birimi hesaplama (manuel + Türkvet dosyası,
  20 kategori/16 sütun BBHB tablo şeması)
- **EKGB** — Eski Konumuna Getirme Bedeli (dönemsel birim fiyat listesi,
  eklenebilir/düzenlenebilir/silinemez; Excel formülleriyle birebir
  doğrulanmış hesaplama motoru)
- **ÇKS** — Çiftçi Kayıt Sistemi'nden Ek-4/a "Çiftçi Aile ve Geçim
  Kaynağı Bildirim Cetveli" üretimi (anahtar-kelime tabanlı otomatik
  ürün sınıflandırma: Yem Bitkisi/Sebze-Meyve/Hububat-Yağlı Tohumlar)
- **Ek-4ab** — BBHB (Ek-4/b) ve ÇKS (Ek-4/a) verilerini isim eşleştirmeyle
  TEK tabloda birleştiren BAĞIMSIZ araç. 36 sütunlu, 3 katmanlı
  başlıklı resmi form + Teknik Ekip imza bloğu (kurum önceliğine göre
  otomatik sıralama, 4'erli gruplama kuralları). 3T modülü bu
  modülden REFERANS ALIR ama Ek-4ab kendi başına da kullanılabilir
  durumda kalır (değiştirilmedi).
- **3T (Tespit-Tahdit-Tahsis)** — 4342 sayılı Kanun Uygulama
  Talimatı'nın A/B/C bölümlerine birebir karşılık gelen bir SÜREÇ
  AĞACI (ana adım → alt adım). Her 3T kaydı bir köy/mahalleye
  bağlıdır. Sağ sütunda süreç durumu (14 alt adım: Ek-1..Ek-6),
  sol sütunda seçili adımın veri girişi. Ek-4/a (Çiftçi Aile ve
  Geçim Kaynağı) ve Ek-4/b (Hayvan Varlığı Cetveli) BBHB+ÇKS
  kayıtlarından SEÇİLEREK otomatik hesaplanır (Ek-4/a için Ek-4ab'nin
  `birlestir()` çekirdeği yeniden kullanılır; Ek-4/b için BBHB'nin
  detaylı kategori kırılımları köy düzeyinde toplanır) - ikisi ayrı
  ayrı tamamlanabilir, ardından "4/a ve 4/b Birleştirme Onayı" adımı
  ile devam edilir. Diğer adımlar (Ek-2, Ek-3, Ek-4/c-h, Ek-5, Ek-6)
  ŞİMDİLİK manuel tamamlandı işaretlemesi + not alanı ile takip
  edilir (gerçek veri formları kademeli olarak eklenecek). Tahsis
  (Ek-7 ve sonrası) HENÜZ EKLENMEDİ.
- **Personel Yönetimi** (Ayarlar içinde) — Teknik Ekip Üyeleri: yıl/ilçe
  bazlı akordiyon, kurum seçimine göre otomatik imza metni üretimi
  (Muhtarlık/Mahalli Bilirkişi/Belediye vb.), toplu üye yükleme
  (xlsx/xls/csv/json). Kullanıcılar ve İl Mera Komisyonu Üyeleri
  bölümleri iskelet halinde (henüz doldurulmadı)
- **Mevzuat** — Anayasadan yönetmeliğe, mahkeme kararına kadar hukuki
  kaynak arşivi. mevzuat.gov.tr URL'si yapıştırılınca içerik otomatik
  çekilir (bedesten.adalet.gov.tr API'si; HTML veya PDF formatını
  otomatik ayırt eder, PDF ise `pdf-parse` ile metin çıkarır);
  uygulama talimatı/görüş gibi mevzuat.gov.tr'de olmayan belgeler PDF
  olarak yüklenebilir. Her Pazartesi 04:00'da otomatik değişiklik
  kontrolü (`node-cron`), değişince eski sürüm saklanır, ana sayfada
  uyarı çıkar, kelime-bazlı gerçek fark (diff) görünümü (jsdiff)
- **Yerleşim** — İl/İlçe/Köy-Mahalle listesi (Ayarlar sayfasından
  yönetilir, tüm modüllerde ZORUNLU seçim kaynağı). Türkçe-duyarlı
  bellek-içi arama (MongoDB regex'in Türkçe büyük/küçük harf
  katlamasındaki eksikliğini aşmak için)

## Raporlama

Excel/Word/PDF - gri ton renk şeması (Ek-4ab'de kenarlık, renksiz),
Times New Roman (PDF'te Türkçe karakter desteği için gömülü DejaVu
Serif), 1cm kenar boşluğu, gerçek footer (sayfa numarası + konum
bilgisi). Sütun/satır ölçüleri gerçek cm cinsinden
(`reporting/sablonlar/excel-birimler.js` dönüştürücüsü ile). İndirilen
dosya adları tek biçim: `{onEk}_{il}_{ilçe}_{köyMahalle}_{tarih}_{rastgele}.{uzanti}`
(`reporting/sablonlar/rapor-dosya-adi.js`).

## Arayüz

`frontend/public/` altında statik HTML + Vanilla JS + Bootstrap 5 + Tom
Select (arama+seçim) + Bootstrap Icons. 4 bölgeli uygulama kabuğu
`assets/js/shell.js` + `assets/js/mis-menu.js`'ten otomatik kurulur.
Ana sayfa (`/`) artık gerçek bir pano: hızlı erişim kartları + mevzuat
güncelleme uyarıları.

## Dağıtım

`Dockerfile` + `docker-compose.yml`, Coolify üzerinde. Port: 4342.
`node-cron` ile haftalık mevzuat kontrolü uygulama içinde zamanlanır
(ayrı bir worker/cron servisi gerekmez).

## Stack

Node.js 20, Express.js, Mongoose 8, MongoDB 7, Bootstrap 5, Vanilla JS,
ExcelJS, docx, pdfkit, xlsx (SheetJS), multer, Tom Select, node-cron,
pdf-parse, diff (jsdiff, CDN), Docker/Coolify.

## Bilinen Sınırlamalar

- Mevzuat.gov.tr'den içerik çekme (`mevzuat.gov-cek.js`), geliştirme
  ortamının ağ erişimi kısıtlı olduğu için sadece taklit edilmiş
  (mock) isteklerle test edildi - canlı ortamda ilk kullanımda
  doğrulanması önerilir.
- Ek-4ab raporu şu an sadece Excel formatında (Word/PDF henüz yok).
- Personel Yönetimi'nde Kullanıcılar ve İl Mera Komisyonu Üyeleri
  bölümleri henüz yapılmadı (placeholder).
- 3T modülünde Tahsis (Ek-7, 7/a-f, Ek-8, Ek-9, Ek-10) henüz yok -
  sadece Tespit/Tahdit (A/B/C bölümleri) var. B bölümünde Ek-4/a ve
  Ek-4/b BBHB+ÇKS'den otomatik hesaplanıyor, geri kalan adımlar
  (Ek-2, Ek-3, Ek-4/c-h, Ek-5, Ek-6) şimdilik sadece manuel
  tamamlandı/not takibi - gerçek belge/veri formları henüz yok.
