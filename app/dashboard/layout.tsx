"use client";

import React, { Suspense } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-brown-900 text-amber-50">
        <Suspense fallback={<div className="w-64 bg-brown-800 border-r border-brown-700 min-h-screen"></div>}>
          <DashboardSidebar />
        </Suspense>
        <main className="flex-1 p-6 overflow-y-auto max-h-screen">
          <div className="max-w-6xl mx-auto">
             <Suspense fallback={<div className="text-amber-500">Ładowanie zawartości...</div>}>
              {children}
             </Suspense>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
