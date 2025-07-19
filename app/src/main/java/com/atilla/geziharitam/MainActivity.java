package com.atilla.geziharitam;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private static final int REQ_PERMS = 42;
    private static String[] PERMS;

    private WebView wv;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            PERMS = new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.READ_MEDIA_IMAGES,
                    Manifest.permission.INTERNET,
                    Manifest.permission.ACCESS_NETWORK_STATE
            };
        } else {
            PERMS = new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.INTERNET,
                    Manifest.permission.ACCESS_NETWORK_STATE
            };
        }

        wv = new WebView(this);
        setContentView(wv);
        WebSettings settings = wv.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setDomStorageEnabled(true);

        // Android 4.1+ için file access ayarları
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
        }

        // WebViewClient ve WebChromeClient atama
        wv.setWebViewClient(new WebViewClient());

        wv.setWebChromeClient(new WebChromeClient() {
            // Eğer istersen dosya seçici için onShowFileChooser override yapılabilir
        });

        if (!hasAllPerms()) {
            ActivityCompat.requestPermissions(this, PERMS, REQ_PERMS);
        } else {
            loadWebPage();
        }
    }

    private boolean hasAllPerms() {
        for (String p : PERMS) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_PERMS && hasAllPerms()) {
            loadWebPage();
        }
    }

    private void loadWebPage() {
        wv.loadUrl("file:///android_asset/index.html");
    }
            }
