import type { ReactNode } from 'react';
import { Suspense } from 'react';
import './globals.css';
import { PageTransition } from '@/shared/ui/PageTransition';
import { DarkModeProvider } from '@/shared/lib/darkMode';

export const metadata = {
  title: 'TF2 Market Tracker',
  description: 'Real-time TF2 market pricing',
};

const darkModeScript = `
(function() {
  try {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
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