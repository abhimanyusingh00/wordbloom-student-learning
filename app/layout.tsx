import type { Metadata } from 'next';
import './globals.css';
import './styles/lesson.css';
import './styles/library.css';
import './styles/games.css';
import './styles/credits.css';

const description =
  'A picture dictionary of everyday English words, each with a real photograph, a spoken sentence, and four games to practise.';

export const metadata: Metadata = {
  metadataBase: new URL('https://wordbloom-student-words.abhimanyusingh-as919.chatgpt.site'),
  title: 'WordBloom — See it. Hear it. Say it!',
  description,
  openGraph: {
    title: 'WordBloom — See it. Hear it. Say it!',
    description,
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordBloom — See it. Hear it. Say it!',
    description,
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
