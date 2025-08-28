/* -----------------------------------------------------------

veriler1.js  –  Gezdiğim Yerler  (IndexedDB + Android köprüsü)

----------------------------------------------------------- */

/* ---------- LEAFLET HARİTASI -------------------------------- */

const harita = L.map("harita").setView([39.0, 35.0], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(harita);

/* ---------- GLOBAL DURUM ------------------------------------ */

let veriler   = [];    // tüm yerler

let markerlar = [];    // leaflet marker listesi

let db;                // IndexedDB bağlantısı

/* ---------- IndexedDB AÇ / YÜKLE ---------------------------- */

(async () => {

await dbAc(); // sadece db açılıyor, veri alınmıyor

veriler = []; // tamamen boş başlat

})();

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

iste.onerror   = () => err(iste.error);

});

}

function dbHepsiniGetir() {

return new Promise((ok, err) => {

const tx    = db.transaction("yerler", "readonly");

const store = tx.objectStore("yerler");

const req   = store.getAll();

req.onsuccess = () => ok(req.result);

req.onerror   = () => err(req.error);

});

}

function dbKaydet() {

return new Promise((ok, err) => {

const tx    = db.transaction("yerler", "readwrite");

const store = tx.objectStore("yerler");

store.clear();

veriler.forEach(item => store.put(item));

tx.oncomplete = () => ok();

tx.onerror    = () => err(tx.error);

});

}

const ozelIkon = L.icon({

iconUrl: 'tr2.png',

iconSize:     [24, 32],

iconAnchor:   [12, 32],

className:    'gezi-marker'

});

/* ---------- MARKER GÜNCELLE --------------------------------- */

function goster() {

markerlar.forEach(m => harita.removeLayer(m));

markerlar = [];

veriler.forEach((yer, i) => {

const mk = L.marker(yer.konum, { icon: ozelIkon }).addTo(harita);

mk.on("click", () => ayrintiGoster(yer, i));

markerlar.push(mk);

});

}

/* ---------- DETAY PANELİ ------------------------------------ */

function ayrintiGoster(yer, i) {

let html = `
  <h3>${yer.isim}</h3>
  <p>${yer.aciklama}</p>
  <div>
`;

(yer.fotolar || []).forEach((f, j) => {

const src = f.uri || ""; 

const alt = f.alt || "";

html += `
</div>
<div style="margin-top:10px">
  <button onclick="düzenlemeModu(${i})">🖊️ Düzenle</button>
  <button onclick="markerSil(${i})" style="margin-left:8px;color:red">🗑️ Yer Sil</button>
  <button onclick="fotoEkleBaslat(${i})" style="margin-left:8px">➕ Fotoğraf Ekle</button>
</div>`;
});


document.getElementById("bilgiPaneli").innerHTML = html;

}

/* ---------- İL SEÇ AÇILIR MENÜSÜ ---------------------------- */

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

/* ---------- FOTOĞRAF ZOOM ----------------------------------- */

function zoomFoto(uri) {

const lb = document.getElementById("lightbox");

if (window.AndroidExport && AndroidExport.openPhoto && uri) {

AndroidExport.openPhoto(uri);

return;

}

lb.style.display = "flex";

lb.querySelector("img").src = uri || "";

}

window.zoomFoto = zoomFoto;

/* ---------- FOTOĞRAF SİL ------------------------------------ */

async function fotoSil(yerIdx, fotoIdx) {

if (!confirm("Bu fotoğrafı silmek istiyor musunuz?")) return;

veriler[yerIdx].fotolar.splice(fotoIdx, 1);

await dbKaydet();

ayrintiGoster(veriler[yerIdx], yerIdx);

}

/* ---------- YER SİL ----------------------------------------- */

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

/* ---------- FOTOĞRAF EKLE (paneli göster) ------------------- */

function fotoEkleBaslat(i) {

düzenlemeModu(i);

}

/* ---------- DÜZENLEME MODU --------------------------------- */

function düzenlemeModu(i) {

const y = veriler[i];

if (!y) return;

const f = id => document.getElementById(id);

if (!f("isim")) return;

f("isim").value      = y.isim != null ? y.isim : "";
f("aciklama").value  = y.aciklama != null ? y.aciklama : "";
f("enlem").value     = y.konum && y.konum[0] ? y.konum[0] : "";
f("boylam").value    = y.konum && y.konum[1] ? y.konum[1] : "";

const fotoAlani = f("fotoAlani");

fotoAlani.innerHTML = "";

f("yerForm").dataset.editIndex = i;

f("formBaslik").textContent = "Düzenle";

harita.flyTo([y.konum?.[0], y.konum?.[1]], 9);

}

window.düzenlemeModu = düzenlemeModu;

/* ---------- FOTO SATIRI BAŞLANGIÇ --------------------------- */

let __pendingRow = null;

