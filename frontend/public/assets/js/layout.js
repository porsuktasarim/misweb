/**
 * layout.js
 *
 * Kenar çubuğu daraltma/genişletme davranışı. Tercih localStorage'da
 * tutulur (gerçek tarayıcı ortamı - Claude Artifacts önizlemesi değil,
 * MİS kendi sunucusunda çalışan bağımsız bir sitedir).
 */

(function () {
  const KABUK_SINIFI = 'menu-daraltilmis';
  const DEPO_ANAHTARI = 'mis.kenarCubugu.daraltilmis';

  function kabuguBul() {
    return document.querySelector('.mis-kabuk');
  }

  function baslangicDurumunuUygula() {
    const kabuk = kabuguBul();
    if (!kabuk) return;
    const daraltilmisMi = localStorage.getItem(DEPO_ANAHTARI) === '1';
    kabuk.classList.toggle(KABUK_SINIFI, daraltilmisMi);
  }

  function menuyuAcKapa() {
    const kabuk = kabuguBul();
    if (!kabuk) return;
    const yeniDurum = !kabuk.classList.contains(KABUK_SINIFI);
    kabuk.classList.toggle(KABUK_SINIFI, yeniDurum);
    localStorage.setItem(DEPO_ANAHTARI, yeniDurum ? '1' : '0');
  }

  function aktifMenuBaglantisiniIsaretle() {
    const mevcutYol = window.location.pathname.replace(/\/index\.html$/, '/');
    document.querySelectorAll('.mis-anamenu a').forEach((baglanti) => {
      const hedefYol = new URL(baglanti.href).pathname.replace(/\/index\.html$/, '/');
      baglanti.classList.toggle('aktif', hedefYol === mevcutYol);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    baslangicDurumunuUygula();
    aktifMenuBaglantisiniIsaretle();

    const toggleBtn = document.querySelector('.mis-menu-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', menuyuAcKapa);
  });
})();
