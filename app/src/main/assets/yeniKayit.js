/* -----------------------------------------------------------
   yeniKayit.js – Yeni Yer Ekleme ve Fotoğraf Yönetimi
   ✅ AndroidExport entegrasyonu
   ✅ Lightbox ve küçük önizleme
   ✅ Marker yönetimi (yeniden çizme + silme sonrası reset)
----------------------------------------------------------- */

// Fotoğraf alanı
const fotoAlani = document.getElementById("fotoAlani");

// Global aktif marker
let aktifMarker = null;
if (!window.markerlar) window.markerlar = [];
if (!window.veriler) window.veriler = [];

// -----------------------------------------------------------
// Fotoğraf seçimi (Android veya tarayıcı)
// -----------------------------------------------------------

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

function yeniFotoSatiriEkle() {
  if (window.AndroidExport && AndroidExport.pickPhoto) {
    const uid = "uid_" + Date.now();
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

// -----------------------------------------------------------
// Marker yönetimi
// -----------------------------------------------------------

function tumMarkerlariYenile() {
  // Tüm markerları kaldır
  window.markerlar.forEach(m => window.harita.removeLayer(m));
  window.markerlar = [];

  // Verilerden yeniden ekle
  window.veriler.forEach((yer, i) => {
    if (!yer.konum) return;
    const [enlem, boylam] = yer.konum.map(Number);

    const ozelIkon = L.icon({
      iconUrl: "tr2.png",
      iconSize: [24, 32],
      iconAnchor: [12, 32],
      className: "gezi-marker"
    });

    const mk = L.marker([enlem, boylam], { icon: ozelIkon }).addTo(window.harita);
    mk.on("click", () => {
      aktifMarker = mk;
      if (window.ayrintiGoster) window.ayrintiGoster(yer, i);
    });

    window.markerlar.push(mk);
  });
}



// -----------------------------------------------------------
// Yeni kayıt / düzenleme kaydetme
// -----------------------------------------------------------

async function yeniYerKaydet() {
  const g = id => document.getElementById(id).value.trim();
  const isim = g("isim"), aciklama = g("aciklama");
  const enlem = parseFloat(g("enlem")), boylam = parseFloat(g("boylam"));

  if (!isim || !aciklama || isNaN(enlem) || isNaN(boylam)) {
    return;
  }

  const fotolar = [];
  fotoAlani.querySelectorAll("div").forEach(div => {
    const img = div.querySelector("img");
    const alt = div.querySelector("input[type=text]").value || "Fotoğraf";
    if (img?.src) fotolar.push({ yol: img.src, alt });
  });

  const yerForm = document.getElementById("yerForm");
  const editIndex = yerForm.dataset.editIndex;

  if (editIndex !== undefined) {
    // 📌 Düzenleme modunda: mevcut kaydı güncelle
    const y = window.veriler[editIndex];
    y.isim = isim;
    y.aciklama = aciklama;
    y.konum = [enlem, boylam];
    y.fotolar = fotolar;
  } else {
    // 📌 Yeni kayıt ekle
    const yeniYer = { isim, aciklama, konum: [enlem, boylam], fotolar };
    window.veriler.push(yeniYer);
  }

  // Markerları güncelle
  tumMarkerlariYenile();

  // Form reset + yeni kayıt moduna dön
  yeniKayitModu();

  // Haritayı konuma taşı
  if (window.harita) window.harita.flyTo([enlem, boylam], 9);
}

// -----------------------------------------------------------
// Düzenleme modu
// -----------------------------------------------------------

function düzenlemeModu(i) {
  const y = window.veriler[i];
  if (!y) return;

  const f = id => document.getElementById(id);
  f("isim").value = y.isim ?? "";
  f("aciklama").value = y.aciklama ?? "";
  f("enlem").value = y.konum?.[0] ?? "";
  f("boylam").value = y.konum?.[1] ?? "";

  // Fotoğrafları doldur
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
    input.oninput = () => (ft.alt = input.value);

    const silBtn = document.createElement("button");
    silBtn.textContent = "🗑️";
    silBtn.onclick = () => {
      y.fotolar.splice(j, 1);
      div.remove();
    };

    div.appendChild(img);
    div.appendChild(input);
    div.appendChild(silBtn);
    fotoAlani.appendChild(div);
  });

  f("yerForm").dataset.editIndex = i;
  f("formBaslik").textContent = "Düzenle";

  // Markerları yeniden çiz
  tumMarkerlariYenile();

  // Haritayı yeni konuma götür
  if (y.konum) {
    window.harita.flyTo([parseFloat(y.konum[0]), parseFloat(y.konum[1])], 9);
  }
}

// -----------------------------------------------------------
// Yeni kayıt modu (form sıfırlama)
// -----------------------------------------------------------

function yeniKayitModu() {
  document.getElementById("yerForm").reset();
  fotoAlani.innerHTML = "";
  document.getElementById("formBaslik").textContent = "Yeni Kayıt";
  delete document.getElementById("yerForm").dataset.editIndex;
}

// -----------------------------------------------------------
// Globale aç
// -----------------------------------------------------------
window.yeniFotoSatiriEkle = yeniFotoSatiriEkle;
window.yeniYerKaydet = yeniYerKaydet;
window.düzenlemeModu = düzenlemeModu;
window.markerSil = markerSil;
window.yeniKayitModu = yeniKayitModu;
