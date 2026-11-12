// Build: source files → dist/ (what you deploy).
//  - fingerprints every font and image (name.<hash>.ext) so they can be cached forever
//  - concatenates the css/js files listed between the css:start/css:end and js:start/js:end markers in each page, in order
//  - minifies CSS and JS with esbuild (same cascade, same behaviour, fewer bytes)
//  - writes .br and .gz copies of every text file for hosts/servers that serve precompressed files
//  - writes _headers (Netlify / Cloudflare Pages caching rules)
// Usage: npm run build
import { execFileSync } from "node:child_process";
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

execFileSync("node", [join(root, "scripts/gen-projects.mjs")], { stdio: "inherit" });
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
/* project images and videos: assets/projects/<folder>/<file> keeps its folder, gets the same fingerprint */
const projectFiles = (d = "projects") => readdirSync(join(root, "assets", d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? projectFiles(join(d, e.name)) : [join(d, e.name)]));
/* only what a page, stylesheet or script names is shipped: hidden projects and unpicked images stay out of dist/ */
const sources = readdirSync(root).filter((f) => f.endsWith(".html")).map(read).join("\n");
for (const rel of projectFiles()) {
  if (rel.split("/").pop().startsWith(".") || !sources.includes(rel)) continue;
  const buf = readFileSync(join(root, "assets", rel)), ext = extname(rel), out = `${rel.slice(0, -ext.length)}.${hash(buf)}${ext}`;
  mkdirSync(dirname(join(dist, "assets", out)), { recursive: true });
  writeFileSync(join(dist, "assets", out), buf);
  map[rel] = out;
}
/* replace every "<prefix><asset>" with its fingerprinted name; prefix is "../" inside CSS, "assets/" inside HTML */
const relink = (text, prefix) => Object.entries(map).reduce((t, [from, to]) => t.split(prefix + from).join(prefix + to), text);

