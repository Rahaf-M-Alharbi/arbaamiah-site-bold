# SEO plan: أربعمية

Goal: rank for Arabic searches like "شركة تسويق إبداعي السعودية", "كتابة محتوى تسويقي", "تصميم هوية بصرية", plus the brand name.

## Target keywords (owner list, added 2026-11-14)
- تسويق
- وكالة تسويق
- صناعة محتوى
- تصميم
- تصاميم جرافيك
- استراتيجية
- كولاج

Coverage check (2026-11-14): تسويق, تصميم, استراتيجية, كولاج are already used in titles/pages. "صناعة محتوى" and "تصاميم جرافيك" appear nowhere on the site yet; "وكالة تسويق" is only in the home and contact titles.

### Google autocomplete findings (Saudi Arabia, Arabic, 2026-11-14)
Suggestions only, not search volume. Check volume in Keyword Planner / Search Console.
- وكالة تسويق: + الرياض, جدة, الدمام, بريدة, رقمي, الكتروني, سعودية. Best buyer intent: add city names to titles/descriptions.
- تسويق: تسويق رقمي, تسويق الكتروني, تسويق عقاري.
- صناعة محتوى: السوشيال ميديا, فيديو, رقمي (AI/Canva queries are learners, not buyers).
- تصميم: تصميم شعار, تصميم جرافيك, تصميم صور.
- تصاميم جرافيك: searchers want free/ready-made. Use singular "تصميم جرافيك" instead.
- استراتيجية: mostly school/teaching results. Pair it: "استراتيجية تسويق".
- كولاج: Google reads it as كولاجين (collagen). Pair it: "كولاج تصميم".

### Google Trends, Saudi Arabia, past 12 months (2026-11-14)
Relative interest only (100 = peak of the strongest term). Keyword Planner skipped (Google Ads forces a campaign setup).
- تصميم شعار: average ~48. By far the biggest. Steady all year.
- تصميم جرافيك: average ~14. Second.
- وكالة تسويق, كتابة محتوى, صناعة محتوى: near zero, mostly flat. Too small for Trends to rank; "صناعة محتوى" is the weakest.
- Takeaway: logo/brand design is the highest-demand service. Put "تصميم شعار" and "هوية بصرية" in titles, headings and a dedicated service page. Keep "وكالة تسويق" + city for buyer intent despite low volume.

More autocomplete (Saudi, Arabic): شركة تسويق الكتروني / عقاري / جدة; تصميم شعار وكالة; تعليق صوتي سعودي; شركة ادارة حسابات سوشيال ميديا; شركات / وكالة تسويق مؤثرين; استراتيجية تسويق بالمحتوى / الخدمات; تصميم كولاج رقمي. Many "تصميم شعار / هوية / تعليق صوتي" searches are free or AI-tool seekers, so add words like "شركة" or "سعودي".

## Update 2026-11-27: search phrases on service pages
- Rewrote the intro line on all 10 service pages around Saudi autocomplete phrases (suggestions, not search volume); changed one section heading on design, websites, ads, account management and content writing.
- Owner confirmed (2026-11-27) the voice artists are Saudi: "تعليق صوتي سعودي" is in the voiceover title, description and intro, and "معلق صوتي سعودي" is in one card.
- Left out pending confirmation: سلة, زد, إعلانات المشاهير, "شركة" wording.
- Checked on 2026-11-27: the 4 new URLs tested on arbaamia.sa returned 404 (not deployed yet). Publish before anything else.

## Update 2026-11-26: service pages and articles
- Added Service + FAQPage JSON-LD to the 10 service pages; `datePublished`/`dateModified` and `article:published_time` on the 3 articles (dates in `published` in `src/data/site.json`; add one per new article, and set it to the real publish day).
- Retitled 6 service pages and `articles.html` around the researched searches (تصميم شعار, تعليق صوتي سعودي, استراتيجية تسويق); descriptions for all 10 services now name the service and Saudi Arabia.
- Footer and article body links now go to the matching service pages.
- `npm run check`: 44 built pages, 0 problems. Local Lighthouse mobile (built dist, not live): service design, cost article, articles list: SEO 100, a11y 100, best practices 100, performance 90-91, LCP 3.5-3.6 s, CLS 0.
- Still open: LCP over 2.5 s; no links from service pages to related articles (needs a new on-page block); dedicated share image and cover images for articles; request indexing in Search Console after deploy.
- Week 3 below (service pages) and the first articles are done.

## Update 2026-11-25
- `npm run check`: 30 pages, 0 problems. `www` now 301s to the apex (verified with `curl -sI`).
- Added BreadcrumbList JSON-LD to services, contact, about, projects (`crumbNames` in `scripts/build.mjs`). JSON validated in built output. Takes effect on the live site after the next deploy.
- Internal links in built HTML are already extensionless (no 308 hop); source files keep `.html`, `cleanLinks` rewrites them at build.
- Lighthouse mobile on the live site (Brave headless, before this deploy):

