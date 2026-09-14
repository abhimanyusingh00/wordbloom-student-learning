'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { asset } from '@/app/lib/assets';
import { CATEGORY_ORDER, type Word } from '@/app/lib/words';

type Credit = { author: string; license: string; licenseUrl: string; source: string };

/**
 * Most photographs are Creative Commons licensed, which requires crediting the
 * author. This page is that credit, built from the same data the lessons use so
 * it can never drift out of date. Both files are fetched rather than bundled —
 * together they are well over a megabyte.
 */
export default function CreditsPage() {
  const [words, setWords] = useState<Word[] | null>(null);
  const [credits, setCredits] = useState<Record<string, Credit>>({});

  useEffect(() => {
    let live = true;
    Promise.all([
      fetch(asset('/data/words.json')).then((r) => r.json() as Promise<Word[]>),
      fetch(asset('/data/credits.json')).then((r) => r.json() as Promise<Record<string, Credit>>),
    ])
      .then(([w, c]) => {
        if (!live) return;
        setWords(w);
        setCredits(c);
      })
      .catch(() => live && setWords([]));
    return () => {
      live = false;
    };
  }, []);

  const groups = new Map<string, Word[]>();
  for (const word of words ?? []) {
    if (!groups.has(word.category)) groups.set(word.category, []);
    groups.get(word.category)!.push(word);
  }
  const ordered = [...groups.entries()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]),
  );

  return (
    <main className="credits">
      <header className="credits-head">
        <Link className="ghost-button" href="/">
          ← Back to WordBloom
        </Link>
        <h1>Picture credits</h1>
        <p>
          {words === null
            ? 'Loading the picture list…'
            : `The ${words.length.toLocaleString()} photographs in WordBloom come from Wikimedia
               Commons and Flickr. Open a category to see every author and licence.`}
        </p>
      </header>

      {/* Collapsed by default: with thousands of photographs an open list would
          be an unreadable wall of names. */}
      {ordered.map(([category, group]) => (
        <details key={category}>
          <summary>
            {category} <span>{group.length}</span>
          </summary>
          <ul className="credit-list">
            {group.map((word) => {
              const credit = credits[word.id];
              return (
                <li key={word.id}>
                  <b>{word.word}</b>
                  <span>{credit?.author ?? 'Unknown author'}</span>
                  {credit?.licenseUrl ? (
                    <a href={credit.licenseUrl} rel="noreferrer nofollow" target="_blank">
                      {credit.license}
                    </a>
                  ) : (
                    <span>{credit?.license ?? 'See Wikimedia Commons'}</span>
                  )}
                  <a
                    href={credit?.source ?? 'https://commons.wikimedia.org'}
                    rel="noreferrer nofollow"
                    target="_blank"
                  >
                    source
                  </a>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </main>
  );
}
