// Quality gate for automatically harvested words.
//
// The word/image rule guarantees the photograph shows the word — but not that
// the word was filed under a sensible category, or that it is a thing a child
// can point at. Wiktionary's topical lists put "accentor" (a bird) under Music.
//
// Wikipedia's own one-line short description is a good judge of both. This pass
// reads it for every harvested word and then either reassigns the category or
// drops the word entirely.
//
//   node scripts/audit-categories.mjs           report only
//   node scripts/audit-categories.mjs --apply   rewrite the generated files

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const UA = 'WordBloom/2.0 (student learning site; educational use)';
const CACHE = path.join(process.cwd(), '.cache', 'descriptions.json');
const APPLY = process.argv.includes('--apply');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

/**
 * What a description has to look like for the word to belong in a category.
 * Order matters: the first match wins, so the specific patterns come first.
 */
const CATEGORY_SIGNS = [
  // Food comes first on purpose: nearly every vegetable's article describes a
  // plant, and a child learning "broccoli" wants it filed under Food.
  ['Food', /\b(food|foodstuff|dish|fruit|vegetable|bread|cheese|dessert|cake|sweet|spice|condiment|sauce|drink|beverage|meal|snack|confection|pastry|edible|culinary|cuisine|cooked|eaten)\b/i],
  // Deliberately not a bare "species of": that matches every plant too.
  ['Animals', /\b(bird|fish|mammal|insect|reptile|amphibian|spider|beetle|butterfly|moth|snake|lizard|frog|toad|rodent|primate|crustacean|mollusc|mollusk|arachnid|worm|whale|shark|animal|breed of dog|breed of cat|marsupial)\b/i],
  ['Nature', /\b(plant|tree|flower|shrub|herb|grass|fungus|mushroom|mineral|rock|gemstone|landform|river|lake|mountain|valley|island|geological|vegetation)\b/i],
  ['Music', /\b(musical instrument|instrument of the|string instrument|wind instrument|percussion|keyboard instrument)\b/i],
  ['Vehicles', /\b(vehicle|automobile|aircraft|airplane|boat|ship|watercraft|bicycle|motorcycle|locomotive|truck)\b/i],
  ['Clothes', /\b(garment|clothing|footwear|shoe|hat|headgear|jewell?ry|fabric|textile|worn on|worn around|item of dress)\b/i],
  ['Jobs', /\b(occupation|profession|person who|worker|craftsman|practitioner|specialist in)\b/i],
  ['Body', /\b(body part|anatomical|part of the body|limb|organ|bone|muscle)\b/i],
  ['Places', /\b(building|structure|room|shop|store|venue|place of|establishment|dwelling|architectural)\b/i],
  ['Home', /\b(tool|utensil|furniture|container|appliance|kitchenware|cookware|implement|household)\b/i],
  ['Sport', /\b(sport|game played|athletic|martial art|sporting)\b/i],
  ['Toys', /\b(toy|board game|puzzle|plaything)\b/i],
  ['Weather', /\b(cloud|precipitation|wind|weather|meteorolog)\b/i],
  ['Shapes', /\b(shape|polygon|polyhedron|geometric|geometry)\b/i],
  ['Colors', /\b(colou?r|shade of|hue)\b/i],
  ['School', /\b(writing|stationery|book|paper|pen|pencil)\b/i],
];

const SIGN_FOR = new Map(CATEGORY_SIGNS);

/** Descriptions that mean the word is not a thing a child can be shown. */
// Narrowly worded on purpose. An earlier, looser version threw out `ribbon`
// ("band of fabric"), `paint` ("dries as a solid film") and `twig` ("terminal
// branch of a woody plant") because it matched band / film / branch of.
const ABSTRACT = /\b(may refer to|disambiguation|abstract concept|philosoph|terminology|music genre|literary genre|style of music|unit of measurement|measure of|process of|method of|system of|branch of (science|mathematics|knowledge|study|philosophy)|field of study|surname|given name|village in|town in|city in|municipalit|commune in|river in|studio album|feature film|television series|rock band|novel by|company|manufacturer|brand of|trademark)\b/i;

