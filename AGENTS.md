# AGENTS.md — niloy.tech

Reference for AI agents editing this repo. **Static GitHub Pages** (no npm/CI build). Live: https://niloy.tech

---

## Site map (`index.html`)

| Section | Anchor | Edit in | Styles | JS |
|---------|--------|---------|--------|-----|
| Nav | `#mh-header` | `index.html` | `styles.css`, `glass-theme.css` | `custom-scripts.js` (onePageNav if `#mh-home` exists) |
| Hero | `#mh-home` | `index.html` | `styles.css` | `animations.js` |
| About | `#mh-about` | `index.html` | `styles.css` | — |
| Quote / stats | `.mh-quote-stats` | `index.html` | `styles.css` | `animations.js` |
| How I can help | `#mh-services` | `index.html` | `services-showcase.css` | `service-showcase.js` (SVG draw), WOW in `custom-scripts.js` |
| Skills | `#mh-skills` | `index.html` | `styles.css` | `animations.js` |
| Experience | `#mh-experience` | `index.html` | `styles.css` | WOW in `custom-scripts.js` |
| **Case studies** | `#mh-portfolio` | **manifest + build** (below) | `styles.css` (grid), `glass-theme.css` (cards), `external-link-icon.css` | `custom-scripts.js` (`initPortfolioFilter`), `external-link-icon.js` |
| Photography / Beyond data | `#mh-photography` / `.beyond-data` (before contact) | `index.html` | `styles.css` | `beyond-data-icons.js` |
| Photography page | `/photography/` | `photography/index.html` | `photography-page.css`, `closing-cta.css` | `photography-page.js`, Fancybox (exhibitions) |
| Achievements | `#mh-achievements` | `index.html` | `styles.css` | — |
| Certificates | `#mh-certificates` | `index.html` | `styles.css` (`.cert-marquee`) | — |
| Reviewer certs | inside experience | `index.html` | `.portfolioContainer` | Fancybox `data-fancybox="reviewer"` |
| Contact | `#mh-contact` | `index.html` | `contact-section.css` | `contact-section.js` |
| Blog | `blog/index.html` | `blog/` | `medium-style.css`, `styles.css` | `medium-on-website.js` |
| Case study pages | `/projects/{slug}/` | `projects/{slug}/content.html` or custom `index.html` | `case-study.css`, `tenten-case-study.css` (+ `list-dash.css`), or `hsep-case-study.css` | `case-study.js`, `tenten-case-study.js`, or `hsep-case-study.js` |
| Résumé page | `/resume/` | `resume/index.html` | `resume/style.css` (standalone, not shared) | — |

**Shared everywhere:** `glass-theme.css` (tokens, `.glass-card`, `.text-gradient-accent`), `typography.css`, `responsive.css`, `closing-cta.css` (closing CTA + `.page-credits`), Bootstrap, jQuery.

---

## Global rules

- **Card hover / glass:** use `.glass-card` from `glass-theme.css` — do not duplicate hover on section-specific selectors.
- **Accent gradient text:** `.text-gradient-accent` (also aliased as `.contact-section__highlight`).
- **Fancybox:** still used for certificates, reviewer gallery, and **photography exhibitions** (`/photography/`) — **not** for portfolio case studies or masonry gallery.
- **Two gallery patterns — do not mix:**
  - **New portfolio grid:** `.portfolio-showcase` + `.portfolio-showcase__card` (`#mh-portfolio`)
  - **Legacy tiles:** `.portfolioContainer` + `.grid-item` (reviewer gallery, old homepage galleries)
