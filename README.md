# Mera İzleme Sistemi (MİS)

4342 sayılı Mera Kanunu kapsamında il/ilçe müdürlükleri için geliştirilen,
modüler yapı taşlarından oluşan hesaplama ve raporlama sistemi.

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

- **BBHB** — Büyükbaş Hayvan Birimi hesaplama (manuel + Türkvet dosyası)
- **EKGB** — Eski Konumuna Getirme Bedeli (dönemsel birim fiyat listesi,
  eklenebilir/düzenlenebilir/silinemez)
- **ÇKS** — Çiftçi Kayıt Sistemi'nden Ek-4/a "Çiftçi Aile ve Geçim
  Kaynağı Bildirim Cetveli" üretimi (otomatik ürün sınıflandırma)
- **Yerleşim** — İl/İlçe/Köy-Mahalle listesi (Ayarlar sayfasından
  yönetilir, tüm modüllerde ZORUNLU seçim kaynağı)

## Raporlama

Excel/Word/PDF - gri ton renk şeması, Times New Roman (PDF'te Türkçe
karakter desteği için gömülü DejaVu Serif), 1cm kenar boşluğu, gerçek
footer (sayfa numarası + konum bilgisi). Sütun/satır ölçüleri gerçek cm
cinsinden (`reporting/sablonlar/excel-birimler.js` dönüştürücüsü ile).

## Arayüz

`frontend/public/` altında statik HTML + Vanilla JS + Bootstrap 5 + Tom
Select (arama+seçim). 4 bölgeli uygulama kabuğu `assets/js/shell.js` +
`assets/js/mis-menu.js`'ten otomatik kurulur.

## Dağıtım

`Dockerfile` + `docker-compose.yml`, Coolify üzerinde. Port: 4342.

## Stack

Node.js 20, Express.js, Mongoose 8, MongoDB 7, Bootstrap 5, Vanilla JS,
ExcelJS, docx, pdfkit, xlsx (SheetJS), multer, Tom Select, Docker/Coolify.
