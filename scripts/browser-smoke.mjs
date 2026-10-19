#!/usr/bin/env node
/**
 * Production browser smoke uses the one shipping painted renderer.
 * Reuse the strict CDP coordinate-click + exact-route + modal + viewport
 * audit rather than maintaining a second, stale classic-only test harness.
 * --smoke retains the primary Pixel, rotated and compact sizes plus the
 * native reference registration. Any failure propagates to the calling CI.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./visual-viewport-audit.mjs", import.meta.url));
const child = spawn(process.execPath,
  [script, "--strict", "--smoke", "--out", "artifacts/screenshots"],
  { stdio: "inherit" });
child.on("error", (error) => {
  console.error("painted browser smoke failed to start:", error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) console.error("painted browser smoke terminated:", signal);
  process.exitCode = code ?? 1;
});
