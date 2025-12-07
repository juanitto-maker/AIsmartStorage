---
name: pwa-to-android-apk
description: Converts a Progressive Web App (PWA) or single-page HTML app into a native Android APK. Use when user wants to package a web app as an Android app, create an APK from HTML/JS/CSS, or wrap a PWA for Android distribution.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# PWA to Android APK Conversion

This skill converts web apps (PWA, single HTML file, or web project) into native Android APKs that work reliably on modern Android devices.

## Quick Start Checklist

Before starting, verify:
- [ ] Web app entry point (usually `index.html` or `Index.html`)
- [ ] Java JDK 17+ installed: `java -version`
- [ ] Target Android API level (recommend: minSdk 24, targetSdk 34)

## Project Structure

Create this structure in your project:

```
your-project/
├── Index.html                    # Your web app (or index.html)
├── android/
│   ├── build.gradle              # Root build config
│   ├── settings.gradle           # Project settings
│   ├── gradle.properties         # Gradle properties
│   └── app/
│       ├── build.gradle          # App build config
│       └── src/main/
│           ├── AndroidManifest.xml
│           ├── assets/
│           │   └── Index.html    # Copy of your web app
│           ├── java/com/yourapp/
│           │   └── MainActivity.java
│           └── res/
│               ├── layout/activity_main.xml
│               ├── values/colors.xml
│               ├── values/strings.xml
│               ├── values/themes.xml
│               ├── values-v28/themes.xml
│               ├── drawable/ic_launcher_background.xml
│               ├── drawable/ic_launcher_foreground.xml
│               └── mipmap-anydpi-v26/ic_launcher.xml
├── .github/
│   └── workflows/
│       └── build-apk.yml         # GitHub Actions workflow
└── releases/
    └── app-release.apk           # Auto-built APK output
```

## Step 1: Android Manifest

Create `android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourcompany.yourapp">

    <!-- Required permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Optional: Add based on your app's needs -->
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <supports-screens
        android:smallScreens="true"
        android:normalScreens="true"
        android:largeScreens="true"
        android:xlargeScreens="true"
        android:anyDensity="true" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.YourApp"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|density|keyboardHidden|keyboard|navigation"
            android:screenOrientation="portrait"
            android:windowSoftInputMode="adjustResize"
            android:launchMode="singleTask"
            android:resizeableActivity="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## Step 2: MainActivity.java

Create `android/app/src/main/java/com/yourcompany/yourapp/MainActivity.java`:

**CRITICAL: Follow these rules to avoid crashes:**
1. Always wrap onCreate in try-catch
2. Add null checks for WebView in ALL lifecycle methods
3. Use anonymous classes instead of lambdas (for dx compatibility)
4. Extend `android.app.Activity`, NOT AppCompatActivity

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
import android.webkit.JavascriptInterface;
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
                Log.e(TAG, "WebView not found in layout");
                showErrorAndFinish("Failed to initialize app: WebView not found");
                return;
            }

            initializeWebView();
            webView.loadUrl("file:///android_asset/Index.html");

        } catch (Exception e) {
            Log.e(TAG, "Error initializing app", e);
            showErrorAndFinish("Failed to start app: " + e.getMessage());
        }
    }

    private void initializeWebView() {
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);

        webView.setBackgroundColor(0xFF111111); // Match your app's background
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
    }

    // IMPORTANT: Use anonymous class, NOT lambda (lambdas break dx compiler)
    private void showErrorAndFinish(String message) {
        try {
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
        } catch (Exception e) {
            Log.e(TAG, "Could not show error dialog", e);
            finish();
        }
    }

    private void setupImmersiveMode() {
        Window window = getWindow();
        window.setStatusBarColor(0xFF111111);
        window.setNavigationBarColor(0xFF111111);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(true);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.setSystemBarsAppearance(0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS);
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            View decorView = window.getDecorView();
            int flags = decorView.getSystemUiVisibility();
            flags = flags & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            decorView.setSystemUiVisibility(flags);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams layoutParams = window.getAttributes();
            layoutParams.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(layoutParams);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        if (webView.canGoBack()) {
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

## Step 3: Layout File

Create `android/app/src/main/res/layout/activity_main.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/root_layout"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fitsSystemWindows="true"
    android:background="#FF111111">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="#FF111111" />

