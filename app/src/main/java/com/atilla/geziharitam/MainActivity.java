package com.atilla.geziharitam;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Log;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback; // <input type="file"> için

    private AndroidExport androidExport;

    private ActivityResultLauncher<Intent> fileExportLauncher;  // JSON dışa aktarma
    private ActivityResultLauncher<Intent> fileChooserLauncher; // <input type="file">
    private ActivityResultLauncher<Intent> photoPickerLauncher; // AndroidExport.pickPhoto

    private @Nullable String currentPhotoUid = null;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // WebView oluştur ve ata
        webView = new WebView(this);
        setContentView(webView);

        // (Debug’da açık, release’de kapalı) – optional
       // WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

        // WebView ayarları
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Güvenlik: gerekmedikçe kapalı tut (yerel dosyalar arası erişim).
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);

        // Cache’i kapat
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        // JS köprüsü
        androidExport = new AndroidExport(this, webView);
        webView.addJavascriptInterface(androidExport, "AndroidExport");

        // File input chooser
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView,
                                             ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                MainActivity.this.filePathCallback = filePathCallback;
                try {
                    Intent intent = fileChooserParams.createIntent();
                    fileChooserLauncher.launch(intent);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Dosya seçici açılamadı.", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        // Sayfa yüklenince storage temizliği (garantili an)
        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Local & Session Storage temizliği – ilk yüklemede tetiklenir
                webView.evaluateJavascript(
                        "try{localStorage.clear();sessionStorage.clear();}catch(e){}",
                        null
                );
            }
        });

        // --- Activity Result kayıtları ---

        // 1) <input type="file"> için
        fileChooserLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                (ActivityResult result) -> {
                    if (filePathCallback != null) {
                        Uri[] results = null;
                        if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                            Uri dataUri = result.getData().getData();
                            if (dataUri != null) results = new Uri[]{dataUri};
                        }
                        filePathCallback.onReceiveValue(results);
                        filePathCallback = null;
                    }
                }
        );

        // 2) JSON dışa aktarma
        fileExportLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        Uri uri = result.getData().getData();
                        if (uri != null) {
                            androidExport.onFileSelectedToSave(uri);
                        }
                    }
                }
        );

        // 3) Fotoğraf seçme (AndroidExport.pickPhoto → startPhotoPicker)
        photoPickerLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        Uri uri = result.getData().getData();
                        if (uri != null) {
                            // Görünen dosya adını al
                            String displayName = "";
                            Cursor cursor = getContentResolver().query(uri, null, null, null, null);
                            if (cursor != null) {
                                int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                                if (cursor.moveToFirst()) displayName = cursor.getString(nameIndex);
                                cursor.close();
                            }

                            // Kalıcı okuma izni
                            try {
                                final int flags = Intent.FLAG_GRANT_READ_URI_PERMISSION;
                                getContentResolver().takePersistableUriPermission(uri, flags);
                            } catch (Exception e) {
                                Log.w("MainActivity", "Persistable URI izin alınamadı: " + e.getMessage());
                            }

                            if (currentPhotoUid != null) {
                                androidExport.onPhotoPicked(currentPhotoUid, uri, displayName);
                                currentPhotoUid = null;
                            }
                        }
                    }
                }
        );

        // Her açılışta WebView’i temiz başlat
        loadFreshWebView();
    }

    /* ----------------- WebView’i temiz başlat ------------------ */
    private void loadFreshWebView() {
        if (webView == null) return;

        // 1) WebView cache & history temizle
        webView.clearCache(true);
        webView.clearHistory();

        // 2) Tüm çerezleri temizle
        CookieManager cm = CookieManager.getInstance();
        cm.removeAllCookies(null);
        cm.flush();

        // 3) Güncel index.html (cache busting için versiyon parametresi)
        webView.loadUrl("file:///android_asset/index.html?v=4")+ System.currentTimeMillis());
    }

    /* --------------- JSON dışa aktarma başlat ------------------ */
    public void startFileExport() {
        Log.d("MainActivity", "startFileExport() çağrıldı");
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, "gezi-verileri.json");
        fileExportLauncher.launch(intent);
    }

    /* --------------- Fotoğraf seçme başlat --------------------- */
    public void startPhotoPicker(String uid) {
        Log.d("MainActivity", "startPhotoPicker() çağrıldı, UID: " + uid);
        currentPhotoUid = uid;
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("image/*");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        photoPickerLauncher.launch(intent);
    }

    /* -------------------- Fotoğraf aç -------------------------- */
    public void openPhoto(String pathOrUri) {
        try {
            Uri uri = Uri.parse(pathOrUri);

            // content:// → doğrudan aç
            if ("content".equalsIgnoreCase(uri.getScheme())) {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(uri, "image/*");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(intent);
                return;
            }

            // http/https → tarayıcı/görüntüleyici
            if ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(intent);
                return;
            }

            // file:// (gerekirse FileProvider kullanın – Manifest notu aşağıda)
            if ("file".equalsIgnoreCase(uri.getScheme())) {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(uri, "image/*");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(intent);
                return;
            }

            // Şema yoksa dene (olası relative)
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "image/*");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(intent);

        } catch (Exception e) {
            Toast.makeText(this, "Fotoğraf açılamadı!", Toast.LENGTH_SHORT).show();
            e.printStackTrace();
        }
    }
                }
