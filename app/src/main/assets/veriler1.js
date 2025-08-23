/* -----------------------------------------------------------
   veriler1.js  –  Gezdiğim Yerler  (IndexedDB + Android köprüsü)
   ----------------------------------------------------------- */

/* ---------- LEAFLET HARİTASI -------------------------------- */
const harita = L.map("harita").setView([39.0, 35.0], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(harita);

/* ---------- GLOBAL DURUM ------------------------------------ */
let veriler   = [];    // tüm yerler
let markerlar = [];    // leaflet marker listesi
let db;                // IndexedDB bağlantısı

/* ---------- IndexedDB AÇ / YÜKLE ---------------------------- */
function dbAc() {
  return new Promise((ok, err) => {
    const iste = indexedDB.open("geziHaritamDB", 1);
    iste.onupgradeneeded = e => {
      const dbase = e.target.result;
      if (!dbase.objectStoreNames.contains("yerler")) {
        dbase.createObjectStore("yerler", { keyPath: "id", autoIncrement: true });
      }
    };
    iste.onsuccess = e => { db = e.target.result; ok(); };
    iste.onerror   = () => err(iste.error);
  });
}

function dbHepsiniGetir() {
  return new Promise((ok, err) => {
    const tx    = db.transaction("yerler", "readonly");
    const store = tx.objectStore("yerler");
    const req   = store.getAll();
    req.onsuccess = () => ok(req.result);
    req.onerror   = () => err(req.error);
  });
}

function dbKaydet() {
  return new Promise((ok, err) => {
    const tx    = db.transaction("yerler", "readwrite");
    const store = tx.objectStore("yerler");
    store.clear();                       // sıfırla
    veriler.forEach(item => store.put(item));
    tx.oncomplete = () => ok();
    tx.onerror    = () => err(tx.error);
  });
}

const ozelIkon = L.icon({
  iconUrl: 'tr2.png',
  iconSize:     [24, 32],
  iconAnchor:   [12, 32],
  className:    'gezi-marker'
});

/* ---------- MARKER GÜNCELLE --------------------------------- */
function goster() {
  markerlar.forEach(m => harita.removeLayer(m));
  markerlar = [];

  veriler.forEach((yer, i) => {
    const mk = L.marker(yer.konum, { icon: ozelIkon }).addTo(harita);
    mk.on("click", () => ayrintiGoster(yer, i));
    markerlar.push(mk);
  });
}

/* ---------- FOTOĞRAF KÜÇÜLTME (web fallback) ---------------- */
function kucukResimOlustur(file, maxSize=300) {
  return new Promise(ok => {
    const img = new Image();
    const rdr = new FileReader();
    rdr.onload = e => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width  = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        ok(canvas.toDataURL("image/jpeg", 0.7)); // %70 kalite
      };
      img.src = e.target.result;
    };
    rdr.readAsDataURL(file);
  });
}

/* ---------- DETAY PANELİ ------------------------------------ */
function ayrintiGoster(yer, i) {
  let html = `<h3>${yer.isim}</h3><p>${yer.aciklama}</p><div>`;
  (yer.fotolar || []).forEach((f, j) => {
    const src = f.thumb || f.uri || "";
    const orj = f.uri || f.orjinal || "";
    const alt = f.alt || "";
    html += `
      <div style="display:inline-block; margin:5px; text-align:center">
        <img src="${src}" class="thumb"
             onclick="zoomFoto('${orj}', '${src}')" 
             alt="${escapeHtml(alt)}">
        <div style="font-size:12px; margin-top:4px">${escapeHtml(alt)}</div>
        <button onclick="fotoSil(${i},${j})" style="color:red;margin-top:4px">🗑️</button>
      </div>`;
  });
  html += `</div>
    <div style="margin-top:10px">
      <button onclick="düzenlemeModu(${i})">🖊️ Düzenle</button>
      <button onclick="markerSil(${i})" style="margin-left:8px;color:red">🗑️ Yer Sil</button>
      <button onclick="fotoEkleBaslat(${i})" style="margin-left:8px">➕ Fotoğraf Ekle</button>
    </div>`;
  document.getElementById("bilgiPaneli").innerHTML = html;
}

/* ---------- FOTOĞRAF ZOOM ----------------------------------- */
function zoomFoto(orjinalYolVeyaUri, thumb) {
  const lb = document.getElementById("lightbox");
  // Android köprü varsa orijinali Android uygulamalarıyla aç
  if (window.AndroidExport && AndroidExport.openPhoto && orjinalYolVeyaUri) {
    AndroidExport.openPhoto(orjinalYolVeyaUri);
    return;
  }
  // Web fallback: lightbox'ta göster
  lb.style.display = "flex";
  lb.querySelector("img").src = thumb || orjinalYolVeyaUri || "";
}
window.zoomFoto = zoomFoto;

