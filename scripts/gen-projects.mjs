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
/* "hidden": true in projects.json keeps a project's data but leaves it off the site */
const projects = JSON.parse(read("src/data/projects.json")).filter((p) => !p.hidden);
const manifest = JSON.parse(read("src/data/projects-manifest.json"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* head, CSS list and footer are taken from the existing pages, so these pages always match them */
const faq = read("faq.html"), home = read("index.html");
const cssBlock = faq.match(/<!-- css:start[\s\S]*?<!-- css:end -->/)[0];
const css = cssBlock.replace("<!-- css:end -->", '<link rel="stylesheet" href="src/css/42-projects.css">\n<!-- css:end -->\n<!-- js:start (run in this order; build concatenates them) -->\n<script src="src/js/15-cta-experiments.js" defer></script>\n<script src="src/js/43-project-lightbox.js" defer></script>\n<!-- js:end -->');
const footer = home.match(/<footer class="ft"[\s\S]*?<\/footer>/)[0];
/* the closing call to action ("اسحب ورقتك") sits above the footer on every page */
const cta = home.match(/<section class="xp xp9"[\s\S]*?<\/section>/)[0];
const heads = faq.split("<!-- css:start")[0].replace(/<title>.*<\/title>/, "<title>@@TITLE@@</title>");

const shown = (p) => {
  const skipFrom = p.skip_from ? new RegExp(p.skip_from) : null;
  let items = (manifest[p.folder] || []).filter((i) => (p.pick ? p.pick.includes(i.n) : true) && !(p.skip || []).includes(i.n) && !(skipFrom && skipFrom.test(i.from)));
  if (p.pick) items = p.pick.map((n) => items.find((i) => i.n === n)).filter(Boolean);
  /* files added later (named يي-…) always follow the curated first `max` */
  const later = items.filter((i) => i.from.startsWith("يي-"));
  return p.max ? [...items.filter((i) => !later.includes(i)).slice(0, p.max), ...later] : items;
};
const videos = (p) => !p.folder ? [] : readdirSync(join(root, "assets/projects", p.folder)).filter((f) => /^video-\d+\.mp4$/.test(f)).sort();
const num = (n) => String(n).padStart(2, "0");
const base = (p) => `assets/projects/${p.folder}/`;
const hasFile = (p, f) => existsSync(join(root, "assets/projects", p.folder, f));
const cover = (p) => {
  const first = shown(p)[0], v = videos(p)[0];
  if (first && !(p.cover_video && v)) return { src: `${base(p)}${num(first.n)}-640.webp`, w: first.w, h: first.h };
  if (!p.folder) return null;
  return v ? { src: `${base(p)}${v.replace(".mp4", "-poster.webp")}`, w: 540, h: 960 } : null;
};
/* Drive files: id and the embeddable /preview address (files, Docs) and thumbnail */
const driveId = (u) => (u.match(/\/(?:d|folders)\/([\w-]+)/) || [])[1];
const isFolder = (u) => /\/folders\//.test(u);
const driveEmbed = (u) => (isFolder(u) ? `https://drive.google.com/embeddedfolderview?id=${driveId(u)}#grid` : /docs\.google\.com\/document/.test(u) ? `https://docs.google.com/document/d/${driveId(u)}/preview` : `https://drive.google.com/file/d/${driveId(u)}/preview`);
/* Drive player loads only on click: a thumbnail and a play button until then, so the page stays light */
const facade = (u, title, w = 640, extra = "", attrs = "") => `<a class="pj-embed pj-facade${extra}"${attrs} href="${esc(u)}" data-embed="${driveEmbed(u)}" data-title="${esc(title)}" aria-label="تشغيل: ${esc(title)}"><img src="https://drive.google.com/thumbnail?id=${driveId(u)}&amp;sz=w${w}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()"><span class="pj-play" aria-hidden="true">▶</span></a>`;
const card = (p, i) => {
  const c = cover(p);
  if (!c) return `<a class="pj-card" href="project-${p.slug}.html"><span class="pj-img pj-ph"><b>♦︎</b><img src="https://drive.google.com/thumbnail?id=${driveId(p.drive || (p.embeds || [])[0] || p.media[0].items[0].url)}&amp;sz=w640" alt="${esc(p.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()"></span><span class="pj-meta"><b>${esc(p.name)}</b><i>${esc(p.category)}</i></span></a>`;
  return `<a class="pj-card" href="project-${p.slug}.html"><span class="pj-img"><img src="${c.src}" width="${c.w}" height="${c.h}" alt="${esc(p.name)}" loading="lazy" decoding="async"></span><span class="pj-meta"><b>${esc(p.name)}</b><i>${esc(p.category)}</i></span></a>`;
};

const page = (title, body, current = true) => `${heads.replace("@@TITLE@@", esc(title))}${css}
</head>
<body>
<header class="pg-top" lang="ar" dir="rtl"><a class="pg-brand" href="index.html">أربعمية</a><nav class="pg-nav" aria-label="التنقل"><a href="index.html">الرئيسية</a><a href="projects.html"${current ? ' aria-current="page"' : ""}>أعمالنا</a><a class="pg-cta" href="index.html#contact">تواصل معنا</a></nav></header>
${body}
${cta}
${footer}
</body>
</html>
`;

/* one page per project */
projects.forEach((p, i) => {
  const imgs = shown(p), vids = videos(p), next = projects[(i + 1) % projects.length];
  const notes = [p.why && ["لماذا هذا المشروع", p.why], p.value && ["ما يضيفه", p.value]].filter(Boolean);
  const vhtml = vids.map((v) => `<figure class="pj-vid"><video controls muted playsinline preload="none" poster="${base(p)}${v.replace(".mp4", "-poster.webp")}" src="${base(p)}${v}"></video></figure>`).join("\n");
  const big = (it) => hasFile(p, `${num(it.n)}-1280.webp`) ? `${base(p)}${num(it.n)}-1280.webp` : `${base(p)}${num(it.n)}-640.webp`;
  const thumbs = imgs.map((it, k) => `<a class="pj-fig" href="${big(it)}" data-w="${it.w}" data-h="${it.h}"><img src="${base(p)}${num(it.n)}-640.webp" width="${it.w}" height="${it.h}" alt="${esc(p.name)} ${k + 1}" loading="lazy" decoding="async"></a>`).join("");
  const main = (it, k, hide) => `<a class="pj-main"${hide ? " hidden" : ""} href="${big(it)}"><img src="${big(it)}" width="${it.w}" height="${it.h}" alt="${esc(p.name)} ${k + 1}" ${k === 0 && !hide && !vids.length && !p.drive && !(p.embeds || []).length ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></a>`;
  const book = p.layout === "book";
  /* images: one big picture (two pages side by side for a book), arrows, counter, and a strip of small ones */
  const imgSec = imgs.length ? `<section class="pj-sec" data-kind="img"><div class="pj-view" data-mode="${book ? "book" : "gallery"}" data-n="${imgs.length}">
    <div class="pj-stage" tabindex="0" aria-label="${book ? "صفحات الملف" : "التصاميم"}"><button class="pj-sn pj-sp" dir="ltr" type="button" data-d="-1" aria-label="السابق">›</button>${main(imgs[0], 0)}${book && imgs[1] ? main(imgs[1], 1, true) : ""}<button class="pj-sn pj-sx" dir="ltr" type="button" data-d="1" aria-label="التالي">‹</button></div>
    <p class="pj-cnt" dir="ltr">1 / ${imgs.length}</p>
    <div class="pj-strip">${thumbs}</div>
  </div></section>` : "";
  /* videos: Drive players load on click; portrait clips open in a one-at-a-time player, others in a big slot with a strip */
  const tall = !!p.embed_ratio;
  const go = (d, t) => `<button class="pj-sn pj-cn ${d < 0 ? "pj-sp" : "pj-sx"}" dir="ltr" type="button" data-d="${d}" aria-label="${t}">${d < 0 ? "›" : "‹"}</button>`;
  /* a big player in the middle (phone-shaped for portrait clips), arrows, counter and a strip of the others; items are { url, title } */
  const clipsHtml = (items, titled, tall) => `<div class="pj-clips${tall ? " pj-phone" : ""}" data-n="${items.length}"><div class="pj-stage">${items.length > 1 ? go(-1, "السابق") : ""}<div class="pj-clip">${facade(items[0].url, items[0].title, tall ? 640 : 960)}</div>${items.length > 1 ? go(1, "التالي") : ""}</div>${titled ? `<p class="pj-ct">${esc(items[0].title)}</p>` : ""}${items.length > 1 ? `<p class="pj-cnt" dir="ltr">1 / ${items.length}</p><div class="pj-strip pj-cstrip">${items.map((it, k) => facade(it.url, it.title, 360, " pj-th", k === 0 ? ' aria-current="true"' : "")).join("")}</div>` : ""}</div>`;
  /* names of what the project holds, shown as chips like the cards on the home page */
  const imgLabel = { "الهويات البصرية": "هوية بصرية", "الملفات التعريفية": "ملف تعريفي", "الإنفوجرافيك": "إنفوجرافيك", "المتاجر الإلكترونية": "تصميم متجر", "الحملات الإعلانية": "حملة إعلانية", "الاستراتيجية وتحليل الحسابات": "استراتيجية وتحليل", "كتابة المحتوى": "كتابة محتوى" }[p.group] || "تصميم";
  const vidLabel = p.vid_label || (tall ? "UGC" : { "التعليق الصوتي": "تعليق صوتي", "كتابة المحتوى": "كتابة محتوى" }[p.group] || "فيديو");
  const secs = [];
  if (p.media) p.media.forEach((g) => secs.push({ key: g.key, label: g.label, count: g.items.length, html: clipsHtml(g.items, true, g.tall) }));
  else {
    const clips = (p.embeds || []).map((u, k) => ({ url: u, title: `${p.name} ${k + 1}` }));
    const parts = [p.drive && facade(p.drive, p.name), clips.length && clipsHtml(clips, false, tall), vids.length && `<div class="pj-vids">\n${vhtml}\n</div>`].filter(Boolean).join("\n");
    if (parts) secs.push({ key: "video", label: vidLabel, count: clips.length || vids.length, html: parts });
  }
  const vidSec = secs.map((x) => `<section class="pj-sec" data-kind="${x.key}">${x.html}</section>`).join("\n  ");
  const kinds = [...secs.map((x) => [x.key, x.label, x.count]), ...(imgSec ? [["img", imgLabel, imgs.length]] : [])];
  const chips = kinds.length > 1 ? `<div class="pj-chips" role="group" aria-label="محتوى المشروع" hidden>${[["all", "الكل", 0], ...kinds].map(([k, t, c], j) => `<button type="button" data-k="${k}" aria-pressed="${j === 0}">${t}${c > 1 ? ` <small>${c}</small>` : ""}</button>`).join("")}</div>` : "";
  const tags = p.tags || kinds.length === 1 ? `<ul class="pj-tags">${(p.tags || kinds.map(([, t]) => t)).map((t) => `<li>${t}</li>`).join("")}</ul>` : "";
  const stats = [...secs.filter((x) => x.count > 1).map((x) => [x.count, p.media ? x.label : tall && !p.vid_label ? "مقطع UGC" : "مقطع"]), imgs.length > 1 && [imgs.length, book ? "صفحة" : "تصميم"]].filter(Boolean);
  writeFileSync(join(root, `project-${p.slug}.html`), page(`${p.name} | أربعمية`, `<main class="pj pj-page" lang="ar" dir="rtl" aria-label="${esc(p.name)}">
  <div class="pj-hero">
    <div class="pj-ht">
      <span class="eb pj-e">♦︎ ${esc(p.category)}</span>
      <h1>${esc(p.name)}</h1>
      ${p.name_en ? `<p class="pj-en" dir="ltr">${esc(p.name_en)}</p>` : ""}
      ${tags}
    </div>
    <div class="pj-hb">
      ${p.about ? `<p class="pj-about">${esc(p.about)}</p>` : ""}
      ${stats.length ? `<ul class="pj-stats">${stats.map(([n, t]) => `<li><b>${n}</b><span>${t}</span></li>`).join("")}</ul>` : ""}
    </div>
    ${notes.length ? `<dl class="pj-notes">${notes.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
  </div>
  ${chips}
  ${vidSec}
  ${imgSec}
  <a class="pj-next" href="project-${next.slug}.html"><small>المشروع التالي</small><b>${esc(next.name)} ←</b></a>
</main>`));
});

/* all projects: one grid, filtered by what a project contains (a mixed project shows under each kind it has) */
const kindOf = { "الهويات البصرية": ["design"], "الملفات التعريفية": ["design"], "السوشل ميديا والتصاميم": ["design"], "الإنفوجرافيك": ["design"], "المتاجر الإلكترونية": ["design"], "الحملات الإعلانية": ["strategy"], "الاستراتيجية وتحليل الحسابات": ["strategy"], "مقاطع الكولاج": ["video"], "التعليق الصوتي": ["voice"], "محتوى UGC": ["video"], "كتابة المحتوى": ["write"] };
const kinds = [["design", "تصميم وهوية"], ["video", "فيديو"], ["voice", "تعليق صوتي"], ["write", "كتابة"], ["strategy", "استراتيجية وحملات"]];
const kindsOf = (p) => [...new Set([...(p.kinds || kindOf[p.group] || []), ...((p.embeds || []).length && !p.embed_ratio ? ["video"] : [])])];
const cardOf = (p) => card(p).replace('class="pj-card"', `class="pj-card" data-kinds="${kindsOf(p).join(" ")}"`);
/* slideshow of the best projects (the ones starred with "top") */
const slide = (p, k) => {
  const first = shown(p)[0];
  const src = first ? (hasFile(p, `${num(first.n)}-1280.webp`) ? `${base(p)}${num(first.n)}-1280.webp` : `${base(p)}${num(first.n)}-640.webp`) : "";
  return `<a class="pj-slide${k === 0 ? " on" : ""}" href="project-${p.slug}.html"><span class="pj-sl-txt"><i>${esc(p.category)}</i><b>${esc(p.name)}</b>${p.about ? `<span>${esc(p.about)}</span>` : ""}<u>شاهد المشروع ←</u></span><span class="pj-sl-img">${src ? `<img src="${src}" width="${first.w}" height="${first.h}" alt="${esc(p.name)}" ${k === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : ""}</span></a>`;
};
const stars = projects.filter((p) => p.top && p.folder);
const slides = stars.length ? `<section class="pj-show" aria-roledescription="carousel" aria-label="أبرز أعمالنا"><div class="pj-slides">${stars.map(slide).join("")}</div><div class="pj-ctl" hidden><button class="pj-sl-n" type="button" dir="ltr" data-d="-1" aria-label="السابق">›</button><span class="pj-dots">${stars.map((p, k) => `<button type="button" aria-label="${esc(p.name)}"${k === 0 ? ' aria-current="true"' : ""}></button>`).join("")}</span><button class="pj-sl-n" type="button" dir="ltr" data-d="1" aria-label="التالي">‹</button></div></section>` : "";
writeFileSync(join(root, "projects.html"), page("مشاريعنا | أربعمية", `<main class="pj pj-page" lang="ar" dir="rtl" aria-label="مشاريعنا">
  <div class="pj-hero pj-hero-1"><div class="pj-ht"><span class="eb pj-e">♦︎ مشاريعنا</span><h1>أعمـال اختـرناها لنعـرضها</h1></div></div>
${slides}
  <div class="pj-chips" role="group" aria-label="نوع العمل" hidden>${[["all", "الكل"], ...kinds].map(([k, t], j) => `<button type="button" data-k="${k}" aria-pressed="${j === 0}">${t}</button>`).join("")}</div>
  <a class="pj-order" id="pjOrder" href="contact.html" hidden>اطلب خدمتك <i>←</i></a>
  <div class="pj-cards pj-all-cards">
${projects.map(cardOf).join("\n")}
  </div>
</main>`));

console.log(`projects: ${projects.length} pages + projects.html`);

/* the pages above carry an old-style header; the shared navigation bar replaces it (and the other pages are kept in step) */
await import("./sync-nav.mjs");
