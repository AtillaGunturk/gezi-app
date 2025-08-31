// iceAktar.js
function verileriIceAktar(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const json = JSON.parse(e.target.result);
      if (!Array.isArray(json)) throw new Error("Geçersiz JSON");
      window.veriler = json;
      if (!window.markerlar) window.markerlar = [];
      // Önce mevcut markerları temizle
      window.markerlar.forEach(m => window.harita.removeLayer(m));
      window.markerlar = [];

      // Yeni markerları ekle
      window.veriler.forEach((yer, i) => {
        const ozelIkon = L.icon({
          iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/RedDot.svg',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          className: 'gezi-marker'
        });
        const mk = L.marker([yer.konum[0], yer.konum[1]], { icon: ozelIkon }).addTo(window.harita);
        mk.on("click", () => { if (window.ayrintiGoster) window.ayrintiGoster(yer, i); });
        window.markerlar.push(mk);
      });
      alert("Veriler başarıyla içe aktarıldı!");
    } catch (err) {
      alert("JSON okunamadı: " + err.message);
    }
  };
  reader.readAsText(file);
}
window.verileriIceAktar = verileriIceAktar;
