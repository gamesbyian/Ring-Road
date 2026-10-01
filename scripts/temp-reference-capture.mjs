import { spawn } from "node:child_process";
import { writeFile, rm } from "node:fs/promises";

const APP_URL = "http://127.0.0.1:4173/Ring-Road/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitJson(url) {
  for (let i = 0; i < 100; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch {}
    await sleep(100);
  }
  throw new Error("Chrome CDP did not become ready");
}

async function capture(width, height, port, output) {
  const profile = `/tmp/ring-road-capture-${port}`;
  const chrome = spawn("google-chrome", [
    "--headless", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    APP_URL,
  ], { stdio: "ignore" });

  try {
    const targets = await waitJson(`http://127.0.0.1:${port}/json`);
    const page = targets.find((t) => t.type === "page");
    if (!page?.webSocketDebuggerUrl) throw new Error("No page target");
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    let id = 1;
    const pending = new Map();
    socket.addEventListener("message", (event) => {
      const msg = JSON.parse(String(event.data));
      const waiter = pending.get(msg.id);
      if (!waiter) return;
      pending.delete(msg.id);
      msg.error ? waiter.reject(new Error(msg.error.message)) : waiter.resolve(msg.result);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const callId = id++;
      pending.set(callId, { resolve, reject });
      socket.send(JSON.stringify({ id: callId, method, params }));
    });
    const evaluate = async (expression) => {
      const res = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      return res.result?.value;
    };

    for (let i = 0; i < 100; i += 1) {
      if (await evaluate("document.querySelector('.modal-footer button')?.textContent === 'Play'")) break;
      await sleep(50);
    }
    await evaluate("document.querySelector('.modal-footer button')?.click()");
    await sleep(650);
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true,
    });
    await writeFile(output, Buffer.from(shot.data, "base64"));
    socket.close();
  } finally {
    chrome.kill("SIGTERM");
    await sleep(250);
    await rm(profile, { recursive: true, force: true });
  }
}

await capture(1440, 1000, 9331, "desktop-1440x1000.png");
await capture(390, 844, 9332, "mobile-390x844.png");
