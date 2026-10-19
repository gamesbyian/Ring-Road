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
      rect: rectInfo(rect), fits: fits(rect), min44: rect.width >= 43.5 && rect.height >= 43.5,
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
  const artDiagnostics = painted ? [
    ".painted-stage", ".painted-ocean", ".painted-world",
    ".painted-registered-scene", ".painted-board-slot",
  ].map((selector) => {
    const element = document.querySelector(selector);
    if (!element) return {selector, missing: true};
    const css = getComputedStyle(element), rect = element.getBoundingClientRect();
    return {
      selector, rect: rectInfo(rect),
      display: css.display, visibility: css.visibility, opacity: css.opacity,
      position: css.position, zIndex: css.zIndex, transform: css.transform,
      objectFit: css.objectFit, background: css.backgroundColor,
      clipPath: css.clipPath, filter: css.filter,
      naturalWidth: element instanceof HTMLImageElement ? element.naturalWidth : null,
    };
  }) : [];
  const currentSkin = shell?.getAttribute("data-skin-mode") || "unknown";
  const skinStatus = shell?.getAttribute("data-skin-status") || "unknown";
  const relevantStage = document.querySelector(painted ? ".painted-stage" : ".diorama-scene");
  const stageRect = relevantStage?.getBoundingClientRect();
  const stageFits = !!stageRect && fits(stageRect) &&
    Math.abs(stageRect.width - width) <= 4 &&
    Math.abs(stageRect.height - height) <= 4;
  const readyRows = Array.from(document.querySelectorAll(".ring-control")).every(
    (row) => getComputedStyle(row).visibility !== "hidden");
  const photoLayout = document.querySelector(".painted-stage")?.getAttribute("data-photo-layout") === "true";
  const best = document.querySelector(".painted-best-readout");
  const bestVisible = best ? getComputedStyle(best).display !== "none" : false;
  const actionTypography = painted ? Array.from(document.querySelectorAll(".actions button"))
    .filter((button) => getComputedStyle(button).display !== "none")
    .map((button) => {
      const rect = button.getBoundingClientRect();
      const physicalFont = parseFloat(getComputedStyle(button).fontSize) * rect.height /
        Math.max(1, button.offsetHeight);
      return {label: button.textContent.trim(), physicalFont};
    }) : [];
  const duplicateSolution = painted && document.querySelector(".actions button.solution-compact-action");
  const duplicateSolutionVisible = Boolean(duplicateSolution &&
    getComputedStyle(duplicateSolution).display !== "none");
  // Tall landscape cannot silently hide the Goal label under its illustrated
  // help medallion. CSS pseudo-elements have no DOM hitbox, so measure their
  // rendered width using the actual scaled button as the coordinate frame.
  const tallGoalOverlap = (() => {
    if (document.querySelector(".painted-stage")?.dataset.tallLayout !== "true") return false;
    const badge = document.querySelector(".reference-goal-guide");
    const heading = document.querySelector(".reference-goal-heading strong");
    if (!badge || !heading || badge.offsetWidth <= 0) return true;
    const art = getComputedStyle(badge, "::after");
    const left = parseFloat(art.left);
    const width = parseFloat(art.width);
    if (!Number.isFinite(left) || !Number.isFinite(width)) return true;
    const rect = badge.getBoundingClientRect();
    const scale = rect.width / badge.offsetWidth;
    return heading.getBoundingClientRect().left < rect.left + (left + width) * scale + 1;
  })();
  const failures = [
    ...(tallGoalOverlap ? ["tall landscape Goal heading overlaps painted help medallion"] : []),
    ...(duplicateSolutionVisible ? ["duplicate painted Solution action visible"] : []),
    ...(painted && !photoLayout && bestVisible ? ["compact Moves plaque has a visible extra Best row"] : []),
    ...actionTypography.filter((item) => item.physicalFont < 11.5)
      .map((item) => "unreadable compact action label: " + item.label),
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
    rotated, shellFits, stageFits, artDiagnostics, stageRect: stageRect ? rectInfo(stageRect) : null,
    photoLayout, bestVisible, actionTypography,
    visualViewport: window.visualViewport ? {
      width: window.visualViewport.width, height: window.visualViewport.height,
      scale: window.visualViewport.scale
    } : null, regions, buttons, scroll, artLoaded, failures};
}


