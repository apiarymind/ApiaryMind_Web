"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError("Nieprawidłowy email lub hasło.");
      } else {
        const redirect = searchParams.get('redirect') || '/dashboard';
        router.push(redirect);
        router.refresh();
      }
    } catch (err) {
      setError("Wystąpił nieoczekiwany błąd.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // TŁO: Marmur jako baza. W trybie dark dodajemy bg-black jako podkład pod overlay.
    <div className="min-h-screen w-full flex items-center justify-center bg-[url('/assets/marble-texture.jpg')] bg-cover bg-center font-sans px-4 dark:bg-black">

      {/* OVERLAY: Jasny w Light Mode, Mocno przyciemniony w Dark Mode */}
      <div className="absolute inset-0 bg-amber-50/30 dark:bg-black/70 backdrop-blur-[2px] transition-colors duration-500" />

      {/* KARTA: Białe szkło (Light) / Czarne szkło (Dark) */}
      <div className="relative w-full max-w-[420px]
                      bg-white/80 dark:bg-black/60
                      backdrop-blur-xl border border-white/40 dark:border-white/10
                      shadow-2xl rounded-3xl p-8 md:p-10
                      animate-in fade-in zoom-in-95 duration-300">

        {/* --- LOGO --- */}
        <div className="flex items-center justify-center gap-2 mb-8 select-none">
            <span className="text-3xl font-bold text-amber-950 dark:text-white tracking-tight">Apiary</span>

            <div className="w-10 h-10 relative drop-shadow-md">
                 <img src="/assets/beeAI-3d-icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>

            <span className="text-3xl font-bold text-amber-500 tracking-tight">Mind</span>
        </div>

        {/* --- NAGŁÓWEK --- */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-950 dark:text-white mb-2">Witamy Ponownie</h1>
        </div>

        {/* FORMULARZ */}
        <form onSubmit={handleLogin} className="space-y-5">

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-900/60 dark:text-white/60 uppercase tracking-wider ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adres@email.com"
              className="w-full px-4 py-3.5 rounded-xl transition-all
                         bg-amber-50/50 border border-amber-100 text-amber-950 placeholder:text-amber-900/30
                         focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                         dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-900/60 dark:text-white/60 uppercase tracking-wider ml-1">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-xl transition-all
                         bg-amber-50/50 border border-amber-100 text-amber-950 placeholder:text-amber-900/30
                         focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                         dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Zaloguj się"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-amber-900/60 dark:text-white/40 text-sm">
            Nie masz konta?{" "}
            <Link href="/beta" className="font-bold text-amber-600 hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400 transition-colors">
              Zapisz się do programu Beta
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-amber-500" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
