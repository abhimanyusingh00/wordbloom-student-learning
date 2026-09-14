'use client';

import { useCallback, useEffect, useState } from 'react';

export type Progress = {
  learned: string[];
  bestMatch: number;
  bestMemory: number;
  bestMaze: number;
  bestSpell: number;
};

type Game = 'bestMatch' | 'bestMemory' | 'bestMaze' | 'bestSpell';

/** Memory pairs is scored in tries, where fewer is better; the rest count up. */
const lowerIsBetter: Record<Game, boolean> = {
  bestMatch: false,
  bestMemory: true,
  bestMaze: false,
  bestSpell: false,
};

const STORAGE_KEY = 'wordbloom:progress:v2';

const empty: Progress = { learned: [], bestMatch: 0, bestMemory: 0, bestMaze: 0, bestSpell: 0 };

function read(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return saved ? { ...empty, ...saved } : empty;
  } catch {
    return empty;
  }
}

/**
 * Progress lives only on the child's own device. Reading happens after mount so
 * the static HTML and the first client render always agree.
 */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(read());
    setReady(true);
  }, []);

  const update = useCallback((change: (current: Progress) => Progress) => {
    setProgress((current) => {
      const next = change(current);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // A locked-down browser just means progress is not remembered.
      }
      return next;
    });
  }, []);

  const toggleLearned = useCallback(
    (id: string) =>
      update((current) => ({
        ...current,
        learned: current.learned.includes(id)
          ? current.learned.filter((x) => x !== id)
          : [...current.learned, id],
      })),
    [update],
  );

  /** A new personal best never overwrites a better one. 0 means "not played yet". */
  const recordBest = useCallback(
    (game: Game, score: number) =>
      update((current) => {
        const previous = current[game];
        const better = lowerIsBetter[game]
          ? previous === 0 || score < previous
          : score > previous;
        return better ? { ...current, [game]: score } : current;
      }),
    [update],
  );

  return { progress, ready, toggleLearned, recordBest };
}
