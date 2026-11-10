# Reusable website engineering environment

Use these instructions when creating, extending, reviewing, or preparing a website for deployment. Build reusable components first, then compose pages. Deliver maintainable code, accessible experiences, crawlable content, restrained browser resource use, and verified production behavior.

This is a project instruction file, not a runtime `.env` file or an installed development environment. It does not contain credentials. Adapt it to the actual project; do not add infrastructure or features merely to satisfy a checklist. Explicit project requirements take precedence. Record justified exceptions and unresolved checks.

## 1. Establish the project before coding

- Inspect existing code, project instructions, dependencies, design assets, hosting configuration, and build scripts. Preserve useful conventions and avoid unnecessary rewrites.
- Identify the audience, primary user journeys, page inventory, content owners, languages, browser support, integrations, and hosting constraints. Clarify only decisions that materially block progress.
- For every route, record its purpose, data source, rendering method, public/private status, indexability, metadata, and required loading/error/empty states.
- Prefer the simplest architecture that satisfies the requirements. Static generation suits stable public content; server rendering suits request-dependent public content; client interactivity should be limited to features that need it. Keep private data out of shared caches.
- Set measurable acceptance criteria and document architecture decisions. Do not assume a framework is required for a small static website.

## 2. Create a reproducible development setup

- Pin a supported runtime and package manager; commit the dependency lockfile. Use reproducible installs in CI.
- Provide documented commands for local development, production build, production preview, linting, type checking, and relevant tests. Only document commands that actually exist.
- Separate local, preview, staging, and production configuration. Provide `.env.example` with placeholder values and explain required variables. Validate configuration early. Ignore real secrets and local environment files in version control.
- Distinguish public configuration from server-only secrets. Anything shipped to the browser is public, regardless of the variable name.
- Use formatting, linting, and suitable type checking. Prefer strict types in typed projects; validate runtime input at external boundaries.
- Keep dependency count low. Check maintenance, compatibility, license, bundle cost, and known vulnerabilities before adding a package. Remove unused code and dependencies.
- Document setup, project structure, content editing, tests, release steps, and troubleshooting in the project README.

## 3. Organize code for maintenance

- Separate shared UI, page composition, feature logic, data access, configuration, and assets. Keep server-only code out of client bundles.
- Use descriptive names, explicit inputs and outputs, small cohesive modules, and predictable control flow. Prefer composition over inheritance and oversized configuration APIs.
- Avoid duplicated business rules, global mutable state, unnecessary abstractions, circular imports, and giant page components. Extract shared code when real reuse exists.
- Keep state close to its owner; derive values instead of storing duplicate state. Use global state only for truly shared behavior. Keep shareable filters and pagination in URLs when appropriate.
- Handle asynchronous races, cancelled requests, retries, and cleanup. Use stable list keys and deliberate effect dependencies. Do not suppress warnings to conceal defects.
- Comment decisions and non-obvious constraints. Do not narrate obvious code. Remove debug logging, dead code, and abandoned experiments before release.

## 4. Build an efficient design system before components and pages

Build in this order: design tokens → semantic primitives → reusable patterns → sections → page templates → real pages.

