#!/usr/bin/env node
/**
 * Generate resized WebP variants for site images (homepage, case studies, ...).
 *
 * For every entry in IMAGES, writes a WebP next to the original
 * (foo.png -> foo.webp, same folder). HTML serves it via
 * <picture><source type="image/webp"> and keeps the original as the <img>
 * fallback / Fancybox zoom target.
 *
 * Entry options:
 *   src             path relative to the repo root
 *   kind            'graphic' | 'photo' (required, picks the encoder, see below)
 *   maxWidth        longest allowed WebP width in px. Rule: min(originalWidth,
 *                   max(oldMaxWidth, ceil(maxRenderedCssWidth * 2))), rounded up
 *                   to a multiple of 20. The rendered width is the widest <img>
 *                   box measured at 1440, 1920 and 2560 viewports (the layout
 *                   containers are capped, so it does not grow past ~1440).
 *                   Never upscaled past the original.
 *   resizeOriginal  optional. Also shrink the original in place to maxWidth (sips).
 *                   Use only when nobody needs the huge original; git history keeps it.
 *
 * Encoder per kind (sharpness wins over bytes, within reason):
 *   graphic  text and flat-colour art: dashboards, screenshots, maps, charts,
 *            certificates, scans, UI cards, diagrams, logos.
 *            Lossy q90 + -sharp_yuv + -m 6. PNG sources also try -near_lossless 60
 *            and -lossless; the smallest result wins (all are visually lossless
 *            or close to it).
 *   photo    camera photos and the profile cutout: lossy q85 + -m 6.
 *
 * A WebP is only kept when it is smaller than its original file. Otherwise the
 * .webp is deleted, the entry is reported as SKIP, and the page should serve the
 * original (no <picture>/<source>). Remove such an entry from IMAGES once its
 * HTML is fixed.
 *
 * Idempotent: an entry is skipped when its .webp is newer than the source.
 * Pass --force to regenerate everything.
 * SVGs are served as-is and do not belong in IMAGES.
 *
 * Requires macOS `sips` and `cwebp` (brew install webp).
 * Run: node scripts/optimize-site-images.mjs [--force]
 */
import fs from 'fs';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(ROOT, '..');

// Encoder settings per kind. Each variant is a list of cwebp args; the smallest wins.
const ENCODERS = {
  graphic: {
    lossy: ['-q', '90', '-sharp_yuv', '-m', '6'],
    pngOnly: [
      ['-near_lossless', '60', '-m', '6'],
      ['-lossless', '-z', '9', '-m', '6'],
    ],
  },
  photo: {
    lossy: ['-q', '85', '-m', '6'],
    pngOnly: [],
  },
};

