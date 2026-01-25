import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Crown, TrendingUp, Lock } from 'lucide-react';
import BusinessDashboardClient from './BusinessDashboardClient';
import { getApiaryOptions, getLineOptions } from '@/app/actions/business-analytics';
import { canAccessBusinessFinancials, canAccessStaffTimeData } from '@/app/utils/business-security';

export const metadata = {
  title: 'Business Dashboard | ApiaryMind',
  description: 'Analityka biznesowa i porównanie linii matek'
};

export default async function BusinessDashboardPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary font-bold">Profil nie znaleziony lub błąd ładowania.</div>
      </div>
    );
  }

  // Check access permissions
  const [financialAccess, staffTimeAccess, apiariesResult, linesResult] = await Promise.all([
    canAccessBusinessFinancials(uid),
    canAccessStaffTimeData(),
    getApiaryOptions(),
    getLineOptions()
  ]);

  const hasFinancialAccess = financialAccess.allowed;
  const canAccessStaffTime = staffTimeAccess.allowed;
  const apiaries = apiariesResult.data;
  const lines = linesResult.data;

  // Check if user is admin trying to access other's data
  const isAdminWithoutAccess = 
    (profile.system_role === 'SUPER_ADMIN' || profile.system_role === 'ADMIN') &&
    !hasFinancialAccess;

  return (
    <div className="min-h-screen pb-8 p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="p-2 hover:bg-white/5 dark:hover:bg-white/10 rounded-lg transition-colors"
            title="Powrót do dashboardu"
          >
            <ArrowLeft className="w-5 h-5 text-text-dark dark:text-white" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-dark dark:text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Business Dashboard
            </h1>
            <p className="text-sm text-text-dark/60 dark:text-gray-400 mt-1">
              Analityka operacyjna i finansowa Twojej pasieki
            </p>
          </div>
        </div>

        {/* Access Indicators */}
        <div className="flex gap-3 text-xs">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            hasFinancialAccess 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {hasFinancialAccess ? <TrendingUp className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {hasFinancialAccess ? 'Dane finansowe' : 'Finanse ukryte'}
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            canAccessStaffTime 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {canAccessStaffTime ? <Crown className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {canAccessStaffTime ? 'Czas pracy' : 'PRO PLUS+'}
          </div>
        </div>
      </header>

      {/* Admin Warning */}
      {isAdminWithoutAccess && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="font-bold text-yellow-400">Tryb Administracyjny</p>
              <p className="text-sm text-yellow-400/70">
                Jako administrator nie masz dostępu do danych finansowych użytkowników. 
                Możesz przeglądać tylko dane operacyjne.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <BusinessDashboardClient 
        apiaries={apiaries}
        lines={lines}
        hasFinancialAccess={hasFinancialAccess}
        canAccessStaffTime={canAccessStaffTime}
        userId={uid}
      />
    </div>
  );
}




