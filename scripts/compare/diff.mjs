// Compares two snapshots property by property. Usage: node scripts/compare/diff.mjs compare-snaps/before.json compare-snaps/after.json
// Spellings that mean the same thing are ignored: server/port, fingerprinted file names, quote style, and the velvet
// photo served as AVIF through image-set() with the JPEG as fallback.
import { readFileSync } from "node:fs";

const [A, B] = process.argv.slice(2);
const a = JSON.parse(readFileSync(A)), b = JSON.parse(readFileSync(B));
const norm = (v) => v === undefined ? v : String(v)
  .replace(/http:\/\/localhost:\d+\//g, "/")
  .replace(/\.[0-9a-f]{8}(\.(?:svg|png|jpg|avif|woff2))/g, "$1")
  .replace(/'/g, '"')
  .replace(/image-set\(url\(("?)([^)"]*)velvet\.avif\1\)[^,]*,\s*url\(("?)([^)"]*velvet\.jpg)\3\)[^)]*\)\)/g, "url($3$4$3)")
  .replace(/\.\.\/\.\.\/assets\//g, "../");
const props = (s) => Object.fromEntries(s.split("\u0001").map((x) => x.split("\u0002")));

let compared = 0, differing = 0;
const byProp = {}, examples = [];
for (const phase of Object.keys(a)) {
  const x = a[phase], y = b[phase] || {};
  for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
    compared++;
    if (x[k] === y[k]) continue;
    if (!x[k] || !y[k]) { differing++; examples.push(`${phase} ${x[k] ? "missing in second" : "only in second"}: ${k}`); continue; }
    const p = props(x[k]), q = props(y[k]);
    let hit = false;
    for (const n of new Set([...Object.keys(p), ...Object.keys(q)])) {
      if (norm(p[n]) === norm(q[n])) continue;
      hit = true; byProp[n] = (byProp[n] || 0) + 1;
      if (examples.length < 40) examples.push(`${phase} ${k.slice(-70)} :: ${n}: ${String(p[n]).slice(0, 80)} -> ${String(q[n]).slice(0, 80)}`);
    }
    if (hit) differing++;
  }
}
console.log(`compared ${compared} element styles; differing ${differing}`);
if (differing) { console.log(byProp); console.log(examples.join("\n")); }