const IMAGES = [
  // site: homepage hero (displayed up to 320px wide)
  { src: 'assets/images/site/niloy-profile5-cutout.png', kind: 'photo', maxWidth: 640 },

  // logos: experience timeline (displayed 48-70px)
  { src: 'assets/images/experience/logos/10MS.png', kind: 'graphic', maxWidth: 140 },
  { src: 'assets/images/experience/logos/HDNB-Logo.png', kind: 'graphic', maxWidth: 140 },
  { src: 'assets/images/experience/logos/Sheba.jpg', kind: 'graphic', maxWidth: 100 },
  { src: 'assets/images/experience/logos/DIU.png', kind: 'graphic', maxWidth: 100 },
  // 3.1 MB bootcamp graphic shown inside an expandable panel (~540px wide)
  { src: 'assets/images/experience/logos/DataAnalyticsBootcamp.png', kind: 'graphic', maxWidth: 1080, resizeOriginal: true },

  // education: graduation photos (half-width columns)
  { src: 'assets/images/experience/education/Graduation-Daffodil-1.jpg', kind: 'photo', maxWidth: 960 },
  { src: 'assets/images/experience/education/Graduation-Daffodil-2.jpg', kind: 'photo', maxWidth: 960 },
  { src: 'assets/images/experience/education/Graduation-Daffodil-3.jpg', kind: 'photo', maxWidth: 960 },
  { src: 'assets/images/experience/education/Graduation-Daffodil-4.jpg', kind: 'photo', maxWidth: 960 },

  // 10ms: ceremony and award photos (first one spans the full panel width)
  { src: 'assets/images/experience/10ms/10ms promotion-ceremony-Specialist.jpg', kind: 'photo', maxWidth: 1940 },
  { src: 'assets/images/experience/10ms/10ms promotion-ceremony.jpg', kind: 'photo', maxWidth: 960 },
  { src: 'assets/images/experience/10ms/10ms best performer certificate.jpg', kind: 'graphic', maxWidth: 960 },
  { src: 'assets/images/experience/10ms/10ms promoted.jpg', kind: 'graphic', maxWidth: 960 },
  { src: 'assets/images/experience/10ms/10ms best performer crest.jpg', kind: 'graphic', maxWidth: 960 },

  // reviewer: Elsevier / Hindawi certificate scans (thumbnails; Fancybox zooms the original)
  { src: 'assets/images/reviewer/IPA Reviewer Certificate.jpg', kind: 'graphic', maxWidth: 800 },
  { src: 'assets/images/reviewer/IMU Reviewer Certificate.jpg', kind: 'graphic', maxWidth: 800 },
  { src: 'assets/images/reviewer/Hindawi Reviewer Certificate.jpg', kind: 'graphic', maxWidth: 800 },

  // certificates: marquee cards (240px wide, cropped to 150px tall)
  { src: 'assets/images/certificates/GoogleDataA-Advance.jpg', kind: 'graphic', maxWidth: 640 },
  { src: 'assets/images/certificates/SQL_Advanced1.jpg', kind: 'graphic', maxWidth: 640 },
  { src: 'assets/images/certificates/GoogleDataA.jpg', kind: 'graphic', maxWidth: 640 },
  { src: 'assets/images/certificates/DataVisualizationPython3.jpg', kind: 'graphic', maxWidth: 640 },
  { src: 'assets/images/certificates/imageClassification4.jpg', kind: 'graphic', maxWidth: 640 },
  { src: 'assets/images/certificates/NNVisualizer6.jpg', kind: 'graphic', maxWidth: 640 },
  { src: 'assets/images/certificates/Python5.jpg', kind: 'graphic', maxWidth: 640 },
  { src: 'assets/images/certificates/EthicalHackingSQLi.jpg', kind: 'graphic', maxWidth: 640 },
  { src: 'assets/images/certificates/PythonForML-Udemy.jpg', kind: 'graphic', maxWidth: 640 },

  // projects: homepage portfolio cards (2-column grid, card media ~560px wide, cropped to ~210px tall)
  { src: 'projects/tenten/assets/ui/tenten-card.png', kind: 'graphic', maxWidth: 1060 },
  { src: 'projects/hsep/images/hsep-card.jpg', kind: 'graphic', maxWidth: 1060 },
  { src: 'projects/chicago-taxi/images/CHICAGO-TAXIES.png', kind: 'graphic', maxWidth: 1060 },
  { src: 'projects/heart-disease/images/HD.jpeg', kind: 'photo', maxWidth: 1000 },
  { src: 'projects/bigquery-cost-monitoring/images/BigQuery_CostingHalf.png', kind: 'graphic', maxWidth: 1060 },
  { src: 'projects/population-density-maps/images/Bangladesh_population_density_thumbnail.png', kind: 'graphic', maxWidth: 1000 },
  { src: 'projects/crm-sales/images/CRM_Sales_Thumbnail.png', kind: 'graphic', maxWidth: 1060 },
  { src: 'projects/air-quality/images/AirQuality_Thumbnail.png', kind: 'graphic', maxWidth: 1060 },

  // projects: templated case study pages (content column: col-10 ~880px, col-sm-7 ~600px)
  { src: 'projects/air-quality/images/AirQuality.png', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/bigquery-cost-monitoring/images/BigQuery_Costing.png', kind: 'graphic', maxWidth: 1200 },
  { src: 'projects/chicago-taxi/images/Chicago_Taxi_Trips-1.png', kind: 'graphic', maxWidth: 1200 },
  { src: 'projects/chicago-taxi/images/Chicago_Taxi_Trips-2.png', kind: 'graphic', maxWidth: 1200 },
  { src: 'projects/crm-sales/images/CRM_Sales.png', kind: 'graphic', maxWidth: 1200 },
  { src: 'projects/heart-disease/images/HeartDisease.png', kind: 'graphic', maxWidth: 1200 },
  { src: 'projects/heart-disease/images/paper-fig1-workflow.png', kind: 'graphic', maxWidth: 1450 },
  { src: 'projects/heart-disease/images/paper-fig4-correlation-heatmap.png', kind: 'graphic', maxWidth: 1760 },
  { src: 'projects/linkedin-network/images/Linkedin_Connection_Visualization.png', kind: 'graphic', maxWidth: 1200 },
  { src: 'projects/population-density-maps/images/Bangladesh_population_density.png', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/population-density-maps/images/Dhaka_population_density.png', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/population-density-maps/images/Chittagong_population_density.png', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/population-density-maps/images/India population density Map.jpg', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/population-density-maps/images/Sri_Lanka population density Map.jpg', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/population-density-maps/images/Nepal population density Map.jpg', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/population-density-maps/images/Bhutan population density Map.jpg', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/population-density-maps/images/Myanmar population density Map.jpg', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/us-superstore/images/US_Superstore_1.png', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/us-superstore/images/US_Superstore_2.png', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/us-superstore/images/US_Superstore_3.png', kind: 'graphic', maxWidth: 1680 },
  { src: 'projects/us-superstore/images/US_Superstore_4.png', kind: 'graphic', maxWidth: 1680 },

  // projects: TenTen custom page (mascot shown at 128-200px, timeline max ~460px wide, workflow in a card)
  { src: 'projects/tenten/assets/mascot/tenten.png', kind: 'graphic', maxWidth: 400 },
  { src: 'projects/tenten/assets/ui/timeline.png', kind: 'graphic', maxWidth: 1000 },
  { src: 'projects/tenten/assets/ui/tenten-n8n-workflow.png', kind: 'graphic', maxWidth: 1000 },

  // projects: HSEP custom page (content column ~820px)
  { src: 'projects/hsep/images/hsep-hero.jpg', kind: 'photo', maxWidth: 1700 },
  { src: 'projects/hsep/images/hsep1.jpeg', kind: 'photo', maxWidth: 1700 },
  { src: 'projects/hsep/images/reuters-freeze-headline.png', kind: 'graphic', maxWidth: 1700 },
];

function commandExists(name) {
  return spawnSync('which', [name], { stdio: 'ignore' }).status === 0;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function webpPathFor(srcPath) {
  return srcPath.replace(/\.[^./\\]+$/, '.webp');
}

function pixelSize(filePath) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', filePath], {
    encoding: 'utf8',
  });
  const width = Number(/pixelWidth: (\d+)/.exec(out)?.[1]);
  const height = Number(/pixelHeight: (\d+)/.exec(out)?.[1]);
  return { width, height };
}

