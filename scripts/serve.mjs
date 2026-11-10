// Static server for local preview, no dependencies.
//   node scripts/serve.mjs dist 8082             production preview: serves .br/.gz copies, caches fingerprinted assets for a year
//   node scripts/serve.mjs . 8082 --no-cache     development: serves the source files, never cached
// Missing files get a real 404 status.
// POST /api/assess answers with a fixed sample review (no AI, no key), so the quiz page can be tested locally.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const [dir = "dist", port = "8082", flag] = process.argv.slice(2);
const root = resolve(dir), dev = flag === "--no-cache";
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".avif": "image/avif", ".webp": "image/webp", ".mp4": "video/mp4", ".woff2": "font/woff2", ".json": "application/json",
};

const SAMPLE = {
  found: true, summary: "هذا رد تجريبي من الخادم المحلي، وليس تقييما حقيقيا لحسابك.",
  content: { rating: "متوسط", note: "نص تجريبي عن المحتوى." }, marketing: { rating: "ضعيف", note: "نص تجريبي عن التسويق." }, identity: { rating: "جيد", note: "نص تجريبي عن الهوية." },
  next_steps: ["الخطوة الأولى التجريبية", "الخطوة الثانية التجريبية", "الخطوة الثالثة التجريبية"],
};

createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/assess") {
    req.resume();
    return setTimeout(() => { res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(SAMPLE)); }, 1500);
  }
  let path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (path.endsWith("/")) path += "index.html";
  const file = join(root, path);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    const page = join(root, "404.html");  /* hosts serve /404.html for missing paths; so does the preview */
    res.writeHead(404, { "Content-Type": existsSync(page) ? TYPES[".html"] : "text/plain; charset=utf-8" });
    return res.end(existsSync(page) ? readFileSync(page) : "404 Not Found");
  }
  const headers = {
    "Content-Type": TYPES[extname(file)] || "application/octet-stream",
    "Cache-Control": dev ? "no-store" : /\.[0-9a-f]{8}\.\w+$/.test(file) ? "public, max-age=31536000, immutable" : "no-cache",
    "X-Content-Type-Options": "nosniff",
    Vary: "Accept-Encoding",
  };
  const accept = req.headers["accept-encoding"] || "";
  let body;
  for (const [enc, ext] of [["br", ".br"], ["gzip", ".gz"]]) {
    if (!dev && accept.includes(enc) && existsSync(file + ext)) { body = readFileSync(file + ext); headers["Content-Encoding"] = enc; break; }
  }
  body ??= readFileSync(file);
  res.writeHead(200, headers);
  res.end(req.method === "HEAD" ? undefined : body);
}).listen(+port, () => console.log(`serving ${root} on http://localhost:${port}${dev ? " (no cache)" : ""}`));