- Treat the design system as a required shared foundation for every page. Efficiency comes first: achieve consistency with the smallest useful token set, reusable components, and minimal browser work. Reuse an existing suitable system before creating another; do not add a UI framework solely to establish consistency.
- Keep one source of truth for design tokens. Prefer shared CSS custom properties or the existing project token mechanism over runtime styling dependencies. Use semantic roles such as page background, surface, primary text, muted text, border, action, and status; map them to a small base palette.
- Define colors; page and section backgrounds; approved background patterns; spacing and layout widths; typography families, sizes, weights, line heights, and letter spacing; icon style; borders, radii, and shadows; breakpoints; focus treatment; and motion durations/easing. Define only tokens the website actually needs and check contrast for every intended foreground/background pairing.
- Define reusable button variants and sizes, fields, links, cards, navigation, and section surfaces from those tokens. Document when each variant is used. Keep state styling consistent across hover, focus, active, disabled, loading, error, and success where applicable.
- Use one coherent icon family or style with shared size, stroke weight, alignment, and color rules. Import only the icons used, preferably as small SVG assets; avoid whole icon bundles or icon fonts. Give meaningful icon-only controls accessible names and hide decorative icons from assistive technology.
- Prefer plain backgrounds by default. Where the design calls for a pattern, reuse a small static CSS or SVG pattern, ensure readable contrast, and measure its rendering cost. Avoid large decorative images, expensive filters, and continuously animated patterns unless they serve a clear purpose within the performance budget.
- Keep typography efficient: load only used font files and weights, use a shared responsive type scale, and avoid per-page font additions. Apply shared spacing and layout scales; introduce exceptions only for a real content or usability need and document them.
- All pages and components must consume the shared tokens and variants. Avoid duplicate styles and arbitrary values for established design roles. Update the source token or shared component when changing the site-wide appearance. Add a new variant only when an existing one cannot express the intended behavior clearly.
- Document the token palette, typography scale, spacing scale, icon rules, backgrounds/patterns, and component states in a lightweight reference. Add themes only when required, using the same semantic roles and checking contrast in each theme.
- Before delivery, check representative pages and component states for visual drift, contrast, responsive behavior, and unused styles/assets. Verify that the design system stays within the route performance budgets; consistency must not require shipping unnecessary components or scripts.
- Start with links, buttons, fields, labels, containers, section headings, and media. Then build header/navigation, mobile menu, footer, cards, and only the other patterns the project needs.
- Document component purpose, props, variants, supported states, keyboard behavior, and responsive behavior. Use a lightweight component gallery or an existing documentation tool; do not add a large tool solely for a small project.
- Buttons perform actions; anchors navigate to real URLs. Set button types explicitly inside forms. Avoid clickable divs, nested interactive elements, and misleading disabled controls.
- Navigation must support keyboard and touch, identify the current page, and retain normal browser open-in-new-tab behavior. Mobile menus need an accessible name, expanded state, predictable close behavior, and appropriate focus handling.
- Cards need meaningful headings and links. Do not make an entire card clickable if that creates nested controls or ambiguous keyboard behavior.
- Prefer native controls and platform behavior. Custom dialogs need focus entry/return, Escape support, accessible naming, and modal focus containment.
- Test relevant default, hover, focus, active, disabled, loading, error, success, empty, and long-content states before composing pages. Do not force meaningless states onto every component.

## 5. Compose responsive, usable pages

- Use semantic landmarks, a clear primary heading, logical heading hierarchy, and a skip link. Keep reading order and keyboard order aligned with the visual layout.
- Design for narrow screens first and use content-driven breakpoints. Avoid fixed heights for text sections, accidental horizontal overflow, and hover-only functionality.
- Check narrow mobile, tablet, desktop, landscape, browser zoom, long words, and enlarged text. Keep controls easy to tap and focus indicators visible and unobscured.
- Preserve familiar browser behavior: Back/Forward, reload, direct links, text selection, browser Find, and normal scrolling. Keep important text as real HTML rather than text embedded in images or canvas.
- For client-side route changes, update the document title and manage focus appropriately. Restore scroll predictably; do not steal focus during ordinary background updates.
- Use concise, consistent copy and useful recovery instructions. Avoid placeholder links, fabricated testimonials, and unfinished production content.
- For multilingual sites, set `lang` and `dir`, use logical CSS properties, format dates/numbers by locale, and verify Arabic/RTL layouts when supported. Handle mixed-direction text deliberately.

## 6. Make every public page discoverable

- Return meaningful content and links in initial or prerendered HTML for public content pages. Verify the served HTML; do not assume rendering configuration worked.
- Give each indexable page a useful, distinct title and description. Set absolute canonical URLs intentionally. Include social sharing metadata and suitable preview images.
- Use crawlable anchor links, stable readable URLs, and deliberate URL normalization. Keep redirects free of loops and chains. Preserve old URLs with permanent redirects when content moves.
- Serve appropriate HTTP status codes: valid pages succeed, missing pages return 404/410 as appropriate, and redirects use suitable 3xx responses. Do not return a success status for every missing route.
- Generate a sitemap containing canonical indexable URLs. Keep robots rules consistent with intended crawling. A robots.txt disallow is not a reliable way to remove indexed content; crawlers must be able to read a page-level noindex directive. Neither mechanism protects private data.
- Prevent accidental indexing of preview/staging sites through access controls and appropriate indexing directives. Confirm production has no accidental noindex or crawl block.
- Use accurate structured data only for supported types that match visible content; validate it. Add breadcrumbs when they help navigation. Use reciprocal hreflang for real language/region alternatives when applicable.
- Plan faceted navigation, pagination, duplicate content, and site-search indexability explicitly. Do not canonicalize distinct useful pages indiscriminately.
- Give images meaningful alternative text or empty alt text when decorative. Publish useful original content and descriptive internal links. Engineering improves crawlability but does not guarantee rankings.
- Check every route and template, including direct requests, refreshes, shared links, and error pages. An excellent home page does not compensate for broken inner pages.

## 7. Control page load and browser resource use

Target real-user Core Web Vitals at the 75th percentile, assessed separately for mobile and desktop: LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, CLS ≤ 0.1. Lab checks help catch regressions but do not prove field performance; Lighthouse TBT is not an INP measurement.