/* ---------- FOTOĞRAF SİL ------------------------------------ */
async function fotoSil(yerIdx, fotoIdx) {
  if (!confirm("Bu fotoğrafı silmek istiyor musunuz?")) return;
  veriler[yerIdx].fotolar.splice(fotoIdx, 1);
  await dbKaydet();
  ayrintiGoster(veriler[yerIdx], yerIdx);
}

/* ---------- YER SİL ----------------------------------------- */
async function markerSil(i) {
  if (!confirm("Bu yeri silmek istiyor musunuz?")) return;
  harita.removeLayer(markerlar[i]);
  markerlar.splice(i, 1);
  veriler.splice(i, 1);
  await dbKaydet();
  goster();
  document.getElementById("bilgiPaneli").textContent = "Silindi.";
  harita.setView([39.0, 35.0], 6);
}

/* ---------- FOTOĞRAF EKLE (paneli göster) ------------------- */
function fotoEkleBaslat(i) {
  düzenlemeModu(i);
}

/* ---------- DÜZENLEME MODU --------------------------------- */
function düzenlemeModu(i) {
  const y = veriler[i];
  if (!y) return;
  const f = id => document.getElementById(id);
  if (!f("isim")) return;

  f("isim").value     = y.isim  ?? "";
  f("aciklama").value = y.aciklama ?? "";
  f("enlem").value    = y.konum?.[0] ?? "";
  f("boylam").value   = y.konum?.[1] ?? "";

  const fotoAlani = f("fotoAlani");
  fotoAlani.innerHTML = "";
  // mevcut fotolar düzenleme sırasında sadece "yeni satır" üretmez; mevcutlar panelde görünür
  // istersen burada her foto için bir satır açılabilir; şu an sade bırakıyoruz

  f("yerForm").dataset.editIndex = i;
  f("formBaslik").textContent = "Düzenle";
  harita.flyTo([y.konum?.[0], y.konum?.[1]], 9);
}
window.düzenlemeModu = düzenlemeModu;

/* ---------- FORM YARDIMCILAR -------------------------------- */
// Android picker ile eşleştirmek için tek seferde bekleyen satırı tutuyoruz
let __pendingRow = null;

function yeniFotoSatiriEkle(url="", alt="") {
  const alan = document.getElementById("fotoAlani");
  const div  = document.createElement("div");

  const isAndroid = !!(window.AndroidExport && AndroidExport.pickPhoto);

  if (isAndroid) {
    // ANDROID: "Fotoğraf Seç" düğmesi + yol etiketi + açıklama + sil
    div.innerHTML = `
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
        <button type="button" class="btn-sec">📷 Fotoğraf Seç</button>
        <span class="dosya-adi" style="flex:1;color:#333;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
      </div>
      <input type="text" value="${escapeAttr(alt)}" placeholder="Açıklama" style="width:60%;margin-right:8px">
      <button type="button" class="btn-sil">🗑️</button>
    `;

    const btnSec   = div.querySelector(".btn-sec");
    const dosyaAdi = div.querySelector(".dosya-adi");
    const btnSil   = div.querySelector(".btn-sil");

    btnSec.addEventListener("click", () => {
      __pendingRow = div; // bu satır için seçim bekleniyor
      try { AndroidExport.pickPhoto(""); } catch(e) { console.warn(e); }
    });

    btnSil.addEventListener("click", () => div.remove());

    // Android'ten dönüş: window.onPhotoPicked(uri, displayName)
    window.onPhotoPicked = (uri, displayName) => {
      if (!__pendingRow) return;
      __pendingRow.dataset.androidUri  = uri;
      __pendingRow.dataset.displayName = displayName || uri;
      dosyaAdi.textContent = displayName || uri;
      __pendingRow = null;
    };

  } else {
    // WEB: klasik <input type="file"> + yol/isim etiketi + açıklama + sil
    div.innerHTML = `
      <label style="display:flex;align-items:center;gap:8px;width:100%">
        <input type="file" accept="image/*" style="flex:1">
        <span class="dosya-adi" style="flex:1;color:#333;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
      </label>
      <input type="text" value="${escapeAttr(alt)}" placeholder="Açıklama" style="width:60%;margin-right:8px">
      <button type="button" class="btn-sil">🗑️</button>
    `;
    const fileInput = div.querySelector('input[type=file]');
    const dosyaAdi  = div.querySelector('.dosya-adi');
    const btnSil    = div.querySelector(".btn-sil");

    fileInput.addEventListener('change', () => {
      dosyaAdi.textContent = fileInput.files[0]?.name || "";
    });
    btnSil.addEventListener("click", () => div.remove());
  }

  alan.appendChild(div);
}

