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

    // JSON dosyasını kayde
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
            
