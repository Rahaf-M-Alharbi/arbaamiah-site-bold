# SEO plan: أربعمية

Goal: rank for Arabic searches like "شركة تسويق إبداعي السعودية", "كتابة محتوى تسويقي", "تصميم هوية بصرية", plus the brand name.

## Already in the code (verified 2026-11-11, `npm run check`: 32 pages, 0 problems)
- Unique title + meta description per page, one `h1`, `<main>`, skip link, `lang="ar"`.
- Canonical, Open Graph, Twitter card (1200x630 `og-share.png`), theme color.
- JSON-LD: Organization/ProfessionalService (home), FAQPage + breadcrumbs (faq), CreativeWork + breadcrumbs (projects).
- `sitemap.xml` (31 URLs), `robots.txt` with Sitemap line, `pricing.html` noindex.
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