- **Images:** project screenshots → `projects/{slug}/images/`. Homepage assets → `assets/images/` (see layout below).
- **Image delivery:** every `<img>` has intrinsic `width`/`height`; below-the-fold images get `loading="lazy" decoding="async"` (never the hero or a case study's first image). Raster images ship as `<picture><source type="image/webp" srcset="x.webp"><img src="x.png"></picture>` with the WebP next to the original. Add new images to the `IMAGES` list in `scripts/optimize-site-images.mjs` (`{ src, kind, maxWidth }`; `kind` is `graphic` for text/UI/charts/maps/certificates/logos (q90, sharp_yuv, near-lossless tried for PNG) or `photo` (q85); `maxWidth` = min(original width, 2x the widest rendered CSS width), never upscaled) and run it. A WebP that is not smaller than its original is deleted and reported as SKIP: serve the original without `<picture>`. Portfolio card `<picture>` + dimensions are emitted by `build-portfolio.mjs` (reads the `.webp` with `sips`). Fancybox `href` keeps pointing at the full-size original. SVGs (e.g. `experience/logos/SheSTEM.svg`, a self-hosted copy of the SheSTEM logo) ship as-is and need no `IMAGES` entry.

### `assets/images/` layout

| Folder | Use |
|--------|-----|
| `site/` | Profile, default social preview (`og-image.jpg`, 1200×630, rendered from `scripts/templates/og-card.html`), HUD SVG (`portfolio-hud.svg`) |
| `experience/logos/` | Employer/org logos in experience timeline |
| `experience/education/` | Graduation / education photos |
| `experience/10ms/` | 10 Minute School ceremony & award photos |
| `reviewer/` | Elsevier reviewer certificate scans (Fancybox in experience) |
| `certificates/` | Certificate marquee (`#mh-certificates`) |
| `photography/profiles/` | Platform link thumbnails (Unsplash, 500px, Instagram) |
| `photography/gallery/` | Masonry gallery on `/photography/` (see `photography/gallery.json`) |
| `exhibitions/` | Exhibition / award photo gallery |
| `achievements/` | Images linked from achievements list |
---

**SEO:** `sitemap.xml` is regenerated by `build-portfolio.mjs`. Each `<lastmod>` is the last **commit** date of that page's source file (`git log -1 --format=%cs`), so run the build after committing content changes. Projects with `showOnHome: false` are left out of the sitemap. `robots.txt` points to `https://niloy.tech/sitemap.xml` and disallows `/scripts/` and `/projects/*/content.html` (headless fragments). Root `404.html` is served by GitHub Pages for missing paths: root-absolute links only, `noindex`.

**Head order (all pages):** `<meta charset>` first, then viewport, title, then `<script defer src="/assets/js/analytics-init.js">` (no `X-UA-Compatible`, no `http-equiv="content-type"`). Never place `<meta>` outside `<head>`. Do not hide the hero image (`.hero-img`) with opacity/WOW/GSAP: it is the homepage LCP element (preloaded as WebP right after the analytics script).

**CSS/JS loading:** only above-the-fold CSS blocks render (bootstrap, glass-theme, styles, responsive, theme-colors, typography on the homepage). Below-the-fold sheets, Font Awesome and Google Fonts load with `media="print" onload="this.media='all'"` plus a `<noscript>` fallback. Body scripts are all `defer` (order matters: jQuery first); inline scripts that need jQuery must wait for `DOMContentLoaded`. No `animate.css` or Popper: the only WOW animation (`.animated.fadeInUp`) lives at the top of `styles.css`. Fancybox is loaded on demand by `assets/js/fancybox-lazy.js` (near-viewport or first click); include that script after jQuery instead of the Fancybox tags. Font Awesome (`css/all.min.css`) is homepage only; subpages use no `fa-` icons. Decorative `<i>` icons get `aria-hidden="true"`; icon-only links need `aria-label`.

**Social meta (Open Graph / Twitter):**

| Page | Edit in | Image |
|------|---------|--------|
| Homepage | `index.html` `<head>` | `assets/images/site/og-image.jpg` (1200×630) |
| Blog, Résumé, Card | `blog/index.html`, `resume/index.html`, `card/`, `card/scan/` `<head>` | same default OG image |
| Photography | `photography/index.html` `<head>` | `assets/images/photography/gallery/dhaka-intersection-night.jpg` |
| Case studies | `scripts/templates/project-page.html` + `manifest.json` `page.title` / `page.description` → run build | project thumbnail |

Keep `meta description`, `og:description`, and `twitter:description` in sync per page. JSON-LD `Person.image` stays the profile photo (`niloy-profile5.jpg`), not the OG screenshot.

**Regenerate the OG image** after editing `scripts/templates/og-card.html` (plain editorial card on the site's dark tokens; no gradients, glows or pills): headless Chrome `--force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=6000 --screenshot` of the file, then `sips -s format jpeg -s formatOptions 85` to `assets/images/site/og-image.jpg` (keep under 200 KB).


**Positioning string:** `AI/LLM Engineer & Data Analyst`. Use it verbatim in the homepage title, JSON-LD `Person.jobTitle`, footer, `llms.txt`, and off-site profiles. The hero rotator (`I'm a` + Data Analyst / AI Product Engineer / Researcher, in an `h4`) is intentionally left as is.

**Homepage JSON-LD:** one `@graph` with `WebSite` (`#website`), `ProfilePage` (`#profilepage`) and `Person` (`#person`). Case studies and posts should reference the author as `{"@id": "https://niloy.tech/#person"}`. Add new profiles to `Person.sameAs`. JSON-LD dates (`dateModified`, `datePublished`) must be full ISO 8601 datetimes with timezone, e.g. `2026-10-10T00:00:00+06:00` (Search Console flags date-only values on ProfilePage); bump the homepage `dateModified` when its content changes.

**Headings:** the hero `h1` is the only `h1`. Sections are `h2`, items `h3`/`h4`; never skip a level. Skill levels (`.sk-level`) render from `data-level` via CSS `::after` so "Proficient"/"Core" do not dominate page text.

### AI visibility

| File | Source | Notes |
|------|--------|-------|
| `llms.txt`, `llms-full.txt` | GENERATED by `build-portfolio.mjs` from `scripts/templates/llms-intro.md` + `manifest.json` | Edit the intro template, not the output |
| `robots.txt` | hand-edited | AI/search crawlers allowed on purpose (named group repeats the `*` disallows) |
| `photography/index.html` `GALLERY_STATIC` markers | GENERATED from `photography/gallery.json` | `<noscript>` image list so non-JS crawlers see the gallery |
| `<object>` SVG diagrams | hand-edited | Put a short `<p>Diagram: ...</p>` fallback inside each `<object>` (crawlable, not shown) |
| `<key>.txt` at root + `scripts/indexnow.mjs` | IndexNow (Bing, feeds ChatGPT search) | After deploy: `node scripts/indexnow.mjs` (URLs whose lastmod is today), `--all`, `--dry-run` |

---

## Portfolio & case studies (modular)

```
projects/manifest.json          ← order, cards, SEO, URLs (source of truth)
projects/{slug}/content.html    ← case study body (edit)
projects/{slug}/images/         ← project images only
projects/{slug}/index.html      ← GENERATED — do not edit
scripts/build-portfolio.mjs
scripts/templates/project-page.html, nav-snippet.html
```

**URLs:** `https://niloy.tech/projects/{slug}/` (e.g. `air-quality`).

**Build (required after manifest or content changes):**

```bash
node scripts/build-portfolio.mjs
```

**Homepage grid:** only HTML between `<!-- PORTFOLIO_GRID_START -->` and `<!-- PORTFOLIO_GRID_END -->` in `index.html` is overwritten. Keep `assets/js/external-link-icon.js` on `index.html` so card footer icons render.

### `manifest.json` (per project)

| Field | Notes |
|-------|--------|
| `order` | Homepage sort |
| `slug` | URL: `/projects/{slug}/` |
| `category` | `analytics` \| `ml` — must match filter pills |
| `title`, `badge`, `card.*` | Card UI |
| `card.thumbnail` | e.g. `projects/{slug}/images/file.png` |
| `links.caseStudy` | Card link |
| `links.footerAction`, `footerMeta` | Card footer (e.g. “View project” / “Live dashboard”; build emits `icon-external-link`) |
| `page.title`, `page.description` | SEO |
| `page.useTemplate: false` | Skip generated `index.html` (hand-built page) |

**Current slugs:** `tenten` (custom page, portfolio #1), `hsep` (custom page, portfolio #2), `chicago-taxi`, `heart-disease`, `linkedin-network` (off homepage), `bigquery-cost-monitoring`, `population-density-maps`, `us-superstore` (off homepage), `crm-sales`, `air-quality`

**Custom showcase (`tenten`):** `page.useTemplate: false` — hand-built [`projects/tenten/index.html`](projects/tenten/index.html), styles in [`assets/css/tenten-case-study.css`](assets/css/tenten-case-study.css) + shared [`assets/css/list-dash.css`](assets/css/list-dash.css) (work-card bullets), motion in [`assets/js/tenten-case-study.js`](assets/js/tenten-case-study.js). **Deployed assets only** under `projects/tenten/assets/`:

| Path | Contents |
|------|----------|
| `assets/mascot/` | PNG fallbacks (`tenten.png`; `tenten-love-eye.png` archived, unused) |
| `assets/lottie/` | Lottie JSON used on page (`loading`, `looking-around`) |
| `assets/videos/` | Surface flow WebM (`general-flow`, `recorded-flow`, `exam-flow`, `liveclass-flow`). `preload="none"` + poster; `tenten-case-study.js` plays them via IntersectionObserver (download starts near the viewport) and pauses off-screen |
| `assets/ui/posters/` | `{surface}-flow-poster.webp`: frame-0 posters for the surface videos |
| `assets/ui/` | `timeline.png`, `tenten-n8n-workflow.png`, `rag-flow-animated.svg`, `agent-routing-flow.svg`, `analytics-dashboard.svg`, `tenten-card.png`, `og-tenten.jpg` (each raster with a `.webp` sibling except the og image); work-card diagrams (RAG, Routing, Analytics) embed SVGs via `<object class="tenten-work-card__svg">` (self-animated; source archives in `TenTen icons and lottie/`) |

**Source / archive only** (not linked from the live page): `projects/tenten/TenTen icons and lottie/`, `TenTen.pdf`. Do not deploy `demo html/`.

#### `tenten-case-study.css` — CSS architecture rules

- **Do not redeclare `font-family` on h1–h4 elements or body-inheriting elements.** `typography.css` already sets `h1–h4 = "Fraunces"` and `body = "Inter"`. Only two exceptions exist: `span.tenten-impact__value` and `p.tenten-impact__sales-text` (non-heading elements that need Fraunces explicitly).
- **Color tokens are scoped at the top of `.tenten-case-study {}`:** `--text-primary: #fff` (true white) and `--text-secondary: rgba(255,255,255,0.72)`. These override the global glass-theme values for this page only. Do not hardcode hex/rgba colors on individual rules — use the tokens.
- **`p { opacity: 1 }` is reset inside `.tenten-case-study p {}`.** `styles.css` sets a global `p { opacity: 0.9 }` that bleeds in and makes paragraph text look muted. The reset lives at the top of `tenten-case-study.css`.

**Custom showcase (`hsep`):** `page.useTemplate: false`, hand-built [`projects/hsep/index.html`](projects/hsep/index.html). Styles in [`assets/css/hsep-case-study.css`](assets/css/hsep-case-study.css), motion (scroll reveals, counters, chart draw-ins) in [`assets/js/hsep-case-study.js`](assets/js/hsep-case-study.js), images in `projects/hsep/images/` (`hsep-hero.jpg` page hero, `hsep-card.jpg` homepage card at ~2.2:1 so the card crop and badge stay clear, `hsep-thumbnail.jpg` 1200×630 for og/twitter/JSON-LD). No inline `style=` attributes; add modifier classes in the CSS instead. `projects/hsep/case-study-draft.md` is a local working draft (gitignored, not deployed).

### Case study content

- Reference images as `src="images/..."` in `content.html`.
- Legacy classes in content: `.mh-portfolio-modal-inner`, `.mh-portfolio-modal-img` — styled in **`case-study.css`** only.
- Back link: `history.back()` when from homepage (`case-study.js`); else `../../index.html#mh-portfolio`.

### Add a project

1. Entry in `manifest.json` → 2. `projects/{slug}/content.html` + `images/` → 3. `node scripts/build-portfolio.mjs`

### Future: per-project CSS/JS

Add `projects/{slug}/project.css` / `project.js` + wire via manifest + template placeholders (not built yet). Full custom page: `page.useTemplate: false`.

---

## Section notes (non-portfolio)

### `#mh-services` — How I can help
- 2×2-style grid: `.services-showcase` in **`services-showcase.css`**.
- Cards: `.services-showcase__card` + `glass-card`. Mirror this pattern for layout ideas, not shared CSS with portfolio.

### `#mh-skills` / `#mh-experience`
- Large inline sections in `index.html`; styles in **`styles.css`**.
- Experience includes publications, reviewer gallery (`.portfolioContainer` + Fancybox).

### `#mh-photography` / `.beyond-data`

Homepage cross-links before contact (`.beyond-data` in **`styles.css`** + `beyond-data-icons.js`):

| Asset | Role |
|-------|------|
| `assets/lottie/beyond-data/Camera.lottie` | Photography icon (DotLottie) |
| `assets/lottie/beyond-data/pen-writing.lottie` | Blog icon (DotLottie) |
| `assets/images/beyond-data/flask.svg` | Labs icon (inline SVG) |

Use the **`.lottie` sources only** — do not add extracted JSON/PNG archives. Icons are tinted via CSS filters in `styles.css` (`.beyond-data`, `var(--accent-rgb)`).

Full gallery lives on `/photography/` (see below).

**Removed from homepage (pre–`/photography/`):** two legacy subsections before Achievements — **Photography** (Unsplash / 500px / Instagram profile tiles) and **Exhibitions** (Daily Star, Ekushey, 35 Awards). They used `.portfolioContainer .grid-item` + Fancybox — **no dedicated CSS** in `styles.css` (shared legacy gallery block only). That HTML is gone; content and images moved to `/photography/` (`profiles/`, `exhibitions/`, gallery). Do not re-add those homepage grids.

**`styles.css` `.portfolioContainer` block stays** — still used by the Elsevier **reviewer certificate** gallery inside `#mh-experience` (not photography/exhibitions).

### `#mh-achievements` / `#mh-certificates`
- Achievements: list in `index.html`.
- Certificates: marquee `.cert-track`; images in `assets/images/certificates/`.

### `#mh-contact`
- **`contact-section.css`** + **`contact-section.js`** (form, “Say hi!” focus).
- Form typically Formspree/external — check `index.html` form `action`.

### Blog (`blog/`)
- Separate page; paths use `../assets/...`.
- Medium embed: `medium-on-website.js`, `medium-style.css`.

### Photography page (`/photography/`)

```
photography/gallery.json           ← grid slots (file, column, row, alt)
photography/index.html             ← page shell (hero, explore, exhibitions)
photography/layout.html            ← shortcut to layout tool (noindex)
assets/css/photography-page.css      ← layout, masonry, platform + exhibition card grids
assets/js/photography-page.js      ← fetch manifest, render grid, scroll reveal
scripts/photography-gallery-layout/  ← drag-and-drop layout tool (dev only, noindex)
scripts/import-photography-gallery.mjs ← copy uploads into gallery/
scripts/optimize-photography-gallery.mjs ← resize JPEG (1400px q85) + WebP (q82) in gallery/webp/
assets/images/photography/gallery/   ← curated photos (optimized JPEG)
assets/images/photography/gallery/webp/ ← WebP variants (served first via `<picture>`)
assets/images/photography/profiles/  ← platform thumbnails
```

**Add/reorder gallery images:** edit `gallery.json` (`column` + `row` per image) + drop files in `gallery/`. Or open `photography/layout.html` locally, drag to swap, export JSON. After import or new originals, run `node scripts/optimize-photography-gallery.mjs` (requires `cwebp`: `brew install webp`).

### Résumé page (`/resume/`)

```
resume/index.html   ← content (edit this for wording/experience/links)
resume/style.css    ← styling (standalone — not wired into glass-theme/typography.css/Bootstrap)
```

Self-contained on purpose: it must render identically for on-screen viewing and for `Cmd/Ctrl+P → Save as PDF`, so it deliberately doesn't share the site's CSS/JS stack. Fixed light theme (no dark mode) — this becomes a printed PDF and must stay white-background regardless of viewer theme. `.page` is capped at `706px` outer width (2rem padding each side → 642px actual content width) to match A4 minus 20mm margins — screen and print render the same line breaks.

**Download PDF button:** links to a Google Drive direct-download URL (`https://drive.google.com/uc?export=download&id=<FILE_ID>`), not to a file in this repo — Niloy manually re-uploads a new PDF to that same Drive file whenever the résumé changes, replacing its contents in place (link stays constant). If a fresh `<FILE_ID>` is ever given, update it in `resume/index.html`'s toolbar link.

**Regenerate the PDF** (after any content/style change — always verify page count, this must stay 2 pages):

```bash
# from repo root:
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf="$PWD/resume/Niloy_Biswas_Resume.pdf" \
  "file://$PWD/resume/index.html"

# verify page count (macOS mdls can cache stale results — count page objects directly):
python3 -c "
import re
data = open('resume/Niloy_Biswas_Resume.pdf','rb').read()
print('Pages:', len(re.findall(rb'/Type\s*/Page[^s]', data)))
"
```

`--no-pdf-header-footer` and headless print-to-PDF honor the page's own `@page { size: A4; margin: 20mm; }` — no browser dialog, no injected date/title/URL/page-number chrome (that chrome is a `window.print()`-dialog-only artifact and does not appear in headless output). Then upload the resulting PDF to the Drive file above. Do **not** commit the PDF into `resume/` (gitignored).

`/resume/` is included in `sitemap.xml` via `scripts/build-portfolio.mjs` (static URL list). Re-run the build after adding peer static pages.

### Animations
- **`animations.js`** — GSAP: hero entrance, stat counters, skills pills, section-title underlines (loads after GSAP in `index.html`).
- **`custom-scripts.js`** — WOW.js `fadeInUp` on scroll for section cards (services, experience, achievements, etc.).
- **`service-showcase.js`** — Service card SVG chart draw on scroll (GSAP ScrollTrigger).

---

## Do / don't

| Do | Don't |
|----|--------|
| Copy user photos with `scripts/import-photography-gallery.mjs` | **`rm -rf` or delete `photography/` / uploads without explicit user approval** |
| Use DotLottie `.lottie` sources for beyond-data icons | Extract/commit JSON/PNG from lottie archives |
| Put gallery images in `assets/images/photography/gallery/` | Put gallery images in `assets/images/photography/` root |
| Run `optimize-photography-gallery.mjs` after new gallery JPEGs | Commit unoptimized multi-MB originals to `gallery/` |
| Edit `content.html` + manifest; run build | Hand-edit `projects/*/index.html` or grid markers |
| Put project images in `projects/{slug}/images/` | Put case study images in `assets/images/certificates/` |
| Use `case-study.css` for case study layout | Re-add Fancybox popups for portfolio cards |
| Use `glass-card` for interactive cards | Duplicate card hover rules |
| Use `list-dash` for teal dash bullets (experience + TenTen work cards) | Custom `li::before` dot markers |

---

## Commands

```bash
node scripts/build-portfolio.mjs   # grid, project pages, sitemap.xml, llms.txt, photography noscript list
node scripts/indexnow.mjs --dry-run  # after deploy, drop --dry-run to ping IndexNow
node --check scripts/build-portfolio.mjs
node scripts/import-photography-gallery.mjs  # copy from photography/upload/
node scripts/optimize-site-images.mjs  # WebP siblings for homepage/case-study images (IMAGES list; --force to redo)
node scripts/optimize-photography-gallery.mjs  # resize + WebP (run after import)
node --check scripts/optimize-photography-gallery.mjs
# Gallery layout tool (local): photography/layout.html or scripts/photography-gallery-layout/layout.html
```

When unsure about portfolio work: **`projects/manifest.json`** + **`content.html`** + build script.
