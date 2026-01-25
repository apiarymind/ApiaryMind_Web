import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import { getUserApiaries } from '@/app/actions/get-apiaries';
import { getUserReportData } from '@/app/actions/get-user-report-data';
import VeterinaryOverviewClient from '@/app/components/veterinary/VeterinaryOverviewClient';
import VeterinaryReportsControls from '@/app/components/veterinary/VeterinaryReportsControls';

export default async function VeterinaryModulePage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const { data: apiaries } = await getUserApiaries();
  const { data: userData } = await getUserReportData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-amber-600 dark:text-primary">Moduł Weterynaryjny</h1>
        <p className="text-gray-700 dark:text-white/60">
          Zarządzaj leczeniami i okresami karencji dla wszystkich pasiek
        </p>
      </div>

      {/* Reporting Section */}
      <VeterinaryReportsControls 
        apiaries={apiaries || []} 
        userData={userData ? {
          full_name: userData.full_name,
          company_name: userData.company_name,
          address: userData.address,
          wni_number: userData.wni_number,
        } : null}
      />

      {/* Overview Section */}
      <VeterinaryOverviewClient apiaries={apiaries || []} />
    </div>
  );
}

