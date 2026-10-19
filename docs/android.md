# Ring Road for Android (Pixel 6 Pro and other modern Android devices)

This build wraps the **same React/TypeScript game** in a native Capacitor 7 WebView. Painted is now the **only production mode** on Android and the public website. The 20-piece reference artwork manifest must validate and decode; on failure a visible retry control appears, never a classic-mode fallback. Gameplay, campaign, touch controls and best scores share one reducer across APK/web.

**Orientation:** The Android Activity is intentionally **not** locked to landscape. The existing game shell rotates 90 degrees in portrait and renders normally in landscape. There is no orientation splash, second portrait UI or browser bar. Immersive system bars may be temporarily revealed by a system edge swipe.

**Offline:** Assets are built into the APK, served within the WebView by Capacitor; there is no live server or required data connection. Game progress/best records use WebView local storage within the installed app.

## Download / install on Pixel

1. Download **[ring-road.apk directly](https://github.com/gamesbyian/Ring-Road/releases/download/android-latest/ring-road.apk)** on your Pixel 6 Pro. This is a real APK file, not a ZIP or a GitHub Actions artifact. No unzipping is needed.
2. Open the APK from Files/Downloads and allow **Install unknown apps** for your browser or file manager if Android requests it. Install and launch **Ring Road**.
3. Test with airplane mode enabled; rotate the phone physically and verify the game stays a single usable landscape composition. Swipe briefly from an edge if you need Android system navigation.

The stable `android-latest` release asset is replaced only after a **successful verified build on `main`**. It is hosted by GitHub Releases, part of this repository, rather than committed to Git history, so future builds do not add megabytes to every clone. Browse the [Android release page](https://github.com/gamesbyian/Ring-Road/releases/tag/android-latest) for its source commit, workflow run and SHA-256 checksum. The direct URL becomes live on the first successful post-merge publishing run. Old GitHub Actions artifacts remain available temporarily for diagnosis.

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

The Capacitor Android project and pinned dependency lockfile are **checked in**. Actions performs a clean `npm ci`, regenerates the relative web bundle, syncs it into the Android project, verifies offline assets, and builds an APK from those sources. Once a successful verified `main` build completes, it replaces `ring-road.apk` on the permanent `android-latest` GitHub Release and records the SHA-256 and commit for reproducibility. The Android APK workflow runs on relevant `main` changes, can validate pull requests without publishing, and also supports manual dispatch.

## Pixel 6 Pro display target

The handset has a 1440×3120 LTPO panel at 19.5:9. The target CSS viewport is **892×412 landscape**, **412×892 portrait** at approximately **DPR 3.5**. The strict browser audit additionally exercises **840×360** for reduced visible height (browser chrome) and **360×840** after CSS rotation. Pixel-width-aware gutters protect left ring arrows and right navigation from screen curves/camera and touch-edge gestures without hiding any controls. Retain no page/stage scrolling and all seven 44×44 CSS-pixel tap targets. Do not force native OS orientation; full-shell CSS rotation remains canonical. The actual device's window and text sizing must still be checked in the APK.

## Required acceptance before calling Android complete

- Native Gradle `assembleDebug` passes, the APK identity/signature/bundled art checks pass, and the stable GitHub Release hosts a directly downloadable `ring-road.apk` asset.
- A Pixel 6 Pro opens the app offline with the complete painted art and no classic fallback; forced asset failure shows recovery instructions and retry instead of a half-rendered scene.
- Both physical orientations keep the entire game visible without stage/page scrolling or extra orientation UI.
- All 14 rotation controls, center fire, Undo, Reset, Hint, Solution, previous/next puzzle and guide operate by actual touch.
- Modal and Android hardware/gesture Back correctly close a dialog, and Back at the main game minimizes the app.
- Safe-area/camera cutout and translucent navigation overlays do not prevent interaction; text remains readable at the phone's density/font settings.
- Best records persist after app relaunch, and accessibility/reduced-motion behavior remains functional.

Web simulation, CI's built APK, and a Pixel hardware acceptance are three **different** evidence levels. Do not claim physical Pixel validation solely from Gradle or Chrome tests.

**Important open hardware issue:** Previous physical Android screenshots of painted mode showed missing/flickering ring/control layers and a blank-looking rotated Guide. Chrome/SwiftShader CI passing does not establish that real Pixel compositing is fixed. Retest on the physical Pixel before signoff; capture screenshots of the complete seven colors, real touches and rotated modal.
