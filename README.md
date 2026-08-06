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
  "Belge Görünüm Ayarları" → "**Görünüm Ayarları**" OLARAK YENİDEN
  ADLANDIRILDI (kapsam genişledi): İMZA rengi (renk seçici + hex) ve
  Word yazı tipi (Times New Roman vb.) HÂLÂ BURADAN yönetilir, TÜM 3T
  çıktılarında (ekranda VE Word/PDF'te) tutarlı kullanılır - PDF
  Türkçe karakter desteği için sabit gömülü font (DejaVu Serif)
  kullanır, yazı tipi ayarı sadece Word'ü etkiler.
  EK-3/A (Bilgi Cetveli) — KULLANICININ PAYLAŞTIĞI GERÇEK ORİJİNAL
  GÖRSELE GÖRE TAM UYUMLU HALE GETİRİLDİ: başlık "(Ek-3/a)" + iki
  satırlı "Mera Kanunu'nun 8 inci Maddesi Gereği" / "MERA, YAYLAK,
  KIŞLAK, OTLAK, ÇAYIR BİLGİ CETVELİ" + "Tespit ve Tahdit Çalışması
  Yapılacak Alanın :" alt başlığı eklendi (daha önce eksikti). "1.
  İli: {değer}" şeklinde 12 madde numaralı gösterilir; OTOMATİK gelen
  1-4 (İli/İlçesi/Mahalle/Köyü) DEĞİŞTİRİLEMEZ (salt okunur). Aile
  Sayısı elle; Çiftçi Aile Sayısı ÇKS kaydından seçilerek
  (ciftciler.length). ARAZİ BÖLÜMÜ (m.7) ARTIK GERÇEK TABLO YAPISINDA
  (orijinaldeki gibi): satırlar Mera/Yaylak/Kışlak/Otlak/Çayır,
  sütunlar Miktarı(Dekar)/Parça Adedi/Mevki/Diğer Bilgiler - hücreler
  "Mera Modülü" kurulana kadar boş. MEVCUT HAYVAN VARLIĞI (m.8) ARTIK
  GERÇEK 3x3 TABLO (orijinaldeki gibi - önceki İnek/Dana-Düve
  kırılımı YANLIŞTI, düzeltildi): satırlar Büyükbaş/Küçükbaş/
  Diğerleri, sütunlar Kültür/Kültür Melezi/Yerli; her hücre "X adet
  (Y BBHB)" formatında (BBHB kaydındaki ÖNCEDEN HESAPLANMIŞ 'bbhb'
  alanı doğrudan toplanır). Manda VE Büyükbaş Erkek (boğa/öküz) BBHB
  kuralında ırk ayrımı taşımadığı için - "manda büyükbaş sayılır"
  talimatı gereği - Büyükbaş satırının Yerli sütununa eklenir; aynı
  gerekçeyle Küçükbaş ve Diğerleri (tek tırnaklı) toplamları da Yerli
  sütununda gösterilir - bu varsayım ekranda AÇIKÇA belirtilir,
  yanlışsa kolayca değiştirilebilir. Kullanılan Alanlardan Yararlanma
  Şekli (m.9) GENİŞLETİLDİ ve tutarlı pasif ifadeyle düzeltildi:
  Otlatılarak / Kuru ot (saman) olarak biçilerek / Yeşil ot (yem)
  olarak biçilerek / Silaj yapılarak / Dinlendirilerek (nadasa
  bırakılarak) + serbest "diğer" (elle) korundu. m.11 basit not
  alanı; m.12 serbest metin. Word/PDF EXPORT (paragraf+tablo KARIŞIK
  SIRALI içerik desteğiyle yeniden yazıldı) VE dosya ekleme (PDF,
  varsayılan ad "3T_{İlçe}_{KöyMahalle}_ek-3a") mevcut. SAYFA
  ALTBİLGİSİ "(Ek-3/A) | {sayfa}/{toplam}" formatında: PDF'te GERÇEK
  ÇOK SAYFALI durumda test edilip doğrulandı (1/3, 2/3, 3/3 gibi
  doğru çıktı); Word'de docx'in standart PageNumber alan kodları
  kullanıldı (Word açıldığında otomatik hesaplanır) - bu, python-docx
  ile statik olarak doğrulanamayan tek kısım, gerçek Word'de doğru
  görünmesi beklenir. PDF'TEKİ TABLO-SONRASI-PARAGRAF HATASI DÜZELTİLDİ:
  pdfkit'in tablo hücreleri için kullanılan `.text()` çağrıları
  `doc.x`'i son sütunun dar konumunda bırakıyordu, bu yüzden madde
  7/8 tablolarından SONRAKİ paragraflar (8, 9-12) o dar sütuna
  sıkışmış gibi görünüyordu - artık her tablo çiziminden sonra
  `doc.x` sayfa kenar boşluğuna, sonraki paragraf çağrıları da
  AÇIKÇA tam sayfa genişliğine sıfırlanıyor (uzun test paragrafıyla
  doğrulandı: önce çok kısa satırlara bölünüyordu, şimdi doğal
  şekilde tam genişlikte akıyor). EK-3/A'YA TEKNİK EKİP İMZA BLOĞU
  EKLENDİ VE DAHA DA NETLEŞTİRİLDİ: "Komisyon ve Teknik Ekip Seçimi"
  ön-adımında seçilen Teknik Ekip'in GERÇEK üyeleriyle, `imzaTipi:
  'cokluKisi'`. MAKSİMUM 4 SÜTUN - N kişi satırlara DENGELİ dağıtılır
  (kalan 0 ise hepsi 4'lü; kalan 1 ise son satır TEK kişilik ve SOLA
  YASLI; kalan 2/3 ise o KISA satır EN BAŞA alınır, örn. 7 kişi →
  [3,4], 4+3 değil) - 1'den 12'ye kadar tüm senaryolar test edilip
  doğrulandı. Her imzacı kutusunda 4 SATIR: Adı Soyadı / Ünvanı /
  Kurumu (Teknik Ekip üyesinin imza kurum metninden) / Üyelik Durumu
  (Ayarlar'da Teknik Ekip Üyeleri formuna YENİ eklenen alan: Merkez
  Mera Teknik Ekip Başkanı / İlçe Mera Teknik Ekip Başkanı / Üye).
  HER SATIR TEK SATIRA SIĞACAK ŞEKİLDE OTOMATİK KÜÇÜLTÜLÜR, AYNI
  TÜRDEKİ (örn. tüm Ad Soyad'lar) TÜM kutularda AYNI boyut kullanılır:
  PDF'te pdfkit'in GERÇEK `widthOfString` ölçümüyle (en dar - 4'lü
  satırdaki - sütun baz alınır, sayısal olarak doğrulandı), Word'de
  karakter-sayısı sezgisiyle (gerçek ölçüm API'si yok, tahminidir).
  NOT: aşırı uzun isim/unvan gibi uç durumlarda minimum boyutta bile
  hafif taşma olabilir (okunabilirlik için bir alt sınır var) -
  gerçekçi isim uzunluklarında sorun yaşanmaz, test edildi. Tahsis
  (Ek-7 ve sonrası) HENÜZ EKLENMEDİ.
- **Personel Yönetimi** (Ayarlar içinde) — Teknik Ekip Üyeleri: yıl/ilçe
  bazlı akordiyon, kurum seçimine göre otomatik imza metni üretimi
  (Muhtarlık/Mahalli Bilirkişi/Belediye vb.), "Üyelik Durumu" seçimi
  (Merkez Mera Teknik Ekip Başkanı/İlçe Mera Teknik Ekip Başkanı/Üye
  - Ek-3/a imza bloğunun 4. satırında kullanılır) ARTIK KURUMA GÖRE
  OTOMATİK ATANIYOR (daha önce konuşulan GÖREV kuralı): İl Tarım ve
  Orman Müdürlüğü temsilcisi → Merkez Mera Teknik Ekip Başkanı; İlçe
  Tarım ve Orman Müdürlüğü temsilcisi → İlçe Mera Teknik Ekip
  Başkanı; diğerleri → Üye - kurum SEÇİLİNCE otomatik atanır (yeni
  üye eklerken VE mevcut/eski kayıtların ilk görünümünde), ama SADECE
  ÖNERİDİR, kullanıcı elle değiştirebilir (istisnalar için). Test
  edildi. Toplu üye yükleme (xlsx/xls/csv/json); 3T'nin Muhtar
  otomatik doldurma özelliği bu modülün "muhtarlik" kurumlu
  üyelerini kullanır. İl Mera Komisyonu
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
- **Mera Modülü (YENİ)** — `/api/mera`, GitHub'da `backend/modules/mera/`.
  Her kayıt TEK BİR PARSEL'e karşılık gelir (Ada/Parsel bazında).
  Alanlar: İl/İlçe/Köy-Mahalle (Yerleşim listesinden), Ada No, Parsel
  No, Mera Alanı (m²), Tapu Alanı (m²), Arazi Niteliği (Mera/Yaylak/
  Kışlak/Otlak/Çayır/Eyrek Yeri/Harman Yeri/Panayır Yeri/Sıvat Yeri),
  Arazi Durum Sınıfı (Çok İyi/İyi/Orta/Zayıf/Belirlenmemiş - ARTIK
  ENUM, otlatma kapasitesi hesabında hangi sütunun kullanılacağını
  belirler; "Belirlenmemiş" varsayılan), Arazi Kaynağı (5-a/5-b/5-c/
  5-d), Tespit/Tahdit/Tahsis (her biri ayrı checkbox+tarih), Islah
  Durumu, Eğimi, Toprak Sınıfı (standart Arazi Kullanım Kabiliyet
  Sınıflandırması: I-VIII Sınıf), Tapu Kimlik No. NOTLAR: bir kez
  eklenen not ASLA SİLİNEMEZ, sadece "Düzenle" ile GÜNCELLENEBİLİR -
  eski hali versiyon geçmişinde (açılır-kapanır "Önceki hâller")
  KALICI olarak saklanır; her nota ayrıca belge (herhangi bir dosya
  türü) eklenebilir. LOG KAYDI: her işlem (oluşturma/güncelleme/not
  ekleme/not düzenleme/dosya ekleme) ayrı bir sekmede, tarih+işlem+
  detay+kullanıcı olarak listelenir - sistemde henüz gerçek bir "giriş
  yapma" (auth) mekanizması olmadığı için kullanıcı adı sayfada
  tarayıcıda hatırlanan (localStorage) serbest bir metin alanından
  gelir; gerçek bir kullanıcı sistemi kurulunca buraya bağlanabilir.
  Liste sayfası (`/mera/`) İl/İlçe/Köy-Mahalle filtreleme + "Yeni
  Parsel" modalı; detay sayfası (`/mera/detay.html?id=`) üç sekme
  (Genel Bilgiler/Notlar/Log Kaydı). NOT: 3T sürecindeki Ek-3/a (m.7
  - Arazinin Cinsi/Miktarı) ve Ek-4/c-h aşamalarının GERÇEK veri
  kaynağı bu modül OLACAK ama entegrasyon HENÜZ YAPILMADI (ayrı bir
  aşama) - şu an bağımsız bir modül olarak çalışıyor. TOPLU YÜKLEME
  EKLENDİ: "Toplu Yükleme Şablonu" indirilebilir (.xlsx, açıklamalı +
  1 örnek satır + geçerli seçenek listeleri notu - gri başlık, sarı
  vurgulu örnek satır), .xlsx/.xls/.csv yüklenebilir - eşleşen (İl+
  İlçe+Köy/Mahalle+Ada+Parsel) kayıt VARSA GÜNCELLENİR, YOKSA
  OLUŞTURULUR (UPSERT, aynı şablon tekrar yüklenirse çoğalmaz).
  ÖNEMLİ DÜZELTME: Türkçe gün.ay.yıl tarih formatı ("01.03.2026" = 1
  Mart) ilk yazımda `new Date()` tarafından ABD formatı (ay.gün.yıl)
  sanılıp YANLIŞ parse ediliyordu - fark edilip düzeltildi, round-trip
  testle (şablon üret → geri oku) doğrulandı. RAPOR İNDİR: tüm
  kayıtların TÜM alanlarını içeren tek tıkla Excel raporu (aynı sütun
  şeması, filtre destekli), geri okunup doğrulandı.

  **VERİM BİLGİLERİ / OTLATMA KAPASİTESİ (ARTIK EKLENDİ):** Kullanıcının
  paylaştığı resmi Ek-1 (Yağış Kuşaklarına Göre Yeşil/Kuru Ot Verim
  Tabloları) ve Ek-2 (İllerin Yıllık Ortalama Yağış Miktarları, 81 il)
  cetvellerinden gelir. YENİ `MeraVerimAyarlari` (singleton, Ayarlar >
  "Mera Verim Ayarları" sekmesinden DÜZENLENEBİLİR): 3 tablo (7 yağış
  kuşağı × Çok İyi/İyi/Orta/Zayıf) + 81 il→yağış kuşağı eşleşmesi +
  tüketim/dönem ayarları (varsayılan: yeşil 50 kg/gün, kuru 12,5
  kg/gün, dönem 180 gün). ÖNEMLİ DOĞRULAMA: kaynaktaki tablolar
  arasında TAM bir ilişki var - Tablo-2 (Üretilen Yeşil) = Tablo-1
  (Yararlanılabilir Yeşil) × 2; Tablo-3 (Üretilen Kuru) = Tablo-1 ×
  0,5 - HER hücrede doğrulandı, bu sayede kaynaktaki bir tarama hatası
  ("2540" gibi) güvenle düzeltildi (seed verisi bu ilişkiyle
  hesaplanarak üretildi, ama Ayarlar'da HER İKİ tablo da birbirinden
  BAĞIMSIZ, ayrı ayrı düzenlenebilir). Mera Modülü'nde parsel
  detayına girildiğinde SAĞ PANELDE otomatik hesaplanıp gösterilir:
  Tablo-1/2/3'ün HER BİRİ için AYRI AYRI satır - kg/da, toplam kg,
  günlük tüketebilecek BBHB, ve dönemlik (180 gün) Otlatma Kapasitesi
  BBHB. Formül: dekar (m²/1000) × kg/da = toplam kg; toplam kg ÷
  günlük tüketim = günlük BBHB; toplam kg ÷ (günlük tüketim × dönem
  günü) = dönemlik otlatma kapasitesi (BBHB). Panelde, sürdürülebilir
  kullanım için genellikle Tablo-1'in (Yararlanılabilir) esas
  alınması gerektiğine dair bir not var, ama TÜM 3 sonuç birlikte
  gösterilir (kullanıcı kendi karşılaştırmasını yapabilsin diye - tek
  bir "nihai" değere indirgenmez). Örnek (İstanbul, İyi, 50 da, elle
  hesaplanıp KOD İLE BİREBİR doğrulandı): Tablo-1 → 20.250 kg, günlük
  405 BBHB, dönemlik 2,25 BBHB; Tablo-2 → 40.500 kg, günlük 810 BBHB,
  dönemlik 4,5 BBHB; Tablo-3 → 10.125 kg, günlük 810 BBHB, dönemlik
  4,5 BBHB. Arazi Durum Sınıfı "Belirlenmemiş" ise hesaplama
  yapılamaz, kullanıcıya uyarı gösterilir.

  **ÖNEMLİ DÜZELTME:** Mera Modülü sayfalarında (liste + detay) sol
  menü/üst çubuk/footer HİÇ GÖRÜNMÜYORDU - kök neden: `misKabuguBaslat()`
  çağrısı (kabuğu dolduran fonksiyon) her iki sayfaya da EKLENMEMİŞTİ,
  ayrıca `<footer id="mis-footer">` elementi de HİÇ YOKTU (bu da
  shell.js'in `mis-footer` elementini bulamayıp hata fırlatmasına yol
  açabiliyordu). İkisi de eklendi, diğer modül sayfalarıyla (CKS vb.)
  aynı kabuk yapısına kavuşturuldu.

## Menü Yapısı

Sol menü ARTIK İKİ GRUBA ayrıldı (kullanıcı isteğiyle): "Modüller"
(3T, Mera - uçtan uca bir süreci yöneten, kendi alt-adımları/
sekmeleri olan büyük yapılar) ve "Araçlar" (BBHB Hesaplama, EKGB,
ÇKS Cetveli, Mevzuat - tek başına kullanılan hesaplama/referans
ekranları). Ek-4ab ARTIK AYRI bir menü öğesi DEĞİL (3T'nin
"Birleştirme" adımı onu otomatik üretiyor, `frontend/public/ek4ab/`
klasörü hâlâ duruyor ama menüden kaldırıldı - `?id=` ile 3T'den
yönlendirilmeye devam ediyor). Menü tek kaynaktan (`mis-menu.js`)
yönetiliyor, `shell.js` grupları otomatik render ediyor - yeni bir
grup eklemek için `shell.js`'e dokunmaya gerek yok. `package.json`
versiyonu `0.1.0` → `0.9.0` güncellendi (projenin gerçek olgunluk
seviyesini yansıtmıyordu).

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

## Görünüm Ayarları / Ekran Font Boyutları

"Belge Görünüm Ayarları" → "Görünüm Ayarları" olarak yeniden
adlandırıldı ve genişletildi: artık sadece Word/PDF çıktılarının
(İMZA rengi/yazı tipi) DEĞİL, EKRANDAKİ farklı "tema parçalarının"
font boyutlarını da yönetiyor. `BelgeAyarlari` modeline `temaBolumleri`
adında GENİŞLETİLEBİLİR bir dizi eklendi - her eleman `{anahtar, ad,
baslikBoyutuPx, metinBoyutuPx}` şeklinde: yeni bir "tema parçası"
gerektiğinde SADECE varsayılan veriye (`VARSAYILAN_TEMA_BOLUMLERI`)
yeni bir satır eklenir, kod değişmez.

**YENİDEN TASARLANDI (kullanıcı geri bildirimiyle): sayfa-bazlı DEĞİL,
BÖLGE-BAZLI.** İlk sürümde "Ayarlar Sayfası" / "Verim Bilgileri
Tablosu" gibi sayfa-özel parçalar vardı - kullanıcı bunun yerine
arayüzün YAPISAL bölgelerini istedi. Şu an 4 bölge var: **Sol Menü**
(başlık 11px/metin 13px), **Üst Menü** (başlık 15px/metin 13px),
**Ana İçerik - Sol Bölge** (başlık 18px/metin 13px), **Ana İçerik -
Sağ Bölge** (başlık 16px/metin 13px). Uygulama mekanizması artık
SAYFA-ÖZEL DEĞİL, GLOBAL: `shell.js`'e `misGorunumAyarlariniUygula()`
eklendi, `misKabuguBaslat()` (HER sayfanın çağırdığı ortak kabuk
fonksiyonu) içinde otomatik çalışıyor - `/api/belge-ayarlari`'ı çekip
her bölüm için `--font-{anahtar}-baslik` / `--font-{anahtar}-metin`
CSS custom property'lerini `<html>`'e yazıyor. `layout.css`'teki
`.mis-anamenu` (sol menü), `.mis-ustcubuk`/`.mis-arac-adi` (üst menü),
`.mis-icerik-birincil`/`.mis-icerik-ikincil` (ana içerik sol/sağ)
seçicileri bu değişkenleri kullanıyor - böylece TEK BİR AYAR TÜM
SAYFALARDA (Ayarlar, Mera, BBHB, 3T, hepsi) aynı anda etkili oluyor,
sayfa başına ayrı kod YAZILMASINA gerek kalmıyor. Eski sayfa-özel
kod (`ayarlarSayfasiFontUygula()`, `verimTablosuFontUygula()` ve
karşılık gelen CSS kuralları) temizlendi. Ayarlar sekmesindeki
tablo üzerinden her bölüm için başlık/metin boyutu ayrı ayrı px
cinsinden düzenlenip kaydedilebiliyor; kaydedince sayfa
yenilenmeden hemen uygulanıyor. Kullanıcının notu doğrultusunda
buraya ileride başka bölgeler/ayarlar da eklenebilir (kod
değişikliği gerektirmeden, sadece varsayılan veriye satır ekleyerek).

**AYRICA BULUNAN VE DÜZELTİLEN KRİTİK HATA:** Mera parsel detayındaki
"Verim Bilgileri / Otlatma Kapasitesi" paneli SONSUZA KADAR
"Yükleniyor..." durumunda kalıyordu. Kök neden: `meraVerimAyarlari.
service.js`'deki `otlatmaKapasitesiHesapla()` hâlâ ÖNCEKİ bir taslak
tasarımın alan adlarını (`uretilenYesilOt`, `yararlanilabilirYesilOt`,
`toplamKapasiteBbhb` gibi - 4 tablo + "nihai" tek değer)
döndürüyordu, ama frontend (`mera/detay.html`) GERÇEKTEN 3-tablo
yapısını (`tablo1YararlanilabilirYesil`, `tablo2UretilenYesil`,
`tablo3UretilenKuru`) bekliyordu - önceki bir turda SADECE frontend
düzeltilmiş, backend'in KENDİSİ hiç kontrol edilmemişti. Sonuç:
`undefined.kgDa` okuma hatası, panel hiç güncellenmeden "Yükleniyor"
metninde donup kalıyordu. Backend GERÇEKTEN 3-tablo yapısına
çevrildi (İstanbul/İyi/50 da örneğiyle yeniden test edildi: 405/2,25,
810/4,5, 810/4,5 BBHB - hepsi doğru), AYRICA frontend'e try/catch
eklendi - benzer bir uyumsuzluk gelecekte tekrar olursa panel
sonsuza dek takılı kalmak yerine GÖRÜNÜR bir hata mesajı gösterecek.

## Mera Parsel Detay Sayfası - Layout Düzeltmesi

**YANLIŞ KONUMLANDIRMA DÜZELTİLDİ:** Harita paneli ÖNCEKİ turda
YANLIŞLIKLA sağ bölmeye (`mis-icerik-ikincil`) eklenmişti - kullanıcı
bunun SOL bölmenin (`mis-icerik-birincil`) İÇİNDE olmasını istiyordu.
Düzeltme: sol bölme artık İL/İLÇE/MAHALLE/ADA/PARSEL başlığından
SONRA kendi içinde ikiye bölünüyor (`col-lg-7` sekmeler/form + `col-lg-
5` harita) - sağ bölmeye (Verim Bilgileri) HİÇ DOKUNULMADI, orada
kaldı. **Genişletme artık YENİ SEKME/PENCEREDE:** eski CSS `position:
fixed` hilesi KALDIRILDI (Leaflet'i aynı sayfada CSS ile büyütmek
yerine, kullanıcının önerdiği "pop-up ya da yeni sayfa" seçeneklerinden
İKİNCİSİ tercih edildi - Leaflet'i DOM içinde taşımanın risklerinden
kaçınmak için). YENİ `mera/harita.html`: parsel ID'sini URL'den alıp
TAM SAYFA bir harita görünümü sunan bağımsız sayfa - aynı özellikler
(katman değiştirme, versiyon seçici, çevre parsel gösterimi, dosya
yükleme, tıklamalı katman stil kontrolü) `window.open()` ile yeni
sekmede açılıyor. **Mühendislik notu (dürüstçe belirtilmeli):** Bu
sayfanın harita mantığı `detay.html`'deki ile BÜYÜK ÖLÇÜDE AYNI ama
KOD OLARAK AYRI (paylaşılan bir modüle çıkarılmadı) - zaman kısıtı
nedeniyle DUPLICATE edildi, mevcut çalışan panel koduna dokunma riski
alınmadı. İleride ortak bir `mis-harita.js`'e taşınması önerilir.

## Mera - Versiyon ve Log Ayrıntısı

`package.json` versiyonu `0.9.0` → `0.10.0` güncellendi. **Log
kayıtları artık AYRINTILI:** `mera.service.js`'in `guncelle()`
fonksiyonu artık HER ALAN için ESKİ/YENİ değeri KARŞILAŞTIRIP SADECE
GERÇEKTEN DEĞİŞENLERİ "Etiket: eski -> yeni" biçiminde log'a yazıyor
(kullanıcının örneği: "Mera Alanı: 20.000 m² -> 22.222 m²") - genel
"Parsel bilgileri güncellendi" mesajı YETERSİZ bulunmuştu. Sayılar
(m²), tarihler, Evet/Hayır (checkbox) alanları uygun biçimde
formatlanıyor, boş değer "(boş)" olarak gösteriliyor. Test edildi:
"Mera Alanı: 20.000 m² -> 22.222 m² | Tapu Alanı: 100 m² -> 0 m²".
Değişiklik YOKSA log kaydı EKLENMİYOR (gereksiz "güncellendi" kaydı
BİRİKMİYOR).

## Mera - Harita Katman Stilleri (YENİ)

**ÖNEMLİ - BU TURDA YAŞANAN DURUM:** Çalışma alanım (sanal makine)
sıfırlanmış olarak bulundu - `/home/claude/mis` boştu. Kurtarma:
`/mnt/user-data/outputs/`'da duran TÜM önceki paketler
(`misweb proje 054`'ten `069`'a kadar) SIRAYLA üst üste açılarak proje
yeniden inşa edildi - bu, GERÇEK kaynağın HER ZAMAN kullanıcının kendi
git deposu olduğunu (ben sadece artımlı değişiklik ÜRETİYORUM)
doğruladı. 054 ÖNCESİNDEKİ temel dosyalar (3T, BBHB, ÇKS, EKGB,
Mevzuat, Personel vb. - hiç değişmediği için hiçbir pakette YOK) bu
ortamda YOK ama bu SORUN DEĞİL - kullanıcının deposunda zaten mevcut,
bu turda İHTİYAÇ DUYULMADI (SADECE Mera/Görünüm Ayarları dosyalarına
dokunuldu).

**Çoklu katman + tıklamalı stil kontrolü:** Artık BİRDEN FAZLA KML/
GeoJSON katmanı (aktif parselin dosyası + gösterilen TÜM çevre
parsellerin dosyaları) AYNI ANDA haritada görünebiliyor, HER BİRİNİN
KENDİ stili var. "Katmanlar" paneli - Leaflet'in KENDİ control
mekanizmasıyla (`L.control`) haritanın SAĞ ÜST köşesine eklendi, bu
sayede hem NORMAL hem TAM EKRAN görünümde OTOMATİK çalışıyor (ayrı
kod gerekmedi). Her katmanın yanında RENKLİ, TIKLANABİLİR bir nokta
var - tıklanınca MİNİMAL bir mini-panel açılıyor: Çizgi Rengi, Çizgi
Kalınlığı, İçi Dolu (checkbox), Doluluk Rengi - hepsi CANLI olarak
(`katman.setStyle()`) uygulanıyor. Bu değişiklikler OTURUM İÇİDİR,
DB'ye KAYDEDİLMEZ (sayfa yenilenince varsayılana döner) - kalıcı olan
SADECE Ayarlar'daki VARSAYILAN değerlerdir.

**Varsayılan renkler artık Görünüm Ayarları'ndan yönetiliyor:**
`BelgeAyarlari` modeline `haritaStili: {ustKatman, altKatmanlar}`
eklendi - her biri `{cizgiRengi, cizgiKalinligi, doluMu, doluRengi}`.
Üst Katman = aktif parselin dosyası (varsayılan: koyu yeşil, 3px,
dolu), Alt Katmanlar = çevre parsellerin dosyaları (varsayılan: gri,
1,5px, dolu değil). Ayarlar sayfasının Görünüm Ayarları sekmesinde
renk seçici (native `<input type="color">`) + sayısal kalınlık +
dolu checkbox ile düzenlenip kaydedilebiliyor.

**Kapsam notu (kullanıcının açık isteği):** Bu özellik SADECE Mera
detay sayfasındaki harita paneline (normal + tam ekran) uygulandı,
Ayarlar sayfasının kendisi hariç tutuldu (orada sadece VARSAYILAN
DEĞER GİRİŞ FORMU var, interaktif "tıklamalı katman" kontrolü yok -
zaten mantıklı değil, orada gerçek bir harita/katman YOK).

## Mera - Harita Alt-Modülü (YENİ)

**ÖNEMLİ DÜZELTME (teslimden hemen sonra bulundu):** `leaflet-omnivore`
CDN adresi YANLIŞ yazılmıştı (`@mapbox/leaflet-omnivore` - böyle bir
scoped paket YOK, gerçek npm paket adı sadece `leaflet-omnivore`).
Bu adres 404 verir ve `omnivore` global değişkeni HİÇ TANIMLANMAZDI -
yani TÜM KML/GPX gösterim özelliği SESSİZCE bozuk kalırdı (kullanıcı
dosya yükleyince veri kaydedilir ama haritada hiçbir şey ÇİZİLMEZDİ).
Doğru adres (`unpkg.com/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js`)
web'den DOSYA İÇERİĞİ okunarak (`omnivore.kml`/`omnivore.gpx`
fonksiyonlarının gerçekten var olduğu görülerek) doğrulandı ve
düzeltildi. Leaflet'in kendi CDN adresleri (unpkg.com/leaflet@1.9.4)
zaten doğruydu, ayrıca resmi Leaflet dokümantasyonunun önerdiği
`integrity`/`crossorigin` güvenlik öznitelikleri de eklendi.

Parsel detay sayfasına eklendi. **GEREKLİ HİÇBİR NPM PAKETİ YOK** -
tüm harita kütüphaneleri TARAYICIDA CDN üzerinden yükleniyor (`npm
install` gerekmiyor):
- **Leaflet 1.9.4** (`unpkg.com/leaflet@1.9.4`) - harita motoru, ücretsiz,
  API KEY GEREKTİRMEZ.
- **OpenStreetMap** tile katmanı (varsayılan) - ücretsiz, key yok.
- **Esri World Imagery** tile katmanı (uydu görünümü, tek tık geçiş) -
  ücretsiz (makul/kurumsal kullanım için), key yok.
- **leaflet-omnivore 0.3.4** (`unpkg.com/@mapbox/leaflet-omnivore`) -
  KML/GPX dosyalarını Leaflet katmanına çevirir (SADECE GÖRÜNTÜLEME
  için - kaydedilen dosyanın kendi FORMATI DEĞİŞMEZ).

Backend tarafında dosya yükleme zaten mevcut olan `multer` ile
yapılıyor (proje zaten kullanıyordu) - YENİ bir backend paketi
GEREKMEDİ, çünkü format dönüştürme YAPILMIYOR (ham dosya, olduğu gibi
diskte saklanıyor).

**ÖNEMLİ - AYRICA BULUNAN VE DÜZELTİLEN HATA:** `uploads/` klasörü
şimdiye kadar HİÇ statik olarak servis edilmiyordu (`app.js`'te
`express.static` sadece `frontend/public`'i kapsıyordu) - bu, Notlar
bölümüne eklenen belgelerin indirme linklerinin de (muhtemelen fark
edilmeden) 404 verdiği anlamına geliyordu. `app.use('/uploads',
express.static(...))` eklendi, düzeltildi.

**Özellikler:**
1. **Yerleşim:** İl/İlçe/Köy-Mahalle/Ada/Parsel zaten sayfa başlığında
   tek satırda (`baslikAlani`); bu satırdan sonra sayfa `mis-icerik-
   birincil` (sol, mevcut form/sekmeler) ve `mis-icerik-ikincil` (sağ)
   olarak ikiye bölünüyor - Harita paneli sağ sütunun EN ÜSTÜNE,
   Verim Bilgileri paneli hemen altına eklendi.
2. **Katman değiştirme:** "Uydu Görünümü" butonu tek tıkla OSM↔Esri
   arasında geçiş yapıyor.
3. **Dosya yükleme:** `.geojson/.json/.kml/.gpx/.kmz` kabul edilir,
   FORMAT DÖNÜŞTÜRÜLMEDEN (multer fileFilter ile sınırlı) olduğu gibi
   saklanır.
4. **Otomatik adlandırma:** `IL-ILCE-MAHALLE-ADA-PARSEL-vN.uzanti`
   formatında (Türkçe karakterler ASCII'ye çevrilir, dosya sisteminde
   sorun çıkmasın diye) - test edildi: `Istanbul-Silivri-Bekirli-123-
   45-v1.kml`.
5. **Versiyonlama:** `MeraParseli.haritaDosyalari` dizisi - AYNI
   NOTLAR/Mera Verim Ayarları desenindeki gibi, yeni yükleme ESKİ
   VERSİYONU SİLMEZ, yeni versiyon EKLENİR (versiyonNo artarak) ve
   versiyon seçiciden istenilen versiyon görüntülenebilir. Test
   edildi: 2 ardışık yükleme sonrası 2 versiyon de KORUNDU.
6. **Çevre parsel gösterimi:** "Çevre Parselleri Göster" checkbox'ı -
   açıldığında `/api/mera/:id/komsu-parseller` ile aynı köy/mahalledeki
   DİĞER parseller (harita dosyası olanlar) SOLUK/KESİKLİ ÇİZGİYLE
   overlay olarak eklenir, aktif parsel YEŞİL/BELİRGİN kalır.
7. **Tam ekran:** "Büyüt" butonu, harita konteynerine `position:fixed`
   CSS sınıfı ekleyip tüm ekranı kaplıyor, `map.invalidateSize()`
   çağrısıyla Leaflet'in yeniden ölçüm yapması sağlanıyor (bu çağrı
   olmadan Leaflet boyut değişikliğini fark etmez, harita bozuk
   görünür - bilinen bir Leaflet davranışı).

**DÜRÜST SINIRLAMA:** Bu ortamda gerçek bir tarayıcı/harita render
testi YAPILAMADI (headless browser yok) - kod SENTAKS olarak
doğrulandı, backend mantığı (adlandırma/versiyonlama) izole test
edildi, ama GERÇEK harita görüntüleme/KML çizimi CANLI ortamda
doğrulanmalı. `.kmz` dosyaları KAYDEDİLİR/İNDİRİLEBİLİR ama
leaflet-omnivore doğrudan kmz (zip içindeki kml) render edemediği
için haritada ÇİZİLEMEZ - kullanıcıya bir bilgi notu gösterilir.

## Mera Parseli - Ek Düzeltmeler

**Islah Durumu artık enum** (serbest metin değil): "Islah Edilmedi"
(varsayılan), "Islah Ediliyor", "Islah Edildi" - hem detay sayfasında
dropdown, hem toplu Excel yüklemede doğrulanıyor (geçersiz değer
hata verir), hem rapor/şablon örnek satırında geçerli bir değer
kullanılıyor. **Otlatma kapasitesi hesabında ALAN ÖNCELİĞİ
DEĞİŞTİRİLDİ:** artık Tapu Alanı ÖNCELİKLİDİR (daha kesin/resmi kabul
edilir), BOŞ ise Mera Alanı'na düşülür (`kayit.tapuAlaniM2 ||
kayit.meraAlaniM2`) - önceden SADECE Mera Alanı kullanılıyordu.
**Verim Bilgileri panelindeki üst bilgi satırı** (Yağış Kuşağı/
Dönem/Alan) tek satır yerine AYRI AYRI satırlara bölündü, "Alan"
etiketi "Mera Alanı" olarak netleştirildi (yeni `meraAlaniKisa` lang
anahtarı, birim çakışmasını önlemek için `meraAlani` - "(m²)" içeren
- anahtarından ayrı tutuldu).

## Mera Verim Ayarları - Versiyonlu Veri + Yeniden Tasarlanan Hesaplama

**BÜYÜK YENİDEN YAPILANDIRMA (kullanıcı geri bildirimiyle).**

**1. VERSİYONLU TABLO VERİSİ:** `MeraVerimAyarlari` modelindeki 4 tablo
(Tablo-1/2/3, İller) artık DÜZ DİZİ DEĞİL, VERSİYONLU: her biri
`{aktifIndex, versiyonlar: [{satirlar, yaziTarihi, yaziSayisi,
yuklemeTarihi, yukleyenKullanici, kaynakTipi}]}`. Yeni veri
EKLENDİĞİNDE eski veri SİLİNMEZ - yeni bir versiyon olarak eklenir
ve otomatik AKTİF olur (hesaplamada kullanılan), önceki versiyonlar
"Versiyon Geçmişi" altında KALICI olarak görüntülenebilir/denetlenebilir,
istenirse tekrar "Aktif Yap" ile geri dönülebilir. HER versiyon,
hangi RESMİ YAZIYLA geldiğini gösteren Yazı Tarihi + Yazı Sayısı
alanlarını ZORUNLU olarak taşır (örnek: "31.07.2025 tarihli
E-37234586-115.02-20335113 sayılı yazı"). İlk kurulum (sistem
varsayılanı) da bir versiyon olarak kaydedilir, kaynağı "İlk kurulum
(kullanıcı tarafından paylaşılan resmi Ek-1/Ek-2 görselleri)" notuyla
işaretlenir - böylece versiyon geçmişi baştan tutarlı.

**2. VERİ EKLEME İKİ YÖNTEMLİ:** Her tablonun altında "Yeni Veri
Ekle" bölümü - "Elle Gir" (aktif versiyonun kopyasıyla başlayan,
satır ekle/sil destekli düzenlenebilir tablo) VEYA "Excel Yükle"
(şablon indirilebilir - `yeni meraVerimAyarlari.export.js` - .xlsx/
.xls/.csv yüklenebilir - `yeni meraVerimAyarlari.import.js`, Türkçe
başlık eşleştirmeli). İkisinde de Yazı Tarihi/Sayısı ZORUNLU,
boşsa kaydedilemiyor.

**3. HESAPLAMA MANTIĞI TAMAMEN YENİDEN TASARLANDI (5 KUTUCUK, TEK
KUTU İÇİNDE):** Kullanıcının netleştirmesiyle: VERİM hesabı (kg/da,
toplam kg) HER TABLO için AYRI AYRI yapılır - 1) Tablo-1
(Yararlanılabilir Yeşil), 2) Tablo-2 (Üretilen Yeşil), 3) Tablo-3
(Üretilen Kuru), 4) "Yararlanılabilir Kuru Ot" (KAYNAKTA AYRI TABLO
OLARAK YOK, HER ZAMAN Tablo-3 × 0,5 olarak TÜRETİLİR) - bu 4 kutunun
HİÇBİRİNDE kendi BBHB değeri YOK. 5. kutucuk ise TEK, AYRI bir BBHB
hesabı: Günlük BBHB + Otlatma Kapasitesi (Dönemlik BBHB) - SADECE
Tablo-1 (Yararlanılabilir Yeşil Ot) ve Günlük Yeşil Ot Tüketimi
(50 kg) üzerinden. Gerekçe (kullanıcının kendi ifadesi): "aynı
yerdeki otları aynı miktardaki hayvan kullanabilir, kuru ya da yeşil
olması tüketimdeki tercih biçimi" - yani kapasite TEKTİR, diğer 4
kutu sadece VERİM KARŞILAŞTIRMASI amaçlıdır. İstanbul/İyi/50 da
örneğiyle yeniden test edildi: T1={405 kg/da, 20.250 kg},
T2={810, 40.500}, T3={202,5, 10.125}, Yararlanılabilir Kuru={101,25,
5.062,5}, Günlük BBHB=405, Dönemlik=2,25 - hepsi doğru. "Günlük Kuru
Ot Tüketimi" ayarı KALDIRILDI (artık hiçbir hesaplamada kullanılmıyor).

**4. YENİ AYAR: "Standart Yıl Günü"** (varsayılan 365) - Ayarlar'da
Günlük Yeşil Ot Tüketimi ve Dönem (gün) ile birlikte gösteriliyor,
kullanıcının belirttiği üzere ileride "Islah ve Amenajman" modülünde
kullanılması öngörülüyor (henüz o modül yok, sadece alan hazırlandı).

**5. "Ç.İyi" → "Çok İyi"** tam yazıldı; Tablo-1/2/3 ve İllerin Yağış
Kuşakları accordion (açılır-kapanır) yapısında.

**6. "Ekran Font Boyutları" → "Websitesi Görünüm Ayarları"** olarak
yeniden adlandırıldı (Görünüm Ayarları sekmesi içinde, bölge-bazlı
font sistemi - ayrı bölüm, bkz. yukarıdaki "Görünüm Ayarları" başlığı).

## Dil Dosyası (`config/lang/tr.js`)

Kuralın hatırlatılması üzerine düzeltildi: sistemin BAŞTAN BERİ var
olan kuralı ("Sistemdeki TÜM görünür metinler buradan okunur, kod
içinde literal Türkçe string yazılmaz") gerçekte SADECE KISMEN
uygulanıyordu - backend'de 5 modül (BBHB/ÇKS/Ek4ab/EKGB/reporting)
sadece hata mesajı fallback'i için kullanıyordu, FRONTEND'İN HİÇBİR
YERİNDE (Yerleşim listesi dahil) lang HİÇ KULLANILMIYORDU - `lang.
yerlesim` bölümü tamamen atıl duruyordu. Mera Modülü bu kuralı GERÇEK
ANLAMDA UYGULAYAN İLK MODÜL: `lang.ortak`'a GENEL eylem/arayüz
terimleri eklendi (duzenle/sil/ekle/vazgec/detay/kayitYok/seciniz/
yukleniyor/kaydediliyor/kaydedildi vb.) - "İl" gibi ortak terimler
TEK KAYIT olarak kalır, hiçbir modül tekrar tanımlamaz (kullanıcının
açık kuralı - ama tam cümle içindeki kelimeler, örn. "Bu ilde başka
mera yok" gibi, atomize EDİLMEZ). YENİ `lang.mera` ve `lang.
meraVerimAyarlari` bölümleri eklendi (60+ anahtar). YENİ `frontend/
public/assets/js/mis-lang.js`: `/api/sistem/dil`'i çekip önbelleğe
alan `misLangYukle()` - bu, frontend'in bu deseni GERÇEKTEN kullanan
İLK örneği. `mera/index.html` ve `mera/detay.html` BAŞTAN yazıldı:
sayfa artık `async function baslat() { const LANG = await
misLangYukle(); ...tüm metinler LANG'den... }` şeklinde çalışıyor.
Ayarlar sayfasının SADECE Mera Verim Ayarları sekmesi bu deseni
kullanır (sayfanın geri kalanı - BBHB/Personel/Mevzuat vb. - HENÜZ
taşınmadı, kapsam dışı bırakıldı). Backend'de `mera.service.js`'in
tekrarlanan hata mesajları da (`Not bulunamadı.`, `Not metni boş
olamaz.` gibi) artık `lang.mera.xxx`'ten okunuyor.

**ÖNEMLİ HATA DÜZELTMESİ (bu geçiş sırasında bulundu):**
`mera/detay.html`'deki `verimBilgisiHesapla()` fonksiyonu, ÖNCEKİ bir
taslak sürümden kalma YANLIŞ alan adları (`v.uretilenYesilOt`,
`v.toplamKapasiteBbhb` vb.) kullanıyordu - bunlar backend'in (`mera
VerimAyarlari.service.js`) GERÇEKTEN döndürdüğü alan adlarıyla
(`tablo1YararlanilabilirYesil`, `tablo2UretilenYesil`,
`tablo3UretilenKuru`) HİÇ EŞLEŞMİYORDU. Sayfa açılır açılmaz JS
hatası verecekti - fark edilip düzeltildi.

## Stack

Node.js 20, Express.js, Mongoose 8, MongoDB 7, Bootstrap 5, Vanilla JS,
ExcelJS, docx, pdfkit, xlsx (SheetJS), multer, Tom Select, node-cron,
pdf-parse, diff (jsdiff, CDN), Docker/Coolify.

## Bilinen Sınırlamalar

- `config/lang/tr.js` geçişi SADECE Mera Modülü'nde tamamlandı - BBHB
  frontend'i, ÇKS, EKGB, 3T, Mevzuat, Personel, İl Mera Komisyonu
  sayfaları ve Ayarlar'ın diğer sekmeleri HÂLÂ literal Türkçe string
  kullanıyor (bu, bu turun kapsamı dışında bırakıldı - istenirse
  ayrı bir aşamada aynı desenle taşınabilir).
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
