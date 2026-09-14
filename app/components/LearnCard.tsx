'use client';

import { useEffect, useState } from 'react';
import { WordImage } from './WordImage';
import { colorFor, type Word } from '@/app/lib/words';
import { speak, stopSpeaking } from '@/app/lib/speech';

type Props = {
  deck: Word[];
  index: number;
  onIndex: (next: number) => void;
  learned: string[];
  onToggleLearned: (id: string) => void;
  onExit: () => void;
};

/**
 * The distraction-free lesson: one photo, one word, one sentence. Sound plays
 * automatically on each new card and the child moves on with a single button.
 */
export function LearnCard({ deck, index, onIndex, learned, onToggleLearned, onExit }: Props) {
  const [muted, setMuted] = useState(false);
  const word = deck.length ? deck[index % deck.length] : undefined;
  const isLearned = word ? learned.includes(word.id) : false;

  useEffect(() => {
    if (muted || !word) return;
    // A short pause lets the new picture paint before the voice starts.
    const timer = setTimeout(() => speak(`${word.word}. ${word.sentence}`), 350);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [word, muted]);

  useEffect(() => stopSpeaking, []);

  const step = (direction: number) => {
    if (!deck.length) return;
    onIndex((index + direction + deck.length) % deck.length);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === ' ') step(1);
      if (event.key === 'ArrowLeft') step(-1);
      if (event.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!word) {
    return (
      <div className="lesson">
        <div className="lesson-bar">
          <button className="ghost-button" onClick={onExit}>
            ← Back
          </button>
        </div>
        <p className="lesson-sentence">No words are available to practise yet.</p>
      </div>
    );
  }

  return (
    <div className="lesson" style={{ '--accent': colorFor(word) } as React.CSSProperties}>
      <div className="lesson-bar">
        <button className="ghost-button" onClick={onExit}>
          ← Back
        </button>
        <p className="lesson-counter">
          Word {(index % deck.length) + 1} of {deck.length}
        </p>
        <button
          className="ghost-button"
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
        >
          {muted ? '🔇 Sound off' : '🔊 Sound on'}
        </button>
      </div>

      <div className="lesson-stage">
        <div className="lesson-photo">
          <WordImage word={word} eager />
        </div>
        <div className="lesson-copy">
          <h1>{word.word}</h1>
          <p className="lesson-sentence">{word.sentence}</p>
          <button className="link-button" onClick={() => speak(`${word.word}. ${word.sentence}`)}>
            🔊 Say it again
          </button>
        </div>
      </div>

      <div className="lesson-controls">
        <button className="round-button" onClick={() => step(-1)} aria-label="Previous word">
          ←
        </button>
        <button className="next-button" onClick={() => step(1)}>
          Next word <span aria-hidden>→</span>
        </button>
        <button
          className={`round-button star ${isLearned ? 'on' : ''}`}
          onClick={() => onToggleLearned(word.id)}
          aria-pressed={isLearned}
          aria-label={isLearned ? 'Learned' : 'Mark as learned'}
        >
          {isLearned ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
}
