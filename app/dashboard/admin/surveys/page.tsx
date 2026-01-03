import { listSurveys } from '@/app/actions/surveys';
import SurveyManager from '@/app/dashboard/admin/cms-editor/SurveyManager';
import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { redirect } from 'next/navigation';

export default async function SurveysPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/dashboard');
  }

  const surveys = await listSurveys();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-950 dark:text-white mb-2">Zarządzanie Ankietami</h1>
        <p className="text-amber-900/70 dark:text-gray-400">
          Twórz i zarządzaj ankietami wyświetlanymi użytkownikom
        </p>
      </div>
      <SurveyManager surveys={surveys} />
    </div>
  );
}

