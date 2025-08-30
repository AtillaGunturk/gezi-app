/* ---------- ilSec.js ---------- */
// İl seçimi ve haritada o ile gitme

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
