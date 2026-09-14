'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { LearnCard } from './components/LearnCard';
import { Library } from './components/Library';
import { MatchGame } from './components/games/MatchGame';
import { MemoryGame } from './components/games/MemoryGame';
import { MazeGame } from './components/games/MazeGame';
import { SpellGame } from './components/games/SpellGame';
import { WordImage } from './components/WordImage';
import { useProgress } from './lib/progress';
import { shuffle, type Word } from './lib/words';
import { WordsProvider, useWords } from './lib/WordsProvider';
import { speak, stopSpeaking } from './lib/speech';

type View = 'home' | 'learn' | 'library' | 'games';
type Game = 'match' | 'memory' | 'maze' | 'spell';

const GAMES: { id: Game; name: string; blurb: string; icon: string }[] = [
  { id: 'match', name: 'Picture match', blurb: 'See a photo, pick the right word.', icon: '🎯' },
  { id: 'memory', name: 'Memory pairs', blurb: 'Match every photo to its word.', icon: '🧠' },
  { id: 'maze', name: 'Word maze', blurb: 'Walk the maze and collect three words.', icon: '🧩' },
  { id: 'spell', name: 'Spell it', blurb: 'Put the letters in the right order.', icon: '🔤' },
];

export default function Home() {
  return (
    <WordsProvider>
      <WordBloom />
    </WordsProvider>
  );
}

function WordBloom() {
  const { words, practiceWords, heroWords } = useWords();
  const [view, setView] = useState<View>('home');
  const [game, setGame] = useState<Game | null>(null);
  const [index, setIndex] = useState(0);
  const { progress, ready, toggleLearned, recordBest } = useProgress();

  // One shuffled deck per visit, so a child does not always start at "apple".
  // Shuffling has to wait for the browser: the server has no way to render the
  // same random order, and a mismatch breaks hydration.
  const [deck, setDeck] = useState<Word[]>(practiceWords);
  useEffect(() => setDeck(shuffle(practiceWords)), [practiceWords]);

  useEffect(() => stopSpeaking, []);

  const openWord = useCallback(
    (word: Word) => {
      // A word opened from the dictionary may be outside the practice deck, so
      // put it at the front rather than silently showing something else.
      const position = deck.findIndex((w) => w.id === word.id);
      if (position < 0) {
        setDeck([word, ...deck]);
        setIndex(0);
      } else {
        setIndex(position);
      }
      setView('learn');
    },
    [deck],
  );

  const go = (next: View) => {
    stopSpeaking();
    setGame(null);
    setView(next);
  };

  if (view === 'learn') {
    return (
      <main className="lesson-shell">
        <LearnCard
          deck={deck}
          index={index}
          onIndex={setIndex}
          learned={progress.learned}
          onToggleLearned={toggleLearned}
          onExit={() => go('home')}
        />
      </main>
    );
  }

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => go('home')}>
          <span className="brand-mark" aria-hidden>
            W
          </span>
          <span>WordBloom</span>
        </button>
        <nav>
          <button className={view === 'home' ? 'on' : ''} onClick={() => go('home')}>
            Home
          </button>
          <button className={view === 'library' ? 'on' : ''} onClick={() => go('library')}>
            Words
          </button>
          <button className={view === 'games' ? 'on' : ''} onClick={() => go('games')}>
            Games
          </button>
        </nav>
        <p className="learned-count" aria-live="polite">
          <b>{ready ? progress.learned.length : 0}</b> learned
        </p>
      </header>

      {view === 'home' && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                <span aria-hidden>✦</span> Real photos, real words
              </p>
              <h1>
                See it. Hear it.
                <br />
                <em>Say it!</em>
              </h1>
              <p className="intro">
                {words.length.toLocaleString()} English words, each with a real photograph and a
                spoken sentence — and four games built on the{' '}
                {practiceWords.length.toLocaleString()} everyday ones.
              </p>
              <div className="hero-actions">
                <button className="next-button" onClick={() => setView('learn')}>
                  Start learning <span aria-hidden>→</span>
                </button>
                <button
                  className="ghost-button"
                  onClick={() => speak('Welcome to WordBloom. Let us learn together!')}
                >
                  🔊 Try the sound
                </button>
              </div>
            </div>
            <div className="hero-photos" aria-hidden>
              {heroWords.map((word) => (
                <figure key={word.id}>
                  <WordImage word={word} eager />
                  <figcaption>{word.word}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="games-strip">
            <h2>Play and practise</h2>
            <div className="game-cards">
              {GAMES.map((entry) => (
                <button
                  key={entry.id}
                  className="game-card"
                  onClick={() => {
                    setGame(entry.id);
                    setView('games');
                  }}
                >
                  <span className="game-icon" aria-hidden>
                    {entry.icon}
                  </span>
                  <h3>{entry.name}</h3>
                  <p>{entry.blurb}</p>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {view === 'library' && <Library learned={progress.learned} onOpen={openWord} />}

      {view === 'games' && (
        <section className="games-view">
          <div className="game-tabs" role="tablist" aria-label="Games">
            {GAMES.map((entry) => (
              <button
                key={entry.id}
                role="tab"
                aria-selected={game === entry.id}
                className={game === entry.id ? 'chip on' : 'chip'}
                onClick={() => setGame(entry.id)}
              >
                {entry.icon} {entry.name}
              </button>
            ))}
          </div>

          {game === null && (
            <div className="game-picker">
              <h2>Pick a game</h2>
              <div className="game-cards">
                {GAMES.map((entry) => (
                  <button key={entry.id} className="game-card" onClick={() => setGame(entry.id)}>
                    <span className="game-icon" aria-hidden>
                      {entry.icon}
                    </span>
                    <h3>{entry.name}</h3>
                    <p>{entry.blurb}</p>
                  </button>
                ))}
              </div>
              {ready && (
                <ul className="best-scores">
                  <li>
                    Picture match best <b>{progress.bestMatch} / 10</b>
                  </li>
                  <li>
                    Memory pairs best <b>{progress.bestMemory || '—'} tries</b>
                  </li>
                  <li>
                    Word maze reached <b>maze {progress.bestMaze || 1}</b>
                  </li>
                  <li>
                    Words spelled <b>{progress.bestSpell}</b>
                  </li>
                </ul>
              )}
            </div>
          )}

          {game === 'match' && <MatchGame onScore={(s) => recordBest('bestMatch', s)} />}
          {game === 'memory' && <MemoryGame onScore={(m) => recordBest('bestMemory', m)} />}
          {game === 'maze' && <MazeGame onScore={(l) => recordBest('bestMaze', l)} />}
          {game === 'spell' && <SpellGame onScore={(s) => recordBest('bestSpell', s)} />}
        </section>
      )}

      <footer>
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            W
          </span>
          <span>WordBloom</span>
        </div>
        <p>Made for curious minds and brave voices.</p>
        <Link href="/credits">Picture credits</Link>
      </footer>
    </main>
  );
}
