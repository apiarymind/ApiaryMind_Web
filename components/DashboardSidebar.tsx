"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/AuthContext";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const role = profile?.role;

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <aside className="w-64 bg-brown-800 border-r border-brown-700 min-h-screen flex flex-col">
      <div className="p-4 border-b border-brown-700">
        <h2 className="text-xl font-bold text-amber-500">Panel</h2>
        <p className="text-xs text-amber-200/60 mt-1">
          {profile?.email} <br/>
          <span className="font-semibold text-amber-400">{role}</span>
        </p>
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
          href="/dashboard/beekeeper/apiaries"
          className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/beekeeper/apiaries') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
        >
          Pasieki
        </Link>
        <Link 
          href="/dashboard/beekeeper/inspections"
          className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/beekeeper/inspections') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
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

        {/* ASSOCIATION ADMIN Menu */}
        {(role === 'ASSOCIATION_ADMIN' || role === 'SUPER_ADMIN') && (
          <>
            <div className="pt-4 px-3 pb-1 text-xs font-bold text-amber-200/40 uppercase">Związek</div>
            <Link 
              href="/dashboard/association/members"
              className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/association/members') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
            >
              Członkowie
            </Link>
            <Link 
              href="/dashboard/association/calendar"
              className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/association/calendar') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
            >
              Kalendarz
            </Link>
            <Link 
              href="/dashboard/association/announcements"
              className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/association/announcements') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
            >
              Ogłoszenia
            </Link>
          </>
        )}

        {/* SUPER ADMIN Menu */}
        {role === 'SUPER_ADMIN' && (
          <>
            <div className="pt-4 px-3 pb-1 text-xs font-bold text-amber-200/40 uppercase">Admin</div>
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
              href="/dashboard/admin/beta"
              className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/admin/beta') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
            >
              Zgłoszenia Beta
            </Link>
            <Link 
              href="/dashboard/admin/cms"
              className={`block px-3 py-2 rounded text-sm ${isActive('/dashboard/admin/cms') ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
            >
              CMS Editor
            </Link>
          </>
        )}
      </nav>
      
      <div className="p-4 border-t border-brown-700">
         <Link href="/logout" className="text-xs text-amber-200 hover:text-white flex items-center gap-2">
           🚪 Wyloguj
         </Link>
      </div>
    </aside>
  );
}
