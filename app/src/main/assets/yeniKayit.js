/* -----------------------------------------------------------
   yeniKayit.js – Yeni Yer Ekleme ve Fotoğraf Yönetimi
   ✅ AndroidExport entegrasyonu
   ✅ Lightbox ve küçük önizleme
   ✅ Marker ekleme
----------------------------------------------------------- */
alert('yeniKayit.js yüklendi');

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
  const g = id => document.getElementById(id).value.trim();
  const isim = g("isim"), aciklama = g("aciklama");
  const enlem = parseFloat(g("enlem")), boylam = parseFloat(g("boylam"));

  if (!isim || !aciklama || isNaN(enlem) || isNaN(boylam)) {
    alert("Alanlar boş veya geçersiz!");
    console.log({ isim, aciklama, enlem, boylam });
    return;
  }

  const fotolar = [];
  const satırlar = fotoAlani.querySelectorAll("div");
  satırlar.forEach(div => {
    const img = div.querySelector("img");
    const alt = div.querySelector("input[type=text]").value || "Fotoğraf";
    if (img?.src) fotolar.push({ yol: img.src, alt });
  });

  // Yeni veri objesi
  const yeniYer = { isim, aciklama, konum: [enlem, boylam], fotolar };

  // Global veriler dizisine ekleme
  if (!window.veriler) window.veriler = [];
  window.veriler.push(yeniYer);
  console.log("Yeni veri kaydedildi:", yeniYer);
  console.log("Tüm veriler:", window.veriler);

  // Marker ekleme
  if (window.harita) {
    const ozelIkon = L.icon({
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/RedDot.svg',
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
function düzenlemeModu(i) {
  const y = window.veriler[i];
  if (!y) return;
  const f = id => document.getElementById(id);
  f("isim").value = y.isim ?? "";
  f("aciklama").value = y.aciklama ?? "";
  f("enlem").value = y.konum?.[0] ?? "";
  f("boylam").value = y.konum?.[1] ?? "";
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
    div.appendChild(img); div.appendChild(input); div.appendChild(silBtn);
    fotoAlani.appendChild(div);
  });

  f("yerForm").dataset.editIndex = i;
  f("formBaslik").textContent = "Düzenle";
  if (window.harita) window.harita.flyTo([y.konum?.[0], y.konum?.[1]], 9);
}

// Globale aç
window.yeniYerKaydet = yeniYerKaydet;
window.yeniFotoSatiriEkle = yeniFotoSatiriEkle;
window.düzenlemeModu = düzenlemeModu;
