import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = new URL("../public/reference-skin/", import.meta.url);
const manifestPath = new URL("manifest.json", root);
if (!existsSync(root)) {
  console.log("Reference skin assets not imported; optional painted mode remains disabled.");
  process.exit(0);
}
if (!existsSync(manifestPath)) {
  throw new Error("Reference skin directory exists without verified manifest.json");
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.source_art_verified !== 18 || manifest.ring_notch_corrected !== true) {
  throw new Error("Reference skin requires 18 verified original artworks and corrected source notches");
}
const COLOR = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
const expected = new Set([
  "ocean-sky-mountains.webp",
  "castle-waterfalls-terrain.webp",
  "arena-plinth-empty.webp",
  "foreground-stairs-flowers.webp",
  "reference-empty-arena.webp",
  "logo.webp",
  ...COLOR.map((color, i) => "ring-" + (i + 1) + "-" + color + "-normalized.webp"),
  ...COLOR.map((_, i) => "row-" + (i + 1) + ".webp"),
]);
const entries = manifest.files;
if (!Array.isArray(entries) || entries.length !== expected.size) {
  throw new Error("Reference skin manifest expected exactly " + expected.size + " image files");
}
const imported = new Set();
let bytes = 0;
for (const record of entries) {
  if (!expected.has(record.file) || imported.has(record.file)) {
    throw new Error("Unexpected/duplicate reference skin file: " + record.file);
  }
  imported.add(record.file);
  const data = await readFile(new URL(record.file, root));
  if (data.toString("ascii", 0, 4) !== "RIFF" || data.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("Invalid WebP payload: " + record.file);
  }
  const digest = createHash("sha256").update(data).digest("hex");
  if (record.bytes !== data.length || record.sha256 !== digest) {
    throw new Error("Reference skin source mismatch: " + record.file);
  }
  bytes += data.length;
}
const observed = (await readdir(root)).filter((file) => path.extname(file) === ".webp");
for (const filename of observed) if (!imported.has(filename)) {
  throw new Error("Unmanifested reference skin asset: " + filename);
}
if (bytes > 3 * 1024 * 1024) {
  throw new Error("Reference art package exceeds 3 MiB review budget");
}

// These tiny Vite-imported *derived* source-paper plates live outside the
// original 20-asset package. Guard their exact approved byte provenance too:
// modified example digits must never reappear under live DOM counters.
const cleanedPlates = [
  {
    file: "moves-clean-1536.webp",
    bytes: 3654,
    sha256: "bb2936968a3653716095206f3315b067def36e6cd1aa8a41b9d60ef3f0d355a3",
  },
  {
    file: "puzzle-clean-1536.webp",
    bytes: 2510,
    sha256: "2d374361707951136b322fc39ee409b5327a2512bb03fcbec5e18372fd88c3db",
  },
];
for (const record of cleanedPlates) {
  const file = new URL("../src/assets/painted/" + record.file, import.meta.url);
  const data = await readFile(file);
  const header = data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP";
  const digest = createHash("sha256").update(data).digest("hex");
  if (!header || data.length !== record.bytes || digest !== record.sha256) {
    throw new Error("Source-cleaned live parchment asset mismatch: " + record.file);
  }
}
console.log("Verified " + imported.size + " painted image assets, " + bytes + " compressed bytes.");
console.log("Verified " + cleanedPlates.length + " source-cleaned, state-free paper plates.");
