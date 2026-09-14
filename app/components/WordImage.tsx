import { asset } from '@/app/lib/assets';
import type { Word } from '@/app/lib/words';

type Props = {
  word: Word;
  /** The one image above the fold should not wait for lazy loading. */
  eager?: boolean;
  className?: string;
};

/**
 * Every picture is a real photograph shipped with the site, so there is no
 * network call at runtime and no chance of a stray image loading for a word.
 */
export function WordImage({ word, eager = false, className }: Props) {
  return (
    <img
      className={className}
      src={asset(word.image)}
      alt={`A photograph of ${word.word}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  );
}
