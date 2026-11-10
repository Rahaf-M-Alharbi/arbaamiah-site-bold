/* Writes the shared parts into every page, so each is one component everywhere: the navigation bar (src/partials/nav.html), the closing pull-a-card call to action (src/partials/cta-pull.html, on pages that have one) and the footer (src/partials/footer.html).
   Run `node scripts/sync-nav.mjs` after changing the partial. index.html keeps the bar hidden until you scroll past the hero;
   the other pages show it at once (class "on"). Pages other than index and services also get "pg": the bar sits in the page flow's top margin. */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tpl = readFileSync(join(root, "src/partials/nav.html"), "utf8").trim();
const footer = readFileSync(join(root, "src/partials/footer.html"), "utf8").trim();
const cta = readFileSync(join(root, "src/partials/cta-pull.html"), "utf8").trim();
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
  /* skip link: first focusable element, jumps to the page's <main> (gets id="main" when it has none) */
  html = html.replace(/<main(?![^>]*\bid=)/, '<main id="main"');
  const target = (html.match(/<main[^>]*\bid="([^"]+)"/) || [])[1] || "main";
  html = html.replace(/<a class="skip"[^>]*>[^<]*<\/a>\n?/, "");
  html = html.replace(re, () => `<a class="skip" href="#${target}">انتقل إلى المحتوى</a>\n${bar}`);
  html = html.replace(/<section class="xp xp9"[\s\S]*?<\/section>/, () => cta);
  html = html.replace(/<footer class="ft"[\s\S]*?<\/footer>/, () => footer);
  for (const s of ["13-nav-contrast", "19-nav"]) {
    if (!html.includes(`src/js/${s}.js`)) html = html.replace("<!-- js:end -->", `<script src="src/js/${s}.js" defer></script>\n<!-- js:end -->`);
  }
  /* email links open a card (open mail app / Gmail / copy): src/js/20-mail-link.js + src/css/49-mail-link.css */
  if (!html.includes("20-mail-link.js")) html = html.replace("<!-- js:end -->", `<script src="src/js/20-mail-link.js" defer></script>\n<!-- js:end -->`);
  if (!html.includes("49-mail-link.css")) html = html.replace("<!-- css:end -->", `<link rel="stylesheet" href="src/css/49-mail-link.css">\n<!-- css:end -->`);
  writeFileSync(join(root, f), html);
}
console.log("nav synced into", pages.length, "pages");
