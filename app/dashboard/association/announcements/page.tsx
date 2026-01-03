import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import { getAssociationMembers, getUserAssociations, getUserAssociationRole, isAssociationPresidentOrTreasurer } from '@/app/actions/association-members';
import { getAssociationNotifications } from '@/app/actions/association-notifications';
import AnnouncementsClient from './AnnouncementsClient';

export default async function AssociationAnnouncementsPage() {
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
          Nie jesteś członkiem żadnego związku. Aby wysyłać powiadomienia, musisz być członkiem związku z rolą Prezesa lub Skarbnika.
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
          Brak dostępu. Wysyłanie powiadomień jest dostępne tylko dla Prezesa i Skarbnika.
        </div>
      </div>
    );
  }

  // Get notifications and members
  const notificationsResult = await getAssociationNotifications(associations[0]);
  const membersResult = await getAssociationMembers(associations[0]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-950 dark:text-white mb-2">Ogłoszenia i Powiadomienia</h1>
        <p className="text-amber-900/70 dark:text-gray-400">
          Wyślij powiadomienie do wszystkich członków związku. Tylko Prezes i Skarbnik mogą wysyłać powiadomienia.
        </p>
      </div>

      <AnnouncementsClient
        associationId={associations[0]}
        initialNotifications={notificationsResult.data || []}
        memberCount={membersResult.data?.length || 0}
      />
    </div>
  );
}
