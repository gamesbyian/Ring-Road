import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";

const html = await readFile("dist/index.html", "utf8");
assert.match(html, /(?:src|href)="\.\/assets\//, "native build must reference bundled relative assets");
assert.doesNotMatch(html, /(?:src|href)="\/Ring-Road\//, "GitHub Pages base would break native offline load");

const assets = await readdir("dist/reference-skin");
const webps = assets.filter((name) => name.endsWith(".webp"));
assert.ok(webps.length >= 20, `expected all painted reference WebPs; found ${webps.length}`);
assert.ok(existsSync("android/app/src/main/assets/public/index.html"), "Capacitor sync must copy the web entrypoint");
const nativeHtml = await readFile("android/app/src/main/assets/public/index.html", "utf8");
assert.equal(nativeHtml, html, "Android assets must match the actual web build");
assert.ok(existsSync("android/app/src/main/java/com/gamesbyian/ringroad/MainActivity.java"));
console.log(`Android bundle: relative URLs, offline HTML, ${webps.length} painted WebPs, immersive activity OK`);
