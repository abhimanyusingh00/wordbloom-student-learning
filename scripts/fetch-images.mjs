// Build-time image pipeline.
//
// For every word we take the lead image of its English Wikipedia article and
// record its URL plus the Commons licence and author, so the site can credit
// every photograph.
//
// Images are served straight from Wikimedia's CDN by default. Mirroring
// thousands of files locally costs hours against Wikimedia's rate limits and
// ~100 MB in the repository, for a picture set that their CDN already serves
// well. `--mirror` copies them into public/words/ anyway, and any word already
// mirrored keeps pointing at the local copy — so the common words can be fast
// and offline while the long tail streams.
//
//   node scripts/fetch-images.mjs           resolve + write app/data/words.json
//   node scripts/fetch-images.mjs --mirror  also download into public/words/
//   node scripts/fetch-images.mjs --dry     resolve only, report gaps

import { mkdir, writeFile, readFile, stat, readdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { vocabulary as curated } from './vocabulary.mjs';
import { harvested } from './vocabulary.harvested.mjs';

// vocabulary.extra.mjs (a broad Wiktionary sweep) is deliberately not used: it
// dragged in taxonomy jargon like "anapsid" and "cladodont", which has no place
// in a picture dictionary for children.
//
// Later sources overwrite earlier ones, so hand-curated entries win: they exist
// precisely because an automatic rule picked a poor image for that word.
const byWord = new Map(harvested.map((e) => [e.word, e]));
for (const entry of curated) byWord.set(entry.word, entry);
const vocabulary = [...byWord.values()].sort(
  (a, b) => a.category.localeCompare(b.category) || a.word.localeCompare(b.word),
);

const DRY = process.argv.includes('--dry');
const MIRROR = process.argv.includes('--mirror');
const UA = 'WordBloom/2.0 (student learning site; educational use)';
const THUMB = 640;
const OUT_DIR = path.join(process.cwd(), 'public', 'words');
// Written into public/, not app/: at nearly four thousand words this data is
// far too big to bundle — importing it blew past the Cloudflare Workers script
// limit — so the browser fetches it once as a static asset instead.
const DATA_FILE = path.join(process.cwd(), 'public', 'data', 'words.json');
const CREDITS_FILE = path.join(process.cwd(), 'public', 'data', 'credits.json');
const CACHE_FILE = path.join(process.cwd(), '.cache', 'wikimedia.json');

// Wikimedia rate-limits anonymous callers hard, so every lookup is cached on
// disk and re-runs of this script cost nothing.
const cache = await readFile(CACHE_FILE, 'utf8')
  .then((raw) => JSON.parse(raw))
  .catch(() => ({ lead: {}, credit: {} }));

async function saveCache() {
  await mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const slug = (word) => word.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

// Wikipedia reports file names with underscores; Commons page titles use
// spaces. Normalise both so the credit lookup actually finds its file.
const fileKey = (name) => name.replace(/_/g, ' ');

// Wikipedia appends ~90 characters of analytics parameters to every thumbnail
// URL. With thousands of words that is hundreds of KB of dead weight in the
// data file, and the CDN serves the bare URL identically.
const cleanUrl = (url) => url.split('?')[0];

async function api(base, params) {
  const url = new URL(base);
  Object.entries({ format: 'json', formatversion: '2', origin: '*', ...params }).forEach(([k, v]) =>
    url.searchParams.set(k, v),
  );
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (attempt >= 5 || (res.status !== 429 && res.status < 500)) {
      throw new Error(`${res.status} ${res.statusText} for ${url}`);
    }
    const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * 2 ** attempt;
    process.stdout.write(`[${res.status}, retrying in ${Math.round(wait / 1000)}s]`);
    await sleep(wait);
  }
}

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

/** Wikipedia lead image (thumbnail URL + Commons file name) for a batch of articles. */
async function leadImages(titles) {
  const data = await api('https://en.wikipedia.org/w/api.php', {
    action: 'query',
    prop: 'pageimages',
    piprop: 'thumbnail|name',
    pithumbsize: String(THUMB),
    redirects: '1',
    titles: titles.join('|'),
  });
  const found = new Map();
  // `normalized` and `redirects` let us map the title we asked for back to the
  // page we actually landed on (e.g. Grape -> Grape, Grass -> Poaceae).
  const alias = new Map();
  for (const n of data.query?.normalized ?? []) alias.set(n.to, n.from);
  for (const r of data.query?.redirects ?? []) alias.set(r.to, alias.get(r.from) ?? r.from);
  for (const page of data.query?.pages ?? []) {
    const asked = alias.get(page.title) ?? page.title;
    if (page.thumbnail?.source) {
      found.set(asked, { thumb: page.thumbnail.source, file: page.pageimage, article: page.title });
    }
  }
  return found;
}

/** Author + licence for a batch of Commons file names. */
async function credits(fileNames) {
  const data = await api('https://commons.wikimedia.org/w/api.php', {
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'extmetadata|url',
    iiurlwidth: String(THUMB),
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|AttributionRequired',
    titles: fileNames.map((f) => `File:${f}`).join('|'),
  });
  const out = new Map();
  for (const page of data.query?.pages ?? []) {
    const meta = page.imageinfo?.[0]?.extmetadata ?? {};
    const strip = (html) =>
      html ? html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120) : '';
    out.set(fileKey(page.title.replace(/^File:/, '')), {
      thumb: page.imageinfo?.[0]?.thumburl ?? page.imageinfo?.[0]?.url ?? '',
      author: strip(meta.Artist?.value) || 'Unknown author',
      license: strip(meta.LicenseShortName?.value) || 'See Wikimedia Commons',
      licenseUrl: meta.LicenseUrl?.value ?? '',
      page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    });
  }
  return out;
}

