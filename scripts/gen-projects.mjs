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

/* head and CSS list are taken from the existing pages; the footer comes from src/partials/footer.html */
const faq = read("faq.html");
const cssBlock = faq.match(/<!-- css:start[\s\S]*?<!-- css:end -->/)[0];
const css = cssBlock.replace("<!-- css:end -->", '<link rel="stylesheet" href="src/css/42-projects.css">\n<!-- css:end -->\n<!-- js:start (run in this order; build concatenates them) -->\n<script src="src/js/15-pull-card.js" defer></script>\n<script src="src/js/43-project-lightbox.js" defer></script>\n<!-- js:end -->');
const footer = read("src/partials/footer.html").trim();
/* the closing call to action ("اسحب ورقتك") sits above the footer on every page */
const cta = read("src/partials/cta-pull.html").trim();
const heads = faq.split("<!-- css:start")[0].replace(/<title>.*<\/title>/, "<title>@@TITLE@@</title>");

const shown = (p) => {
  const skipFrom = p.skip_from ? new RegExp(p.skip_from) : null;
  let items = (manifest[p.folder] || []).filter((i) => (p.pick ? p.pick.includes(i.n) : true) && !(p.skip || []).includes(i.n) && !(skipFrom && skipFrom.test(i.from)));
  if (p.pick) items = p.pick.map((n) => items.find((i) => i.n === n)).filter(Boolean);
  /* files added later (named يي-…) always follow the curated first `max` */
  const later = items.filter((i) => i.from.startsWith("يي-"));
  return p.max ? [...items.filter((i) => !later.includes(i)).slice(0, p.max), ...later] : items;
};
/* width/height of a .webp (VP8, VP8L or VP8X), read from its header */
const webpSize = (file) => {
  const b = readFileSync(file), k = b.toString("ascii", 12, 16);
  if (k === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (k === "VP8L") { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
};
const videos = (p) => !p.folder ? [] : readdirSync(join(root, "assets/projects", p.folder)).filter((f) => /^video-\d+\.mp4$/.test(f)).sort();
const num = (n) => String(n).padStart(2, "0");
const base = (p) => `assets/projects/${p.folder}/`;
const hasFile = (p, f) => existsSync(join(root, "assets/projects", p.folder, f));
/* "cover_img" in projects.json: a hand-made 640x800 card image (assets/projects/covers/) used instead of the first slide or the Drive thumbnail */
const cover = (p) => {
  if (p.cover_img) return { src: p.cover_img, w: 640, h: 800 };
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
  const thumbs = imgs.map((it, k) => `<a class="pj-fig" data-k="img" href="${big(it)}" data-w="${it.w}" data-h="${it.h}"><img src="${base(p)}${num(it.n)}-640.webp" width="${it.w}" height="${it.h}" alt="${esc(p.name)} ${k + 1}" loading="lazy" decoding="async"></a>`).join("");
  const main = (it, k, hide) => `<a class="pj-main"${hide ? " hidden" : ""} href="${big(it)}"><img src="${big(it)}" width="${it.w}" height="${it.h}" alt="${esc(p.name)} ${k + 1}" ${k === 0 && !hide && !vids.length && !p.drive && !(p.embeds || []).length ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></a>`;
  const book = p.layout === "book";
  /* a project with both pictures and clips shows them in one gallery: the clips come first, then the pictures */
  const mixed = imgs.length > 0 && (vids.length > 0 || (p.embeds || []).length > 0) && !p.drive && !p.media;
  const vitem = (v, k) => {
    const poster = `${base(p)}${v.replace(".mp4", "-poster.webp")}`, { w, h } = webpSize(join(root, poster));
    return { poster, src: `${base(p)}${v}`, w, h, k };
  };
  const vthumbs = mixed ? vids.map(vitem).map((v) => `<a class="pj-fig pj-vf" data-k="video" href="${v.src}" data-video="${v.src}" data-poster="${v.poster}" data-w="${v.w}" data-h="${v.h}"><img src="${v.poster}" width="${v.w}" height="${v.h}" alt="${esc(p.name)} فيديو ${v.k + 1}" loading="lazy" decoding="async"><i class="pj-vplay" aria-hidden="true">▶</i></a>`).join("") : "";
  /* Drive clips join the same gallery: the thumbnail shows in the strip, the player loads when it is picked */
  const ratio = p.embed_ratio ? [9, 16] : [16, 9];
  const ethumbs = mixed ? (p.embeds || []).map((u, k) => `<a class="pj-fig pj-vf" data-k="video" href="${esc(u)}" data-embed="${driveEmbed(u)}" data-title="${esc(p.name)} ${k + 1}" data-poster="https://drive.google.com/thumbnail?id=${driveId(u)}&amp;sz=w640" data-w="${ratio[0] * 40}" data-h="${ratio[1] * 40}"><img src="https://drive.google.com/thumbnail?id=${driveId(u)}&amp;sz=w360" width="${ratio[0] * 40}" height="${ratio[1] * 40}" alt="${esc(p.name)} فيديو ${vids.length + k + 1}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()"><i class="pj-vplay" aria-hidden="true">▶</i></a>`).join("") : "";
  /* a project with several kinds of Drive media (texts, clips) gets one gallery too, filtered by kind */
  const gmix = !!p.media && p.media.length > 1 && !p.drive && !(p.embeds || []).length && !vids.length;
  const gratio = (g) => (g.tall ? [9, 16] : g.key === "write" ? [3, 4] : [16, 9]);
  const gthumbs = gmix ? p.media.map((g) => g.items.map((it, k) => { const [rw, rh] = gratio(g); return `<a class="pj-fig pj-vf" data-k="${g.key}" href="${esc(it.url)}" data-embed="${driveEmbed(it.url)}" data-title="${esc(it.title)}" data-poster="https://drive.google.com/thumbnail?id=${driveId(it.url)}&amp;sz=w640" data-w="${rw * 40}" data-h="${rh * 40}"><img src="https://drive.google.com/thumbnail?id=${driveId(it.url)}&amp;sz=w360" width="${rw * 40}" height="${rh * 40}" alt="${esc(it.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()"><span class="pj-tt">${esc(it.title)}</span><i class="pj-vplay" aria-hidden="true">${g.key === "write" ? "✎" : "▶"}</i></a>`; }).join("")).join("") : "";
  const total = gmix ? p.media.reduce((n, g) => n + g.items.length, 0) : imgs.length + (mixed ? vids.length + (p.embeds || []).length : 0);
  /* images: one big picture (two pages side by side for a book), arrows, counter, and a strip of small ones */
  const imgSec = imgs.length || gmix ? `<section class="pj-sec" data-kind="img"><div class="pj-view" data-mode="${book ? "book" : "gallery"}" data-n="${total}">
    <div class="pj-stage" tabindex="0" aria-label="${book ? "صفحات الملف" : "التصاميم"}"><button class="pj-sn pj-sp" dir="ltr" type="button" data-d="-1" aria-label="السابق">›</button>${imgs[0] ? main(imgs[0], 0) : `<a class="pj-main" hidden href="#"><img alt="" width="1" height="1"></a>`}${book && imgs[1] ? main(imgs[1], 1, true) : ""}<button class="pj-sn pj-sx" dir="ltr" type="button" data-d="1" aria-label="التالي">‹</button></div>
    <p class="pj-cnt" dir="ltr">1 / ${total}</p>
    <div class="pj-strip">${gthumbs}${vthumbs}${ethumbs}${thumbs}</div>
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
  if (p.media && !gmix) p.media.forEach((g) => secs.push({ key: g.key, label: g.label, count: g.items.length, html: clipsHtml(g.items, true, g.tall) }));
  else {
    const clips = (p.embeds || []).map((u, k) => ({ url: u, title: `${p.name} ${k + 1}` }));
    const parts = [p.drive && facade(p.drive, p.name), !mixed && clips.length && clipsHtml(clips, false, tall), !mixed && vids.length && `<div class="pj-vids">\n${vhtml}\n</div>`].filter(Boolean).join("\n");
    if (parts) secs.push({ key: "video", label: vidLabel, count: clips.length || vids.length, html: parts });
  }
  const vidSec = secs.map((x) => `<section class="pj-sec" data-kind="${x.key}">${x.html}</section>`).join("\n  ");
  const kinds = [...secs.map((x) => [x.key, x.label, x.count]), ...(imgSec ? [["img", imgLabel, imgs.length]] : [])];
  const chips = kinds.length > 1 ? `<div class="pj-chips" role="group" aria-label="محتوى المشروع" hidden>${[["all", "الكل", 0], ...kinds].map(([k, t, c], j) => `<button type="button" data-k="${k}" aria-pressed="${j === 0}">${t}${c > 1 ? ` <small>${c}</small>` : ""}</button>`).join("")}</div>` : "";
  const tags = p.tags || kinds.length === 1 ? `<ul class="pj-tags">${(p.tags || [...(mixed ? [vidLabel] : []), ...kinds.map(([, t]) => t)]).map((t, j) => mixed && !p.tags ? `<li><button type="button" data-f="${j === 0 ? "video" : "img"}" aria-pressed="false">${t}</button></li>` : `<li>${t}</li>`).join("")}</ul>` : "";
  const tagsG = gmix ? `<ul class="pj-tags">${p.media.map((g) => `<li><button type="button" data-f="${g.key}" aria-pressed="false">${g.label}</button></li>`).join("")}</ul>` : "";
  const stats = [...secs.filter((x) => x.count > 1).map((x) => [x.count, p.media ? x.label : tall && !p.vid_label ? "مقطع UGC" : "مقطع"]), imgs.length > 1 && [imgs.length, book ? "صفحة" : "تصميم"]].filter(Boolean);
  writeFileSync(join(root, `project-${p.slug}.html`), page(`${p.name}: ${p.category} | أربعمية`, `<main class="pj pj-page" lang="ar" dir="rtl" aria-label="${esc(p.name)}">
  <a class="pj-back" href="projects.html">→ كل الأعمال</a>
  <div class="pj-hero">
    <div class="pj-ht">
      <span class="eb pj-e">♦︎ ${esc(p.category)}</span>
      <h1>${esc(p.name)}</h1>
      ${p.name_en ? `<p class="pj-en" dir="ltr">${esc(p.name_en)}</p>` : ""}
      ${gmix ? tagsG : tags}
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
  <a class="pj-back" href="projects.html">→ العودة إلى كل الأعمال</a>
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
  <div class="pj-hero pj-hero-1"><div class="pj-ht"><span class="eb pj-e">♦︎ مشاريعنا</span><h1>علامـات كبـرت معنـا</h1></div></div>
${slides}
  <div class="pj-chips" role="group" aria-label="نوع العمل" hidden>${[["all", "الكل"], ...kinds.filter(([k]) => projects.some((p) => kindsOf(p).includes(k)))].map(([k, t], j) => `<button type="button" data-k="${k}" aria-pressed="${j === 0}">${t}</button>`).join("")}</div>
  <a class="pj-order" id="pjOrder" href="contact.html" hidden>اطلب خدمتك <i>←</i></a>
  <div class="pj-cards pj-all-cards">
${projects.map(cardOf).join("\n")}
  </div>
</main>`));

console.log(`projects: ${projects.length} pages + projects.html`);

/* the pages above carry an old-style header; the shared navigation bar replaces it (and the other pages are kept in step) */
await import("./sync-nav.mjs");
