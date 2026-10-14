#!/usr/bin/env node
/** Phone-sized zero-scroll and screenshot audit. Node 22, Chrome, no new npm deps. */
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
function option(flag, defaultValue) {
  const index = args.indexOf(flag);
  return index < 0 ? defaultValue : args[index + 1];
}
const out = option("--out", "artifacts/visual-viewport-audit");
const externalUrl = option("--url", null);
const skin = option("--skin", "classic");
if (!["classic", "painted"].includes(skin)) throw new Error("--skin must be classic or painted");
const targetUrl = new URL(externalUrl || "http://127.0.0.1:4173/Ring-Road/");
if (skin === "painted") targetUrl.searchParams.set("skin", "painted");
const url = targetUrl.href;
const spec = JSON.parse(await readFile(new URL("../docs/reference-regions.json", import.meta.url), "utf8"));
const sizes = [...spec.phoneViewports, ...spec.otherViewports];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function awaitHttp(url, attempts = 120) {
  for (let i = 0; i < attempts; i++) {
    try { if ((await fetch(url)).ok) return await Promise.resolve(); } catch { /* wait */ }
    await delay(100);
  }
  throw new Error("URL unavailable: " + url);
}

async function connect(port) {
  let page;
  for (let i = 0; i < 120; i++) {
    try {
      const response = await fetch("http://127.0.0.1:" + port + "/json");
      const pages = await response.json();
      page = pages.find((x) => x.type === "page");
      if (page?.webSocketDebuggerUrl) break;
    } catch { /* wait */ }
    await delay(100);
  }
  if (!page?.webSocketDebuggerUrl) throw new Error("Chrome CDP did not appear");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, {once: true});
    socket.addEventListener("error", reject, {once: true});
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const value = JSON.parse(String(event.data));
    if (!value.id || !pending.has(value.id)) return;
    const pair = pending.get(value.id);
    pending.delete(value.id);
    if (value.error) pair.reject(new Error(value.error.message));
    else pair.resolve(value.result);
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, {resolve, reject});
      socket.send(JSON.stringify({id, method, params}));
    });
  }
  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", {expression, awaitPromise: true, returnByValue: true});
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result?.value;
  }
  return {send, evaluate, close: () => socket.close()};
}

function inspectDOM(requestedSkin) {
  const painted = Boolean(document.querySelector(".painted-stage-host"));
  const selectors = painted ? [
    ".painted-stage-host", ".painted-stage", ".painted-title-slot", ".painted-ring-board",
    ".painted-control-slot", ".ring-controls", ".painted-navigation-slot",
    ".painted-goal-slot", ".painted-moves-slot", ".painted-solution-slot", ".painted-status-slot"
  ] : [
    ".scene-title-slot", ".board-frame", ".ring-controls", ".scene-navigation-slot",
    ".reference-goal-card", ".reference-solution-card", ".reference-moves-card", ".puzzle-plaque"
  ];
  const width = window.innerWidth, height = window.innerHeight, portrait = height > width;
  const rectInfo = (rect) => ({left: rect.left, top: rect.top, right: rect.right,
    bottom: rect.bottom, width: rect.width, height: rect.height});
  const fits = (r) => r.left >= -2 && r.top >= -2 && r.right <= width + 2 && r.bottom <= height + 2;
  const regions = selectors.map((selector) => {
    const element = document.querySelector(selector);
    if (!element) return {selector, missing: true, fits: false};
    const rect = element.getBoundingClientRect();
    return {selector, missing: false, rect: rectInfo(rect), fits: fits(rect)};
  });
  const buttons = Array.from(document.querySelectorAll("button")).flatMap((button) => {
    const rect = button.getBoundingClientRect();
    const style = getComputedStyle(button);
    if (!rect.width || !rect.height || style.display === "none" || style.visibility === "hidden") return [];
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const top = x >= 0 && x < width && y >= 0 && y < height ? document.elementFromPoint(x, y) : null;
    return [{
      label: button.getAttribute("aria-label") || button.textContent.trim(),
      rect: rectInfo(rect), fits: fits(rect), min44: rect.width >= 44 && rect.height >= 44,
      centerHit: Boolean(top && (top === button || button.contains(top)))
    }];
  });
  const scrollTargets = painted
    ? ["html", "body", "#root", ".app-shell"]
    : ["html", "body", "#root", ".app-shell", ".diorama-scene"];
  const scroll = Object.fromEntries(scrollTargets.map((selector) => {
    const element = selector === "html" ? document.documentElement : document.querySelector(selector);
    if (!element) return [selector, {missing: true}];
    const style = getComputedStyle(element);
    return [selector, {
      clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight, scrollHeight: element.scrollHeight,
      overflowX: style.overflowX, overflowY: style.overflowY,
      excessX: element.scrollWidth > element.clientWidth + 2,
      excessY: element.scrollHeight > element.clientHeight + 2
    }];
  }));
  const shell = document.querySelector(".app-shell");
  const shellRect = shell?.getBoundingClientRect();
  const shellFits = !!shellRect && fits(shellRect)
    && Math.abs(shellRect.width - width) <= 3 && Math.abs(shellRect.height - height) <= 3;
  const rotated = shell ? getComputedStyle(shell).transform !== "none" : false;
  const art = Array.from(document.querySelectorAll(painted
    ? ".painted-stage img"
    : ".scene-art img"));
  const artLoaded = art.length >= (painted ? 8 : 3) &&
    art.every((img) => img.complete && img.naturalWidth > 0);
  const currentSkin = shell?.getAttribute("data-skin-mode") || "unknown";
  const skinStatus = shell?.getAttribute("data-skin-status") || "unknown";
  const relevantStage = document.querySelector(painted ? ".painted-stage" : ".diorama-scene");
  const stageRect = relevantStage?.getBoundingClientRect();
  const stageFits = !!stageRect && fits(stageRect) &&
    Math.abs(stageRect.width - width) <= 4 &&
    Math.abs(stageRect.height - height) <= 4;
  const readyRows = Array.from(document.querySelectorAll(".ring-control")).every(
    (row) => getComputedStyle(row).visibility !== "hidden");
  const failures = [
    ...(requestedSkin !== currentSkin ? ["requested skin not activated (" + skinStatus + ")"] : []),
    ...(rotated !== portrait ? ["rotation"] : []),
    ...(!stageFits ? ["game stage does not fit physical viewport"] : []),
    ...(!readyRows ? ["missing/hidden ring row"] : []),
    ...(!shellFits ? ["shell does not fit viewport"] : []),
    ...(document.querySelectorAll(".ring-control").length !== 7 ? ["not seven controls"] : []),
    ...(!artLoaded ? ["art not loaded"] : []),
    ...(document.querySelector(".modal") ? ["guide still open"] : []),
    ...(scrollTargets.filter(
      (k) => scroll[k]?.excessY || scroll[k]?.excessX).map((k) => "content exceeds " + k)),
    ...regions.filter((r) => !r.fits).map((r) => "region outside: " + r.selector),
    ...buttons.filter((b) => !b.fits).map((b) => "clipped button: " + b.label),
    ...buttons.filter((b) => !b.min44).map((b) => "undersized button: " + b.label),
    ...buttons.filter((b) => !b.centerHit).map((b) => "obstructed center hit: " + b.label),
  ];
  return {viewport: {width, height}, portrait, painted, currentSkin, skinStatus,
    rotated, shellFits, stageFits, stageRect: stageRect ? rectInfo(stageRect) : null,
    visualViewport: window.visualViewport ? {
      width: window.visualViewport.width, height: window.visualViewport.height,
      scale: window.visualViewport.scale
    } : null, regions, buttons, scroll, artLoaded, failures};
}

