'use client';

import { useMemo, useState } from 'react';
import { WordImage } from './WordImage';
import { colorFor, type Word } from '@/app/lib/words';
import { useWords } from '@/app/lib/WordsProvider';
import { speak } from '@/app/lib/speech';

type Props = {
  learned: string[];
  onOpen: (word: Word) => void;
};

const PAGE = 60;

export function Library({ learned, onOpen }: Props) {
  const { words, categories } = useWords();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [shown, setShown] = useState(PAGE);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return words.filter(
      (word) =>
        (category === 'All' || word.category === category) &&
        (!needle || `${word.word} ${word.sentence}`.toLowerCase().includes(needle)),
    );
  }, [words, query, category]);

  // The dictionary is far too large to put on the page at once, so it grows a
  // page at a time and resets whenever the filter changes.
  const narrow = (change: () => void) => {
    change();
    setShown(PAGE);
  };
  const visible = results.slice(0, shown);

  return (
    <section className="library">
      <header className="section-head">
        <div>
          <p className="eyebrow">Your picture dictionary</p>
          <h2>{words.length} real photographs</h2>
          <p className="section-note">
            Tap a picture to hear the word, or open it as a full lesson.
          </p>
        </div>
        <div className="progress-pill">
          <span>{learned.length}</span>
          <small>
            words
            <br />
            learned
          </small>
        </div>
      </header>

      <div className="tools">
        <label className="search">
          <span aria-hidden>⌕</span>
          <input
            value={query}
            onChange={(event) => narrow(() => setQuery(event.target.value))}
            placeholder="Search for a word…"
            aria-label="Search words"
          />
        </label>
        <div className="chip-row" role="tablist" aria-label="Categories">
          {categories.map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={category === name}
              className={category === name ? 'chip on' : 'chip'}
              onClick={() => narrow(() => setCategory(name))}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <p className="results-line">
        {results.length === visible.length
          ? `${results.length} ${results.length === 1 ? 'word' : 'words'}`
          : `Showing ${visible.length} of ${results.length} words`}
      </p>

      <div className="word-grid">
        {visible.map((word) => (
          <article
            key={word.id}
            className={learned.includes(word.id) ? 'word-tile learned' : 'word-tile'}
            style={{ '--accent': colorFor(word) } as React.CSSProperties}
          >
            <button
              className="tile-photo"
              onClick={() => speak(`${word.word}. ${word.sentence}`)}
              aria-label={`Hear the word ${word.word}`}
            >
              <WordImage word={word} />
              {learned.includes(word.id) && <b aria-hidden>✓</b>}
              <em aria-hidden>🔊</em>
            </button>
            <div className="tile-copy">
              <h3>{word.word}</h3>
              <p>{word.sentence}</p>
            </div>
            <button className="tile-open" onClick={() => onOpen(word)}>
              Practise this word
            </button>
          </article>
        ))}
      </div>

      {visible.length < results.length && (
        <div className="more-row">
          <button className="ghost-button" onClick={() => setShown((n) => n + PAGE)}>
            Show {Math.min(PAGE, results.length - visible.length)} more words
          </button>
        </div>
      )}

      {results.length === 0 && (
        <p className="empty-note">No words match that search. Try another spelling.</p>
      )}
    </section>
  );
}
