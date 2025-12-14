"use client";

import "./globals.css";
import { ThemeProvider } from "../lib/ThemeContext";
import ThemeSettings from "../components/ThemeSettings";
import AIChat from "../components/AIChat";
import Link from "next/link";
import { AuthProvider, useAuth } from "../lib/AuthContext";
import { usePathname } from "next/navigation";

// Extract Header to a client component inside RootLayout to access Auth
function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Don't show header on dashboard pages as they have their own sidebar (usually), 
  // BUT the requirement says "Link „Panel” w headerze".
  // So we keep it global.

  return (
    <header className="border-b border-brown-700 bg-brown-800/95 backdrop-blur z-20 sticky top-0">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow">
              <span className="text-xl">🐝</span>
            </div>
            <span className="font-bold tracking-tight text-amber-100">
              ApiaryMind
            </span>
          </Link>
        </div>
        <nav className="hidden md:flex gap-5 text-sm text-amber-100/80 items-center">
          <Link href="/" className="hover:text-amber-300">Strona główna</Link>
          {user ? (
             <Link href="/dashboard" className="hover:text-amber-300 font-semibold text-amber-400">Panel</Link>
          ) : (
             <Link href="/login" className="hover:text-amber-300">Logowanie</Link>
          )}
          <ThemeSettings />
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-brown-900 text-amber-50">
        <ThemeProvider>
          {/* 
            Wrap entire app in AuthProvider so the Header knows the state.
            Note: DashboardLayout also has AuthProvider, nesting them is okay (inner one usually uses context from outer or we remove inner).
            Actually, since AuthProvider creates state, we should have it ONCE at root. 
            I will remove AuthProvider from DashboardLayout in a future step or assume multiple providers works (but it's inefficient).
            Better: Put AuthProvider here.
          */}
          <AuthProvider>
            <Header />
            <main className="min-h-screen bg-brown-900 text-amber-50">
              {children}
            </main>
            <footer className="border-t border-brown-700 bg-brown-800 mt-8">
              <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-amber-200/80 flex flex-col md:flex-row justify-between gap-2">
                <span>© {new Date().getFullYear()} ApiaryMind. Wszystkie prawa zastrzeżone.</span>
                <span>
                  <a href="/regulamin" className="hover:text-amber-300 mr-4">Regulamin</a>
                  <a href="/polityka-prywatnosci" className="hover:text-amber-300">Polityka prywatności</a>
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
