import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const profile = await getCurrentUserProfile(uid);
  
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r">
         <p className="text-red-200 text-sm font-bold uppercase tracking-wider">Strefa Administratora</p>
      </div>
      {children}
    </div>
  );
}
