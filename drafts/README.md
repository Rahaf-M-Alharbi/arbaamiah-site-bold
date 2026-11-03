# Drafts
`experiments-1-12/` holds the closing-section experiments as they were before pruning (full `index.html`, `29-cta-experiments.css`, `15-cta-experiments.js`).
Only experiment 9 (draw a card) stays in the live code. To restore another one, copy its `<section class="xp xpN">` block, its CSS block and its `pN` function in the JS back into `src/`.
Not loaded by the build.
`ideas-1-5/` holds the first five card ideas (flip the four, swipe the stack, shuffle and deal, the fan, lay it on the table): their CSS, JS and HTML sections. The live `32-cta-ideas.css` / `18-cta-ideas.js` now hold the "reveal a free consultation" set instead.
`ideas-6-10/` holds the "reveal a free consultation" set before ideas 2-4 (scratch card, card and ticket, one of five) were swapped for variants of ideas 1 and 5.
`reveal-ideas-1-5/` holds the last full set of reveal ideas (1 pick your card, 2 spread the deck, 3 three piles, 4 cut the deck, 5 pull from the deck). Only idea 1 stays in the live code.
`section-9/` holds experiment 9 (draw a card) as removed from the live code: its section HTML, `29-cta-experiments.css` (base `.xp` rules plus the xp9 block) and `15-cta-experiments.js`. The live `29-cta-experiments.css` keeps only the shared `.xp` base rules.
`pick-your-card/` holds the final green "pick your card" section (the CSS and JS; its markup is in `reveal-ideas-1-5/sections.html`, first section). Removed from the live code; only section 9 stays.
`previous-cta/` holds the old final call-to-action section ("نمرّر لك الورقة الرابحة": the section HTML and `07-final-hand.js`). Replaced by the draw-a-card section as the main CTA. Its CSS rules (`.hnd`, `.htxt`, `.hcard`) are still in the stylesheets but unused.
`bold-process/` holds the bold card version of the "how we work" section (`39-bold-process.css`). Removed; the section is back to its original design. To bring it back, copy the file to `src/css/` and link it after `38-bold-hero-cards.css`.
`loader-ideas/` is a preview page of four loading-screen ideas in the bold card style (deal, spinning card, shuffle, name plate), with the current loader on top for comparison. Open it through a server from the site folder (e.g. `python3 -m http.server 8083`, then `/drafts/loader-ideas/`). Not loaded by the build; nothing in the live loader has changed.
