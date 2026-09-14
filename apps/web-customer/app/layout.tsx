import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@fa/ui/styles.css';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'FA RENT CAR | Rental Mobil Cirebon',
    template: '%s | FA RENT CAR',
  },
  description: 'Informasi layanan rental mobil FA RENT CAR di Cirebon.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
