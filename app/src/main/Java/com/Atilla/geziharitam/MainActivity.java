package com.atilla.geziharitam;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    WebView wv = new WebView(this);          // Yeni WebView oluştur
    setContentView(wv);                      // WebView'i aktivitenin görünümü yap
    WebSettings s = wv.getSettings();       // WebView ayarlarını al
    s.setJavaScriptEnabled(true);            // JavaScript çalıştırmaya izin ver
    s.setAllowFileAccess(true);              // Dosya erişimini aç
    s.setDomStorageEnabled(true);            // IndexedDB gibi DOM depolama izin ver
    wv.loadUrl("file:///android_asset/index.html");  // Assets klasöründeki index.html dosyasını yükle
  }
}
