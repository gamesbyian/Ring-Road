import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

const APP_PORT = 4173;
const APP_URL = `http://127.0.0.1:${APP_PORT}/Ring-Road/`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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
  assert(page?.webSocketDebuggerUrl, "Chrome did not expose a page target");

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
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? "Browser evaluation failed");
    }
    return result.result?.value;
  };

  return { send, evaluate, close: () => socket.close() };
}

async function waitFor(predicate, message, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await predicate()) return;
    await sleep(50);
  }
  throw new Error(message);
}

const parseSolutionLine = (line) => {
  const match = /^([A-Za-z]+): (?:(0)|(\d+) (CW|CCW))/.exec(line ?? "");
  assert(match, `Could not parse solution line: ${line}`);
  const [, color, stationary, countText, direction] = match;
  return {
    color,
    count: stationary ? 0 : Number(countText),
    direction,
  };
};

async function clickRingMoves(cdp, color, direction, count) {
  for (let move = 0; move < count; move += 1) {
    const buttonIndex = direction === "CW" ? 1 : 0;
    const clicked = await cdp.evaluate(`(() => {
      const group = Array.from(document.querySelectorAll('.ring-control'))
        .find((node) => node.getAttribute('aria-label')?.startsWith(${JSON.stringify(color + " ring")}));
      const buttons = group?.querySelectorAll('button');
      buttons?.[${buttonIndex}]?.click();
      return Boolean(buttons?.[${buttonIndex}]);
    })()`);
    assert(clicked, `Could not click ${color} ${direction} control`);
    await sleep(18);
  }
}

async function readSolutionLines(cdp, width) {
  await cdp.evaluate("Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Solution')?.click()");
  await waitFor(
    async () => (await cdp.evaluate("document.querySelector('.modal h2')?.textContent")) === "Exact solution",
    `${width}px solution modal did not open`,
  );
  const lines = await cdp.evaluate(
    "Array.from(document.querySelectorAll('.modal-scroll p')).map((node) => node.textContent)",
  );
  assert(Array.isArray(lines) && lines.length === 7, `${width}px solution modal did not expose seven ring allocations`);
  await cdp.evaluate("document.querySelector('.modal-footer button')?.click()");
  await waitFor(async () => !(await cdp.evaluate("Boolean(document.querySelector('.modal'))")), `${width}px solution modal did not close`);
  return lines;
}

async function applySolutionLines(cdp, lines, include = () => true) {
  for (const line of lines) {
    const parsed = parseSolutionLine(line);
    if (!include(parsed)) continue;
    await clickRingMoves(cdp, parsed.color, parsed.direction, parsed.count);
  }
}

