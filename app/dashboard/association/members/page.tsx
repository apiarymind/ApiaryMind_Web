import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import { getAssociationMembers, getUserAssociationRole, isAssociationPresidentOrTreasurer } from '@/app/actions/association-members';
import MembersClient from './MembersClient';

export default async function AssociationMembersPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  // Get user's associations (for now, check if user is member of any association)
  // In real implementation, should get from context or user's first association
  const membersResult = await getAssociationMembers();
  const userRole = await getUserAssociationRole(uid);

  // Check if user has permission (must be PRESIDENT, TREASURER, or admin)
  const hasPermission = userRole === 'PRESIDENT' || userRole === 'TREASURER';
  
  // Allow admins to see all
  // TODO: Check if user is admin/super_admin
  // For now, show page if user has any association role

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-950 dark:text-white mb-2">Członkowie Związku</h1>
        <p className="text-amber-900/70 dark:text-gray-400">
          Zarządzanie członkami koła. Tylko Prezes i Skarbnik mogą edytować listę członków.
        </p>
      </div>

      <MembersClient />
    </div>
  );
}
