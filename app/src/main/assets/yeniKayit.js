/* ---------- yeniKayit.js ---------- */
// Global callback Android'ten fotoğraf alındığında
window.onAndroidFilePicked = (uid, path, name) => {
  const fotoAlani = document.getElementById("fotoAlani");
  
  // UID ile eşleşen div varsa ekle, yoksa yeni div oluştur
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
    // Benzersiz UID oluştur
    const uid = 'uid_' + Date.now();
    AndroidExport.pickPhoto(uid);
  } else {
    // Tarayıcı için fallback (input file)
    const alan = document.getElementById("fotoAlani");
    const div = document.createElement("div");
    div.innerHTML = `
      <input type="file" accept="image/*" style="width:45%" onchange="this.nextElementSibling.src=window.URL.createObjectURL(this.files[0])">
      <input type="text" placeholder="Açıklama" style="width:45%;margin-left:8px">
      <button type="button" onclick="this.parentNode.remove()">🗑️</button>`;
    alan.appendChild(div);
  }
      }
// Yeni yer ekleme / düzenleme ve fotoğraf ekleme

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

// Yeni foto satırı ekleme
function yeniFotoSatiriEkle() {
  const alan = document.getElementById("fotoAlani");
  const div = document.createElement("div");
  div.innerHTML = `
    <input type="file" accept="image/*" style="width:45%">
    <input type="text" placeholder="Açıklama" style="width:45%;margin-left:8px">
    <button type="button" onclick="this.parentNode.remove()">🗑️</button>`;
  alan.appendChild(div);
}

// Yeni yer kaydet
// Yeni yer kaydetme
async function yeniYerKaydet() {
  const g = id => document.getElementById(id).value.trim();
  const isim = g("isim"), aciklama = g("aciklama");
  const enlem = parseFloat(g("enlem")), boylam = parseFloat(g("boylam"));

  if (!isim || !aciklama || isNaN(enlem) || isNaN(boylam)) {
    return alert("Alanlar boş veya geçersiz!");
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

  // Marker ekleme
  if (window.harita) {
    const ozelIkon = L.icon({
      iconUrl: 'tr2.png',
      iconSize: [24, 32],
      iconAnchor: [12, 32],
      className: 'gezi-marker'
    });

    const mk = L.marker([enlem, boylam], { icon: ozelIkon }).addTo(window.harita);
    
    // Marker'a tıklayınca detay göster
    mk.on("click", () => {
      if (window.ayrintiGoster) window.ayrintiGoster(yeniYer, window.veriler.length - 1);
    });

    // Marker'ları global tutmak istersen
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
window.yeniYerKaydet = yeniYerKaydet;
  function finish() {
    const idx = document.getElementById("yerForm").dataset.editIndex;
    if (idx !== undefined) {
      Object.assign(veriler[idx], { isim, aciklama, konum:[enlem,boylam] });
      veriler[idx].fotolar.push(...fotolar);
    } else {
      veriler.push({ isim, aciklama, konum:[enlem,boylam], fotolar });
    }

    document.getElementById("yerForm").reset();
    document.getElementById("fotoAlani").innerHTML = "";
    delete document.getElementById("yerForm").dataset.editIndex;
    document.getElementById("formBaslik").textContent = "Yeni Yer Ekle";

    goster();
    harita.flyTo([enlem, boylam], 9);
  }
}

window.yeniYerKaydet = yeniYerKaydet;
window.yeniFotoSatiriEkle = yeniFotoSatiriEkle;
