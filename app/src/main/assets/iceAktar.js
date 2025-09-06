function verileriIceAktar(file) {
  if (!file) return alert("Dosya seçilmedi!");

  const reader = new FileReader();
  reader.onload = function(e) {
    let json;
    try {
      json = JSON.parse(e.target.result);
      if (!Array.isArray(json)) throw new Error("Geçersiz JSON");
    } catch(err) {
      return alert("JSON okunamadı: " + err.message);
    }

    // Global veriler dizisi yoksa oluştur
    if (!window.veriler) window.veriler = [];
    const mevcutSayisi = window.veriler.length;

    // JSON verilerini mevcut verilerle birleştir
    json.forEach(yer => {
      // enlem/boylam sırası [lat, lng] olmalı
      if (yer.konum && yer.konum.length === 2) {
        window.veriler.push(yer);
      } else {
        console.warn("Geçersiz konum:", yer);
      }
    });

    // Markerları sıfırla ve yeniden ekle
    if (!window.markerlar) window.markerlar = [];
    window.markerlar.forEach(m => window.harita.removeLayer(m));
    window.markerlar = [];

    window.veriler.forEach((yer, i) => {
      const ozelIkon = L.icon({
        iconUrl: 'tr2.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        className: 'gezi-marker'
      });
      const mk = L.marker([yer.konum[0], yer.konum[1]], { icon: ozelIkon }).addTo(window.harita);
      mk.on("click", () => { if (window.ayrintiGoster) window.ayrintiGoster(yer, i); });
      window.markerlar.push(mk);
    });

    alert(`${window.veriler.length - mevcutSayisi} kayıt eklendi, toplam ${window.veriler.length}`);
  };

  reader.readAsText(file);
}

window.verileriIceAktar = verileriIceAktar;
