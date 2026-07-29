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
  ile devam edilir. Diğer adımlar (Ek-4/c-h, Ek-5, Ek-6) ŞİMDİLİK
  manuel tamamlandı işaretlemesi + not alanı ile takip edilir.
  0. ADIM ARTIK İKİ ALT ADIMDAN OLUŞUYOR: önce "Komisyon ve Teknik
  Ekip Seçimi" (bu 3T kaydı için GENEL referans İl Mera Komisyonu +
  Teknik Ekip seçilir - yıl girilince o yıla ait kayıt varsa otomatik
  önerilir, değiştirilebilir), sonra "İl Mera Komisyonu Kararı". Karar
  formunun kendi komisyon seçimi BAĞIMSIZDIR (ön-adımdan varsayılan
  gelir ama üzerine yazılabilir); ayrıca Karar Tarihi girilince o
  YILA ait komisyon varsa yine otomatik önerilir - komisyon seçimi ve
  karar tarihi birbirini KİLİTLEMEZ (bir kurum bu kararda imzacı
  olmasa da başka belgelerde imzacı olabilir). BAŞKANLIK ZİNCİRİ
  4342 sayılı Kanun m.3'e göre: normalde Vali Yardımcısı başkanlık
  eder; o yoksa İl Müdürü, o da yoksa Teknik Personel (ziraat
  mühendisi) başkanlık eder - Vali'nin KENDİSİ bu zincirin parçası
  DEĞİLDİR, sadece komisyonu onaylar (valilik onayı) ve İSTERSE
  (zorunlu olmaksızın) katılımcı/imzacı olabilir. Komisyon üyeleri
  kanunun 11 kişilik listesine birebir uygun: Vali (opsiyonel), Vali
  Yardımcısı, İl Müdürü, Teknik Personel, DSİ Bölge Müdürlüğü, Orman
  Bölge Müdürlüğü, Muhtarlık, Defterdarlık, Milli Emlak Müdürlüğü
  VEYA Milli Emlak Dairesi Başkanlığı (İKİSİ BİRDEN DEĞİL - komisyon
  kaydında bir "Milli Emlak Türü" seçimi var, sadece seçilen tür
  Ayarlar'da ve 3T'nin katılımcı listesinde görünür), İl Kadastro
  Müdürlüğü, Ziraat Odası Başkanlığı, İl Jandarma Komutanlığı, İl
  Emniyet Müdürlüğü. Başkan olmayan İl Müdürü/Teknik Personel normal
  katılımcı listesinde görünür (çift sayılmaz - test edildi). Köye
  özgü Muhtar bilgisi (varsa o yılın Teknik Ekip listesinden OTOMATİK
  doldurulur, düzenlenebilir), PDF karar belgesi yükleme + indirmeden
  açılır-kapanır görüntüleme. ADIM 2 (Duyuru/Ek-1) ve ADIM 3 (Duyuru
  Tutanağı/Ek-2): il/ilçe/köy otomatik alınır; Tespit ve Tahdit
  Başlangıç Tarihi SADECE Duyuru'da girilir, Duyuru Tutanağı bunu
  Duyuru'dan OKUR (tekrar giriş yok, tek kaynak). Duyuru Tutanağı'nda
  ayrıca gönderim kurumları işaretlemeli listesi (Köy/Mahalle
  Muhtarlığı, Belediye Başkanlığı, Orman Bölge Müdürlüğü, DSİ,
  Büyükşehir Belediyesi, Komşu İlçe Belediyeleri, Komşu Mahalle
  Muhtarlıkları, Milli Emlak Dairesi Başkanlığı/Müdürlüğü + serbest
  "diğer kurumlar"). Her iki adımın komisyon seçimi "Komisyon ve
  Teknik Ekip Seçimi" ön-adımından VE Adım 1'den varsayılan alır
  (bağımsız kalır, değiştirilebilir). İMZA BLOKLARI İKİNCİ KEZ
  GÖZDEN GEÇİRİLDİ (kullanıcı geri bildirimiyle): Duyuru (Ek-1) ve
  Tebliğ Belgesi (Ek-3) sağ (3.) sütunda ORTALI - tarih, 3 satır
  boşluk (2.sinde "İMZA" - Belge Görünüm Ayarları'ndaki renkte), Ad
  Soyad (Adım 1'de GERÇEKTEN belirlenen başkandan - Vali Yardımcısı/
  İl Müdürü/Teknik Personel, hangisiyse), Unvan, "İl Mera Komisyonu
  Başkanı". Duyuru Tutanağı (Ek-2): tarih ARTIK AYRI SATIR DEĞİL,
  "...imza altına alınmıştır." cümlesinin HEMEN SONUNA eklenir; 4
  EŞİT SÜTUN: gri imza çizgisi + 1 satır boşluk + "Adı Soyadı"/
  "Ünvanı" etiketleri (BOŞ ŞABLON - Köylerde Muhtar+3 İhtiyar Heyeti
  Üyesi, Belediyelerde Belediye Başkanı+3 yetkili elle doldurur).
  HER BELGENİN SOL ÜST KÖŞESİNDE "(Ek-1)"/"(Ek-2)"/"(Ek-3)" etiketi
  (İMZA rengiyle, orijinal şablonlara uygun). Word/docx.js'in \n
  karakterini paragraf saymadığı GERÇEK HATASI düzeltildi - her
  paragraf artık GERÇEKTEN AYRI bir Paragraph nesnesi (test edilip
  doğrulandı: Word'de gerçekten 2+ ayrı paragraf görünüyor). Sağ
  sütundaki ayrı "Ek-4ab Kaynağı" bloğu kaldırıldı (Birleştirme adımı
  zaten otomatik bağlıyor). Tebliğ Belgesi (Ek-3) ARTIK GERÇEK FORM:
  il/ilçe/köy + başlangıç tarihi (Duyuru'dan, tek kaynak) otomatik,
  ÜSTTEKİ ALICI BAŞLIĞI KALDIRILDI (kullanıcı isteğiyle), komisyon
  adı "{İl} İl Mera Komisyonu Teknik Ekiplerince" formatında, gövde
  metninde m.7 (başlama) VE m.8 (30 gün belge teslimi) paragrafları,
  Duyuru ile AYNI gerçek-başkan imza formatı, altında "Ek: ... Bilgi
  Cetveli (Ek-3/a)" notu - Word/PDF çıktısı test edilip doğrulandı.
  TÜM ÇIKTILARDA satır aralığı 1.5 (Word: satır aralığı ayarı test
  edilip doğrulandı; PDF: yaklaşık lineGap). Duyuru Tutanağı'nın 4'lü
  imza bloğundaki GRİ ÇİZGİLER KALDIRILDI, her sütuna "İMZA" yazısı
  eklendi (tek-imza bloğuyla tutarlı - hem ekranda hem Word/PDF'te
  test edildi). Duyuru Tutanağı ve Tebliğ Belgesi'ne artık DOSYA
  EKLENEBİLİYOR (PDF, opsiyonel) - dosya adı elle girilebilir (evrak
  no), VARSAYILAN olarak "3T_{İlçe}_{KöyMahalle}_ek-X" deseni önerilir
  (test edildi), eklenen dosya indirmeden açılır-kapanır görüntülenir.
  YENİ "Belge Görünüm Ayarları" (Ayarlar sayfasında): İMZA rengi
  (renk seçici + hex) ve Word yazı tipi (Times New Roman vb.) BURADAN
  yönetilir, TÜM 3T çıktılarında (ekranda VE Word/PDF'te) tutarlı
  kullanılır - PDF Türkçe karakter desteği için sabit gömülü font
  (DejaVu Serif) kullanır, yazı tipi ayarı sadece Word'ü etkiler.
  EK-3/A (Bilgi Cetveli) ARTIK NUMARALI GÖRÜNÜM + EXPORT: "1. İli:
  {değer}" şeklinde 12 madde numaralı gösterilir; OTOMATİK gelen
  1-4 (İli/İlçesi/Mahalle/Köyü) DEĞİŞTİRİLEMEZ (salt okunur); Aile
  Sayısı elle; Çiftçi Aile Sayısı ÇKS kaydından seçilerek
  (ciftciler.length); Arazi bölümü (m.7) VE Harita/Kroki (m.10) "Mera
  Modülü"nden gelecek diye İŞARETLENİP boş bırakıldı (henüz
  kurulmadı); Mevcut Hayvan Varlığı (m.8) BBHB kaydından - Ek-4/b ile
  AYNI backend mantığı (kod tekrarı yok) - kategori kırılımı olarak
  çekilir; Kullanılan Alanlardan Yararlanma Şekli (m.9) GENİŞLETİLDİ
  ve tutarlı pasif ifadeyle düzeltildi: Otlatılarak / Kuru ot (saman)
  olarak biçilerek / Yeşil ot (yem) olarak biçilerek / Silaj yapılarak
  / Dinlendirilerek (nadasa bırakılarak) + serbest "diğer" (elle);
  m.11 basit not alanı ("olduğu gibi" - özel işlem yok); m.12 serbest
  metin. ARTIK Word/PDF EXPORT var (imzasız, sade cetvel formatında -
  test edilip doğrulandı) VE dosya ekleme (PDF, varsayılan ad
  "3T_{İlçe}_{KöyMahalle}_ek-3a") mevcut. Tahsis (Ek-7 ve sonrası)
  HENÜZ EKLENMEDİ.
- **Personel Yönetimi** (Ayarlar içinde) — Teknik Ekip Üyeleri: yıl/ilçe
  bazlı akordiyon, kurum seçimine göre otomatik imza metni üretimi
  (Muhtarlık/Mahalli Bilirkişi/Belediye vb.), toplu üye yükleme
  (xlsx/xls/csv/json); 3T'nin Muhtar otomatik doldurma özelliği bu
  modülün "muhtarlik" kurumlu üyelerini kullanır. İl Mera Komisyonu
  Üyeleri: yıl/il bazlı akordiyon, 4342 sayılı Kanun m.3'ün 11 kişilik
  komisyon tanımına birebir uygun SABİT kurum listesi (imza sırasına
  göre: Vali (opsiyonel), Vali Yardımcısı, İl Müdürü, Teknik Personel,
  DSİ Bölge Müdürlüğü, Orman Bölge Müdürlüğü, Muhtarlık, Defterdarlık,
  Milli Emlak Müdürlüğü VEYA Milli Emlak Dairesi Başkanlığı (İKİSİ
  BİRDEN DEĞİL - komisyon kaydında "Milli Emlak Türü" seçimi var,
  seçime göre sadece biri tabloda gösterilir/doldurulur), İl Kadastro
  Müdürlüğü, Ziraat Odası Başkanlığı, İl Jandarma Komutanlığı, İl
  Emniyet Müdürlüğü). Vali/Vali Yardımcısı/İl Müdürü'nün unvanı otomatik/sabit
  ve yedeği yok; Vali KANUNEN başkanlık zincirinin parçası DEĞİLDİR
  (sadece opsiyonel katılımcı/onaylayıcı - m.3), başkanlık sırası Vali
  Yardımcısı → İl Müdürü → Teknik Personel'dir (3T'de bu sıra
  uygulanır). Muhtar köye özgü olduğu için burada sabit kayıt
  tutulmaz; diğer kurumların asıl+yedek temsilcisi var, güvenlik
  kurumları (Jandarma/Polis) ayrı etiketli. Kullanıcılar bölümü hâlâ
  iskelet halinde (henüz doldurulmadı) - 3T'de planlanan "adımı
  işlemsiz tamamlama izni" bu bölüme bağlı olacak.
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
- Personel Yönetimi'nde Kullanıcılar bölümü henüz yapılmadı
  (placeholder) - kullanıcı yetki sistemi (3T'de "adımı işlemsiz
  tamamlama izni" dahil) bu bölüme bağlı olarak ileride kurulacak.
- 3T modülünde Tahsis (Ek-7, 7/a-f, Ek-8, Ek-9, Ek-10) henüz yok -
  sadece Tespit/Tahdit (A/B/C bölümleri) var. B bölümünde Ek-4/a ve
  Ek-4/b BBHB+ÇKS'den otomatik hesaplanıyor, geri kalan adımlar
  (Ek-2, Ek-3, Ek-4/c-h, Ek-5, Ek-6) şimdilik sadece manuel
  tamamlandı/not takibi - gerçek belge/veri formları henüz yok.
