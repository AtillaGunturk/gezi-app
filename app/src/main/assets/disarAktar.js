function verileriDisariAktar() {
  if (!window.veriler || window.veriler.length === 0) {
    alert("Kaydedilmiş veri yok!");
    return;
  }

  const dataStr = JSON.stringify(window.veriler, null, 2);

  if (window.AndroidExport && AndroidExport.saveFile) {
    // Android: SAF üzerinden kaydet
    AndroidExport.saveFile("gezi_veriler.json", dataStr);
    alert("Veriler Android cihazınıza kaydedildi!");
  } else {
    // Tarayıcı fallback
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gezi_veriler.json";
    a.click();
    URL.revokeObjectURL(url);
    alert("Veriler dışa aktarıldı!");
  }
}

window.verileriDisariAktar = verileriDisariAktar;