async function download(url, dest) {
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      await pipeline(res.body, createWriteStream(dest));
      return;
    }
    if (attempt >= 5 || (res.status !== 429 && res.status < 500)) {
      throw new Error(`${res.status} downloading ${url}`);
    }
    const wait = Number(res.headers.get('retry-after')) * 1000 || 3000 * 2 ** attempt;
    process.stdout.write(`[${res.status}, retrying in ${Math.round(wait / 1000)}s]`);
    await sleep(wait);
  }
}

const article = (entry) => entry.article ?? (/^[aeiou]/i.test(entry.word) ? 'an' : 'a');

function sentence(entry) {
  if (entry.category === 'Colors') return `This color is ${entry.word}.`;
  if (entry.category === 'Body') return `This is my ${entry.word}.`;
  if (entry.plural) return `These are ${entry.word}.`;
  // Uncountable nouns take no article: "This is bread.", not "a bread".
  if (entry.mass) return `This is ${entry.word}.`;
  return `This is ${article(entry)} ${entry.word}.`;
}

async function main() {
  // ---- 1. resolve each article's lead image (or an explicit Commons override)
  const pending = vocabulary.filter((e) => e.wiki && !e.commons && !e.direct && !cache.lead[e.wiki]);
  for (const batch of chunk(pending, 20)) {
    const found = await leadImages(batch.map((e) => e.wiki));
    for (const entry of batch) cache.lead[entry.wiki] = found.get(entry.wiki) ?? null;
    await saveCache();
    process.stdout.write('.');
    await sleep(700);
  }

  const resolved = new Map();
  for (const entry of vocabulary) {
    if (entry.direct) {
      resolved.set(entry.word, { direct: entry.direct });
    } else if (entry.commons) {
      resolved.set(entry.word, { file: entry.commons, article: entry.wiki, override: true });
    } else if (cache.lead[entry.wiki]) {
      resolved.set(entry.word, cache.lead[entry.wiki]);
    }
  }

  const missing = vocabulary.filter((e) => !resolved.has(e.word));
  if (missing.length) {
    console.log(`\nNo lead image for ${missing.length} word(s):`);
    missing.forEach((e) => console.log(`  ${e.word.padEnd(14)} -> ${e.wiki}`));
  }

  // ---- 2. author + licence for every file, plus a thumbnail URL for overrides
  const files = [...new Set([...resolved.values()].map((v) => v.file).filter(Boolean))];
  for (const batch of chunk(files.filter((f) => !cache.credit[fileKey(f)]), 20)) {
    for (const [k, v] of await credits(batch)) cache.credit[k] = v;
    await saveCache();
    process.stdout.write('+');
    await sleep(700);
  }
  process.stdout.write('\n');

  if (DRY) {
    for (const entry of vocabulary) {
      const hit = resolved.get(entry.word);
      console.log(`${entry.word.padEnd(14)} ${hit ? hit.file : '*** MISSING ***'}`);
    }
    return;
  }

  // ---- 3. plan every file, then fetch the missing ones in parallel
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(DATA_FILE), { recursive: true });

  const words = [];
  // Credits live in their own file: only the credits page needs them, so a
  // megabyte of author names never has to load with the lessons.
  const creditsById = {};
  const jobs = [];
  for (const entry of vocabulary) {
    const hit = resolved.get(entry.word);
    if (!hit) continue;
    const credit = hit.direct ?? cache.credit[fileKey(hit.file ?? '')] ?? {};
    const source = hit.direct?.url ?? hit.thumb ?? credit.thumb;
    if (!source) {
      console.warn(`\nNo thumbnail URL for ${entry.word}`);
      continue;
    }
    const ext = (source.match(/\.(jpe?g|png|gif|webp)(?:\?|$)/i)?.[1] ?? 'jpg').toLowerCase();
    const file = `${slug(entry.word)}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const wordEntry = {
      id: slug(entry.word),
      word: entry.word,
      category: entry.category,
      // Everything but the Wiktionary long tail counts as everyday vocabulary.
      common: entry.common !== false,
      sentence: sentence(entry),
      // Filled in below: a local path when the file is mirrored, else the CDN.
      image: cleanUrl(source),
      file,
    };
    words.push(wordEntry);
    // The job carries the word it belongs to, so renaming the mirrored file
    // updates both views of it rather than letting them drift apart.
    jobs.push({ source, dest: path.join(OUT_DIR, file), file, word: wordEntry });
    creditsById[slug(entry.word)] = {
      author: credit.author ?? 'Unknown author',
      license: credit.license ?? 'See Wikimedia Commons',
      licenseUrl: credit.licenseUrl ?? '',
      source:
        credit.source ??
        credit.page ??
        `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.article ?? entry.wiki)}`,
    };
  }

  // optimize-images re-encodes everything to .jpg, so a word mirrored as
  // tongs.png is on disk as tongs.jpg by the time this runs again. Matching on
  // the slug rather than the source extension keeps the pipeline idempotent —
  // otherwise a second pass re-downloads those files and, when Wikimedia
  // answers 429, silently falls back to hotlinking them.
  const onDisk = new Map();
  for (const name of await readdir(OUT_DIR).catch(() => [])) {
    onDisk.set(name.replace(/\.[^.]+$/, ''), name);
  }

  const mirrored = new Set();
  const todo = [];
  for (const job of jobs) {
    const existing = onDisk.get(job.file.replace(/\.[^.]+$/, ''));
    const dest = existing ? path.join(OUT_DIR, existing) : job.dest;
    const have = await stat(dest).then((st) => st.size > 0).catch(() => false);
    if (have) {
      if (existing) {
        job.file = existing;
        job.word.file = existing;
      }
      mirrored.add(job.file);
    } else {
      todo.push(job);
    }
  }
  console.log(`${jobs.length} images, ${mirrored.size} already mirrored locally`);

  if (MIRROR && todo.length) {
    console.log(`Mirroring ${todo.length} more...`);
    let next = 0;
    let done = 0;
    const failed = [];
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        while (next < todo.length) {
          const job = todo[next];
          next += 1;
          try {
            await download(job.source, job.dest);
            mirrored.add(job.file);
          } catch (err) {
            failed.push(`${job.file}: ${err.message}`);
          }
          done += 1;
          if (done % 25 === 0) process.stdout.write(`${done} `);
        }
      }),
    );
    process.stdout.write('\n');
    if (failed.length) {
      console.warn(`${failed.length} downloads failed:\n  ${failed.slice(0, 8).join('\n  ')}`);
    }
  }

  // Prefer a local copy where one exists; otherwise point at Wikimedia's CDN.
  for (const word of words) {
    word.image = mirrored.has(word.file) ? `/words/${word.file}` : word.image;
    delete word.file;
  }

  await writeFile(DATA_FILE, `${JSON.stringify(words)}\n`);
  await writeFile(CREDITS_FILE, `${JSON.stringify(creditsById)}\n`);
  const mirroredCount = words.filter((w) => w.image.startsWith('/words/')).length;
  console.log(
    `Wrote ${words.length} words (${mirroredCount} mirrored locally, ` +
      `${words.length - mirroredCount} served from Wikimedia)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
