'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { WordImage } from '../WordImage';
import { colorFor, sample, shuffle, type Word } from '@/app/lib/words';
import { useWords } from '@/app/lib/WordsProvider';
import { speak } from '@/app/lib/speech';

/** Short words only — eight letters is plenty for an early reader. */
const spellableFrom = (pool: readonly Word[]) =>
  pool.filter((w) => w.word.replace(/\s/g, '').length <= 8);

type Letter = { key: string; char: string };

const lettersFor = (word: Word): Letter[] =>
  shuffle(
    word.word
      .replace(/\s/g, '')
      .split('')
      .map((char, i) => ({ key: `${char}-${i}`, char })),
  );

export function SpellGame({ onScore }: { onScore: (score: number) => void }) {
  const { practiceWords } = useWords();
  const spellable = useMemo(() => spellableFrom(practiceWords), [practiceWords]);
  const [target, setTarget] = useState<Word | null>(null);
  const [tray, setTray] = useState<Letter[]>([]);
  const [typed, setTyped] = useState<Letter[]>([]);
  const [solved, setSolved] = useState(0);

  const nextWord = useCallback(() => {
    const word = sample(spellable, 1)[0];
    setTarget(word);
    setTray(lettersFor(word));
    setTyped([]);
    speak(`Spell ${word.word}.`, { rate: 0.8 });
  }, [spellable]);

  useEffect(() => {
    const word = sample(spellable, 1)[0];
    setTarget(word);
    setTray(lettersFor(word));
  }, [spellable]);

  if (!target) return <div className="game-loading">Choosing a word…</div>;

  const answer = target.word.replace(/\s/g, '');
  const attempt = typed.map((l) => l.char).join('');
  const complete = attempt.length === answer.length;
  const correct = complete && attempt === answer;

  function place(letter: Letter) {
    if (complete) return;
    setTray((current) => current.filter((l) => l.key !== letter.key));
    setTyped((current) => [...current, letter]);
  }

  function takeBack(letter: Letter) {
    setTyped((current) => current.filter((l) => l.key !== letter.key));
    setTray((current) => [...current, letter]);
  }

  function check() {
    if (correct) {
      const score = solved + 1;
      setSolved(score);
      onScore(score);
      speak(`${target!.word}. ${target!.sentence}`, { rate: 0.8 });
      setTimeout(nextWord, 1400);
    } else {
      speak(`Not quite. Try again.`, { rate: 0.85 });
      setTray((current) => [...current, ...typed]);
      setTyped([]);
    }
  }

  return (
    <div className="game spell-game" style={{ '--accent': colorFor(target) } as React.CSSProperties}>
      <div className="game-head">
        <span>Spelling</span>
        <span>{solved} spelled</span>
      </div>

      <div className="spell-photo">
        <WordImage word={target} eager />
      </div>

      <button className="link-button" onClick={() => speak(target.word, { rate: 0.6 })}>
        🔊 Hear the word
      </button>

      <div className={`spell-slots ${complete ? (correct ? 'right' : 'wrong') : ''}`}>
        {Array.from({ length: answer.length }, (_, i) => {
          const letter = typed[i];
          return letter ? (
            <button key={letter.key} className="slot filled" onClick={() => takeBack(letter)}>
              {letter.char}
            </button>
          ) : (
            <span key={`empty-${i}`} className="slot" />
          );
        })}
      </div>

      <div className="letter-tray">
        {tray.map((letter) => (
          <button key={letter.key} className="letter" onClick={() => place(letter)}>
            {letter.char}
          </button>
        ))}
      </div>

      <div className="spell-actions">
        <button className="next-button" disabled={!complete} onClick={check}>
          {complete && correct ? '✓ Yes!' : 'Check'}
        </button>
        <button className="ghost-button" onClick={nextWord}>
          Skip word
        </button>
      </div>
    </div>
  );
}
