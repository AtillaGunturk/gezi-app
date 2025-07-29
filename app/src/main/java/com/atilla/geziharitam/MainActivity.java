package com.atilla.geziharitam;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.content.Context;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        webView.addJavascriptInterface(new JSBridge(this), "AndroidExport");

        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    public static class JSBridge {
        Context context;

        JSBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void exportVeri(String json) {
            Toast.makeText(context, "JSON verisi geldi", Toast.LENGTH_SHORT).show();
            // Henüz dışa aktarma yok. Sadece test.
        }
    }
    }