function yeniFotoSatiriEkle() {

const alan = document.getElementById("fotoAlani");

const div  = document.createElement("div");

const isAndroid = !!(window.AndroidExport && AndroidExport.pickPhoto);

if (isAndroid) {

div.innerHTML = `

  <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">

    <button type="button" class="btn-sec">📷 Fotoğraf Seç</button>

    <span class="dosya-adi" style="flex:1;color:#333;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>

  </div>

  <input type="text" placeholder="Açıklama" style="width:60%;margin-right:8px">

  <button type="button" class="btn-sil">🗑️</button>

`;



const btnSec   = div.querySelector(".btn-sec");

const dosyaAdi = div.querySelector(".dosya-adi");

const btnSil   = div.querySelector(".btn-sil");



btnSec.addEventListener("click", () => {

  __pendingRow = div;

  try { AndroidExport.pickPhoto(""); } catch(e) { console.warn(e); }

});

btnSil.addEventListener("click", () => div.remove());



// Android tarafından seçilen fotoğrafın kalıcı URI'si

window.onAndroidFilePicked = (uid, uri, displayName) => {

  if (!__pendingRow) return;

  __pendingRow.dataset.androidUri  = uri;

  __pendingRow.dataset.displayName = displayName || uri;

  dosyaAdi.textContent = displayName || uri;

  __pendingRow = null;

};

} else {

// Web tarafı

div.innerHTML = `

  <label style="display:flex;align-items:center;gap:8px;width:100%">

    <input type="file" accept="image/*" style="flex:1">

    <span class="dosya-adi" style="flex:1;color:#333;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>

  </label>

  <input type="text" placeholder="Açıklama" style="width:60%;margin-right:8px">

  <button type="button" class="btn-sil">🗑️</button>

`;

const fileInput = div.querySelector('input[type=file]');

const dosyaAdi  = div.querySelector('.dosya-adi');

const btnSil    = div.querySelector(".btn-sil");



fileInput.addEventListener('change', () => {

  dosyaAdi.textContent = fileInput.files[0]?.name || "";

});

btnSil.addEventListener("click", () => div.remove());

}

alan.appendChild(div);

}

yeniFotoSatiriEkle();

/* ---------- YENİ / DÜZENLE KAYDET --------------------------- */

async function yeniYerKaydet() {

const g = id => document.getElementById(id).value.trim();

const isim  = g("isim"), aciklama = g("aciklama");

const enlem = parseFloat(g("enlem")), boylam = parseFloat(g("boylam"));

if (!isim || !aciklama || isNaN(enlem) || isNaN(boylam)) return alert("Alanlar boş veya geçersiz!");

const fotolar = [];

const satirlar = document.querySelectorAll("#fotoAlani > div");

const isAndroid = !!(window.AndroidExport && AndroidExport.pickPhoto);

satirlar.forEach(div => {

const alt  = (div.querySelector('input[type=text]')?.value || "Fotoğraf").trim();



if (isAndroid) {

  const uri  = div.dataset.androidUri || "";

  const name = div.dataset.displayName || "";

  if (uri) fotolar.push({ alt, uri, name });

} else {

  const file = div.querySelector('input[type=file]')?.files?.[0];

  if (file) {

    const url = URL.createObjectURL(file);

    fotolar.push({ alt, uri: url, name: file.name });

  }

}

});

const idxStr = document.getElementById("yerForm").dataset.editIndex;

const idx = (idxStr !== undefined) ? Number(idxStr) : undefined;

if (idx !== undefined && !Number.isNaN(idx)) {

Object.assign(veriler[idx], { isim, aciklama, konum:[enlem,boylam] });

veriler[idx].fotolar = (veriler[idx].fotolar || []).concat(fotolar);

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

/* ---------- VERİLERİ DIŞA AKTAR ----------------------------- */

function verileriDisariAktar() {

if (veriler.length === 0) {

alert("Henüz kaydedilmiş yer yok!");

return;

}

const json = JSON.stringify(veriler, null, 2);

if (window.AndroidExport && AndroidExport.exportVeri) {

try { AndroidExport.exportVeri(json); } 

catch (e) { alert("Dışa aktarma başlatılamadı."); }

} else {

const blob = new Blob([json], {type: "application/json"});

const a = document.createElement("a");

a.href = URL.createObjectURL(blob);

a.download = "gezi_veriler.json";

a.click();

}

}

/* ---------- VERİLERİ İÇE AKTAR ----------------------------- */

async function verileriIceAktar(file) {

if (!file) return;

try {

const text   = await file.text();

const yeniV  = JSON.parse(text);

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

/* ---------- Yardımcılar ------------------------------------ */

function escapeHtml(s = "") {

return s.replace(/[&<>"']/g, c =>

({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])

);

}

function escapeAttr(s = "") {

return s.replace(/"/g, '"');

}



