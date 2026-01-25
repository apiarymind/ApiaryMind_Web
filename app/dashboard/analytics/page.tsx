import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getBreederAiScores } from '@/app/actions/breeder-ai-scores';
import RefreshRankingButton from './RefreshRankingButton';
import { GlassCard } from '@/app/components/ui/GlassCard';
import BreederRankingTable from './BreederRankingTable';

export default async function AnalyticsPage() {
  const uid = await getSessionUid();
  if (!uid) { redirect('/login'); }

  const [profile, breederScores] = await Promise.all([
    getCurrentUserProfile(uid),
    getBreederAiScores()
  ]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary font-bold">Profil nie znaleziony lub błąd ładowania.</div>
      </div>
    );
  }

  const rankedBreeders = breederScores
    .filter((row) => row.profile?.full_name)
    .map((row) => {
      const averageScore = (
        (row.honey_score || 0) +
        (row.gentleness_score || 0) +
        (row.swarming_score || 0) +
        (row.wintering_score || 0)
      ) / 4;

      return {
        ...row,
        averageScore,
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore);

  return (
    <div className="min-h-screen pb-8 p-4 md:p-6 space-y-6">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-theme-card pb-4">
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
              <Trophy className="w-8 h-8 text-primary" />
              Ranking Jakości Hodowców (AI Scoring)
            </h1>
            <p className="text-sm text-text-dark/60 dark:text-amber-200/70 mt-1">
              Porównanie wyników jakości hodowców na podstawie danych AI
            </p>
          </div>
        </div>

        <RefreshRankingButton />
      </header>

      {/* MAIN CONTENT */}
      {rankedBreeders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-24 h-24 text-text-dark/20 dark:text-white/10 mb-4" />
          <h2 className="text-2xl font-bold text-text-dark dark:text-white mb-2">
            Brak danych do rankingu
          </h2>
          <p className="text-text-dark/60 dark:text-amber-200/70 mb-6 max-w-md">
            Wyniki AI pojawią się, gdy hodowcy uzupełnią dane w systemie.
          </p>
        </div>
      ) : (
        <GlassCard className="p-0">
          <BreederRankingTable breeders={rankedBreeders} />
        </GlassCard>
      )}
    </div>
  );
}






