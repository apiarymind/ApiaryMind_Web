import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getDashboardOverview } from '@/app/actions/get-dashboard-overview';
import { getSessionUid } from '@/app/actions/auth-session';
import VideoSection from "../../components/VideoSection";
import Link from "next/link";
import { redirect } from 'next/navigation';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { AlertTriangle, Thermometer } from 'lucide-react';

export default async function DashboardPage() {
  const uid = await getSessionUid();
  
  if (!uid) {
    redirect('/login');
  }

  // Parallel data fetching for speed
  const [profile, overview] = await Promise.all([
    getCurrentUserProfile(uid),
    getDashboardOverview()
  ]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
         <div className="text-primary font-bold">Profil nie znaleziony lub błąd ładowania.</div>
      </div>
    );
  }

  // Role Badge Logic
  const getRoleBadge = () => {
    if (profile.role === 'super_admin') return <span className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 border px-2 py-1 rounded text-xs font-bold uppercase">SUPER ADMIN</span>;
    if (profile.role === 'admin') return <span className="bg-red-500/10 text-red-500 border-red-500/20 border px-2 py-1 rounded text-xs font-bold uppercase">ADMIN</span>;
    return <span className="bg-primary/20 text-primary border-primary/30 border px-2 py-1 rounded text-xs font-bold uppercase">PSZCZELARZ</span>;
  };

  return (
    <div className="space-y-6 pb-8 p-4 md:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-heading font-bold text-primary mb-1">
            Witaj, <span className="text-text-dark dark:text-white">{profile.email}</span>!
            </h1>
            <div className="flex gap-2 items-center text-text-dark/60 dark:text-amber-200/60 text-sm">
                 {getRoleBadge()}
                 <span className="text-primary/50">|</span>
                 <span>PLAN: <span className="text-primary font-bold">{profile.plan}</span></span>
            </div>
        </div>
      </header>

      {/* Marketplace Warning Logic */}
      {!profile.isRhdActive && (
          <GlassCard className="!bg-red-500/10 dark:!bg-red-900/20 !border-red-500/50 flex items-start gap-3">
             <div className="text-2xl">⚠️</div>
             <div>
                <h3 className="font-bold text-red-600 dark:text-red-400 text-sm">Sprzedaż zablokowana</h3>
                <p className="text-xs text-red-700/80 dark:text-red-200/80 mt-1">
                   Uzupełnij numer RHD lub SB w aplikacji mobilnej, aby móc wystawiać produkty na Giełdzie.
                </p>
             </div>
          </GlassCard>
       )}

      {/* Quick Action Tiles - Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Hives Tile */}
        <Link href="/dashboard/hives" className="group block h-full">
           <GlassCard className="h-full flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="relative z-10">
                 <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">🐝</div>
                 <h3 className="font-heading font-bold text-lg text-text-dark dark:text-amber-100">Moje Ule</h3>
                 <p className="text-4xl font-bold text-primary mt-2">{overview.hivesCount}</p>
                 <p className="text-xs text-text-dark/60 dark:text-amber-200/60 mt-1">Łączna liczba rodzin</p>
              </div>
           </GlassCard>
        </Link>

        {/* Apiaries Tile */}
        <Link href="/dashboard/apiaries" className="group block h-full">
           <GlassCard className="h-full flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="relative z-10">
                 <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">🍯</div>
                 <h3 className="font-heading font-bold text-lg text-text-dark dark:text-amber-100">Moje Pasieki</h3>
                 <p className="text-4xl font-bold text-primary mt-2">{overview.apiariesCount}</p>
                 <p className="text-xs text-text-dark/60 dark:text-amber-200/60 mt-1">Zarządzaj pasiekami</p>
              </div>
           </GlassCard>
        </Link>
        
        <Link href="/dashboard/inspections" className="group block h-full">
           <GlassCard className="h-full flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="relative z-10">
                 <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">📋</div>
                 <h3 className="font-heading font-bold text-lg text-text-dark dark:text-amber-100">Przeglądy</h3>
                 <p className="text-xs text-text-dark/60 dark:text-amber-200/60 mt-4">Historia inspekcji i raporty</p>
              </div>
           </GlassCard>
        </Link>

        <Link href="/dashboard/settings" className="group block h-full">
            <GlassCard className="h-full flex flex-col justify-between hover:scale-[1.02] transition-transform">
                 <div className="relative z-10">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">⚙️</div>
                    <h3 className="font-heading font-bold text-lg text-text-dark dark:text-amber-100">Ustawienia</h3>
                    <p className="text-xs text-text-dark/60 dark:text-amber-200/60 mt-4">Konfiguracja konta</p>
                 </div>
            </GlassCard>
        </Link>
      </section>

      {/* NEW: SICK BAY & ALERTS SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
              {/* Sick Bay / Alerts */}
              <GlassCard className="p-0 overflow-hidden">
                 <div className="p-6 border-b border-white/10 flex justify-between items-center bg-red-900/10">
                    <h3 className="font-heading font-bold text-red-400 text-xl flex items-center gap-2">
                       <AlertTriangle className="w-5 h-5" />
                       Centrum Dowodzenia / Szpital
                    </h3>
                    <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                       {overview.alerts.length} ALARMY
                    </span>
                 </div>

                 <div className="p-4">
                    {overview.alerts.length === 0 ? (
                       <div className="text-center py-8 text-neutral-400">
                          <div className="text-4xl mb-2">✅</div>
                          <p>Wszystkie rodziny są zdrowe.</p>
                       </div>
                    ) : (
                       <div className="space-y-2">
                          {overview.alerts.map((alert, idx) => (
                             <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-red-500/30 transition-colors">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-white border border-neutral-700">
                                      {alert.hive_number}
                                   </div>
                                   <div>
                                      <h4 className="font-bold text-white text-sm">{alert.issue}</h4>
                                      <span className="text-xs text-neutral-400 uppercase tracking-wider">{alert.type}</span>
                                   </div>
                                </div>
                                {alert.days_remaining !== undefined && (
                                   <div className="text-right">
                                      <span className="block text-xl font-bold text-yellow-500">{alert.days_remaining}</span>
                                      <span className="text-[10px] text-neutral-500 uppercase">Dni karencji</span>
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </GlassCard>

              <VideoSection />
          </div>

          <div className="h-full flex flex-col gap-6">
             {/* Forage Status Card */}
             <GlassCard className={`${overview.forageStatus.color} !bg-opacity-20 border-white/10`}>
                 <div className="flex items-start justify-between">
                    <div>
                       <span className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1 block">Status Pożytkowy</span>
                       <h3 className="font-heading font-bold text-white text-2xl">{overview.forageStatus.current}</h3>
                       <p className="text-white/80 text-sm mt-1">{overview.forageStatus.status}</p>
                    </div>
                    <div className="text-3xl">🌻</div>
                 </div>

                 {overview.forageStatus.daysToNext > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-white/60">Następny pożytek:</span>
                          <span className="font-bold text-white">{overview.forageStatus.nextName}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-white/40">Szacowany czas:</span>
                          <span className="text-yellow-400 font-bold">za {overview.forageStatus.daysToNext} dni</span>
                       </div>
                    </div>
                 )}
             </GlassCard>

             <GlassCard className="h-full">
                <h3 className="font-heading font-bold text-primary mb-4 text-xl">📢 Aktualności</h3>
                <div className="space-y-4">
                <div className="pb-3 border-b border-glass-light dark:border-glass-dark">
                    <div className="text-xs text-primary mb-1">10.05.2024</div>
                    <p className="text-sm text-text-dark dark:text-amber-100">Wdrożyliśmy nowy system raportowania miodobrań. Sprawdź zakładkę Magazyn!</p>
                </div>
                <div className="pb-3 border-b border-glass-light dark:border-glass-dark">
                    <div className="text-xs text-primary mb-1">05.05.2024</div>
                    <p className="text-sm text-text-dark dark:text-amber-100">Rozpoczynamy nabór do beta testów modułu AI.</p>
                </div>
                </div>
            </GlassCard>
         </div>
      </section>
    </div>
  );
}
