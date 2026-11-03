import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'TF2 Market Tracker',
  description: 'Real-time TF2 market pricing',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
