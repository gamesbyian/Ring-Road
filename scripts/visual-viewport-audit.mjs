#!/usr/bin/env node
/** Phone-sized zero-scroll and screenshot audit. Node 22, Chrome, no new npm deps. */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const smoke = args.includes("--smoke");
function option(flag, defaultValue) {
  const index = args.indexOf(flag);
  return index < 0 ? defaultValue : args[index + 1];
}
const out = option("--out", "artifacts/visual-viewport-audit");
const externalUrl = option("--url", null);
const skin = option("--skin", "painted");
if (skin !== "painted") throw new Error("Painted is the only supported Ring Road renderer");
const compositor = option("--compositor", "software");
if (!["software", "swiftshader"].includes(compositor)) throw new Error("--compositor must be software or swiftshader");
const targetUrl = new URL(externalUrl || "http://127.0.0.1:4173/Ring-Road/");
// Deliberately test the real unparameterized production entrypoint.
const url = targetUrl.href;
const spec = JSON.parse(await readFile(new URL("../docs/reference-regions.json", import.meta.url), "utf8"));
const allSizes = [...spec.phoneViewports, ...spec.otherViewports];
const sizes = smoke
  ? allSizes.filter(([width, height]) =>
    ["568x320", "892x412", "412x892", "840x360", "1536x864"].includes(width + "x" + height))
  : compositor === "swiftshader"
    ? allSizes.filter(([width, height]) =>
      ["568x320", "844x390", "892x412", "412x892", "390x844", "1536x864"].includes(width + "x" + height))
    : allSizes;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** Single author-verified source of the first puzzle's true 11-step input route. */
