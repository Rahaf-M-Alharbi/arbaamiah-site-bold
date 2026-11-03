# أربعمية website

The live site (served on http://localhost:8081 from `dist/`). One page (`index.html`) plus the pricing calculator (`pricing.html`). Plain HTML, CSS and JavaScript: no framework. One build step makes the deployable `dist/` folder.

## Commands
Node 20 or newer.

| Command | What it does |
|---|---|
| `npm install` | once; installs the only dependency, `esbuild` (pinned, used by the build only) |
| `npm run build` | writes `dist/`, the folder to deploy |
| `npm run preview` | serves `dist/` on http://localhost:8082 the way a good host would: brotli/gzip, long caching, real 404s |
| `npm run dev` | serves the source files on http://localhost:8082, never cached, for editing |
| `node scripts/unused-css.mjs` | lists CSS that can never apply (`--fix` removes it) |
| `node scripts/overridden-css.mjs` | lists declarations a later rule always replaces (`--fix` removes them) |

Edit `index.html`, `pricing.html`, `src/` and `assets/`, then `npm run build`. Never edit `dist/`; it is rebuilt from scratch every time.

## Folder
```
index.html, pricing.html   the pages: markup only; they list their CSS and JS files between css:start/end and js:start/end
src/css/                   styles, one file per topic, loaded in number order (later files refine earlier ones)
src/css/pricing/           styles of the pricing page
src/js/                    one small script per feature (hero story, work deck, form, cursor, ...)
src/js/pricing/            the pricing calculator
assets/fonts/              Thmanyah fonts (WOFF2)
assets/img/                images and SVG textures the page uses
scripts/                   build, preview server, CSS checkers, style comparison (scripts/compare/)
drafts/                    experiments and removed sections kept for reference; not part of the site (see drafts/README.md)
dist/                      build output (not in git)
```

### How the CSS is organised
The design was built in layers: a base for each section (`01`–`19`), then passes that refine the whole page (`20`–`24` "override", `25`–`30`), then the bold card look (`31`–`39`) and the cursor (`40`). **The number order is the cascade order**, so a file can only be moved if the comparison below shows nothing changed. Brand colours and fonts are custom properties: `--wine`, `--cream`, `--deep`, `--ink`, `--f-disp`, `--f-body` in `01-hero-and-nav.css`; section grounds `--ground`, `--on`, `--beige` in `20-override-nav-frame-ground.css`; the full wine/cream scale in `24-override-card-backs-forms-phones.css`.

To change something, find the rule with the browser's inspector (it shows the file and line in `src/css` when running `npm run dev`) and edit it there.

## What the build does
- Joins each page's CSS and JS in order and minifies them with esbuild (each script keeps its own `try/catch`, so one failing script can't stop the others).
- Gives every CSS, JS, font and image file a fingerprinted name (`site.69ca949a.css`), so browsers can keep them for a year and still get new versions immediately after a change.
- Writes brotli (`.br`) and gzip (`.gz`) copies next to every text file, and a `_headers` file with the caching rules (Netlify, Cloudflare Pages).
- The hero velvet ships as AVIF (264 KB) through `image-set()`, with the JPEG (526 KB) for browsers without AVIF.
- The five fonts the page renders with are preloaded, so they download alongside the CSS.

## Measured (local, 1440×900, `npm run preview`)
| | Before cleanup | Now |
|---|---|---|
| First visit, everything the page loads | 1,083 KB | **678 KB** |
| CSS | 111 KB | **13.5 KB** |
| JavaScript | 42 KB | **10 KB** |
| HTML | 25 KB | **6 KB** |
| Hero velvet | 526 KB JPEG | **264 KB** AVIF |
| Repeat visit | everything again | **~6 KB** (only the HTML; the rest is cached) |
| Script work per scroll frame in the hero | 12 ms on the first pass | **under 1 ms** |

"Before" is the site as served on 8081 from a plain Python server (no compression), commit `a781e25`.

## Clean-up done, and how it was checked
In git, one commit per step (`git log`):
1. Speed build added (above).
2. 298 selectors that name classes found nowhere in the page or scripts removed (old hands CTA, big card, deal, play section, old process and rules sections, ...), ~20 KB.
3. Leftovers of removed sections that survived only because their names still appeared in a script lookup, ~9 KB. Also fixed an accidental clash: the old play section's `.br` bar style was landing on the hero frame's hidden bottom-right suit.
4. 215 declarations that a later rule for the same selector always replaces, ~17 KB. Fallbacks for newer CSS (for example `100vh` before `100dvh`) are kept.
5. Empty files removed, stale comments fixed, three files renamed to match their contents, unused images moved to `drafts/unused-assets/`, unused scripts (old final hand, glow shader) moved to `drafts/`.

**Every step was checked against the original:** the computed style of every element and every `::before`/`::after` (about 1,550 per width, every CSS property) was recorded at 390, 768 and 1440 px, both at the top of the page and after scrolling to the bottom, and compared property by property. The result is identical everywhere, except that the hidden frame suit no longer carries the stray grid styles. The draw-a-card, FAQ, contact form, work deck, testimonials, loader, nav and pricing calculator were also exercised; no console errors.

To check a future change the same way:
```
node scripts/compare/collect.mjs              (keep running)
```
Open the page, set `window.TAG='before'` in the console, paste `scripts/compare/snapshot.js`; make the change and rebuild, reload, set `window.TAG='after'`, paste again; then `node scripts/compare/diff.mjs compare-snaps/before.json compare-snaps/after.json`. Repeat at a phone and a tablet width.

## Deploying
Upload `dist/`. On Netlify or Cloudflare Pages, `_headers` sets the caching automatically. On another host, set: `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`; HTML → `no-cache`; turn on brotli or gzip (precompressed copies are already there).

## Notes
- **No `<!doctype>` on purpose.** The design was built in quirks mode; adding one shifts some heights by a few pixels.
- Checked in Chromium only (the desktop app's browser). Safari, Firefox and real phones still to check.

## Before launch (needs content, not code)
- Page title is still "بروفة أربعمية المخمل"; no meta description, social preview image, canonical URL, sitemap or robots.txt yet. These need the final wording and the real domain.
- Placeholders: testimonials ("نص تجريبي"), logo cards ("شعار ١…٨"), stats, calculator prices.
- The contact form does not send anything yet: set `ENDPOINT` in `src/js/11-contact-form.js` to a form service. Until then it shows the thank-you message without sending.
- No custom 404 page.
