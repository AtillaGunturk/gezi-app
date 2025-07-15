package com.atilla.geziharitam;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private static final int REQ_PERMS = 42;                    // İzin isteği kodu
    private static final String[] PERMS = {                     // İstenecek izinler
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.READ_MEDIA_IMAGES              // API 33+                     // (Android 13 ve sonrası)
            // Manifest.permission.READ_EXTERNAL_STORAGE      // < API 33 kullanıyorsanız
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1) WebView kur
        WebView wv = new WebView(this);
        setContentView(wv);
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setAllowFileAccess(true);
        s.setDomStorageEnabled(true);

        // 2) Gerekli izinler var mı?
        if (!hasAllPerms()) {
            // -> Eksikse iste
            ActivityCompat.requestPermissions(this, PERMS, REQ_PERMS);
        } else {
            // -> Hepsi zaten varsa sayfayı yükle
            loadWebPage(wv);
        }
    }

    /** Tüm izinler verilmiş mi? */
    private boolean hasAllPerms() {
        for (String p : PERMS) {
            if (ContextCompat.checkSelfPermission(this, p)
                    != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    /** İzin sonucu geri geldiğinde çalışır */
    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQ_PERMS) {
            // En az bir izin reddedildiyse grantResults[i] == PackageManager.PERMISSION_GRANTED olmaz
            if (hasAllPerms()) {
                // Tüm izinler şimdi var → Web sayfasını yükle
                loadWebPage((WebView) findViewById(android.R.id.content).getRootView());
            } else {
                // Kullanıcı reddetti → Gerekirse uyarı gösterin / uygulamayı sınırlayın
            }
        }
    }

    /** Asıl sayfayı yükleyen yardımcı fonksiyon */
    private void loadWebPage(WebView wv) {
        wv.loadUrl("file:///android_asset/index.html");
    }
              }