const FIRST_PUZZLE_EXACT_ROUTE = [
  [0, 1, 1], [1, -1, 2], [2, -1, 1],
  [3, -1, 2], [4, 1, 3], [6, -1, 2],
];


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
  // Real phones can fail to composite several 900x900 transformed WebPs even
  // while DOM bounds and click targets are correct. Constrain the actual
  // decoded ring layer footprint and prevent permanent seven-layer promotion.
  const ringTextureAudit = painted ? (() => {
    const rings = Array.from(document.querySelectorAll(".painted-ring-sprite"));
    const expected = [704, 598, 510, 400, 306, 210, 134];
    const data = rings.map((image, i) => {
      const css = getComputedStyle(image);
      return {width: image.naturalWidth, height: image.naturalHeight,
        drawnWidth: parseFloat(css.width), drawnHeight: parseFloat(css.height),
        willChange: css.willChange, expected: expected[i]};
    });
    return {
      data, pixels: data.reduce((sum, item) => sum + item.width * item.height, 0),
      failure: rings.length !== 7 || data.some((item) =>
        item.width !== item.expected || item.height !== item.expected ||
        Math.abs(item.drawnWidth - item.expected) > 1 ||
        Math.abs(item.drawnHeight - item.expected) > 1 ||
        item.willChange === "transform")
    };
  })() : null;
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
  const stageNode = document.querySelector(".painted-stage");
  const photoLayout = stageNode?.getAttribute("data-photo-layout") === "true";
  const deviceLayout = stageNode?.getAttribute("data-device-layout");
  const pixelSize = [[892,412],[412,892],[840,360],[360,840]].some(
    ([w,h]) => w === width && h === height);
  const gutter = (() => {
    const rail = document.querySelector(".ring-controls")?.getBoundingClientRect();
    const navigation = document.querySelector(".painted-navigation-slot")?.getBoundingClientRect();
    if (portrait || !pixelSize || !rail || !navigation) return null;
    return {left: rail.left, right: width - navigation.right};
  })();
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
  // Source registration is a geometry contract, not a subjective judgement:
  // in the 1536px-wide approved scene, the real board centre lies 43px right
  // of the scene centre. Tall layout may shrink the live ring art, but should
  // not move its centre relative to the underlying fixed sandstone arena.
  const tallBoardCenterDrift = (() => {
    if (document.querySelector(".painted-stage")?.dataset.tallLayout !== "true") return 0;
    const board = document.querySelector(".painted-ring-board");
    const world = document.querySelector(".painted-world");
    if (!board || !world) return Infinity;
    const b = board.getBoundingClientRect(), w = world.getBoundingClientRect();
    const measured = (b.left + b.right) / 2;
    const registered = w.left + w.width * (768 + 43) / 1536;
    return Math.abs(measured - registered);
  })();
  // The tall landscape action triplet must occupy one readable, clickable
  // row like the source/native photo seals, not a spillover 2×2 grid.
  const tallActionsUnregistered = (() => {
    if (document.querySelector(".painted-stage")?.dataset.tallLayout !== "true") return false;
    const actions = Array.from(document.querySelectorAll(".actions button")).filter(
      (button) => getComputedStyle(button).display !== "none");
    if (actions.length !== 3 || actions.map((button) => button.textContent.trim()).join("/") !== "Undo/Reset/Hint") return true;
    const rects = actions.map((button) => button.getBoundingClientRect());
    if (rects.some((r) => r.width < 43.5 || r.height < 43.5)) return true;
    if (rects.some((r) => Math.abs(r.top - rects[0].top) > 2 ||
      Math.abs(r.bottom - rects[0].bottom) > 2)) return true;
    if (rects.some((r, i) => i > 0 && r.left <= rects[i-1].right + 2)) return true;
    return actions.some((button) => getComputedStyle(button).borderTopLeftRadius !== "50%");
  })();
  const failures = [
    ...(pixelSize && deviceLayout !== "pixel-6-pro" ? ["Pixel 6 Pro layout profile not activated"] : []),
    ...(gutter && gutter.left < 15 ? ["Pixel left ring-control gutter under 15 CSS px: " + gutter.left] : []),
    ...(gutter && gutter.right < 15 ? ["Pixel right navigation gutter under 15 CSS px: " + gutter.right] : []),
    ...(tallGoalOverlap ? ["tall landscape Goal heading overlaps painted help medallion"] : []),
    ...(tallBoardCenterDrift > 2 ? ["tall landscape live rings drift from source sandstone board: " + tallBoardCenterDrift.toFixed(2) + "px"] : []),
    ...(tallActionsUnregistered ? ["tall landscape actions not three accessible painted seals in one row"] : []),
    ...(ringTextureAudit?.failure ? ["painted ring textures unexpectedly uncropped or permanently promoted"] : []),
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
    photoLayout, deviceLayout, pixelGutter: gutter, bestVisible, actionTypography, ringTextureAudit,
    visualViewport: window.visualViewport ? {
      width: window.visualViewport.width, height: window.visualViewport.height,
      scale: window.visualViewport.scale
    } : null, regions, buttons, scroll, artLoaded, failures};
}


/**
 * Physical-screen inspection of an OPEN painted modal. The modal's internal
 * scroll pane may scroll; the game/page must not, and its Close action and
 * heading must remain physically visible and operable, even after CSS portrait
 * rotation. Keep modal checks separate from the at-rest inspectDOM audit.
 */
