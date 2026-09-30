import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, normalize, resolve } from "node:path";

const root = process.cwd();
const source = await readFile("index.html", "utf8");
const failures = [];

const fail = (message) => failures.push(message);
const requireText = (text, label) => {
  if (!source.includes(text)) fail(`index.html missing ${label}: ${text}`);
};

requireText('<div id="root"></div>', "React root");
requireText("ReactDOM.createRoot", "React mount");
requireText("// ===== Core configuration =====", "configuration section marker");
requireText("// ===== Prime-only campaign data =====", "campaign section marker");
requireText("// ===== Puzzle-model helpers =====", "model section marker");
requireText("// ===== Validation helpers =====", "validation section marker");
requireText("// ===== React app =====", "React app section marker");

const numberConstant = (name) => {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*(\\d+)\\s*;`));
  if (!match) {
    fail(`missing numeric constant ${name}`);
    return NaN;
  }
  return Number(match[1]);
};

const ringCount = numberConstant("RING_COUNT");
const maxCenter = numberConstant("MAX_CENTER_RING_CYCLE");
const maxFirstOuter = numberConstant("MAX_FIRST_OUTER_RING_CYCLE");
const maxRemaining = numberConstant("MAX_REMAINING_OUTER_RING_CYCLE");

if (ringCount !== 7) fail(`RING_COUNT expected 7, got ${ringCount}`);

const campaignMatch = source.match(/const\s+CAMPAIGN_PUZZLES\s*=\s*\[([\s\S]*?)\n\s*\];/);
if (!campaignMatch) {
  fail("could not locate CAMPAIGN_PUZZLES");
} else {
  const entryPattern = /\{\s*id:\s*(\d+),\s*targetMoves:\s*(\d+),\s*ringCycles:\s*\[([^\]]+)\],\s*initial:\s*\[([^\]]+)\],\s*authoring:\s*\{\s*requireWrapInIntendedPlan:\s*(true|false)\s*\}\s*\}/g;
  const puzzles = [];
  for (const match of campaignMatch[1].matchAll(entryPattern)) {
    const nums = (value) => value.split(",").map((part) => Number(part.trim()));
    puzzles.push({
      id: Number(match[1]),
      targetMoves: Number(match[2]),
      ringCycles: nums(match[3]),
      initial: nums(match[4]),
      requireWrap: match[5] === "true"
    });
  }

  if (!puzzles.length) fail("CAMPAIGN_PUZZLES contained no parseable entries");

  const isPrime = (value) => {
    if (value < 2) return false;
    for (let i = 2; i * i <= value; i += 1) if (value % i === 0) return false;
    return true;
  };

  const ids = new Set();
  puzzles.forEach((puzzle, index) => {
    if (ids.has(puzzle.id)) fail(`duplicate puzzle id ${puzzle.id}`);
    ids.add(puzzle.id);
    if (puzzle.id !== index + 1) fail(`puzzle ids must be sequential; position ${index + 1} has id ${puzzle.id}`);
    if (!(puzzle.targetMoves > 0)) fail(`puzzle ${puzzle.id}: targetMoves must be positive`);
    if (puzzle.ringCycles.length !== ringCount) fail(`puzzle ${puzzle.id}: expected ${ringCount} ringCycles`);
    if (puzzle.initial.length !== ringCount) fail(`puzzle ${puzzle.id}: expected ${ringCount} initial states`);

    puzzle.ringCycles.forEach((cycle, ringIndex) => {
      const limit = ringIndex === 0 ? maxCenter : ringIndex === 1 ? maxFirstOuter : maxRemaining;
      if (!isPrime(cycle) || cycle > limit) {
        fail(`puzzle ${puzzle.id} ring ${ringIndex}: invalid cycle ${cycle} (prime <= ${limit} required)`);
      }
      const initial = puzzle.initial[ringIndex];
      if (!Number.isInteger(initial) || initial < 0 || initial >= cycle) {
        fail(`puzzle ${puzzle.id} ring ${ringIndex}: initial ${initial} outside 0..${cycle - 1}`);
      }
    });
  });
}

const markdownFiles = [];
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = join(path, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.isFile() && entry.name.endsWith(".md")) markdownFiles.push(full);
  }
}
await walk(root);

for (const file of markdownFiles) {
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim();
    if (!target || target.startsWith("http://") || target.startsWith("https://") || target.startsWith("mailto:") || target.startsWith("#")) continue;
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
