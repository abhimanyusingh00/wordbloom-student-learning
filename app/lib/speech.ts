/** Small wrapper over the browser speech API: one voice, one gentle rate, never overlapping. */

let cached: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cached) return cached;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  cached =
    voices.find((v) => /samantha|ava|serena|google us english/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith('en') && v.localService) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null;
  return cached;
}

export const speechAvailable = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, { rate = 0.7 }: { rate?: number } = {}) {
  if (!speechAvailable()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = pickVoice();
  utterance.rate = rate;
  utterance.pitch = 1.02;
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (speechAvailable()) window.speechSynthesis.cancel();
}
