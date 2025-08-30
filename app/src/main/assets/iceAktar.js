/* ---------- iceAktar.js ---------- */
// JSON içe aktar

async function verileriIceAktar(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const yeniV = JSON.parse(text);
    if (!Array.isArray(yeniV)) throw "Beklenmeyen format";
    veriler.push(...yeniV); // ID eklemiyoruz, sadece veriler array’ine ekle
    goster();
    alert("Veriler içe aktarıldı!");
  } catch (e) {
    alert("Dosya okunamadı: " + e);
  }
}

window.verileriIceAktar = verileriIceAktar;
