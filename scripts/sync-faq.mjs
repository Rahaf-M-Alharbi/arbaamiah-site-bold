// Writes the FAQ questions from src/data/faq.json into both places that show them: the full list on faq.html and the
// short list on index.html (only questions that have a "home" answer, with that shorter answer). One source, so the two
// pages never drift apart. Run `node scripts/sync-faq.mjs` after editing faq.json; `--check` only reports drift (used by npm run check).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const { items } = JSON.parse(readFileSync(join(root, "src/data/faq.json"), "utf8"));
const row = (q, a) => `      <details class="panel" open><summary>${q}</summary><div class="a"><div><p>${a}</p></div></div></details>`;
const lists = {
  "faq.html": items.map((x) => row(x.q, x.a)),
  "index.html": items.filter((x) => x.home).map((x) => row(x.q, x.home)),
};

let drift = 0;
for (const [page, rows] of Object.entries(lists)) {
  const path = join(root, page), html = readFileSync(path, "utf8");
  const re = /(<div class="fq-l">\n)[\s\S]*?(\n\s*<\/div>)/;
  if (!re.test(html)) throw new Error(`${page}: no <div class="fq-l"> list found`);
  const next = html.replace(re, (_, open, close) => open + rows.join("\n") + close);
  if (next === html) continue;
  drift++;
  if (check) console.error(`${page}: FAQ differs from src/data/faq.json (edit the JSON, then run node scripts/sync-faq.mjs)`);
  else { writeFileSync(path, next); console.log(`${page}: ${rows.length} questions written`); }
}
if (check && drift) process.exit(1);
if (!drift) console.log("FAQ: faq.html and index.html match src/data/faq.json");
