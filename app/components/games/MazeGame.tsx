'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WordImage } from '../WordImage';
import { colorFor, sample, shuffle, type Word } from '@/app/lib/words';
import { useWords } from '@/app/lib/WordsProvider';
import { speak } from '@/app/lib/speech';

type Cell = { n: boolean; e: boolean; s: boolean; w: boolean };
type Point = { r: number; c: number };
type Pickup = Point & { word: Word; wanted: boolean };

const DIRECTIONS = {
  n: { dr: -1, dc: 0, opposite: 's' },
  e: { dr: 0, dc: 1, opposite: 'w' },
  s: { dr: 1, dc: 0, opposite: 'n' },
  w: { dr: 0, dc: -1, opposite: 'e' },
} as const;

type Direction = keyof typeof DIRECTIONS;

/** Randomised depth-first carving: every cell stays reachable, with no loops. */
function carveMaze(size: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ n: true, e: true, s: true, w: true })),
  );
  const seen = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const stack: Point[] = [{ r: 0, c: 0 }];
  seen[0][0] = true;

  while (stack.length) {
    const here = stack[stack.length - 1];
    const open = shuffle(Object.keys(DIRECTIONS) as Direction[]).filter((dir) => {
      const r = here.r + DIRECTIONS[dir].dr;
      const c = here.c + DIRECTIONS[dir].dc;
      return r >= 0 && c >= 0 && r < size && c < size && !seen[r][c];
    });

    if (!open.length) {
      stack.pop();
      continue;
    }
    const dir = open[0];
    const r = here.r + DIRECTIONS[dir].dr;
    const c = here.c + DIRECTIONS[dir].dc;
    grid[here.r][here.c][dir] = false;
    grid[r][c][DIRECTIONS[dir].opposite] = false;
    seen[r][c] = true;
    stack.push({ r, c });
  }
  return grid;
}

const sizeForLevel = (level: number) => Math.min(6 + Math.floor((level - 1) / 2), 10);

type Board = { size: number; grid: Cell[][]; pickups: Pickup[]; targets: Word[] };

function buildBoard(level: number, pool: readonly Word[]): Board {
  const size = sizeForLevel(level);
  const grid = carveMaze(size);

  // Keep the start and the door clear, then scatter three wanted words among
  // three decoys so the maze is about reading, not just walking.
  const cells: Point[] = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if ((r === 0 && c === 0) || (r === size - 1 && c === size - 1)) continue;
      cells.push({ r, c });
    }
  }

  // Decoys come from other categories on purpose: two photos of water sitting
  // in the same maze is a test of eyesight, not of reading.
  const targets = sample(pool, 3);
  const targetCategories = new Set(targets.map((w) => w.category));
  const decoys = sample(
    pool.filter((w) => !targetCategories.has(w.category)),
    3,
  );
  const spots = sample(cells, 6);
  const pickups: Pickup[] = [...targets, ...decoys].map((word, i) => ({
    ...spots[i],
    word,
    wanted: i < targets.length,
  }));

  return { size, grid, pickups, targets };
}

