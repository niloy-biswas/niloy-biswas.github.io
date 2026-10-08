#!/usr/bin/env node
/**
 * Build homepage portfolio grid, project case-study pages, sitemap.xml, llms.txt and llms-full.txt
 * from projects/manifest.json (llms files also use scripts/templates/llms-intro.md).
 * Run: node scripts/build-portfolio.mjs
 */

import fs from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'projects', 'manifest.json');
const INDEX_PATH = path.join(ROOT, 'index.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const TEMPLATE_PATH = path.join(__dirname, 'templates', 'project-page.html');
const NAV_PATH = path.join(__dirname, 'templates', 'nav-snippet.html');
const LLMS_INTRO_PATH = path.join(__dirname, 'templates', 'llms-intro.md');
const LLMS_PATH = path.join(ROOT, 'llms.txt');
const LLMS_FULL_PATH = path.join(ROOT, 'llms-full.txt');

const PHOTOGRAPHY_PATH = path.join(ROOT, 'photography', 'index.html');
const GALLERY_JSON_PATH = path.join(ROOT, 'photography', 'gallery.json');
const GALLERY_IMG_BASE = '/assets/images/photography/gallery';
const GALLERY_START = '<!-- GALLERY_STATIC_START -->';
const GALLERY_END = '<!-- GALLERY_STATIC_END -->';

const GRID_START = '<!-- PORTFOLIO_GRID_START -->';
const GRID_END = '<!-- PORTFOLIO_GRID_END -->';
const SITE_ORIGIN = 'https://niloy.tech';

const ACTION_ICON =
  '<span class="icon-external-link" aria-hidden="true"></span>';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Case study content uses project-local images/; only external asset/ links get rewritten. */
function fixAssetPaths(html) {
  return html.replace(/\b(href|src)="assets\//g, '$1="../../assets/');
}

function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function loadManifest() {
  return readManifest()
    .projects.filter((p) => p.showOnHome !== false)
    .sort((a, b) => a.order - b.order);
}

function renderCard(project) {
  const { slug, category, title, badge, card, links } = project;
  const tags = card.tags
    .map(
      (t) =>
        `                                            <span class="portfolio-showcase__tag">${escapeHtml(t)}</span>`
    )
    .join('\n');

  return `                            <article
                                class="portfolio-showcase__card glass-card"
                                data-category="${escapeHtml(category)}" role="listitem">
                                <a class="portfolio-showcase__link"
                                    href="${escapeHtml(links.caseStudy)}">
                                    <div class="portfolio-showcase__media">
                                        <span class="portfolio-showcase__badge portfolio-showcase__badge--${escapeHtml(badge.variant)}">${escapeHtml(badge.label)}</span>
                                        <img src="${escapeHtml(card.thumbnail)}"
                                            alt="${escapeHtml(card.thumbnailAlt)}" loading="lazy">
                                        <div class="portfolio-showcase__media-overlay" aria-hidden="true"></div>
                                    </div>
                                    <div class="portfolio-showcase__body">
                                        <div class="portfolio-showcase__tags">
${tags}
                                        </div>
                                        <h3>${escapeHtml(title)}</h3>
                                        <p>${escapeHtml(card.summary)}</p>
                                    </div>
                                    <div class="portfolio-showcase__footer">
                                        <span class="portfolio-showcase__action">${escapeHtml(links.footerAction)}
                                            ${ACTION_ICON}
                                        </span>
                                        <span class="portfolio-showcase__meta">${escapeHtml(links.footerMeta)}</span>
                                    </div>
                                </a>
                            </article>`;
}

function buildGrid(projects) {
  const cards = projects.map(renderCard).join('\n\n');
  const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
  const startIdx = indexHtml.indexOf(GRID_START);
  const endIdx = indexHtml.indexOf(GRID_END);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(
      `Missing ${GRID_START} or ${GRID_END} in index.html — add markers inside .portfolio-showcase`
    );
  }

  const before = indexHtml.slice(0, startIdx + GRID_START.length);
  const after = indexHtml.slice(endIdx);
  const built = `${before}\n${cards}\n                        ${after}`;
  fs.writeFileSync(INDEX_PATH, built);
  console.log(`Updated portfolio grid (${projects.length} cards) in index.html`);
}

/**
 * Crawlable fallback for the JS-rendered photography grid: a <noscript> list of
 * gallery images (ignored when scripts run) between the GALLERY_STATIC markers.
 */
function buildGalleryStatic() {
  const { images } = JSON.parse(fs.readFileSync(GALLERY_JSON_PATH, 'utf8'));
  const html = fs.readFileSync(PHOTOGRAPHY_PATH, 'utf8');
  const startIdx = html.indexOf(GALLERY_START);
  const endIdx = html.indexOf(GALLERY_END);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(
      `Missing ${GALLERY_START} or ${GALLERY_END} in photography/index.html`
    );
  }

  const items = images
    .map(
      (img) =>
        `\t\t\t\t\t\t\t<li><img src="${GALLERY_IMG_BASE}/${escapeHtml(img.file)}" alt="${escapeHtml(img.alt || '')}" loading="lazy"></li>`
    )
    .join('\n');
  const block = `<noscript>\n\t\t\t\t\t\t<ul>\n${items}\n\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t</noscript>`;

  const before = html.slice(0, startIdx + GALLERY_START.length);
  const after = html.slice(endIdx);
  fs.writeFileSync(PHOTOGRAPHY_PATH, `${before}\n\t\t\t\t\t\t${block}\n\t\t\t\t\t\t${after}`);
  console.log(`Updated photography gallery noscript (${images.length} images)`);
}

