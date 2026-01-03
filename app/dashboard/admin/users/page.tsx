import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

export default async function AdminUsersPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile || profile.role !== 'super_admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <UsersClient />
    </div>
  );
}
