import type { CapacitorConfig } from "@capacitor/cli";

// The WebView hosts bundled assets locally: no dev server, no network dependency.
// Do NOT lock native orientation. CSS rotates the entire game 90° in portrait.
const config: CapacitorConfig = {
  appId: "com.gamesbyian.ringroad",
  appName: "Ring Road",
  webDir: "dist",
  android: { allowMixedContent: false },
};

export default config;
