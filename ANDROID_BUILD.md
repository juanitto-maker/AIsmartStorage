# Android Build Instructions

This document explains how to build the Smart Storage AI APK.

## Prerequisites

1. **Android SDK** (API Level 24+)
2. **Android NDK** (r25 or later)
3. **Rust with Android targets**:
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
   ```
4. **Tauri CLI** (v2.0+):
   ```bash
   cargo install tauri-cli --version "^2.0"
   ```

## Setup

### 1. Initialize Android Project

```bash
cargo tauri android init
```

This creates the `src-tauri/gen/android` directory with the Android project.

### 2. Configure Android Manifest

After initialization, edit `src-tauri/gen/android/app/src/main/AndroidManifest.xml` to add the Internet permission:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Add this line for model download -->
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:usesCleartextTraffic="true"
        ...>
        <!-- rest of the manifest -->
    </application>
</manifest>
```

### 3. Build Debug APK

```bash
cargo tauri android build --debug
```

The APK will be generated at:
`src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk`

### 4. Build Release APK

```bash
cargo tauri android build --release
```

## Model Download Behavior

On first launch, the app will:
1. Check if the AI model exists in app data
2. If not found, show a download dialog
3. Download the ~92MB model from HuggingFace
4. Verify the SHA256 checksum
5. Save to app data directory (persists across app updates)

After the initial download, the app works fully offline.

## Troubleshooting

### Download fails
- Check internet connection
- Ensure the device has at least 200MB free space
- Try on a stable WiFi connection

### App crashes on startup
- Check logcat for errors: `adb logcat | grep -i tauri`
- Ensure minimum SDK is 24 (Android 7.0)

### Model checksum mismatch
- Delete app data and retry
- Check if HuggingFace URL is accessible in your region

## APK Size

- **APK size**: ~15-20MB (without model)
- **Model size**: ~92MB (downloaded on first launch)
- **Total app footprint**: ~110MB after first launch
