/**
 * mis-lang.js
 *
 * config/lang/tr.js'teki TUM metinleri /api/sistem/dil'den CEKIP
 * sayfaya sunar - boylece HTML/JS icinde literal Turkce string
 * YAZILMAZ, TEK kaynaktan (lang dosyasi) okunur.
 *
 * KULLANIM: sayfanin ana script'inin EN BASINDA:
 *   const LANG = await misLangYukle();
 * sonra TUM metinler LANG.ortak.xxx / LANG.mera.xxx seklinde okunur.
 */
let _misLangOnbellek = null;

async function misLangYukle() {
  if (_misLangOnbellek) return _misLangOnbellek;
  const json = await fetch('/api/sistem/dil').then((r) => r.json());
  _misLangOnbellek = json.data;
  return _misLangOnbellek;
}
