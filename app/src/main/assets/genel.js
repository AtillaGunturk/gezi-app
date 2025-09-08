/* ---------- genel.js ---------- */
// Global veriler ve harita
let veriler = [];
let markerlar = [];
const harita = L.map("harita").setView([39.0, 35.0], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(harita);
window.veriler = veriler;
window.markerlar = markerlar;
window.harita = harita;

const ozelIkon = L.icon({
  iconUrl: 'tr2.png',
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  className: 'gezi-marker'
});

// Gösterim
function goster() {
  markerlar.forEach(m => harita.removeLayer(m));
  markerlar = [];
  veriler.forEach((yer, i) => {
    const mk = L.marker(yer.konum, { icon: ozelIkon }).addTo(harita);
    mk.on("click", () => ayrintiGoster(yer, i));
    markerlar.push(mk);
  });
}

// Lightbox / zoom
function toFileURL(yol) {
  if (!yol) return "";
  if (yol.startsWith("file://") || yol.startsWith("content://")) return yol;
  return "file://" + yol;
}

function zoomFoto(src) {

// <--- ekledik
  if (!src) return alert("Foto açılamadı!");
  const safeSrc = src.replace(/"/g, '&quot;').replace(/'/g, "\\'");
  
  if (window.AndroidExport && AndroidExport.openPhoto) {
    AndroidExport.openPhoto(toFileURL(src));
  } else {
    const lb = document.getElementById("lightbox");
    const lbImg = lb.querySelector("img");
    lb.style.display = "flex";
    lbImg.src = src;
    lbImg.style.width = "auto";
    lbImg.style.maxHeight = "80vh";
    lbImg.style.cursor = "zoom-in";
    lbImg.style.objectFit = "contain";
    lbImg.style.transform = "scale(1)";

    let zoomed = false;
    lb.onclick = () => {
      if (!zoomed) {
        lbImg.style.transform = "scale(2)";
        lbImg.style.cursor = "zoom-out";
        zoomed = true;
      } else {
        lb.style.display = "none";
        lbImg.style.transform = "scale(1)";
        zoomed = false;
      }
    };
  }
}
window.zoomFoto = zoomFoto;

// Ayrıntı gösterim
function ayrintiGoster(yer, i) {
  let html = `<h3>${yer.isim}</h3><p>${yer.aciklama}</p><div>`;
  (yer.fotolar ?? []).forEach((f, j) => {
    const src = toFileURL(f.yol);
    const safeSrc = src.replace(/"/g, '&quot;').replace(/'/g, "\\'");
    html += `
      <div style="margin-bottom:6px; display:inline-block;">
        <img src="${src}" alt="${f.alt || ''}" 
             style="width:80px; height:auto; cursor:pointer; margin:4px; object-fit:cover;"
             onclick=" zoomFoto('${src}')">
        <div style="font-size:14px;color:#555">${f.alt || ''}</div>
      </div>`;
  });
  html += `</div>
    <div style="margin-top:10px">
      <button onclick="düzenlemeModu(${i})">🖊️ Düzenle</button>
      <button onclick="markerSil(${i})" style="margin-left:8px;color:red">🗑️ Yer Sil</button>
      <button onclick="fotoEkleBaslat(${i})" style="margin-left:8px">➕ Fotoğraf Ekle</button>
    </div>`;
  document.getElementById("bilgiPaneli").innerHTML = html;
}

// Marker silme
function markerSil(i) {
  if (!window.veriler || !window.veriler[i]) return;
  if (!confirm("Bu yeri silmek istiyor musunuz?")) return;

  // Marker kaldır
  if (window.markerlar && window.markerlar[i]) {
    window.harita.removeLayer(window.markerlar[i]);
    window.markerlar.splice(i, 1);
  }

  // Veri kaldır
  window.veriler.splice(i, 1);

  // Harita görünümünü varsayılana döndür
  if (window.harita) window.harita.setView([39.0, 35.0], 6);

  // Paneli tamamen gizle
  const panel = document.getElementById("bilgiPaneli");
  if (panel) panel.style.display = "none";

}

// Globale aç
window.markerSil = markerSil;
function fotoEkleBaslat(i) { düzenlemeModu(i); }
window.goster = goster;
window.ayrintiGoster = ayrintiGoster;
window.fotoEkleBaslat = fotoEkleBaslat;

