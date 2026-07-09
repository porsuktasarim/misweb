/**
 * shell.js
 *
 * MIS 4 bolgeli kabugunu (marka/ust cubuk/ana menu/footer) DOM'a
 * enjekte eder. Her modul sayfasi sadece kendi icerigini (parca 4)
 * yazar; kabuk her zaman burada, tek yerden yonetilir. Boylece yeni
 * bir modul eklendiginde (orn. CKS) sadece mis-menu.js degisir, hicbir
 * sayfanin HTML'ine dokunulmaz.
 */

const MIS_LOGO_SVG = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M5 8c-1.2-.6-2-1.8-1.6-2.8.4-1 1.8-1 2.6-.2M19 8c1.2-.6 2-1.8 1.6-2.8-.4-1-1.8-1-2.6-.2"
      stroke="#c79a46" stroke-width="1.4" stroke-linecap="round"/>
    <ellipse cx="12" cy="13.5" rx="7" ry="6" fill="#f5f4ef"/>
    <ellipse cx="7.6" cy="10.5" rx="1.6" ry="2.1" fill="#f5f4ef" transform="rotate(-25 7.6 10.5)"/>
    <ellipse cx="16.4" cy="10.5" rx="1.6" ry="2.1" fill="#f5f4ef" transform="rotate(25 16.4 10.5)"/>
    <circle cx="9.3" cy="13" r="1" fill="#1f4331"/>
    <circle cx="14.7" cy="13" r="1" fill="#1f4331"/>
    <ellipse cx="12" cy="16.2" rx="2.6" ry="1.6" fill="#1f4331"/>
  </svg>`;

function misMarkaHtml() {
  return `
    ${MIS_LOGO_SVG}
    <div class="mis-marka-metin">
      MİS
      <small>Mera İzleme Sistemi</small>
    </div>`;
}

function misUstCubukHtml(aracAdi) {
  return `
    <button class="mis-menu-toggle" title="Menüyü daralt/genişlet" aria-label="Menüyü daralt/genişlet">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <div class="mis-arac-adi">${aracAdi}</div>
    <div class="mis-ustcubuk-baglantilar">
      <a href="#" title="Ayarlar" aria-label="Ayarlar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1z"/>
        </svg>
      </a>
      <a href="#" title="Kullanıcı" aria-label="Kullanıcı">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>
        </svg>
      </a>
    </div>`;
}

function misAnaMenuHtml() {
  return MIS_MENU.map(
    (grup) => `
      <div class="mis-anamenu-grup-baslik">${grup.grup}</div>
      ${grup.ogeler
        .map(
          (oge) => `
        <a href="${oge.href}" data-anahtar="${oge.anahtar}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${oge.ikonSvg}</svg>
          <span>${oge.ad}</span>
        </a>`
        )
        .join('')}`
  ).join('');
}

function misFooterHtml() {
  const yil = new Date().getFullYear();
  return `
    <span>© ${yil} <a href="https://pors.uk" target="_blank" rel="noopener">Porsuk Tasarım</a></span>
    <span class="mis-versiyon" id="mis-footer-versiyon">…</span>`;
}

async function misVersiyonYukle() {
  try {
    const res = await fetch('/api/sistem/versiyon');
    const json = await res.json();
    const hedef = document.getElementById('mis-footer-versiyon');
    if (hedef && json.success) {
      hedef.textContent = `v${json.data.versiyon}`;
    }
  } catch (err) {
    // versiyon gosterilemezse sessizce gec - kritik degil
  }
}

const KABUK_SINIFI = 'menu-daraltilmis';
const DEPO_ANAHTARI = 'mis.kenarCubugu.daraltilmis';

function misMenuyuAcKapa() {
  const kabuk = document.getElementById('mis-kabuk');
  if (!kabuk) return;
  const yeniDurum = !kabuk.classList.contains(KABUK_SINIFI);
  kabuk.classList.toggle(KABUK_SINIFI, yeniDurum);
  localStorage.setItem(DEPO_ANAHTARI, yeniDurum ? '1' : '0');
}

function misAktifMenuyuIsaretle(aktifAnahtar) {
  document.querySelectorAll('.mis-anamenu a').forEach((a) => {
    a.classList.toggle('aktif', a.dataset.anahtar === aktifAnahtar);
  });
}

/**
 * Sayfa yuklendiginde cagrilir. aktifAnahtar mis-menu.js'teki 'anahtar'
 * degeriyle eslesmeli (orn. 'bbhb'). aracBaslikHtml ust cubuktaki modul
 * adini gosterir (orn. "BBHB<span class='ayrac'>/</span>Hesaplama").
 */
function misKabuguBaslat(aktifAnahtar, aracBaslikHtml) {
  document.getElementById('mis-marka').innerHTML = misMarkaHtml();
  document.getElementById('mis-ustcubuk').innerHTML = misUstCubukHtml(aracBaslikHtml);
  document.getElementById('mis-anamenu').innerHTML = misAnaMenuHtml();
  document.getElementById('mis-footer').innerHTML = misFooterHtml();

  misAktifMenuyuIsaretle(aktifAnahtar);
  misVersiyonYukle();

  const kabuk = document.getElementById('mis-kabuk');
  const daraltilmisMi = localStorage.getItem(DEPO_ANAHTARI) === '1';
  kabuk.classList.toggle(KABUK_SINIFI, daraltilmisMi);

  document.getElementById('mis-ustcubuk').querySelector('.mis-menu-toggle').addEventListener('click', misMenuyuAcKapa);
}
