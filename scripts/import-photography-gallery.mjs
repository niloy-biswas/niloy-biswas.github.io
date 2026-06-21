#!/usr/bin/env node
/**
 * Copy source photos into assets/images/photography/gallery/
 * COPY ONLY — never deletes photography/upload/ or staging files.
 *
 * Drop originals in photography/upload/ or photography/
 * Run: node scripts/import-photography-gallery.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(ROOT, '..');
const UPLOAD = path.join(REPO, 'photography', 'upload');
const STAGING = path.join(REPO, 'photography');
const GALLERY = path.join(REPO, 'assets', 'images', 'photography', 'gallery');
const MANIFEST = path.join(REPO, 'photography', 'gallery.json');

/** source filename → destination basename in gallery/ */
const IMPORT_MAP = {
  'IMG_0942.JPG': 'light-trails-interchange.jpg',
  'IMG_0858.JPG': 'star-trails-silhouette.jpg',
  'IMG_0912.JPG': 'fireflies-tree.jpg',
  'IMG_1046.JPG': 'bridge-aerial-green.jpg',
  'IMG_1185.JPG': 'rural-path-aerial.jpg',
  'IMG_20240828_164129.JPG': 'lake-golden-hour.jpg',
  'IMG_0773.JPG': 'moon-bamboo-mist-valley.jpg',
  'IMG_1206.JPG': 'sitting-on-river-rocks.jpg',
  'IMG_1135.JPG': 'city-lake-sunset-rays.jpg',
  'IMG_1174.JPG': 'river-boat-reflection.jpg',
  'IMG_1009.JPG': 'abstract-aerial-shore.jpg',
  'IMG_1150.JPG': 'abstract-rainbow-sky.jpg',
  'IMG_0799.JPG': 'abstract-macro-seeds.jpg',
};

function resolveSource(name) {
  const candidates = [path.join(UPLOAD, name), path.join(STAGING, name)];
  return candidates.find((p) => fs.existsSync(p));
}

function main() {
  if (!fs.existsSync(UPLOAD)) fs.mkdirSync(UPLOAD, { recursive: true });
  if (!fs.existsSync(GALLERY)) fs.mkdirSync(GALLERY, { recursive: true });

  let copied = 0;
  const notFound = [];

  for (const [srcName, destName] of Object.entries(IMPORT_MAP)) {
    const src = resolveSource(srcName);
    const dest = path.join(GALLERY, destName);
    if (!src) {
      notFound.push(srcName);
      console.warn(`Skip (missing): ${srcName}`);
      continue;
    }
    fs.copyFileSync(src, dest);
    console.log(`Copied ${path.relative(REPO, src)} → gallery/${destName}`);
    copied += 1;
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const expected = manifest.images.map((i) => i.file);
  const missing = expected.filter((f) => !fs.existsSync(path.join(GALLERY, f)));

  if (missing.length) {
    console.warn(`\nGallery still missing ${missing.length} file(s):`);
    missing.forEach((f) => console.warn(`  - ${f}`));
  } else {
    console.log(`\nAll ${expected.length} gallery images present.`);
  }

  if (notFound.length) {
    console.warn('\nMissing sources (check photography/upload/):');
    notFound.forEach((f) => console.warn(`  ${f}`));
  }

  console.log(`\nImported ${copied} file(s) this run. Upload folder left untouched.`);
}

main();
