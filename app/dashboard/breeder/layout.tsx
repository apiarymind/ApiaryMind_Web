import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { redirect } from 'next/navigation';

/**
 * Layout for Breeder Panel
 * Enforces RBAC: Only PRO_PLUS and BUSINESS plans can access
 */
export default async function BreederLayout({ children }: { children: React.ReactNode }) {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile) {
    redirect('/dashboard');
  }

  // RBAC: Only PRO_PLUS and BUSINESS plans
  const hasAccess = profile.plan === 'PRO_PLUS' || profile.plan === 'BUSINESS' || profile.system_role === 'SUPER_ADMIN';

  if (!hasAccess) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Brak Dostępu</h2>
        <p className="text-gray-400 mb-4">
          Panel Hodowcy jest dostępny tylko dla planów PRO+ oraz BUSINESS.
        </p>
        <p className="text-sm text-gray-500">
          Uaktualnij swój plan, aby uzyskać dostęp do zaawansowanych funkcji hodowli matek pszczelich.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

