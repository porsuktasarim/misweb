# GitHub'a Yükleme Kılavuzu

## 1. GitHub'da Repo Açma

1. https://github.com adresine giriş yapın.
2. Sağ üstteki **+** işaretine tıklayın → **New repository**.
3. Alanları doldurun:
   - **Repository name:** `mera-izleme-sistemi` (veya `mis`)
   - **Description:** "4342 sayılı Mera Kanunu kapsamında BBHB hesaplama ve raporlama sistemi"
   - **Visibility:** Kurum içi/hassas veri barındırıyorsa **Private** seçin.
     Sadece kod (gerçek veri değil) paylaşılacaksa Public da olabilir.
   - **"Add a README file" kutucuğunu İŞARETLEMEYİN** — projenizde zaten
     bir `README.md` var, işaretlerseniz çakışma (conflict) çıkar.
   - `.gitignore` ve lisans şablonu eklemeyin, projede zaten `.gitignore` var.
4. **Create repository** butonuna basın.
5. Açılan sayfada size bir repo adresi verilecek, örneğin:
   `https://github.com/<kullanici-adiniz>/mera-izleme-sistemi.git`
   Bunu bir sonraki adımda kullanacaksınız.

## 2. Bilgisayarınızda Git Kurulu mu?

Terminalde kontrol edin:

```bash
git --version
```

Kurulu değilse: https://git-scm.com/downloads adresinden işletim
sisteminize uygun sürümü indirip kurun.

## 3. Git'i İlk Kez Kullanıyorsanız — Kimlik Tanımlama

Bu, sadece bilgisayarınızda bir kere yapılır:

```bash
git config --global user.name "Adınız Soyadınız"
git config --global user.email "github-hesabinizdaki@email.com"
```

## 4. Proje Klasöründe Git Deposu Başlatma

Proje klasörünün içine girin (klasör adı sizde farklı olabilir):

```bash
cd mis
git init
```

Bu komut klasörün içine gizli bir `.git` klasörü oluşturur — projeyi
Git ile takip etmeye başlar. `.gitignore` dosyası zaten hazır olduğu
için `node_modules/`, `.env`, `uploads/` gibi klasörler otomatik
olarak dışarıda kalır.

## 5. Dosyaları Hazırlama ve İlk Commit

```bash
git add .
git commit -m "İlk sürüm: BBHB modülü ve raporlama altyapısı"
```

- `git add .` — klasördeki tüm değişiklikleri (yeni/değişen dosyaları)
  "gönderilecekler" listesine ekler.
- `git commit` — o an listede olan değişiklikleri kalıcı bir "kayıt
  noktası" (commit) olarak projenin geçmişine işler. `-m` ile kısa bir
  açıklama yazılır.

## 6. GitHub Reposunu Yerel Depoya Bağlama

GitHub'da oluşturduğunuz reponun adresini kullanın:

```bash
git remote add origin https://github.com/<kullanici-adiniz>/mera-izleme-sistemi.git
```

`origin`, bu uzak adrese verdiğiniz kısa isimdir — ileride her seferinde
uzun adresi yazmak yerine `origin` yazmanız yeterli olur.

## 7. Ana Dalın Adını Ayarlama (main)

```bash
git branch -M main
```

GitHub'ın varsayılan dal adı `main`'dir, yerelde farklıysa bu komutla
eşitlenir.

## 8. Yükleme (Push)

```bash
git push -u origin main
```

- Bu komut, yerel commit'lerinizi GitHub'daki repoya gönderir.
- İlk seferinde GitHub kullanıcı adı/şifre yerine artık
  **kişisel erişim jetonu (Personal Access Token)** veya SSH anahtarı
  istenir (GitHub şifre ile push'u kaldırdı). Aşağıdaki bölüme bakın.
- `-u` bayrağı, yerel `main` dalınızı uzak `origin/main` ile
  eşleştirir; bir sonraki seferden itibaren sadece `git push` yazmanız
  yeterli olur.

## 9. Kimlik Doğrulama — Personal Access Token (PAT)

GitHub artık HTTPS üzerinden push için şifre kabul etmiyor. İki seçenek:

**A) Personal Access Token (daha basit, önerilen):**
1. GitHub → sağ üstteki profil resmi → **Settings**
2. Sol menüde en altta **Developer settings**
3. **Personal access tokens → Tokens (classic)** → **Generate new token**
4. `repo` yetkisini işaretleyin, süre belirleyin, oluşturun.
5. Çıkan token'ı kopyalayın (bir daha gösterilmez, saklayın).
6. `git push` sırasında şifre istendiğinde, şifre yerine bu token'ı
   yapıştırın.

**B) SSH Anahtarı (tekrar tekrar token girmek istemiyorsanız):**
```bash
ssh-keygen -t ed25519 -C "email@adresiniz.com"
cat ~/.ssh/id_ed25519.pub
```
Çıkan metni kopyalayıp GitHub → Settings → **SSH and GPG keys** →
**New SSH key** kısmına yapıştırın. Sonra remote adresini SSH
formatına çevirin:
```bash
git remote set-url origin git@github.com:<kullanici-adiniz>/mera-izleme-sistemi.git
```

## 10. Sonraki Değişiklikleri Gönderme (günlük akış)

Projede değişiklik yaptıkça:

```bash
git add .
git commit -m "Kısa ve açıklayıcı bir mesaj"
git push
```

## 11. Özet — İlk Yükleme İçin Komutlar (tek seferde)

```bash
cd mis
git init
git add .
git commit -m "İlk sürüm: BBHB modülü ve raporlama altyapısı"
git remote add origin https://github.com/<kullanici-adiniz>/mera-izleme-sistemi.git
git branch -M main
git push -u origin main
```

`<kullanici-adiniz>` kısmını kendi GitHub kullanıcı adınızla değiştirmeyi
unutmayın.
