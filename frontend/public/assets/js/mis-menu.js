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
      {
        anahtar: 'ekgb',
        ad: 'Eski Konumuna Getirme Bedeli',
        href: '/ekgb/',
        ikonSvg: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>',
      },
      {
        anahtar: 'cks',
        ad: 'ÇKS Cetveli',
        href: '/cks/',
        ikonSvg: '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
      },
      {
        anahtar: 'ek4ab',
        ad: 'Ek-4ab (Birleşik Cetvel)',
        href: '/ek4ab/',
        ikonSvg: '<path d="M8 3v4M16 3v4M4 11h16M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>',
      },
      {
        anahtar: 'mevzuat',
        ad: 'Mevzuat',
        href: '/mevzuat/',
        ikonSvg: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/>',
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
