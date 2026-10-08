#!/usr/bin/env node
/**
 * Submit changed URLs from sitemap.xml to IndexNow (Bing, Yandex, and other participating engines).
 *
 * Usage:
 *   node scripts/indexnow.mjs              # submit URLs whose sitemap <lastmod> is today
 *   node scripts/indexnow.mjs --all        # submit every URL in the sitemap
 *   node scripts/indexnow.mjs --dry-run    # print the payload, do not POST (combine with --all)
 *
 * The key is read from the single 32-hex `<key>.txt` file at the repo root. That file must be
 * deployed at https://niloy.tech/<key>.txt before a real submission, or IndexNow rejects it.
 * Run after the site is deployed (and after `node scripts/build-portfolio.mjs` refreshes lastmod).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const HOST = 'niloy.tech';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const args = new Set(process.argv.slice(2));
const submitAll = args.has('--all');
const dryRun = args.has('--dry-run');

function findKeyFile() {
  const matches = fs.readdirSync(ROOT).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one <32-hex>.txt key file at repo root, found ${matches.length}`);
  }
  const key = fs.readFileSync(path.join(ROOT, matches[0]), 'utf8').trim();
  if (key !== matches[0].replace(/\.txt$/, '')) {
    throw new Error(`Key file ${matches[0]} content does not match its filename`);
  }
  return key;
}

function readSitemapEntries() {
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: block.match(/<loc>(.*?)<\/loc>/)?.[1],
    lastmod: block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
  }));
}

async function main() {
  const key = findKeyFile();
  const today = new Date().toISOString().slice(0, 10);
  const urlList = readSitemapEntries()
    .filter((e) => e.loc && (submitAll || e.lastmod === today))
    .map((e) => e.loc);

  if (!urlList.length) {
    console.log(`No URLs with lastmod ${today}. Use --all to submit everything.`);
    return;
  }

  const payload = { host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList };
  console.log(`${dryRun ? 'Dry run: would submit' : 'Submitting'} ${urlList.length} URL(s):`);
  urlList.forEach((u) => console.log(`  ${u}`));
  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  console.log(`IndexNow responded: ${res.status} ${res.statusText}`);
  if (!res.ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