/**
 * Real physical-coordinate CDP clicks (not DOM .click()) confirm that the
 * painted layer, the CSS-rotated portrait shell, and React reducer agree.
 * Screenshots are captured BEFORE these actions to preserve stable comparisons.
 */
async function smokePaintedInteraction(cdp, testFullTurns = false, capturePose = async () => {}) {
  const errors = [];
  const read = (expression) => cdp.evaluate(expression);
  const moveCount = () => read("Number(document.querySelector('.reference-moves-card strong')?.textContent?.trim() || -1)");
  const click = async (selector) => {
    const center = await read("(() => { const el = document.querySelector(" +
      JSON.stringify(selector) + "); if (!el || el.disabled) return null; " +
      "const r = el.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()");
    if (!center) {
      errors.push("unclickable: " + selector);
      return false;
    }
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mousePressed", x: center.x, y: center.y, button: "left", clickCount: 1
    });
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseReleased", x: center.x, y: center.y, button: "left", clickCount: 1
    });
    await delay(90);
    return true;
  };
  const expectMoves = async (count, stage) => {
    const actual = await moveCount();
    if (actual !== count) errors.push(stage + ": expected " + count + " moves, got " + actual);
  };
  try {
    const opacity = await read("getComputedStyle(document.querySelector('.actions')).opacity");
    if (opacity !== "1") errors.push("painted actions invisible (opacity " + opacity + ")");
    await expectMoves(0, "start");
    await click(".ring-control-6 button:last-child"); // outer red clockwise
    await expectMoves(1, "rotate");
    await click(".actions button:nth-child(1)"); // Undo
    await expectMoves(0, "undo");
    await click(".ring-control-6 button:last-child");
    await expectMoves(1, "rotate again");
    await click(".actions button:nth-child(2)"); // Reset
    await expectMoves(0, "reset");
    const first = await read("document.querySelector('.puzzle-numberline')?.textContent.trim()");
    const bead = () => read("Array.from(document.querySelectorAll('.puzzle-progress-dots i')).findIndex(i => i.classList.contains('active'))");
    const firstBead = await bead();
    await click(".puzzle-plaque button:last-child"); // Next, puzzle 2
    const second = await read("document.querySelector('.puzzle-numberline')?.textContent.trim()");
    if (second === first) errors.push("Next puzzle did not change current puzzle");
    await click(".puzzle-plaque button:last-child"); // Next, puzzle 3
    const thirdBead = await bead();
    if (thirdBead !== Math.min(5, firstBead + 1))
      errors.push("Campaign progress beads did not advance across puzzle pair");
    await click(".puzzle-plaque button:first-child"); // Previous to puzzle 2
    await click(".puzzle-plaque button:first-child"); // Previous to puzzle 1
    const restored = await read("document.querySelector('.puzzle-numberline')?.textContent.trim()");
    if (restored !== first) errors.push("Previous puzzle did not restore first puzzle");
    if (await bead() !== firstBead) errors.push("Campaign progress bead did not reset with navigation");
    await click(".actions button:nth-child(3)"); // Hint
    const hintShown = await read("!!document.querySelector('.modal')");
    if (!hintShown) errors.push("Hint did not open a modal");
    if (hintShown) {
      await click(".modal-footer button"); // Close Hint
      await click(".reference-solution-card"); // Solution remains reachable
      const solutionShown = await read(
        "document.querySelector('.modal')?.textContent?.includes('Exact solution') || false");
      if (!solutionShown) errors.push("Solution preview button failed after hiding duplicate action");
      // Escape should close the modal and restore keyboard focus to the
      // actual Solution plaque even when the entire shell is CSS-rotated.
      await cdp.send("Input.dispatchKeyEvent", {type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27});
      await cdp.send("Input.dispatchKeyEvent", {type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27});
      await delay(80);
      const returnedFocus = await read(
        "document.activeElement?.classList.contains('reference-solution-card') === true");
      if (!returnedFocus) errors.push("Escape from Solution failed to restore keyboard focus");
      const dialogStillOpen = await read("!!document.querySelector('.modal')");
      if (dialogStillOpen) errors.push("Escape failed to dismiss Solution dialog");
    }
    if (testFullTurns) {
      // Seven true clockwise 360-degree turns, through actual coordinates on
      // the native reference viewport. Preserve logical unbounded visual
      // degrees and each original alpha notch, not just normalized state.
      const degrees = (value) => {
        const match = /^rotate\((-?[0-9.]+)deg\)$/.exec(value || "");
        return match ? Number(match[1]) : NaN;
      };
      const ringTransform = (art) => read(
        "document.querySelectorAll('.painted-ring-sprite')[" + art + "]?.style.transform");
      const originals = [];
      let turns = 0;
      for (let art = 0; art < 7; art++) {
        const domain = 6 - art;
        const control = ".ring-control-" + domain;
        const initial = await ringTransform(art);
        originals.push(initial);
        const groupLabel = await read("document.querySelector(" +
          JSON.stringify(control) + ")?.getAttribute('aria-label')");
        const cycle = Number(/ of (\d+)$/.exec(groupLabel || "")?.[1]);
        if (!(cycle >= 2 && cycle <= 19)) {
          errors.push("invalid ring cycle in accessibility label: " + groupLabel);
          continue;
        }
        for (let step = 0; step < cycle; step++) {
          await click(control + " button:last-child");
          if (art === 0 && step === 0) await capturePose("red-one-step");
        }
        turns += cycle;
        await expectMoves(turns, "painted full-turn ring " + (art + 1));
        const current = await ringTransform(art);
        if (Math.abs((degrees(current) - degrees(initial)) - 360) > 0.001) {
          errors.push("full clockwise rotation failed for ring " + (art + 1) +
            ": " + initial + " -> " + current);
        }
        const restoredLabel = await read("document.querySelector(" +
          JSON.stringify(control) + ")?.getAttribute('aria-label')");
        if (restoredLabel !== groupLabel)
          errors.push("full turn did not restore normalized orientation: " + (art + 1));
      }
      await click(".actions button:nth-child(2)"); // reset after all wraps
      await expectMoves(0, "reset all seven full turns");
      for (let art = 0; art < 7; art++) {
        const current = await ringTransform(art);
        if (current !== originals[art])
          errors.push("reset did not restore painted ring " + (art + 1));
      }
      // Negative wraps follow a distinct unbounded animation trajectory.
      // Verify that source alpha gaps rotate a genuine full turn in the other
      // direction without reversing around the 0/360 normalized boundary.
      let reverseMoves = 0;
      for (let art = 0; art < 7; art++) {
        const domain = 6 - art;
        const control = ".ring-control-" + domain;
        const groupLabel = await read("document.querySelector(" +
          JSON.stringify(control) + ")?.getAttribute('aria-label')");
        const cycle = Number(/ of (\d+)$/.exec(groupLabel || "")?.[1]);
        if (!(cycle >= 2 && cycle <= 19)) {
          errors.push("invalid counterclockwise ring cycle: " + groupLabel);
          continue;
        }
        for (let step = 0; step < cycle; step++) {
          await click(control + " button:first-of-type");
        }
        reverseMoves += cycle;
        await expectMoves(reverseMoves, "reverse full-turn ring " + (art + 1));
        const current = await ringTransform(art);
        if (Math.abs((degrees(current) - degrees(originals[art])) + 360) > 0.001) {
          errors.push("full counterclockwise rotation failed for ring " + (art + 1) +
            ": " + originals[art] + " -> " + current);
        }
        const restoredLabel = await read("document.querySelector(" +
          JSON.stringify(control) + ")?.getAttribute('aria-label')");
        if (restoredLabel !== groupLabel)
          errors.push("reverse full turn changed normalized orientation: " + (art + 1));
      }
      await click(".actions button:nth-child(2)");
      await expectMoves(0, "reset all reverse turns");
      for (let art = 0; art < 7; art++) {
        if (await ringTransform(art) !== originals[art])
          errors.push("reset after reverse wrap failed for painted ring " + (art + 1));
      }
      // Author-verified first-puzzle exact route. Drive the REAL controls and
      // fire the painted pearl by physical mouse coordinates: no reducer
      // bypass or synthetic DOM click. This is the complete 11-move solution.
      const exactRoute = [
        [0, 1, 1], [1, -1, 2], [2, -1, 1],
        [3, -1, 2], [4, 1, 3], [6, -1, 2],
      ];
      let solvedMoves = 0;
      for (const [domain, direction, count] of exactRoute) {
        const control = ".ring-control-" + domain +
          (direction === 1 ? " button:last-child" : " button:first-of-type");
        for (let step = 0; step < count; step++) {
          await click(control);
          solvedMoves++;
        }
      }
      await expectMoves(solvedMoves, "exact painted first puzzle route");
      const canFire = await read("document.querySelector('.painted-hub-button')?.disabled === false");
      if (solvedMoves !== 11 || !canFire) {
        errors.push("painted center did not unlock after exact eleven-move solution");
      } else {
        await capturePose("exact-aligned-pre-fire");
        await click(".painted-hub-button");
        await delay(480); // complete-state modal follows real fire animation
        const completed = await read(
          "document.querySelector('.modal')?.textContent?.includes('Puzzle complete') || false");
        if (!completed) errors.push("painted center fire failed to present puzzle completion");
        const firedPearl = await read(
          "!!document.querySelector('.painted-pearl-fired')");
        if (!firedPearl) errors.push("painted center did not enter pearl-fired presentation state");
        const best = await read(
          "document.querySelector('.painted-best-readout b')?.textContent?.trim() || ''");
        if (best !== "11") errors.push("painted Best record was not created after true completion: " + best);
      }
    }
  } catch (error) {
    errors.push("interaction exception: " + String(error));
  }
  return errors;
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
    if (skin === "painted") {
      // img.complete/naturalWidth reflect transfer, not completed image decode.
      // A capture may otherwise show a fully loaded React UI over an empty
      // matte. Await every image's decode and two compositor frames.
      await cdp.evaluate("Promise.all([...document.querySelectorAll('.painted-stage img')].map(img => img.decode()))");
      // The large reference-layout Solution art is a CSS background, so an
      // img-only decode wait is insufficient for deterministic screenshots.
      await cdp.evaluate(`(async () => {
        const button = document.querySelector('.reference-solution-card');
        const bg = button && getComputedStyle(button).backgroundImage;
        const uri = bg && /url\\(["']?(.*?)["']?\\)/.exec(bg)?.[1];
        if (uri) { const image = new Image(); image.src = uri; await image.decode(); }
      })()`);
      await cdp.evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
    }
    await delay(220);
    const result = await cdp.evaluate("(" + inspectDOM.toString() + ")(" + JSON.stringify(skin) + ")");
    result.requested = {width, height};
    const filename = "game-" + skin + "-" + width + "x" + height;
    const screenshot = await cdp.send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
    await writeFile(join(out, filename + ".png"), Buffer.from(screenshot.data, "base64"));
    if (skin === "painted" && ["568x320", "844x390", "390x844", "1536x864", "1920x1080"].includes(width + "x" + height)) {
      const nativePhoto = width === 1536 && height === 864;
      // Additional evidence captures are from the SAME REAL in-page puzzle
      // after physical clicks, never synthetic CSS sprite rotations or a
      // manually altered reducer. Keep the baseline native screenshot stable.
      const capturePose = nativePhoto ? async (pose) => {
        await delay(210); // finish the 150ms genuine source-sprite rotation
        await cdp.evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
        const poseImage = await cdp.send("Page.captureScreenshot", {
          format: "png", captureBeyondViewport: false
        });
        await writeFile(join(out, filename + "-" + pose + ".png"), Buffer.from(poseImage.data, "base64"));
      } : async () => {};
      result.interactionFailures = await smokePaintedInteraction(cdp, nativePhoto, capturePose);
      result.failures.push(...result.interactionFailures.map((reason) => "interaction: " + reason));
    }
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
  // Chrome may still be asynchronously writing its profile when killed.
  // Wait for process exit before deleting the profile, then retry ENOTEMPTY
  // instead of turning a fully passed visual audit into a spurious red job.
  const stop = async (process) => {
    if (!process || process.exitCode !== null) return;
    const exited = new Promise((resolve) => process.once("exit", resolve));
    process.kill("SIGTERM");
    await Promise.race([exited, delay(2000)]);
    if (process.exitCode === null) {
      process.kill("SIGKILL");
      await Promise.race([exited, delay(1000)]);
    }
  };
  await Promise.all([stop(chrome), stop(preview)]);
  await rm(temp, {recursive: true, force: true, maxRetries: 12, retryDelay: 200});
}
