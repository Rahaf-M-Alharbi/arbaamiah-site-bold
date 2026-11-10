/* Writes the nine services as plain HTML into #stack on services.html and index.html, so crawlers, screen readers and no-JS visitors get them in the first response.
   The data stays in one place, src/js/05-services-panels.js (arrays P, F, G); that script empties #stack and draws the cards on top.
   Run `node scripts/sync-services.mjs` after editing the service texts there. (scripts/build.mjs does not run it; commit the result.) */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/js/05-services-panels.js"), "utf8");
const grab = (n) => src.match(new RegExp(`var ${n}=(\\[[\\s\\S]*?\\]);`))[1];
const { P, F, G } = vm.runInNewContext(`({P:${grab("P")},F:${grab("F")},G:${grab("G")}})`);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const full = `<div class="svc-fb">${P.map((p, i) => `<article><h4>${esc(p[0])}</h4><p>${esc(F[i])}</p><ul>${G[i].map((t) => `<li>${esc(t)}</li>`).join("")}</ul></article>`).join("")}</div>`;
const names = `<ul class="svc-fb">${P.map((p) => `<li>${esc(p[0])}</li>`).join("")}</ul>`;

for (const [file, open, html] of [["services.html", '<div class="stack" id="stack" data-full>', full], ["index.html", '<div class="stack" id="stack">', names]]) {
  const p = join(root, file);
  const page = readFileSync(p, "utf8");
  const re = new RegExp(`${open.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?</div>(?=\\n)`);
  if (!re.test(page)) { console.log("stack not found in", file); continue; }
  writeFileSync(p, page.replace(re, () => `${open}${html}</div>`));
}
console.log("services written:", P.length);
