// Wikimedia thumbnails arrive at ~200 KB each, which is far more than a card
// rendered at 420 px needs. This re-encodes everything in public/words to a
// consistent JPEG so the whole picture set stays a reasonable download.
//
//   node scripts/optimize-images.mjs

import { readdir, stat, rename, unlink, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const DIR = path.join(process.cwd(), 'public', 'words');
// Cards render at roughly 300-420 px wide, so 480 is generous. With well over a
// thousand photographs in the repo, the per-image size is what decides whether
// the whole picture set stays a sane download.
const MAX_EDGE = 480;

const kb = (bytes) => Math.round(bytes / 1024);

async function main() {
  const files = (await readdir(DIR)).filter((f) => /\.(jpe?g|png|gif|webp)$/i.test(f));
  let before = 0;
  let after = 0;
  const skipped = [];

  for (const file of files) {
    const source = path.join(DIR, file);
    before += (await stat(source)).size;

    // sips writes a new file rather than converting in place reliably, so
    // encode to a temporary name and swap it in.
    const target = path.join(DIR, `${path.parse(file).name}.jpg`);
    const temp = `${target}.tmp`;
    try {
      await run('sips', [
        '-s', 'format', 'jpeg',
        '-s', 'formatOptions', '65',
        '-Z', String(MAX_EDGE),
        source,
        '--out', temp,
      ]);
      if (source !== target) await unlink(source);
      await rename(temp, target);
      after += (await stat(target)).size;
      process.stdout.write('.');
    } catch {
      // sips refuses the occasional odd file. One unreadable image must not
      // abort the run and leave the data file describing the old extensions.
      await unlink(temp).catch(() => {});
      skipped.push(file);
      after += (await stat(source)).size;
      process.stdout.write('x');
    }
  }

  // Everything mirrored is a .jpg now, so the data file has to agree. Words
  // served from Wikimedia's CDN keep their absolute URL untouched.
  const dataFile = path.join(process.cwd(), 'public', 'data', 'words.json');
  const data = JSON.parse(await readFile(dataFile, 'utf8'));
  for (const word of data) {
    if (word.image.startsWith('/words/')) word.image = word.image.replace(/\.\w+$/, '.jpg');
  }
  await writeFile(dataFile, `${JSON.stringify(data, null, 2)}\n`);

  console.log(`\n${files.length} images: ${kb(before)} KB -> ${kb(after)} KB`);
  if (skipped.length) console.log(`sips could not convert ${skipped.length}: ${skipped.join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
