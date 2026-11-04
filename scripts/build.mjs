// Build: source files → dist/ (what you deploy).
//  - fingerprints every font and image (name.<hash>.ext) so they can be cached forever
//  - concatenates the css/js files listed between the css:start/css:end and js:start/js:end markers in each page, in order
//  - minifies CSS and JS with esbuild (same cascade, same behaviour, fewer bytes)
//  - writes .br and .gz copies of every text file for hosts/servers that serve precompressed files
//  - writes _headers (Netlify / Cloudflare Pages caching rules)
// Usage: npm run build
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import { transform } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const read = (p) => readFileSync(join(root, p), "utf8");
const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 8);
/* the browsers the design was checked in; esbuild only uses syntax all of them understand */
const target = ["chrome100", "edge100", "firefox100", "safari15"];

rmSync(dist, { recursive: true, force: true });
for (const d of ["css", "js", "fonts", "img"]) mkdirSync(join(dist, "assets", d), { recursive: true });

/* 1. assets: "img/velvet.jpg" → "img/velvet.1a2b3c4d.jpg" */
const map = {};
for (const dir of ["fonts", "img"]) {
  for (const f of readdirSync(join(root, "assets", dir))) {
    if (f.startsWith(".")) continue;
    const buf = readFileSync(join(root, "assets", dir, f)), ext = extname(f);
    const out = `${dir}/${f.slice(0, -ext.length)}.${hash(buf)}${ext}`;
    writeFileSync(join(dist, "assets", out), buf);
    map[`${dir}/${f}`] = out;
  }
}
/* replace every "<prefix><asset>" with its fingerprinted name; prefix is "../" inside CSS, "assets/" inside HTML */
const relink = (text, prefix) => Object.entries(map).reduce((t, [from, to]) => t.split(prefix + from).join(prefix + to), text);

const block = (html, name) => {
  const m = html.match(new RegExp(`<!-- ${name}:start[^>]*-->([\\s\\S]*?)<!-- ${name}:end -->`));
  return m ? { whole: m[0], files: [...m[1].matchAll(/(?:href|src)="([^"]+)"/g)].map((x) => x[1]) } : null;
};

const sizes = [];
for (const page of ["index.html", "pricing.html", "faq.html"]) {
  const name = page.startsWith("pricing") ? "pricing" : "site";
  let html = read(page);
  const css = block(html, "css"), js = block(html, "js");

  const cssSrc = css.files.map((f) => read(f)).join("\n").replaceAll("../../assets/", "../");
  const cssText = relink((await transform(cssSrc, { loader: "css", minify: true, target })).code, "../");
  const cssName = `${name}.${hash(cssText)}.css`;
  writeFileSync(join(dist, "assets/css", cssName), cssText);
  html = html.replace(css.whole, `<link rel="stylesheet" href="assets/css/${cssName}">`);

  if (js) {
    /* each file is minified on its own and keeps its own try/catch, so one failure cannot stop the rest, as with separate <script> tags */
    const parts = [];
    for (const f of js.files) {
      const { code } = await transform(read(f), { loader: "js", minify: true, target });
      parts.push(`try{${code}}catch(e){console.error(${JSON.stringify(f)},e)}`);
    }
    const jsText = parts.join("\n");
    const jsName = `${name}.${hash(jsText)}.js`;
    writeFileSync(join(dist, "assets/js", jsName), jsText);
    html = html.replace(js.whole, `<script src="assets/js/${jsName}" defer></script>`);
    sizes.push(`${page}: css ${(cssText.length / 1024).toFixed(0)} KB (was ${(cssSrc.length / 1024).toFixed(0)}), js ${(jsText.length / 1024).toFixed(0)} KB`);
  } else sizes.push(`${page}: css ${(cssText.length / 1024).toFixed(0)} KB (was ${(cssSrc.length / 1024).toFixed(0)})`);

  writeFileSync(join(dist, page), relink(html, "assets/"));
}

/* 2. caching rules for static hosts that read _headers (Netlify, Cloudflare Pages). Fingerprinted files never change; pages always revalidate. */
writeFileSync(join(dist, "_headers"), `/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*.html
  Cache-Control: no-cache
/
  Cache-Control: no-cache
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`);

/* 3. precompressed copies of text files */
let raw = 0, br = 0;
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
for (const f of walk(dist)) {
  if (!/\.(html|css|js|svg)$/.test(f)) continue;
  const buf = readFileSync(f);
  const b = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
  writeFileSync(f + ".br", b);
  writeFileSync(f + ".gz", gzipSync(buf, { level: 9 }));
  raw += buf.length; br += b.length;
}
console.log("built dist/\n  " + sizes.join("\n  ") + `\n  text files: ${(raw / 1024).toFixed(0)} KB raw, ${(br / 1024).toFixed(0)} KB brotli`);
