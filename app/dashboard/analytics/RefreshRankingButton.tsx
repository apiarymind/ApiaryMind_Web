'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { recalculateBreederScores } from '@/app/actions/recalculate-breeder-scores';

export default function RefreshRankingButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      await recalculateBreederScores();
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      className="btn-secondary !px-4 !py-2"
      disabled={isPending}
    >
      {isPending ? 'Odświeżanie...' : '♻️ Odśwież Ranking'}
    </button>
  );
}
