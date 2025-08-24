package com.atilla.geziharitam;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.annotation.SuppressLint;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @SuppressLint("JavascriptInterface")
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private AndroidExport androidExport;

    private ActivityResultLauncher<Intent> fileExportLauncher;
    private ActivityResultLauncher<Intent> fileChooserLauncher;
    private ActivityResultLauncher<Intent> photoPickerLauncher;

    private String currentPhotoUid = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);

        // ---------------- WebView cache temizleme ve LOAD_NO_CACHE ----------------
        loadFreshWebView();
        // --------------------------------------------------------------------------

        webView.setWebViewClient(new WebViewClient());

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView,
                                             ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                MainActivity.this.filePathCallback = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                fileChooserLauncher.launch(intent);
                return true;
            }
        });

        androidExport = new AndroidExport(this, webView);
        webView.addJavascriptInterface(androidExport, "AndroidExport");

        /* -------- File chooser (input type=file) -------- */
        fileChooserLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                (ActivityResult result) -> {
                    if (filePathCallback != null) {
                        Uri[] results = null;
                        if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                            Uri dataUri = result.getData().getData();
                            if (dataUri != null) {
                                results = new Uri[]{dataUri};
                            }
                        }
                        filePathCallback.onReceiveValue(results);
                        filePathCallback = null;
                    }
                }
        );

        /* -------- JSON dışa aktarma -------- */
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

        /* -------- Fotoğraf seçme (AndroidExport.pickPhoto ile tetiklenir) -------- */
        photoPickerLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        Uri uri = result.getData().getData();
                        if (uri != null) {
                            String displayName = "";
                            Cursor cursor = getContentResolver().query(uri, null, null, null, null);
                            if (cursor != null) {
                                int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                                if (cursor.moveToFirst()) {
                                    displayName = cursor.getString(nameIndex);
                                }
                                cursor.close();
                            }

                            try {
                                getContentResolver().takePersistableUriPermission(
                                        uri, Intent.FLAG_GRANT_READ_URI_PERMISSION
                                );
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
    }

    /* -------- WebView’i her açılışta güncel yükleyen metod -------- */
    private void loadFreshWebView() {
        if (webView != null) {
            // 1. Cache ve history temizle
            webView.clearCache(true);
            webView.clearHistory();

            // 2. App cache devre dışı
            WebSettings settings = webView.getSettings();
            settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
           // settings.setAppCacheEnabled(false);

            // 3. LocalStorage ve SessionStorage temizle
            webView.evaluateJavascript(
                    "window.localStorage.clear(); window.sessionStorage.clear();",
                    null
            );

            // 4. Çerezleri temizle
            android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
            cookieManager.removeAllCookies(null);
            cookieManager.flush();

            // 5. Güncel index.html’i yükle
            webView.loadUrl("file:///android_asset/index.html");
        }
    }

    /* -------- JSON dışa aktarma başlat -------- */
    public void startFileExport() {
        Log.d("MainActivity", "startFileExport() çağrıldı");

        if (fileExportLauncher == null) {
            runOnUiThread(() ->
                    Toast.makeText(this, "Dosya oluşturucu hazır değil!", Toast.LENGTH_SHORT).show()
            );
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, "gezi-verileri.json");
        fileExportLauncher.launch(intent);
    }

    /* -------- Fotoğraf seçme başlat (UID ile) -------- */
    public void startPhotoPicker(String uid) {
        Log.d("MainActivity", "startPhotoPicker() çağrıldı, UID: " + uid);
        currentPhotoUid = uid;

        if (photoPickerLauncher == null) {
            runOnUiThread(() ->
                    Toast.makeText(this, "Fotoğraf seçici hazır değil!", Toast.LENGTH_SHORT).show()
            );
            return;
        }

        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("image/*");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        photoPickerLauncher.launch(intent);
    }

    /* -------- Fotoğraf açma -------- */
    public void openPhoto(String pathOrUri) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(Uri.parse(pathOrUri), "image/*");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "Fotoğraf açılamadı!", Toast.LENGTH_SHORT).show();
            e.printStackTrace();
        }
    }

    /* -------- JS üzerinden WebView yeniden yükleme -------- */
    @JavascriptInterface
    public void reloadWebView() {
        runOnUiThread(this::loadFreshWebView);
    }
                                    }
