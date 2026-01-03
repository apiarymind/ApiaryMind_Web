import { checkRhdAccess } from "@/app/actions/sales-log";
import { getUserReportData } from "@/app/actions/get-user-report-data";
import ReportsClient from "./ReportsClient";
import { redirect } from "next/navigation";
import { getSessionUid } from "@/app/actions/auth-session";

export default async function ReportsPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const rhdCheck = await checkRhdAccess().catch(() => ({ hasAccess: false, error: undefined }));
  const userData = await getUserReportData().catch(() => ({ data: null, error: null }));

  return (
    <ReportsClient 
      hasRhdAccess={rhdCheck.hasAccess}
      userData={userData.data}
    />
  );
}