- Define route-specific transfer, JavaScript, image, font, and third-party budgets before adding large assets. For a simple content site, start with suggested project budgets of ≤ 150 KB compressed initial JavaScript and ≤ 1 MB total initial transfer, then adjust with measured justification. These are working budgets, not universal standards.
- Ship as little client JavaScript as practical. Split code by route/feature, defer optional widgets, and avoid hydrating static content unnecessarily. Inspect bundles for duplicates and expensive imports.
- Make the main content and likely LCP asset discoverable early. Do not lazy-load the hero/LCP image. Use preload or high fetch priority selectively for genuinely critical resources.
- Resize and compress images, use appropriate modern formats with needed fallbacks, provide responsive sources, and reserve dimensions/aspect ratios. Lazy-load offscreen images and embeds.
- Limit font families, weights, and subsets. Use WOFF2 where supported and a deliberate font-display strategy; match fallback metrics where practical. Preload only critical fonts actually used.
- Keep critical styling small and avoid unnecessary render-blocking assets. Remove unused CSS, excessive DOM depth, and costly repeated layout calculations.
- Split long tasks, avoid synchronous heavy work, debounce appropriate searches, and cancel obsolete requests. Use workers for demonstrated CPU-heavy work; use virtualization for large interactive lists only when it preserves accessibility and content discovery.
- Clean up event listeners, observers, timers, animation frames, and subscriptions. Test repeated navigation for leaks. Stop optional work when offscreen or when the document is hidden.
- Add third-party scripts only for a clear purpose; measure their cost and defer where possible. Avoid autoplay video backgrounds by default; provide a poster and user-controlled playback when video is needed.
- Configure compression, CDN delivery, and suitable caching. Long-cache fingerprinted static assets; keep HTML and changing data appropriately fresh. Avoid caching personal responses publicly.
- Measure production builds on constrained mobile CPU/network settings, cold and warm loads, and representative templates. Record the test environment and asset sizes. Profile the cause of regressions instead of guessing.

## 8. Make animation purposeful and resilient

- Use animation to communicate state or hierarchy. Keep primary content immediately available; do not delay usability for an intro or loader.
- Prefer CSS for simple transitions, primarily transform and opacity. Avoid routinely animating layout dimensions, top/left, heavy blur, or large shadows. Confirm actual rendering cost in a performance trace.
- Suggested project defaults: 120–200 ms for small interactions and 200–350 ms for larger transitions. Tune to the task; these are conventions, not standards.
- Respect `prefers-reduced-motion` in CSS and JavaScript. Remove nonessential movement and smooth scrolling while preserving meaningful state feedback.
- Keep content visible by default. Reveal effects must enhance already available content and remain safe when scripts fail, observers are unsupported, or reduced motion is enabled.
- Use IntersectionObserver for suitable visibility triggers and requestAnimationFrame for frame-based work. Batch DOM reads/writes; avoid expensive handlers on every scroll event.
- Avoid scroll hijacking, gratuitous parallax, perpetual decorative loops, and cursor effects that interfere with input. Provide pause/stop controls where required for automatically moving content; avoid dangerous flashing.
- Add an animation library only when its capabilities are needed. Import selectively, stop hidden/offscreen animation, and clean up on route changes. Use will-change sparingly and temporarily.
- Verify touch, keyboard, low-powered devices, reduced motion, route transitions, and rapid repeated interactions. Animation must not hide focus, change reading order, or block navigation.

## 9. Accessibility and progressive enhancement

- Target WCAG 2.2 AA and additionally respect reduced-motion preferences. Automated checks are a starting point; manually verify keyboard operation and representative screen-reader journeys.
- Provide sufficient contrast, visible focus, accessible names, associated labels, meaningful error messages, and correctly announced status changes. Do not rely on color alone.
- Prefer semantic HTML to unnecessary ARIA. Match ARIA states to actual behavior. Make tooltips and help available without hover.
- Support text resizing and reflow. Caption relevant video and provide alternatives for meaningful nontext content.
- Keep public reading and navigation functional when JavaScript is unavailable. For genuinely script-dependent tools, provide an understandable fallback instead of a blank screen.

## 10. Forms, data, APIs, and reliability

