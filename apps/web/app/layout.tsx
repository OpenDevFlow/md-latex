import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'md-latex — Markdown to LaTeX Editor',
  description:
    'Real-time Markdown to LaTeX transpiler with live preview. Write what you know, output what you need. Built for researchers, students, and academics.',
  keywords: ['markdown', 'latex', 'converter', 'transpiler', 'academic writing', 'research'],
  authors: [{ name: 'md-latex' }],
  openGraph: {
    title: 'md-latex — Markdown to LaTeX Editor',
    description: 'Real-time Markdown to LaTeX transpiler with live preview.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d1117',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        {/* JetBrains Mono for code/editor surfaces */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
