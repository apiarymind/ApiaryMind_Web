"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setSession } from "../actions/auth-session";

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
    <div className="min-h-screen bg-brown-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-brown-800 p-8 rounded-xl border border-brown-700 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐝</div>
          <h1 className="text-2xl font-bold text-amber-500">Logowanie</h1>
          <p className="text-amber-200/60 text-sm mt-1">Zaloguj się do konta ApiaryMind</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-amber-200 uppercase block mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brown-900 border border-brown-600 rounded p-2 text-amber-100 outline-none focus:border-amber-500"
              required
            />
          </div>
          <div>
             <label className="text-xs font-bold text-amber-200 uppercase block mb-1">Hasło</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brown-900 border border-brown-600 rounded p-2 text-amber-100 outline-none focus:border-amber-500"
              required
            />
          </div>

          {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900">{error}</div>}

          <button 
            type="submit" 
            className="w-full bg-amber-500 hover:bg-amber-400 text-brown-900 font-bold py-2 rounded shadow transition-colors"
          >
            Zaloguj się
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-amber-200/60">
           Nie masz konta? <Link href="/beta" className="text-amber-400 hover:text-amber-300">Zapisz się do programu Beta</Link>
        </div>
      </div>
    </div>
  );
}