</FrameLayout>
```

## Step 4: Theme Files

Create `android/app/src/main/res/values/themes.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.YourApp" parent="android:Theme.Material.NoActionBar">
        <item name="android:windowFullscreen">false</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:statusBarColor">@color/dark_grey</item>
        <item name="android:navigationBarColor">@color/dark_grey</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowBackground">@color/dark_grey</item>
        <item name="android:fitsSystemWindows">true</item>
    </style>
</resources>
```

Create `android/app/src/main/res/values-v28/themes.xml` (for notch support):

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.YourApp" parent="android:Theme.Material.NoActionBar">
        <item name="android:windowFullscreen">false</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:statusBarColor">@color/dark_grey</item>
        <item name="android:navigationBarColor">@color/dark_grey</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowBackground">@color/dark_grey</item>
        <item name="android:fitsSystemWindows">true</item>
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
    </style>
</resources>
```

Create `android/app/src/main/res/values/colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
    <color name="dark_grey">#111111</color>
</resources>
```

Create `android/app/src/main/res/values/strings.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">YourAppName</string>
</resources>
```

## Step 5: Build Configuration

Create `android/app/build.gradle`:

```gradle
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.yourcompany.yourapp'
    compileSdk 34

    defaultConfig {
        applicationId "com.yourcompany.yourapp"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    signingConfigs {
        release {
            // These are injected by GitHub Actions via command line
            // For local builds, you can set these in local.properties
            if (project.hasProperty('android.injected.signing.store.file')) {
                storeFile file(project.property('android.injected.signing.store.file'))
                storePassword project.property('android.injected.signing.store.password')
                keyAlias project.property('android.injected.signing.key.alias')
                keyPassword project.property('android.injected.signing.key.password')
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            signingConfig signingConfigs.release
        }
        debug {
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    // No external dependencies needed - using platform WebView and Activity
}
```

## Step 6: Build Methods

### Method A: Using Gradle (if Android SDK is installed)

```bash
# Sync web content
cp Index.html android/app/src/main/assets/Index.html

# Set SDK path
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# Build
cd android && ./gradlew assembleDebug

# Copy APK
cp app/build/outputs/apk/debug/app-debug.apk ../YourApp.apk
```

### Method B: Manual Build (when Gradle fails)

Install required tools:
```bash
apt-get install -y android-sdk aapt google-android-build-tools-30.0.3-installer google-android-platform-34-installer
```

Build steps:
```bash
# 1. Generate R.java
cd android/app/src/main
aapt package -f -m -J /tmp/build/gen -M AndroidManifest.xml -S res \
    -I /usr/lib/android-sdk/platforms/android-34/android.jar

# 2. Compile Java (use Java 8 target for dx compatibility)
javac -source 1.8 -target 1.8 \
    -cp /usr/lib/android-sdk/platforms/android-34/android.jar \
    -d /tmp/build/obj \
    /tmp/build/gen/com/yourcompany/yourapp/R.java \
    java/com/yourcompany/yourapp/MainActivity.java

# 3. Create DEX (use dx, not d8, for better compatibility)
/usr/lib/android-sdk/build-tools/30.0.3/dx --dex \
    --min-sdk-version=24 \
    --output=/tmp/build/classes.dex /tmp/build/obj

# 4. Package APK
aapt package -f -M AndroidManifest.xml -S res -A assets \
    -I /usr/lib/android-sdk/platforms/android-34/android.jar \
    -F /tmp/build/app-unaligned.apk

# 5. Add DEX to APK
cd /tmp/build && zip -j app-unaligned.apk classes.dex

# 6. Align APK
zipalign -f 4 app-unaligned.apk app-aligned.apk

# 7. Sign APK
keytool -genkeypair -v -keystore debug.keystore -alias debug \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass android -keypass android \
    -dname "CN=Debug,O=Debug,C=US"

apksigner sign --ks debug.keystore --ks-key-alias debug \
    --ks-pass pass:android --key-pass pass:android \
    --out YourApp.apk app-aligned.apk
```

