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
