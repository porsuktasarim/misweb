/**
 * cks.service.js
 *
 * Orkestrasyon: dosya okuma + derleme + kaydetme/listeleme/silme.
 */

const { dosyaOku } = require('./cks.import');
const { derle } = require('./cks.core');
const CksSonuc = require('./cks.model');

/**
 * Onizleme - henuz kaydetmez.
 *
 * KULLANICININ ACIK ISTEGI: Il/Ilce/Koy-Mahalle ARTIK KULLANICIDAN
 * ISTENMIYOR (eskiden "baslik" parametresi olarak ALINIYORDU, TUM
 * kayitlara UYGULANIYORDU) - bunun yerine DOSYANIN KENDISINDEN
 * (cks.import.js zaten OKUYORDU ama KULLANILMIYORDU) okunan GERCEK
 * il/ilce/koy bilgisine gore derle() TARAFINDAN OTOMATIK
 * gruplaniyor. "uretimYili" ise DOSYADA OLMADIGI icin HALA
 * kullanicidan alinir, TUM yerlesimlere ORTAK uygulanir.
 *
 * @param {object} params
 * @param {string[]} params.dosyaYollari
 * @param {number} [params.uretimYili]
 */
async function onizlemeOlustur({ dosyaYollari, uretimYili }) {
  const tumKayitlar = [];
  for (const dosyaYolu of dosyaYollari) {
    const kayitlar = await dosyaOku(dosyaYolu);
    tumKayitlar.push(...kayitlar);
  }

  const { yerlesimler } = derle(tumKayitlar);

  return {
    uretimYili,
    kaynakDosyalar: dosyaYollari.map((p) => p.split('/').pop()),
    yerlesimler,
  };
}

/**
 * KULLANICININ ACIK ISTEGI: bir ÇKS yuklemesi BIRDEN FAZLA yerlesim
 * (il/ilce/koy) ICERIYORSA, HER YERLESIM AYRI, BAGIMSIZ bir CksSonuc
 * KAYDI olarak SAKLANIR - TEK bir kayitta BIRLESTIRILMEZ (BBHB
 * modulundeki AYNI karara PARALEL - bkz. bbhb.service.js).
 *
 * Imza bilgileri (teknikEkipImzacilari, muhtarHeyetiImzacilari) TUM
 * yerlesimler icin ORTAK girilir (TEK "Kaydet" tiklamasiyla HEPSI
 * kaydedildigi icin) - HER olusan kayda AYNI SEKILDE kopyalanir.
 *
 * Donus degeri: HER ZAMAN bir DIZI (tek yerlesim olsa bile).
 */
async function sonucuKaydet(veri, olusturanKullaniciId) {
  const { yerlesimler, kaynakDosyalar, uretimYili, teknikEkipImzacilari, muhtarHeyetiImzacilari } = veri;

  const kayitlar = await Promise.all(
    yerlesimler.map((yerlesim) => {
      const { siniflandirmaUyarilari, ...yerlesimVerisi } = yerlesim;
      return CksSonuc.create({
        ...yerlesimVerisi,
        uretimYili,
        kaynakDosyalar,
        teknikEkipImzacilari,
        muhtarHeyetiImzacilari,
        olusturanKullaniciId,
        durum: 'aktif',
      });
    })
  );
  return kayitlar;
}

async function sonucuGetir(id) {
  const kayit = await CksSonuc.findById(id);
  if (!kayit) throw new Error(`ÇKS sonucu bulunamadı: ${id}`);
  return kayit;
}

async function sonuclariListele() {
  return CksSonuc.find({ durum: 'aktif' }).sort({ createdAt: -1 });
}

async function sonucuSil(id) {
  const kayit = await CksSonuc.findByIdAndDelete(id);
  if (!kayit) throw new Error(`ÇKS sonucu bulunamadı: ${id}`);
  return kayit;
}

module.exports = { onizlemeOlustur, sonucuKaydet, sonucuGetir, sonuclariListele, sonucuSil };
