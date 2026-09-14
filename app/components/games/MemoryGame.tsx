'use client';

import { useEffect, useState } from 'react';
import { WordImage } from '../WordImage';
import { colorFor, sample, shuffle, type Word } from '@/app/lib/words';
import { useWords } from '@/app/lib/WordsProvider';
import { speak } from '@/app/lib/speech';

const PAIRS = 6;

type Tile = { key: string; word: Word; face: 'photo' | 'word' };

const newBoard = (pool: readonly Word[]): Tile[] =>
  shuffle(
    sample(pool, PAIRS).flatMap((word) => [
      { key: `${word.id}-photo`, word, face: 'photo' as const },
      { key: `${word.id}-word`, word, face: 'word' as const },
    ]),
  );

/** Match each photo with its written word. Two faces of the same word are a pair. */
export function MemoryGame({ onScore }: { onScore: (moves: number) => void }) {
  const { practiceWords } = useWords();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => setTiles(newBoard(practiceWords)), [practiceWords]);

  const done = tiles.length > 0 && matched.length === PAIRS;

  useEffect(() => {
    if (done) onScore(moves);
  }, [done, moves, onScore]);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped.map((key) => tiles.find((t) => t.key === key)!);
    if (a.word.id === b.word.id) {
      setMatched((m) => [...m, a.word.id]);
      setFlipped([]);
      speak(`${a.word.word}. ${a.word.sentence}`, { rate: 0.8 });
    } else {
      const timer = setTimeout(() => setFlipped([]), 900);
      return () => clearTimeout(timer);
    }
  }, [flipped, tiles]);

  function flip(tile: Tile) {
    if (flipped.length === 2 || flipped.includes(tile.key) || matched.includes(tile.word.id)) return;
    if (flipped.length === 1) setMoves((m) => m + 1);
    setFlipped((current) => [...current, tile.key]);
  }

  function restart() {
    setTiles(newBoard(practiceWords));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  }

  if (!tiles.length) return <div className="game-loading">Shuffling the cards…</div>;

  return (
    <div className="game memory-game">
      <div className="game-head">
        <span>
          {matched.length} / {PAIRS} pairs
        </span>
        <span>{moves} tries</span>
      </div>

      {done ? (
        <div className="game-result">
          <p className="result-score">{moves}</p>
          <h3>All matched in {moves} tries!</h3>
          <button className="next-button" onClick={restart}>
            Play again
          </button>
        </div>
      ) : (
        <>
          <h3 className="game-prompt">Find the picture that goes with each word.</h3>
          <div className="memory-grid">
            {tiles.map((tile) => {
              const open = flipped.includes(tile.key) || matched.includes(tile.word.id);
              return (
                <button
                  key={tile.key}
                  className={`memory-tile ${open ? 'open' : ''} ${matched.includes(tile.word.id) ? 'done' : ''}`}
                  style={{ '--accent': colorFor(tile.word) } as React.CSSProperties}
                  onClick={() => flip(tile)}
                  aria-label={open ? tile.word.word : 'Hidden card'}
                >
                  {open ? (
                    tile.face === 'photo' ? (
                      <WordImage word={tile.word} />
                    ) : (
                      <span className="memory-word">{tile.word.word}</span>
                    )
                  ) : (
                    <span className="memory-back" aria-hidden>
                      ?
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
