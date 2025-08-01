package com.atilla.geziharitam;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

public class AndroidExport {
    Context context;
    WebView webView;

    public AndroidExport(Context context, WebView webView) {
        this.context = context;
        this.webView = webView;
    }

    @JavascriptInterface
    public void exportVeri(String json) {
        Toast.makeText(context, "Veri alındı: " + json.length() + " karakter", Toast.LENGTH_SHORT).show();
        // Buraya dosyaya yazma işlemini ekleyebilirsiniz
    }
}
