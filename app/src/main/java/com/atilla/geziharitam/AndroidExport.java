package com.atilla.geziharitam;

import android.content.Context;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.util.Log;
import java.io.OutputStream;
import java.io.InputStream;
import java.io.File;
import java.io.FileOutputStream;
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

    try {
        // Mevcut JSON'u oku
        String existingJson = "";
        try (InputStream is = context.getContentResolver().openInputStream(uri)) {
            if (is != null) {
                byte[] buffer = new byte[is.available()];
                is.read(buffer);
                existingJson = new String(buffer, StandardCharsets.UTF_8).trim();
            }
        } catch (Exception e) {
            Log.w("AndroidExport", "Mevcut JSON okunamadı, yeni dosya oluşturulacak");
        }

        // Mevcut JSON varsa array içine al, yoksa direkt yaz
        String newJson;
        if (!existingJson.isEmpty()) {
            existingJson = existingJson.replaceAll("(?s)^\\s*\\[|\\]\\s*$", ""); // baştaki/sondaki [] kaldır
            newJson = "[" + existingJson + "," + jsonToSave.substring(1, jsonToSave.length() - 1) + "]";
        } else {
            newJson = jsonToSave;
        }

        // Dosyaya yaz (truncate mode)
        try (OutputStream outputStream = context.getContentResolver().openOutputStream(uri, "wt")) {
            if (outputStream != null) {
                outputStream.write(newJson.getBytes(StandardCharsets.UTF_8));
            }
        }

        webView.post(() -> webView.evaluateJavascript(
                "alert('✅ Veriler başarıyla kaydedildi!')", null
        ));

    } catch (Exception e) {
        Log.e("AndroidExport", "Dosya kaydedilemedi", e);
        webView.post(() -> webView.evaluateJavascript(
                "alert('❌ Veriler kaydedilemedi!')", null
        ));
    }
        }

    // AndroidExport.java içinde (mevcut onPhotoPicked'in yerine koy)
    @JavascriptInterface
    public void onPhotoPicked(String uid, Uri uri, String displayName) {
       try {
          if (uri == null) return;

        // Benzersiz dosya adı (timestamp + orijinal isim)
        String name = displayName != null ? (System.currentTimeMillis() + "_" + displayName) : ("IMG_" + System.currentTimeMillis() + ".jpg");

        // TARGET: External app files /fotograflar klasörü
        File fotoDir = context.getExternalFilesDir("fotograflar");
        if (fotoDir == null) {
            // Fallback: internal files (çok nadir)
            fotoDir = context.getFilesDir();
        }
        if (!fotoDir.exists()) {
            fotoDir.mkdirs();
        }

        File destFile = new File(fotoDir, name);

        // Kopyala
        try (InputStream in = context.getContentResolver().openInputStream(uri);
             OutputStream out = new FileOutputStream(destFile)) {
            if (in == null) return;
            byte[] buffer = new byte[8192];
            int len;
            while ((len = in.read(buffer)) > 0) {
                out.write(buffer, 0, len);
            }
        }

        // JS'e: 1) görüntüleme için tam file:// URI  2) JSON için göreceli yol
        String fileUri = "file://" + destFile.getAbsolutePath();
        String relativePath = "fotograflar/" + destFile.getName();

        String js = String.format(
            "window.onAndroidFilePicked && window.onAndroidFilePicked('%s','%s','%s');",
            escapeJs(uid),
            escapeJs(fileUri),
            escapeJs(relativePath)
        );

        webView.post(() -> webView.evaluateJavascript(js, null));
    } catch (Exception e) {
        Log.e("AndroidExport", "Fotoğraf işlenirken hata oluştu", e);
    }
                }
    // Fotoğraf seçme (JS -> Android)
    @JavascriptInterface
    public void pickPhoto(String uid) {
        if (context instanceof MainActivity) {
            ((MainActivity) context).startPhotoPicker(uid);
        }
    }

    // Fotoğraf seçildikten sonra JS'e bildir (kalıcı yol)
// AndroidExport.java içinde (mevcut onPhotoPicked'in yerine koy)

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
