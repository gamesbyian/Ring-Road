import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";

const APP_PORT = 4173;
const APP_URL = `http://127.0.0.1:${APP_PORT}/Ring-Road/`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForUrl(url, attempts = 200, delay = 100) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (error) {
      lastError = error;
    }
    await sleep(delay);
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

async function createCdpClient(port) {
  const response = await waitForUrl(`http://127.0.0.1:${port}/json`);
  const targets = await response.json();
  const page = targets.find((target) => target.type === "page");
  if (!page?.webSocketDebuggerUrl) throw new Error("Chrome did not expose a page target");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Browser evaluation failed");
    return result.result?.value;
  };
  return { send, evaluate, close: () => socket.close() };
}

async function capture({ width, height, mobile, port, filename }) {
  const userDataDir = `/tmp/ring-road-capture-${port}`;
  await rm(userDataDir, { recursive: true, force: true });
  const chrome = spawn("google-chrome", [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], { stdio: "ignore" });

  let cdp;
  try {
    cdp = await createCdpClient(port);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
    await cdp.send("Page.navigate", { url: APP_URL });
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (await cdp.evaluate("document.readyState === 'complete' && Boolean(document.querySelector('main'))")) break;
      await sleep(50);
    }
    await cdp.evaluate("document.querySelector('.modal-footer button')?.click()");
    await sleep(700);
    const result = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    await writeFile(filename, Buffer.from(result.data, "base64"));
  } finally {
    cdp?.close();
    if (chrome.exitCode === null) {
      chrome.kill("SIGTERM");
      await Promise.race([
        new Promise((resolve) => chrome.once("close", resolve)),
        sleep(1500),
      ]);
    }
    await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

await mkdir("artifacts/diorama-audit", { recursive: true });
const server = spawn("node_modules/.bin/vite", ["preview", "--host", "127.0.0.1", "--port", String(APP_PORT), "--strictPort"], {
  stdio: "ignore",
});
try {
  await waitForUrl(APP_URL);
  await capture({
    width: 390,
    height: 844,
    mobile: true,
    port: 9322,
    filename: "artifacts/diorama-audit/mobile-390x844.png",
  });
  await capture({
    width: 1440,
    height: 1000,
    mobile: false,
    port: 9323,
    filename: "artifacts/diorama-audit/desktop-1440x1000.png",
  });
  console.log("Canonical diorama screenshots captured.");
} finally {
  server.kill("SIGTERM");
}
