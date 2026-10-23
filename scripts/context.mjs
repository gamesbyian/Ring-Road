import { readFile } from "node:fs/promises";

// Share one production source-route manifest with the context-budget tooling.
const configuredRoutes = JSON.parse(await readFile("docs/agent-context-routes.json", "utf8")).productionRoutes;
const routes = { ...configuredRoutes, render: configuredRoutes.renderer };

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
  for (const file of new Set(Object.values(routes).flat())) {
    const lines = (await readFile(file, "utf8")).split(/\r?\n/);
    lines.forEach((line, index) => { if (line.toLowerCase().includes(term)) { found = true; console.log(`${file}:${index + 1}: ${line.trim()}`); } });
  }
  if (!found) process.exitCode = 1;
  process.exit();
}
console.error("Use --list, --section=<name>, or --find=<term>."); process.exit(2);
