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
    // CONTAINER: Premium Dark Gradient
    // from-gray-900 to-black. No images.
    <div className="fixed inset-0 w-full min-h-screen flex items-center justify-center font-sans px-4
                    bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#0a0a0a] to-black">

      {/* Subtelny pattern (opcjonalnie, zrobiony CSS-em lub bardzo delikatny overlay) */}
      <div className="absolute inset-0 bg-[url('/assets/hex-pattern.png')] opacity-[0.03] pointer-events-none bg-repeat bg-[length:50px_50px]" />

      {/* KARTA LOGOWANIA */}
      <div className="relative w-full max-w-[420px]
                      bg-[#111]/90 backdrop-blur-xl
                      border border-white/5
                      shadow-2xl shadow-black/80 rounded-3xl p-8 md:p-10
                      animate-in fade-in zoom-in-95 duration-500">

        {/* --- LOGO --- */}
        <div className="flex items-center justify-center gap-3 mb-10 select-none">
            <span className="text-3xl font-bold text-white tracking-tight">Apiary</span>

            <div className="w-10 h-10 relative drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                 <img src="/assets/beeAI-3d-icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>

            <span className="text-3xl font-bold text-amber-500 tracking-tight">Mind</span>
        </div>

        {/* --- NAGŁÓWEK --- */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Witamy Ponownie</h1>
          <p className="text-gray-400 text-sm">Zaloguj się do swojego konta</p>
        </div>

        {/* FORMULARZ */}
        <form onSubmit={handleLogin} className="space-y-5">

          {error && (
            <div className="p-3 rounded-xl bg-red-900/20 border border-red-900/50 text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adres@email.com"
              className="w-full px-4 py-3.5 rounded-xl transition-all duration-300
                         bg-[#1a1a1a] border border-gray-800 text-gray-100 placeholder:text-gray-600
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         hover:border-gray-700"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-xl transition-all duration-300
                         bg-[#1a1a1a] border border-gray-800 text-gray-100 placeholder:text-gray-600
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         hover:border-gray-700"
              required
            />
          </div>

          <div className="pt-2">
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg
                        shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]
                        active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : "Zaloguj się"}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-gray-500 text-sm">
            Nie masz konta?{" "}
            <Link href="/beta" className="font-bold text-amber-500 hover:text-amber-400 transition-colors">
              Dołącz do programu Beta
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
