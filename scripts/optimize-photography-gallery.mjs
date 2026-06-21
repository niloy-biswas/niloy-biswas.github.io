#!/usr/bin/env node
/**
 * Resize and compress gallery images for production.
 *
 * - WebP: max 1400px, quality 82 → gallery/webp/ (from original before JPEG pass)
 * - JPEG: max 1400px, quality 85 (in place under gallery/)
 *
 * Requires macOS `sips` and `cwebp` (brew install webp).
 * Run after import: node scripts/optimize-photography-gallery.mjs
 */
import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(ROOT, '..');
const GALLERY = path.join(REPO, 'assets', 'images', 'photography', 'gallery');
const WEBP_DIR = path.join(GALLERY, 'webp');

const MAX_DIM = 1400;
const JPEG_QUALITY = 85;
const WEBP_QUALITY = 82;

function commandExists(name) {
  return spawnSync('which', [name], { stdio: 'ignore' }).status === 0;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function webpNameFromJpeg(name) {
  return name.replace(/\.jpe?g$/i, '.webp');
}

function optimizeJpeg(srcPath, destPath) {
  execSync(
    `sips -Z ${MAX_DIM} -s format jpeg -s formatOptions ${JPEG_QUALITY} ${JSON.stringify(srcPath)} --out ${JSON.stringify(destPath)}`,
    { stdio: 'pipe' },
  );
}

function optimizeWebp(srcPath, destPath) {
  execSync(
    `cwebp -q ${WEBP_QUALITY} -resize ${MAX_DIM} 0 ${JSON.stringify(srcPath)} -o ${JSON.stringify(destPath)}`,
    { stdio: 'pipe' },
  );
}

function listGalleryJpgs() {
  return fs
    .readdirSync(GALLERY)
    .filter((name) => /\.jpe?g$/i.test(name))
    .sort();
}

function removeStaleWebp(expectedNames) {
  if (!fs.existsSync(WEBP_DIR)) return;

  for (const name of fs.readdirSync(WEBP_DIR)) {
    if (!name.endsWith('.webp') || expectedNames.has(name)) continue;
    fs.unlinkSync(path.join(WEBP_DIR, name));
    console.log(`Removed stale webp: ${name}`);
  }
}

function main() {
  if (!commandExists('sips')) {
    console.error('Error: sips not found (macOS required).');
    process.exit(1);
  }
  if (!commandExists('cwebp')) {
    console.error('Error: cwebp not found. Install with: brew install webp');
    process.exit(1);
  }

  if (!fs.existsSync(GALLERY)) {
    console.error(`Error: gallery folder missing: ${GALLERY}`);
    process.exit(1);
  }

  fs.mkdirSync(WEBP_DIR, { recursive: true });

  const files = listGalleryJpgs();
  if (!files.length) {
    console.warn('No JPEG files found in gallery/.');
    return;
  }

  removeStaleWebp(new Set(files.map(webpNameFromJpeg)));

  let beforeTotal = 0;
  let afterJpegTotal = 0;
  let afterWebpTotal = 0;

  for (const name of files) {
    const srcPath = path.join(GALLERY, name);
    const webpPath = path.join(WEBP_DIR, webpNameFromJpeg(name));
    const tmpPath = path.join(GALLERY, `.opt-${name}`);

    const before = fs.statSync(srcPath).size;
    beforeTotal += before;

    try {
      optimizeWebp(srcPath, webpPath);
      optimizeJpeg(srcPath, tmpPath);
      fs.renameSync(tmpPath, srcPath);
    } catch (err) {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      throw err;
    }

    const afterJpeg = fs.statSync(srcPath).size;
    const afterWebp = fs.statSync(webpPath).size;
    afterJpegTotal += afterJpeg;
    afterWebpTotal += afterWebp;

    console.log(
      `${name}: ${formatBytes(before)} → jpeg ${formatBytes(afterJpeg)}, webp ${formatBytes(afterWebp)}`,
    );
  }

  console.log(`\nOptimized ${files.length} image(s).`);
  console.log(`JPEG total: ${formatBytes(beforeTotal)} → ${formatBytes(afterJpegTotal)}`);
  console.log(`WebP total: ${formatBytes(afterWebpTotal)} (served first in <picture>)`);
}

main();
