"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { UserProfile } from "@/utils/profile-mapper";
import DashboardNews from "@/app/components/DashboardNews";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DashboardSidebarProps {
  userProfile?: UserProfile | null;
  newsContent?: string;
  newsPosition?: 'top_banner' | 'modal_popup' | 'sidebar_widget' | 'hidden';
}

export default function DashboardSidebar({ userProfile, newsContent, newsPosition }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { profile: clientProfile } = useAuth();
  
  // Prefer server-fetched userProfile, fall back to clientProfile
  const profile = userProfile || clientProfile;
  const role = (profile as any)?.role || (profile as any)?.system_role?.toLowerCase() || 'user';
  // Use 'any' cast because UserProfile might not have 'plan' in some contexts or types might differ slightly, but we know it should be there.
  // Actually, let's try to access it safely. If it's missing, assume FREE.
  const plan = (profile as any)?.plan || 'FREE';

  const isActive = (path: string) => pathname?.startsWith(path);
  
  // Custom logic for Hives vs Apiaries
  const isHivesActive = isActive('/dashboard/hives') || pathname?.includes('/hive/');
  const isApiariesActive = isActive('/dashboard/apiaries') && !pathname?.includes('/hive/');

  // State for collapsible sections
  const [isBeekeeperOpen, setIsBeekeeperOpen] = useState(true);
  const [isAssociationOpen, setIsAssociationOpen] = useState(true);
  const [isBreederOpen, setIsBreederOpen] = useState(true);

  const getRoleBadge = () => {
      if (role === 'super_admin') return <span className="text-yellow-400 font-bold">SUPER ADMIN</span>;
      if (role === 'admin') return <span className="text-red-400 font-bold">ADMIN</span>;
      return <span className="text-primary font-bold">PSZCZELARZ</span>;
  };

  const showBreeder = plan === 'PRO_PLUS' || plan === 'BUSINESS' || role === 'super_admin';

  return (
    <aside className="hidden md:flex flex-col w-64 m-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 h-[calc(100vh-32px)] overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold font-heading text-primary">Panel</h2>
        <div className="text-xs text-white/60 mt-2">
          <div className="mt-1">{getRoleBadge()}</div>
        </div>
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        <Link 
          href="/dashboard" 
          className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard') && pathname === '/dashboard' ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
        >
          Pulpit
        </Link>

        {/* BEEKEEPER Menu */}
        <div className="pt-6">
          <button
            onClick={() => setIsBeekeeperOpen(!isBeekeeperOpen)}
            className="w-full px-4 pb-2 flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white/60 transition-colors"
          >
            <span>Pszczelarz</span>
            {isBeekeeperOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isBeekeeperOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-1">
              <Link 
                href="/dashboard/hives"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isHivesActive ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Ule
              </Link>
              <Link 
                href="/dashboard/apiaries"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isApiariesActive ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Pasieki
              </Link>
              <Link 
                href="/dashboard/inspections"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/inspections') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Przeglądy
              </Link>
              <Link 
                href="/dashboard/beekeeper/warehouse"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/beekeeper/warehouse') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Magazyn
              </Link>
              <Link 
                href="/dashboard/beekeeper/import"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/beekeeper/import') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Import Danych
              </Link>
              <Link 
                href="/dashboard/marketplace"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/marketplace') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Marketplace
              </Link>
              <Link 
                href="/dashboard/beekeeper/reports"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/beekeeper/reports') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Raporty
              </Link>
              <Link 
                href="/dashboard/beekeeper/beta"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/beekeeper/beta') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Beta Testy
              </Link>
              {(plan === 'PLUS' || plan === 'PRO' || plan === 'PRO_PLUS' || plan === 'BUSINESS') && (
                <Link 
                  href="/dashboard/support"
                  className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/support') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
                >
                  Wsparcie Techniczne
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ASSOCIATION Menu - For association members */}
        <div className="pt-6">
          <button
            onClick={() => setIsAssociationOpen(!isAssociationOpen)}
            className="w-full px-4 pb-2 flex items-center justify-between text-[10px] font-bold text-blue-400/80 uppercase tracking-widest hover:text-blue-400 transition-colors"
          >
            <span>ZWIĄZEK / KOŁO</span>
            {isAssociationOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAssociationOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-1">
              <Link 
                href="/dashboard/association"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/association') && pathname === '/dashboard/association' ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Pulpit Związku
              </Link>
              <Link 
                href="/dashboard/association/members"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/association/members') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Członkowie
              </Link>
              <Link 
                href="/dashboard/association/announcements"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/association/announcements') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Ogłoszenia
              </Link>
              <Link 
                href="/dashboard/association/calendar"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/association/calendar') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Kalendarz
              </Link>
              <Link 
                href="/dashboard/association/finances"
                className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/association/finances') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
              >
                Finanse
              </Link>
            </div>
          </div>
        </div>

        {/* BREEDER Menu - For PRO_PLUS/BUSINESS */}
        {showBreeder && (
          <div className="pt-6">
            <button
              onClick={() => setIsBreederOpen(!isBreederOpen)}
              className="w-full px-4 pb-2 flex items-center justify-between text-[10px] font-bold text-yellow-500/80 uppercase tracking-widest hover:text-yellow-500 transition-colors"
            >
              <span>HODOWLA</span>
              {isBreederOpen ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isBreederOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-1">
                <Link 
                  href="/dashboard/breeder/team"
                  className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/breeder/team') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
                >
                  Mój Zespół
                </Link>
                <Link 
                  href="/dashboard/breeder/mothers"
                  className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/breeder/mothers') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
                >
                  Matki Reprodukcyjne
                </Link>
                <Link 
                  href="/dashboard/breeder/production"
                  className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/breeder/production') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
                >
                  Serie Mateczne
                </Link>
                <Link 
                  href="/dashboard/breeder/nucs"
                  className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/breeder/nucs') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
                >
                  Uliki Weselne
                </Link>
                <Link 
                  href="/dashboard/breeder/calendar"
                  className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/breeder/calendar') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
                >
                  Kalendarz Zadań
                </Link>
                <Link 
                  href="/dashboard/breeder/stats"
                  className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive('/dashboard/breeder/stats') ? 'bg-primary text-brown-900 font-bold shadow-lg' : 'text-white/80 hover:bg-white/10 hover:translate-x-1'}`}
                >
                  Statystyki
                </Link>
              </div>
            </div>
          </div>
        )}

      </nav>
      
      {/* Sidebar News Widget */}
      {newsContent && newsPosition === 'sidebar_widget' && (
         <div className="mt-auto pb-4">
            <DashboardNews content={newsContent} position="sidebar_widget" />
         </div>
      )}
      
      {/* Logout button removed as per requirements */}
    </aside>
  );
}
