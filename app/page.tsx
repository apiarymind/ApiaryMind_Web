import Link from "next/link";
import { Hexagon, ArrowRight, ShieldCheck, BarChart3, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-amber-500 selection:text-black">

      {/* Navbar */}
      <nav className="border-b border-white/10 backdrop-blur-md fixed w-full z-50 top-0 bg-black/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="text-amber-500">
              <Hexagon fill="currentColor" size={28} />
            </div>
            <span>ApiaryMind</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors"
            >
              Zaloguj się
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-bold bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-all flex items-center gap-2"
            >
              Panel Główny <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 pointer-events-none opacity-40">
           <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px]" />
           <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-amber-500 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            System v1.0 Gotowy
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Twoja Pasieka <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-300">
              Pod Kontrolą
            </span>
          </h1>

          <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Zarządzaj ulami, kontroluj leczenie, monitoruj pożytki i magazyn.
            Wszystko w jednym miejscu. Profesjonalne narzędzie dla nowoczesnego pszczelarza.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-amber-500 text-black font-bold text-lg rounded-xl hover:bg-amber-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center gap-2"
            >
              <LayoutDashboard size={20} />
              Otwórz Panel
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/10 transition-all"
            >
              Logowanie
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10 bg-black/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/50 transition-colors group">
              <BarChart3 className="w-10 h-10 text-white/20 group-hover:text-amber-500 transition-colors mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">Pełna Analityka</h3>
              <p className="text-white/50 text-sm">Śledź rozwój rodzin, zbiory miodu i stan magazynowy w czasie rzeczywistym.</p>
           </div>
           <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors group">
              <ShieldCheck className="w-10 h-10 text-white/20 group-hover:text-blue-500 transition-colors mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">Strażnik Karencji</h3>
              <p className="text-white/50 text-sm">System automatycznie pilnuje okresów karencji po zastosowaniu leków (Apiwarol itp.).</p>
           </div>
           <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-colors group">
              <Hexagon className="w-10 h-10 text-white/20 group-hover:text-green-500 transition-colors mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">Magazyn & Sprzęt</h3>
              <p className="text-white/50 text-sm">Kontrola stanów magazynowych sprzętu, ramek i gotowych produktów.</p>
           </div>
        </div>
      </div>

    </main>
  );
}
