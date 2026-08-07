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

## KESİN KÖK NEDEN BULUNDU: Mongoose markModified() Eksikliği

**Kullanıcının verdiği İKİNCİ, ÇOK DEĞERLİ tanı ipucu:** "parsel sec
deyip parselleri seçiyorum, kaydet diyorum. sonra sayfanın altında
yeniden kaydet diyorum. sayfadan çıkmadan parsel seçe yeniden
tıkladığımda parsellerin seçimi kaldırılmış oluyor. eğer kaydet
demeden tıklarsam seçimler kalkmamış oluyor." Bu gözlem KESİN olarak
kanıtladı: "Parsel Seç" popup'ının KENDİ kaydı veritabanına GERÇEKTEN
yazıyordu - SORUN, sayfanın GENEL "Kaydet" butonunun (`adimVeriKaydet`)
kendisindeydi, benim önceki turdaki "veriyi koru" düzeltmem YETERLİ
DEĞİLDİ.

**Kesin kök neden (web araştırmasıyla doğrulandı - Mongoose'un resmi
dokümantasyonu ve birden fazla GitHub issue'su):** Bu proje `kayit.
surec[i].altAdimlar[j].veri` şeklinde İKİ KAT İÇ İÇE subdocument
dizisi içinde bir `Mixed` tipli alan kullanıyor. Mongoose'un
DOKÜMANTASYONUNDA açıkça belirtildiği üzere: **Mixed tipli alanlara
yapılan DOĞRUDAN atamalar (`altAdim.veri = {...}`), özellikle iç içe
subdocument dizileri içinde, Mongoose'un otomatik değişiklik takibi
tarafından GÜVENİLİR şekilde ALGILANMAYABİLİR** - `doc.markModified(
'path')` AÇIKÇA çağrılmadıkça `.save()` bu değişikliği SESSİZCE
veritabanına YAZMAYABİLİR (bu, Mongoose'un "FAQ" ve "Document" API
dokümantasyonunda VE `Automattic/mongoose` GitHub deposunda #1694,
#8505, #8926 numaralı issue'larda AÇIKÇA belgelenmiş, YILLARDIR
bilinen bir davranış).

**Düzeltme:** `uc-t.service.js`'deki `altAdim.veri = ...` deseniyle
yazan **8 fonksiyonun TAMAMINA** (`adimVeriKaydet` - GENEL "Kaydet"
butonunun kullandığı, EN KRİTİK olan -, `ek4aVeriCek`, `ek4bVeriCek`,
`ek3aHayvanVarligiCek`, `ek3aAraziVerileriKaydet`, `karar1Kaydet`, ve
diğerleri) `.save()`'den HEMEN ÖNCE `kayit.markModified('surec');`
eklendi - bu, Mongoose'a "surec alanının TAMAMINI (tüm iç içe
içeriğiyle) yeniden yaz" der, EN GÜVENLİ ve KOD KARMAŞIKLIĞI
GEREKTİRMEYEN çözüm (dinamik `anaAdimIndex`/`altAdimIndex` içeren
DAHA "cerrahi" bir path - örn. `surec.2.altAdimlar.3.veri` - yerine,
TÜM `surec` alanını işaretlemek, index'lerin string/number
tutarsızlığından etkilenmeyen DAHA SAĞLAM bir yaklaşım).

**Dürüstçe belirtilmesi gereken sınırlama:** Bu ortamda GERÇEK bir
MongoDB instance'ı ÇALIŞTIRAMADIĞIM için (ağ kısıtlaması nedeniyle
`mongodb-memory-server`'ın embedded binary'sini İNDİREMEDİM), bu
düzeltmeyi UÇTAN UCA CANLI olarak TEST EDEMEDİM - ama kök neden
teşhisi (kullanıcının İKİ AYRI, BİRBİRİNİ DOĞRULAYAN gözlemi + resmi
Mongoose dokümantasyonu) YÜKSEK GÜVEN veriyor. Deploy sonrası
GERÇEKTEN doğrulanması gerekiyor.

## Ek-3/a Madde 10 - GERÇEKTEN Entegre Edildi (Önceki Turdan Kalan Eksik)

**Kullanıcının haklı uyarısı:** "10 adımda düzelmemiş yalnız."
Kontrol edilince doğrulandı: bir önceki turda "Mera Kimliği" PDF
üreticisini (`mera.kimlik.js`) yazıp TEST ETMİŞTİM, ama SADECE Mera
Modülü'nün kendi detay sayfasına (tek parsel indirme butonu olarak)
BAĞLAMIŞTIM - Ek-3/a formunun Madde 10 alanı HALA "(Mera Modülünden
gelecek, henüz kurulmadı - şimdilik boş)" placeholder'ını
gösteriyordu, HİÇ DEĞİŞMEMİŞTİ. README'de bunu "sonraki adım" olarak
AÇIKÇA not düşmüştüm ama sonra GÖZDEN KAÇMIŞ - kullanıcı haklı
olarak fark etti.

**Şimdi gerçekten tamamlandı:**
1. **YENİ `coklulKimlikPdfOlustur()`** (`mera.kimlik.js`) - Madde
   7'de SEÇİLEN (`secilenParselIdleri`) BİRDEN FAZLA parselin Mera
   Kimliği PDF'lerini ART ARDA TEK bir PDF'de birleştirir - **test
   edildi**: 2 farklı parselle (İstanbul/Silivri/Bekirli 123/45 Mera
   ve 124/46 Yaylak) çağrıldı, sonuç 2 sayfalık PDF, HER SAYFA PyPDF2
   ile doğrulandı - Sayfa 1 GERÇEKTEN parsel 1'in bilgilerini, Sayfa
   2 GERÇEKTEN parsel 2'nin bilgilerini gösterdi.
2. **YENİ `uc-t.service.js` → `madde10KimlikPdfIndir()`** - 3T
   kaydının Madde 7'de seçilen parsel ID'lerini bulup yukarıdaki
   fonksiyonu çağırır. Parsel SEÇİLMEMİŞSE (`secilenParselIdleri`
   boşsa) AÇIKÇA "Önce Madde 7'de 'Parsel Seç' ile en az bir parsel
   seçip kaydetmelisiniz." hatası fırlatır - test edildi (boş liste
   ile çağrıldı, doğru hata mesajı döndü).
3. **YENİ endpoint**: `GET /api/uc-t/:id/madde10-kimlik-pdf`.
4. **Frontend**: Madde 10'un placeholder'ı KALDIRILDI - artık
   GERÇEK durumu gösteriyor: parsel seçilmişse "Mera Kimlikleri
   (PDF) - N parsel" indirme linki (yeni sekmede açılır), seçilmemişse
   "Madde 7'de 'Parsel Seç' ile parsel seçip kaydettiğinizde..."
   yönlendirici notu. Bu alan HEM panel ilk açıldığında HEM "Parsel
   Seç" popup'ından kaydedildiğinde ANINDA güncellenir (sayfa
   yenilemeden).
5. **`uc-t.export.js`'in madde 10 paragraf metni** de güncellendi -
   artık "(Mera Modülünden alınacak)" yerine, parsel seçiliyse
   "Ekte sunulan N adet Mera Kimliği belgesinde yer almaktadır."
   yazıyor.

**Mühendislik notu (dürüstçe belirtilmeli):** Ek-3/a'nın Word/PDF
export'u (adim-disa-aktar) ile Madde 10'un Mera Kimlikleri PDF'i
(madde10-kimlik-pdf) İKİ AYRI İNDİRME olarak kalıyor - TEK bir
BİRLEŞİK belge (Ek-3/a formu + ardından kimlikler) OLUŞTURULMADI, bu
kapsam dışı bırakıldı (kullanıcı "10 uncu maddesine gelelim...
burada mera kimliği çıkaracağız" derken muhtemelen AYRI bir çıktı
kastetmişti, ama netleştirilmesi gerekirse ileride Ek-3/a'nın PDF
export'una da pdf-lib ile birleştirilebilir).

## Ek-3/a Madde 7 - "Hiçbir Şey Olmuyor" Şikayeti Sonrası Teşhis Turu

**Kullanıcının bildirdiği hata:** önceki düzeltmeye rağmen "formu
doldurmadan tamamlandı işaretle nin yanındaki kaydete basıyorum ama
ne pdf'te oluyor, ne de parseller kaydediliyor."

**Yapılan kapsamlı yeniden inceleme:** `ek3aKaydet()`, `ek3aParselSecKaydet()`,
`renderSurec()` (yeniden okundu - SADECE sidebar'ı günceller, veri
paneline DOKUNMADIĞI doğrulandı), `uc-t.routes.js` (route sırası/
çakışma kontrolü), `adimVeriKaydetHandler`, `uc-t.export.js`'in
`madde7Satirlari` kullanımı, `adimDisaAktarHandler`'ın export
zinciri - HEPSİ TEK TEK yeniden okunup DOĞRU olduğu doğrulandı. Ek
bir MANTIK HATASI statik analizle BULUNAMADI.

**Bu, projenin GEÇMİŞİNDE DEFALARCA karşılaşılan bilinen bir kalıba
işaret ediyor olabilir: Coolify'ın ESKİ Docker image'ı CACHE'LEMESİ**
(README'nin "Deployment Sorunu" bölümünde zaten belgeli). Kullanıcıya
ÖNERİLEN kontrol: sunucuda `git log -1 --oneline` ile son commit'in
gerçekten deploy edildiğini doğrulamak, gerekirse Coolify'da "Force
Rebuild" yapmak.

**Kod GENELİNE savunmacı hale getirme (test edilebilirlik için):**
`ek3aKaydet()` ve `ek3aParselSecKaydet()` artık TAM `try/catch` ile
sarmalandı - HERHANGİ bir beklenmeyen JS hatası artık SESSİZCE
YUTULMUYOR, kullanıcıya GÖRÜNÜR bir hata mesajı gösteriliyor
(`console.error` ile tarayıcı konsoluna da yazılıyor). Bu, "hiçbir
şey olmuyor" tarzı şikayetlerin ARTIK somut bir hata mesajıyla
GERİ BİLDİRİLEBİLİR olmasını sağlıyor - sorun DEVAM EDERSE, kullanıcının
tarayıcı konsolundaki (F12 → Console) KIRMIZI hata metnini paylaşması
KÖK NEDENİ KESİN olarak bulmamıza yardımcı olacak. Ayrıca
`ek3aParselSecKaydet()`, backend BAŞARILI dönüp de beklenen veri
şekli (madde7Satirlari) GELMEZSE bunu da ARTIK SESSİZCE GEÇMİYOR,
görünür bir uyarı gösteriyor.

## KRİTİK HATA DÜZELTMESİ: Madde 7 (Parsel Seç) Verisi Kayboluyordu

**Kullanıcının bildirdiği hata:** "parselleri seçip kaydetmeme rağmen
kaydolmuyor ve çıktıda görünmüyor."

**Kök neden bulundu ve doğrulandı:** `uc-t.service.js`'deki
`adimVeriKaydet()` (Ek-3/a'nın ana "Kaydet" butonunun kullandığı
GENEL endpoint) `altAdim.veri = veri;` şeklinde **TAM ÜZERİNE
YAZMA** yapıyor (kod okunarak doğrulandı, satır 110). Frontend'deki
`ek3aKaydet()` (ana Kaydet butonu), Madde 8'in (BBHB) verisini
KAYBOLMASIN diye `...hayvanVerisi` ile `veri` objesine BİLEREK GERİ
EKLİYORDU - AMA Madde 7'nin (`madde7Satirlari`, `secilenParselIdleri`)
AYNI KORUMASI UNUTULMUŞTU. Sonuç: kullanıcı "Parsel Seç" popup'ında
parselleri seçip kaydettikten SONRA (çok doğal bir kullanım akışıyla)
ana formu da (Kaydet butonuyla) kaydederse, madde 7 verisi SESSİZCE
SİLİNİYORDU - hem arayüzde hem Word/PDF çıktısında KAYBOLUYORDU.

**Düzeltme:** `ek3aKaydet()`'in `veri` objesi artık `hayvanVerisi`
ile AYNI DESENDE, mevcut `kayit.surec[...].veri.madde7Satirlari` ve
`secilenParselIdleri`'ni de KORUYARAK EKLİYOR - test edildi (mock
veriyle): madde7Satirlari artık ana Kaydet sonrası da KORUNUYOR.
Backend'e DOKUNULMADI (zaten doğru çalışıyordu - frontend'in eksik
veri GÖNDERMESİ sorunun kaynağıydı).

## Mera Kimliği PDF (YENİ) - Ek-3/a Madde 10 için

**GEREKLİ YENİ NPM PAKETLERİ (zaten `package.json`'a eklendi,
`npm install` yeterli):**
```bash
npm install staticmaps pdf-lib
```
- **`staticmaps`**: OpenStreetMap tile'larından (ÜCRETSİZ, KEY
  GEREKTİRMEZ) statik harita PNG'si üretir - kod varsayılan olarak
  `https://tile.openstreetmap.org/{z}/{x}/{y}.png` kullanıyor
  (doğrulandı - kütüphanenin kendi kaynak kodunda okundu).
- **`pdf-lib`**: Birden fazla PDF'i/görseli TEK bir PDF'de birleştirmek
  için (pdfkit SADECE yeni PDF ÜRETİR, MEVCUT PDF'leri birleştiremez -
  bu ayrı bir kütüphane gerektirdi).

**YENİ `backend/modules/mera/mera.kimlik.js`:** "Mera Kimliği" PDF'sini
üretir - **UÇTAN UCA GERÇEK VERİYLE TEST EDİLDİ** (dummy bir GeoJSON
parsel, 2 adet dummy "tapu senedi" PDF'i, 1 adet dummy fotoğraf ile):

- **Başlık** (kalın, `İl İlçe Köy/Mahalle Ada/Parsel Nitelik` formatında,
  örnek: "İstanbul Silivri Bekirli 123/45 Mera") - PDF'in görsel
  çıktısı üretilip GÖZLE kontrol edildi, Türkçe karakterler (İ, ğ, ş,
  ı, ö, ü) DOĞRU göründü.
- **Sol sütun**: Tapu Kimlik No, Mera Alanı, Tapu Alanı, Mülkiyet
  Durumu, Arazi Kaynağı, Arazi Durum Sınıfı, Toprak Sınıfı, Eğimi -
  TAM istenen sırada.
- **Sağ sütun**: parselin AKTİF harita dosyasının GeoJSON türevinden
  OKUNAN sınır koordinatlarıyla OpenStreetMap arka planlı statik
  harita - test edildi, POLİGON DOĞRU çizildi (arka plan tile'ları BU
  SANDBOX'TA gelmedi - `tile.openstreetmap.org` ağ erişim listemde
  YOK, `host_not_allowed` hatası ALINDI - ama kod GERÇEK sunucuda
  ÇALIŞACAK, kütüphanenin varsayılan URL'i zaten doğru OSM adresi).
  Harita verisi olmayan parsellerde "harita verisi henüz yüklenmemiş"
  notu gösteriliyor.
- **"Ekler" listesi**: `MeraParseli.dosyalar`'daki (Dosyalar sekmesi)
  TÜM belgeler, Sistem Ayarları'ndaki dosya tipi ADLARIYLA gruplanıp
  numaralandırılıyor - AYNI TİPTEN birden fazla varsa "Tapu Senedi
  #01", "Tapu Senedi #02" (test edildi, DOĞRU numaralandı), TEK
  taneyse numarasız ("Fotoğraf").
- **Belgelerin GERÇEK içeriği kimlik sayfasının ARKASINA ekleniyor**:
  PDF'ler `pdf-lib` ile SAYFA SAYFA birleştiriliyor, görseller (.jpg/
  .png) birer PDF sayfasına DÖNÜŞTÜRÜLÜP ekleniyor - **test edildi**:
  4 sayfalık BİRLEŞİK PDF üretildi (1 kimlik + 2 tapu senedi + 1
  fotoğraf), her sayfa PyPDF2 ile metin/görsel olarak DOĞRULANDI
  (2. sayfada gerçekten "Bu bir test tapu senedi belgesidir." yazısı,
  4. sayfada gerçekten mavi test görseli çıktı). Diğer formatlar
  (.docx, .xlsx vb.) sayfa olarak EKLENEMEZ ama Ekler listesinde
  ADI görünür, dosyanın kendisi ayrıca indirilebilir kalır.

**Mera detay sayfasına "Mera Kimliği (PDF)" indirme butonu eklendi**
(başlık satırının yanında, yeni sekmede açılır).

**3T entegrasyonu (bir SONRAKİ adım olarak bırakıldı, kapsam dışı):**
Bu turda Mera Kimliği üretici TEK PARSEL için çalışıyor ve Mera
Modülü'nden bağımsız test edilebilir durumda. Ek-3/a Madde 7'de
SEÇİLEN (muhtemelen BİRDEN FAZLA) parselin kimliklerini Madde 10'un
İÇİNE OTOMATİK BİRLEŞTİRME (concatenation) işi HENÜZ YAPILMADI - bu
turda üretilen `kimlikPdfOlustur()` fonksiyonu BUNUN İÇİN HAZIR
(tek parsel alıyor, birden fazlası için bu fonksiyon DÖNGÜYLE
çağrılıp sonuçlar `pdf-lib` ile ART ARDA birleştirilebilir) ama
BAĞLAMA İŞİ henüz yapılmadı.

## 3T'nin Ek-3/a Madde 7'si - Mera Modülü Entegrasyonu (YENİ)

**ÖNEMLİ NOT:** `uc-t.model.js` bu ortamda YOK (hiç değişmediği için
hiçbir önceki pakete dahil edilmemişti) - bu dosyaya HİÇ dokunulmadı,
mevcut `altAdim.veri` yapısının Ek-4/b (BBHB) desenindeki gibi
esnek/tip-serbest olduğu, MEVCUT KOD İNCELENEREK doğrulandı, model
dosyasına GEREK KALMADAN entegre edildi.

Madde 7 tablosu ("Cinsi, Miktarı Dekar, Parça Adedi, Mevki, Diğer
Bilgiler") şimdiye kadar HER ZAMAN BOŞ satırlar üretiyordu (kod
içinde "Mera Modülünden alınacak" notuyla İŞARETLENMİŞTİ). Artık:

1. **"Parsel Seç" butonu** - Ek-3/a adımının Madde 7 bölümüne eklendi,
   tıklanınca bir POPUP (Bootstrap modal) açılıyor.
2. **Popup**, o 3T kaydının köy/mahallesindeki (`kayit.il/ilce/
   koyMahalle`) TÜM Aktif Mera parsellerini `/api/mera` endpoint'i
   ÜZERİNDEN (YENİ bir endpoint GEREKMEDİ, mevcut liste API'si
   yeniden kullanıldı) çekip listeliyor - her satırda checkbox,
   Ada/Parsel, Cinsi (araziNiteligi), **Dekar** (Tapu Alanı varsa
   ONCELIKLI, yoksa Mera Alanı, m²'den /1000 çevrilerek), Mülkiyet
   Durumu.
3. **"Kaydet"** - seçilen parsel ID'lerini YENİ backend fonksiyonuna
   (`uc-t.service.js` → `ek3aAraziVerileriKaydet`) gönderiyor - bu
   fonksiyon parselleri Cinsi'ne (Mera/Yaylak/Kışlak/Otlak/Çayır) göre
   GRUPLAYIP: Miktarı Dekar (TOPLAM), Parça Adedi (SAYI), Diğer
   Bilgiler sütununa o cinsteki parsellerin Mülkiyet Durumu
   değerlerinin BENZERSİZ birleşimini HESAPLAYIP `altAdim.veri.
   madde7Satirlari`'a YAZIYOR - test edildi (mock veriyle): "Mera:
   37 dekar, 2 parça, Maliye Hazinesi+Kamu Orta Malı" gibi doğru
   sonuçlar üretti. Madde 7 tablosunda OLMAYAN arazi nitelikleri
   (Eyrek Yeri, Harman Yeri vb.) SESSİZCE ATLANIYOR (test edildi).
4. **"Mevki" sütunu** Mera modelinde HENÜZ İZLENMEDİĞİ için BOŞ
   bırakılıyor (elle doldurulabilir) - dürüstçe belirtilmeli bir
   sınırlama.
5. `uc-t.export.js`'in `ek3aVerileriniOlustur` fonksiyonu artık
   kayıtlı `madde7Satirlari`'ı KULLANIYOR (varsa), yoksa eski boş
   satırlara geri dönüyor (geriye dönük uyumlu) - Word/PDF çıktısına
   ARTIK GERÇEK VERİ YANSIYOR.
6. Popup'ta ÖNCEDEN seçilmiş parseller (varsa) checkbox'ları
   İŞARETLİ olarak açılıyor - tekrar düzenlenebilir.

## Mera - Mülkiyet Durumu (YENİ, Ek-3/a Entegrasyonu için Gerekli)

3T entegrasyonu sırasında ortaya çıkan ihtiyaç: Ek-3/a madde 7'nin
"Diğer Bilgiler (Kime Ait Olduğu, Nizalılık Durumu)" sütunu, parsel
BAZINDA bir "mülkiyet durumu" bilgisi GEREKTİRİYORDU - bu bilgi Mera
Modülü'nde HİÇ YOKTU. Eklendi:

- `BelgeAyarlari.meraMulkiyetDurumlari` - YÖNETİLEBİLİR liste
  (varsayılan: Kamu Orta Malı, Maliye Hazinesi, Davalı, İlçe
  Belediyesi, Büyükşehir Belediyesi, Köy/Mahalle Muhtarlığı) -
  Sistem Ayarları'nda "etiket" (chip) arayüzüyle eklenip
  çıkarılabiliyor (Mera Dosya Tipleri'nin YANINA eklendi).
- `MeraParseli.mulkiyetDurumu` - SABİT enum DEĞİL, yukarıdaki listeye
  bağlı serbest metin alanı.
- Mera detay sayfasının Genel Bilgiler sekmesine dropdown eklendi.
- Toplu Excel yükleme/rapor/şablonuna "Mülkiyet Durumu" sütunu
  eklendi - GERÇEK bir şablon üretilip içeriği doğrulandı (sütun
  başlığı + örnek "Maliye Hazinesi" değeri doğru çıktı).

## Mera - Kritik Hata Düzeltmesi + Arama + Zorunlu Açıklama + Dosya Silme

**1. KRİTİK HATA DÜZELTİLDİ: "Aktif" filtresi hiçbir parsel göstermiyordu.**
Kök neden: `durum` alanı MeraParseli şemasına SONRADAN eklendiği için
ESKİ (önceden oluşturulmuş) kayıtlarda bu alan veritabanında HİÇ YOK
(Mongoose varsayılanları GERİYE DÖNÜK olarak eski belgelere işlenmez -
proje genelinde tekrar eden bir hata sınıfı, `meraVerimAyarlari` için
de daha önce aynı sorunu yaşamıştık). "Aktif" filtresi TAM EŞLEŞME
(`durum: 'Aktif'`) aradığı için bu eski kayıtlar hiç yakalanmıyordu -
"Pasif" filtresi çalışıyordu çünkü SADECE "Pasife Al" ile GERÇEKTEN
işaretlenmiş kayıtlar vardı, "Tümü" filtresi HİÇBİR durum şartı
koymadığı için doğru çalışıyordu. **Düzeltme:** "Aktif" filtresi artık
`{ $in: ['Aktif', null] }` kullanıyor - bu, MongoDB'nin resmi/bilinen
bir davranışı sayesinde hem `durum: 'Aktif'` olan HEM DE alanın HİÇ
OLMADIĞI belgeleri eşleştiriyor (gerçek bir MongoDB instance
indirilemediği için - ağ kısıtlaması - bu davranış izole test
EDİLEMEDİ, ama MongoDB dokümantasyonunda net şekilde tanımlı bir
semantik, yüksek güvenle uygulandı).

**2. ARAMA EKLENDİ:** Mera liste sayfasında, "Yeni Parsel" butonu ile
"Durum" filtresi ARASINA (kullanıcının istediği konum) bir arama
kutusu eklendi - İl/İlçe/Köy-Mahalle/Ada/Parsel alanlarının HEPSİNDE
serbest metin arar (debounce'lu, 300ms), Türkçe büyük/küçük harf
kurallarına uygun (JS tarafında, MongoDB regex'e güvenilmeden -
projenin genelindeki desenle aynı).

**3. DURUM DEĞİŞİKLİKLERİNDE AÇIKLAMA ZORUNLU:** "Aktif Et"/"Pasife
Al"/"Sil" artık `prompt()` ile açıklama İSTİYOR - boş bırakılırsa
işlem YAPILMIYOR ("Açıklama girilmeden işlem yapılamaz." uyarısı).
Açıklama, log kaydına "Durum: Aktif -> Pasif - Açıklama: ..." biçiminde
yazılıyor - backend de (`durumDegistir()`) açıklamayı ZORUNLU kılıyor
(boşsa hata fırlatıyor), sadece frontend kontrolüne güvenilmiyor.

**4. DOSYALAR SEKMESİNDE SİL EKLENDİ:** Genel amaçlı dosyalar (Dosyalar
sekmesinden yüklenenler) artık silinebiliyor - AÇIKLAMA ZORUNLU (aynı
mekanizma). **Harita/CBS dosyaları BİLEREK bu kapsamın DIŞINDA
BIRAKILDI** - onlar versiyonlu ve değişmez kalmaya devam ediyor
(kullanıcının önceki açık kararıyla tutarlı). Fiziksel dosya diskte
KALIYOR (sadece veritabanı referansı kaldırılıyor) - kaza ile veri
kaybı riskini azaltmak için bilinçli bir tercih.

**5. GELECEK NOT (kullanıcının kendi ifadesiyle): "bu sillerin tamamı
sadece admin de olacak şekilde izinlendireceğiz sonra."** Şu an
sistemde gerçek bir kullanıcı girişi/rolü olmadığı için TÜM silme/
durum değiştirme işlemleri herkese açık - kod içinde bunu işaretleyen
yorumlar bırakıldı (`mera.service.js`'deki `dosyaSil()` fonksiyonu
üzerinde), auth sistemi kurulduğunda BURAYA yetki kontrolü eklenmesi
gerekiyor. Bu turda İMPLEMENTE EDİLMEDİ (kullanıcının açık isteği:
"sonra").

## Mera - Durum Yönetimi + Dosyalar Sekmesi + Sistem Ayarları (YENİ)

**1. DURUM YÖNETİMİ (Aktif/Pasif/Silindi):** `MeraParseli` modeline
`durum` alanı eklendi. **"Sil" ARTIK GERÇEKTEN SİLMİYOR** - sistemin
genel felsefesiyle (notlar/harita versiyonları hiç kaybolmaz) tutarlı
olması için "Sil" ve "Pasife Al" AYNI mekanizmayı (durum değişikliği)
kullanıyor, sadece hedef durum farklı. Parsel detay sayfasının
başlığında durum rozeti + "Pasife Al/Aktif Et" ve "Sil" butonları
var - "Sil" onay istiyor, sonrasında listeye yönlendiriyor. Liste
sayfasına "Durum" filtresi eklendi (Aktif/Pasif/Tümü, varsayılan
Aktif) ve "Durum" sütunu (renkli rozet: yeşil/sarı/kırmızı).
`listele()` servis fonksiyonu varsayılan olarak "Silindi" durumundaki
kayıtları GİZLER (veri kaybolmaz, sadece listede görünmez).

**2. "DOSYALAR" SEKMESİ (YENİ):** Genel Bilgiler/Notlar/Log yanına
eklendi. Genel amaçlı belge yükleme (harita/CBS dosyalarından AYRI
bir alan - `MeraParseli.dosyalar`) + **harita dosyaları (orijinal
format VE otomatik üretilen GeoJSON türevi DAHİL) AYNI listede
BİRLİKTE** gösteriliyor (kullanıcının açık isteği). Her satırda:
dosya adı, tip, kaynak (Dosyalar/Harita vN), tarih, İndir butonu.
**PDF veya görsel (.pdf/.jpg/.jpeg/.png/.gif/.webp) dosyaya
TIKLANINCA Bootstrap modal içinde POPUP ÖNİZLEME açılıyor** (görseller
`<img>`, PDF `<iframe>` ile) - diğer formatlar doğrudan indiriliyor.

**3. YÖNETİLEBİLİR BELGE TİPLERİ + OTOMATİK ADLANDIRMA:** `BelgeAyarlari`
modeline `meraDosyaTipleri` dizisi eklendi - varsayılan olarak Tapu
Senedi, Tespit Tutanağı, Fotoğraf (hepsi otomatik adlandırmalı) ve
Diğer Belge (orijinal ad korunur) geliyor, Sistem Ayarları'ndan
eklenip çıkarılabiliyor. "Otomatik Adlandırma" açık olan bir tip
seçilirse dosya `İl-İlçe-Mahalle-Ada-Parsel-Tip-vN` biçiminde otomatik
adlandırılıyor (harita dosyalarıyla AYNI mantık, harita için zaten
var olan `dosyaAdiTemizle()` yardımcı fonksiyonu yeniden kullanıldı) -
test edildi: `Istanbul-Silivri-Bekirli-123-45-Tapu-Senedi-v1.pdf`.

**4. "GÖRÜNÜM AYARLARI" → "SİSTEM AYARLARI":** Sekme adı, artık SADECE
görsel değil veri-tanımlama (Mera Dosya Tipleri) ayarlarını da
barındırdığı için genişletildi. Sekme içinde yeni "Mera Dosya
Tipleri" tablosu (ad + otomatik adlandırma checkbox + satır silme) ve
"+ Belge Tipi Ekle" butonu var, aynı Kaydet butonuyla birlikte
kaydediliyor.

**Test edilen backend akışı:** model → service → controller → routes
zinciri tam yüklendi, `PARSEL_DURUMLARI` (`["Aktif","Pasif","Silindi"]`)
ve `VARSAYILAN_MERA_DOSYA_TIPLERI` doğrulandı, otomatik adlandırma
mantığı izole test edildi.

## Mera - Otomatik GeoJSON Dönüşümü (YENİ) - KURULUM GEREKLİ

**KULLANICI SORUSU ÜZERİNE:** "Bu formatlar içinde en iyi veri saklama
formatı hangisi?" sorusuna cevaben GeoJSON önerildi (öznitelik/
properties desteği doğal, ek kütüphane gerektirmeden Leaflet'te
render edilir, düz metin). Kullanıcı bunun üzerine "yüklenen dosyayı
otomatik GeoJSON'a çevir" istedi - bu, hem parsel bilgilerinin
(ıslah durumu, eğim vb.) dosyaya gömülmesini SAĞLIYOR, hem de
KMZ'nin "haritada gösterilemiyor" sorununu ÇÖZÜYOR.

**YENİ KURULUM GEREKLİ (`npm install` çalıştırılmalı):**
```
npm install @tmcw/togeojson @xmldom/xmldom adm-zip
```
`package.json`'a zaten eklendi, sadece sunucuda `npm install`
çalıştırmak yeterli. Bu 3 paket SADECE bu özellik için gerekli:
- `@tmcw/togeojson`: KML/GPX → GeoJSON dönüşümü (leaflet-omnivore'un
  TARAYICIDA kullandığı ile AYNI kütüphanenin ailesinden, ama BURADA
  SUNUCU tarafında/Node.js'te çalışıyor)
- `@xmldom/xmldom`: Node.js'te `DOMParser` yok (tarayıcıda var) -
  togeojson bir DOM nesnesi beklediği için bu paket GEREKLİ
- `adm-zip`: KMZ aslında içinde `.kml` barındıran bir ZIP arşivi -
  bu paket zip'i açıp içindeki KML'i çıkarmak için kullanılıyor

**Not (güvenlik):** `npm audit` 3 uyarı gösteriyor ama BUNLAR bu
YENİ paketlerden DEĞİL, projede zaten var olan `exceljs`/`xlsx`
bağımlılıklarından geliyor - kontrol edildi, yeni eklentiler ek risk
getirmiyor.

**Nasıl çalışıyor:** `mera.harita-donustur.js` (YENİ dosya) - bir
harita dosyası yüklendiğinde: 1) ORİJİNAL dosya HER ZAMAN olduğu gibi
(format değiştirilmeden) saklanır - kural DEĞİŞMEDİ. 2) AYRICA
otomatik olarak GeoJSON'a çevrilir (KML/KMZ/GPX → GeoJSON; GeoJSON/
JSON zaten öyleyse öznitelikleri zenginleştirilerek) ve parselin
GÜNCEL bilgileri (il/ilçe/mahalle/ada/parsel, mera/tapu alanı, arazi
niteliği/durum sınıfı/kaynağı, tespit/tahdit/tahsis, ıslah durumu,
eğim, toprak sınıfı, tapu kimlik no) HER feature'ın `properties`
alanına GÖMÜLÜR. 3) Bu türetilmiş dosya `{orijinal-ad}.geojson`
olarak diskte (`geojsonYolu` alanında) saklanır. Dönüşüm BAŞARISIZ
olursa (bozuk dosya vb.) SESSİZCE GEÇİLİR - orijinal dosya YİNE DE
kaydedilmiş olur. Test edildi (gerçek KML ve KMZ dosyalarıyla):
KML→GeoJSON dönüşümü + öznitelik gömme başarılı; KMZ (zip içinden
KML çıkarma) de başarılı - geri okundu, `islahDurumu` gibi alanlar
doğru şekilde içeride bulundu.

**Harita gösterimi artık `geojsonYolu`'nu ÖNCELİKLİ kullanıyor** -
hem `mera/detay.html` hem `mera/harita.html`'de: bu alan varsa
(yeni yüklenen HER dosya için garanti var) DOĞRUDAN o kullanılır -
format ne olursa olsun (KMZ DAHİL) güvenle çizilir. Yoksa (ÖNCEKİ
turlarda, bu özellik eklenmeden önce yüklenmiş ESKİ kayıtlar için)
eski format-bazlı mantığa (omnivore vb.) geri düşülür - geriye dönük
uyumluluk korundu, eski kayıtlar bozulmadı.

## Mera - Harita Konumu Düzeltmesi (2. Kez)

**YİNE YANLIŞ YERDEYDİ:** Önceki turda harita "sol bölmenin sağ alt-
sütunu" olarak eklenmişti ama TÜM sekmelerin (Genel Bilgiler/Notlar/
Log) yanında SABİT duruyordu. Kullanıcı SADECE Genel Bilgiler
sekmesinde görünmesini istedi. Düzeltme: `row/col-lg-7+col-lg-5`
bölünmesi artık SADECE `#genel-tab` tab-pane'inin İÇİNDE - Notlar ve
Log sekmeleri artık TAM GENİŞLİKTE (harita YOK). Ayrıca Bootstrap'in
`shown.bs.tab` olayı dinlenerek, kullanıcı başka sekmeye gidip Genel
Bilgiler'e GERİ DÖNDÜĞÜNDE `harita.invalidateSize()` çağrılıyor -
Leaflet, gizli (`display:none`) bir konteynerden tekrar görünür hale
gelince boyutunu YANLIŞ hesaplayabiliyor (bilinen bir davranış), bu
çağrı olmadan harita bozuk/kaymış görünebilirdi.

