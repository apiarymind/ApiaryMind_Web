"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/AuthContext";

export default function AdminPanel() {
  const pathname = usePathname();
  const { profile } = useAuth();
  
  const role = (profile as any)?.role || (profile as any)?.system_role?.toLowerCase() || 'user';
  const isAdmin = role === 'admin' || role === 'super_admin';

  const isActive = (path: string) => pathname?.startsWith(path);

  if (!isAdmin) {
    return null;
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 m-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 h-[calc(100vh-32px)] overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold font-heading text-red-400">Administracja</h2>
        <div className="text-xs text-white/60 mt-2">
          <div className="mt-1">
            {role === 'super_admin' ? (
              <span className="text-yellow-400 font-bold">SUPER ADMIN</span>
            ) : (
              <span className="text-red-400 font-bold">ADMIN</span>
            )}
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        <Link 
          href="/dashboard/admin/users"
          className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/admin/users') ? 'bg-red-500 text-white font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
        >
          Użytkownicy
        </Link>
        <Link 
          href="/dashboard/admin/approvals"
          className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/admin/approvals') ? 'bg-red-500 text-white font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
        >
          Zatwierdzenia
        </Link>
        <Link 
          href="/dashboard/admin/surveys"
          className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/admin/surveys') ? 'bg-red-500 text-white font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
        >
          Ankiety
        </Link>
        <Link 
          href="/dashboard/admin/cms-editor"
          className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/admin/cms-editor') ? 'bg-red-500 text-white font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
        >
          CMS Editor
        </Link>
        <Link
          href="/dashboard/admin/configuration"
          className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/admin/configuration') ? 'bg-red-500 text-white font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
        >
          Konfiguracja
        </Link>
        <Link
          href="/dashboard/admin/support"
          className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/admin/support') ? 'bg-red-500 text-white font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
        >
          Zgłoszenia Wsparcia
        </Link>
      </nav>
    </aside>
  );
}

