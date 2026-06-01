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
| How I can help | `#mh-services` | `index.html` | `services-showcase.css` | — |
| Skills | `#mh-skills` | `index.html` | `styles.css` | — |
| Experience | `#mh-experience` | `index.html` | `styles.css` | — |
| **Case studies** | `#mh-portfolio` | **manifest + build** (below) | `styles.css` (grid), `glass-theme.css` (cards), `external-link-icon.css` | `custom-scripts.js` (`initPortfolioFilter`), `external-link-icon.js` |
| Photography | `#mh-photography` | `index.html` | `styles.css` (`.portfolioContainer`) | Fancybox |
| Achievements | `#mh-achievements` | `index.html` | `styles.css` | — |
| Certificates | `#mh-certificates` | `index.html` | `styles.css` (`.cert-marquee`) | — |
| Reviewer certs | inside experience | `index.html` | `.portfolioContainer` | Fancybox `data-fancybox="reviewer"` |
| Contact | `#mh-contact` | `index.html` | `contact-section.css` | `contact-section.js` |
| Blog | `blog/index.html` | `blog/` | `medium-style.css`, `styles.css` | `medium-on-website.js` |
| Case study pages | `/projects/{slug}/` | `projects/{slug}/content.html` | `case-study.css` | `case-study.js` |

**Shared everywhere:** `glass-theme.css` (tokens, `.glass-card`, `.text-gradient-accent`), `typography.css`, `responsive.css`, Bootstrap, jQuery.

---

## Global rules

- **Card hover / glass:** use `.glass-card` from `glass-theme.css` — do not duplicate hover on section-specific selectors.
- **Accent gradient text:** `.text-gradient-accent` (also aliased as `.contact-section__highlight`).
- **Fancybox:** still used for certificates, photography, reviewer gallery — **not** for portfolio case studies.
- **Two gallery patterns — do not mix:**
  - **New portfolio grid:** `.portfolio-showcase` + `.portfolio-showcase__card` (`#mh-portfolio`)
  - **Legacy tiles:** `.portfolioContainer` + `.grid-item` (photography, reviewer, old galleries)
- **Images:** project screenshots → `projects/{slug}/images/`. Certs/achievements → `assets/images/portfolio/` or `assets/images/`.

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

**Current slugs:** `chicago-taxi`, `heart-disease`, `linkedin-network`, `bigquery-cost-monitoring`, `population-density-maps`, `us-superstore`, `crm-sales`, `air-quality`

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

### `#mh-photography`
- External links (Unsplash, 500px, etc.); `.portfolioContainer .grid-item` markup.

### `#mh-achievements` / `#mh-certificates`
- Achievements: list in `index.html`.
- Certificates: marquee `.cert-track`; images in `assets/images/portfolio/`.

### `#mh-contact`
- **`contact-section.css`** + **`contact-section.js`** (form, “Say hi!” focus).
- Form typically Formspree/external — check `index.html` form `action`.

### Blog (`blog/`)
- Separate page; paths use `../assets/...`.
- Medium embed: `medium-on-website.js`, `medium-style.css`.

### Animations
- **`animations.js`** — GSAP scroll/counters on homepage (loads after GSAP in `index.html`).

---

## Do / don't

| Do | Don't |
|----|--------|
| Edit `content.html` + manifest; run build | Hand-edit `projects/*/index.html` or grid markers |
| Put project images in `projects/{slug}/images/` | Put case study images in `assets/images/portfolio/` |
| Use `case-study.css` for case study layout | Re-add Fancybox popups for portfolio cards |
| Use `glass-card` for interactive cards | Duplicate card hover rules |

---

## Commands

```bash
node scripts/build-portfolio.mjs
node --check scripts/build-portfolio.mjs
```

When unsure about portfolio work: **`projects/manifest.json`** + **`content.html`** + build script.
