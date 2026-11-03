// Receives snapshots from snapshot.js and saves them as compare-snaps/<TAG>.json. Usage: node scripts/compare/collect.mjs
import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "../../compare-snaps");
mkdirSync(out, { recursive: true });
createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") return res.end();
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const tag = req.url.slice(1).replace(/[^\w-]/g, "_");
    writeFileSync(join(out, tag + ".json"), Buffer.concat(chunks));
    console.log("saved", tag);
    res.end("ok");
  });
}).listen(8090, () => console.log("collecting on http://localhost:8090 into compare-snaps/"));
