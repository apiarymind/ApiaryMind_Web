import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getSessionUid } from '@/app/actions/auth-session';
import {
  getSickBayInspections,
  getWithdrawalGuardHives,
  getForageData,
  getUserTasks,
  getSystemMessages,
  getAssociationAnnouncements
} from '@/app/actions/dashboard-widgets';
import { getDashboardOverview } from '@/app/actions/get-dashboard-overview';

import Link from "next/link";
import { redirect } from 'next/navigation';

// Widgets
import { SickBayWidget } from '@/components/dashboard/SickBayWidget';
import { WithdrawalGuardWidget } from '@/components/dashboard/WithdrawalGuardWidget';
import { ForageRadarWidget } from '@/components/dashboard/ForageRadarWidget';
import { ActionPlanWidget } from '@/components/dashboard/ActionPlanWidget';
import { InfoHubWidget } from '@/components/dashboard/InfoHubWidget';

export default async function DashboardPage() {
  const uid = await getSessionUid();
  if (!uid) { redirect('/login'); }

  // Parallel data fetching for speed
  const [
      profile,
      stats,
      sickBay,
      withdrawals,
      forage,
      tasks,
      sysMessages,
      assocAnnouncements
  ] = await Promise.all([
    getCurrentUserProfile(uid),
    getDashboardOverview(),
    getSickBayInspections(),
    getWithdrawalGuardHives(),
    getForageData(),
    getUserTasks(uid, 'BEEKEEPER'),
    getSystemMessages(),
    getAssociationAnnouncements()
  ]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
         <div className="text-primary font-bold">Profil nie znaleziony lub błąd ładowania.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 p-4 md:p-6 space-y-6">

      {/* HEADER & SUBTLE STATS */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-dark dark:text-white">
                Centrum Dowodzenia
            </h1>
            <p className="text-sm text-text-dark/60 dark:text-gray-400">
                Witaj, {profile.full_name || profile.email}
            </p>
        </div>

        {/* Subtle Stats Bar (Restored) */}
        <div className="flex gap-6 text-xs font-mono text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 px-4 py-2 rounded-full border border-white/10">
            <div className="flex gap-2">
                <span className="font-bold text-primary">{stats?.hivesCount || 0}</span> RODZIN
            </div>
            <div className="w-px h-full bg-gray-300 dark:bg-gray-700 mx-1"></div>
            <div className="flex gap-2">
                <span className="font-bold text-primary">{stats?.apiariesCount || 0}</span> PASIEK
            </div>
        </div>
      </header>

      {/* MAIN GRID LAYOUT */}
      {/*
         Mobile: Single Column order: Alerts -> Bio -> Ops -> Network
         Desktop: Masonry / Grid
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-min">

        {/* ZONE 1: CRITICAL ALERTS & SAFETY (Red/Orange) */}
        {/* Sick Bay takes prominence if populated */}
        <div className={`col-span-1 ${sickBay.length > 0 ? 'md:col-span-2 lg:col-span-1 xl:col-span-1 row-span-2' : ''}`}>
            <SickBayWidget inspections={sickBay} />
        </div>

        {/* Withdrawal Guard only shows if active, otherwise hidden or small placeholder */}
        {withdrawals.length > 0 && (
            <div className="col-span-1">
                <WithdrawalGuardWidget treatments={withdrawals} />
            </div>
        )}

        {/* ZONE 2: BIO-CONTEXT (Green/Blue) - Restored DB Source */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
             <ForageRadarWidget flows={forage} />
        </div>

        {/* ZONE 3: OPERATIONS (White/Grey) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1 row-span-2">
             <ActionPlanWidget tasks={tasks} />
        </div>

        {/* ZONE 4: NETWORK (Yellow/Black) */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1">
             <InfoHubWidget systemMessages={sysMessages} announcements={assocAnnouncements} />
        </div>

      </div>

      {/* QUICK NAVIGATION (Legacy but condensed) */}
      <section className="pt-8 border-t border-white/5">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">Szybki Dostęp</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <Link href="/dashboard/hives" className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-center">
                 <span className="block text-2xl mb-2">🐝</span>
                 <span className="text-sm font-bold">Ule</span>
             </Link>
             <Link href="/dashboard/apiaries" className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-center">
                 <span className="block text-2xl mb-2">🍯</span>
                 <span className="text-sm font-bold">Pasieki</span>
             </Link>
              <Link href="/dashboard/inspections" className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-center">
                 <span className="block text-2xl mb-2">📋</span>
                 <span className="text-sm font-bold">Przeglądy</span>
             </Link>
             <Link href="/dashboard/settings" className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-center">
                 <span className="block text-2xl mb-2">⚙️</span>
                 <span className="text-sm font-bold">Ustawienia</span>
             </Link>
        </div>
      </section>

    </div>
  );
}
