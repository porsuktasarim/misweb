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
        anahtar: 'raporlarim',
        ad: 'Raporlarım',
        href: '#',
        ikonSvg: '<path d="M12 20V10M18 20V4M6 20v-6"/>',
      },
    ],
  },
];