function resizeInPlace(srcPath, maxWidth) {
  const tmpPath = path.join(path.dirname(srcPath), `.opt-${path.basename(srcPath)}`);
  try {
    execFileSync('sips', ['--resampleWidth', String(maxWidth), srcPath, '--out', tmpPath], {
      stdio: 'pipe',
    });
    fs.renameSync(tmpPath, srcPath);
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    throw err;
  }
}

// Encode every variant for the entry's kind to temp files, keep the smallest.
function writeWebp(srcPath, destPath, width, { kind, maxWidth }) {
  const encoder = ENCODERS[kind];
  if (!encoder) throw new Error(`Unknown kind "${kind}" for ${srcPath} (use graphic or photo)`);
  const variants = [encoder.lossy];
  if (/\.png$/i.test(srcPath)) variants.push(...encoder.pngOnly);

  let best = null;
  variants.forEach((variantArgs, i) => {
    const tmpPath = `${destPath}.tmp${i}`;
    const args = ['-quiet', ...variantArgs, '-metadata', 'none'];
    if (width > maxWidth) args.push('-resize', String(maxWidth), '0');
    args.push(srcPath, '-o', tmpPath);
    execFileSync('cwebp', args, { stdio: 'pipe' });
    const size = fs.statSync(tmpPath).size;
    if (!best || size < best.size) {
      if (best) fs.unlinkSync(best.tmpPath);
      best = { tmpPath, size, label: variantArgs.filter((a) => a.startsWith('-') && a !== '-m' && a !== '-z' && a !== '-sharp_yuv').join('') };
    } else {
      fs.unlinkSync(tmpPath);
    }
  });
  fs.renameSync(best.tmpPath, destPath);
  return best;
}

