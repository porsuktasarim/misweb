/**
 * report.contract.js
 *
 * TUM modullerin rapor ciktisi bu SEKLE uymak zorundadir.
 * Exporter'lar (excel/word/pdf) SADECE bu sekli bilir; hangi
 * modulden geldigini (BBHB/CKS) bilmezler.
 *
 * Bu dosya calisma zamaninda kullanilmaz, sadece SEKIL SOZLESMESI
 * ve dogrulama (validasyon) icin referans niteligindedir.
 *
 * contract = {
 *   modulAdi: string,               // 'bbhb' | 'cks' | ...
 *   baslik: { il, ilce, mahalle },
 *   isletmeciler: [
 *     {
 *       isletmeciAdi: string,
 *       kayitlar: [
 *         { grup, kategori, adet, katsayi, deger }  // 'deger' = bbhb/cks sonucu
 *       ],
 *       isletmeciToplami: number,
 *     }
 *   ],
 *   genelToplam: number,
 *   ozet: { [anahtar: string]: string | number },
 *   siniflandirmaKriterleri: [
 *     { grup, kategori, katsayi }   // rapor sonunda gosterilecek kural listesi
 *   ],
 *   olusturmaTarihi: Date,
 * }
 */

function contractDogrula(contract) {
  const zorunluAlanlar = [
    'modulAdi',
    'baslik',
    'isletmeciler',
    'genelToplam',
    'siniflandirmaKriterleri',
  ];
  for (const alan of zorunluAlanlar) {
    if (contract[alan] === undefined) {
      throw new Error(`Rapor contract'inda eksik alan: ${alan}`);
    }
  }
  if (!contract.baslik.il || !contract.baslik.ilce) {
    throw new Error('Rapor basliginda il/ilce zorunludur');
  }
  return true;
}

module.exports = { contractDogrula };
