/* -----------------------------------------------------------
   yeniKayit.js – Yeni Yer Ekleme ve Fotoğraf Yönetimi
   ✅ AndroidExport entegrasyonu
   ✅ Fotoğraflar sıralı ve yer bazlı
   ✅ Düzenleme modunda doğru foto yükleme
   ✅ Marker yönetimi (yeniden çizme + silme)
----------------------------------------------------------- */

const fotoAlani = document.getElementById("fotoAlani");
let aktifMarker = null;
if (!window.markerlar) window.markerlar = [];
if (!window.veriler) window.veriler = [];

// -----------------------------------------------------------
// Fotoğraf seçimi (Android veya tarayıcı)
window.onAndroidFilePicked = (uid, fileUri, relativePath) => {
  const div = document.createElement("div");

  const img = document.createElement("img");
  img.src = fileUri;
  img.className = "thumb";
  img.dataset.rel = relativePath || fileUri; 
  img.title = relativePath || fileUri;
  img.onclick = () => zoomFoto(fileUri);

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
    const div = document.createElement("div");
    div.innerHTML = `
      <input type="file" accept="image/*" style="width:45%" onchange="this.nextElementSibling.src=window.URL.createObjectURL(event.target.files[0])">
      <input type="text" placeholder="Açıklama" style="width:45%;margin-left:8px">
      <button type="button" onclick="this.parentNode.remove()">🗑️</button>`;
    fotoAlani.appendChild(div);
  }
}

// -----------------------------------------------------------
// Marker yönetimi
function tumMarkerlariYenile() {
  window.markerlar.forEach(m => window.harita.removeLayer(m));
  window.markerlar = [];
  window.veriler.forEach((yer, i) => {
    if (!yer.konum) return;
    const [enlem, boylam] = yer.konum.map(Number);
    const ozelIkon = L.icon({ iconUrl: "tr2.png", iconSize: [24, 32], iconAnchor: [12, 32], className: "gezi-marker" });
    const mk = L.marker([enlem, boylam], { icon: ozelIkon }).addTo(window.harita);
    mk.on("click", () => { aktifMarker = mk; if (window.ayrintiGoster) window.ayrintiGoster(yer, i); });
    window.markerlar.push(mk);
  });
}

function markerSil(i) {
  if (!window.veriler || !window.veriler[i]) return;
  if (!confirm("Bu yeri silmek istiyor musunuz?")) return;
  window.veriler.splice(i, 1);
  tumMarkerlariYenile();
  yeniKayitModu();
  const panel = document.getElementById("bilgiPaneli");
  if (panel) panel.innerHTML = "";
  if (window.harita) window.harita.setView([39.0, 35.0], 6);
}

// -----------------------------------------------------------
// Yeni kayıt / düzenleme kaydetme
async function yeniYerKaydet() {
  const g = id => document.getElementById(id).value.trim();
  const isim = g("isim"), aciklama = g("aciklama");
  const enlem = parseFloat(g("enlem")), boylam = parseFloat(g("boylam"));
  if (!isim || !aciklama || isNaN(enlem) || isNaN(boylam)) return;

  const fotolar = [];
  fotoAlani.querySelectorAll("div").forEach(div => {
    const img = div.querySelector("img");
    const alt = div.querySelector("input[type=text]").value || "Fotoğraf";
    const rel = img?.dataset?.rel || img?.src || "";
    if (rel) fotolar.push({ yol: rel, alt });
  });

  const yerForm = document.getElementById("yerForm");
  const editIndex = yerForm.dataset.editIndex;

  if (editIndex !== undefined) {
    const y = window.veriler[editIndex];
    y.isim = isim; y.aciklama = aciklama; y.konum = [enlem, boylam]; y.fotolar = fotolar;
  } else {
    const yerIndex = window.veriler.length + 1;
    const yeniYer = { isim, aciklama, konum: [enlem, boylam], fotolar };
    window.veriler.push(yeniYer);
  }

  tumMarkerlariYenile();
  yeniKayitModu();
  if (window.harita) window.harita.flyTo([enlem, boylam], 9);
}

// -----------------------------------------------------------
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

    let fotoYolu = ft.yol || "";
    if (!fotoYolu.startsWith("file://") && !fotoYolu.startsWith("http")) {
      fotoYolu = "file:///storage/emulated/0/GeziApp/fotograflar/" + fotoYolu;
    }
    img.src = fotoYolu;
    img.dataset.rel = ft.yol;
    img.className = "thumb";
    img.title = ft.alt || "Fotoğraf";
    img.onclick = () => zoomFoto(fotoYolu);

    const input = document.createElement("input");
    input.type = "text"; input.value = ft.alt || "";
    input.placeholder = "Açıklama"; input.style = "width:45%;margin-left:8px";
    input.oninput = () => (ft.alt = input.value);

    const silBtn = document.createElement("button");
    silBtn.textContent = "🗑️"; silBtn.type = "button";
    silBtn.onclick = () => { y.fotolar.splice(j,1); div.remove(); };

    div.appendChild(img); div.appendChild(input); div.appendChild(silBtn);
    fotoAlani.appendChild(div);
  });

  f("yerForm").dataset.editIndex = i;
  f("formBaslik").textContent = "Düzenle";
  tumMarkerlariYenile();
  if (y.konum) window.harita.flyTo([parseFloat(y.konum[0]), parseFloat(y.konum[1])], 9);
}

// -----------------------------------------------------------
// Yeni kayıt modu
function yeniKayitModu() {
  document.getElementById("yerForm").reset();
  fotoAlani.innerHTML = "";
  document.getElementById("formBaslik").textContent = "Yeni Kayıt";
  delete document.getElementById("yerForm").dataset.editIndex;
}

// -----------------------------------------------------------
// Globale aç
window.yeniFotoSatiriEkle = yeniFotoSatiriEkle;
window.yeniYerKaydet = yeniYerKaydet;
window.düzenlemeModu = düzenlemeModu;
window.markerSil = markerSil;
window.yeniKayitModu = yeniKayitModu;