function main() {
  const force = process.argv.includes('--force');

  if (!commandExists('sips')) {
    console.error('Error: sips not found (macOS required).');
    process.exit(1);
  }
  if (!commandExists('cwebp')) {
    console.error('Error: cwebp not found. Install with: brew install webp');
    process.exit(1);
  }

  let beforeTotal = 0;
  let afterTotal = 0;
  let converted = 0;
  let skipped = 0;
  const dropped = [];

  for (const { src, kind, maxWidth, resizeOriginal = false } of IMAGES) {
    const srcPath = path.join(REPO, src);
    if (!fs.existsSync(srcPath)) {
      console.error(`Error: source missing: ${src}`);
      process.exit(1);
    }
    const webpPath = webpPathFor(srcPath);
    const webpRel = path.relative(REPO, webpPath);

    if (resizeOriginal) {
      const before = fs.statSync(srcPath).size;
      if (pixelSize(srcPath).width > maxWidth) {
        resizeInPlace(srcPath, maxWidth);
        console.log(
          `${src}: original resized in place ${formatBytes(before)} -> ${formatBytes(fs.statSync(srcPath).size)}`,
        );
      }
    }

    const srcSize = fs.statSync(srcPath).size;
    beforeTotal += srcSize;

    const upToDate =
      fs.existsSync(webpPath) && fs.statSync(webpPath).mtimeMs >= fs.statSync(srcPath).mtimeMs;
    if (upToDate && !force) {
      afterTotal += fs.statSync(webpPath).size;
      skipped += 1;
      continue;
    }

    const { width } = pixelSize(srcPath);
    const { size: webpSize, label } = writeWebp(srcPath, webpPath, width, { kind, maxWidth });

    if (webpSize >= srcSize) {
      fs.unlinkSync(webpPath);
      afterTotal += srcSize;
      dropped.push(src);
      console.log(
        `SKIP ${src}: WebP ${formatBytes(webpSize)} >= original ${formatBytes(srcSize)}; serve the original (no <picture>).`,
      );
      continue;
    }

    afterTotal += webpSize;
    converted += 1;
    const dims = pixelSize(webpPath);
    console.log(
      `${webpRel}: ${formatBytes(srcSize)} -> ${formatBytes(webpSize)} (${dims.width}x${dims.height}, ${kind} ${label})`,
    );
  }

  console.log(`\nConverted ${converted}, skipped ${skipped} up to date (use --force to redo).`);
  if (dropped.length) console.log(`WebP not smaller than the original (serve originals): ${dropped.length}`);
  console.log(`Originals total: ${formatBytes(beforeTotal)} -> WebP total: ${formatBytes(afterTotal)}`);
}

main();
