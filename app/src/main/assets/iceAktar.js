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

    if (!window.veriler) window.veriler = [];
    const mevcutSayisi = window.veriler.length;

    // JSON verilerini mevcut verilerle birleştir
    json.forEach(yeni => {
      if (!(yeni.konum && yeni.konum.length === 2)) {
        console.warn("Geçersiz konum:", yeni);
        return;
      }

      // Aynı kayıt var mı kontrol et
      const mevcut = window.veriler.find(v =>
        v.isim === yeni.isim &&
        v.aciklama === yeni.aciklama &&
        v.konum?.[0] === yeni.konum?.[0] &&
        v.konum?.[1] === yeni.konum?.[1]
      );

      if (mevcut) {
        // Fotoğrafları birleştir (tekrarsız)
        (yeni.fotolar ?? []).forEach(ft => {
          const zatenVar = (mevcut.fotolar ?? []).some(f =>
            f.yol === ft.yol && f.alt === ft.alt
          );
          if (!zatenVar) {
            if (!mevcut.fotolar) mevcut.fotolar = [];
            mevcut.fotolar.push(ft);
          }
        });
      } else {
        window.veriler.push(yeni);
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

    alert(`${window.veriler.length - mevcutSayisi} yeni kayıt eklendi, toplam ${window.veriler.length}`);
  };

  reader.readAsText(file);
}

window.verileriIceAktar = verileriIceAktar;