export function MazeGame({ onScore }: { onScore: (level: number) => void }) {
  const { practiceWords } = useWords();
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState<Board | null>(null);
  const [at, setAt] = useState<Point>({ r: 0, c: 0 });
  const [collected, setCollected] = useState<string[]>([]);
  const [taken, setTaken] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('Collect the three words, then reach the door.');
  const touch = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (nextLevel: number) => {
      setBoard(buildBoard(nextLevel, practiceWords));
    setAt({ r: 0, c: 0 });
    setCollected([]);
    setTaken([]);
    setWrong(0);
    setWon(false);
      setMessage('Collect the three words, then reach the door.');
    },
    [practiceWords],
  );

  useEffect(() => start(1), [start]);

  const allCollected = board ? collected.length === board.targets.length : false;

  const move = useCallback(
    (dir: Direction) => {
      if (!board || won || board.grid[at.r][at.c][dir]) return;

      const next = { r: at.r + DIRECTIONS[dir].dr, c: at.c + DIRECTIONS[dir].dc };
      setAt(next);

      const hit = board.pickups.find(
        (p) => !taken.includes(p.word.id) && p.r === next.r && p.c === next.c,
      );
      if (hit) {
        setTaken((ids) => [...ids, hit.word.id]);
        if (hit.wanted) {
          setCollected((got) => [...got, hit.word.id]);
          setMessage(`Yes — ${hit.word.word}!`);
          speak(`${hit.word.word}. ${hit.word.sentence}`, { rate: 0.85 });
        } else {
          setWrong((n) => n + 1);
          setMessage(`That was ${hit.word.word} — not on your list.`);
          speak(`That is ${hit.word.word}.`, { rate: 0.85 });
        }
        return;
      }

      if (next.r !== board.size - 1 || next.c !== board.size - 1) return;
      if (collected.length === board.targets.length) {
        setWon(true);
        setMessage('You found them all!');
        speak('Well done! You found all the words.', { rate: 0.85 });
        onScore(level);
      } else {
        setMessage('The door needs all three words first.');
      }
    },
    [board, at, taken, collected, won, level, onScore],
  );

  useEffect(() => {
    const keys: Record<string, Direction> = {
      ArrowUp: 'n', ArrowRight: 'e', ArrowDown: 's', ArrowLeft: 'w',
      w: 'n', d: 'e', s: 's', a: 'w',
    };
    const onKey = (event: KeyboardEvent) => {
      const dir = keys[event.key];
      if (!dir) return;
      event.preventDefault();
      move(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  const percent = useMemo(() => (board ? 100 / board.size : 0), [board]);

  if (!board) return <div className="game-loading">Building the maze…</div>;

  const cellStyle = (r: number, c: number) => ({
    left: `${c * percent}%`,
    top: `${r * percent}%`,
    width: `${percent}%`,
    height: `${percent}%`,
  });

  return (
    <div className="game maze-game">
      <div className="game-head">
        <span>Maze {level}</span>
        <span>
          {collected.length} / {board.targets.length} found
          {wrong > 0 && ` · ${wrong} wrong`}
        </span>
      </div>

      <ul className="maze-targets">
        {board.targets.map((word) => (
          <li
            key={word.id}
            className={collected.includes(word.id) ? 'found' : ''}
            style={{ '--accent': colorFor(word) } as React.CSSProperties}
          >
            <span aria-hidden>{collected.includes(word.id) ? '✓' : '○'}</span>
            {word.word}
          </li>
        ))}
      </ul>

      <div
        className="maze-board"
        style={{ '--cells': board.size } as React.CSSProperties}
        onTouchStart={(event) => {
          const t = event.changedTouches[0];
          touch.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(event) => {
          if (!touch.current) return;
          const t = event.changedTouches[0];
          const dx = t.clientX - touch.current.x;
          const dy = t.clientY - touch.current.y;
          touch.current = null;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
          move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n');
        }}
      >
        {board.grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className="maze-cell"
              style={{
                ...cellStyle(r, c),
                borderTopColor: cell.n ? 'currentColor' : 'transparent',
                borderRightColor: cell.e ? 'currentColor' : 'transparent',
                borderBottomColor: cell.s ? 'currentColor' : 'transparent',
                borderLeftColor: cell.w ? 'currentColor' : 'transparent',
              }}
            />
          )),
        )}

        <div className={`maze-door ${allCollected ? 'open' : ''}`} style={cellStyle(board.size - 1, board.size - 1)}>
          <span aria-hidden>{allCollected ? '🚪' : '🔒'}</span>
        </div>

        {board.pickups
          .filter((p) => !taken.includes(p.word.id))
          .map((p) => (
            <div key={p.word.id} className="maze-pickup" style={cellStyle(p.r, p.c)}>
              <WordImage word={p.word} />
            </div>
          ))}

        <div className="maze-player" style={cellStyle(at.r, at.c)}>
          <span aria-hidden>🙂</span>
        </div>
      </div>

      <p className="maze-message" role="status">
        {message}
      </p>

      {won ? (
        <button
          className="next-button"
          onClick={() => {
            const next = level + 1;
            setLevel(next);
            start(next);
          }}
        >
          Next maze <span aria-hidden>→</span>
        </button>
      ) : (
        <div className="dpad" aria-label="Move">
          <button onClick={() => move('n')} aria-label="Move up">↑</button>
          <button onClick={() => move('w')} aria-label="Move left">←</button>
          <button onClick={() => move('s')} aria-label="Move down">↓</button>
          <button onClick={() => move('e')} aria-label="Move right">→</button>
        </div>
      )}
    </div>
  );
}
