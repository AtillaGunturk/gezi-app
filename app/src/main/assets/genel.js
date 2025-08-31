/* -----------------------------------------------------------
   genel.js – Ortak Fonksiyonlar (Listeleme, Düzenleme, Silme)
----------------------------------------------------------- */

// Yerleri listele + haritaya marker ekle
function goster() {
  const liste = document.getElementById("liste");
  if (!liste) return;

  liste.innerHTML = "";

  if (!window.veriler) window.veriler = [];

  window.veriler.forEach((yer, i) => {
    // Liste satırı
    const div = document.createElement("div");
    div.className = "yer-satir";
    div.innerHTML = `
      <b>${yer.isim}</b> – ${yer.aciklama}
      <button onclick="düzenlemeModu(${i})">✏️ Düzenle</button>
      <button onclick="silYer(${i})">🗑️ Sil</button>
    `;

    // Küçük fotoğraflar
    yer.fotolar?.forEach(f => {
      const img = document.createElement("img");
      img.src = f.yol;
      img.className = "thumb";
      img.title = f.alt;
      img.onclick = () => zoomFoto(f.yol);
      div.appendChild(img);
    });

    liste.appendChild(div);

    // Haritaya marker
    if (window.harita && L) {
      L.marker(yer.konum, {
        icon: L.icon({
          iconUrl: "tr2.png", // senin ikon
          iconSize: [32, 32]
        })
      }).addTo(harita)
        .bindPopup(`<b>${yer.isim}</b><br>${yer.aciklama}`);
    }
  });
}

// Fotoğrafı büyütme
function zoomFoto(path) {
  const modal = document.createElement("div");
  modal.className = "lightbox";
  modal.innerHTML = `
    <div class="lightbox-icerik">
      <span class="kapat" onclick="this.parentNode.parentNode.remove()">×</span>
      <img src="${path}" style="max-width:95%;max-height:95%">
    </div>
  `;
  document.body.appendChild(modal);
}

// Düzenleme modu (seçili kaydı forma getir)
function düzenlemeModu(index) {
  const yer = window.veriler[index];
  if (!yer) return;

  document.getElementById("isim").value = yer.isim;
  document.getElementById("aciklama").value = yer.aciklama;
  document.getElementById("enlem").value = yer.konum[0];
  document.getElementById("boylam").value = yer.konum[1];

  // Foto alanını doldur
  const fotoAlani = document.getElementById("fotoAlani");
  fotoAlani.innerHTML = "";
  yer.fotolar.forEach(f => {
    const div = document.createElement("div");

    const img = document.createElement("img");
    img.src = f.yol;
    img.className = "thumb";
    img.title = f.alt;
    img.onclick = () => zoomFoto(f.yol);

    const input = document.createElement("input");
    input.type = "text";
    input.value = f.alt;
    input.style = "width:45%;margin-left:8px";

    const silBtn = document.createElement("button");
    silBtn.textContent = "🗑️";
    silBtn.onclick = () => div.remove();

    div.appendChild(img);
    div.appendChild(input);
    div.appendChild(silBtn);

    fotoAlani.appendChild(div);
  });

  // Düzenleme kaydetme için buton güncelle
  const kaydetBtn = document.getElementById("kaydetBtn");
  kaydetBtn.onclick = () => {
    yer.isim = document.getElementById("isim").value.trim();
    yer.aciklama = document.getElementById("aciklama").value.trim();
    yer.konum = [
      parseFloat(document.getElementById("enlem").value),
      parseFloat(document.getElementById("boylam").value)
    ];

    // fotoğrafları güncelle
    const yeniFotolar = [];
    fotoAlani.querySelectorAll("div").forEach(d => {
      const img = d.querySelector("img");
      const alt = d.querySelector("input").value;
      if (img?.src) yeniFotolar.push({ yol: img.src, alt });
    });
    yer.fotolar = yeniFotolar;

    goster(); // listeyi ve markerları yenile
    alert("Kayıt güncellendi ✅");
  };
}

// Yer silme
function silYer(index) {
  if (!confirm("Bu yeri silmek istediğinize emin misiniz?")) return;
  window.veriler.splice(index, 1);
  goster();
}

window.goster = goster;
window.zoomFoto = zoomFoto;
window.düzenlemeModu = düzenlemeModu;
window.silYer = silYer;
