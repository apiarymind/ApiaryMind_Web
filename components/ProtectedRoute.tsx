"use client";

import { useAuth, UserRole } from "@/lib/AuthContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

function ProtectedRouteContent({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        const queryString = searchParams.toString();
        const fullPath = queryString ? `${pathname}?${queryString}` : pathname;
        router.push(`/login?redirect=${encodeURIComponent(fullPath)}`);
      } else if (allowedRoles && role && !allowedRoles.includes(role)) {
        // Redirect to unauthorized page or dashboard if role doesn't match
        router.push('/dashboard'); 
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, role, loading, router, allowedRoles, pathname, searchParams]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-amber-500">
        <div className="flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
             <p className="font-mono text-sm">Autoryzacja...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function ProtectedRoute(props: ProtectedRouteProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-900 text-amber-500">Loading auth...</div>}>
      <ProtectedRouteContent {...props} />
    </Suspense>
  );
}