/* ---------- YENİ / DÜZENLE KAYDET --------------------------- */
async function yeniYerKaydet() {
  const g = id => document.getElementById(id).value.trim();
  const isim  = g("isim"), aciklama = g("aciklama");
  const enlem = parseFloat(g("enlem")), boylam = parseFloat(g("boylam"));
  if (!isim || !aciklama || isNaN(enlem) || isNaN(boylam)) return alert("Alanlar boş!");

  const fotolar = [];
  const satirlar = document.querySelectorAll("#fotoAlani > div");
  let bekleyen   = 0;

  const isAndroid = !!(window.AndroidExport && AndroidExport.pickPhoto);

  satirlar.forEach(div => {
    const alt  = (div.querySelector('input[type=text]')?.value || "Fotoğraf").trim();

    if (isAndroid) {
      // Android: URI doğrudan kullanılır (thumb olarak da aynı URI kullanılabilir)
      const uri = div.dataset.androidUri || "";
      const name= div.dataset.displayName || "";
      if (uri) {
        fotolar.push({ alt, uri, name, thumb: uri, orjinal: uri });
      }
      // uri yoksa bu satırı atla
    } else {
      // Web: file input'tan küçük resim üret
      const file = div.querySelector('input[type=file]')?.files?.[0];
      if (file) bekleyen++;
      if (file) {
        kucukResimOlustur(file).then(thumb => {
          fotolar.push({ thumb, alt, orjinal: file.name });
          if (--bekleyen===0) finish();
        });
      }
    }
  });

  if (!isAndroid && bekleyen > 0) {
    // web: küçültme bitince finish() çağrılacak
  } else {
    // android veya hiç bekleyen yok → direkt finish
    finish();
  }

  async function finish() {
    const idxStr = document.getElementById("yerForm").dataset.editIndex;
    const idx = (idxStr !== undefined) ? Number(idxStr) : undefined;

    if (idx !== undefined && !Number.isNaN(idx)) {
      // düzenleme
      Object.assign(veriler[idx], { isim, aciklama, konum:[enlem,boylam] });
      veriler[idx].fotolar = (veriler[idx].fotolar || []).concat(fotolar);
      markerlar[idx].setLatLng([enlem, boylam]);
    } else {
      // yeni kayıt
      veriler.push({ isim, aciklama, konum:[enlem,boylam], fotolar });
    }

    await dbKaydet();
    document.getElementById("yerForm").reset();
    document.getElementById("fotoAlani").innerHTML = "";
    delete document.getElementById("yerForm").dataset.editIndex;
    document.getElementById("formBaslik").textContent = "Yeni Yer Ekle";
    goster();
    harita.flyTo([enlem, boylam], 9);
  }
}

/* ---------- FOTO SATIRI BAŞLANGIÇ --------------------------- */
yeniFotoSatiriEkle();

/* ---------- İL SEÇ AÇILIR MENÜSÜ ---------------------------- */
const ilSelect = document.getElementById("ilSec");
if (typeof iller !== "undefined" && Array.isArray(iller)) {
  iller.forEach((il, i) => {
    const op = document.createElement("option");
    op.value = i; op.textContent = il.isim;
    ilSelect.appendChild(op);
  });
}
ilSelect.addEventListener("change", () => {
  const v = ilSelect.value;
  if (v==="") return;
  harita.flyTo(iller[v].koordinat, 8);
});

/* ---------- BAŞLAT ----------------------------------------- */
(async () => {
  await dbAc();
  veriler = await dbHepsiniGetir();
  goster();
})();

