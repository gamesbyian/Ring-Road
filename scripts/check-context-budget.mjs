import { readFile, stat } from "node:fs/promises";

const config = JSON.parse(await readFile("docs/agent-context-routes.json", "utf8"));
let failed = false;

for (const item of config.authorities || []) {
  const bytes = (await stat(item.path)).size;
  if (bytes >= item.compactAtBytes) {
    failed = true;
    console.error(`context trigger exceeded: ${item.path} is ${bytes} bytes; compactAtBytes=${item.compactAtBytes}`);
  }
}

if (failed) process.exit(1);
console.log("context budgets: ok");
