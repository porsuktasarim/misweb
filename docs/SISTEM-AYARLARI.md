# Sistem Ayarları

("Görünüm Ayarları" / eski adıyla "Belge Görünüm Ayarları" - kapsam
genişledikçe yeniden adlandırıldı, artık sadece görsel değil veri-
tanımlama ayarlarını da barındırıyor.)

## İmza Rengi ve Word Yazı Tipi

3T'nin ürettiği Word/PDF çıktılarında (Duyuru, Duyuru Tutanağı,
Tebliğ Belgesi vb.) kullanılan "İMZA" rengi ve yazı tipi buradan
yönetilir - tüm imza satırlarında ve açık renkli etiketlerde (Adı
Soyadı/Ünvanı) aynı renk kullanılır. PDF çıktısı Türkçe karakter
desteği için sabit bir gömülü font (DejaVu Serif) kullanır, bu ayar
sadece Word çıktısını etkiler.

## Ekran Font Boyutları (Bölge-Bazlı)

`BelgeAyarlari.temaBolumleri` - genişletilebilir bir dizi, her eleman
`{anahtar, ad, baslikBoyutuPx, metinBoyutuPx}`. **Sayfa-bazlı değil,
arayüzün yapısal bölgelerine göre**: Sol Menü, Üst Menü, Ana İçerik -
Sol Bölge, Ana İçerik - Sağ Bölge.

Uygulama mekanizması global: `shell.js`'e `misGorunumAyarlariniUygula()`
eklendi, `misKabuguBaslat()` (her sayfanın çağırdığı ortak kabuk
fonksiyonu) içinde otomatik çalışır - `/api/belge-ayarlari`'ı çekip
her bölüm için `--font-{anahtar}-baslik` / `--font-{anahtar}-metin`
CSS custom property'lerini `<html>`'e yazar. `layout.css`'teki
`.mis-anamenu`, `.mis-ustcubuk`/`.mis-arac-adi`, `.mis-icerik-
birincil`/`.mis-icerik-ikincil` seçicileri bu değişkenleri kullanır -
tek bir ayar tüm sayfalarda aynı anda etkili olur, sayfa başına ayrı
kod yazılmasına gerek kalmaz. Kaydedince sayfa yenilenmeden hemen
uygulanır.

## Mera Dosya Tipleri

Bkz. [`MERA-MODULU.md`](MERA-MODULU.md#yönetilebilir-belge-tipleri--otomatik-adlandırma).

## Mera Mülkiyet Durumları

Bkz. [`MERA-MODULU.md`](MERA-MODULU.md#mülkiyet-durumu).

## Harita Katman Varsayılanları

Bkz. [`MERA-MODULU.md`](MERA-MODULU.md#harita-alt-modülü).

## Mera Verim Ayarları

Ayrı bir sekme - bkz. [`MERA-MODULU.md`](MERA-MODULU.md#verim-bilgileri--otlatma-kapasitesi).
