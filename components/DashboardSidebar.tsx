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
      return <span className="text-amber-400 font-bold">PSZCZELARZ</span>;
  };

  return (
    <aside className="w-64 bg-brown-800 border-r border-brown-700 min-h-screen flex flex-col">
      <div className="p-4 border-b border-brown-700">
        <h2 className="text-xl font-bold text-amber-500">Panel</h2>
        <div className="text-xs text-amber-200/60 mt-1">
          <div className="truncate">{profile?.email || (userProfile ? "" : "Ładowanie...")}</div>
          <div className="mt-1">{getRoleBadge()}</div>
        </div>
      </div>
      
      <nav className="flex-1 p-2 space-y-1">
        <Link 
          href="/dashboard" 
          className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard') && pathname === '/dashboard' ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
        >
          Pulpit
        </Link>

        {/* BEEKEEPER Menu */}
        <div className="pt-4 px-3 pb-1 text-xs font-bold text-amber-200/40 uppercase">Pszczelarz</div>
        <Link 
          href="/dashboard/hives"
          className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/hives') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
        >
          Ule
        </Link>
        <Link 
          href="/dashboard/apiaries"
          className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/apiaries') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
        >
          Pasieki
        </Link>
        <Link 
          href="/dashboard/inspections"
          className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/inspections') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
        >
          Przeglądy
        </Link>
        <Link 
          href="/dashboard/beekeeper/warehouse"
          className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/beekeeper/warehouse') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
        >
          Magazyn
        </Link>
        <Link 
          href="/dashboard/beekeeper/reports"
          className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/beekeeper/reports') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
        >
          Raporty
        </Link>
        <Link 
          href="/dashboard/beekeeper/beta"
          className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/beekeeper/beta') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
        >
          Beta Testy
        </Link>

        {/* ADMIN Menu Group - Only for admin/super_admin */}
        {(role === 'admin' || role === 'super_admin') && (
          <>
            <div className="pt-4 px-3 pb-1 text-xs font-bold text-amber-200/40 uppercase text-red-400">ADMINISTRACJA</div>
            <Link 
              href="/dashboard/admin/users"
              className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/admin/users') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
            >
              Użytkownicy
            </Link>
             <Link 
              href="/dashboard/admin/approvals"
              className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/admin/approvals') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
            >
              Zatwierdzenia
            </Link>
            <Link 
              href="/dashboard/admin/cms"
              className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/admin/cms') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
            >
              CMS Editor
            </Link>
            <Link 
              href="/dashboard/admin/settings"
              className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/admin/settings') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
            >
              Konfiguracja
            </Link>
          </>
        )}
      </nav>
      
      <div className="p-4 border-t border-brown-700">
         <button onClick={() => logout()} className="text-xs text-amber-200 hover:text-white flex items-center gap-2 w-full text-left">
           🚪 Wyloguj
         </button>
      </div>
    </aside>
  );
}
