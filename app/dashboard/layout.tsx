import React, { Suspense } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getSessionUid } from "@/app/actions/auth-session";
import { getCurrentUserProfile } from "@/app/actions/get-user";
import SurveyBanner from "@/app/components/SurveyBanner";
import DashboardNews from "@/app/components/DashboardNews";
import { getDashboardNewsSettings } from "@/app/actions/get-dashboard-news";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const uid = await getSessionUid();
  const profile = uid ? await getCurrentUserProfile(uid) : null;
  const newsSettings = await getDashboardNewsSettings();

  return (
    <div className="flex min-h-screen bg-transparent text-text-dark dark:text-amber-50">
      <Suspense fallback={<div className="w-64 bg-glass-light dark:bg-glass-dark border-r border-glass-light dark:border-glass-dark min-h-screen backdrop-blur-md"></div>}>
        <DashboardSidebar userProfile={profile} newsContent={newsSettings.content} newsPosition={newsSettings.position} />
      </Suspense>
      <main className="flex-1 p-6 overflow-y-auto max-h-screen relative">
        <DashboardNews content={newsSettings.content} position={newsSettings.position} />
        
        <div className="max-w-6xl mx-auto">
           {/* ProtectedRoute still wraps children to handle client-side auth redirections if session is invalid */}
           <ProtectedRoute>
             <Suspense fallback={<div className="text-amber-500">Ładowanie zawartości...</div>}>
              {children}
             </Suspense>
           </ProtectedRoute>
        </div>
      </main>
      <Suspense fallback={null}>
         <SurveyBanner />
      </Suspense>
    </div>
  );
}
