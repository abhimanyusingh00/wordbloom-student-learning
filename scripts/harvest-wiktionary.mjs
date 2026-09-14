// Second-stage vocabulary growth.
//
// Wiktionary's topical categories are flat lists of actual English words (not
// species pages), which makes them a far better candidate source than
// Wikipedia's category tree. Every candidate still has to clear the same bar as
// before — a real dictionary word, a safe topic, and an English Wikipedia
// article of exactly that name carrying a lead image — so the picture always
// shows the word.
//
// Words found this way are marked `common: false`: they are real vocabulary,
// but rarer than the hand-curated core, so lessons and games can prefer the
// core while the dictionary still lists everything.
//
//   node scripts/harvest-wiktionary.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { vocabulary as curated } from './vocabulary.mjs';
import { harvested as verified } from './vocabulary.harvested.mjs';

const UA = 'WordBloom/2.0 (student learning site; educational use)';
const OUT = path.join(process.cwd(), 'scripts', 'vocabulary.extra.mjs');
const CACHE = path.join(process.cwd(), '.cache', 'wiktionary.json');
const TARGET = 300;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const titleCase = (word) => word.charAt(0).toUpperCase() + word.slice(1);

// Only categories of concrete, picturable *things*.
//
// Broad topical categories look tempting and are a trap: Wiktionary's en:Music
// contains "accentor" (a bird) and "accident", because it covers music theory
// and homographs too. The photograph would still match the word — but filing a
// bird under Music is useless to a child, so the source list stays narrow.
const SOURCES = {
  Food: ['en:Fruits', 'en:Vegetables', 'en:Breads', 'en:Desserts', 'en:Cheeses',
         'en:Herbs', 'en:Spices', 'en:Nuts', 'en:Berries', 'en:Mushrooms',
         'en:Seafood', 'en:Sauces', 'en:Sweets', 'en:Grains', 'en:Pasta', 'en:Cakes',
         'en:Foods'],
  Animals: ['en:Birds', 'en:Mammals', 'en:Fish', 'en:Insects', 'en:Reptiles', 'en:Amphibians',
            'en:Arachnids', 'en:Crustaceans', 'en:Molluscs', 'en:Rodents',
            'en:Primates', 'en:Butterflies', 'en:Beetles', 'en:Dogs', 'en:Cats', 'en:Snakes'],
  Clothes: ['en:Clothing', 'en:Footwear', 'en:Headwear', 'en:Jewelry', 'en:Fabrics'],
  Home: ['en:Furniture', 'en:Tools', 'en:Kitchenware', 'en:Containers', 'en:Cookware',
         'en:Cutlery', 'en:Appliances', 'en:Bedding', 'en:Lighting'],
  School: ['en:Writing instruments', 'en:Stationery', 'en:Books'],
  Toys: ['en:Toys', 'en:Board games'],
  Places: ['en:Buildings', 'en:Rooms', 'en:Shops'],
  Vehicles: ['en:Vehicles', 'en:Aircraft', 'en:Watercraft', 'en:Boats', 'en:Automobiles'],
  Nature: ['en:Trees', 'en:Flowers', 'en:Landforms', 'en:Bodies of water', 'en:Fungi',
           'en:Rocks', 'en:Minerals', 'en:Gemstones', 'en:Grasses'],
  Weather: ['en:Clouds', 'en:Precipitation', 'en:Winds'],
  Sport: ['en:Sports', 'en:Ball games', 'en:Sports equipment', 'en:Martial arts'],
  Music: ['en:Musical instruments'],
  Jobs: ['en:Occupations'],
  Body: ['en:Body parts'],
  Shapes: ['en:Shapes', 'en:Polygons', 'en:Polyhedra'],
  Colors: ['en:Colors', 'en:Shades of red', 'en:Shades of blue', 'en:Shades of green'],
};

const UNSAFE = new RegExp(
  String.raw`\b(` +
    ['weapon','weapons','gun','guns','rifle','pistol','firearm','ammunition','bomb','grenade',
     'missile','torpedo','dagger','sword','war','warfare','army','military','combat','soldier',
     'execution','torture','corpse','autopsy','wound','injury','disease','cancer','tumor',
     'tumour','infection','ulcer','abscess','lesion','surgery','surgical','genital','genitalia',
     'penis','vagina','nipple','buttock','anus','nude','nudity','sex','sexual','erotic','fetish',
     'porn','drug','drugs','narcotic','cocaine','heroin','cannabis','opium','tobacco','cigarette',
     'cigar','alcohol','alcoholic','beer','wine','whisky','whiskey','vodka','rum','gin','liquor',
     'brandy','cocktail','gambling','casino','blood','death','dead','kill','murder','suicide',
     'poison','venom','toxic','parasite','excrement','faeces','feces','urine','vomit','slaughter',
     'butchery','hunting','prison','slavery','racism','slur','curse','vulgar','offensive',
    ].join('|') + String.raw`)\b`,
  'i',
);