let preview, chrome, cdp;
const temp = await mkdtemp(join(tmpdir(), "ring-road-visual-"));
const port = 22000 + (process.pid % 30000);
try {
  if (!externalUrl) {
    preview = spawn(process.execPath, [
      "node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1",
      "--port", "4173", "--strictPort"
    ], {stdio: "ignore"});
  }
  await awaitHttp(url);
  chrome = spawn(process.env.CHROME_BIN || "google-chrome", [
    "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    "--remote-debugging-port=" + port, "--user-data-dir=" + temp, "about:blank"
  ], {stdio: "ignore"});
  cdp = await connect(port);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await mkdir(out, {recursive: true});
  const captures = [];
  for (const [width, height] of sizes) {
    const portrait = height > width;
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width, height, mobile: true, deviceScaleFactor: 1,
      screenOrientation: {type: portrait ? "portraitPrimary" : "landscapePrimary", angle: portrait ? 0 : 90}
    });
    await cdp.send("Page.navigate", {url});
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await cdp.evaluate("document.readyState === 'complete' && !!document.querySelector('.ring-control')")) break;
      if (attempt === 99) throw new Error("Timed out waiting for app at " + width + "x" + height);
      await delay(60);
    }
    if (skin === "painted") {
      // The app deliberately refuses to activate if any of the 20 art files
      // fail to load; never mistake its fallback scene for a passing paint run.
      for (let attempt = 0; attempt < 150; attempt++) {
        const status = await cdp.evaluate(
          "document.querySelector('.app-shell')?.getAttribute('data-skin-status')");
        if (status === "ready" || status === "unavailable") break;
        if (attempt === 149) throw new Error("Painted artwork activation timed out");
        await delay(100);
      }
    }
    await cdp.evaluate("document.querySelector('.modal-footer button')?.click()");
    await cdp.evaluate("document.fonts.ready");
    await delay(150);
    const result = await cdp.evaluate("(" + inspectDOM.toString() + ")(" + JSON.stringify(skin) + ")");
    result.requested = {width, height};
    const filename = "game-" + skin + "-" + width + "x" + height;
    const screenshot = await cdp.send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
    await writeFile(join(out, filename + ".png"), Buffer.from(screenshot.data, "base64"));
    captures.push(result);
    console.log(filename + ": " + result.failures.length + " issue(s): " + result.failures.slice(0, 5).join("; "));
  }
  const report = {url, skin, date: new Date().toISOString(), strict, results: captures};
  await writeFile(join(out, "report.json"), JSON.stringify(report, null, 2) + "\n");
  const failures = captures.filter((r) => r.failures.length).length;
  console.log("Audit complete: " + sizes.length + " sizes, " + failures + " with issues. See " + out);
  if (strict && failures) process.exitCode = 1;
} finally {
  cdp?.close();
  if (chrome && chrome.exitCode === null) chrome.kill("SIGTERM");
  if (preview && preview.exitCode === null) preview.kill("SIGTERM");
  await rm(temp, {recursive: true, force: true});
}
