import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, normalize, resolve } from "node:path";

const root = process.cwd();
const failures = [];
const fail = (message) => failures.push(message);
const required = [
  "index.html",
  "package-lock.json",
  "src/main.tsx",
  "src/App.tsx",
  "src/domain/puzzle.ts",
  "src/domain/solver.ts",
  "src/content/campaign.ts",
  "src/app/game-state.ts",
  "src/render/RingBoard.tsx",
  "scripts/browser-smoke.mjs",
  ".github/workflows/pages.yml",
  "prototype/v1/index.html",
  "prototype/v1/README.md",
  "prototype/v1/SHA256SUMS",
];

for (const file of required) {
  try {
    await stat(file);
  } catch {
    fail(`missing required production/reference file: ${file}`);
  }
}

const html = await readFile("index.html", "utf8");
if (!html.includes('/src/main.tsx')) {
  fail("index.html must mount the production TypeScript application");
}

const viteConfig = await readFile("vite.config.ts", "utf8");
if (!viteConfig.includes('base: "/Ring-Road/"')) {
  fail('vite.config.ts must use base "/Ring-Road/" for the project Pages URL');
}

const pagesWorkflow = await readFile(".github/workflows/pages.yml", "utf8");
if (!pagesWorkflow.includes("actions/upload-pages-artifact@v3") || !pagesWorkflow.includes("path: dist")) {
  fail("Pages workflow must publish the built dist directory");
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
for (const script of ["dev", "typecheck", "test", "build", "check", "browser:smoke"]) {
  if (!packageJson.scripts?.[script]) fail(`package.json missing ${script} script`);
}

const campaign = await readFile("src/content/campaign.ts", "utf8");
const ids = [...campaign.matchAll(/\bid:\s*(\d+),/g)].map((match) => Number(match[1]));
if (ids.length !== 12 || ids.some((id, index) => id !== index + 1)) {
  fail("production campaign must contain sequential puzzle IDs 1-12");
}

const checksumRecord = (await readFile("prototype/v1/SHA256SUMS", "utf8")).trim();
const [expectedPrototypeHash, prototypeName] = checksumRecord.split(/\s+/);
const prototypeBytes = await readFile("prototype/v1/index.html");
const actualPrototypeHash = createHash("sha256").update(prototypeBytes).digest("hex");
if (prototypeName !== "index.html" || actualPrototypeHash !== expectedPrototypeHash) {
  fail("prototype/v1/index.html no longer matches its frozen SHA-256 record");
}

const markdownFiles = [];
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist"].includes(entry.name)) continue;
    const full = join(path, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith(".md")) markdownFiles.push(full);
  }
}
await walk(root);

for (const file of markdownFiles) {
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim();
    if (!target || /^(https?:|mailto:|#)/.test(target)) continue;
    target = target.split("#")[0];
    if (!target) continue;
    const resolved = normalize(resolve(dirname(file), target));
    if (!resolved.startsWith(root)) {
      fail(`${file}: link escapes repository: ${match[1]}`);
      continue;
    }
    try {
      await stat(resolved);
    } catch {
      fail(`${file}: broken local link: ${match[1]}`);
    }
  }
}

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log("repository checks: ok");
