'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CATEGORY_ORDER, HERO_WORDS, type Word } from './words';
import { asset } from './assets';

type WordData = {
  words: Word[];
  /** What lessons and games draw from: everyday words only. */
  practiceWords: Word[];
  categories: string[];
  byId: Map<string, Word>;
  heroWords: Word[];
};

const WordsContext = createContext<WordData | null>(null);

function build(words: Word[]): WordData {
  const present = new Set(words.map((w) => w.category));
  const byId = new Map(words.map((w) => [w.id, w]));
  return {
    words,
    practiceWords: words.filter((w) => w.common !== false),
    categories: [
      'All',
      ...CATEGORY_ORDER.filter((name) => present.has(name)),
      ...[...present].filter((name) => !CATEGORY_ORDER.includes(name)).sort(),
    ],
    byId,
    heroWords: HERO_WORDS.map((id) => byId.get(id)).filter((w): w is Word => Boolean(w)),
  };
}

/**
 * The word list is close to a megabyte, which is too much to bundle — it broke
 * the Cloudflare Workers script limit outright. It is fetched once as a static
 * asset and shared through context instead.
 */
export function WordsProvider({ children }: { children: React.ReactNode }) {
  const [words, setWords] = useState<Word[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(asset('/data/words.json'))
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<Word[]>;
      })
      .then((data: Word[]) => live && setWords(data))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const value = useMemo(() => (words ? build(words) : null), [words]);

  if (failed) {
    return (
      <div className="boot">
        <p>The word list could not be loaded. Please refresh the page.</p>
      </div>
    );
  }
  if (!value) {
    return (
      <div className="boot">
        <span className="boot-mark" aria-hidden>
          W
        </span>
        <p>Getting the words ready…</p>
      </div>
    );
  }
  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>;
}

export function useWords() {
  const value = useContext(WordsContext);
  if (!value) throw new Error('useWords must be used inside <WordsProvider>');
  return value;
}
