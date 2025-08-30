/* ---------- disarAktar.js ---------- */
// JSON dışa aktar

function verileriDisariAktar() {
  if (veriler.length === 0) { 
    alert("Henüz kaydedilmiş yer yok!"); 
    return; 
  }

  const json = JSON.stringify(veriler, null, 2);

  if (window.AndroidExport && AndroidExport.exportVeri) {
    AndroidExport.exportVeri(json); // Android tarafında kaydet
  } else {
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "gezi-verileri.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("✅ Veriler başarıyla dışa aktarıldı!");
  }
}

window.verileriDisariAktar = verileriDisariAktar;
