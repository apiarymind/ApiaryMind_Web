"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import ApiaryMindLogo from "@/components/ApiaryMindLogo";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setError("Nieprawidłowy email lub hasło.");
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError("Wystąpił nieoczekiwany błąd.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    await performLogin(email, password);
    setIsLoading(false);
  };

  const handleDemoLogin = async () => {
    console.log('🔵 [Demo Login] Rozpoczynam logowanie anonimowe...');
    
    // DEMO OVERRIDE: Wyczyść wszystkie flagi tutorial_* przed logowaniem
    // Aby wymusić start onboardingu od początku
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tutorial_disabled');
      localStorage.removeItem('tutorial_completed');
      localStorage.removeItem('onboarding_step1_manual_complete');
      console.log('🔵 [Demo Login] Cleared tutorial flags from localStorage');
    }
    
    setIsDemoLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('❌ [Demo Login] Błąd signInAnonymously:', error);
        setError(`Nie udało się uruchomić wersji DEMO: ${error.message || 'Nieznany błąd'}. Sprawdź czy Anonymous Sign-ins są włączone w Supabase.`);
        setIsDemoLoading(false);
        return;
      }

      if (!data?.user) {
        console.error('❌ [Demo Login] Brak danych użytkownika');
        setError("Nie udało się utworzyć sesji DEMO. Spróbuj ponownie.");
        setIsDemoLoading(false);
        return;
      }

      console.log('✅ [Demo Login] Użytkownik utworzony:', {
        id: data.user.id,
        is_anonymous: data.user.is_anonymous,
        email: data.user.email || '(brak email)'
      });

      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ [Demo Login] Błąd sesji:', sessionError);
        setError(`Błąd sesji: ${sessionError.message}`);
        setIsDemoLoading(false);
        return;
      }

      if (!session) {
        console.error('❌ [Demo Login] Brak sesji po zalogowaniu');
        setError("Sesja DEMO nie została utworzona. Spróbuj ponownie.");
        setIsDemoLoading(false);
        return;
      }

      console.log('✅ [Demo Login] Sesja utworzona pomyślnie');

      // Don't wait for profile - let AuthContext handle it
      // Profile will be created by trigger or AuthContext if needed
      console.log('🔄 [Demo Login] Przekierowuję do dashboardu...');
      const redirect = searchParams.get('redirect') || '/dashboard';
      
      // Use router.push instead of window.location for better integration with Next.js
      router.push(redirect);
      router.refresh();
      
      // Note: setIsDemoLoading(false) is not called here because we're redirecting
    } catch (err: any) {
      console.error('❌ [Demo Login] Wyjątek:', err);
      setError(`Wystąpił nieoczekiwany błąd podczas uruchamiania DEMO: ${err?.message || 'Nieznany błąd'}`);
      setIsDemoLoading(false);
    }
  };

  return (
    // CONTAINER
    // Light Mode: Marble texture background.
    // Dark Mode: Transparent to show page background
    <div className="min-h-screen w-full flex items-center justify-center font-sans px-4
                    bg-[url('/assets/bg-light-pattern.png')] bg-cover bg-center 
                    dark:bg-transparent">
      
      {/* OVERLAY for Light Mode only (adds warmth to marble). Hidden in Dark Mode. */}
      <div className="absolute inset-0 bg-amber-50/30 pointer-events-none dark:hidden" />

      {/* KARTA */}
      <div className="relative w-full max-w-[420px] z-10
                      bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 md:p-10 
                      
                      dark:bg-primary/15 dark:backdrop-blur-xl dark:border-primary/30 dark:shadow-black/50
                      
                      animate-in fade-in zoom-in-95 duration-300">
        
        {/* --- LOGO --- */}
        <div className="flex items-center justify-center mb-8 select-none">
          <ApiaryMindLogo className="justify-center" />
        </div>

        {/* --- NAGŁÓWEK --- */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-950 dark:text-white mb-2">Witamy Ponownie</h1>
        </div>

        {/* FORMULARZ */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 
                            dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-900/60 dark:text-gray-400 uppercase tracking-wider ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adres@email.com"
              className="w-full px-4 py-3.5 rounded-xl transition-all
                         bg-amber-50/50 border border-amber-100 text-amber-950 placeholder:text-amber-900/30 
                         focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                         
                         dark:bg-primary/15 dark:border-primary/30 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-amber-500/40 dark:focus:border-amber-500/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-900/60 dark:text-gray-400 uppercase tracking-wider ml-1">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-xl transition-all
                         bg-amber-50/50 border border-amber-100 text-amber-950 placeholder:text-amber-900/30 
                         focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                         
                         dark:bg-primary/15 dark:border-primary/30 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-amber-500/40 dark:focus:border-amber-500/50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isDemoLoading}
            className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4
                       dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-black dark:shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Zaloguj się"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-amber-900/50 dark:text-white/40">
          <span className="flex-1 h-px bg-amber-200/60 dark:bg-white/10" />
          LUB
          <span className="flex-1 h-px bg-amber-200/60 dark:bg-white/10" />
        </div>

        <button
          onClick={handleDemoLogin}
          disabled={isLoading || isDemoLoading}
          className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDemoLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "DEMO"
          )}
        </button>

        <div className="mt-8 text-center">
          <p className="text-amber-900/60 dark:text-gray-400 text-sm">
            Nie masz konta?{" "}
            <Link href="/beta" className="font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 transition-colors">
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
