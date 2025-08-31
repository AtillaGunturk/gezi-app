// disarAktar.js
function verileriDisariAktar() {
  if (!window.veriler || window.veriler.length === 0) {
    alert("Kaydedilmiş veri yok!");
    return;
  }
  const dataStr = JSON.stringify(window.veriler, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gezi_veriler.json";
  a.click();
  URL.revokeObjectURL(url);
  alert("Veriler dışa aktarıldı!");
}
window.verileriDisariAktar = verileriDisariAktar;
