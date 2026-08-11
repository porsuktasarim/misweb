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
  20 kategori/16 sütun BBHB tablo şeması).
- **EKGB** — Eski Konumuna Getirme Bedeli (dönemsel birim fiyat listesi,
  eklenebilir/düzenlenebilir/silinemez; Excel formülleriyle birebir
  doğrulanmış hesaplama motoru).
- **ÇKS** — Çiftçi Kayıt Sistemi'nden Ek-4/a "Çiftçi Aile ve Geçim
  Kaynağı Bildirim Cetveli" üretimi (anahtar-kelime tabanlı otomatik
  ürün sınıflandırma).
- **Ek-4ab** — BBHB (Ek-4/b) ve ÇKS (Ek-4/a) verilerini isim eşleştirmeyle
  tek tabloda birleştiren bağımsız araç. 3T modülü bu modülden referans
  alır ama Ek-4ab kendi başına da kullanılabilir.
- **3T (Tespit-Tahdit-Tahsis)** — 4342 sayılı Kanun'un A/B/C
  bölümlerine karşılık gelen süreç ağacı modülü. Ayrıntılar:
  [`docs/3T-UC-T.md`](docs/3T-UC-T.md).
- **Mera Modülü** — Parsel bazlı kayıt, harita/CBS dosyaları, otlatma
  kapasitesi hesaplama, durum yönetimi, Mera Kimliği PDF üretimi.
  Ayrıntılar: [`docs/MERA-MODULU.md`](docs/MERA-MODULU.md).
- **Personel Yönetimi** (Ayarlar içinde) — Teknik Ekip Üyeleri
  (yıl/ilçe bazlı, kurum seçimine göre otomatik imza metni + "Üyelik
  Durumu" ataması) ve İl Mera Komisyonu Üyeleri (yıl/il bazlı, kanunun
  11 kişilik komisyon tanımına uygun sabit kurum listesi). Kullanıcılar
  bölümü henüz iskelet halinde.
- **Mevzuat** — Hukuki kaynak arşivi. mevzuat.gov.tr URL'si
  yapıştırılınca içerik otomatik çekilir (bedesten.adalet.gov.tr API'si);
  PDF de yüklenebilir. Her Pazartesi 04:00'da otomatik değişiklik
  kontrolü, kelime-bazlı fark (diff) görünümü.
- **Yerleşim** — İl/İlçe/Köy-Mahalle listesi, tüm modüllerde zorunlu
  seçim kaynağı. Türkçe-duyarlı bellek-içi arama.

## Menü Yapısı

Sol menü iki gruba ayrılmıştır: "Modüller" (3T, Mera — uçtan uca bir
süreci yöneten büyük yapılar) ve "Araçlar" (BBHB, EKGB, ÇKS, Mevzuat —
tek başına kullanılan hesaplama/referans ekranları). Menü tek
kaynaktan (`mis-menu.js`) yönetiliyor, `shell.js` grupları otomatik
render ediyor.

## Raporlama

Excel/Word/PDF — gri ton renk şeması, Times New Roman (PDF'te Türkçe
karakter desteği için gömülü DejaVu Serif), 1cm kenar boşluğu, gerçek
footer (sayfa numarası + konum bilgisi). Sütun/satır ölçüleri gerçek
cm cinsinden (`reporting/sablonlar/excel-birimler.js`). İndirilen
dosya adları tek biçim: `{onEk}_{il}_{ilçe}_{köyMahalle}_{tarih}_{rastgele}.{uzanti}`.

## Arayüz

`frontend/public/` altında statik HTML + Vanilla JS + Bootstrap 5 +
Tom Select + Bootstrap Icons. 4 bölgeli uygulama kabuğu
`assets/js/shell.js` + `assets/js/mis-menu.js`'ten otomatik kurulur.
Ana sayfa (`/`) gerçek bir pano: hızlı erişim kartları + mevzuat
güncelleme uyarıları.

Sistem Ayarları (imza rengi, ekran font boyutları, Mera dosya
tipleri/mülkiyet durumları, harita katman varsayılanları) için bkz.
[`docs/SISTEM-AYARLARI.md`](docs/SISTEM-AYARLARI.md).

## Dağıtım

`Dockerfile` + `docker-compose.yml`, Coolify üzerinde. Port: 4342.
`node-cron` ile haftalık mevzuat kontrolü uygulama içinde zamanlanır.

**Bilinen bir tekrarlayan sorun:** Coolify bazen eski Docker image'ı
cache'ler, deploy sonrası değişiklikler görünmeyebilir. Sunucuda
`git log -1 --oneline` ile son commit'in gerçekten deploy edildiğini
doğrulayın, gerekirse Coolify'da "Force Rebuild" yapın.

## Dil Dosyası (`config/lang/tr.js`)

Sistemin kuralı: tüm görünür metinler buradan okunur, kod içinde
literal Türkçe string yazılmaz. Bu kural şu an **sadece Mera
Modülü'nde** tam uygulanmış durumda (`lang.ortak`, `lang.mera`,
`lang.meraVerimAyarlari`) — diğer modüller henüz taşınmadı (bkz.
Bilinen Sınırlamalar).