function inspectPaintedModal() {
  const modal = document.querySelector(".modal");
  const article = modal?.querySelector("article");
  const heading = article?.querySelector("h2");
  const scroll = article?.querySelector(".modal-scroll");
  const footer = article?.querySelector(".modal-footer");
  const close = footer?.querySelector("button");
  const width = window.innerWidth, height = window.innerHeight;
  const within = (r) => !!r && r.left >= -2 && r.top >= -2 &&
    r.right <= width + 2 && r.bottom <= height + 2;
  const rect = (element) => element?.getBoundingClientRect() ?? null;
  const buttonRect = rect(close);
  const center = buttonRect ? {
    x: buttonRect.left + buttonRect.width / 2,
    y: buttonRect.top + buttonRect.height / 2
  } : null;
  const hit = center && document.elementFromPoint(center.x, center.y);
  const topLevel = ["html", "body", "#root", ".app-shell"].filter((selector) => {
    const node = selector === "html" ? document.documentElement : document.querySelector(selector);
    return node && (node.scrollWidth > node.clientWidth + 2 ||
      node.scrollHeight > node.clientHeight + 2);
  });
  const failures = [];
  const blur = modal ? getComputedStyle(modal).backdropFilter : "unknown";
  if (document.querySelector(".painted-app") && blur !== "none")
    failures.push("painted modal still uses expensive background blur: " + blur);
  if (!within(rect(modal))) failures.push("overlay exceeds physical viewport");
  if (!within(rect(article))) failures.push("dialog panel clipped by physical viewport");
  if (!within(rect(heading))) failures.push("dialog heading clipped");
  if (!within(rect(footer))) failures.push("dialog footer clipped");
  if (!within(buttonRect)) failures.push("Close button clipped");
  if (!buttonRect || buttonRect.width < 43.5 || buttonRect.height < 43.5)
    failures.push("Close button smaller than 44 physical CSS pixels");
  if (!hit || (hit !== close && !close?.contains(hit)))
    failures.push("Close button center obstructed");
  if (scroll && (!Number.isFinite(scroll.clientHeight) || scroll.clientHeight <= 0))
    failures.push("dialog content scroll region collapsed");
  if (topLevel.length) failures.push("page/shell scrolls while modal open: " + topLevel.join(", "));
  return {
    viewport: {width, height}, panel: article ? {
      left: rect(article).left, top: rect(article).top,
      width: rect(article).width, height: rect(article).height
    } : null,
    content: scroll ? {clientHeight: scroll.clientHeight, scrollHeight: scroll.scrollHeight,
      overflowY: getComputedStyle(scroll).overflowY} : null,
    footerButton: buttonRect ? {width: buttonRect.width, height: buttonRect.height} : null,
    failures
  };
}


/**
 * Real physical-coordinate CDP clicks (not DOM .click()) confirm that the
 * painted layer, the CSS-rotated portrait shell, and React reducer agree.
 * Screenshots are captured BEFORE these actions to preserve stable comparisons.
 */
