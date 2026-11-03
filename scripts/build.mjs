// Build: source files → dist/ (what you deploy or double-click).
//  - concatenates the css/js files listed between the css:start/css:end and js:start/js:end markers in each page, in order
//  - strips CSS comments and indentation (nothing else, so the cascade is untouched)
//  - fingerprints bundles (site.<hash>.css) so they can be cached forever
//  - copies assets/, rewrites paths, preloads the bundles
// No dependencies. Usage: node scripts/build.mjs
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const read = (p) => readFileSync(join(root, p), "utf8");
const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 8);

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "assets/css"), { recursive: true });
mkdirSync(join(dist, "assets/js"), { recursive: true });
cpSync(join(root, "assets/fonts"), join(dist, "assets/fonts"), { recursive: true });
cpSync(join(root, "assets/img"), join(dist, "assets/img"), { recursive: true });

const block = (html, name) => {
  const m = html.match(new RegExp(`<!-- ${name}:start[^>]*-->([\\s\\S]*?)<!-- ${name}:end -->`));
  return m ? { whole: m[0], files: [...m[1].matchAll(/(?:href|src)="([^"]+)"/g)].map((x) => x[1]) } : null;
};
const minCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map((l) => l.trim()).filter(Boolean).join("\n");

const sizes = [];
for (const page of ["index.html", "pricing.html"]) {
  let html = read(page);
  const css = block(html, "css"), js = block(html, "js");
  const cssText = minCss(css.files.map((f) => read(f)).join("\n")).replaceAll("../../assets/", "../");
  const cssName = `${page.startsWith("index") ? "site" : "pricing"}.${hash(cssText)}.css`;
  writeFileSync(join(dist, "assets/css", cssName), cssText);
  /* each script keeps its own try/catch so one failure cannot stop the rest, as with separate <script> tags */
  const jsText = js.files.map((f) => `try{\n${read(f)}\n}catch(e){console.error(${JSON.stringify(f)},e)}`).join("\n;\n");
  const jsName = `${page.startsWith("index") ? "site" : "pricing"}.${hash(jsText)}.js`;
  writeFileSync(join(dist, "assets/js", jsName), jsText);
  html = html.replace(css.whole, `<link rel="stylesheet" href="assets/css/${cssName}">`)
             .replace(js.whole, `<script src="assets/js/${jsName}" defer></script>`);
  writeFileSync(join(dist, page), html);
  sizes.push(`${page}: ${cssName} ${(cssText.length / 1024).toFixed(0)} KB, ${jsName} ${(jsText.length / 1024).toFixed(0)} KB`);
}
console.log("built dist/\n  " + sizes.join("\n  "));
