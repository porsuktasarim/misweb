/**
 * report.contract.js
 *
 * TUM modullerin rapor ciktisi bu SEKLE uymak zorundadir.
 * Exporter'lar (excel/word/pdf) SADECE bu sekli bilir; hangi
 * modulden geldigini (BBHB/CKS) bilmezler.
 *
 * contract = {
 *   modulAdi: string,               // 'bbhb' | 'cks' | ...
 *   bolumler: [                     // il/ilce/mahalle bazinda bolumler
 *     {
 *       baslik: { il, ilce, mahalle },
 *       isletmeciler: [
 *         {
 *           isletmeciAdi: string,
 *           kayitlar: [
 *             { grup, kategori, adet, katsayi, deger }
 *           ],
 *           isletmeciToplami: number,
 *         }
 *       ],
 *       bolumToplami: number,
 *     }
 *   ],
 *   genelToplam: number,             // tum bolumlerin toplami
 *   ozet: { [anahtar: string]: string | number },
 *   siniflandirmaKriterleri: [
 *     { grup, kategori, katsayi }    // rapor sonunda gosterilecek, TEK sefer
 *   ],
 *   olusturmaTarihi: Date,
 * }
 */

function contractDogrula(contract) {
  const zorunluAlanlar = [
    'modulAdi',
    'bolumler',
    'genelToplam',
    'siniflandirmaKriterleri',
  ];
  for (const alan of zorunluAlanlar) {
    if (contract[alan] === undefined) {
      throw new Error(`Rapor contract'inda eksik alan: ${alan}`);
    }
  }
  if (!Array.isArray(contract.bolumler) || contract.bolumler.length === 0) {
    throw new Error("Rapor contract'inda en az bir bölüm olmalı");
  }
  for (const bolum of contract.bolumler) {
    if (!bolum.baslik || !bolum.baslik.il || !bolum.baslik.ilce) {
      throw new Error('Her bölümün başlığında il/ilçe zorunludur');
    }
  }
  return true;
}

module.exports = { contractDogrula };
