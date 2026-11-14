// Design-system guard: fails when new work bypasses the shared tokens and components instead of reusing them.
// Runs as part of `npm run check` (and so in CI before every deploy). Usage: node scripts/design-check.mjs
//  1. every page (except the stand-alone pricing.html) loads src/css/00-tokens.css first and src/css/50-reduced-motion.css last, and only stylesheets that exist
//  2. tokens are defined only in 00-tokens.css: no other file declares a custom property on :root
//  3. no stylesheet writes a colour that already has a token (write var(--wine), not #6c171e)
//  4. no stylesheet introduces a new raw colour: add it to 00-tokens.css, or, for a true one-off, to ONE_OFF below with a reason
//  5. fonts come from the tokens (var(--f-disp) / var(--f-body)); @font-face lives only in 00-fonts.css
//  6. no colour hex in inline style="" attributes of pages or partials
//  7. every page is in the build list (scripts/build.mjs), so it is deployed
//  8. the bold look comes from tokens: an ink outline, hard ink shadow, border-radius or easing curve that has a token is written as var(--…)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);
const lineOf = (text, i) => text.slice(0, i).split("\n").length;

/* one-off colours that were in the design before the token file existed (illustrations, status reds, subtle tints).
   Add here only with a reason; anything used twice or meaning a role (text, surface, border, action) belongs in 00-tokens.css. */
const ONE_OFF = new Set(["#fff", "#000", "#154a3b", "#1a0605", "#1a0d0a", "#1d1a17", "#1f1814", "#4a1a1d", "#5a3a35", "#6b4a00", "#7a1710", "#7a1d1d", "#8a1c14", "#8a2229", "#8a6b57", "#8a7a72", "#8d8b87", "#9a2f26", "#b3261e", "#b3382a", "#c9ab8c", "#d1a84b", "#d3cdc1", "#d3e8de", "#d98b6a", "#d9b88f", "#d9c8a6", "#e8b4a0", "#efe6d4", "#efe6d6", "#efe8d9", "#f3e8d8", "#f6e3b4", "#fde3df", "#fffaf2"]);

/* the tokens: name → value, read from 00-tokens.css itself so this check never drifts from it */
const tokensCss = read("src/css/00-tokens.css");
const tokenByHex = {};
for (const m of tokensCss.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g)) tokenByHex[m[2].toLowerCase()] ??= m[1];

/* the bold-look tokens (--border-*, --shadow-*, --radius-*, --ease*): literal value → name, so "border-radius:14px" can be pointed at var(--radius-14) */
const lookToken = {};
for (const m of tokensCss.matchAll(/--((?:border|shadow|radius|ease)[a-z0-9-]*)\s*:\s*([^;]+);/g)) lookToken[m[2].trim()] = m[1];
const END = "(?=\\s*(?:[;},]|!important))";
const LOOK = [
  [new RegExp("(?<=[:,]\\s*)\\d+px \\d+px 0 var\\(--ink-900\\)" + END, "g"), "shadow"],
  [new RegExp("(?<=\\bborder(?:-[a-z-]+)?:\\s*)\\d+px solid var\\(--ink-900\\)" + END, "g"), "outline"],
  [new RegExp("(?<=\\bborder-radius:\\s*)\\d+(?:px|%)" + END, "g"), "radius"],
  [/cubic-bezier\([^)]*\)/g, "easing"],
];

/* 1. pages */
const pages = readdirSync(root).filter((f) => f.endsWith(".html") && f !== "pricing.html");
const buildList = read("scripts/build.mjs");
for (const page of pages) {
  const html = read(page);
  if (!page.startsWith("project-") && !buildList.includes(`"${page}"`)) fail(page, "not in the pages list of scripts/build.mjs, so it would not be deployed");
  const block = html.match(/<!-- css:start[\s\S]*?<!-- css:end -->/);
  if (!block) { fail(page, "no <!-- css:start --> … <!-- css:end --> block; start new pages from faq.html"); continue; }
  const sheets = [...block[0].matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]);
  if (sheets[0] !== "src/css/00-tokens.css") fail(page, `first stylesheet must be src/css/00-tokens.css (found ${sheets[0] || "none"})`);
  if (sheets.at(-1) !== "src/css/50-reduced-motion.css") fail(page, `last stylesheet must be src/css/50-reduced-motion.css, so "Reduce motion" visitors get soft motion (found ${sheets.at(-1) || "none"})`);
  for (const s of sheets) if (!existsSync(join(root, s))) fail(page, `links a stylesheet that does not exist: ${s}`);
}

/* 2–5. stylesheets */
const cssFiles = readdirSync(join(root, "src/css")).filter((f) => f.endsWith(".css") && f !== "00-tokens.css");
for (const f of cssFiles) {
  const file = `src/css/${f}`, css = read(file).replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));   /* comments blanked, line numbers kept */
  for (const m of css.matchAll(/:root\s*\{([^}]*)\}/g)) if (/--[\w-]+\s*:/.test(m[1])) fail(`${file}:${lineOf(css, m.index)}`, "defines tokens on :root; move them to src/css/00-tokens.css");
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const hex = m[0].toLowerCase(), at = `${file}:${lineOf(css, m.index)}`;
    if (tokenByHex[hex]) fail(at, `${m[0]} is a token: write var(--${tokenByHex[hex]})`);
    else if (!ONE_OFF.has(hex) && /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(hex)) fail(at, `new raw colour ${m[0]}: add a token to src/css/00-tokens.css (or a reasoned entry in ONE_OFF in scripts/design-check.mjs)`);
  }
  for (const [re, what] of LOOK) for (const m of css.matchAll(re)) if (lookToken[m[0]]) fail(`${file}:${lineOf(css, m.index)}`, `${what} ${m[0]} is a token: write var(--${lookToken[m[0]]})`);
  if (f !== "00-fonts.css") {
    if (/@font-face/.test(css)) fail(file, "@font-face belongs in src/css/00-fonts.css");
    for (const m of css.matchAll(/font(?:-family)?\s*:[^;}]*['"](Thmanyah[^'"]*|IBM Plex[^'"]*)['"]/g)) fail(`${file}:${lineOf(css, m.index)}`, `font named directly ('${m[1]}'): use var(--f-disp) or var(--f-body)`);
  }
}

/* 6. inline styles in pages and partials */
for (const f of [...pages, ...readdirSync(join(root, "src/partials")).map((p) => `src/partials/${p}`)]) {
  const html = read(f);
  for (const m of html.matchAll(/style="[^"]*#[0-9a-fA-F]{3,8}\b[^"]*"/g)) fail(`${f}:${lineOf(html, m.index)}`, "colour hex in an inline style; use a class or var(--token)");
}

if (errors.length) {
  console.error(`design check: ${errors.length} problem(s). Reuse src/css/00-tokens.css and the components in src/css/19-components.css (see CLAUDE.md).`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(`design check: ${pages.length} pages and ${cssFiles.length + 1} stylesheets use the shared design system`);
