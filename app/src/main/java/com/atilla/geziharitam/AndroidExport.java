package com.atilla.geziharitam;

import android.content.Context;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import java.io.OutputStream;

public class AndroidExport {

    private Context context;
    private WebView webView;
    private String jsonToSave = null;

    public AndroidExport(Context context, WebView webView) {
        this.context = context;
        this.webView = webView;
    }

    // JS tarafından dışa aktarma için çağrılır, json veriyi alır ve dosya kaydetme işlemini başlatır
    @JavascriptInterface
    public void exportVeri(String json) {
        this.jsonToSave = json;
        ((MainActivity) context).startFileExport();  // MainActivity'de tanımlı dosya oluşturma Intent'i başlatır
    }

    // SAF ile dosya seçildikten sonra çağrılır, seçilen URI'ye json içeriğini yazar
    public void onFileSelectedToSave(Uri uri) {
        if (jsonToSave == null || uri == null) return;
        try {
            OutputStream outputStream = context.getContentResolver().openOutputStream(uri);
            outputStream.write(jsonToSave.getBytes("UTF-8"));
            outputStream.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // İçe aktarma ve fotoğraf seçme ile ilgili tüm kodlar kaldırıldı
}

