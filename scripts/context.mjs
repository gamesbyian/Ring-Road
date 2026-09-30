import { readFile } from "node:fs/promises";

const source = await readFile("index.html", "utf8");
const lines = source.split(/\r?\n/);

const regions = [
  ["config", "      // ===== Core configuration =====", "      // ===== SVG icon helpers ====="],
  ["authoring", "      // Puzzle-authoring workflow", "      // ===== Prime-only campaign data ====="],
  ["campaign", "      // ===== Prime-only campaign data =====", "      // ===== Puzzle-model helpers ====="],
  ["model", "      // ===== Puzzle-model helpers =====", "      // ===== Validation helpers ====="],
  ["validation", "      // ===== Validation helpers =====", "      // Puzzle-model note:"],
  ["solver", "      // Puzzle-model note:", "      // ===== React app ====="],
  ["app", "      // ===== React app =====", null]
];

const args = process.argv.slice(2);
const getArg = (name) => {
  const prefix = `--${name}=`;
  const hit = args.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
};

const lineOf = (marker) => lines.findIndex((line) => line.includes(marker.trim()));

if (args.includes("--list") || args.length === 0) {
  for (const [name, start, end] of regions) {
    const first = lineOf(start) + 1;
    const endIndex = end ? lineOf(end) : lines.length;
    const last = endIndex > 0 ? endIndex : lines.length;
    console.log(`${name.padEnd(11)} lines ${first}-${last}`);
  }
  if (args.length === 0) {
    console.log("\nUse --section=<name> or --find=<term>.");
  }
  process.exit(0);
}

const section = getArg("section");
if (section) {
  const region = regions.find(([name]) => name === section);
  if (!region) {
    console.error(`Unknown section: ${section}`);
    process.exit(2);
  }
  const [, start, end] = region;
  const startIndex = lineOf(start);
  const endIndex = end ? lineOf(end) : lines.length;
  if (startIndex < 0 || (end && endIndex < 0)) {
    console.error(`Section markers for ${section} are missing.`);
    process.exit(1);
  }
  console.log(lines.slice(startIndex, endIndex).join("\n"));
  process.exit(0);
}

const term = getArg("find");
if (term) {
  const needle = term.toLowerCase();
  const matches = [];
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(needle)) matches.push(index);
  });
  if (!matches.length) {
    console.error(`No matches for: ${term}`);
    process.exit(1);
  }
  const radius = 8;
  let previousEnd = -1;
  for (const index of matches.slice(0, 12)) {
    const start = Math.max(0, index - radius);
    const end = Math.min(lines.length, index + radius + 1);
    if (start <= previousEnd) continue;
    console.log(`--- lines ${start + 1}-${end} ---`);
    lines.slice(start, end).forEach((line, offset) => {
      console.log(`${String(start + offset + 1).padStart(4)} | ${line}`);
    });
    previousEnd = end;
  }
  if (matches.length > 12) console.log(`... ${matches.length - 12} more matches omitted`);
  process.exit(0);
}

console.error("Use --list, --section=<name>, or --find=<term>.");
process.exit(2);
