export type Word = {
  id: string;
  word: string;
  category: string;
  /** Everyday vocabulary. The rarer long tail is browsable but never quizzed. */
  common?: boolean;
  sentence: string;
  /** Either a local /words/… path or an absolute Wikimedia CDN URL. */
  image: string;
};

/** A stable accent colour per category, so cards feel grouped without being noisy. */
export const categoryColor: Record<string, string> = {
  Food: '#ef5b55',
  Animals: '#f2951f',
  Clothes: '#c2477e',
  School: '#5768ef',
  Home: '#8358d9',
  Toys: '#e0632f',
  Places: '#2b9eb3',
  Vehicles: '#3b7dd8',
  Nature: '#1aa283',
  Weather: '#0f9bb5',
  Sport: '#d1462f',
  Music: '#7b4bc4',
  Jobs: '#2f7d5c',
  Body: '#d95485',
  Shapes: '#6b7b8c',
  Colors: '#9a6c43',
};

export const colorFor = (word: Word) => categoryColor[word.category] ?? '#ff725e';

/**
 * Fixed display order. The data file is sorted alphabetically by category,
 * which would otherwise bury the categories children reach for first.
 */
export const CATEGORY_ORDER = [
  'Food', 'Animals', 'Clothes', 'School', 'Home', 'Toys', 'Places', 'Vehicles',
  'Nature', 'Weather', 'Sport', 'Music', 'Jobs', 'Body', 'Shapes', 'Colors',
];

/** The six photographs on the home page. Fixed, so every visit looks the same. */
export const HERO_WORDS = ['apple', 'cat', 'bus', 'rainbow', 'guitar', 'shoe'];

/** Fisher-Yates, so callers never accidentally bias a "random" quiz. */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const sample = <T,>(items: readonly T[], count: number) => shuffle(items).slice(0, count);

/**
 * `count` options including the answer, preferring same-category distractors so
 * a quiz asks "which of these animals is a goat?" rather than "goat or airplane?".
 */
export function quizOptions(pool: readonly Word[], answer: Word, count: number): Word[] {
  const sameCategory = pool.filter((w) => w.category === answer.category && w.id !== answer.id);
  const others = pool.filter((w) => w.category !== answer.category && w.id !== answer.id);
  const distractors = [...shuffle(sameCategory), ...shuffle(others)].slice(0, count - 1);
  return shuffle([answer, ...distractors]);
}
