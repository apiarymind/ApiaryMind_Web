import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getDashboardStats } from '@/app/actions/get-dashboard-stats';
import { getSessionUid } from '@/app/actions/auth-session';
import VideoSection from "../../components/VideoSection";
import Link from "next/link";
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const uid = await getSessionUid();
  
  if (!uid) {
    redirect('/login');
  }

  // Parallel data fetching for speed
  const [profile, stats] = await Promise.all([
    getCurrentUserProfile(uid),
    getDashboardStats(uid)
  ]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-brown-900 flex items-center justify-center">
         <div className="text-amber-500">Profil nie znaleziony lub błąd ładowania.</div>
      </div>
    );
  }

  // Role Badge Logic
  const getRoleBadge = () => {
    if (profile.role === 'super_admin') return <span className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 border px-2 py-1 rounded text-xs font-bold uppercase">SUPER ADMIN</span>;
    if (profile.role === 'admin') return <span className="bg-red-500/10 text-red-400 border-red-500/20 border px-2 py-1 rounded text-xs font-bold uppercase">ADMIN</span>;
    return <span className="bg-amber-800/50 text-amber-200 border-amber-700/50 border px-2 py-1 rounded text-xs font-bold uppercase">PSZCZELARZ</span>;
  };

  return (
    <div className="space-y-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-amber-500 mb-1">
            Witaj, <span className="text-white">{profile.email}</span>!
            </h1>
            <div className="flex gap-2 items-center text-amber-200/60 text-sm">
                 {getRoleBadge()}
                 <span className="text-amber-500/20">|</span>
                 <span>PLAN: <span className="text-amber-400 font-bold">{profile.plan}</span></span>
            </div>
        </div>
      </header>

      {/* Marketplace Warning Logic */}
      {!profile.isRhdActive && (
          <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-start gap-3">
             <div className="text-2xl">⚠️</div>
             <div>
                <h3 className="font-bold text-red-400 text-sm">Sprzedaż zablokowana</h3>
                <p className="text-xs text-red-200/80 mt-1">
                   Uzupełnij numer RHD lub SB w aplikacji mobilnej, aby móc wystawiać produkty na Giełdzie.
                </p>
             </div>
          </div>
       )}

      {/* Quick Action Tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hives Tile - Now points to /dashboard/hives */}
        <Link href="/dashboard/hives" className="p-6 bg-brown-800 border border-brown-700 rounded-xl hover:border-amber-500/50 transition-colors group relative overflow-hidden">
           <div className="relative z-10">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">🐝</div>
              <h3 className="font-bold text-amber-100">Moje Ule</h3>
              <p className="text-3xl font-bold text-amber-500 mt-2">{stats.hiveCount}</p>
               <p className="text-xs text-amber-200/60 mt-1">Łączna liczba rodzin</p>
           </div>
        </Link>

        {/* Apiaries Tile */}
        <Link href="/dashboard/apiaries" className="p-6 bg-brown-800 border border-brown-700 rounded-xl hover:border-amber-500/50 transition-colors group relative overflow-hidden">
           <div className="relative z-10">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">🍯</div>
              <h3 className="font-bold text-amber-100">Moje Pasieki</h3>
              <p className="text-3xl font-bold text-amber-500 mt-2">{stats.apiaryCount}</p>
              <p className="text-xs text-amber-200/60 mt-1">Zarządzaj pasiekami</p>
           </div>
        </Link>
        
        <Link href="/dashboard/inspections" className="p-6 bg-brown-800 border border-brown-700 rounded-xl hover:border-amber-500/50 transition-colors group">
           <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">📋</div>
           <h3 className="font-bold text-amber-100">Przeglądy</h3>
           <p className="text-xs text-amber-200/60 mt-1">Historia inspekcji</p>
        </Link>

        <Link href="/dashboard/settings" className="p-6 bg-brown-800 border border-brown-700 rounded-xl hover:border-amber-500/50 transition-colors group">
             <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">⚙️</div>
             <h3 className="font-bold text-amber-100">Ustawienia</h3>
             <p className="text-xs text-amber-200/60 mt-1">Konfiguracja konta</p>
        </Link>
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
