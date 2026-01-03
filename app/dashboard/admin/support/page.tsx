import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { redirect } from 'next/navigation';
import AdminSupportClient from './AdminSupportClient';

export default async function AdminSupportPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold text-primary">Zarządzanie Zgłoszeniami</h1>
      <p className="text-white/70">
        Przeglądaj i zarządzaj zgłoszeniami użytkowników Premium/Business.
      </p>
      <AdminSupportClient />
    </div>
  );
}



