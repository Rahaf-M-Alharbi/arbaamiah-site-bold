# Arbaamiah site: reuse the design system

General engineering rules are in @AGENTS.md. This file is the project's own rule: **every new component, section or page reuses what exists. Never create a parallel palette, font setup, button, nav or footer.**

## Before writing any CSS or markup
1. Look for an existing component below, or in `src/css/` (search the class name), and reuse it as is.
2. If it needs to look a little different, add a **variant** to that component (`.tag--x`, `.sec--x`, `.fb--x`) in its own file, built only from tokens.
3. Only if nothing fits, write a new component, using tokens only.

## Tokens: `src/css/00-tokens.css` (the only place values are defined)
- Colours: `--wine` `--green` `--cream`; scales `--wine-950…100`, `--cream-50/30/10`, `--paper-50`, `--ground-light`, `--black` `--ink-900` `--ink` `--ink2`, `--gray-900…100`.
- Fonts: `var(--f-disp)` for headings (Thmanyah Serif Display), `var(--f-body)` for text (Thmanyah Sans). Font files: `src/css/00-fonts.css`.
- The bold look: outlines `var(--border-4)` / `var(--border-3)` (ink), hard shadows `var(--shadow-1 … -10)` (number = offset in px), corners `var(--radius-6 … -16)`, `var(--radius-pill)`, `var(--radius-round)`.
- Motion: `var(--ease)`, `--ease-out`, `--ease-pop` (overshoot), `--ease-spring`, `--ease-in-out`.
- Space below a component: `var(--cmp-mb)`. Textures: `var(--tex)` (velvet), `var(--paper)`.
- Never write a brand hex (`#6c171e`), a font name, or a new `:root{--…}` elsewhere. A new colour or value that will be reused becomes a token in `00-tokens.css`.
- Use the main names; `--vermilion --blush --rose --deep --ground --on --beige --paper2` are old aliases.

## Components in use on the pages
- **Brand button** (call to action, flips on hover; 84 uses): `<a class="flipbtn fb--cream" href="…"><span class="fb-in"><span class="fb-f">Label<i>♠︎</i></span><span class="fb-b" aria-hidden="true">Label<i>♠︎</i></span></span></a>`. Variants `fb--cream` (filled), `fb--line` (outline). Styles: `src/css/23-override-brand-buttons-and-entrances.css`, `33-bold-buttons.css`.
- **Press button** (UI actions and secondary links; presses into its shadow): `class="btn btn--wine"`, `btn--cream` or `btn--light` (flat), plus optional `btn--lg`, `btn--pill`. Used by the calculator (`bg-go`, `bg-btn`), footer CTA (`ft-cta`), project back link (`pj-back`) and links page (`lk`). The look is in `src/css/19-components.css`; the place using it only sets padding, font and layout. Tune one use with `--btn-bg --btn-fg --btn-sh --btn-hover --btn-sh-hover`, never by re-declaring border, shadow or colours.
- **FAQ / Q&A**: `.fq` section with `.fq-l` cards, on the home page and `faq.html`. All styles in `src/css/47-faq.css`. Questions live in `src/data/faq.json` (`home` = the shorter answer shown on the home page); edit there, then run `node scripts/sync-faq.mjs`. Never edit the questions in the HTML directly: `npm run check` fails when they differ.
- **Eyebrow** above a heading (25 pages): `<div class="e eb">♥︎ من نحن</div>`. Styles: `src/css/21-override-services-and-text.css`.
- **Frame** (thin lines + suit corners): `.frame` inside a `.has-frame` parent. Markup in the header of `src/css/19-components.css`.
- **Nav** (`.mini`), **footer** (`.ft`), **closing "pull a card" CTA** (`.xp9`), skip link: shared partials in `src/partials/`. Never copy them into a page by hand: run `node scripts/sync-nav.mjs`.
- Suits ♠︎ ♥︎ ♦︎ ♣︎ (with U+FE0E) are the icon set; no icon fonts or icon libraries.

Page sections are still page-specific (`.ab-*` on about, `.pj-*` on projects, …). For a new section, first copy the pattern of the closest existing one. When a section pattern is needed on a second page, move it into a shared component file instead of copying it again. `src/css/19-components.css` also defines `.sec` (grounds `--paper --beige --wine --red --velvet`) and `.tag`, which no page uses yet: check them visually against the bold look before adopting them.

## Motion
Keep the motion, but respect "Reduce motion" (phone/computer setting): those visitors get the same page with no sliding, flipping, rotating or bouncing; fades and colour changes stay. `src/css/50-reduced-motion.css` (loaded last on every page) holds the shared rule: **any new component that moves goes into its list.** Keyframe animations stop in their own file under `@media (prefers-reduced-motion:reduce)`; scripts check `matchMedia('(prefers-reduced-motion:reduce)')` before animating, as `15-pull-card.js` does.

## Adding a page
1. Copy `faq.html` (head, preloads and the `css:start…css:end` list, which starts with `00-tokens.css` and ends with `50-reduced-motion.css`). Change title, description and body.
2. Page-only styles go in one new numbered file at the end of the CSS list, using tokens and existing components.
3. Add the page to the `pages` list in `scripts/build.mjs` and its description to `src/data/site.json`.
4. Run `node scripts/sync-nav.mjs` (nav, footer, CTA) and `npm run check`.
`pricing.html` is the one stand-alone page with its own styles; don't copy it as a template.

## Enforcement
`npm run check` runs `scripts/design-check.mjs`, and CI runs it before every deploy. It fails on: a page not loading `00-tokens.css` first, tokens defined outside `00-tokens.css`, a hex that already has a token, a new raw colour, a hard-coded font name, an ink outline / hard shadow / radius / easing curve written literally when a token exists, colour hex in inline `style=""`, a page missing from the build list, and FAQ pages out of step with `src/data/faq.json`. Fix the code; add to its `ONE_OFF` list only for a true one-off, with a reason.

## Keep the look
Refactors must not change how the site looks. Compare computed styles before and after with `scripts/compare/` (see README).
