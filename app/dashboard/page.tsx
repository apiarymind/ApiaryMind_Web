"use client";

import { useAuth } from "../../lib/AuthContext";
import VideoSection from "../../components/VideoSection";
import Link from "next/link";

export default function DashboardPage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-amber-500 mb-2">
          Witaj, {profile?.displayName || profile?.email}!
        </h1>
        <p className="text-amber-200/60">
          Masz rolę: <span className="font-bold text-amber-400">{profile?.role}</span> | Plan: <span className="font-bold text-amber-400">{profile?.plan}</span>
        </p>
      </header>

      {/* Quick Action Tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/beekeeper/apiaries" className="p-6 bg-brown-800 border border-brown-700 rounded-xl hover:border-amber-500/50 transition-colors group">
           <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">🍯</div>
           <h3 className="font-bold text-amber-100">Moje Pasieki</h3>
           <p className="text-xs text-amber-200/60 mt-1">Zarządzaj ulami i pasiekami</p>
        </Link>
        
        <Link href="/dashboard/beekeeper/inspections" className="p-6 bg-brown-800 border border-brown-700 rounded-xl hover:border-amber-500/50 transition-colors group">
           <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">📋</div>
           <h3 className="font-bold text-amber-100">Przeglądy</h3>
           <p className="text-xs text-amber-200/60 mt-1">Historia inspekcji (tylko odczyt)</p>
        </Link>

        {profile?.role === 'ASSOCIATION_ADMIN' && (
          <Link href="/dashboard/association/members" className="p-6 bg-brown-800 border border-brown-700 rounded-xl hover:border-amber-500/50 transition-colors group">
             <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">👥</div>
             <h3 className="font-bold text-amber-100">Członkowie</h3>
             <p className="text-xs text-amber-200/60 mt-1">Zarządzaj listą członków</p>
          </Link>
        )}

        {profile?.role === 'SUPER_ADMIN' && (
           <Link href="/dashboard/admin/users" className="p-6 bg-brown-800 border border-brown-700 rounded-xl hover:border-amber-500/50 transition-colors group">
             <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">🔧</div>
             <h3 className="font-bold text-amber-100">Administracja</h3>
             <p className="text-xs text-amber-200/60 mt-1">Użytkownicy i system</p>
          </Link>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <VideoSection />
         </div>
         <div className="bg-brown-800/50 p-6 rounded-xl border border-brown-700/50 h-fit">
            <h3 className="font-bold text-amber-500 mb-4">📢 Aktualności</h3>
            <div className="space-y-4">
               <div className="pb-3 border-b border-brown-700/50">
                  <div className="text-xs text-amber-400 mb-1">10.05.2024</div>
                  <p className="text-sm text-amber-100">Wdrożyliśmy nowy system raportowania miodobrań. Sprawdź zakładkę Magazyn!</p>
               </div>
               <div className="pb-3 border-b border-brown-700/50">
                  <div className="text-xs text-amber-400 mb-1">05.05.2024</div>
                  <p className="text-sm text-amber-100">Rozpoczynamy nabór do beta testów modułu AI.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
