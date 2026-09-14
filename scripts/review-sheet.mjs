// Builds a contact sheet of every downloaded picture next to the word it
// teaches, so a human can eyeball all of them at once and catch any mismatch
// before it reaches a child.
//
//   node scripts/review-sheet.mjs && open public/review.html

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const words = JSON.parse(await readFile(path.join(process.cwd(), 'public', 'data', 'words.json'), 'utf8'));

const tiles = words
  .map(
    (w) => `<figure><img src="${w.image}" alt=""><figcaption>${w.word}<small>${w.category}</small></figcaption></figure>`,
  )
  .join('\n');

await writeFile(
  path.join(process.cwd(), 'public', 'review.html'),
  `<!doctype html><meta charset="utf-8"><title>WordBloom picture review (${words.length})</title>
<style>
  body{margin:0;padding:20px;background:#fffaf1;font:14px system-ui,sans-serif}
  h1{font-size:20px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
  figure{margin:0;background:#fff;border:2px solid #eadfd0;border-radius:12px;overflow:hidden}
  img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}
  figcaption{padding:8px;font-weight:700;display:flex;justify-content:space-between;align-items:baseline}
  small{color:#8a97a3;font-weight:400}
</style>
<h1>${words.length} pictures — check each one matches its word</h1>
<div class="grid">${tiles}</div>
`,
);

console.log(`Wrote public/review.html with ${words.length} tiles`);