async function descriptions(titles) {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  Object.entries({
    action: 'query', format: 'json', formatversion: '2', origin: '*',
    prop: 'description', redirects: '1', titles: titles.join('|'),
  }).forEach(([k, v]) => url.searchParams.set(k, v));

  // Connection failures are as common as HTTP errors over a run this long, so
  // both have to be retried, not just a bad status code.
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.ok) {
        const data = await res.json();
        const out = {};
        for (const page of data.query?.pages ?? []) out[page.title] = page.description ?? '';
        return out;
      }
      if (attempt >= 5) throw new Error(`${res.status} ${res.statusText}`);
      process.stdout.write(`[${res.status}]`);
    } catch (err) {
      if (attempt >= 5) throw err;
      process.stdout.write('[net]');
    }
    await sleep(2000 * 2 ** attempt);
  }
}

async function main() {
  const { extra } = await import('./vocabulary.extra.mjs');
  const { harvested } = await import('./vocabulary.harvested.mjs');
  const cache = await readFile(CACHE, 'utf8').then(JSON.parse).catch(() => ({}));

  const all = [...harvested, ...extra];
  const pending = all.filter((e) => cache[e.wiki] === undefined).map((e) => e.wiki);
  console.log(`${all.length} harvested words, ${pending.length} descriptions to fetch`);

  for (const batch of chunk([...new Set(pending)], 50)) {
    Object.assign(cache, await descriptions(batch));
    for (const title of batch) cache[title] ??= '';
    await mkdir(path.dirname(CACHE), { recursive: true });
    await writeFile(CACHE, JSON.stringify(cache));
    process.stdout.write('.');
    await sleep(250);
  }
  process.stdout.write('\n');

  const verdicts = new Map();
  for (const entry of all) {
    const description = cache[entry.wiki] ?? '';
    if (!description) {
      // No description at all is a weak signal on its own; keep the word.
      verdicts.set(entry.word, { keep: true, category: entry.category });
      continue;
    }
    if (ABSTRACT.test(description)) {
      verdicts.set(entry.word, { keep: false, why: description });
      continue;
    }
    // Only overrule the word list when the description actively disagrees with
    // the assigned category. "Edible green plant in the cabbage family" matches
    // both Food and Nature; broccoli is already filed as Food, so leave it.
    const own = SIGN_FOR.get(entry.category);
    if (own?.test(description)) {
      verdicts.set(entry.word, { keep: true, category: entry.category, why: description });
      continue;
    }
    const sign = CATEGORY_SIGNS.find(([, pattern]) => pattern.test(description));
    verdicts.set(entry.word, {
      keep: true,
      category: sign ? sign[0] : entry.category,
      moved: sign && sign[0] !== entry.category ? `${entry.category} -> ${sign[0]}` : null,
      why: description,
    });
  }

  const dropped = all.filter((e) => !verdicts.get(e.word).keep);
  const moved = all.filter((e) => verdicts.get(e.word).moved);
  console.log(`drop ${dropped.length}, recategorise ${moved.length}, keep ${all.length - dropped.length}`);
  console.log('\nExamples dropped:');
  dropped.slice(0, 8).forEach((e) => console.log(`  ${e.word.padEnd(14)} ${verdicts.get(e.word).why}`));
  console.log('\nExamples moved:');
  moved.slice(0, 8).forEach((e) => console.log(`  ${e.word.padEnd(14)} ${verdicts.get(e.word).moved}  (${verdicts.get(e.word).why})`));

  if (!APPLY) return;

  const rewrite = async (file, name, entries) => {
    const kept = entries
      .filter((e) => verdicts.get(e.word).keep)
      .map((e) => ({ ...e, category: verdicts.get(e.word).category }));
    const body = kept
      .map((e) => {
        const article = e.article ? `, article: '${e.article}'` : '';
        const mass = e.mass ? ', mass: true' : '';
        const common = e.common === false ? ', common: false' : '';
        return `  { word: '${e.word}', wiki: '${e.wiki}', category: '${e.category}'${article}${mass}${common} },`;
      })
      .join('\n');
    await writeFile(
      path.join(process.cwd(), 'scripts', file),
      `// GENERATED — do not edit by hand. Categories audited against Wikipedia\n` +
        `// short descriptions by scripts/audit-categories.mjs.\n\n` +
        `export const ${name} = [\n${body}\n];\n`,
    );
    console.log(`\n${file}: ${kept.length} of ${entries.length} kept`);
  };

  await rewrite('vocabulary.harvested.mjs', 'harvested', harvested);
  await rewrite('vocabulary.extra.mjs', 'extra', extra);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
