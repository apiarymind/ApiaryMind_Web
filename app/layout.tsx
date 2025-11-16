import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "ApiaryMind – Portal dla pszczelarzy",
  description: "Portal WWW ApiaryMind – pasieki, związki, beta testy i raporty."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-brown-900 text-amber-50">
        <header className="border-b border-brown-700 bg-brown-800/95 backdrop-blur z-20 sticky top-0">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              {/* tu będzie logo – wstawisz <img src="/logo.png" ...> */}
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow">
                <span className="text-xl">🐝</span>
              </div>
              <span className="font-bold tracking-tight text-amber-100">
                ApiaryMind
              </span>
            </div>
            <nav className="hidden md:flex gap-5 text-sm text-amber-100/80">
              <a href="/" className="hover:text-amber-300">Strona główna</a>
              <a href="/dashboard" className="hover:text-amber-300">Panel</a>
              <a href="/beta" className="hover:text-amber-300">Zostań betatesterem</a>
              <a href="/cms" className="hover:text-amber-300">Strony CMS</a>
            </nav>
          </div>
        </header>
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
      </body>
    </html>
  );
}