const block = (html, name) => {
  const m = html.match(new RegExp(`<!-- ${name}:start[^>]*-->([\\s\\S]*?)<!-- ${name}:end -->`));
  return m ? { whole: m[0], files: [...m[1].matchAll(/(?:href|src)="([^"]+)"/g)].map((x) => x[1]) } : null;
};

const site = JSON.parse(readFileSync(join(root, "src/data/site.json"), "utf8"));
const siteUrl = (process.env.SITE_URL || site.url || "").replace(/\/$/, "");
/* Cloudflare Pages (and Netlify) serve /services.html as /services (308), so canonical, social and sitemap URLs use the extensionless form. */
const cleanPath = (p) => (p === "index.html" ? "/" : "/" + p.replace(/\.html$/, ""));

const sizes = [];
const shareImg = siteUrl && `${siteUrl}/assets/${map["img/og-share.png"]}`;
const hex = (n) => ({ wine: "#6C171E", cream: "#f4dabf" })[n];
/* meta description: written ones live in site.json; project pages fall back to the project's own "about" text (src/data/projects.json) */
const projects = JSON.parse(readFileSync(join(root, "src/data/projects.json"), "utf8"));
const cut = (t, n = 155) => (t.length <= n ? t : t.slice(0, n).replace(/\s+\S*$/, "") + "…");
const describe = (page) => {
  if (site.descriptions[page]) return site.descriptions[page];
  const p = (Array.isArray(projects) ? projects : projects.projects).find((x) => `project-${x.slug}.html` === page);
  if (!p) return "";
  const about = p.about && p.about.length >= 30 ? p.about : `${p.category}، من أعمال أربعمية.`;
  return cut(about.includes(p.name) ? about : `${p.name}: ${about}`);  /* the name keeps near-identical project texts distinct */
};
const pages = ["index.html", "pricing.html", "faq.html", "contact.html", "budget.html", "about.html", "privacy.html", "terms.html", "links.html", "services.html", "projects.html", ...readdirSync(root).filter((f) => f.startsWith("project-") && f.endsWith(".html"))];
/* internal links point at the clean URL (/services, not /services.html): the host would 308 the .html form, one wasted round trip per click. Sources keep .html so the files still open from disk. */
const pageNames = pages.map((p) => p.replace(/\.html$/, "")).join("|");
const cleanHref = (n) => (n === "index" ? "/" : n);
const cleanLinks = (s) => s
  .replace(new RegExp(`(href|action)="(?:\\./)?(${pageNames})\\.html(?=[?#"])`, "g"), (_, a, n) => `${a}="${cleanHref(n)}`)
  .replace(new RegExp(`(["'/])(${pageNames})\\.html(?=[?#"'])`, "g"), (_, q, n) => (q === "/" ? `/${n}` : `${q}${cleanHref(n)}`));
for (const page of pages) {
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
    const jsText = cleanLinks(relink(parts.join("\n"), "assets/"));  /* logo paths written inside the JS */
    const jsName = `${name}.${hash(jsText)}.js`;
    writeFileSync(join(dist, "assets/js", jsName), jsText);
    html = html.replace(js.whole, `<script src="assets/js/${jsName}" defer></script>`);
    sizes.push(`${page}: css ${(cssText.length / 1024).toFixed(0)} KB (was ${(cssSrc.length / 1024).toFixed(0)}), js ${(jsText.length / 1024).toFixed(0)} KB`);
  } else sizes.push(`${page}: css ${(cssText.length / 1024).toFixed(0)} KB (was ${(cssSrc.length / 1024).toFixed(0)})`);

  /* head tags. Description, theme colour and noindex need no domain; canonical, social tags and structured data wait for the real domain (src/data/site.json "url", or SITE_URL). */
  const title = (html.match(/<title>(.*?)<\/title>/) || [])[1] || "";
  const desc = describe(page);
  const attr = (v) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const noindex = (site.noindex || []).includes(page);
  let tags = `\n<meta name="theme-color" content="${hex("wine")}">`;
  if (desc) tags += `\n<meta name="description" content="${attr(desc)}">`;
  if (noindex) tags += `\n<meta name="robots" content="noindex">`;
  if (siteUrl && !noindex) {
    const url = siteUrl + cleanPath(page);
    tags += `\n<link rel="canonical" href="${url}">\n<meta property="og:type" content="website">\n<meta property="og:locale" content="ar_SA">\n<meta property="og:site_name" content="أربعمية">\n<meta property="og:title" content="${title}">\n<meta property="og:url" content="${url}">\n<meta property="og:image" content="${shareImg}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="أربعمية: مكتب إبداعي للمحتوى والتصميم والإعلانات والنمو">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${shareImg}">`;
    if (desc) tags += `\n<meta property="og:description" content="${attr(desc)}">`;
    const ctx = "https://schema.org";
    const crumbs = (items) => ({ "@type": "BreadcrumbList", itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: siteUrl + path })) });
    const faq = page === "faq.html" ? [...html.matchAll(/<details[^>]*><summary>(.*?)<\/summary><div class="a"><div>(.*?)<\/div><\/div><\/details>/g)].map(([, q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })) : [];
    const project = page.startsWith("project-") ? (Array.isArray(projects) ? projects : projects.projects).find((x) => `project-${x.slug}.html` === page) : null;
    const ld = page === "index.html"
      ? { "@context": ctx, "@type": ["Organization", "ProfessionalService"], name: "أربعمية", alternateName: "Arbaamiah", url: siteUrl + "/", logo: `${siteUrl}/assets/${map["img/logo-symbol.svg"]}`, email: "arbaamia.sa@gmail.com", areaServed: { "@type": "Country", name: "المملكة العربية السعودية" }, availableLanguage: "ar", serviceType: ["كتابة المحتوى", "الاستراتيجيات التسويقية", "التصميم الإبداعي", "الهوية البصرية", "التصوير", "التعليق الصوتي", "الإعلانات", "تطوير المواقع"], sameAs: site.sameAs, ...(desc && { description: desc }) }
      : page.startsWith("project-") ? { "@context": ctx, "@graph": [
          crumbs([["الرئيسية", "/"], ["مشاريعنا", "/projects"], [title.replace(/ \| أربعمية$/, ""), cleanPath(page)]]),
          ...(project ? [{ "@type": "CreativeWork", name: project.name, genre: project.category, url: siteUrl + cleanPath(page), inLanguage: "ar", creator: { "@type": "Organization", name: "أربعمية", url: siteUrl + "/" }, ...(desc && { description: desc }) }] : [])] }
      : faq.length ? { "@context": ctx, "@graph": [crumbs([["الرئيسية", "/"], ["الأسئلة الشائعة", "/faq"]]), { "@type": "FAQPage", inLanguage: "ar", mainEntity: faq }] }
      : null;
    if (ld) tags += `\n<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
  }
  html = html.replace("</title>", "</title>" + tags);
  /* the charset declaration must sit within the first 1024 bytes; Arabic title + description would push it past that */
  if (/<meta charset="utf-8">/i.test(html)) html = html.replace(/<meta charset="utf-8">\n?/i, "").replace(/<head>\n?/, "<head>\n<meta charset=\"utf-8\">\n");
  writeFileSync(join(dist, page), cleanLinks(relink(html, "assets/")));
}

/* sitemap lastmod: date of the last commit touching the page, or today for pages not committed yet */
const lastmod = (p) => { try { return execFileSync("git", ["log", "-1", "--format=%cs", "--", p], { cwd: root }).toString().trim() || new Date().toISOString().slice(0, 10); } catch { return new Date().toISOString().slice(0, 10); } };

/* 1b. custom 404 (Netlify and Cloudflare Pages serve /404.html for missing paths), robots.txt, sitemap.xml */
writeFileSync(join(dist, "404.html"), `<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>الصفحة غير موجودة | أربعمية</title><style>@font-face{font-family:T;src:url(/assets/${map["fonts/thmanyahserifdisplay-Bold.woff2"]}) format("woff2");font-display:swap}body{margin:0;min-height:100vh;display:grid;place-content:center;gap:1rem;text-align:center;background:${hex("wine")};color:${hex("cream")};font:700 clamp(1.5rem,5vw,2.5rem) T,serif}a{color:inherit;font-size:1.1rem}</style></head><body><h1>الصفحة غير موجودة</h1><a href="/">العودة للرئيسية</a></body></html>`);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n` + (siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ""));
if (siteUrl) writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter((p) => !(site.noindex || []).includes(p)).map((p) => `<url><loc>${siteUrl}${cleanPath(p)}</loc><lastmod>${lastmod(p)}</lastmod></url>`).join("\n")}\n</urlset>\n`);

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
  X-Frame-Options: SAMEORIGIN
  Cross-Origin-Opener-Policy: same-origin
  Strict-Transport-Security: max-age=31536000
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
