# PWA to Android APK Conversion Guide

> **Updated based on real-world issues encountered during ButterViz APK build**

This guide covers converting web apps (PWA, React, Vue, etc.) into native Android APKs that work reliably offline on modern Android devices.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Critical Issues & Solutions](#critical-issues--solutions)
3. [Project Structure](#project-structure)
4. [Step-by-Step Build Process](#step-by-step-build-process)
5. [Android Configuration Files](#android-configuration-files)
6. [Manual APK Build Commands](#manual-apk-build-commands)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Install Android SDK tools (Ubuntu/Debian)
apt-get update
apt-get install -y android-sdk aapt zipalign apksigner

# Install build-tools with dx (needed for DEX conversion)
apt-get install -y google-android-build-tools-30.0.3-installer

# Install Android platform
apt-get install -y google-android-platform-34-installer

# Verify installation
java -version          # Need JDK 17+
aapt version
```

### Tool Locations

| Tool | Path |
|------|------|
| aapt | `/usr/bin/aapt` |
| dx | `/usr/lib/android-sdk/build-tools/30.0.3/dx` |
| zipalign | `/usr/bin/zipalign` |
| apksigner | `/usr/bin/apksigner` |
| android.jar | `/usr/lib/android-sdk/platforms/android-34/android.jar` |

---

## Critical Issues & Solutions

### Issue 1: CDN Dependencies Don't Work Offline

**Problem:** WebView loads from `file://` protocol, so CDN scripts fail.

```html
<!-- THIS WILL FAIL IN APK -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://esm.sh/react@19.1.0"></script>
```

**Solution:** Bundle all dependencies locally.

```bash
# Download Tailwind CSS
curl -s "https://cdn.tailwindcss.com/3.4.1" -o public/tailwind.min.js
```

```html
<!-- USE LOCAL FILES -->
<script src="./tailwind.min.js"></script>
```

### Issue 2: Absolute Paths Don't Work in WebView

**Problem:** Paths starting with `/` resolve to device root, not app assets.

```javascript
// THIS WILL FAIL
script.src = '/butterchurn/butterchurn.min.js';
// Resolves to: file:///butterchurn/... (doesn't exist)
```

**Solution:** Use relative paths with `./` prefix.

```javascript
// THIS WORKS
script.src = './butterchurn/butterchurn.min.js';
// Resolves to: file:///android_asset/butterchurn/...
```

### Issue 3: Fullscreen API Doesn't Work in WebView

**Problem:** `document.requestFullscreen()` fails in Android WebView.

```javascript
// THIS FAILS SILENTLY
document.documentElement.requestFullscreen();
```

**Solution:** Detect WebView and use CSS-based fullscreen.

```javascript
// Detect Android WebView
const isAndroidWebView = /Android.*wv/.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Android') && !navigator.userAgent.includes('Chrome'));

const handleFullscreen = () => {
  if (isAndroidWebView) {
    // Use CSS-based fullscreen (hide UI elements)
    setIsFullscreen(prev => !prev);
    return;
  }
  // Browser fullscreen API
  document.documentElement.requestFullscreen().catch(() => {
    setIsFullscreen(true); // Fallback
  });
};
```

### Issue 4: Tailwind v4 PostCSS Breaking Changes

**Problem:** Tailwind v4 changed PostCSS plugin setup.

```javascript
// THIS FAILS WITH TAILWIND V4
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},  // ERROR: Plugin moved to @tailwindcss/postcss
  }
}
```

**Solution:** Either use `@tailwindcss/postcss` or bundle CDN version.

```bash
# Option A: Install new plugin
npm install -D @tailwindcss/postcss

# postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  }
}
```

```bash
# Option B: Bundle CDN version (RECOMMENDED for APKs)
curl -s "https://cdn.tailwindcss.com/3.4.1" -o public/tailwind.min.js
# Then include in HTML with config
```

### Issue 5: Import Maps Don't Work Offline

**Problem:** Import maps pointing to CDN fail offline.

```html
<!-- THIS FAILS OFFLINE -->
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@19.1.0"
  }
}
</script>
```

**Solution:** Bundle with Vite/Webpack, don't rely on import maps.

---

## Project Structure

```
your-project/
├── dist/                          # Built web app (copy to assets)
│   ├── index.html
│   ├── assets/
│   │   ├── index-xxx.js
│   │   ├── vendor-xxx.js
│   │   └── index-xxx.css
│   ├── tailwind.min.js            # Bundled Tailwind
│   └── [other-libs]/              # Any other libraries
│
├── android-apk/                   # Android project
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       ├── assets/                # Copy of dist/
│       │   └── [all web files]
│       ├── java/com/yourapp/
│       │   └── MainActivity.java
│       └── res/
│           ├── layout/activity_main.xml
│           ├── values/colors.xml
│           ├── values/strings.xml
│           ├── values/themes.xml
│           ├── values-v28/themes.xml
│           ├── drawable/ic_launcher_background.xml
│           ├── drawable/ic_launcher_foreground.xml
│           └── mipmap-anydpi-v26/ic_launcher.xml
│
└── YourApp.apk                    # Output APK
```

---

## Step-by-Step Build Process

### Step 1: Build Your Web App

```bash
# Build with Vite/Webpack
npm run build

# Copy additional assets to dist
cp public/tailwind.min.js dist/
cp -r public/your-libs dist/
```

### Step 2: Verify Paths in Built HTML

Check `dist/index.html` - all paths must be relative:

```html
<!-- CORRECT -->
<script src="./tailwind.min.js"></script>
<script src="./assets/index-xxx.js"></script>
<link href="./assets/index-xxx.css" rel="stylesheet">

<!-- WRONG -->
<script src="/tailwind.min.js"></script>
```

### Step 3: Create Android Project Structure

```bash
mkdir -p android-apk/app/src/main/{assets,java/com/yourapp,res/{layout,values,values-v28,drawable,mipmap-anydpi-v26}}
```

### Step 4: Copy Web Assets

```bash
cp -r dist/* android-apk/app/src/main/assets/
```

### Step 5: Create Android Files

See [Android Configuration Files](#android-configuration-files) below.

### Step 6: Build APK

See [Manual APK Build Commands](#manual-apk-build-commands) below.

---

## Android Configuration Files

### AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourcompany.yourapp">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:theme="@style/Theme.YourApp"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### MainActivity.java

```java
package com.yourcompany.yourapp;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private static final String TAG = "YourApp";
    private WebView webView;
    private ValueCallback<Uri[]> fileUploadCallback;
    private static final int FILE_CHOOSER_REQUEST_CODE = 1;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            setupImmersiveMode();
        } catch (Exception e) {
            Log.e(TAG, "Error setting up immersive mode", e);
        }

        try {
            setContentView(R.layout.activity_main);
            webView = findViewById(R.id.webview);

            if (webView == null) {
                showErrorAndFinish("WebView not found");
                return;
            }

            initializeWebView();
            webView.loadUrl("file:///android_asset/index.html");

        } catch (Exception e) {
            Log.e(TAG, "Error initializing app", e);
            showErrorAndFinish("Failed to start: " + e.getMessage());
        }
    }

    private void initializeWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);

        webView.setBackgroundColor(0xFF0d0d12); // Match your app's bg

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("file://")) return false;
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage msg) {
                Log.d(TAG, msg.message() + " -- Line " + msg.lineNumber());
                return true;
            }

            @Override
            public boolean onShowFileChooser(WebView webView,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);

                try {
                    startActivityForResult(
                        Intent.createChooser(intent, "Select File"),
                        FILE_CHOOSER_REQUEST_CODE
                    );
                } catch (Exception e) {
                    fileUploadCallback = null;
                    return false;
                }
                return true;
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST_CODE && fileUploadCallback != null) {
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                } else if (data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
            }
            fileUploadCallback.onReceiveValue(results);
            fileUploadCallback = null;
        }
    }

    // IMPORTANT: Use anonymous class, NOT lambda
    private void showErrorAndFinish(String message) {
        new AlertDialog.Builder(this)
            .setTitle("Error")
            .setMessage(message)
            .setPositiveButton("OK", new android.content.DialogInterface.OnClickListener() {
                @Override
                public void onClick(android.content.DialogInterface dialog, int which) {
                    finish();
                }
            })
            .setCancelable(false)
            .show();
    }

    private void setupImmersiveMode() {
        Window window = getWindow();
        window.setStatusBarColor(0xFF0d0d12);
        window.setNavigationBarColor(0xFF0d0d12);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(true);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.setSystemBarsAppearance(0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS);
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams params = window.getAttributes();
            params.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(params);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
```

### activity_main.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#FF0d0d12">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="#FF0d0d12" />
</FrameLayout>
```

### themes.xml (values/)

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.YourApp" parent="android:Theme.Material.NoActionBar">
        <item name="android:windowNoTitle">true</item>
        <item name="android:statusBarColor">@color/background</item>
        <item name="android:navigationBarColor">@color/background</item>
        <item name="android:windowBackground">@color/background</item>
    </style>
</resources>
```

### themes.xml (values-v28/)

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.YourApp" parent="android:Theme.Material.NoActionBar">
        <item name="android:windowNoTitle">true</item>
        <item name="android:statusBarColor">@color/background</item>
        <item name="android:navigationBarColor">@color/background</item>
        <item name="android:windowBackground">@color/background</item>
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
    </style>
</resources>
```

### colors.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="background">#FF0d0d12</color>
    <color name="primary">#FF6366f1</color>
</resources>
```

### strings.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">YourApp</string>
</resources>
```

### Icon Files

**ic_launcher_background.xml** (drawable/):
```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <path android:fillColor="#6366f1" android:pathData="M0,0h108v108h-108z"/>
</vector>
```

**ic_launcher_foreground.xml** (drawable/):
```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <path android:fillColor="#FFFFFF"
        android:pathData="M54,54m-30,0a30,30 0,1 1,60 0a30,30 0,1 1,-60 0"/>
</vector>
```

**ic_launcher.xml** (mipmap-anydpi-v26/):
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```

---

## Manual APK Build Commands

Run these from `android-apk/app/src/main/`:

```bash
# 1. Create build directory
mkdir -p /tmp/apk-build/{gen,obj}

# 2. Generate R.java
aapt package -f -m \
  -J /tmp/apk-build/gen \
  -M AndroidManifest.xml \
  -S res \
  -I /usr/lib/android-sdk/platforms/android-34/android.jar

# 3. Compile Java (use Java 8 target for dx compatibility)
javac -source 1.8 -target 1.8 \
  -cp /usr/lib/android-sdk/platforms/android-34/android.jar \
  -d /tmp/apk-build/obj \
  /tmp/apk-build/gen/com/yourcompany/yourapp/R.java \
  java/com/yourcompany/yourapp/MainActivity.java

# 4. Create DEX file
/usr/lib/android-sdk/build-tools/30.0.3/dx --dex \
  --min-sdk-version=24 \
  --output=/tmp/apk-build/classes.dex \
  /tmp/apk-build/obj

# 5. Package APK
aapt package -f \
  -M AndroidManifest.xml \
  -S res \
  -A assets \
  -I /usr/lib/android-sdk/platforms/android-34/android.jar \
  -F /tmp/apk-build/app-unaligned.apk

# 6. Add DEX to APK
cd /tmp/apk-build && zip -j app-unaligned.apk classes.dex

# 7. Align APK
zipalign -f 4 /tmp/apk-build/app-unaligned.apk /tmp/apk-build/app-aligned.apk

# 8. Generate signing key (first time only)
keytool -genkeypair -v \
  -keystore /tmp/apk-build/debug.keystore \
  -alias debug \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass android -keypass android \
  -dname "CN=YourApp,O=YourCompany,C=US"

# 9. Sign APK
apksigner sign \
  --ks /tmp/apk-build/debug.keystore \
  --ks-key-alias debug \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out YourApp.apk \
  /tmp/apk-build/app-aligned.apk

# 10. Verify
apksigner verify YourApp.apk
ls -la YourApp.apk
```

---

## Troubleshooting

### White Screen on Launch

1. Check `assets/index.html` exists
2. Verify all script paths are relative (`./`)
3. Check Android logcat for JavaScript errors:
   ```bash
   adb logcat | grep -i "yourapp\|webview\|console"
   ```

### Styles Not Loading

1. Ensure Tailwind/CSS is bundled locally
2. Check CSS file path in built HTML
3. Verify CSS file exists in `assets/`

### Scripts Not Loading

1. All paths must be relative: `./script.js` not `/script.js`
2. Dynamic script loading must use relative base:
   ```javascript
   const basePath = './libs/';
   script.src = basePath + 'library.js';
   ```

### Fullscreen Not Working

Use CSS-based fullscreen for WebView:
```javascript
if (navigator.userAgent.includes('Android')) {
  // Toggle CSS classes instead of Fullscreen API
  document.body.classList.toggle('fullscreen-mode');
}
```

### File Picker Not Working

1. Add required permissions in AndroidManifest.xml
2. Implement `onShowFileChooser` in WebChromeClient
3. Handle `onActivityResult` for file results

### App Crashes on Launch

1. Use anonymous classes, not lambdas (dx compatibility)
2. Wrap `onCreate` in try-catch
3. Add null checks for WebView in all lifecycle methods
4. Check logcat for stack trace

---

## Checklist Before Building

- [ ] All CDN dependencies bundled locally
- [ ] All script/asset paths are relative (`./`)
- [ ] Tailwind CSS bundled (not from CDN)
- [ ] Fullscreen uses CSS approach for WebView
- [ ] File picker implemented if needed
- [ ] Android SDK tools installed
- [ ] Package name matches in all files
- [ ] Colors match your app's theme
- [ ] Icons created

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2024-12-07 | Added issues from ButterViz build |
| 1.0 | 2024-12-06 | Initial version |
