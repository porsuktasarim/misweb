/**
 * mis-yer-secici.js
 *
 * Il / Ilce / Koy-Mahalle icin ORTAK, kademeli ve arama destekli secici.
 * TomSelect kutuphanesini kullanir: yazarak filtreleme yapilabilir,
 * ayrica tiklayip tum listeyi acarak da secim yapilabilir - serbest
 * metin girisine izin VERMEZ (create:false), sadece listeden secim
 * kabul edilir.
 *
 * Kullanim: <select> elemanlarini id ile hazirla, sonra:
 *   misYerSeciciKur({ ilSelectId, ilceSelectId, mahalleSelectId, onDegisti })
 */

async function misYerApiGet(url) {
  const res = await fetch(url);
  return res.json();
}

async function misYerSeciciKur({ ilSelectId, ilceSelectId, mahalleSelectId, onDegisti, ilceOpsiyonel = false, mahalleOpsiyonel = false }) {
  const ortakAyarlar = {
    create: false,
    maxOptions: null,
    placeholder: 'Seçiniz...',
    allowEmptyOption: true,
  };

  const ilTs = new TomSelect(`#${ilSelectId}`, { ...ortakAyarlar });
  const ilceTs = new TomSelect(`#${ilceSelectId}`, { ...ortakAyarlar });
  const mahalleTs = new TomSelect(`#${mahalleSelectId}`, { ...ortakAyarlar });

  ilceTs.disable();
  mahalleTs.disable();

  function tetikleDegisti() {
    if (typeof onDegisti === 'function') {
      onDegisti({ il: ilTs.getValue(), ilce: ilceTs.getValue(), mahalle: mahalleTs.getValue() });
    }
  }

  const illerJson = await misYerApiGet('/api/yerlesim/iller');
  if (illerJson.success) {
    illerJson.data.forEach((il) => ilTs.addOption({ value: il, text: il }));
    ilTs.refreshOptions(false);
  }

  ilTs.on('change', async (il) => {
    ilceTs.clear(true);
    ilceTs.clearOptions();
    mahalleTs.clear(true);
    mahalleTs.clearOptions();
    mahalleTs.disable();

    if (!il) {
      ilceTs.disable();
      tetikleDegisti();
      return;
    }
    ilceTs.enable();
    const json = await misYerApiGet(`/api/yerlesim/ilceler/${encodeURIComponent(il)}`);
    if (json.success) {
      json.data.forEach((ilce) => ilceTs.addOption({ value: ilce, text: ilce }));
      ilceTs.refreshOptions(false);
    }
    tetikleDegisti();
  });

  ilceTs.on('change', async (ilce) => {
    mahalleTs.clear(true);
    mahalleTs.clearOptions();

    const il = ilTs.getValue();
    if (!ilce) {
      mahalleTs.disable();
      tetikleDegisti();
      return;
    }
    mahalleTs.enable();
    const json = await misYerApiGet(`/api/yerlesim/mahalleler/${encodeURIComponent(il)}/${encodeURIComponent(ilce)}`);
    if (json.success) {
      json.data.forEach((m) => mahalleTs.addOption({ value: m.mahalle, text: m.mahalle }));
      mahalleTs.refreshOptions(false);
    }
    tetikleDegisti();
  });

  mahalleTs.on('change', tetikleDegisti);

  return { ilTs, ilceTs, mahalleTs };
}
