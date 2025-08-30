/* ---------- ilSec.js ---------- */
// İl seçimi ve haritada o ile gitme

// İl listesi örnek (sen kendi koordinatları ile güncelle)
const iller = [
  { isim: "Türkiye", koordinat: [39.0, 35.0] },
  { isim: "Adana", koordinat: [37.0, 35.3] },
  { isim: "Adıyaman", koordinat: [37.8, 38.3] },
  { isim: "Afyonkarahisar", koordinat: [38.7, 30.5] },
  // ... diğer iller
];

const ilSelect = document.getElementById("ilSec");
iller.forEach((il, i) => {
  const op = document.createElement("option");
  op.value = i; 
  op.textContent = il.isim;
  ilSelect.appendChild(op);
});

ilSelect.addEventListener("change", () => {
  const v = ilSelect.value;
  if (v === "") return;
  harita.flyTo(iller[v].koordinat, 8);
});
