import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import { getAssociationMembers, getUserAssociations, isAssociationPresidentOrTreasurer } from '@/app/actions/association-members';
import FinancesClient from './FinancesClient';

export default async function AssociationFinancesPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  // Get user's associations
  const associations = await getUserAssociations(uid);
  
  if (associations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400">
          Nie jesteś członkiem żadnego związku. Aby zarządzać finansami, musisz być członkiem związku z rolą Prezesa lub Skarbnika.
        </div>
      </div>
    );
  }

  // Check permission for first association (in real app, should allow selection)
  const hasPermission = await isAssociationPresidentOrTreasurer(uid, associations[0]);

  if (!hasPermission) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400">
          Brak dostępu. Zarządzanie finansami jest dostępne tylko dla Prezesa i Skarbnika.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-950 dark:text-white mb-2">Finanse Związku</h1>
        <p className="text-amber-900/70 dark:text-gray-400">
          Ewidencja składek i wpłat. Tylko Prezes i Skarbnik mają dostęp do tej sekcji.
        </p>
      </div>

      <FinancesClient associationId={associations[0]} />
    </div>
  );
}