- Use labeled fields, sensible types, autocomplete, and clear validation. Preserve user input after errors. Distinguish submitting, success, failure, and retry states; prevent accidental duplicate submissions where necessary.
- Validate on the server even when client validation exists. Bound payload sizes, apply timeouts, and expose safe errors. Never fake a successful submission when no working service is connected.
- Fetch data without avoidable waterfalls. Use bounded pagination, cancellation, and appropriate caching/revalidation. Handle stale data, offline behavior, empty results, and unavailable services.
- Validate external responses. Avoid uncontrolled retries; use bounded backoff for suitable operations. Consider idempotency for operations such as payments or job creation.
- If a backend exists, enforce authorization per operation and resource, use parameterized database queries, index demonstrated query paths, version schema changes, and document migrations.
- If content is managed in a CMS, define schemas, validation, accessible authoring guidance, preview behavior, and cache invalidation. Check images, links, metadata, and missing content before publishing.
- Keep production errors recoverable. Provide helpful 404 and server-error pages and safe reporting with no secrets or personal data exposed.

## 11. Security and privacy

- Keep secrets server-side and out of source control, browser code, logs, and public build artifacts. Use least-privilege credentials and rotate exposed secrets.
- Treat user and external content as untrusted. Use safe text rendering; sanitize permitted rich HTML with a maintained sanitizer. Validate URLs and avoid unsafe dynamic script evaluation.
- Apply authentication and server-side authorization where needed. Use appropriately protected cookies, CSRF defenses for relevant cookie-authenticated actions, rate limits, and abuse controls. CORS is not authentication.
- Use HTTPS and configure appropriate security headers, including a tested Content Security Policy. Configure HSTS after HTTPS readiness; assess subdomain consequences before enabling it broadly.
- Check dependency vulnerabilities, upload handling, redirect targets, and webhook signature verification where applicable. Do not expose stack traces or sensitive source maps unintentionally.
- Collect the minimum needed personal data. Document analytics, retention, and deletion behavior. Implement consent and privacy requirements appropriate to the deployment context; do not add trackers by default.

## 12. Verify behavior, not merely appearance

- Run applicable formatting, linting, type checks, and production builds. Fix failures and investigate browser console/network errors.
- Test business rules and risky transformations with focused unit tests; component behavior and service boundaries with integration tests; critical journeys with end-to-end tests. Avoid tests that merely mirror implementation.
- Exercise navigation, forms, search/filtering when present, authentication when present, and failure/retry behavior. Verify direct URLs, refresh, Back/Forward, and genuine 404 responses.
- Check representative pages in Chrome, Safari, and Firefox according to the support policy; include real mobile testing when available. Report untested browsers explicitly.
- Audit accessibility, metadata, crawlability, links, and assets across all routes. Combine automated checks with manual keyboard and visual checks.
- Add visual regression checks for important layouts where useful. Test long/empty content, responsive widths, zoom, RTL where supported, and reduced motion.
- Compare production performance against budgets. Do not claim a Lighthouse score, security pass, or accessibility conformance without evidence. Record unavailable checks and material limitations.

## 13. Prepare a dependable deployment

- CI should perform reproducible installation, applicable code checks/tests, and a production build before release. Make failures visible and protect the release branch appropriately.
- Use a preview deployment to verify the real hosting behavior: route handling, server functions, environment variables, metadata, compression, caching, headers, forms, and redirects.
- Confirm domain, DNS, HTTPS, canonical host, sitemap, indexing directives, and social previews. Check all launch routes for placeholders, broken links, missing assets, and wrong environment URLs.
- Document the release process, version/commit, rollback steps, and post-release owner. For databases or stored content, plan backups, restoration checks, and backward-compatible migrations as appropriate.
- Run production smoke checks after release. Monitor uptime, errors, critical transactions, and real-user performance with minimal privacy-aware instrumentation. Configure actionable alerts.
- Review indexing and performance after launch; field data may not exist immediately. Maintain dependencies and content, and reassess budgets when new features or trackers are added.
- Do not mark the site deployment-ready if essential checks failed or remain unverified. State what passed, what remains, and its practical impact.

## 14. Required delivery record

For each project, maintain a concise record containing:

1. Route inventory and rendering/indexing decisions.
2. Design-system reference: tokens, typography/spacing scales, backgrounds/patterns, icon rules, component inventory, and relevant states.
3. Setup commands, environment variable documentation, and architecture decisions.
4. Performance budgets and measured results with test conditions.
5. Accessibility, SEO, functional, and security checks performed and limitations.
6. Deployment, monitoring, rollback, and maintenance instructions.

For a small static site these may fit in one README. Scale documentation and tooling to the actual risks and complexity.

## References

Verify evolving framework and hosting details against their official documentation during implementation. Baseline sources checked October 4, 2026:

- Core Web Vitals: https://web.dev/articles/vitals
- Google SEO guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- JavaScript SEO and status codes: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Reduced motion: https://www.w3.org/WAI/WCAG22/Techniques/css/C39
- Accessibility standard: https://www.w3.org/TR/WCAG22/
- Safe DOM handling: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html
