"use client";

import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import AIChat from "../components/AIChat";
import { AuthProvider } from "../lib/AuthContext";
import { Montserrat, Lato } from 'next/font/google';
import Header from "../components/Header";

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const lato = Lato({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-lato',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${lato.variable} font-sans min-h-screen transition-colors duration-300 bg-light-pattern dark:bg-dark-pattern bg-fixed bg-repeat bg-[length:350px_auto]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Header />
            <main className="min-h-screen pt-32 text-text-dark dark:text-amber-50">
              {children}
            </main>
            <footer className="relative z-50 mt-8 pb-4">
              <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-white/50 flex flex-col md:flex-row justify-between gap-2">
                <span>© {new Date().getFullYear()} ApiaryMind. Wszystkie prawa zastrzeżone.</span>
                <span>
                  <a href="/regulamin" className="hover:text-primary mr-4 transition-colors">Regulamin</a>
                  <a href="/polityka-prywatnosci" className="hover:text-primary transition-colors">Polityka prywatności</a>
                </span>
              </div>
            </footer>
            <AIChat />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
