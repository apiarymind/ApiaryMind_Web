"use client";

import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import AIChat from "../components/AIChat";
import Link from "next/link";
import { AuthProvider, useAuth } from "../lib/AuthContext";
import { usePathname } from "next/navigation";
import { Montserrat, Lato } from 'next/font/google';
import { ThemeToggle } from "./components/ui/ThemeToggle";

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

// Extract Header to a client component inside RootLayout to access Auth
function Header() {
  const { user } = useAuth();
  
  return (
    <header className="fixed top-4 left-0 right-0 mx-auto w-[95%] max-w-7xl z-50 rounded-full backdrop-blur-xl border border-white/20 shadow-2xl bg-white/60 dark:bg-black/30 transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow">
              <span className="text-xl">🐝</span>
            </div>
            <span className="font-heading font-bold tracking-tight text-text-dark dark:text-amber-100">
              ApiaryMind
            </span>
          </Link>
        </div>
        <nav className="hidden md:flex gap-5 text-sm font-sans items-center text-text-dark dark:text-amber-100/80">
          <Link href="/" className="hover:text-primary transition-colors">Strona główna</Link>
          {user ? (
             <Link href="/dashboard" className="hover:text-primary font-semibold">Panel</Link>
          ) : (
             <Link href="/login" className="hover:text-primary transition-colors">Logowanie</Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

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
            <footer className="mt-8">
              <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-text-dark/80 dark:text-amber-200/80 flex flex-col md:flex-row justify-between gap-2">
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
