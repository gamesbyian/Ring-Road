import { readFile } from "node:fs/promises";

const routes = {
  domain: ["src/domain/puzzle.ts", "src/domain/authoring.ts", "src/test/domain.test.ts"],
  solver: ["src/domain/solver.ts", "src/test/domain.test.ts"],
  campaign: ["src/content/campaign.ts", "src/test/domain.test.ts"],
  state: ["src/app/game-state.ts", "src/test/game-state.test.ts"],
  render: ["src/render/RingBoard.tsx", "src/render/ring-geometry.ts", "src/styles/app.css"],
  ui: ["src/App.tsx", "src/ui/Modal.tsx", "src/styles/app.css"],
  tooling: ["package.json", "vite.config.ts", "tsconfig.json", "scripts/check-repo.mjs"]
};
const args = process.argv.slice(2);
const arg = (name) => args.find((item) => item.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
if (!args.length || args.includes("--list")) {
  Object.entries(routes).forEach(([name, files]) => console.log(`${name.padEnd(10)} ${files.join(", ")}`));
  if (!args.length) console.log("\nUse --section=<name> or --find=<term>.");
  process.exit(0);
}
const section = arg("section");
if (section) {
  const files = routes[section];
  if (!files) { console.error(`Unknown section: ${section}`); process.exit(2); }
  for (const file of files) console.log(`\n--- ${file} ---\n${await readFile(file, "utf8")}`);
  process.exit(0);
}
const term = arg("find")?.toLowerCase();
if (term) {
  let found = false;
  for (const files of Object.values(routes)) for (const file of files) {
    const lines = (await readFile(file, "utf8")).split(/\r?\n/);
    lines.forEach((line, index) => { if (line.toLowerCase().includes(term)) { found = true; console.log(`${file}:${index + 1}: ${line.trim()}`); } });
  }
  if (!found) process.exitCode = 1;
  process.exit();
}
console.error("Use --list, --section=<name>, or --find=<term>."); process.exit(2);
