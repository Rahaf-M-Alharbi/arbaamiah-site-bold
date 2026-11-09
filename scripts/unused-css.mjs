// Finds CSS that can never apply: selectors naming a class or id that appears nowhere in the pages or scripts,
// and @keyframes that no animation uses. Deliberately cautious: a name counts as used if it appears as a word
// anywhere in any page (root *.html) or src/js (also inside strings), so only truly orphaned rules are reported.
// Usage: node scripts/unused-css.mjs          report only
//        node scripts/unused-css.mjs --fix    also remove them from src/css (check the result with a visual comparison)
//        --gone=a,b   also treat these class names as unused: names that still appear as plain words in a script
//                     (e.g. only inside a querySelector) but that no element in the page has; check each by hand first
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fix = process.argv.includes("--fix");
const gone = new Set((process.argv.find((a) => a.startsWith("--gone=")) || "--gone=").slice(7).split(",").filter(Boolean));
const list = (dir, ext) => readdirSync(join(root, dir), { recursive: true }).filter((f) => f.endsWith(ext)).map((f) => join(dir, f));

/* every word in the markup and scripts; class and id names must be among them */
const sources = [...readdirSync(root).filter((f) => f.endsWith(".html")), ...list("src/js", ".js")].map((f) => readFileSync(join(root, f), "utf8")).join("\n");
const words = new Set(sources.match(/[A-Za-z_][\w-]*/g));

/* split a stylesheet into top-level items, keeping exact text so untouched parts are written back byte for byte */
function parse(css, from = 0, to = css.length) {
  const items = [];
  let i = from, start = from;
  while (i < to) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") { i = css.indexOf("*/", i + 2) + 2; continue; }
    if (c === '"' || c === "'") { i = skipString(css, i); continue; }
    if (c === ";" ) { i++; start = i; continue; } /* @import/@charset style statements */
    if (c === "{") {
      const end = matchBrace(css, i);
      const head = css.slice(start, i);
      const lead = head.match(/^\s*(?:\/\*[\s\S]*?\*\/\s*)*/)[0]; /* comments before the selector stay with the file, not the rule */
      const prelude = head.slice(lead.length).trim();
      const item = { prelude, start: start + lead.length, open: i, end: end + 1 };
      if (/^@(media|supports|layer|container)\b/.test(prelude)) item.children = parse(css, i + 1, end);
      items.push(item);
      i = end + 1; start = i; continue;
    }
    i++;
  }
  return items;
}
function skipString(s, i) { const q = s[i]; i++; while (i < s.length && s[i] !== q) i += s[i] === "\\" ? 2 : 1; return i + 1; }
function matchBrace(s, i) {
  let depth = 0;
  for (; i < s.length; i++) {
    const c = s[i];
    if (c === "/" && s[i + 1] === "*") { i = s.indexOf("*/", i + 2) + 1; continue; }
    if (c === '"' || c === "'") { i = skipString(s, i) - 1; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i;
  }
  throw new Error("unbalanced braces");
}
/* split a selector list on top-level commas */
function splitList(sel) {
  const out = []; let depth = 0, cur = "";
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (c === '"' || c === "'") { const j = skipString(sel, i); cur += sel.slice(i, j); i = j - 1; continue; }
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth--;
    if (c === "," && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}
/* a selector can match only if every class/id it requires exists; names inside :not() are not required */
function missing(sel) {
  let s = sel.replace(/"[^"]*"|'[^']*'/g, "").replace(/\[[^\]]*\]/g, "");
  let prev;
  do { prev = s; s = s.replace(/:not\([^()]*\)/g, ""); } while (s !== prev);
  const names = [...s.matchAll(/([.#])(-?[A-Za-z_][\w-]*)/g)];
  return names.filter(([, kind, n]) => !words.has(n) || (kind === "." && gone.has(n))).map((m) => m[2]);
}

const report = [];
let removedRules = 0, removedSelectors = 0, savedBytes = 0;
for (const file of list("src/css", ".css")) {
  const css = readFileSync(join(root, file), "utf8");
  const edits = []; /* [start, end, replacement] */
  const animationText = css; /* keyframes are checked against all CSS below */
  const walk = (items) => {
    for (const it of items) {
      if (it.children) {
        const before = edits.length;
        walk(it.children);
        const dead = it.children.length > 0 && it.children.every((ch) => edits.slice(before).some((e) => e[0] === ch.start && e[1] === ch.end && e[2] === ""));
        if (dead) { edits.splice(before); edits.push([it.start, it.end, ""]); report.push(`${file}: empty after cleanup: ${it.prelude}`); }
        continue;
      }
      if (it.prelude.startsWith("@")) continue;
      const parts = splitList(it.prelude);
      const keep = parts.filter((p) => missing(p).length === 0);
      if (keep.length === parts.length) continue;
      parts.filter((p) => !keep.includes(p)).forEach((p) => { report.push(`${file}: ${p.trim()}   [no ${missing(p).join(", ")}]`); removedSelectors++; });
      if (keep.length === 0) { edits.push([it.start, it.end, ""]); removedRules++; savedBytes += it.end - it.start; }
      else { const sel = keep.map((p) => p.trim()).join(","); savedBytes += it.open - it.start - sel.length; edits.push([it.start, it.open, sel]); }
    }
  };
  walk(parse(css));
  if (fix && edits.length) {
    let out = css;
    for (const [a, b, r] of edits.sort((x, y) => y[0] - x[0])) {
      /* a removed rule also takes the line break after it, so no blank lines are left behind */
      let e = b; if (r === "" && out[e] === "\n" && (a === 0 || out[a - 1] === "\n")) e++;
      out = out.slice(0, a) + r + out.slice(e);
    }
    writeFileSync(join(root, file), out);
  }
  void animationText;
}

/* @keyframes no animation refers to */
const allCss = list("src/css", ".css").map((f) => readFileSync(join(root, f), "utf8")).join("\n");
for (const file of list("src/css", ".css")) {
  let css = readFileSync(join(root, file), "utf8"), changed = false;
  for (const it of parse(css).reverse()) {
    const m = it.prelude.match(/^@(?:-webkit-)?keyframes\s+([\w-]+)/);
    if (!m) continue;
    const uses = allCss.replace(css.slice(it.start, it.end), "").match(new RegExp(`\\b${m[1]}\\b`, "g"));
    if (uses || words.has(m[1])) continue;
    report.push(`${file}: @keyframes ${m[1]}   [never used]`);
    removedRules++; savedBytes += it.end - it.start;
    if (fix) { let e = it.end; if (css[e] === "\n") e++; css = css.slice(0, it.start) + css.slice(e); changed = true; }
  }
  if (changed) writeFileSync(join(root, file), css);
}

console.log(report.join("\n"));
console.log(`\n${removedSelectors} unused selectors, ${removedRules} whole rules, ~${(savedBytes / 1024).toFixed(1)} KB${fix ? " removed" : " (run with --fix to remove)"}`);