async function smokePaintedInteraction(cdp, testFullTurns = false, capturePose = async () => {}, captureOpenModal = async () => {}) {
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
  const verifyOpenModal = async (label) => {
    const result = await read("(" + inspectPaintedModal.toString() + ")()");
    errors.push(...result.failures.map((reason) => label + " modal: " + reason));
    if (label === "guide") {
      // The complete rule explanation should be visible above Play in the
      // constrained phone landscape, rather than relying on invisible scroll.
      const shortEdge = Math.min(result.viewport.width, result.viewport.height);
      if (shortEdge <= 430 && result.content &&
          result.content.scrollHeight > result.content.clientHeight + 2) {
        errors.push("compact painted Guide hides rules below its scroll region: " +
          result.content.scrollHeight + " > " + result.content.clientHeight);
      }
    }
    if (label === "solution") {
      const count = await read("document.querySelectorAll('.modal-solution .modal-scroll > p').length");
      if (count !== 7) errors.push("painted Solution does not display seven live ring instructions: " + count);
      // The seven steps now occupy two real columns on short/rotated
      // landscape screens. A hidden lower half silently failed usability.
      const shortEdge = Math.min(result.viewport.width, result.viewport.height);
      if (shortEdge <= 430 && result.content &&
          result.content.scrollHeight > result.content.clientHeight + 2) {
        errors.push("compact Solution still hides ring instructions below scrolling content: " +
          result.content.scrollHeight + " > " + result.content.clientHeight);
      }
    }
    await cdp.send("Input.dispatchMouseEvent", {type: "mouseMoved", x: 4, y: 4});
    await delay(70);
    await captureOpenModal(label, result);
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
    if (testFullTurns && second !== first) {
      await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved", x: 4, y: 4,
    });
      await capturePose("puzzle-two");
    }
    await click(".puzzle-plaque button:last-child"); // Next, puzzle 3
    const third = await read("document.querySelector('.puzzle-numberline')?.textContent.trim()");
    if (third === second) errors.push("Next puzzle did not advance from second to third");
    if (testFullTurns && third !== second) {
      await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved", x: 4, y: 4,
    });
      await capturePose("puzzle-three");
    }
    const thirdBead = await bead();
    if (thirdBead !== Math.min(5, firstBead + 1))
      errors.push("Campaign progress beads did not advance across puzzle pair");
    await click(".puzzle-plaque button:first-child"); // Previous to puzzle 2
    await click(".puzzle-plaque button:first-child"); // Previous to puzzle 1
    const restored = await read("document.querySelector('.puzzle-numberline')?.textContent.trim()");
    if (restored !== first) errors.push("Previous puzzle did not restore first puzzle");
    if (await bead() !== firstBead) errors.push("Campaign progress bead did not reset with navigation");
    // Reopen the tutorial through the REAL painted Goal medallion after the
    // initial first-load guide was dismissed; test its physical hit region,
    // all rendered content and always-reachable Play footer across phones.
    await click(".reference-goal-guide");
    const guideShown = await read(
      "document.querySelector('.modal h2')?.textContent?.trim() === 'How to play'");
    if (!guideShown) errors.push("painted Goal medallion failed to open Guide");
    if (guideShown) {
      await verifyOpenModal("guide");
      await click(".modal-footer button"); // Play
      if (await read("!!document.querySelector('.modal')"))
        errors.push("Guide Play button did not close tutorial");
    }
    await click(".actions button:nth-child(3)"); // Hint
    const hintShown = await read("!!document.querySelector('.modal')");
    if (!hintShown) errors.push("Hint did not open a modal");
    if (hintShown) {
      await verifyOpenModal("hint");
      await click(".modal-footer button"); // Close Hint
      await click(".reference-solution-card"); // Solution remains reachable
      const solutionShown = await read(
        "document.querySelector('.modal')?.textContent?.includes('Exact solution') || false");
      if (!solutionShown) errors.push("Solution preview button failed after hiding duplicate action");
      if (solutionShown) await verifyOpenModal("solution");
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
      const exactRoute = FIRST_PUZZLE_EXACT_ROUTE;
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
        if (completed && firedPearl && best === "11") {
          // The final UI is unpictured in the source photograph. Retain the
          // GENUINE post-fire Chrome state for visual review, not a fabricated
          // modal or decorative screenshot.
          await capturePose("fired-completion");
        }
      }
    }
  } catch (error) {
    errors.push("interaction exception: " + String(error));
  }
  return errors;
}


/**
 * First independently recorded COMPLETE race through a simulated PHONE, not
 * merely 1536x864. Uses the SAME author-verified eleven-step route as native
 * acceptance, genuine CDP mouse coordinates and the actual shared reducer.
 * Runs after the normal interaction smoke, so it can leave the game completed.
 */
