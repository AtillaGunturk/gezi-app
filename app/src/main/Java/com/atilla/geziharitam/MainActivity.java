package com.atilla.geziharitam;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private static final int REQ_PERMS = 42;
    private static String[] PERMS;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.e("TEST", "onCreate başladı"); // ✅ Logcat'te görünürse activity başladı demektir

        // Android 13+ için medya izni, öncesi için STORAGE
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            PERMS = new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.READ_MEDIA_IMAGES
            };
        } else {
            PERMS = new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.READ_EXTERNAL_STORAGE
            };
        }

        // WebView hazırla
        WebView wv = new WebView(this);
        setContentView(wv);

        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setAllowFileAccess(true);
        s.setDomStorageEnabled(true);

        // İzin kontrolü
        if (!hasAllPerms()) {
            ActivityCompat.requestPermissions(this, PERMS, REQ_PERMS);
        } else {
            loadWebPage(wv);
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
            loadWebPage((WebView) findViewById(android.R.id.content).getRootView());
        }
    }

    private void loadWebPage(WebView wv) {
        Log.e("TEST", "Web sayfası yükleniyor...");
        wv.loadUrl("file:///android_asset/index.html");
    }
                }