## Stack

Node.js 20, Express.js, Mongoose 8, MongoDB 7, Bootstrap 5, Vanilla JS,
ExcelJS, docx, pdfkit, pdf-lib, staticmaps, xlsx (SheetJS), multer,
Tom Select, node-cron, pdf-parse, @tmcw/togeojson, adm-zip, diff
(jsdiff, CDN), Docker/Coolify.

## Bilinen Sınırlamalar

- `config/lang/tr.js` geçişi sadece Mera Modülü'nde tamamlandı - BBHB
  frontend'i, ÇKS, EKGB, 3T, Mevzuat, Personel, İl Mera Komisyonu
  sayfaları ve Ayarlar'ın diğer sekmeleri hâlâ literal Türkçe string
  kullanıyor.
- Mevzuat.gov.tr'den içerik çekme, geliştirme ortamının ağ erişimi
  kısıtlı olduğu için sadece taklit edilmiş (mock) isteklerle test
  edildi - canlı ortamda ilk kullanımda doğrulanması önerilir.
- Ek-4ab raporu şu an sadece Excel formatında (Word/PDF henüz yok).
- Personel Yönetimi'nde Kullanıcılar bölümü henüz yapılmadı
  (placeholder) - kullanıcı yetki sistemi (3T'de "adımı işlemsiz
  tamamlama izni" ve Mera Modülü'nde "sadece admin silebilir" dahil)
  bu bölüme bağlı olarak ileride kurulacak.
- 3T modülünde Tahsis (Ek-7, 7/a-f, Ek-8, Ek-9, Ek-10) henüz yok -
  sadece Tespit/Tahdit (A/B/C bölümleri) var.
- Mera Modülü'nün harita render'ı bu geliştirme ortamında gerçek bir
  tarayıcıda test edilemedi (headless browser yok) - canlı ortamda
  doğrulanmalı.

## Detaylı Dokümantasyon

- [`docs/MERA-MODULU.md`](docs/MERA-MODULU.md) — Mera Modülü'nün tüm
  özellikleri (durum yönetimi, dosyalar, harita, GeoJSON dönüşümü,
  verim ayarları, mülkiyet durumu, Mera Kimliği PDF).
- [`docs/3T-UC-T.md`](docs/3T-UC-T.md) — 3T modülünün tüm adımları
  (Komisyon, Duyuru, Ek-3/a Bilgi Cetveli, Ek-4/a-b).
- [`docs/SISTEM-AYARLARI.md`](docs/SISTEM-AYARLARI.md) — Sistem
  Ayarları sekmesinin tüm alt bölümleri.
- [`docs/GECMIS-HATA-DUZELTMELERI.md`](docs/GECMIS-HATA-DUZELTMELERI.md)
  — Geçmiş hataların nasıl teşhis edilip çözüldüğüne dair kronolojik
  günlük (güncel davranış için değil, referans için).
