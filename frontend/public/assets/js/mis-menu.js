/**
 * mis-menu.js
 *
 * TEK KAYNAK: Ana menudeki tum araclar burada tanimlanir. Yeni bir
 * arac (orn. CKS) eklendiginde SADECE bu dosyaya bir satir eklenir -
 * mevcut sayfalarin hicbiri degistirilmez. shell.js bu listeyi okuyup
 * kenar cubugunu otomatik olusturur.
 */

const MIS_MENU = [
  {
    grup: 'Araçlar',
    ogeler: [
      {
        anahtar: 'bbhb',
        ad: 'BBHB Hesaplama',
        href: '/bbhb/',
        ikonSvg: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      },
      // CKS eklendiginde buraya yeni bir { anahtar:'cks', ad:'ÇKS Hesaplama', href:'/cks/', ikonSvg:'...' } satiri eklenecek.
    ],
  },
  {
    grup: 'Sistem',
    ogeler: [
      {
        anahtar: 'ayarlar',
        ad: 'Ayarlar',
        href: '/ayarlar/',
        ikonSvg: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1z"/>',
      },
      {
        anahtar: 'raporlarim',
        ad: 'Raporlarım',
        href: '#',
        ikonSvg: '<path d="M12 20V10M18 20V4M6 20v-6"/>',
      },
    ],
  },
];
