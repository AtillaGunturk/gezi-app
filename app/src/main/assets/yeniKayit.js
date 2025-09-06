	/* -----------------------------------------------------------
   yeniKayit.js – Yeni Yer Ekleme ve Fotoğraf Yönetimi
   ✅ AndroidExport entegrasyonu
   ✅ Lightbox ve küçük önizleme
   ✅ Marker ekleme
----------------------------------------------------------- */


// Fotoğraf alanı
const fotoAlani = document.getElementById("fotoAlani");

// Global callback Android'ten fotoğraf alındığında
window.onAndroidFilePicked = (uid, path, name) => {
  const div = document.createElement("div");
  
  const img = document.createElement("img");
  img.src = path;
  img.className = "thumb";
  img.title = name;
  img.onclick = () => zoomFoto(path);

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Açıklama";
  input.style = "width:45%;margin-left:8px";

  const silBtn = document.createElement("button");
  silBtn.textContent = "🗑️";
  silBtn.type = "button";
  silBtn.onclick = () => div.remove();

  div.appendChild(img);
  div.appendChild(input);
  div.appendChild(silBtn);

  fotoAlani.appendChild(div);
};

// Fotoğraf ekleme butonuna bağlanan fonksiyon
function yeniFotoSatiriEkle() {
  if (window.AndroidExport && AndroidExport.pickPhoto) {
    const uid = 'uid_' + Date.now();
    AndroidExport.pickPhoto(uid);
  } else {
    // Tarayıcı fallback
    const div = document.createElement("div");
    div.innerHTML = `
      <input type="file" accept="image/*" style="width:45%" onchange="this.nextElementSibling.src=window.URL.createObjectURL(this.files[0])">
      <input type="text" placeholder="Açıklama" style="width:45%;margin-left:8px">
      <button type="button" onclick="this.parentNode.remove()">🗑️</button>`;
    fotoAlani.appendChild(div);
  }
}

// Yeni yer kaydetme
async function yeniYerKaydet() {
  // Haritadaki tüm markerları temizleme kısmını istersen bırakabilirsin
  window.markerlar?.forEach(m => window.harita.removeLayer(m));
  window.markerlar = [];
  aktifMarker = null;

  // ❌ Bunu kaldır: window.veriler = [];

  const g = id => document.getElementById(id).value.trim();
  const isim = g("isim"), aciklama = g("aciklama");
  const enlem = parseFloat(g("enlem")), boylam = parseFloat(g("boylam"));

  if (!isim || !aciklama || isNaN(enlem) || isNaN(boylam)) {
    return;
  }

  const fotolar = [];
  const satırlar = fotoAlani.querySelectorAll("div");
  satırlar.forEach(div => {
    const img = div.querySelector("img");
    const alt = div.querySelector("input[type=text]").value || "Fotoğraf";
    if (img?.src) fotolar.push({ yol: img.src, alt });
  });

  const yeniYer = { isim, aciklama, konum: [enlem, boylam], fotolar };

  if (!window.veriler) window.veriler = [];
  window.veriler.push(yeniYer);

  
  // Marker ekleme
  if (window.harita) {
    const ozelIkon = L.icon({
      iconUrl: 'tr2.png',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      className: 'gezi-marker'
    });

    const mk = L.marker([enlem, boylam], { icon: ozelIkon }).addTo(window.harita);
    mk.on("click", () => {
      if (window.ayrintiGoster) window.ayrintiGoster(yeniYer, window.veriler.length - 1);
    });

    if (!window.markerlar) window.markerlar = [];
    window.markerlar.push(mk);
  }

  // Form temizleme
  document.getElementById("yerForm").reset();
  fotoAlani.innerHTML = "";

  // Harita güncelleme
  if (window.goster) window.goster();
  if (window.harita) window.harita.flyTo([enlem, boylam], 9);
}

// Düzenleme modu
// Global aktif marker
let aktifMarker = null;

function düzenlemeModu(i) {
  const y = window.veriler[i];
  if (!y) return;

  const f = id => document.getElementById(id);
  f("isim").value = y.isim ?? "";
  f("aciklama").value = y.aciklama ?? "";
  f("enlem").value = y.konum?.[0] ?? "";
  f("boylam").value = y.konum?.[1] ?? "";

  // Fotoğraf alanını temizle ve mevcut fotoğrafları ekle
  const fotoAlani = f("fotoAlani");
  fotoAlani.innerHTML = "";

  (y.fotolar ?? []).forEach((ft, j) => {
    const div = document.createElement("div");
    const img = document.createElement("img");
    img.src = ft.yol;
    img.className = "thumb";
    const input = document.createElement("input");
    input.type = "text";
    input.value = ft.alt || "";
    input.placeholder = "Açıklama";
    input.style = "width: 45%; margin-left: 8px;";
    input.oninput = () => ft.alt = input.value;
    const silBtn = document.createElement("button");
    silBtn.textContent = "🗑️";
    silBtn.onclick = () => { y.fotolar.splice(j, 1); div.remove(); };
    div.appendChild(img);
    div.appendChild(input);
    div.appendChild(silBtn);
    fotoAlani.appendChild(div);
  });

  f("yerForm").dataset.editIndex = i;
  f("formBaslik").textContent = "Düzenle";

  // Eski marker varsa haritadan kaldır
  if (aktifMarker) {
    window.harita.removeLayer(aktifMarker);
    const idx = window.markerlar.indexOf(aktifMarker);
    if (idx !== -1) window.markerlar.splice(idx, 1);
    aktifMarker = null;
  }

  // Yeni marker ekle ve aktif marker olarak ata
  const enlem = parseFloat(y.konum[0]);
  const boylam = parseFloat(y.konum[1]);
  const ozelIkon = L.icon({
    iconUrl: 'tr2.png',
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    className: 'gezi-marker'
  });

  const mk = L.marker([enlem, boylam], { icon: ozelIkon }).addTo(window.harita);
  aktifMarker = mk;
  window.markerlar.push(mk);

  mk.on("click", () => {
    aktifMarker = mk;        // Tıklanan marker aktif marker olur
    ayrintiGoster(y, i);
  });

  // Haritayı yeni konuma taşı
  window.harita.flyTo([enlem, boylam], 9);
}

window.düzenlemeModu = düzenlemeModu;
// Globale aç
window.yeniYerKaydet = yeniYerKaydet;
window.yeniFotoSatiriEkle = yeniFotoSatiriEkle;
window.düzenlemeModu = düzenlemeModu;
