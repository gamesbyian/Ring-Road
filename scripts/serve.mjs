import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 8000);
const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"]
]);

createServer(async (req, res) => {
  try {
    const rawPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const relative = rawPath === "/" ? "index.html" : rawPath.replace(/^\/+/, "");
    const candidate = normalize(join(root, relative));
    if (!candidate.startsWith(root)) throw new Error("outside root");
    const info = await stat(candidate);
    if (!info.isFile()) throw new Error("not file");
    const body = await readFile(candidate);
    res.writeHead(200, {
      "content-type": mime.get(extname(candidate).toLowerCase()) || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found\n");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Ring Road: http://127.0.0.1:${port}`);
});
