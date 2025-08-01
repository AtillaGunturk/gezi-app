/* -----------------------------------------------------------
   veriler.js  –  Gezdiğim Yerler  (IndexedDB kalıcı veritabanı)
   ----------------------------------------------------------- */

/* ---------- LEAFLET HARİTASI -------------------------------- */
const harita = L.map("harita").setView([39.0, 35.0], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(harita);

/* ---------- GLOBAL DURUM ------------------------------------ */
let veriler   = [];    // tüm yerler
let markerlar = [];    // leaflet marker listesi
let db;                // IndexedDB bağlantısı

/* ---------- IndexedDB AÇ / YÜKLE ---------------------------- */
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
    store.clear();                       // sıfırla
    veriler.forEach(item => store.put(item));
    tx.oncomplete = () => ok();
    tx.onerror    = () => err(tx.error);
  });
}

const ozelIkon = L.icon({
  iconUrl: 'tr2.png',          // aynı klasörde ise
  iconSize:     [24, 32],       // veya [40, 40] — boyut
  iconAnchor:   [12, 32],       // ucu nereye denk gelsin (alt orta)
  className:    'gezi-marker'   // stil vermek istersen
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
  let html = `<h3>${yer.isim}</h3><p>${yer.aciklama}</p><div>`;
  yer.fotolar.forEach((f, j) => {
    html += `
      <img src="${f.dosya}" class="thumb" onclick="zoomFoto('${f.dosya}')" alt="${f.alt}">
      <button onclick="fotoSil(${i},${j})" style="color:red;margin-left:4px">🗑️</button>`;
  });
  html += `</div>
    <div style="margin-top:10px">
      <button onclick="düzenlemeModu(${i})">🖊️ Düzenle</button>
      <button onclick="markerSil(${i})" style="margin-left:8px;color:red">🗑️ Yer Sil</button>
      <button onclick="fotoEkleBaslat(${i})" style="margin-left:8px">➕ Fotoğraf Ekle</button>
    </div>`;
  document.getElementById("bilgiPaneli").innerHTML = html;
  
  /* ---------- FOTOĞRAF ZOM ------------------------------------ */
  function zoomFoto(src) {
  const lb = document.getElementById("lightbox");
  lb.style.display = "flex";
  lb.querySelector("img").src = src;
}
window.zoomFoto = zoomFoto;   // <script type="module"> kullanıyorsanız
}
/* ---------- FOTOĞRAF SİL ------------------------------------ */
async function fotoSil(yerIdx, fotoIdx) {
  if (!confirm("Bu fotoğrafı silmek istiyor musunuz?")) return;
  veriler[yerIdx].fotolar.splice(fotoIdx, 1);
  await dbKaydet();
  ayrintiGoster(veriler[yerIdx], yerIdx);
}



/* ---------- YER SİL ---------------------------------------- */
async function markerSil(i) {
  if (!confirm("Bu yeri silmek istiyor musunuz?")) return;

  // 1) Haritadan o marker’ı çıkar
  harita.removeLayer(markerlar[i]);

  // 2) Marker listesinden de sil
  markerlar.splice(i, 1);

  // 3) Veriyi kaldır
  veriler.splice(i, 1);
  await dbKaydet();

  // 4) Kalan marker’ları yeniden çiz (dizinler güncellensin)
  goster();

  // 5) UI geri bildirimleri
  document.getElementById("bilgiPaneli").textContent = "Silindi.";
  harita.setView([39.0, 35.0], 6);
}


/* ---------- FOTOĞRAF EKLE (paneli göster) ------------------- */
function fotoEkleBaslat(i) {
  düzenlemeModu(i);   // formu aç, foto satırı ekle
}

/* ---------- DÜZENLEME MODU (formu doldur) ------------------ */
function düzenlemeModu(i) {
  const y = veriler[i];
  if (!y) return;                       // güvenlik: dizin yoksa çık

  // Form öğelerinin hazır olduğundan emin olun
  const f = id => document.getElementById(id);
  if (!f("isim")) {
    console.warn("Form öğeleri henüz yüklenmedi!");
    return;
  }

  // Alanları doldur
  f("isim").value     = y.isim  ?? "";
  f("aciklama").value = y.aciklama ?? "";
  f("enlem").value    = y.konum?.[0] ?? "";
  f("boylam").value   = y.konum?.[1] ?? "";

  // Foto satırlarını oluştur
  const fotoAlani = f("fotoAlani");
  fotoAlani.innerHTML = "";
  (y.fotolar ?? []).forEach(ft =>
    yeniFotoSatiriEkle(ft.dosya, ft.alt)
  );

  // EditIndex ayarla, başlık değiştir
  f("yerForm").dataset.editIndex = i;
  f("formBaslik").textContent = "Düzenle";

  // Forma odakla
  harita.flyTo([enlem, boylam], 9);
 // window.scrollTo({ top: 0, behavior: "smooth" });
}

//  <script type="module"> kullanıyorsanız:
window.düzenlemeModu = düzenlemeModu;


/* ---------- FORM YARDIMCILAR -------------------------------- */
function yeniFotoSatiriEkle(url="", alt="") {
  const alan = document.getElementById("fotoAlani");
  const div  = document.createElement("div");
  div.innerHTML = `
    <input type="file" accept="image/*" style="width:45%">
    <input type="text" value="${alt}" placeholder="Açıklama" style="width:45%;margin-left:8px">
    <button type="button" onclick="this.parentNode.remove()">🗑️</button>`;
  alan.appendChild(div);
}

/* ---------- YENİ / DÜZENLE KAYDET --------------------------- */
async function yeniYerKaydet() {
  const g = id => document.getElementById(id).value.trim();
  const isim  = g("isim"), aciklama = g("aciklama");
  const enlem = parseFloat(g("enlem")), boylam = parseFloat(g("boylam"));
  if (!isim || !aciklama || isNaN(enlem) || isNaN(boylam)) return alert("Alanlar boş!");

  const fotolar = [];
  const satırlar = document.querySelectorAll("#fotoAlani > div");
  let bekleyen   = satırlar.length;
  if (bekleyen === 0) finish();         // fotoğrafsız kayıt

  satırlar.forEach(div => {
    const file = div.querySelector('input[type=file]').files[0];
    const alt  = div.querySelector('input[type=text]').value || "Fotoğraf";
    if (!file) { if (--bekleyen===0) finish(); return; }

    const rdr = new FileReader();
    rdr.onload = e => {
      fotolar.push({ dosya: e.target.result, alt });
      if (--bekleyen===0) finish();
    };
    rdr.readAsDataURL(file);
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

/* ---------- FOTO SATIRI BAŞLANGIÇ --------------------------- */
yeniFotoSatiriEkle();

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

/* ---------- BAŞLAT ----------------------------------------- */
(async () => {
  await dbAc();
  veriler = await dbHepsiniGetir();   // önceki verileri yükle
  goster();                           // markerları çiz
})();

/* ---------- VERİLERİ DIŞA AKTAR --------------------------- */
function verileriDisariAktar() {
  if (veriler.length === 0) {
    alert("Henüz kaydedilmiş yer yok!");
    return;
  }

  const json = JSON.stringify(veriler, null, 2);      //  pretty-print
  const blob = new Blob([json], { type: "application/json" });

  // ↓ 1)  Tarayıcıda indir
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "gezi-verileri.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url);
  
  alert("✅ Veriler başarıyla dışa aktarıldı!");

  // ↓ 2)  (Opsiyonel) Capacitor kuruluysa paylaş
  if (window.Share && Share.share) {
    Share.share({
      title: "Gezi Verilerim",
      text:  "İşte gezdiğim tüm yerler!",
      files: [blob],                  // Android 14+ için `files`
      dialogTitle: "Paylaş"
    }).catch(() => {/* kullanıcı vazgeçti */});
  }
}
/* ---------- VERİLERİ İÇE AKTAR --------------------------- */
async function verileriIceAktar(file) {
  if (!file) return;

  try {
    const text   = await file.text();
    const yeniV  = JSON.parse(text);

    if (!Array.isArray(yeniV)) throw "Beklenmeyen format";

    // Yerleri ekle (varsa çakışan id'leri çözmek için autoIncrement'e bel bağlayacağız)
    yeniV.forEach(y => delete y.id);   // id'leri sıfırla
    veriler.push(...yeniV);
    await dbKaydet();
    goster();
    alert("Veriler içe aktarıldı!");
  } catch (e) {
    alert("Dosya okunamadı: " + e);
  }
}