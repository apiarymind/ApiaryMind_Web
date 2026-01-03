"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../lib/AuthContext";
import { ThemeToggle } from "@/app/components/ui/ThemeToggle";
import { useState } from "react";
import { usePathname } from "next/navigation";

// Helper component for user menu
function UserMenu() {
  const { user, profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
       <Link href="/login" className="text-white hover:text-primary transition-colors font-medium">
         Logowanie
       </Link>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 text-white hover:text-primary transition-colors focus:outline-none"
      >
        <div className="text-right hidden sm:block">
           <div className="text-sm font-bold">{profile?.displayName || user.email}</div>
           <div className="text-[10px] text-white/60 uppercase">{profile?.role || 'Użytkownik'}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-bold text-lg">
           {profile?.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
             <div className="px-4 py-3 border-b border-white/10 sm:hidden">
               <div className="text-sm font-bold text-white">{profile?.displayName || user.email}</div>
               <div className="text-xs text-white/60">{user.email}</div>
             </div>
             <Link href="/dashboard" className="block px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors" onClick={() => setIsOpen(false)}>
               Panel
             </Link>
             <Link href="/dashboard/settings" className="block px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors" onClick={() => setIsOpen(false)}>
               Ustawienia
             </Link>
             <button 
               onClick={() => { logout(); setIsOpen(false); }}
               className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors border-t border-white/10"
             >
               Wyloguj
             </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  
  // Hide header on login, register and beta pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/beta') {
    return null;
  }

  return (
    <header className="fixed top-4 left-0 right-0 mx-auto w-[95%] max-w-7xl z-50 rounded-full backdrop-blur-xl border border-amber-900/10 dark:border-white/20 shadow-2xl bg-white/60 dark:bg-black/60 transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1 font-bold text-xl tracking-tight no-underline">
            <span className="text-amber-950 dark:text-white">Apiary</span>
            <Image src="/assets/bee-3d-icon.png" alt="Logo" width={32} height={32} />
            <span className="text-amber-500">Mind</span>
          </Link>
        </div>
        
        <nav className="flex gap-6 text-sm font-sans items-center text-amber-950 dark:text-white">
          <Link href="/" className="hover:text-primary transition-colors hidden md:block">Strona główna</Link>
          <UserMenu />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