/* ---------- VERİLERİ DIŞA AKTAR ----------------------------- */
function verileriDisariAktar() {
  if (veriler.length === 0) {
    alert("Henüz kaydedilmiş yer yok!");
    return;
  }
  const json = JSON.stringify(veriler, null, 2);

  if (window.AndroidExport && AndroidExport.exportVeri) {
    // Android SAF üzerinden kaydet; başarı mesajını Android tarafı verecek
    try { AndroidExport.exportVeri(json); } catch (e) { alert("Dışa aktarma başlatılamadı."); }
  } else {
    // web fallback: indir
    const blob = new Blob([json], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gezi_veriler.json";
    a.click();
  }
}

/* ---------- VERİLERİ İÇE AKTAR ----------------------------- */
async function verileriIceAktar(file) {
  if (!file) return;
  try {
    const text   = await file.text();
    const yeniV  = JSON.parse(text);
    if (!Array.isArray(yeniV)) throw "Beklenmeyen format";
    yeniV.forEach(y => delete y.id);
    veriler.push(...yeniV);
    await dbKaydet();
    goster();
    alert("Veriler içe aktarıldı!");
  } catch (e) {
    alert("Dosya okunamadı: " + e);
  }
}

/* ---------- Yardımcılar ------------------------------------ */
function escapeHtml(s="") {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s="") {
  return s.replace(/"/g, '&quot;');
  }

package com.atilla.geziharitam;

import android.content.Context;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.util.Log;
import java.io.OutputStream;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

public class AndroidExport {

    private final Context context;
    private final WebView webView;
    private String jsonToSave = null;

    public AndroidExport(Context context, WebView webView) {
        this.context = context;
        this.webView = webView;
    }

    // JSON dışa aktarma (JS -> Android)
    @JavascriptInterface
    public void exportVeri(String json) {
        Log.d("AndroidExport", "exportVeri çağrıldı, json uzunluğu: " + json.length());
        this.jsonToSave = json;
        if (context instanceof MainActivity) {
            ((MainActivity) context).startFileExport();
        }
    }

    // JSON dosyasını kaydet
    public void onFileSelectedToSave(Uri uri) {
        if (jsonToSave == null || uri == null) return;
        try (OutputStream outputStream = context.getContentResolver().openOutputStream(uri)) {
            if (outputStream != null) {
                outputStream.write(jsonToSave.getBytes(StandardCharsets.UTF_8));
            }
            webView.post(() -> webView.evaluateJavascript(
                    "alert('Veriler başarıyla kaydedildi!')", null
            ));
        } catch (Exception e) {
            Log.e("AndroidExport", "Dosya kaydedilemedi", e);
        }
    }

    // Fotoğraf seçme (JS -> Android)
    @JavascriptInterface
    public void pickPhoto(String uid) {
        if (context instanceof MainActivity) {
            ((MainActivity) context).startPhotoPicker(uid);
        }
    }

    // Fotoğraf seçildikten sonra JS'e bildir (thumbnail + orijinal)
    public void onPhotoPicked(String uid, Uri uri, String displayName) {
        try (InputStream inputStream = context.getContentResolver().openInputStream(uri)) {
            if (inputStream == null) return;

            Bitmap originalBitmap = BitmapFactory.decodeStream(inputStream);
            if (originalBitmap == null) return;

            // ✅ Orijinal fotoğrafı Base64'e çevir
            ByteArrayOutputStream baosOriginal = new ByteArrayOutputStream();
            originalBitmap.compress(Bitmap.CompressFormat.JPEG, 90, baosOriginal);
            String base64Original = Base64.encodeToString(baosOriginal.toByteArray(), Base64.NO_WRAP);

            // ✅ Thumbnail oluştur (200px genişlik)
            int newWidth = 200;
            int newHeight = (int) ((double) originalBitmap.getHeight() / originalBitmap.getWidth() * newWidth);
            Bitmap thumbnail = Bitmap.createScaledBitmap(originalBitmap, newWidth, newHeight, true);

            // ✅ Thumbnail Base64
            ByteArrayOutputStream baosThumb = new ByteArrayOutputStream();
            thumbnail.compress(Bitmap.CompressFormat.JPEG, 80, baosThumb);
            String base64Thumb = Base64.encodeToString(baosThumb.toByteArray(), Base64.NO_WRAP);

            // ✅ JS'e gönder (orijinal + thumbnail)
            String js = String.format(
                    "window.onAndroidFilePicked && window.onAndroidFilePicked('%s','%s','%s','data:image/jpeg;base64,%s','data:image/jpeg;base64,%s');",
                    escapeJs(uid),
                    escapeJs(uri.toString()),
                    escapeJs(displayName),
                    base64Thumb,
                    base64Original
            );

            webView.post(() -> webView.evaluateJavascript(js, null));

        } catch (Exception e) {
            Log.e("AndroidExport", "Fotoğraf işlenirken hata oluştu", e);
        }
    }

    // Fotoğraf aç (JS -> Android)
    @JavascriptInterface
    public void openPhoto(String uriOrPath) {
        if (context instanceof MainActivity) {
            ((MainActivity) context).openPhoto(uriOrPath);
        }
    }

    // JS içinde güvenli string
    private String escapeJs(String s) {
        return s == null ? "" : s.replace("'", "\\'");
    }
}