## Step 7: GitHub Actions Auto-Build (CI/CD)

Automatically rebuild the APK whenever you push changes to GitHub.

### 7.1 Create Signing Keystore (One-Time Setup)

First, generate a release keystore locally or ask Claude to generate one:

```bash
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias release \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=YourApp,O=YourCompany,C=US"
```

Then encode it to base64:
```bash
base64 -w 0 release.keystore > keystore_base64.txt
```

### 7.2 Add GitHub Secrets

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `KEYSTORE_BASE64` | Contents of `keystore_base64.txt` |
| `KEYSTORE_PASSWORD` | Your store password |
| `KEY_ALIAS` | `release` (or your alias) |
| `KEY_PASSWORD` | Your key password |

### 7.3 Create Workflow File

Create `.github/workflows/build-apk.yml`:

```yaml
name: Build APK

on:
  # Trigger on push to main branch
  push:
    branches: [main, master]
    paths:
      - 'src/**'
      - 'public/**'
      - 'index.html'
      - 'Index.html'
      - 'android/**'
      - 'package.json'
      - '.github/workflows/build-apk.yml'
  
  # Allow manual trigger
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Set up Node.js (if package.json exists)
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
        if: hashFiles('package.json') != ''
      
      - name: Install dependencies (if package.json exists)
        run: npm ci
        if: hashFiles('package.json') != ''
      
      - name: Build web app (if build script exists)
        run: npm run build
        if: hashFiles('package.json') != ''
        continue-on-error: true
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
      
      - name: Install Android build tools
        run: |
          sdkmanager "platforms;android-34"
          sdkmanager "build-tools;34.0.0"
      
      - name: Decode Keystore
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/release.keystore
      
      - name: Sync web assets to Android
        run: |
          mkdir -p android/app/src/main/assets
          
          # If dist folder exists (built app), use it
          if [ -d "dist" ]; then
            cp -r dist/* android/app/src/main/assets/
          # Otherwise copy root web files
          elif [ -f "index.html" ]; then
            cp index.html android/app/src/main/assets/
            [ -d "assets" ] && cp -r assets android/app/src/main/assets/
            [ -d "css" ] && cp -r css android/app/src/main/assets/
            [ -d "js" ] && cp -r js android/app/src/main/assets/
          elif [ -f "Index.html" ]; then
            cp Index.html android/app/src/main/assets/
            [ -d "assets" ] && cp -r assets android/app/src/main/assets/
          fi
          
          echo "Assets synced:"
          ls -la android/app/src/main/assets/
      
      - name: Create Gradle wrapper (if missing)
        run: |
          cd android
          if [ ! -f "gradlew" ]; then
            gradle wrapper --gradle-version 8.5
          fi
          chmod +x gradlew
      
      - name: Build Release APK
        run: |
          cd android
          ./gradlew assembleRelease \
            -Pandroid.injected.signing.store.file=${{ github.workspace }}/android/release.keystore \
            -Pandroid.injected.signing.store.password=${{ secrets.KEYSTORE_PASSWORD }} \
            -Pandroid.injected.signing.key.alias=${{ secrets.KEY_ALIAS }} \
            -Pandroid.injected.signing.key.password=${{ secrets.KEY_PASSWORD }}
      
      - name: Copy APK to releases folder
        run: |
          mkdir -p releases
          cp android/app/build/outputs/apk/release/app-release.apk releases/app-release.apk
          
          # Also create a versioned copy
          VERSION=$(date +%Y%m%d-%H%M%S)
          cp releases/app-release.apk releases/app-release-$VERSION.apk
          
          echo "APK_VERSION=$VERSION" >> $GITHUB_ENV
      
      - name: Commit APK to repository
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add releases/app-release.apk
          git commit -m "🤖 Auto-build APK [skip ci]" || echo "No changes to commit"
          git push
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ env.APK_VERSION }}
          name: Release ${{ env.APK_VERSION }}
          body: |
            Automated APK build from commit ${{ github.sha }}
            
            **Download:** `app-release.apk`
          files: |
            releases/app-release.apk
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 7.4 Root Gradle Files

Create `android/build.gradle`:

```gradle
plugins {
    id 'com.android.application' version '8.2.0' apply false
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
```

Create `android/settings.gradle`:

```gradle
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "YourApp"
include ':app'
```

Create `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=false
android.nonTransitiveRClass=true
```

### 7.5 What Triggers a Rebuild

The workflow automatically rebuilds when you push changes to:
- `src/**` - Source code
- `public/**` - Public assets
- `index.html` or `Index.html` - Main HTML file
- `android/**` - Android configuration
- `package.json` - Dependencies
- `.github/workflows/build-apk.yml` - Workflow itself

You can also trigger manually: **Actions** → **Build APK** → **Run workflow**

### 7.6 Where to Find Your APK

After each build:
1. **In repository:** `releases/app-release.apk` (always latest)
2. **GitHub Releases:** Tagged versions with download links

## Common Issues and Solutions

### Issue: "App was built for older version of Android" warning
**Cause:** targetSdk is below the device's recommended level
**Fix:** Set `targetSdk 34` in build.gradle (or higher)

### Issue: App crashes on launch (no error shown)
**Causes and fixes:**
1. **Lambda expressions** - Replace with anonymous classes
2. **Missing null checks** - Add null checks for WebView in all lifecycle methods
3. **Missing try-catch** - Wrap onCreate in try-catch
4. **Missing resources** - Verify all referenced resources exist

### Issue: Display shows in small rectangle
**Fix:** Ensure layout uses `match_parent` and theme has proper window flags

### Issue: d8 compiler fails with NullPointerException
**Cause:** Java 21 bytecode incompatibility with d8
**Fix:** Use `dx` from build-tools 30.0.3 instead of d8, compile with `-source 1.8 -target 1.8`

### Issue: WebView shows white screen
**Fix:** Check that Index.html exists in `assets/` folder and path matches in loadUrl()

### Issue: GitHub Actions build fails - "No such property: storeFile"
**Fix:** Ensure all 4 GitHub Secrets are set correctly (KEYSTORE_BASE64, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD)

### Issue: GitHub Actions - "Permission denied" on push
**Fix:** Go to repo Settings → Actions → General → Workflow permissions → Select "Read and write permissions"

## Icon Resources

Create simple vector icons:

`android/app/src/main/res/drawable/ic_launcher_background.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <path android:fillColor="#111111" android:pathData="M0,0h108v108h-108z"/>
</vector>
```

`android/app/src/main/res/drawable/ic_launcher_foreground.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <path android:fillColor="#FFFFFF"
        android:pathData="M54,54m-30,0a30,30 0,1 1,60 0a30,30 0,1 1,-60 0"/>
</vector>
```

`android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```

## Final Checklist

- [ ] Web app entry point identified (index.html/Index.html)
- [ ] Android folder structure created
- [ ] MainActivity.java uses anonymous classes (not lambdas)
- [ ] All lifecycle methods have null checks
- [ ] Package name consistent across all files
- [ ] Icons created
- [ ] **GitHub Secrets configured** (KEYSTORE_BASE64, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD)
- [ ] **Workflow permissions enabled** (read/write)
- [ ] **releases/ folder exists** (can be empty, will be populated by CI)
