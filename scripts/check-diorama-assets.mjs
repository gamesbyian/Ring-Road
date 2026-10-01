import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = new URL("../src/assets/diorama/", import.meta.url);
const MANIFEST = new URL("../src/assets/diorama/manifest.ts", import.meta.url);
const ALLOWED = new Set([".svg", ".webp", ".avif", ".png"]);
const MAX_BYTES = 700 * 1024;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const resolved = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) files.push(...await walk(resolved));
    else files.push(resolved);
  }
  return files;
}

const manifest = await readFile(MANIFEST, "utf8");
const files = (await walk(ROOT)).filter((url) => !url.pathname.endsWith("/manifest.ts"));
const failures = [];

for (const file of files) {
  const extension = path.extname(file.pathname).toLowerCase();
  const filename = path.basename(file.pathname);
  const fileStat = await stat(file);

  if (!ALLOWED.has(extension)) {
    failures.push(`${filename}: unsupported runtime diorama format ${extension}`);
  }
  if (fileStat.size > MAX_BYTES) {
    failures.push(`${filename}: ${fileStat.size} bytes exceeds the 700 KB review threshold`);
  }
  if (!manifest.includes(filename)) {
    failures.push(`${filename}: missing from src/assets/diorama/manifest.ts`);
  }
}

for (const required of ["desktop", "mobile", "width", "height", "critical", "loading", "provenance"]) {
  if (!manifest.includes(required)) {
    failures.push(`manifest is missing required field/token: ${required}`);
  }
}

if (failures.length) {
  console.error("Diorama asset validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Diorama asset validation passed for ${files.length} runtime assets.`);
