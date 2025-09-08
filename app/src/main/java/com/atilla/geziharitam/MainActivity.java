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
import android.webkit.JavascriptInterface;  // <--- eksik
import android.widget.Toast;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.Manifest;
import android.content.pm.PackageManager;
import java.io.File;                        // File sınıfı için
import java.io.FileOutputStream;
import java.io.InputStream;
import androidx.core.content.FileProvider;  // FileProvider için


public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;

    private AndroidExport androidExport;

    private ActivityResultLauncher<Intent> fileExportLauncher;
    private ActivityResultLauncher<Intent> fileChooserLauncher;
    private ActivityResultLauncher<Intent> photoPickerLauncher;

    private @Nullable String currentPhotoUid = null;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // WebView oluştur ve ata
        webView = new WebView(this);
        setContentView(webView);

        // WebView ayarları
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
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

        // Sayfa yüklenince storage temizliği
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
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

        // 3) Fotoğraf seçme
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
                                if (cursor.moveToFirst()) displayName = cursor.getString(nameIndex);
                                cursor.close();
                            }

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

        // İzin isteme (Android 9 ve 10+ farklı)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
    if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES)
            != PackageManager.PERMISSION_GRANTED) {
        ActivityCompat.requestPermissions(this,
                new String[]{Manifest.permission.READ_MEDIA_IMAGES},
                101);
    }
} else {
    // Android 9-12
    String[] permissions = new String[]{
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
    };
    boolean needRequest = false;
    for (String perm : permissions) {
        if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
            needRequest = true;
        }
    }
    if (needRequest) {
        ActivityCompat.requestPermissions(this, permissions, 101);
    }
        }
        

        // WebView’i temiz başlat
        loadFreshWebView();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 101) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // İzin verildi
            } else {
                Toast.makeText(this, "Fotoğraflara erişim izni reddedildi.", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void loadFreshWebView() {
        if (webView == null) return;

        webView.getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
        webView.clearCache(true);
        webView.clearHistory();

        CookieManager cm = CookieManager.getInstance();
        cm.removeAllCookies(null);
        cm.flush();

        webView.loadUrl("file:///android_asset/index.html?v=4");
    }

    public void startFileExport() {
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, "gezi-verileri.json");
        fileExportLauncher.launch(intent);
    }

    public void startPhotoPicker(String uid) {
        currentPhotoUid = uid;
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("image/*");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        photoPickerLauncher.launch(intent);
    }

  
    @JavascriptInterface
    public void openPhoto(String pathOrUri) {
    try {
        File srcFile;

        if (pathOrUri.startsWith("content://")) {
            // Content resolver'dan oku
            Uri uri = Uri.parse(pathOrUri);
            InputStream is = getContentResolver().openInputStream(uri);
            if (is == null) throw new Exception("Dosya açılamadı");
            srcFile = new File(getCacheDir(), "temp_" + System.currentTimeMillis() + ".jpg");
            FileOutputStream fos = new FileOutputStream(srcFile);
            byte[] buffer = new byte[4096];
            int read;
            while ((read = is.read(buffer)) != -1) {
                fos.write(buffer, 0, read);
            }
            fos.close();
            is.close();
        } else if (pathOrUri.startsWith("file://")) {
            // file:///data/... -> sadece path kısmını al
            srcFile = new File(Uri.parse(pathOrUri).getPath());
        } else {
            // Doğrudan path verilmişse
            srcFile = new File(pathOrUri);
        }

        Uri fileUri;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            fileUri = FileProvider.getUriForFile(
                    this,
                    getPackageName() + ".provider",
                    srcFile
            );
        } else {
            fileUri = Uri.fromFile(srcFile);
        }

        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(fileUri, "image/*");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        if (intent.resolveActivity(getPackageManager()) != null) {
            startActivity(intent);
        } else {
            Toast.makeText(this, "Görüntüleyici uygulama bulunamadı!", Toast.LENGTH_SHORT).show();
        }

    } catch (Exception e) {
        e.printStackTrace();
        Toast.makeText(this, "Fotoğraf açılamadı!", Toast.LENGTH_SHORT).show();
    }
}
                 }
