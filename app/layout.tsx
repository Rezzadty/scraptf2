import type { ReactNode } from 'react';
import { Suspense } from 'react';
import './globals.css';
import { PageTransition } from '@/shared/ui/PageTransition';

export const metadata = {
  title: 'TF2 Market Tracker',
  description: 'Real-time TF2 market pricing',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Suspense fallback={null}>
          <PageTransition />
        </Suspense>
      </body>
    </html>
  );
}
