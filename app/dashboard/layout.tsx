import React, { Suspense } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getSessionUid } from "@/app/actions/auth-session";
import { getCurrentUserProfile } from "@/app/actions/get-user";
import SurveyBanner from "@/app/components/SurveyBanner";
import DashboardNews from "@/app/components/DashboardNews";
import { getDashboardNewsSettings } from "@/app/actions/get-dashboard-news";
import { getNavigationItems, syncNavigationWithDB } from "@/app/actions/navigation-items";
import OnboardingWrapper from "../../components/OnboardingWrapper";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const uid = await getSessionUid();
  const profile = uid ? await getCurrentUserProfile(uid) : null;
  const newsSettings = await getDashboardNewsSettings();
  const isAdmin = profile?.system_role === "ADMIN" || profile?.system_role === "SUPER_ADMIN";
  await syncNavigationWithDB(!!isAdmin);
  const navigationItems = await getNavigationItems();

  return (
    <div className="min-h-screen bg-transparent text-text-dark dark:text-amber-50">
      <Suspense fallback={<div className="w-64 bg-white/90 dark:bg-black/40 border-r border-amber-900/10 dark:border-white/10 min-h-screen backdrop-blur-xl"></div>}>
        <DashboardSidebar
          userProfile={profile}
          newsContent={newsSettings.content}
          newsPosition={newsSettings.position}
          navigationItems={navigationItems}
        />
      </Suspense>
      <main className="md:ml-[288px] p-6 min-h-screen relative">
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
      <OnboardingWrapper />
    </div>
  );
}
