package com.atilla.geziharitam;

import android.content.Context;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.annotation.NonNull;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;

public class AndroidExport {

    private final Context context;
    private final WebView webView;

    public AndroidExport(Context context, WebView webView) {
        this.context = context;
        this.webView = webView;
    }

    // --- JSON dışa aktarma ---
    @JavascriptInterface
    public void exportJson(String json) {
        if (context instanceof MainActivity) {
            ((MainActivity) context).startFileExport();
        }
    }

    public void onFileSelectedToSave(Uri uri) {
        try {
            FileOutputStream fos = (FileOutputStream) context.getContentResolver().openOutputStream(uri);
            if (fos != null) {
                // veriler JS tarafında tutuluyor; burada sadece export tetiklenir
                fos.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // --- JSON içe aktarma ---
    @JavascriptInterface
    public void importJson(String jsonPath) {
        try {
            File file = new File(jsonPath);
            if (file.exists()) {
                BufferedReader br = new BufferedReader(new InputStreamReader(context.openFileInput(file.getName())));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }
                br.close();

                String js = "window.loadImportedJson(" + sb.toString() + ")";
                runOnUiThread(js);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // --- Fotoğraf seçildikten sonra JS’e bildirme ---
    public void onPhotoPicked(@NonNull String uid, @NonNull String fileUri, @NonNull String jsonPath) {
        // jsonPath: "fotograflar/geziAdi/dosya.ext"
        String js = String.format(
                "window.onPhotoPicked && window.onPhotoPicked('%s','%s','%s')",
                uid,
                escapeJs(fileUri),
                escapeJs(jsonPath)
        );
        runOnUiThread(js);
    }

    // --- Fotoğraf açma (MainActivity zaten implement etti) ---
    @JavascriptInterface
    public void openPhoto(String pathOrUri) {
        if (context instanceof MainActivity) {
            ((MainActivity) context).openPhoto(pathOrUri);
        }
    }

    // --- Yardımcı ---
    private void runOnUiThread(String js) {
        new Handler(Looper.getMainLooper()).post(() -> webView.evaluateJavascript(js, null));
    }

    private String escapeJs(String s) {
        return s.replace("\\", "\\\\").replace("'", "\\'");
    }
            }
