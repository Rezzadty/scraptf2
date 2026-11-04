import type { ReactNode } from 'react';
import { Suspense } from 'react';
import './globals.css';
import { PageTransition } from '@/shared/ui/PageTransition';
import { DarkModeProvider } from '@/shared/lib/darkMode';

export const metadata = {
  title: 'TF2 Market Tracker',
  description: 'Real-time TF2 market pricing',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <DarkModeProvider>
          {children}
          <Suspense fallback={null}>
            <PageTransition />
          </Suspense>
        </DarkModeProvider>
      </body>
    </html>
  );
}
