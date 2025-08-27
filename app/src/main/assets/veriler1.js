let veriler = [];
let seciliIndex = null;

// HTML özel karakterlerinden kaçış
function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(text) {
  if (!text) return "";
  return text.replace(/'/g, "\\'");
}

// --- Detay panelini göster ---
function ayrintiGoster(yer, i) {
  let html = `<h3>${escapeHtml(yer.isim)}</h3><p>${escapeHtml(yer.aciklama)}</p><div>`;

  (yer.fotolar || []).forEach((f, j) => {
    const src = f.uri || "";
    const alt = f.alt || "";
    html += `
      <div style="display:inline-block; margin:5px; text-align:center">
        <img src="${src}" class="thumb" style="width:100px; height:auto; cursor:pointer"
             onclick="showFullImage('${src}', '${escapeAttr(alt)}')"
             alt="${escapeHtml(alt)}">
        <div style="font-size:12px; margin-top:4px">${escapeHtml(alt)}</div>
        <button onclick="fotoSil(${i},${j})" style="color:red;margin-top:4px">🗑️</button>
      </div>`;
  });

  html += `</div>
    <div style="margin-top:10px">
      <button onclick="düzenlemeModu(${i})">🖊️ Düzenle</button>
      <button onclick="markerSil(${i})" style="margin-left:8px;color:red">🗑️ Yer Sil</button>
      <button onclick="fotoEkleBaslat(${i})" style="margin-left:8px">➕ Fotoğraf Ekle</button>
    </div>`;

  document.getElementById("bilgiPaneli").innerHTML = html;
  seciliIndex = i;
}

// --- Marker düzenleme ---
function düzenlemeModu(i) {
  const yer = veriler[i];
  const yeniIsim = prompt("Yeni isim:", yer.isim);
  const yeniAciklama = prompt("Yeni açıklama:", yer.aciklama);
  if (yeniIsim !== null) yer.isim = yeniIsim;
  if (yeniAciklama !== null) yer.aciklama = yeniAciklama;
  ayrintiGoster(yer, i);
  kaydet();
}

// --- Fotoğraf ekleme (Android veya input) ---
function fotoEkleBaslat(i) {
  seciliIndex = i;
  if (window.Android) {
    Android.fotoSec(); // Android tarafında foto seçme tetiklenecek
  } else {
    document.getElementById("fileInput").click();
  }
}

function yeniFotoSatiriEkle(uri, alt) {
  if (seciliIndex === null) return;
  const yer = veriler[seciliIndex];
  if (!yer.fotolar) yer.fotolar = [];
  yer.fotolar.push({ uri: uri, alt: alt || "" });
  ayrintiGoster(yer, seciliIndex);
  kaydet();
}

function fotoSil(i, j) {
  if (!veriler[i].fotolar) return;
  veriler[i].fotolar.splice(j, 1);
  ayrintiGoster(veriler[i], i);
  kaydet();
}

// --- Marker silme ---
function markerSil(i) {
  veriler.splice(i, 1);
  document.getElementById("bilgiPaneli").innerHTML = "";
  kaydet();
}

// --- Veri kaydetme ---
function kaydet() {
  localStorage.setItem("veriler", JSON.stringify(veriler));
}

// --- Veri yükleme ---
function yukle() {
  const kayitli = localStorage.getItem("veriler");
  if (kayitli) veriler = JSON.parse(kayitli);
}

// Sayfa açılınca yükle
window.onload = yukle;
