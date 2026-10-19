import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gamesbyian.ringroad",
  appName: "Ring Road",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: false },
};

export default config;
