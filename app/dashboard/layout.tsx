"use client";

import { AuthProvider } from "../../lib/AuthContext";
import DashboardSidebar from "../../components/DashboardSidebar";
import { useAuth } from "../../lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Inner component to handle redirects using useAuth hook
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brown-900 text-amber-500">
        <div className="animate-spin text-4xl">🐝</div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting...
  }

  return (
    <div className="flex min-h-screen bg-brown-900 text-amber-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
