package com.atilla.geziharitam;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.io.File;
import java.io.FileOutputStream;

// Ana Activity sınıfı
public class MainActivity extends AppCompatActivity {

    private static final int REQ_PERMS = 1; // İzinler için istek kodu
    private static final int FILE_CHOOSER_REQUEST_CODE = 2; // Dosya seçici için istek kodu

    private WebView wv; // WebView nesnesi
    private ValueCallback<Uri[]> filePathCallback; // Dosya seçiminden gelen URI'leri almak için callback

    // Gerekli izinler (Android 10 öncesi için)
    private String[] PERMISSIONS = {
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        wv = new WebView(this); // WebView oluşturuluyor
        setContentView(wv); // WebView ekrana yerleştiriliyor

        // WebView ayarları
        WebSettings settings = wv.getSettings();
        settings.setJavaScriptEnabled(true); // JavaScript etkinleştiriliyor
        settings.setDomStorageEnabled(true); // DOM storage desteği açılıyor (IndexedDB için)
        settings.setAllowFileAccess(true); // Dosya erişimine izin veriliyor
        settings.setAllowContentAccess(true); // İçerik erişimine izin veriliyor

        // Android 4.2+ için gerekli dosya erişim ayarları
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            settings.setAllowFileAccessFromFileURLs(true); // file:// erişimine izin ver
            settings.setAllowUniversalAccessFromFileURLs(true); // tüm alanlardan erişime izin ver
        }

        wv.setWebViewClient(new WebViewClient()); // Sayfa yükleme işlemlerini WebViewClient yönetecek

        // Dosya seçimi için özel WebChromeClient
        wv.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
                filePathCallback = callback; // Seçilen dosyaları almak için callback saklanıyor
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT); // Dosya seçme amacıyla Intent
                intent.setType("*/*"); // Tüm dosya türlerine izin ver
                intent.addCategory(Intent.CATEGORY_OPENABLE); // Sadece açılabilir dosyalar
                startActivityForResult(Intent.createChooser(intent, "Dosya Seç"), FILE_CHOOSER_REQUEST_CODE);
                return true; // Dosya seçici gösterildi
            }
        });

        // JavaScript'ten Android tarafına veri aktarımı için arayüz ekleniyor
        wv.addJavascriptInterface(new AndroidExportInterface(), "AndroidExport");

        // Eğer gerekli izinler varsa, sayfayı yükle
        if (hasPermissions()) {
            loadWebPage();
        } else {
            // İzinler yoksa kullanıcıdan iste
            ActivityCompat.requestPermissions(this, PERMISSIONS, REQ_PERMS);
        }
    }

    // Gerekli izinlerin verilip verilmediğini kontrol eder
    private boolean hasPermissions() {
        for (String perm : PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    // index.html dosyasını assets klasöründen yükler
    private void loadWebPage() {
        wv.clearCache(true); // Cache temizleniyor
        wv.loadUrl("file:///android_asset/index.html"); // WebView içeriği yükleniyor
    }

    // İzinlerin sonucu geldiğinde çağrılır
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_PERMS && hasPermissions()) {
            loadWebPage(); // Eğer izinler verildiyse sayfa yüklenir
        }
    }

    // Dosya seçimi işlemi tamamlandığında sonuç burada alınır
    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE && filePathCallback != null) {
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                Uri result = data.getData(); // Seçilen dosyanın URI'si
                if (result != null) {
                    results = new Uri[]{result};
                }
            }
            filePathCallback.onReceiveValue(results); // Sonuç WebView'a iletiliyor
            filePathCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    // JavaScript tarafından çağrılabilecek iç sınıf
    public class AndroidExportInterface {
        @JavascriptInterface
        public void exportVeri(String json) {
            try {
                // İndirilen dosyaların konumunu al
                File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!dir.exists()) dir.mkdirs(); // Eğer klasör yoksa oluştur

                // JSON verisini içeren dosya oluştur
                File file = new File(dir, "gezi-verileri.json");
                FileOutputStream fos = new FileOutputStream(file); // Dosya yazımı için akış
                fos.write(json.getBytes("UTF-8")); // JSON'u yaz
                fos.close();

                System.out.println("✅ JSON dosyası kaydedildi: " + file.getAbsolutePath()); // Başarılı çıktı
            } catch (Exception e) {
                e.printStackTrace(); // Hata durumunda istisna yazdır
            }
        }
    }
            }