async function api(host, params) {
  const url = new URL(`https://${host}/w/api.php`);
  Object.entries({ format: 'json', formatversion: '2', origin: '*', ...params }).forEach(([k, v]) =>
    url.searchParams.set(k, v),
  );
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (attempt >= 6 || (res.status !== 429 && res.status < 500)) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const wait = Number(res.headers.get('retry-after')) * 1000 || 1500 * 2 ** attempt;
    process.stdout.write(`[${res.status}]`);
    await sleep(wait);
  }
}

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

async function wiktionaryWords(category) {
  const words = [];
  let cont;
  do {
    const data = await api('en.wiktionary.org', {
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${category}`,
      cmnamespace: '0',
      cmlimit: '500',
      ...(cont ? { cmcontinue: cont } : {}),
    });
    words.push(...(data.query?.categorymembers ?? []).map((m) => m.title));
    cont = data.continue?.cmcontinue;
    await sleep(200);
  } while (cont && words.length < 2000);
  return words;
}

let dictionary = new Set();

function acceptable(word) {
  if (/[^a-z-]/.test(word)) return false; // single words only, see below
  if (UNSAFE.test(word)) return false;
  if (word.length < 3 || word.length > 16) return false;
  // Multi-word entries in these lists are overwhelmingly technical phrases
  // ("absolute humidity", "active front") rather than things a child can see.
  return word.split('-').every((part) => dictionary.has(part));
}

async function main() {
  dictionary = new Set(
    (await readFile('/usr/share/dict/words', 'utf8')).split('\n').map((w) => w.toLowerCase()),
  );
  const cache = await readFile(CACHE, 'utf8').then(JSON.parse).catch(() => ({ lists: {}, check: {} }));
  const save = async () => {
    await mkdir(path.dirname(CACHE), { recursive: true });
    await writeFile(CACHE, JSON.stringify(cache));
  };

  const taken = new Set([...curated, ...verified].map((e) => e.word));
  const existing = {};
  for (const entry of [...curated, ...verified]) {
    existing[entry.category] = (existing[entry.category] ?? 0) + 1;
  }

  const extra = [];
  for (const [category, sources] of Object.entries(SOURCES)) {
    const need = Math.max(0, TARGET - (existing[category] ?? 0));
    if (need === 0) {
      console.log(`${category.padEnd(9)} already at target`);
      continue;
    }

    const pool = [];
    for (const source of sources) {
      try {
        cache.lists[source] ??= await wiktionaryWords(source);
      } catch {
        cache.lists[source] = [];
      }
      for (const raw of cache.lists[source]) {
        const word = raw.toLowerCase().trim();
        if (!taken.has(word) && acceptable(word) && !pool.includes(word)) pool.push(word);
      }
      await save();
    }

    // Check in batches until the category has enough, rather than resolving the
    // whole pool: most categories run far past what we need.
    let kept = 0;
    for (const batch of chunk(pool, 45)) {
      if (kept >= need) break;
      const unchecked = batch.filter((w) => cache.check[w] === undefined);
      if (unchecked.length) {
        const data = await api('en.wikipedia.org', {
          action: 'query',
          prop: 'pageimages',
          piprop: 'thumbnail',
          pithumbsize: '640',
          redirects: '1',
          titles: unchecked.map(titleCase).join('|'),
        });
        const redirected = new Set((data.query?.redirects ?? []).map((r) => r.from));
        const withImage = new Set(
          (data.query?.pages ?? []).filter((p) => p.thumbnail?.source).map((p) => p.title),
        );
        for (const word of unchecked) {
          const asked = titleCase(word);
          cache.check[word] = !redirected.has(asked) && withImage.has(asked);
        }
        await save();
        await sleep(300);
      }
      for (const word of batch) {
        if (kept >= need || !cache.check[word]) continue;
        taken.add(word);
        extra.push({ word, category });
        kept += 1;
      }
      process.stdout.write('.');
    }
    console.log(` ${category.padEnd(9)} +${kept} (pool ${pool.length}) -> ${(existing[category] ?? 0) + kept}`);
  }

  const body = extra
    .map((e) => {
      const article = /^[aeiou]/.test(e.word) ? ", article: 'an'" : '';
      return `  { word: '${e.word}', wiki: '${titleCase(e.word)}', category: '${e.category}'${article}, common: false },`;
    })
    .join('\n');

  await writeFile(
    OUT,
    `// GENERATED by scripts/harvest-wiktionary.mjs — do not edit by hand.\n` +
      `//\n` +
      `// Real but less common vocabulary, sourced from Wiktionary's topical word\n` +
      `// lists and held to the same rule: an English Wikipedia article of exactly\n` +
      `// this name, carrying a lead image. Marked \`common: false\` so lessons and\n` +
      `// games can favour the core word list.\n\n` +
      `export const extra = [\n${body}\n];\n`,
  );
  console.log(`\nWrote ${extra.length} extra words to ${path.relative(process.cwd(), OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
