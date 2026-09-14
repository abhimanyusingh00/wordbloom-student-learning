# WordBloom

WordBloom is a picture-word learning website for young students building
confidence with everyday English vocabulary.

Every word is taught with a **real photograph**, the written word, a short
example sentence, and gentle spoken pronunciation — then practised in four
games.

## What is in it

- **3,800+ words** across 16 categories, each with its own photograph
- **Lesson mode** — one photo, one word, one sentence, read aloud
  automatically; the child moves on with a single large button
- **Picture dictionary** — search and category filters over the whole word list
- **Four games**
  - *Picture match* — see a photo, choose the right word from four options
  - *Memory pairs* — match each photograph to its written word
  - *Word maze* — walk a generated maze collecting three named words while
    avoiding decoys, then reach the door
  - *Spell it* — put the scrambled letters back in order
- Progress and best scores saved on the student's own device
- Responsive layout, large touch targets, keyboard support

## How the pictures stay correct

The hard problem in a picture dictionary is making sure the photograph actually
shows the word. WordBloom relies on one rule:

> A word is only included when English Wikipedia has an article of **exactly
> that name** — no redirect — carrying a lead image.

The lead image of the *Banana* article is a banana. That invariant is what
removes the "red grapes, wrong picture" class of mismatch by construction,
rather than by hoping an image search returns something sensible.

Words are assembled in three layers, each overriding the one before:

| Source | Script | Notes |
| --- | --- | --- |
| Hand-curated | `scripts/vocabulary.mjs` | Words where the rule needs help — the *Star* article leads with a photo of the Sun, so `star` carries an explicit Wikimedia Commons file. Always wins. |
| Verified core | `scripts/candidates.mjs` → `verify-candidates.mjs` | Everyday word lists written by hand, then machine-checked against the rule. |
| Long tail | `scripts/harvest-wiktionary.mjs` | Wiktionary's topical word lists, same rule, marked `common: false`. |

`common: false` words are browsable in the dictionary but never quizzed — a
beginner's memory game should not ask about *quandong*.

### Where the images are served from

Photographs come from Wikimedia's CDN by default rather than being committed to
the repository: mirroring thousands of files costs hours against Wikimedia's
rate limits and ~100 MB in git, for images their CDN already serves well.

Any word that *is* mirrored locally keeps pointing at the local copy, so the
common words can be fast and offline while the long tail streams.

```bash
npm run words:fetch      # resolve every word, write app/data/words.json
npm run words:mirror     # additionally download into public/words/
npm run words:optimize   # re-encode mirrored files to ~480px JPEG (macOS `sips`)
node scripts/review-sheet.mjs   # contact sheet for a visual check
```

Author and licence for every photograph live in `app/data/credits.json` and are
listed on the site's `/credits` page. That file is imported only by the credits
page, which is a server component, so it never reaches the browser bundle.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build        # Cloudflare Workers via vinext
npm run build:pages  # static export into out/ for GitHub Pages
```

## Accessibility

Large controls, clear contrast, descriptive labels, visible focus rings, full
keyboard control in the lesson and the maze, and native browser speech
synthesis. Available voices vary by browser and operating system.