async function runViewport({ width, height, mobile, debugPort, fullFlow = true }) {
  const userDataDir = `/tmp/ring-road-chrome-${debugPort}`;
  let chrome;
  let cdp;

  for (let launchAttempt = 0; launchAttempt < 2 && !cdp; launchAttempt += 1) {
    await rm(userDataDir, { recursive: true, force: true });
    chrome = spawn("google-chrome", [
      "--headless",
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ], { stdio: "ignore" });

    try {
      cdp = await createCdpClient(debugPort);
    } catch (error) {
      if (chrome.exitCode === null) {
        chrome.kill("SIGTERM");
        await Promise.race([
          new Promise((resolve) => chrome.once("close", resolve)),
          sleep(1500),
        ]);
      }
      if (launchAttempt === 1) throw error;
      await sleep(250);
    }
  }

  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
    await cdp.send("Page.navigate", { url: APP_URL });

    await waitFor(
      async () => (await cdp.evaluate("document.readyState")) === "complete",
      `${width}px viewport did not finish loading`,
    );
    await waitFor(
      async () => Boolean(await cdp.evaluate("Boolean(document.querySelector('main'))")),
      `${width}px viewport did not mount the React app`,
    );

    assert(
      await cdp.evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
      `${width}px viewport has horizontal overflow`,
    );
    const scenicLayers = await cdp.evaluate(`Array.from(document.querySelectorAll('.scene-art img')).map((img) => ({
      currentSrc: img.currentSrc,
      pointerEvents: getComputedStyle(img).pointerEvents,
      alt: img.getAttribute('alt'),
      mobileSrc: img.dataset.mobileSrc,
      desktopSrc: img.dataset.desktopSrc,
    }))`);
    assert(Array.isArray(scenicLayers) && scenicLayers.length === 3, `${width}px viewport did not mount exactly three scenic layers`);
    assert(scenicLayers.every((layer) => layer.pointerEvents === "none"), `${width}px scenic art is not fully pointer-inert`);
    assert(scenicLayers.every((layer) => layer.alt === ""), `${width}px decorative scenic art exposes non-empty alt text`);
    if (mobile) {
      assert(scenicLayers.every((layer) => layer.currentSrc === layer.mobileSrc), `${width}px viewport did not select the mobile diorama package`);
    } else {
      assert(scenicLayers.every((layer) => layer.currentSrc === layer.desktopSrc), `${width}px viewport did not select the desktop diorama package`);
    }
    const clippedInteractiveTargets = await cdp.evaluate(`Array.from(document.querySelectorAll('button')).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > window.innerWidth + 1;
    }).map((element) => element.getAttribute('aria-label') || element.textContent?.trim() || 'button')`);
    assert(
      Array.isArray(clippedInteractiveTargets) && clippedInteractiveTargets.length === 0,
      `${width}px viewport clips interactive controls: ${clippedInteractiveTargets?.join(", ")}`,
    );
    const undersizedTargets = await cdp.evaluate(`Array.from(document.querySelectorAll('button')).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    }).map((element) => ({
      label: element.getAttribute('aria-label') || element.textContent?.trim() || 'button',
      width: Math.round(element.getBoundingClientRect().width),
      height: Math.round(element.getBoundingClientRect().height),
    }))`);
    assert(
      Array.isArray(undersizedTargets) && undersizedTargets.length === 0,
      `${width}px viewport has interactive targets below 44px: ${JSON.stringify(undersizedTargets)}`,
    );

    const guideTitle = await cdp.evaluate("document.querySelector('.modal h2')?.textContent");
    assert(guideTitle === "How to play", `${width}px viewport did not open the guide initially`);

    const guideAction = await cdp.evaluate("document.querySelector('.modal-footer button')?.textContent");
    assert(guideAction === "Play", `${width}px guide footer does not expose the Play action`);

    const modalLayout = await cdp.evaluate(`(() => {
      const article = document.querySelector('.modal article');
      const scroll = document.querySelector('.modal-scroll');
      const footer = document.querySelector('.modal-footer');
      if (!article || !scroll || !footer) return null;
      const articleRect = article.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      return {
        overflowY: getComputedStyle(scroll).overflowY,
        articleBottom: Math.round(articleRect.bottom),
        footerBottom: Math.round(footerRect.bottom),
        viewportHeight: window.innerHeight,
      };
    })()`);
    assert(modalLayout?.overflowY === "auto", `${width}px modal body is not scrollable`);
    assert(modalLayout.footerBottom <= modalLayout.articleBottom + 1, `${width}px modal footer escapes its panel`);
    assert(modalLayout.articleBottom < modalLayout.viewportHeight, `${width}px modal lacks bottom viewport padding`);
    await waitFor(
      async () => Boolean(await cdp.evaluate("document.activeElement?.matches('.modal article')")),
      `${width}px modal did not receive initial focus`,
    );

    await cdp.evaluate("document.querySelector('.modal-footer button')?.click()");
    await waitFor(
      async () => !(await cdp.evaluate("Boolean(document.querySelector('.modal'))")),
      `${width}px guide did not close`,
    );

    const layoutBounds = await cdp.evaluate(`(() => {
      const selectors = ['.board-frame', '.control-monument', '.puzzle-plaque'];
      return selectors.map((selector) => {
        const node = document.querySelector(selector);
        if (!node) return { selector, missing: true };
        const rect = node.getBoundingClientRect();
        return {
          selector,
          missing: false,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
    })()`);
    assert(
      layoutBounds.every((item) => !item.missing && item.width > 0 && item.height > 0 && item.left >= -1 && item.right <= width + 1),
      `${width}px viewport has escaped or missing primary layout regions: ${JSON.stringify(layoutBounds)}`,
    );

    if (!fullFlow) return;

    if (!mobile) {
      await cdp.evaluate(`(() => {
        document.querySelectorAll('.scene-art source').forEach((source) => source.removeAttribute('srcset'));
        document.querySelectorAll('.scene-art img').forEach((img) => img.removeAttribute('src'));
      })()`);
      const fallbackLayout = await cdp.evaluate(`(() => {
        const board = document.querySelector('.board-frame')?.getBoundingClientRect();
        const controls = document.querySelector('.control-monument')?.getBoundingClientRect();
        return {
          board: Boolean(board && board.width > 0 && board.height > 0),
          controls: Boolean(controls && controls.width > 0 && controls.height > 0),
        };
      })()`);
      assert(fallbackLayout?.board && fallbackLayout?.controls, `${width}px decorative-art failure removed functional gameplay layout`);
    }

    if (!mobile) {
      await cdp.evaluate("document.activeElement instanceof HTMLElement && document.activeElement.blur()");
      await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      await waitFor(
        async () => Boolean(await cdp.evaluate("document.activeElement?.textContent === 'Guide'")),
        `${width}px keyboard Tab did not reach the Guide control`,
      );
      const focusOutline = await cdp.evaluate(`(() => {
        const button = document.activeElement;
        if (!(button instanceof HTMLElement)) return null;
        const style = getComputedStyle(button);
        return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
      })()`);
      assert(
        focusOutline && focusOutline.width >= 2 && focusOutline.style !== "none",
        `${width}px HUD restyle obscured the visible Guide focus indicator`,
      );
      await cdp.evaluate("document.activeElement instanceof HTMLButtonElement && document.activeElement.click()");
      await waitFor(
        async () => (await cdp.evaluate("document.querySelector('.modal h2')?.textContent")) === "How to play",
        `${width}px keyboard accessibility setup did not reopen guide`,
      );
      await waitFor(
        async () => Boolean(await cdp.evaluate("document.activeElement?.matches('.modal article')")),
        `${width}px reopened modal did not receive focus`,
      );
      await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      await waitFor(
        async () => Boolean(await cdp.evaluate("document.activeElement?.matches('.modal-footer button')")),
        `${width}px Tab did not enter the modal action`,
      );
      await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      assert(
        await cdp.evaluate("document.activeElement?.matches('.modal-footer button')"),
        `${width}px modal focus escaped after tabbing past its last action`,
      );
      await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await waitFor(
        async () => !(await cdp.evaluate("Boolean(document.querySelector('.modal'))")),
        `${width}px Escape did not close modal`,
      );
      assert(
        await cdp.evaluate("document.activeElement?.textContent === 'Guide'"),
        `${width}px modal did not restore focus to its trigger`,
      );

      await cdp.send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-motion", value: "reduce" }],
      });
      assert(
        await cdp.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"),
        `${width}px reduced-motion emulation did not apply`,
      );
      const reducedTransitionSeconds = Number(await cdp.evaluate(
        "parseFloat(getComputedStyle(document.querySelector('.ring-rotor')).transitionDuration)",
      ));
      assert(
        Number.isFinite(reducedTransitionSeconds) && reducedTransitionSeconds <= 0.001,
        `${width}px ring transition does not collapse under reduced motion`,
      );
      const reducedSceneAnimation = await cdp.evaluate("getComputedStyle(document.querySelector('.title-plaque')).animationName");
      assert(
        reducedSceneAnimation === "none",
        `${width}px scene-settle animation remains active under reduced motion`,
      );
      await cdp.send("Emulation.setEmulatedMedia", { features: [] });
    }

    const moveCount = async () => Number(await cdp.evaluate("document.querySelector('.counter strong')?.textContent"));
    assert((await moveCount()) === 0, `${width}px initial move count is not zero`);

    await cdp.evaluate("document.querySelector('.ring-control button:last-child')?.click()");
    await waitFor(async () => (await moveCount()) === 1, `${width}px clockwise move did not register`);

    await cdp.evaluate("Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Undo')?.click()");
    await waitFor(async () => (await moveCount()) === 0, `${width}px undo did not restore move count`);

    await cdp.evaluate("document.querySelector('.ring-control button:first-of-type')?.click()");
    await waitFor(async () => (await moveCount()) === 1, `${width}px counterclockwise move did not register`);
    await cdp.evaluate("Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Reset')?.click()");
    await waitFor(async () => (await moveCount()) === 0, `${width}px reset did not restore move count`);

    const puzzleLabel = async () => await cdp.evaluate("document.querySelector('nav span')?.textContent");
    await cdp.evaluate("Array.from(document.querySelectorAll('nav button')).find((button) => button.textContent === 'Next')?.click()");
    await waitFor(async () => (await puzzleLabel())?.includes("Puzzle 2 of"), `${width}px next navigation failed`);
    await cdp.evaluate("Array.from(document.querySelectorAll('nav button')).find((button) => button.textContent === 'Previous')?.click()");
    await waitFor(async () => (await puzzleLabel())?.includes("Puzzle 1 of"), `${width}px previous navigation failed`);

    await cdp.evaluate("Array.from(document.querySelectorAll('nav button')).find((button) => button.textContent === 'Next')?.click()");
    await waitFor(async () => (await puzzleLabel())?.includes("Puzzle 2 of"), `${width}px rapid-input setup could not reach puzzle 2`);
    await cdp.evaluate("Array.from(document.querySelectorAll('nav button')).find((button) => button.textContent === 'Next')?.click()");
    await waitFor(async () => (await puzzleLabel())?.includes("Puzzle 3 of"), `${width}px rapid-input setup could not reach puzzle 3`);

    const rapidInput = await cdp.evaluate(`(async () => {
      const group = Array.from(document.querySelectorAll('.ring-control'))
        .find((node) => node.getAttribute('aria-label')?.startsWith('Red ring') && node.getAttribute('aria-label')?.endsWith('of 19'));
      const buttons = group?.querySelectorAll('button');
      if (!buttons?.[0] || !buttons?.[1]) return null;
      const start = performance.now();
      for (let move = 0; move < 30; move += 1) {
        buttons[move % 2].click();
        await new Promise((resolve) => setTimeout(resolve, 4));
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        elapsedMs: performance.now() - start,
        moves: Number(document.querySelector('.counter strong')?.textContent),
      };
    })()`);
    assert(rapidInput, `${width}px could not locate puzzle 3's 19-step Red ring`);
    assert(rapidInput.moves === 30, `${width}px rapid alternating input lost moves`);
    assert(rapidInput.elapsedMs < 1500, `${width}px rapid alternating input exceeded 1500ms (${Math.round(rapidInput.elapsedMs)}ms)`);

    await cdp.evaluate("Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Reset')?.click()");
    await waitFor(async () => (await moveCount()) === 0, `${width}px reset failed after rapid input`);
    await cdp.evaluate("Array.from(document.querySelectorAll('nav button')).find((button) => button.textContent === 'Previous')?.click()");
    await waitFor(async () => (await puzzleLabel())?.includes("Puzzle 2 of"), `${width}px rapid-input teardown could not reach puzzle 2`);
    await cdp.evaluate("Array.from(document.querySelectorAll('nav button')).find((button) => button.textContent === 'Previous')?.click()");
    await waitFor(async () => (await puzzleLabel())?.includes("Puzzle 1 of"), `${width}px rapid-input teardown could not return to puzzle 1`);

    if (!mobile) {
      for (let step = 0; step < 6; step += 1) {
        await cdp.evaluate("Array.from(document.querySelectorAll('nav button')).find((button) => button.textContent === 'Next')?.click()");
      }
      await waitFor(async () => (await puzzleLabel())?.includes("Puzzle 7 of"), `${width}px under/over setup could not reach puzzle 7`);
      const wrapSolutionLines = await readSolutionLines(cdp, width);
      await applySolutionLines(cdp, wrapSolutionLines, ({ color }) => color !== "Violet");
      await waitFor(
        async () => (await cdp.evaluate("document.querySelector('.status')?.textContent"))?.includes("3 more moves needed"),
        `${width}px wrapped puzzle did not expose aligned under-target state`,
      );
      const violet = wrapSolutionLines.map(parseSolutionLine).find(({ color }) => color === "Violet");
      assert(violet?.count === 3 && violet.direction === "CW", "Puzzle 7 no longer exposes the expected full-wrap acceptance fixture");
      await clickRingMoves(cdp, violet.color, violet.direction, violet.count);
      await waitFor(
        async () => (await cdp.evaluate("document.querySelector('.status')?.textContent"))?.includes("fire the center"),
        `${width}px wrapped puzzle did not reach exact target`,
      );
      await clickRingMoves(cdp, violet.color, violet.direction, violet.count);
      await waitFor(
        async () => (await cdp.evaluate("document.querySelector('.status')?.textContent"))?.includes("3 moves over target"),
        `${width}px wrapped puzzle did not expose aligned over-target state`,
      );
      assert(
        await cdp.evaluate("document.querySelector('.hub-button')?.disabled"),
        `${width}px center remained fireable while aligned over target`,
      );
      await cdp.evaluate("Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Reset')?.click()");
      for (let step = 0; step < 6; step += 1) {
        await cdp.evaluate("Array.from(document.querySelectorAll('nav button')).find((button) => button.textContent === 'Previous')?.click()");
      }
      await waitFor(async () => (await puzzleLabel())?.includes("Puzzle 1 of"), `${width}px under/over teardown could not return to puzzle 1`);
    }

    await cdp.evaluate("Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Solution')?.click()");
    await waitFor(
      async () => (await cdp.evaluate("document.querySelector('.modal h2')?.textContent")) === "Exact solution",
      `${width}px solution modal did not open`,
    );

    const solutionLines = await cdp.evaluate(
      "Array.from(document.querySelectorAll('.modal-scroll p')).map((node) => node.textContent)",
    );
    assert(Array.isArray(solutionLines) && solutionLines.length === 7, `${width}px solution modal did not expose seven ring allocations`);

    await cdp.evaluate("document.querySelector('.modal-footer button')?.click()");
    await waitFor(async () => !(await cdp.evaluate("Boolean(document.querySelector('.modal'))")), `${width}px solution modal did not close`);

    await applySolutionLines(cdp, solutionLines);

    await waitFor(
      async () => (await cdp.evaluate("document.querySelector('.status')?.textContent"))?.includes("fire the center"),
      `${width}px exact solution did not reach ready state`,
    );
    assert(
      !(await cdp.evaluate("document.querySelector('.hub-button')?.disabled")),
      `${width}px center remained disabled after exact solution`,
    );

    await cdp.evaluate("document.querySelector('.hub-button')?.click()");
    await waitFor(
      async () => (await cdp.evaluate("document.querySelector('.modal h2')?.textContent")) === "Puzzle complete!",
      `${width}px completion dialog did not appear after firing center`,
      120,
    );
    const completionAccent = await cdp.evaluate(`(() => {
      const halo = document.querySelector('.completion-halo');
      if (!halo) return null;
      const style = getComputedStyle(halo);
      return {
        active: halo.classList.contains('completion-halo-active'),
        pointerEvents: style.pointerEvents,
        animationName: style.animationName,
      };
    })()`);
    assert(completionAccent?.active, `${width}px completion halo did not activate`);
    assert(completionAccent?.pointerEvents === "none", `${width}px completion halo can intercept input`);
    assert(completionAccent?.animationName === "completion-halo-pop", `${width}px completion halo lost its restrained one-shot animation`);

    if (!mobile) {
      await cdp.evaluate("Array.from(document.querySelectorAll('.modal-scroll button')).find((button) => button.textContent === 'Next puzzle')?.click()");
      await waitFor(async () => (await puzzleLabel())?.includes("Puzzle 2 of"), `${width}px completion action did not advance to puzzle 2`);
      for (let step = 0; step < 10; step += 1) {
        await cdp.evaluate("Array.from(document.querySelectorAll('nav button')).find((button) => button.textContent === 'Next')?.click()");
      }
      await waitFor(async () => (await puzzleLabel())?.includes("Puzzle 12 of"), `${width}px campaign-end setup could not reach puzzle 12`);
      const finalSolutionLines = await readSolutionLines(cdp, width);
      await applySolutionLines(cdp, finalSolutionLines);
      await waitFor(
        async () => (await cdp.evaluate("document.querySelector('.status')?.textContent"))?.includes("fire the center"),
        `${width}px final puzzle exact solution did not reach ready state`,
      );
      await cdp.evaluate("document.querySelector('.hub-button')?.click()");
      await waitFor(
        async () => (await cdp.evaluate("document.querySelector('.modal h2')?.textContent")) === "Puzzle complete!",
        `${width}px final puzzle completion dialog did not appear`,
        120,
      );
      assert(
        (await cdp.evaluate("document.querySelector('.campaign-complete')?.textContent"))?.includes("campaign complete"),
        `${width}px final completion did not report campaign mastery`,
      );
    }

    assert(
      await cdp.evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
      `${width}px viewport gained horizontal overflow after interaction`,
    );
  } finally {
    cdp?.close();
    if (chrome?.exitCode === null) {
      chrome.kill("SIGTERM");
      await Promise.race([
        new Promise((resolve) => chrome.once("close", resolve)),
        sleep(1500),
      ]);
    }
    await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

const server = spawn("node_modules/.bin/vite", ["preview", "--host", "127.0.0.1", "--port", String(APP_PORT), "--strictPort"], {
  stdio: "ignore",
});

try {
  await waitForUrl(APP_URL);

  await runViewport({ width: 320, height: 568, mobile: true, debugPort: 9222 });
  await runViewport({ width: 390, height: 844, mobile: true, debugPort: 9223 });
  await runViewport({ width: 1440, height: 1000, mobile: false, debugPort: 9224 });

  await runViewport({ width: 360, height: 800, mobile: true, debugPort: 9225, fullFlow: false });
  await runViewport({ width: 430, height: 932, mobile: true, debugPort: 9226, fullFlow: false });
  await runViewport({ width: 768, height: 1024, mobile: false, debugPort: 9227, fullFlow: false });
  await runViewport({ width: 1024, height: 768, mobile: false, debugPort: 9228, fullFlow: false });
  await runViewport({ width: 1920, height: 1080, mobile: false, debugPort: 9229, fullFlow: false });

  console.log("Browser smoke checks passed across the full diorama target viewport matrix.");
} finally {
  server.kill("SIGTERM");
}
