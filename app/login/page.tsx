"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setSession } from "../actions/auth-session";
import { GlassCard } from "@/app/components/ui/GlassCard";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Set server session cookie
      await setSession(userCredential.user.uid);
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError("Nieprawidłowy email lub hasło.");
      } else {
        setError("Wystąpił błąd logowania: " + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐝</div>
          <h1 className="text-2xl font-bold font-heading text-primary">Logowanie</h1>
          <p className="text-text-dark/60 dark:text-amber-200/60 text-sm mt-1">Zaloguj się do konta ApiaryMind</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-text-dark dark:text-amber-200 uppercase block mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-brown-600 rounded p-2 text-text-dark dark:text-amber-100 outline-none focus:border-primary backdrop-blur-sm transition-all"
              required
            />
          </div>
          <div>
             <label className="text-xs font-bold text-text-dark dark:text-amber-200 uppercase block mb-1">Hasło</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-brown-600 rounded p-2 text-text-dark dark:text-amber-100 outline-none focus:border-primary backdrop-blur-sm transition-all"
              required
            />
          </div>

          {error && <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-100 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-900">{error}</div>}

          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-amber-400 text-brown-900 font-bold py-2 rounded shadow transition-colors"
          >
            Zaloguj się
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-text-dark/60 dark:text-amber-200/60">
           Nie masz konta? <Link href="/beta" className="text-primary hover:text-amber-400 font-semibold">Zapisz się do programu Beta</Link>
        </div>
      </GlassCard>
    </div>
  );
}
