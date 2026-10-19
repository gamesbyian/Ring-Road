import { App as NativeApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/** Android's system Back closes the active game dialog before leaving the app.
 * The browser build retains its own Escape and navigation semantics. */
export function registerAndroidBackButton(): void {
  if (!Capacitor.isNativePlatform()) return;

  void NativeApp.addListener("backButton", () => {
    if (document.querySelector('[role="dialog"]')) {
      // Modal already owns keyboard Escape, focus return, and reducer actions.
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    } else {
      // Go to the home screen instead of destroying the game WebView/session.
      void NativeApp.minimizeApp();
    }
  });
}
