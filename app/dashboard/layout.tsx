import React, { Suspense } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getSessionUid } from "@/app/actions/auth-session";
import { getCurrentUserProfile } from "@/app/actions/get-user";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const uid = await getSessionUid();
  const profile = uid ? await getCurrentUserProfile(uid) : null;

  return (
    <div className="flex min-h-screen bg-brown-900 text-amber-50">
      <Suspense fallback={<div className="w-64 bg-brown-800 border-r border-brown-700 min-h-screen"></div>}>
        <DashboardSidebar userProfile={profile} />
      </Suspense>
      <main className="flex-1 p-6 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
           {/* ProtectedRoute still wraps children to handle client-side auth redirections if session is invalid */}
           <ProtectedRoute>
             <Suspense fallback={<div className="text-amber-500">Ładowanie zawartości...</div>}>
              {children}
             </Suspense>
           </ProtectedRoute>
        </div>
      </main>
    </div>
  );
}