function buildProjectPage(project, navHtml, pageTemplate) {
  const contentPath = path.join(ROOT, 'projects', project.slug, 'content.html');
  if (!fs.existsSync(contentPath)) {
    console.warn(`Skip page (no content.html): ${project.slug}`);
    return;
  }

  let content = fs.readFileSync(contentPath, 'utf8');
  content = fixAssetPaths(content);

  const canonical = `${SITE_ORIGIN}${project.links.caseStudy}`;
  const thumb = project.card.thumbnail.replace(/^\//, '');
  const ogImage = `${SITE_ORIGIN}/${thumb}`;

  const generatedBanner =
    '<!-- Generated by scripts/build-portfolio.mjs — edit content.html / manifest.json, then re-run build. -->\n';

  const ogImageAlt = `${project.title} — case study by Niloy Biswas`;

  let html = pageTemplate
    .replace(/\{\{TITLE\}\}/g, escapeHtml(project.page.title))
    .replace(/\{\{DESCRIPTION\}\}/g, escapeHtml(project.page.description))
    .replace(/\{\{CANONICAL\}\}/g, canonical)
    .replace(/\{\{OG_IMAGE\}\}/g, ogImage)
    .replace(/\{\{OG_IMAGE_ALT\}\}/g, escapeHtml(ogImageAlt))
    .replace(/\{\{NAV\}\}/g, navHtml)
    .replace(/\{\{CONTENT\}\}/g, content);

  const outPath = path.join(ROOT, 'projects', project.slug, 'index.html');
  fs.writeFileSync(outPath, generatedBanner + html);
  console.log(`Built ${outPath}`);
}

/** Latest git commit date (YYYY-MM-DD) across the given repo-relative paths; today if none are committed. */
function gitLastmod(paths) {
  const dates = paths
    .map((p) => {
      try {
        return execFileSync('git', ['log', '-1', '--format=%cs', '--', p], {
          cwd: ROOT,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
      } catch {
        return '';
      }
    })
    .filter(Boolean);
  return dates.length ? dates.sort().at(-1) : new Date().toISOString().slice(0, 10);
}

function buildSitemap(projects) {
  const urls = [
    { loc: `${SITE_ORIGIN}/`, changefreq: 'weekly', priority: '1.0', src: ['index.html'] },
    { loc: `${SITE_ORIGIN}/blog/`, changefreq: 'weekly', priority: '0.8', src: ['blog/index.html'] },
    {
      loc: `${SITE_ORIGIN}/photography/`,
      changefreq: 'monthly',
      priority: '0.7',
      src: ['photography/index.html', 'photography/gallery.json'],
    },
    { loc: `${SITE_ORIGIN}/resume/`, changefreq: 'monthly', priority: '0.6', src: ['resume/index.html'] },
    ...projects
      .filter((p) => p.links?.caseStudy && p.showOnHome !== false)
      .map((p) => {
        const custom = p.page?.useTemplate === false;
        return {
          loc: `${SITE_ORIGIN}${p.links.caseStudy}`,
          changefreq: 'monthly',
          priority: custom ? '0.8' : '0.7',
          src: [`projects/${p.slug}/${custom ? 'index.html' : 'content.html'}`],
        };
      }),
  ];

  const entries = urls
    .map(
      (u) => `   <url>
      <loc>${u.loc}</loc>
      <lastmod>${gitLastmod(u.src)}</lastmod>
      <changefreq>${u.changefreq}</changefreq>
      <priority>${u.priority}</priority>
   </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries}
</urlset>
`;

  fs.writeFileSync(SITEMAP_PATH, xml);
  console.log(`Updated sitemap.xml (${urls.length} URLs)`);
}

/** Plain text for LLM files: no em dashes. */
function plainText(str) {
  return str.replace(/\s*—\s*/g, ' - ');
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rarr: '->', larr: '<-',
  rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', middot: '\u00b7', hellip: '...', ndash: '-', mdash: ' - ', copy: '(c)', times: 'x',
};

function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

/** Strip scripts, styles, comments and tags; keep block-level line breaks; collapse whitespace. */
function htmlToText(html) {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|svg|object|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|section|article|li|ul|ol|h[1-6]|tr|header|footer|figure|figcaption|blockquote)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

/** Body HTML for a case study: content.html for templated pages, <main> for hand-built pages. */
function caseStudyBodyHtml(project) {
  const dir = path.join(ROOT, 'projects', project.slug);
  if (project.page?.useTemplate === false) {
    const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    return html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? '';
  }
  return fs.readFileSync(path.join(dir, 'content.html'), 'utf8');
}

function buildLlms(projects) {
  const listed = projects
    .filter((p) => p.links?.caseStudy && p.showOnHome !== false)
    .sort((a, b) => a.order - b.order);
  const intro = fs.readFileSync(LLMS_INTRO_PATH, 'utf8').trimEnd();
  if (!intro.includes('{{CASE_STUDIES}}')) {
    throw new Error('llms-intro.md is missing the {{CASE_STUDIES}} marker');
  }

  const bullets = listed
    .map(
      (p) =>
        `- [${plainText(p.title)}](${SITE_ORIGIN}${p.links.caseStudy}): ${plainText(p.page.description)}`
    )
    .join('\n');
  fs.writeFileSync(LLMS_PATH, `${intro.replace('{{CASE_STUDIES}}', bullets)}\n`);
  console.log(`Updated llms.txt (${listed.length} case studies)`);

  const sections = listed.map((p) => {
    const body = plainText(htmlToText(caseStudyBodyHtml(p)));
    return `## ${plainText(p.title)}\n\nURL: ${SITE_ORIGIN}${p.links.caseStudy}\n\n${body}`;
  });
  const fullIntro = intro.replace('{{CASE_STUDIES}}', 'Full text of each case study follows below.');
  fs.writeFileSync(LLMS_FULL_PATH, `${fullIntro}\n\n---\n\n${sections.join('\n\n---\n\n')}\n`);
  console.log(`Updated llms-full.txt (${listed.length} case studies)`);
}

function main() {
  const manifest = readManifest();
  const pageTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const navHtml = fs.readFileSync(NAV_PATH, 'utf8');

  buildGrid(loadManifest());
  buildSitemap(manifest.projects);
  buildLlms(manifest.projects);
  buildGalleryStatic();

  for (const project of manifest.projects) {
    if (project.page?.useTemplate === false) {
      console.log(`Skip page (useTemplate: false): ${project.slug}`);
      continue;
    }
    buildProjectPage(project, navHtml, pageTemplate);
  }

  console.log('Done.');
}

main();
