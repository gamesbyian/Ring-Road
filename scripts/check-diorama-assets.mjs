import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = new URL("../src/assets/diorama/", import.meta.url);
const MANIFEST = new URL("../src/assets/diorama/manifest.ts", import.meta.url);
const ALLOWED = new Set([".svg", ".webp", ".avif", ".png"]);
const MAX_BYTES = 700 * 1024;
const PACKAGE_BUDGETS = { desktop: 1.5 * 1024 * 1024, textures: 128 * 1024 };
const MAX_LAYERS = { desktop: 4 };

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
const packageBytes = { desktop: 0, textures: 0 };
const packageCounts = { desktop: 0, textures: 0 };

for (const file of files) {
  const extension = path.extname(file.pathname).toLowerCase();
  const filename = path.basename(file.pathname);
  const fileStat = await stat(file);
  const variant = file.pathname.includes("/desktop/")
    ? "desktop"
    : file.pathname.includes("/textures/")
      ? "textures"
      : null;

  if (!ALLOWED.has(extension)) failures.push(`${filename}: unsupported runtime diorama format ${extension}`);
  if (fileStat.size > MAX_BYTES) failures.push(`${filename}: ${fileStat.size} bytes exceeds the 700 KB review threshold`);
  if (!manifest.includes(filename)) failures.push(`${filename}: missing from src/assets/diorama/manifest.ts`);

  if (!variant) {
    failures.push(`${filename}: runtime art must live under desktop/ or textures/`);
  } else {
    packageBytes[variant] += fileStat.size;
    packageCounts[variant] += 1;
  }
}

for (const variant of ["desktop", "textures"]) {
  if (packageBytes[variant] > PACKAGE_BUDGETS[variant]) {
    failures.push(`${variant} art package is ${packageBytes[variant]} bytes, above its ${PACKAGE_BUDGETS[variant]} byte budget`);
  }
  if (variant === "desktop" && packageCounts[variant] > MAX_LAYERS[variant]) {
    failures.push(`${variant} art package has ${packageCounts[variant]} layers, above its ${MAX_LAYERS[variant]}-layer budget`);
  }
}

for (const required of ["desktop", "width", "height", "critical", "loading", "provenance"]) {
  if (!manifest.includes(required)) failures.push(`manifest is missing required field/token: ${required}`);
}

if (failures.length) {
  console.error("Diorama asset validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Diorama asset validation passed for ${files.length} runtime assets (desktop: ${packageBytes.desktop} bytes, textures: ${packageBytes.textures} bytes).`);
