import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { redirect } from 'next/navigation';
import SupportTicketsClient from './SupportTicketsClient';

export default async function SupportPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile) {
    return <div className="text-red-500">Błąd: Nie można załadować profilu użytkownika.</div>;
  }

  // Only Premium/Business users can access support
  const allowedPlans = ['PLUS', 'PRO', 'PRO_PLUS', 'BUSINESS'];
  if (!allowedPlans.includes(profile.plan)) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold text-primary">Wsparcie Techniczne</h1>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
          <p className="text-white/80 mb-4">
            System wsparcia technicznego jest dostępny tylko dla użytkowników z planem Premium lub Business.
          </p>
          <p className="text-white/60">
            Uaktualnij swój plan, aby uzyskać dostęp do pomocy technicznej.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold text-primary">Wsparcie Techniczne</h1>
      <p className="text-white/70">
        Masz pytanie lub problem? Utwórz zgłoszenie, a nasz zespół pomoże Ci jak najszybciej.
      </p>
      <SupportTicketsClient />
    </div>
  );
}


