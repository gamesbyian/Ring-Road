# Ring Road for Android (Pixel 6 Pro and other modern Android devices)

This build wraps the **same React/TypeScript game** in a native Capacitor 7 WebView. Gameplay, campaign, touch controls, best scores, and the classic fallback are shared with the web edition. Android launches into the in-development **painted** presentation when the bundled WebPs decode. A failed art decode falls back to classic; the public website retains its classic default until visual signoff.

**Orientation:** The Android Activity is intentionally **not** locked to landscape. The existing game shell rotates 90 degrees in portrait and renders normally in landscape. There is no orientation splash, second portrait UI or browser bar. Immersive system bars may be temporarily revealed by a system edge swipe.

**Offline:** Assets are built into the APK, served within the WebView by Capacitor; there is no live server or required data connection. Game progress/best records use WebView local storage within the installed app.

## Download / install on Pixel

1. Open **[GitHub Actions → Android APK](https://github.com/gamesbyian/Ring-Road/actions/workflows/android-apk.yml)**, choose the latest **successful** run from `main`, and find **Artifacts**.
2. Download `ring-road-android-debug-apk` (a ZIP archive), unzip, and transfer the enclosed `app-debug.apk` to your Pixel 6 Pro. GitHub may ask you to sign in before downloading an artifact.
3. On the phone, open the APK in Files/Downloads and allow **Install unknown apps** for the file manager/browser when Android asks. Install and launch **Ring Road**.
4. Test with airplane mode enabled; rotate the phone physically and verify the screen stays a single usable landscape game. Swipe briefly from an edge if you need Android system navigation.

This is a **sideloadable debug build**, not a Play Store release. The runner may use a different debug signing key from a prior run: if Android says the update's certificate is incompatible, uninstall the previous debug build and reinstall (which clears locally stored best scores). Stable release signing is a separate release step, using a securely stored key.

## Developer commands

Dependencies: Node >=22.12, Java 21, Android SDK (API 35/build tools), Gradle downloads and Android SDK licenses accepted.

```sh
npm ci
npm run check
npm run android:apk
# output: android/app/build/outputs/apk/debug/app-debug.apk
```

`npm run build:android` creates a separate Vite bundle with **relative** asset paths, preserving the web release's `/Ring-Road/` base. `npm run android:prepare` adds the native Android project if missing, syncs compiled assets and plugins, and deterministically configures immersive native bars while leaving device orientation free. `node scripts/check-android-bundle.mjs` asserts bundled offline HTML and the painted WebPs. Normal web `npm run build` and GitHub Pages are unchanged.

The Capacitor Android project and pinned dependency lockfile are **checked in**. Actions performs a clean `npm ci`, regenerates the relative web bundle, syncs it into the Android project, verifies offline assets, and builds an APK from those sources. The Android APK workflow runs on relevant `main` changes, can validate pull requests, and also supports manual dispatch.

## Required acceptance before calling Android complete

- Native Gradle `assembleDebug` passes and GitHub retains an installable APK artifact.
- A Pixel 6 Pro opens the app with mobile data/Wi-Fi disabled, with painted art and its fallback available offline.
- Both physical orientations keep the entire game visible without stage/page scrolling or extra orientation UI.
- All 14 rotation controls, center fire, Undo, Reset, Hint, Solution, previous/next puzzle and guide operate by actual touch.
- Modal and Android hardware/gesture Back correctly close a dialog, and Back at the main game minimizes the app.
- Safe-area/camera cutout and translucent navigation overlays do not prevent interaction; text remains readable at the phone's density/font settings.
- Best records persist after app relaunch, and accessibility/reduced-motion behavior remains functional.

Web simulation, CI's built APK, and a Pixel hardware acceptance are three **different** evidence levels. Do not claim physical Pixel validation solely from Gradle or Chrome tests.
