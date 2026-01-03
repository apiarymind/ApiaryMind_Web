"use client";

import { ThemeProvider } from "./ThemeProvider";
import AIChat from "./AIChat";
import { AuthProvider } from "../lib/AuthContext";
import Header from "./Header";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/beta';
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <Header />
        <main className={`min-h-screen ${isAuthPage ? '' : 'pt-32'} text-text-dark dark:text-amber-50`}>
          {children}
        </main>
        {!isAuthPage && (
          <footer className="relative z-50 mt-8 pb-4">
            <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-white/50 flex flex-col md:flex-row justify-between gap-2">
              <span>© {new Date().getFullYear()} ApiaryMind. Wszystkie prawa zastrzeżone.</span>
              <span>
                <a href="/regulamin" className="hover:text-primary mr-4 transition-colors">Regulamin</a>
                <a href="/polityka-prywatnosci" className="hover:text-primary transition-colors">Polityka prywatności</a>
              </span>
            </div>
          </footer>
        )}
        {!isAuthPage && <AIChat />}
      </AuthProvider>
    </ThemeProvider>
  );
}


