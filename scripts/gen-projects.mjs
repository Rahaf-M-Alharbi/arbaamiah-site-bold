// Writes the project pages from src/data/projects.json (text, picks) and src/data/projects-manifest.json (image sizes):
//   projects.html            all projects
//   project-<slug>.html      one page per project
// Images come from assets/projects/<folder>/NN-640.webp and NN-1280.webp (made by scripts/optimize-projects.py).
// Usage: node scripts/gen-projects.mjs   (npm run build runs it first)
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const projects = JSON.parse(read("src/data/projects.json"));
const manifest = JSON.parse(read("src/data/projects-manifest.json"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* head, CSS list and footer are taken from the existing pages, so these pages always match them */
const faq = read("faq.html"), home = read("index.html");
const cssBlock = faq.match(/<!-- css:start[\s\S]*?<!-- css:end -->/)[0];
const css = cssBlock.replace("<!-- css:end -->", '<link rel="stylesheet" href="src/css/42-projects.css">\n<!-- css:end -->');
const footer = home.match(/<footer class="ft"[\s\S]*?<\/footer>/)[0];
const heads = faq.split("<!-- css:start")[0].replace(/<title>.*<\/title>/, "<title>@@TITLE@@</title>");

const shown = (p) => {
  const skipFrom = p.skip_from ? new RegExp(p.skip_from) : null;
  let items = (manifest[p.folder] || []).filter((i) => (p.pick ? p.pick.includes(i.n) : true) && !(p.skip || []).includes(i.n) && !(skipFrom && skipFrom.test(i.from)));
  if (p.pick) items = p.pick.map((n) => items.find((i) => i.n === n)).filter(Boolean);
  return p.max ? items.slice(0, p.max) : items;
};
const videos = (p) => readdirSync(join(root, "assets/projects", p.folder)).filter((f) => /^video-\d+\.mp4$/.test(f)).sort();
const num = (n) => String(n).padStart(2, "0");
const base = (p) => `assets/projects/${p.folder}/`;
const hasFile = (p, f) => existsSync(join(root, "assets/projects", p.folder, f));
const cover = (p) => {
  const first = shown(p)[0], v = videos(p)[0];
  if (first && !(p.cover_video && v)) return { src: `${base(p)}${num(first.n)}-640.webp`, w: first.w, h: first.h };
  return v ? { src: `${base(p)}${v.replace(".mp4", "-poster.webp")}`, w: 540, h: 960 } : null;
};
const card = (p, i) => {
  const c = cover(p);
  return `<a class="pj-card" href="project-${p.slug}.html"><span class="pj-img"><img src="${c.src}" width="${c.w}" height="${c.h}" alt="${esc(p.name)}" loading="lazy" decoding="async"></span><span class="pj-meta"><b>${esc(p.name)}</b><i>${esc(p.category)}</i></span></a>`;
};

const page = (title, body, current = true) => `${heads.replace("@@TITLE@@", esc(title))}${css}
</head>
<body>
<header class="pg-top" lang="ar" dir="rtl"><a class="pg-brand" href="index.html">أربعمية</a><nav class="pg-nav" aria-label="التنقل"><a href="index.html">الرئيسية</a><a href="projects.html"${current ? ' aria-current="page"' : ""}>أعمالنا</a><a class="pg-cta" href="index.html#contact">تواصل معنا</a></nav></header>
${body}
${footer}
</body>
</html>
`;

/* one page per project */
projects.forEach((p, i) => {
  const imgs = shown(p), vids = videos(p), next = projects[(i + 1) % projects.length];
  const notes = [p.why && ["لماذا هذا المشروع", p.why], p.value && ["ما يضيفه", p.value]].filter(Boolean);
  const vhtml = vids.map((v) => `<figure class="pj-vid"><video controls muted playsinline preload="none" poster="${base(p)}${v.replace(".mp4", "-poster.webp")}" src="${base(p)}${v}"></video></figure>`).join("\n");
  const ihtml = imgs.map((it, k) => {
    const big = hasFile(p, `${num(it.n)}-1280.webp`) ? `${base(p)}${num(it.n)}-1280.webp` : `${base(p)}${num(it.n)}-640.webp`;
    const attrs = k === 0 && !vids.length ? 'fetchpriority="high"' : 'loading="lazy"';
    return `<a class="pj-fig" href="${big}" target="_blank" rel="noopener"><img src="${base(p)}${num(it.n)}-640.webp" srcset="${base(p)}${num(it.n)}-640.webp 640w, ${big} 1280w" sizes="(max-width:900px) 50vw, 33vw" width="${it.w}" height="${it.h}" alt="${esc(p.name)} ${k + 1}" ${attrs} decoding="async"></a>`;
  }).join("\n");
  writeFileSync(join(root, `project-${p.slug}.html`), page(`${p.name} | أربعمية`, `<main class="pj pj-page" lang="ar" dir="rtl" aria-label="${esc(p.name)}">
  <div class="pj-hero">
    <span class="eb pj-e">♦︎ ${esc(p.category)}</span>
    <h1>${esc(p.name)}</h1>
    ${p.name_en ? `<p class="pj-en" dir="ltr">${esc(p.name_en)}</p>` : ""}
    ${p.about ? `<p class="pj-about">${esc(p.about)}</p>` : ""}
    ${notes.length ? `<dl class="pj-notes">${notes.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
  </div>
  ${vids.length ? `<div class="pj-vids">\n${vhtml}\n</div>` : ""}
  ${imgs.length ? `<div class="pj-grid">\n${ihtml}\n</div>` : ""}
  <a class="pj-next" href="project-${next.slug}.html"><small>المشروع التالي</small><b>${esc(next.name)} ←</b></a>
</main>`));
});

/* all projects */
writeFileSync(join(root, "projects.html"), page("مشاريعنا | أربعمية", `<main class="pj pj-page" lang="ar" dir="rtl" aria-label="مشاريعنا">
  <div class="pj-hero"><span class="eb pj-e">♦︎ مشاريعنا</span><h1>أعمال اخترناها لنعرضها</h1></div>
  <div class="pj-cards">
${projects.map(card).join("\n")}
  </div>
</main>`));

console.log(`projects: ${projects.length} pages + projects.html`);
