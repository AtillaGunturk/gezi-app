/* ---------- genel.js ---------- */
// Global veriler ve harita
let veriler = [];
let markerlar = [];
const harita = L.map("harita").setView([39.0, 35.0], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(harita);
window.veriler = veriler;
window.markerlar = markerlar;
// global olarak aç
window.harita = harita;
console.log('genel.js: harita oluşturuldu ve window.harita atandı');

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
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lightbox-img");
let zoomed = false;

function toFileURL(yol) {
  if (!yol) return "";
  if (yol.startsWith("file://") || yol.startsWith("content://")) return yol;
  return "file://" + yol;
}

function zoomFoto(src) {
  if (!src) return alert("Fotoğraf açılamadı!");

  if (window.AndroidExport && AndroidExport.openPhoto) {
    // Android: fotoğrafı native olarak aç
    AndroidExport.openPhoto(src);
  } else {
    // Web: lightbox ile aç
    const lb = document.getElementById("lightbox");
    const lbImg = lb.querySelector("img");
    lb.style.display = "flex";
    lbImg.src = src;
    lbImg.style.transform = "scale(1)";
    lbImg.style.cursor = "zoom-in";
    let zoomed = false;

    lb.onclick = () => {
      if (!zoomed) {
        lbImg.style.transform = "scale(2)";
        lbImg.style.cursor = "zoom-out";
        zoomed = true;
      } else {
        lb.style.display = "none";
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
      <div style="margin-bottom:6px">
        <img src="${src}" alt="${f.alt || ""}" 
             style="max-width:80px;max-height:80px;cursor:pointer;margin:4px"
             onclick="zoomFoto('${safeSrc}')">
        <div style="font-size:14px;color:#555">${f.alt || ""}</div>
        <button onclick="fotoSil(${i},${j})" style="color:red;margin-left:4px">🗑️</button>
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

  // Marker'ı haritadan kaldır
  if (window.markerlar && window.markerlar[i]) {
    window.harita.removeLayer(window.markerlar[i]);
    window.markerlar.splice(i, 1);
  }

  // Veriyi diziden kaldır
  window.veriler.splice(i, 1);

  // Harita üzerindeki markerları yeniden göster
  if (window.goster) window.goster();

  // Bilgi panelini temizle
  const panel = document.getElementById("bilgiPaneli");
  if (panel) panel.textContent = "Yer silindi.";

  // Haritayı varsayılan konuma al
  if (window.harita) window.harita.setView([39.0, 35.0], 6);
}

// Globale aç
window.markerSil = markerSil;
alert(window.veriler);
alert(window.markerlar);
// Fotoğraf ekleme başlat
function fotoEkleBaslat(i) { düzenlemeModu(i); }
// Örnek
window.goster = goster;
window.ayrintiGoster = ayrintiGoster;
window.markerSil = markerSil;
window.fotoEkleBaslat = fotoEkleBaslat;
window.zoomFoto = zoomFoto;
