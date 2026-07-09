# Mera İzleme Sistemi (MİS)

4342 sayılı Mera Kanunu kapsamında il/ilçe müdürlükleri için geliştirilen,
modüler yapı taşlarından oluşan hesaplama ve raporlama sistemi.

## Kurulum

```bash
npm install
cp .env.example .env
npm run dev
```

Docker/Coolify ile: repo kökündeki `docker-compose.yml` kullanılır
(bkz. "Dağıtım" bölümü).

## Mimari

Genel tasarım ilkeleri, katman ayrımı ve modül yapısı için bkz.
[`docs/MIMARI_REHBERI.md`](docs/MIMARI_REHBERI.md).

Özetle: her hesaplama modülü (BBHB, ileride ÇKS) bağımsız bir yetenek
olarak tasarlanır - kendi ekranından çalışabilir, başka modüllerden
fonksiyon çağrısıyla kullanılabilir, hesaplama mantığı HTTP/controller
katmanından tamamen ayrıdır.

## Şu ana kadar tamamlanan: BBHB modülü

- **Hesaplama motoru** (`backend/modules/bbhb/`): 20 kategori (7 grup),
  4342 sayılı Kanun esaslarına göre katsayı tablosu, sınıflandırma
  kuralları (yaş/cinsiyet/ırk bazlı)
- **Girdi yolları:**
  - Manuel giriş: kategori başına adet girişi, ekranda her kategorinin
    altında yaş/cinsiyet kuralı gösterilir
  - Türkvet dosyası (.xls/.xlsx/.csv, çoklu dosya): sütun adına göre
    esnek eşleştirme, il/ilçe/mahalle dosyadan otomatik okunur, birden
    fazla mahalle varsa sonuç bölümlere ayrılır
  - Yüklenen dosyalar işlem sonrası sunucuda **saklanmaz**
- **Yaş hesaplama referansı:** hesaplamanın yapıldığı ayın 1. günü
  (rapor açılış tarihi değil) - kayıtla birlikte sabitlenir, denetlenebilir
- **Sonuç kayıtları:** immutable (değişmez), "Kayıtlı Sonuçlar"
  sekmesinden görüntülenebilir/indirilebilir/silinebilir

## Raporlama modülü

Ortak bir veri sözleşmesi (`backend/modules/reporting/report.contract.js`)
üzerinden çalışır - BBHB'ye özel değildir, ileride ÇKS de aynı altyapıyı
kullanacaktır. Çıktı formatları:

- **Excel** (ExcelJS): resmi Ek-4/ab tarzı tablo, gruplu başlıklar,
  katsayı satırı, TOPLAM satırı, gri ton renk şeması, Times New Roman
  8pt, 15pt satır yüksekliği, yatay sayfa, 1cm kenar boşluğu
- **Word** (docx): Excel ile aynı tablo yapısı
- **PDF** (PDFKit + gömülü DejaVu Serif font - Türkçe karakter desteği
  için Times New Roman yerine kullanılıyor, bkz. mimari rehber)

Üç format da `backend/modules/reporting/sablonlar/bbhb-tablo-semasi.js`
dosyasındaki TEK ortak şemayı kullanır.

## Arayüz

`frontend/public/` altında statik HTML + Vanilla JS + Bootstrap 5.
4 bölgeli uygulama kabuğu (marka / üst çubuk / ana menü / içerik + footer)
`assets/js/shell.js` tarafından `assets/js/mis-menu.js`'teki tek menü
tanımından otomatik kurulur - yeni bir modül eklendiğinde sadece
`mis-menu.js`'e satır eklenir, mevcut sayfalara dokunulmaz.

## Dağıtım

`Dockerfile` + `docker-compose.yml` ile Coolify üzerinde çalışacak
şekilde yapılandırılmıştır (bkz. `docs/GITHUB_REHBERI.md` GitHub'a
yükleme adımları için). Port: 4342.

## Stack

Node.js 20, Express.js, Mongoose 8, MongoDB 7, Bootstrap 5, Vanilla JS,
ExcelJS, docx, pdfkit, xlsx (SheetJS), multer, Docker/Coolify.
