/**
 * mis-menu.js
 *
 * TEK KAYNAK: Ana menudeki tum arac/modul burada tanimlanir. Yeni bir
 * arac/modul eklendiginde SADECE bu dosyaya bir satir eklenir -
 * mevcut sayfalarin hicbiri degistirilmez. shell.js bu listeyi okuyup
 * kenar cubugunu otomatik olusturur.
 *
 * "Araçlar": tek basina, bagimsiz kullanilan hesaplama/cetvel
 * ekranlari (BBHB, EKGB, ÇKS, Mevzuat).
 * "Modüller": bir sureci UCTAN UCA yoneten, kendi ic sekmeleri/
 * alt-adimlari olan buyuk yapilar (3T, Mera). Ek-4ab artik AYRI bir
 * menu ogesi DEGIL - 3T'nin "Birlestirme" adimi ONU OTOMATIK uretir.
 */

const MIS_MENU = [
  {
    grup: 'Modüller',
    ogeler: [
      {
        anahtar: 'uc-t',
        ad: '3T (Tespit-Tahdit-Tahsis)',
        href: '/uc-t/',
        ikonSvg: '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
      },
      {
        anahtar: 'mera',
        ad: 'Mera Modülü',
        href: '/mera/',
        ikonSvg: '<path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-5a3 3 0 0 1 6 0v5"/>',
      },
    ],
  },
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
        ad: 'Ek-4ab (BBHB+ÇKS Birleştirme)',
        href: '/ek4ab/',
        ikonSvg: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
      },
      {
        anahtar: 'mevzuat',
        ad: 'Mevzuat',
        href: '/mevzuat/',
        ikonSvg: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/>',
      },
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