| Page | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 92 | 100 | 100 | 100 | 2.9 s | 0 | 0 ms |
| Services | 95 | 100 | 100 | 100 | 2.8 s | 0 | 0 ms |
| Project (bunar) | 87 | 100 | 100 | 100 | 4.0 s | 0 | 0 ms |

Mobile LCP improved from 4.5-5.0 s but is still over 2.5 s everywhere; the project page is the worst (4.0 s). Next: read its LCP element and phases.

## Already in the code (verified 2026-11-11, `npm run check`: 32 pages, 0 problems)
- Unique title + meta description per page, one `h1`, `<main>`, skip link, `lang="ar"`.
- Canonical, Open Graph, Twitter card (1200x630 `og-share.png`), theme color.
- JSON-LD: Organization/ProfessionalService (home), FAQPage + breadcrumbs (faq), CreativeWork + breadcrumbs (projects).
- `sitemap.xml` (29 URLs; Search Console read all 29 on 2026-11-13), `robots.txt` with Sitemap line, `pricing.html` noindex.
- Speed: preloaded fonts, AVIF/WebP, minified CSS/JS, brotli/gzip, long cache on assets, security headers.

## Baseline (2026-11-11, Lighthouse 12 on the live site, Brave headless; PageSpeed API quota was exhausted)
| Page | Mobile perf | Desktop perf | Mobile LCP | A11y | Best practices | SEO |
|---|---|---|---|---|---|---|
| Home | 77 | 91 | 5.0 s | 100 | 96 | 100 |
| Services | 81 | 98 | 4.5 s | 94 | 96 | 100 |
| Project (bunar) | 80 | 93 | 4.7 s | 100 | 96 | 100 |

CLS ~0 and TBT ~0 everywhere. Weak spot is mobile LCP (target under 2.5 s).
- Home LCP is the first slide of the hero deck: ~0.5 s resource load delay, then slow paint. Fix: preload/prioritise that image, size images for mobile (119 KiB savings).
- Services and project LCP is a text paragraph with 0.4-1.3 s render delay: likely an entrance animation or font swap holding text back. Check animations on first paragraph.
- Services a11y 94: `aria-required-children`, `heading-order` fail.
- `doctype` audit fails (deliberate: quirks mode, see README).
- Fixed 2026-11-11: canonical, og:url, sitemap, and schema URLs pointed at `/services.html`, but Cloudflare redirects that to `/services` (308). Now all use the extensionless URL. `www.arbaamia.sa` also answers 200 instead of redirecting: add a Cloudflare redirect rule www -> apex.
- Internal links still use `.html`, so each click costs a 308 hop (~0.2-0.9 s). Fix later by linking extensionless.

## Week 1: go live and get found (owner actions, no code)
1. Confirm `arbaamia.sa` is the real domain and points to the host. If not, change `url` in `src/data/site.json` and rebuild.
2. Google Search Console: add the domain property, verify via DNS, submit `https://arbaamia.sa/sitemap.xml`.
3. Bing Webmaster Tools: import from Search Console.
4. Google Business Profile: create it (category: Marketing agency / Advertising agency), same name, email, links as the site.
5. Run PageSpeed Insights on home, services, one project page. Record mobile scores as the baseline.

## Week 2: remove thin or placeholder content (hurts ranking)
- Replace placeholders: testimonials ("نص تجريبي"), logo cards, stats, calculator prices.
- Project pages with short descriptions: `voiceover-1` ("تعليق صوتي."), `collage-1/2/3`, `strategy-1/4`, `ugc-clean-up`. Write 2-3 real sentences each: client, problem, what we did, result.
- Make project image `alt` text descriptive (now "مفازا 1"), e.g. "تصميم عقاري لمفازا: ..." (edit in `scripts/gen-projects.mjs`).
- Wire the contact form `ENDPOINT` so leads are really sent.
- Real prices in, then remove `pricing.html` from `noindex`.

## Week 3: service-page depth
- `services.html` is one page for ~9 services. Add a page per core service (كتابة المحتوى, الهوية البصرية, الإعلانات, تطوير المواقع), each ~400+ words: who it is for, process, example work, FAQ, call to action.
- Link each from the home page, services page, and related projects.
- Add each to the sitemap and give each its own title/description in `site.json`.

## Week 4: authority and trust
- Case studies: 2-3 projects with real numbers (reach, engagement, sales).
- Backlinks: profiles on Saudi business/agency directories, LinkedIn, Behance, partner and client sites linking back.
- Keep Instagram/X profiles linking to the site; keep name, email, links identical everywhere.

## Weeks 5-8: publish and iterate
- One blog or insight article every 1-2 weeks (e.g. "كيف تكتب محتوى يبيع", "كم تكلفة تصميم هوية بصرية"). Answer real questions clients ask.
- Weekly: check Search Console queries, impressions, clicks, and pages not indexed. Rewrite titles/descriptions of pages with impressions but low clicks.
- Monthly: re-run PageSpeed, fix anything under 90 mobile, run `npm run check`.
- Add Safari, Firefox, and real-phone checks (README says only Chromium was checked).

## Expect
New domains usually take 4-12 weeks to show in results; competitive terms take months. Brand-name searches should rank first within days to weeks after indexing.
