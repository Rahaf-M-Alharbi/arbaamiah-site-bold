# أربعمية: same site, cleaner code

A pure refactor of `arbaamiah-v1-velvet-spread.html`. **No design, text, animation or behaviour was changed.** The original file and the blueprint folder are untouched.

## Open it
Double-click `dist/index.html` (pricing calculator: `dist/pricing.html`). Or `npm run dev` → http://localhost:8080.

## What was split out of the one 890 KB file
| Before | Now |
|---|---|
| 1 inline `<style>`, 1037 lines | `src/css/00…24-*.css`, 25 files in the **original order** (later files override earlier ones, exactly as before) |
| 14 inline `<script>` blocks | `src/js/01…14-*.js`, same order, each unchanged |
| 700 KB + 54 KB base64 JPEGs inside CSS | `assets/img/velvet.jpg`, `paper.jpg` (byte-identical) |
| 6 inline SVG data-URIs (grain textures) | `assets/img/texture-1…6.svg` |
| 15 OTF fonts | `assets/fonts/*.woff2`, same glyphs, ~⅓ the size |
| markup + everything | `index.html` = markup only; `pricing.html` split the same way |

`npm run build` (no dependencies) writes `dist/`: CSS and JS concatenated into one fingerprinted file each (`site.<hash>.css/.js`, safe to cache forever), CSS comments/indentation stripped, each script still wrapped so one error can't stop the others, fonts and hero image preloaded, scripts `defer`red. Assets load as separate cacheable files instead of inside the HTML.

## Verified identical
Original vs `dist/` measured in the same browser: page height 16339 px both, and the position and size of every section, card, panel, stat, step, FAQ row and form block match to the pixel. No missing files.

## Notes
- **No `<!doctype>` on purpose.** The original had none, so it renders in quirks mode; adding one shifted some heights by a few px (page 16 px shorter). Kept as is to stay exact.
- CSS files are grouped by topic but stay in cascade order, because the original is built from layered overrides. Merging them into one file per component would risk changing the look; do that only with side-by-side checks.
- Content that is still placeholder in the original (testimonials "نص تجريبي", logo slots "شعار ١…٨", stats, calculator prices, form `ENDPOINT=''` in `src/js/11-contact-form.js`) was left exactly as it was.
- Added only non-visual head tags: favicon, apple-touch icon, preloads, `lang="ar"`.
