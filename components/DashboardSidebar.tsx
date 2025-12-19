"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import { UserProfile } from "@/utils/profile-mapper";

interface DashboardSidebarProps {
  userProfile?: UserProfile | null;
}

export default function DashboardSidebar({ userProfile }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { profile: clientProfile, logout } = useAuth();
  
  // Prefer server-fetched userProfile, fall back to clientProfile
  const profile = userProfile || clientProfile;
  const role = profile?.role || 'user';

  const isActive = (path: string) => pathname?.startsWith(path);

  const getRoleBadge = () => {
      if (role === 'super_admin') return <span className="text-yellow-400 font-bold">SUPER ADMIN</span>;
      if (role === 'admin') return <span className="text-red-400 font-bold">ADMIN</span>;
      return <span className="text-primary font-bold">PSZCZELARZ</span>;
  };

  return (
    <aside className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 min-h-screen flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xl font-bold font-heading text-primary">Panel</h2>
        <div className="text-xs text-text-dark/60 dark:text-amber-200/60 mt-1">
          <div className="truncate font-sans text-white/80">{profile?.email || (userProfile ? "" : "Ładowanie...")}</div>
          <div className="mt-1">{getRoleBadge()}</div>
        </div>
      </div>
      
      <nav className="flex-1 p-2 space-y-1">
        <Link 
          href="/dashboard" 
          className={`block px-3 py-2 rounded text-sm transition-colors ${isActive('/dashboard') && pathname === '/dashboard' ? 'bg-primary text-brown-900 font-bold' : 'text-white/80 hover:bg-white/10'}`}
        >
          Pulpit
        </Link>

        {/* BEEKEEPER Menu */}
        <div className="pt-4 px-3 pb-1 text-xs font-bold text-white/40 uppercase">Pszczelarz</div>
        <Link 
          href="/dashboard/hives"
          className={`block px-3 py-2 rounded text-sm transition-colors ${isActive('/dashboard/hives') ? 'bg-primary text-brown-900 font-bold' : 'text-white/80 hover:bg-white/10'}`}
        >
          Ule
        </Link>
        <Link 
          href="/dashboard/apiaries"
          className={`block px-3 py-2 rounded text-sm transition-colors ${isActive('/dashboard/apiaries') ? 'bg-primary text-brown-900 font-bold' : 'text-white/80 hover:bg-white/10'}`}
        >
          Pasieki
        </Link>
        <Link 
          href="/dashboard/inspections"
          className={`block px-3 py-2 rounded text-sm transition-colors ${isActive('/dashboard/inspections') ? 'bg-primary text-brown-900 font-bold' : 'text-white/80 hover:bg-white/10'}`}
        >
          Przeglądy
        </Link>
        <Link 
          href="/dashboard/beekeeper/warehouse"
          className={`block px-3 py-2 rounded text-sm transition-colors ${isActive('/dashboard/beekeeper/warehouse') ? 'bg-primary text-brown-900 font-bold' : 'text-white/80 hover:bg-white/10'}`}
        >
          Magazyn
        </Link>
        <Link 
          href="/dashboard/beekeeper/reports"
          className={`block px-3 py-2 rounded text-sm transition-colors ${isActive('/dashboard/beekeeper/reports') ? 'bg-primary text-brown-900 font-bold' : 'text-white/80 hover:bg-white/10'}`}
        >
          Raporty
        </Link>
        <Link 
          href="/dashboard/beekeeper/beta"
          className={`block px-3 py-2 rounded text-sm transition-colors ${isActive('/dashboard/beekeeper/beta') ? 'bg-primary text-brown-900 font-bold' : 'text-white/80 hover:bg-white/10'}`}
        >
          Beta Testy
        </Link>

        {/* ADMIN Menu Group - Only for admin/super_admin */}
        {(role === 'admin' || role === 'super_admin') && (
          <>
            <div className="pt-4 px-3 pb-1 text-xs font-bold text-red-400/80 uppercase">ADMINISTRACJA</div>
            <Link 
              href="/dashboard/admin/users"
              className={`block px-3 py-2 rounded text-sm transition-colors ${isActive('/dashboard/admin/users') ? 'bg-primary text-brown-900 font-bold' : 'text-white/80 hover:bg-white/10'}`}
            >
              Użytkownicy
            </Link>
             <Link 
              href="/dashboard/admin/approvals"
              className={`block px-3 py-2 rounded text-sm transition-colors ${isActive('/dashboard/admin/approvals') ? 'bg-primary text-brown-900 font-bold' : 'text-white/80 hover:bg-white/10'}`}
            >
              Zatwierdzenia
            </Link>
            <Link 
              href="/dashboard/admin/cms"
              className={`block px-3 py-2 rounded text-sm transition-colors ${isActive('/dashboard/admin/cms') ? 'bg-primary text-brown-900 font-bold' : 'text-white/80 hover:bg-white/10'}`}
            >
              CMS Editor
            </Link>
            <Link 
              href="/dashboard/admin/settings"
              className={`block px-3 py-2 rounded text-sm transition-colors ${isActive('/dashboard/admin/settings') ? 'bg-primary text-brown-900 font-bold' : 'text-white/80 hover:bg-white/10'}`}
            >
              Konfiguracja
            </Link>
          </>
        )}
      </nav>
      
      <div className="p-4 border-t border-white/10">
         <button onClick={() => logout()} className="text-xs text-white/60 hover:text-white flex items-center gap-2 w-full text-left transition-colors">
           🚪 Wyloguj
         </button>
      </div>
    </aside>
  );
}
