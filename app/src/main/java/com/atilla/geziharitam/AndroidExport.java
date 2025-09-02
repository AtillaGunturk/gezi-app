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

    // Fotoğraf seçildikten sonra JS'e bildir (kalıcı yol)
    public void onPhotoPicked(String uid, Uri uri, String displayName) {
        try {
            if (uri == null) return;

            // Benzersiz dosya adı oluştur
            String name = displayName != null ? System.currentTimeMillis() + "_" + displayName : "IMG_" + System.currentTimeMillis() + ".jpg";
            File destFile = new File(context.getFilesDir(), name);

            // Fotoğrafı uygulama dizinine kopyala
            try (InputStream in = context.getContentResolver().openInputStream(uri);
                 OutputStream out = new FileOutputStream(destFile)) {
                if (in == null) return;
                byte[] buffer = new byte[8192];
                int len;
                while ((len = in.read(buffer)) > 0) {
                    out.write(buffer, 0, len);
                }
            }

            // JS'e bildir (UID + kalıcı yol + dosya adı)
            String js = String.format(
                    "window.onAndroidFilePicked && window.onAndroidFilePicked('%s','%s','%s');",
                    escapeJs(uid),
                    escapeJs(destFile.getAbsolutePath()),
                    escapeJs(name)
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
