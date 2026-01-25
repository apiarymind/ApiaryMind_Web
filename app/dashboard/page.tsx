import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getSessionUid } from '@/app/actions/auth-session';
import { 
  getSickBayInspections, 
  getWithdrawalGuardHives, 
  getRemovalAlerts,
  getForageData,
  getUserTasks
} from '@/app/actions/dashboard-widgets';
import { getDashboardOverview } from '@/app/actions/get-dashboard-overview';

import { redirect } from 'next/navigation';

// Widgets
import { SickBayWidget } from '@/components/dashboard/SickBayWidget';
import { WithdrawalGuardWidget } from '@/components/dashboard/WithdrawalGuardWidget';
import VeterinaryAlerts from '@/app/components/veterinary/VeterinaryAlerts';
import { ForageRadarWidget } from '@/components/dashboard/ForageRadarWidget';
import { ActionPlanWidget } from '@/components/dashboard/ActionPlanWidget';
import { HoneyCapacityWidget } from '@/components/dashboard/HoneyCapacityWidget';
import HarvestStatsWidget from '@/components/dashboard/HarvestStatsWidget';

export default async function DashboardPage() {
  const uid = await getSessionUid();
  if (!uid) { redirect('/login'); }

  // Parallel data fetching for speed
  const [
      profile, 
      stats, 
      sickBay, 
      withdrawals,
      removalAlerts,
      forage,
      tasks
  ] = await Promise.all([
    getCurrentUserProfile(uid),
    getDashboardOverview(),
    getSickBayInspections(),
    getWithdrawalGuardHives(),
    getRemovalAlerts(),
    getForageData(),
    getUserTasks(uid, 'BEEKEEPER')
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
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-300/30 dark:border-white/5 pb-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-dark dark:text-white">
                Centrum Dowodzenia
            </h1>
            <p className="text-sm text-text-dark/60 dark:text-gray-400">
                Witaj, {profile?.full_name || profile?.email || 'Użytkowniku'}
            </p>
        </div>

        {/* Subtle Stats Bar (Restored) */}
        <div className="flex gap-6 text-xs font-mono text-gray-900 dark:text-gray-400 bg-white dark:bg-black/20 px-4 py-2 rounded-full border border-gray-300 dark:border-white/10 shadow-md dark:shadow-none">
            <div className="flex gap-2">
                <span className="font-bold text-amber-600 dark:text-primary">{stats?.hivesCount || 0}</span> <span className="text-gray-900 dark:text-gray-400">RODZIN</span>
            </div>
            <div className="w-px h-full bg-gray-400 dark:bg-gray-700 mx-1"></div>
            <div className="flex gap-2">
                <span className="font-bold text-amber-600 dark:text-primary">{stats?.apiariesCount || 0}</span> <span className="text-gray-900 dark:text-gray-400">PASIEK</span>
            </div>
        </div>
      </header>

      {/* MAIN LAYOUT - KAFELKI JEDEN POD DRUGIM (FULL WIDTH) */}
      <div className="flex flex-col gap-4 md:gap-6">
        
        {/* ZONE 1: CRITICAL ALERTS & SAFETY (Red/Orange) */}
        {sickBay.length > 0 && (
            <div className="w-full">
                <SickBayWidget inspections={sickBay} />
            </div>
        )}

        {/* Critical Removal Alerts (Highest Priority) */}
        <div className="w-full">
            <VeterinaryAlerts removalAlerts={removalAlerts} />
        </div>

        {/* Withdrawal Guard only shows if active */}
        {withdrawals.length > 0 && (
            <div className="w-full">
                <WithdrawalGuardWidget treatments={withdrawals} />
            </div>
        )}

        {/* ZONE 2: BIO-CONTEXT (Green/Blue) */}
        <div className="w-full">
             <ForageRadarWidget 
               flows={forage} 
               stats={stats?.forageStatus} 
               activeForageTypes={stats?.activeForageTypes || []}
               allForageTypes={stats?.allForageTypes || []}
             />
        </div>

        {/* Honey Storage Capacity Widget */}
        {stats?.honeyCapacity && stats.honeyCapacity.totalCapacityKg > 0 && (
          <div className="w-full">
            <HoneyCapacityWidget
              totalCapacityKg={stats.honeyCapacity.totalCapacityKg}
              halfBodyCount={stats.honeyCapacity.halfBodyCount}
              fullBodyCount={stats.honeyCapacity.fullBodyCount}
              halfBodyCapacity={stats.honeyCapacity.halfBodyCapacity}
              fullBodyCapacity={stats.honeyCapacity.fullBodyCapacity}
            />
          </div>
        )}

        {/* Harvest Statistics Widget */}
        <div className="w-full">
          <HarvestStatsWidget />
        </div>

        {/* ZONE 3: OPERATIONS (White/Grey) */}
        <div className="w-full">
             <ActionPlanWidget tasks={tasks} />
        </div>

        {/* ZONE 4 removed: Info Hub */}

      </div>

    </div>
  );
}
