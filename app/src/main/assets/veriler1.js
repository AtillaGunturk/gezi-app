/* -----------------------------------------------------------
   veriler1.js – Gezdiğim Yerler (IndexedDB kalıcı veritabanı)
   ✅ Güncellemeler:
   1. Ayrıntı gösterimde thumbnail canvas ile oluşturulacak
   2. JSON’a sadece gerçek yol kaydedilecek (base64 yok)
   3. Fotoğraf tıklanınca Android’de gerçek yol açılacak
----------------------------------------------------------- */

const harita = L.map("harita").setView([39.0, 35.0], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(harita);

let veriler = [];
let markerlar = [];
let db;

function dbAc() {
  return new Promise((ok, err) => {
    const iste = indexedDB.open("geziHaritamDB", 1);
    iste.onupgradeneeded = e => {
      const dbase = e.target.result;
      if (!dbase.objectStoreNames.contains("yerler")) {
        dbase.createObjectStore("yerler", { keyPath: "id", autoIncrement: true });
      }
    };
    iste.onsuccess = e => { db = e.target.result; ok(); };
    iste.onerror = () => err(iste.error);
  });
}

function dbHepsiniGetir() {
  return new Promise((ok, err) => {
    const tx = db.transaction("yerler", "readonly");
    const store = tx.objectStore("yerler");
    const req = store.getAll();
    req.onsuccess = () => ok(req.result);
    req.onerror = () => err(req.error);
  });
}

function dbKaydet() {
  return new Promise((ok, err) => {
    const tx = db.transaction("yerler", "readwrite");
    const store = tx.objectStore("yerler");
    store.clear();
    veriler.forEach(item => store.put(item));
    tx.oncomplete = () => ok();
    tx.onerror = () => err(tx.error);
  });
}

const ozelIkon = L.icon({
  iconUrl: 'tr2.png',
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  className: 'gezi-marker'
});

function goster() {
  markerlar.forEach(m => harita.removeLayer(m));
  markerlar = [];

  veriler.forEach((yer, i) => {
    const mk = L.marker(yer.konum, { icon: ozelIkon }).addTo(harita);
    mk.on("click", () => ayrintiGoster(yer, i));
    markerlar.push(mk);
  });
}

// (İstersen globalde tut) Gerçek yolu görüntülemeye uygun URL'e çevir
function toFileURL(yol) {
  if (!yol) return "";
  if (yol.startsWith("file://") || yol.startsWith("content://")) return yol;
  return "file://" + yol;
}

// Lightbox elemanları
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lightbox-img"); // sen HTML’de <img id="lightbox-img"> koymalısın
let zoomed = false;

// Fotoğraf büyütme işlevi
function zoomFoto(src) {
  if (window.AndroidExport && AndroidExport.openPhoto) {
    AndroidExport.openPhoto(src); // Android’de gerçek yolu aç
  } else {
    lb.style.display = "flex";
    lbImg.src = src;
    lbImg.style.transform = "scale(1)";
    lbImg.style.cursor = "zoom-in";
    zoomed = false;
  }
}

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


function ayrintiGoster(yer, i) {
  let html = `<h3>${yer.isim}</h3><p>${yer.aciklama}</p><div>`;

  (yer.fotolar ?? []).forEach((f, j) => {
    const src = toFileURL(f.yol);                // 🔹 JSON’daki gerçek yol
    const safeSrc = src.replace(/"/g, '&quot;').replace(/'/g, "\\'");
    html += `
      <div style="margin-bottom:6px">
        <img src="${src}"
             alt="${f.alt || ""}"
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

};
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

async function markerSil(i) {
  if (!confirm("Bu yeri silmek istiyor musunuz?")) return;
  harita.removeLayer(markerlar[i]);
  markerlar.splice(i, 1);
  veriler.splice(i, 1);
  await dbKaydet();
  goster();
  document.getElementById("bilgiPaneli").textContent = "Silindi.";
  harita.setView([39.0, 35.0], 6);
}

function fotoEkleBaslat(i) { düzenlemeModu(i); }

function düzenlemeModu(i) {
  const y = veriler[i];
  if (!y) return;
  const f = id => document.getElementById(id);
  f("isim").value = y.isim ?? "";
  f("aciklama").value = y.aciklama ?? "";
  f("enlem").value = y.konum?.[0] ?? "";
  f("boylam").value = y.konum?.[1] ?? "";
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
    div.appendChild(img); div.appendChild(input); div.appendChild(silBtn);
    fotoAlani.appendChild(div);
  });

  f("yerForm").dataset.editIndex = i;
  f("formBaslik").textContent = "Düzenle";
  harita.flyTo([y.konum?.[0], y.konum?.[1]], 9);
}
window.düzenlemeModu = düzenlemeModu;

function yeniFotoSatiriEkle() {
  const alan = document.getElementById("fotoAlani");
  const div = document.createElement("div");
  div.innerHTML = `
    <input type="file" accept="image/*" style="width:45%">
    <input type="text" placeholder="Açıklama" style="width:45%;margin-left:8px">
    <button type="button" onclick="this.parentNode.remove()">🗑️</button>`;
  alan.appendChild(div);
}

async function yeniYerKaydet() {
  const g = id => document.getElementById(id).value.trim();
  const isim = g("isim"), aciklama = g("aciklama");
  const enlem = parseFloat(g("enlem")), boylam = parseFloat(g("boylam"));
  if (!isim || !aciklama || isNaN(enlem) || isNaN(boylam)) return alert("Alanlar boş!");

  const fotolar = [];
  const satırlar = document.querySelectorAll("#fotoAlani > div");
  let bekleyen = satırlar.length;
  if (bekleyen === 0) finish();

  satırlar.forEach(div => {
    const file = div.querySelector('input[type=file]').files[0];
    const alt = div.querySelector('input[type=text]').value || "Fotoğraf";
    if (!file) { if (--bekleyen === 0) finish(); return; }
    // JSON'a gerçek yol kaydediliyor
    fotolar.push({ yol: file.path, alt });
    if (--bekleyen === 0) finish();
  });

  async function finish() {
    const idx = document.getElementById("yerForm").dataset.editIndex;
    if (idx !== undefined) {
      Object.assign(veriler[idx], { isim, aciklama, konum:[enlem,boylam] });
      veriler[idx].fotolar.push(...fotolar);
      markerlar[idx].setLatLng([enlem, boylam]);
    } else {
      veriler.push({ isim, aciklama, konum:[enlem,boylam], fotolar });
    }
    await dbKaydet();
    document.getElementById("yerForm").reset();
    document.getElementById("fotoAlani").innerHTML = "";
    delete document.getElementById("yerForm").dataset.editIndex;
    document.getElementById("formBaslik").textContent = "Yeni Yer Ekle";
    goster();
    harita.flyTo([enlem, boylam], 9);
  }
}

const ilSelect = document.getElementById("ilSec");
iller.forEach((il, i) => {
  const op = document.createElement("option");
  op.value = i; op.textContent = il.isim;
  ilSelect.appendChild(op);
});
ilSelect.addEventListener("change", () => {
  const v = ilSelect.value;
  if (v==="") return;
  harita.flyTo(iller[v].koordinat, 8);
});

(async () => {
  await dbAc();
  veriler = await dbHepsiniGetir();
  goster();
})();

function verileriDisariAktar() {
  if (veriler.length === 0) { alert("Henüz kaydedilmiş yer yok!"); return; }
  const json = JSON.stringify(veriler, null, 2);
  if (window.AndroidExport && AndroidExport.exportVeri) {
    AndroidExport.exportVeri(json);
  } else {
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "gezi-verileri.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a)
    URL.revokeObjectURL(url);
    alert("✅ Veriler başarıyla dışa aktarıldı!");
  }
}

async function verileriIceAktar(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const yeniV = JSON.parse(text);
    if (!Array.isArray(yeniV)) throw "Beklenmeyen format";
    yeniV.forEach(y => delete y.id);
    veriler.push(...yeniV);
    await dbKaydet();
    goster();
    alert("Veriler içe aktarıldı!");
  } catch (e) {
    alert("Dosya okunamadı: " + e);
  }
}