async function smokeCompactPaintedCompletion(cdp, capture = async () => {}) {
  const failures = [];
  const read = (expr) => cdp.evaluate(expr);
  const physicalClick = async (selector) => {
    const point = await read("(() => {const el = document.querySelector(" +
      JSON.stringify(selector) + "); if (!el || el.disabled) return null; " +
      "const r = el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()");
    if (!point) { failures.push("not clickable: " + selector); return false; }
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1
    });
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1
    });
    await delay(90);
    return true;
  };
  const moves = () => read("Number(document.querySelector('.reference-moves-card strong')?.textContent?.trim() || -1)");
  try {
    if (await moves() !== 0) {
      failures.push("compact completion journey did not start at zero moves");
      return failures;
    }
    for (const [domain, direction, count] of FIRST_PUZZLE_EXACT_ROUTE) {
      const selector = ".ring-control-" + domain +
        (direction === 1 ? " button:last-child" : " button:first-of-type");
      for (let i = 0; i < count; i++) {
        if (!await physicalClick(selector)) return failures;
      }
    }
    if (await moves() !== 11) failures.push("compact exact route not eleven actual moves");
    const unlocked = await read("document.querySelector('.painted-hub-button')?.disabled === false");
    if (!unlocked) {
      failures.push("compact pearl did not unlock after eleven genuine steps");
      return failures;
    }
    await cdp.send("Input.dispatchMouseEvent", {type: "mouseMoved", x: 4, y: 4});
    await capture("aligned-pre-fire", null);
    await physicalClick(".painted-hub-button");
    await delay(480);
    const title = await read("document.querySelector('.modal h2')?.textContent?.trim()");
    if (title !== "Puzzle complete!") failures.push("compact fire did not open completion modal: " + title);
    const best = await read("document.querySelector('.painted-best-readout b')?.textContent?.trim()");
    if (best !== "11") failures.push("compact fire did not preserve truthful Best 11: " + best);
    if (!await read("!!document.querySelector('.painted-pearl-fired')"))
      failures.push("compact fire failed to visually dismiss pearl");
    if (title === "Puzzle complete!") {
      const geometry = await read("(" + inspectPaintedModal.toString() + ")()");
      failures.push(...geometry.failures.map((reason) => "completion modal: " + reason));
      const nextVisible = await read(`(() => {
        const button = document.querySelector('.modal-completion .modal-scroll > button');
        const scroll = document.querySelector('.modal-completion .modal-scroll');
        if (!button || !scroll) return false;
        const b = button.getBoundingClientRect(), s = scroll.getBoundingClientRect();
        const x = (b.left + b.right) / 2, y = (b.top + b.bottom) / 2;
        const top = document.elementFromPoint(x, y);
        return b.left >= s.left - 2 && b.right <= s.right + 2 &&
          b.top >= s.top - 2 && b.bottom <= s.bottom + 2 &&
          b.width >= 43.5 && b.height >= 43.5 &&
          (top === button || button.contains(top));
      })()`);
      if (!nextVisible) failures.push("compact Next puzzle in completion is clipped or not hittable");
      await cdp.send("Input.dispatchMouseEvent", {type: "mouseMoved", x: 4, y: 4});
      await capture("fired-completion", geometry);
      await physicalClick(".modal-footer button");
      if (await read("!!document.querySelector('.modal')"))
        failures.push("compact completion Close did not dismiss the actual dialog");
    }
  } catch (error) {
    failures.push("compact genuine completion exception: " + String(error));
  }
  return failures;
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
    "--headless", "--no-sandbox", "--hide-scrollbars",
    ...(compositor === "swiftshader"
      ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
        "--disable-gpu-sandbox"]
      : ["--disable-gpu"]),
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
        const surfaces = [
          ['.reference-solution-card', null],
          ['.reference-moves-card', null],
          ['.puzzle-plaque', '::before'],
        ];
        await Promise.all(surfaces.map(async ([selector, pseudo]) => {
          const element = document.querySelector(selector);
          const bg = element && getComputedStyle(element, pseudo).backgroundImage;
          const uri = bg && /url\\(["']?(.*?)["']?\\)/.exec(bg)?.[1];
          if (uri) { const image = new Image(); image.src = uri; await image.decode(); }
        }));
      })()`);
      await cdp.evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
    }
    await delay(220);
    const result = await cdp.evaluate("(" + inspectDOM.toString() + ")(" + JSON.stringify(skin) + ")");
    result.requested = {width, height};
    const filename = "game-" + skin + "-" + width + "x" + height;
    const screenshot = await cdp.send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
    await writeFile(join(out, filename + ".png"), Buffer.from(screenshot.data, "base64"));
    const baselineDigest = createHash("sha256").update(screenshot.data, "base64").digest("hex");
    if (skin === "painted" && ["568x320", "844x390", "892x412", "412x892", "390x844", "1536x864", "1920x1080"].includes(width + "x" + height)) {
      const nativePhoto = width === 1536 && height === 864;
      // Additional evidence captures are from the SAME REAL in-page puzzle
      // after physical clicks, never synthetic CSS sprite rotations or a
      // manually altered reducer. Keep the baseline native screenshot stable.
      const poseDigests = new Map();
      const capturePose = nativePhoto ? async (pose) => {
        await delay(210); // finish the 150ms genuine source-sprite rotation
        await cdp.evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
        const poseImage = await cdp.send("Page.captureScreenshot", {
          format: "png", captureBeyondViewport: false
        });
        const bytes = Buffer.from(poseImage.data, "base64");
        const digest = createHash("sha256").update(bytes).digest("hex");
        if (digest === baselineDigest) {
          result.failures.push("pose capture identical to untouched initial board: " + pose);
        }
        if ([...poseDigests.values()].includes(digest)) {
          result.failures.push("two physically distinct poses have identical pixels: " + pose);
        }
        poseDigests.set(pose, digest);
        await writeFile(join(out, filename + "-" + pose + ".png"), bytes);
      } : async () => {};
      // Open-dialog captures come from the same REAL pointer-driven Hint and
      // Solution actions, never a manually inserted screenshot-only modal.
      const modalEvidence = {};
      const captureOpenModal = async (kind, geometry) => {
        if (!["568x320", "844x390", "892x412", "412x892", "390x844", "1536x864"].includes(width + "x" + height)) return;
        await cdp.evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
        const screen = await cdp.send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
        const bytes = Buffer.from(screen.data, "base64");
        const digest = createHash("sha256").update(bytes).digest("hex");
        modalEvidence[kind] = {sha256: digest, geometry};
        await writeFile(join(out, filename + "-" + kind + "-open.png"), bytes);
      };
      result.interactionFailures = await smokePaintedInteraction(cdp, nativePhoto, capturePose, captureOpenModal);
      if (["568x320", "844x390", "390x844", "1536x864"].includes(width + "x" + height)) {
        if (!modalEvidence.guide || !modalEvidence.hint || !modalEvidence.solution ||
            new Set(Object.values(modalEvidence).map((item) => item.sha256)).size !== 3 ||
            Object.values(modalEvidence).some((item) => item.sha256 === baselineDigest)) {
          result.failures.push("missing or duplicated live painted Guide/Hint/Solution screenshots");
        }
        result.modalEvidence = modalEvidence;
      }
      if (nativePhoto && (poseDigests.size !== 5 ||
        !poseDigests.has("puzzle-two") || !poseDigests.has("puzzle-three") ||
        !poseDigests.has("red-one-step") || !poseDigests.has("exact-aligned-pre-fire") ||
        !poseDigests.has("fired-completion"))) {
        result.failures.push("missing genuine native Puzzle 2/3, one-step, aligned or fired-completion screenshots");
      }
      result.failures.push(...result.interactionFailures.map((reason) => "interaction: " + reason));
      if (nativePhoto) result.nativePoseDigests = Object.fromEntries(poseDigests);
    }
    if (skin === "painted" && ((width === 844 && height === 390) || (width === 892 && height === 412))) {
      // A DPR=1 CSS viewport does not reproduce modern phone raster density.
      // Retain an additional *simulated* DPR2 image and rerun the same genuine
      // pointer-coordinate controls under reduced-motion, without pretending
      // this is a real-device acceptance test.
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width, height, mobile: true, deviceScaleFactor: width === 892 ? 3.5 : 2,
        screenOrientation: {type: "landscapePrimary", angle: 90}
      });
      await cdp.send("Emulation.setEmulatedMedia", {
        features: [{name: "prefers-reduced-motion", value: "reduce"}]
      });
      try {
        await delay(160);
        const dpr = await cdp.evaluate("window.devicePixelRatio");
        const reduced = await cdp.evaluate(`(() => {
          const sprite = document.querySelector('.painted-ring-sprite');
          const pearl = document.querySelector('.painted-pearl');
          const duration = (element) => element ? getComputedStyle(element).transitionDuration : '';
          const disabled = (text) => text.split(',').every((value) => Number.parseFloat(value) === 0);
          return {
            media: matchMedia('(prefers-reduced-motion: reduce)').matches,
            spriteDuration: duration(sprite), pearlDuration: duration(pearl),
            disabled: disabled(duration(sprite)) && disabled(duration(pearl))
          };
        })()`);
        if (Math.abs(dpr - (width === 892 ? 3.5 : 2)) > 0.001)
          result.failures.push("Pixel density emulation unavailable: " + dpr);
        if (!reduced.media || !reduced.disabled)
          result.failures.push("reduced motion did not disable painted ring/pearl transitions: " + JSON.stringify(reduced));
        const hiDpi = await cdp.send("Page.captureScreenshot", {
          format: "png", captureBeyondViewport: false
        });
        await writeFile(join(out, filename + "-dpr2-reduced-motion.png"), Buffer.from(hiDpi.data, "base64"));
        const dprAudit = await cdp.evaluate("(" + inspectDOM.toString() + ")(" + JSON.stringify(skin) + ")");
        result.failures.push(...dprAudit.failures.map((reason) => "DPR2 reduced motion: " + reason));
        const dprInteractions = await smokePaintedInteraction(cdp);
        result.failures.push(...dprInteractions.map((reason) => "DPR2 physical-coordinate click: " + reason));
        result.extraPhoneEmulation = {dpr, reduced, failures: dprAudit.failures, interactionFailures: dprInteractions};
      } finally {
        await cdp.send("Emulation.setEmulatedMedia", {features: []});
      }
    }
    if (skin === "painted" &&
        ["568x320", "844x390", "892x412", "412x892", "390x844"].includes(width + "x" + height)) {
      // The preceding DPR2 smoke legitimately changed Chrome's pixel ratio.
      // Re-establish CSS-pixel native-size evidence without changing game state.
      if ((width === 844 && height === 390) || (width === 892 && height === 412)) {
        await cdp.send("Emulation.setDeviceMetricsOverride", {
          width, height, mobile: true, deviceScaleFactor: 1,
          screenOrientation: {type: "landscapePrimary", angle: 90}
        });
        await delay(130);
      }
      const finishedScreens = {};
      const captureCompact = async (pose, geometry) => {
        await delay(190);
        await cdp.evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
        const image = await cdp.send("Page.captureScreenshot", {
          format: "png", captureBeyondViewport: false
        });
        const bytes = Buffer.from(image.data, "base64");
        finishedScreens[pose] = {
          sha256: createHash("sha256").update(bytes).digest("hex"),
          geometry
        };
        await writeFile(join(out, filename + "-phone-" + pose + ".png"), bytes);
      };
      result.compactCompletionFailures = await smokeCompactPaintedCompletion(cdp, captureCompact);
      result.failures.push(...result.compactCompletionFailures.map((problem) =>
        "phone complete: " + problem));
      if (!finishedScreens["aligned-pre-fire"] || !finishedScreens["fired-completion"] ||
          finishedScreens["aligned-pre-fire"].sha256 === finishedScreens["fired-completion"].sha256 ||
          Object.values(finishedScreens).some((item) => item.sha256 === baselineDigest)) {
        result.failures.push("missing or duplicated genuine compact aligned/completion screenshots");
      }
      result.compactCompletionEvidence = finishedScreens;
    }
    captures.push(result);
    console.log(filename + ": " + result.failures.length + " issue(s): " + result.failures.slice(0, 5).join("; "));
  }
  const report = {url, skin, compositor, date: new Date().toISOString(), strict, results: captures};
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
