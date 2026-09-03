import type { Metadata } from 'next';
import './globals.css';
import './library.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://wordbloom-student-words.abhimanyusingh-as919.chatgpt.site'),
  title: 'WordBloom — See it. Hear it. Say it!',
  description: 'A joyful picture dictionary with 1,000+ words for young learners.',
  openGraph: {
    title: 'WordBloom — See it. Hear it. Say it!',
    description: 'A joyful picture dictionary with 1,200 spoken practice cards for young learners.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WordBloom — See it. Hear it. Say it!',
    description: 'A joyful picture dictionary with 1,200 spoken practice cards for young learners.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
