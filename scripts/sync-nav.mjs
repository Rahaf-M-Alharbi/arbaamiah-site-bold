/* Writes the one navigation bar (src/partials/nav.html) into every page, so it is the same component everywhere.
   Run `node scripts/sync-nav.mjs` after changing the partial. index.html keeps the bar hidden until you scroll past the hero;
   the other pages show it at once (class "on"). Pages other than index and services also get "pg": the bar sits in the page flow's top margin. */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tpl = readFileSync(join(root, "src/partials/nav.html"), "utf8").trim();
const pages = readdirSync(root).filter((f) => f.endsWith(".html") && f !== "pricing.html");
const section = (f) => (f.startsWith("project-") ? "projects.html" : f);

for (const f of pages) {
  const cls = f === "index.html" ? "" : f === "services.html" ? " on" : " on pg";
  let html = readFileSync(join(root, f), "utf8");
  let bar = tpl.replace("{{CLASS}}", cls);
  const here = section(f);
  bar = bar.replace(new RegExp(`<a href="${here}">`), `<a href="${here}" aria-current="page">`);
  const re = /<header class="(?:mini|pg-top)[^"]*"[^>]*>[\s\S]*?<\/header>/;
  if (!re.test(html)) { console.log("no header in", f); continue; }
  html = html.replace(re, () => bar);
  for (const s of ["13-nav-contrast", "19-nav"]) {
    if (!html.includes(`src/js/${s}.js`)) html = html.replace("<!-- js:end -->", `<script src="src/js/${s}.js" defer></script>\n<!-- js:end -->`);
  }
  writeFileSync(join(root, f), html);
}
console.log("nav synced into", pages.length, "pages");
