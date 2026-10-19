# Android build and installation

The Android edition bundles the production Vite app with Capacitor. No remote website is needed during play. The existing CSS-rotated landscape presentation is retained, even when the physical device is portrait.

## Prerequisites

Node 22+, Java 21, and an Android SDK with an installed platform/build-tools version compatible with the Capacitor Android project.

## First-time native project generation

Run `npm ci`, `npm run build:android`, `npx cap add android`, and `npx cap sync android`. Commit the generated `android/` directory (except build output and local machine files). Subsequent builds use `npm run build:android && npx cap sync android && cd android && ./gradlew assembleDebug`.

The GitHub Actions Android APK workflow uploads `app-debug.apk` as a downloadable artifact after a successful run. In GitHub, open **Actions → Android APK → latest successful run → Artifacts**. Download and extract the ZIP, then open the APK on your Pixel and permit installation from that source if Android requests it. Debug APKs are for sideload testing, not Play Store distribution.

## Release criteria

Verify offline launch, touch interactions for all rings, painted mode selection and asset decoding, guide and completion modals, storage persistence, back-button handling, and portrait-to-landscape rotation on a physical Pixel 6 Pro. Native status/navigation bars must not obscure the controls. This first pipeline requires the committed generated Android project before it can pass.
