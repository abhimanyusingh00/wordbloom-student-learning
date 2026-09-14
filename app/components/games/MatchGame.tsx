'use client';

import { useCallback, useEffect, useState } from 'react';
import { WordImage } from '../WordImage';
import { colorFor, quizOptions, sample, type Word } from '@/app/lib/words';
import { useWords } from '@/app/lib/WordsProvider';
import { speak } from '@/app/lib/speech';

const ROUNDS = 10;

type Round = { answer: Word; options: Word[] };

/** Look at the photo, choose the word. Distractors come from the same category. */
export function MatchGame({ onScore }: { onScore: (score: number) => void }) {
  const { practiceWords } = useWords();
  const newRound = useCallback((): Round => {
    const answer = sample(practiceWords, 1)[0];
    return { answer, options: quizOptions(practiceWords, answer, 4) };
  }, [practiceWords]);

  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => setRound(newRound()), [newRound]);

  const next = useCallback(() => {
    setPicked(null);
    setIndex((i) => i + 1);
    setRound(newRound());
  }, [newRound]);

  if (!round) return <div className="game-loading">Getting the pictures ready…</div>;

  if (index >= ROUNDS) {
    return (
      <div className="game-result">
        <p className="result-score">
          {score} <small>/ {ROUNDS}</small>
        </p>
        <h3>{score === ROUNDS ? 'Perfect round!' : score >= 7 ? 'Great work!' : 'Good try!'}</h3>
        <button
          className="next-button"
          onClick={() => {
            setScore(0);
            setIndex(0);
            setPicked(null);
            setRound(newRound());
          }}
        >
          Play again
        </button>
      </div>
    );
  }

  function choose(option: Word) {
    if (picked) return;
    setPicked(option.id);
    const correct = option.id === round!.answer.id;
    if (correct) {
      const nextScore = score + 1;
      setScore(nextScore);
      onScore(nextScore);
    }
    speak(correct ? `Yes! ${round!.answer.word}.` : `That is ${option.word}.`, { rate: 0.8 });
    setTimeout(next, correct ? 1100 : 1700);
  }

  return (
    <div className="game match-game" style={{ '--accent': colorFor(round.answer) } as React.CSSProperties}>
      <div className="game-head">
        <span>
          Round {index + 1} / {ROUNDS}
        </span>
        <span>Score {score}</span>
      </div>

      <h3 className="game-prompt">Which word is this picture?</h3>

      <div className="match-photo">
        <WordImage word={round.answer} eager />
      </div>

      <div className="option-grid">
        {round.options.map((option) => {
          const isAnswer = option.id === round.answer.id;
          const state = !picked ? '' : isAnswer ? 'right' : option.id === picked ? 'wrong' : 'dim';
          return (
            <button key={option.id} className={`option ${state}`} onClick={() => choose(option)}>
              {option.word}
            </button>
          );
        })}
      </div>

      {picked && (
        <p className="game-feedback">
          {picked === round.answer.id ? '✓ ' : '→ '}
          {round.answer.sentence}
        </p>
      )}
    </div>
  );
}
