import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

// Reproducible project creation on first build; later runs reuse committed
// native sources and sync the latest web game rather than a remote website.
if (!existsSync("dist/index.html")) {
  throw new Error("Build the offline web bundle first: npm run build:android");
}

function capacitor(...args) {
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx",
    ["--no-install", "cap", ...args], { stdio: "inherit" });
}

if (!existsSync("android/gradlew")) capacitor("add", "android");
capacitor("sync", "android");

// Native immersive mode gives the user the whole display without forcing an
// OS orientation. Our existing CSS owns landscape-only / portrait-sideways UI.
// Implemented here so it is checked into the native project by CI, yet is
// refreshed deterministically if Capacitor's generated class ever changes.
const activityPath = "android/app/src/main/java/com/gamesbyian/ringroad/MainActivity.java";
const activity = `package com.gamesbyian.ringroad;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enterImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enterImmersiveMode();
    }

    private void enterImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
            getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }
}
`;
await mkdir(dirname(activityPath), { recursive: true });
await writeFile(activityPath, activity);

const manifest = await readFile("android/app/src/main/AndroidManifest.xml", "utf8");
if (/android:screenOrientation\s*=/.test(manifest)) {
  throw new Error("Android activity must not force landscape: CSS rotates the whole game in portrait");
}
console.log("Android native project prepared; OS orientation remains free, system bars immersive.");
