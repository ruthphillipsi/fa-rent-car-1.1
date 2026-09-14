import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@fa/ui/styles.css';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Operations Hub | FA RENT CAR',
    template: '%s | Operations Hub',
  },
  description: 'Pusat kendali operasional FA RENT CAR.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