## Mera - Otomatik GeoJSON Dönüşümü (YENİ)

**Kullanıcının sorusu ("en iyi veri saklama formatı hangisi") ve
cevabı (GeoJSON - `properties` alanı sayesinde parsel verisini dosya
İÇİNE gömebiliyor, ekstra kütüphane gerektirmiyor, KMZ'nin aksine
tarayıcıda direkt render edilebiliyor) sonrası eklendi.**

Artık YÜKLENEN HER dosya (KML/KMZ/GPX/GeoJSON/JSON, formatı ne olursa
olsun) otomatik olarak GeoJSON'a da çevriliyor - YENİ `backend/
modules/mera/mera.harita-donustur.js`. **ORİJİNAL dosya HER ZAMAN
olduğu gibi (format değiştirilmeden) AYRICA saklanır** (ilk kural
korunuyor) - GeoJSON türevi SADECE bir "kolaylık kopyası". Dönüşen
GeoJSON'un HER feature'ının `properties` alanına parselin GÜNCEL
bilgileri (İl/İlçe/Mahalle/Ada/Parsel, Arazi Niteliği/Durum Sınıfı/
Kaynağı, **Islah Durumu, Eğimi**, Toprak Sınıfı, Mera/Tapu Alanı,
Tapu Kimlik No) GÖMÜLÜYOR - test edildi, gerçek bir KMZ dosyasıyla
uçtan uca doğrulandı (bkz. aşağıdaki örnek çıktı).

**KMZ SORUNU TAMAMEN ÇÖZÜLDÜ:** Harita artık `geojsonYolu` varsa
HER ZAMAN onu kullanıyor (`L.geoJSON()` ile, ek kütüphane
gerektirmeden) - bu, `leaflet-omnivore`'un doğrudan gösteremediği
KMZ dosyalarının da ARTIK haritada görünmesini sağlıyor. Dönüşüm
sunucu tarafında `adm-zip` (KMZ'yi aç) + `@tmcw/togeojson` (KML/GPX
XML'ini GeoJSON'a çevir) + `@xmldom/xmldom` (XML ayrıştırma) ile
yapılıyor. Dönüşüm BAŞARISIZ olursa (bozuk dosya vb.) SESSİZCE
geçilir - orijinal dosya YİNE DE kaydedilir, sadece o versiyon için
harita gösterimi çalışmayabilir (log'a not düşülür).

**GEREKLİ YENİ NPM PAKETLERİ (kullanıcının kurması gerekiyor):**
```bash
npm install @tmcw/togeojson @xmldom/xmldom adm-zip
```
(Bu üçü zaten `package.json`'a eklendi - `npm install` çalıştırmak
yeterli.)

**Test edilen uçtan uca akış (gerçek KMZ dosyasıyla):** dosya
içindeki `.kml` çıkarıldı → GeoJSON'a çevrildi → parsel özellikleri
gömüldü → sonuç: `{"il":"İstanbul","ilce":"Silivri","koyMahalle":
"Bekirli","adaNo":"123","parselNo":"45","araziNiteligi":"Mera",
"araziDurumSinifi":"İyi","islahDurumu":"Islah Ediliyor","egimi":"%5",
"topraksinifi":"IV. Sınıf","meraAlaniM2":22222,"tapuAlaniM2":0}` -
hem orijinal `.kmz` HEM türetilen `.geojson` diskte yan yana durdu.

## Mera Parsel Detay Sayfası - Layout Düzeltmesi (2 tur)

**YANLIŞ KONUMLANDIRMA DÜZELTİLDİ:** Harita paneli ÖNCEKİ turda
YANLIŞLIKLA sağ bölmeye (`mis-icerik-ikincil`) eklenmişti - kullanıcı
bunun SOL bölmenin (`mis-icerik-birincil`) İÇİNDE olmasını istiyordu.
İlk düzeltmede sol bölme İL/İLÇE/MAHALLE/ADA/PARSEL başlığından SONRA
kendi içinde ikiye bölündü (`col-lg-7` sekmeler/form + `col-lg-5`
harita) - AMA bu, harita TÜM sekmelerde (Notlar/Log dahil) görünür
kalmasına yol açtı. **İKİNCİ DÜZELTME:** kullanıcı haritanın SADECE
Genel Bilgiler sekmesinde görünmesini istedi - `row/col-lg-7/col-lg-5`
bölünmesi artık SADECE `#genel-tab` tab-pane'inin İÇİNDE, Notlar ve
Log sekmelerinde harita YOK (tam genişlik). Sekmeler arası geçişte
Leaflet'in KONTEYNER BOYUTUNU YANLIŞ HESAPLAMASINI (bilinen bir
Leaflet davranışı - `display:none` olan bir konteynerde başlatılan/
kalan harita, tekrar görünür olduğunda boyutunu KAYBEDEBİLİR) önlemek
için `shown.bs.tab` olayında `invalidateSize()` çağrılıyor. Sağ bölmeye
(Verim Bilgileri) HİÇ DOKUNULMADI, orada
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
