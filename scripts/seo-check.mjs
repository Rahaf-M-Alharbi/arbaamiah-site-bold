/* Checks the built site (dist/) for the basics search engines and screen readers rely on. Run after `npm run build`: node scripts/seo-check.mjs
   Fails (exit 1) on: missing/duplicate title or description, not exactly one h1, no <main>, img without alt, broken internal link, noindex page listed in the sitemap. */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const pages = readdirSync(dist).filter((f) => f.endsWith(".html") && f !== "404.html");
const sitemap = existsSync(join(dist, "sitemap.xml")) ? readFileSync(join(dist, "sitemap.xml"), "utf8") : "";
const problems = [], titles = new Map(), descs = new Map();
const bad = (page, msg) => problems.push(`${page}: ${msg}`);

for (const page of pages) {
  const html = readFileSync(join(dist, page), "utf8");
  const title = (html.match(/<title>(.*?)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const noindex = /<meta name="robots" content="noindex"/.test(html);
  if (!title) bad(page, "no <title>"); else titles.set(title, [...(titles.get(title) || []), page]);
  if (!desc) { if (!noindex) bad(page, "no meta description"); } else { descs.set(desc, [...(descs.get(desc) || []), page]); if (desc.length > 170) bad(page, `description is ${desc.length} characters (aim for 70-160)`); }
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) bad(page, `${h1} <h1> (want 1)`);
  if (!/<main[\s>]/.test(html)) bad(page, "no <main>");
  for (const img of html.match(/<img\b[^>]*>/g) || []) if (!/\balt=/.test(img)) bad(page, "img without alt: " + img.slice(0, 80));
  for (const [, href] of html.matchAll(/<a\b[^>]*\shref="([^"#?:]+)(?:[?#][^"]*)?"/g)) {
    if (/\.html$/.test(href)) bad(page, "link with .html (the host redirects it): " + href);
    else if (!href.includes("/") && !href.includes(".") && !existsSync(join(dist, href + ".html"))) bad(page, "broken link " + href);
  }
  if (noindex && sitemap.includes(`/${page.replace(/\.html$/, "")}<`)) bad(page, "noindex page is in sitemap.xml");
}
for (const [t, p] of titles) if (p.length > 1) bad(p.join(", "), `same title "${t}"`);
for (const [d, p] of descs) if (p.length > 1) bad(p.join(", "), `same description "${d.slice(0, 40)}…"`);
if (!sitemap) console.log("note: no sitemap.xml, canonical or social tags yet (set the domain in src/data/site.json or SITE_URL)");
console.log(`${pages.length} pages checked, ${problems.length} problems`);
problems.forEach((p) => console.log("  - " + p));
process.exit(problems.length ? 1 : 0);
