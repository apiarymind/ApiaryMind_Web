import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const profile = await getCurrentUserProfile(uid);
  
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-red-500 p-4 rounded-r backdrop-blur-xl transition-all duration-300"
           style={{
             borderRadius: '0 0.5rem 0.5rem 0',
             borderLeftColor: '#ef4444',
             borderLeftWidth: '4px',
             boxShadow: 'var(--theme-card-shadow)',
             backdropFilter: 'var(--theme-card-blur, blur(10px))',
             backgroundColor: 'var(--theme-card-bg, rgba(127, 29, 29, 0.1))'
           }}>
         <p className="text-red-200 text-sm font-bold uppercase tracking-wider">Strefa Administratora</p>
      </div>
      {children}
    </div>
  );
}
