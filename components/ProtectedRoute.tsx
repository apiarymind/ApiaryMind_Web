"use client";

import { useAuth, UserRole } from "@/lib/AuthContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

function ProtectedRouteContent({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // If not logged in, redirect to login with return url
      const currentUrl = encodeURIComponent(`${pathname}?${searchParams.toString()}`);
      router.replace(`/login?redirect=${currentUrl}`);
      return;
    }

    // If logged in but role is restricted
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      if (role === 'super_admin') router.replace('/dashboard/admin');
      else if (role === 'admin') router.replace('/dashboard/association');
      else router.replace('/dashboard/beekeeper');
    }

  }, [user, role, loading, router, pathname, searchParams, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brown-900 text-amber-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}

export default function ProtectedRoute(props: ProtectedRouteProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-brown-900 text-amber-500">Loading auth...</div>}>
      <ProtectedRouteContent {...props} />
    </Suspense>
  );
}
