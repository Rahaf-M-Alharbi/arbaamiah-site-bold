// Finds declarations that can never win: the same selector sets the same property again later in the cascade
// (same @media/@supports condition, same or stronger !important), so the earlier value is always replaced.
// A declaration is kept when the later value uses newer CSS an older browser could reject (dvh, container units,
// image-set, ...), because then the earlier one is the fallback. Files are read in the order index.html loads them.
// Usage: node scripts/overridden-css.mjs          report only
//        node scripts/overridden-css.mjs --fix    also remove them (check the result with a visual comparison)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fix = process.argv.includes("--fix");
const html = readFileSync(join(root, "index.html"), "utf8");
const files = [...html.match(/<!-- css:start[\s\S]*?<!-- css:end -->/)[0].matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
/* values that only newer browsers understand: an earlier declaration may be their fallback */
const NEWER = /\b\d*\.?\d+(dvh|svh|lvh|dvw|svw|lvw|dvi|dvb|cqw|cqh|cqi|cqb|cqmin|cqmax)\b|image-set|color-mix|:has\(|\blh\b|round\(|mod\(|rem\(|light-dark|anchor/i;

function skipString(s, i) { const q = s[i]; i++; while (i < s.length && s[i] !== q) i += s[i] === "\\" ? 2 : 1; return i + 1; }
function matchBrace(s, i) {
  let d = 0;
  for (; i < s.length; i++) {
    const c = s[i];
    if (c === "/" && s[i + 1] === "*") { i = s.indexOf("*/", i + 2) + 1; continue; }
    if (c === '"' || c === "'") { i = skipString(s, i) - 1; continue; }
    if (c === "{") d++; else if (c === "}" && --d === 0) return i;
  }
  throw new Error("unbalanced braces");
}
/* style rules in source order, each with its condition chain and declarations (with exact positions) */
function rules(css, from, to, ctx, out) {
  let i = from, start = from;
  while (i < to) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") { i = css.indexOf("*/", i + 2) + 2; if (start === i - 2 || /^\s*$/.test(css.slice(start, i - 2))) start = i; continue; }
    if (c === '"' || c === "'") { i = skipString(css, i); continue; }
    if (c === ";") { i++; start = i; continue; }
    if (c === "{") {
      const end = matchBrace(css, i), prelude = css.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, "").trim();
      if (/^@(media|supports)\b/.test(prelude)) rules(css, i + 1, end, ctx + "|" + prelude.replace(/\s+/g, " "), out);
      else if (!prelude.startsWith("@")) out.push({ sel: prelude.replace(/\s+/g, " "), ctx, start: start + (css.slice(start, i).match(/^\s*(?:\/\*[\s\S]*?\*\/\s*)*/)[0].length), open: i, close: end, decls: decls(css, i + 1, end) });
      i = end + 1; start = i; continue;
    }
    i++;
  }
  return out;
}
function decls(css, from, to) {
  const out = []; let i = from, s = from, depth = 0;
  const push = (e) => {
    const text = css.slice(s, e), m = text.match(/^\s*([-\w]+)\s*:([\s\S]*)$/);
    if (m) { const v = m[2].trim(); out.push({ prop: m[1].toLowerCase(), value: v.replace(/\s*!important\s*$/i, ""), imp: /!important\s*$/i.test(v), start: s, end: e }); }
  };
  for (; i < to; i++) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") { i = css.indexOf("*/", i + 2) + 1; continue; }
    if (c === '"' || c === "'") { i = skipString(css, i) - 1; continue; }
    if (c === "(") depth++; else if (c === ")") depth--;
    else if (c === ";" && depth === 0) { push(i); s = i + 1; }
  }
  if (css.slice(s, to).trim()) push(to);
  return out;
}

const sheets = files.map((f) => ({ f, css: readFileSync(join(root, f), "utf8") }));
const all = [];
sheets.forEach((sh, n) => rules(sh.css, 0, sh.css.length, "", []).forEach((r) => r.decls.forEach((d) => all.push({ ...d, sel: r.sel, ctx: r.ctx, sheet: n, rule: r }))));
/* walk from the end, remembering for each (condition, selector, property) whether a later declaration that every
   browser understands sets it, normally or with !important */
const later = new Map(), dead = [];
for (let k = all.length - 1; k >= 0; k--) {
  const d = all[k], key = d.ctx + "\u0000" + d.sel + "\u0000" + d.prop, l = later.get(key) || { imp: false, normal: false };
  const prefixed = /^-(webkit|moz|ms)-/.test(d.prop) || /^-(webkit|moz|ms)-/.test(d.value);
  if (!prefixed && (l.imp || (!d.imp && l.normal))) dead.push(d);
  if (!NEWER.test(d.value)) { if (d.imp) l.imp = true; else l.normal = true; }
  later.set(key, l);
}

const lines = dead.slice().reverse().map((d) => `${sheets[d.sheet].f}: ${d.ctx ? d.ctx.slice(1) + " " : ""}${d.sel} { ${d.prop}: ${d.value.slice(0, 60)}${d.imp ? " !important" : ""} }`);
console.log(lines.join("\n"));
console.log(`\n${dead.length} overridden declarations${fix ? " removed" : " (run with --fix to remove)"}`);

if (fix) {
  sheets.forEach((sh, n) => {
    const mine = dead.filter((d) => d.sheet === n);
    if (!mine.length) return;
    let css = sh.css;
    /* group by rule; a rule left with no declarations is removed whole */
    const byRule = new Map();
    mine.forEach((d) => { if (!byRule.has(d.rule)) byRule.set(d.rule, []); byRule.get(d.rule).push(d); });
    const edits = [];
    for (const [r, ds] of byRule) {
      if (ds.length === r.decls.length) {
        const a = r.start;
        let b = r.close + 1; if (css[b] === "\n" && (a === 0 || css[a - 1] === "\n")) b++;
        edits.push([a, b]);
      } else ds.forEach((d) => { let b = d.end; if (css[b] === ";") b++; edits.push([d.start, b]); });
    }
    edits.sort((x, y) => y[0] - x[0]).forEach(([a, b]) => { css = css.slice(0, a) + css.slice(b); });
    /* tidy a trailing ";}" or "{;" left where a declaration was cut */
    css = css.replace(/;\s*;/g, ";").replace(/\{\s*;/g, "{").replace(/;(\s*)\}/g, "$1}");
    writeFileSync(join(root, sh.f), css);
  });
}
