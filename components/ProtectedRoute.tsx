"use client";

import { useAuth, UserRole } from "@/lib/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (allowedRoles && role && !allowedRoles.includes(role)) {
        // Redirect to unauthorized page or dashboard if role doesn't match
        router.push('/dashboard');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, role, loading, router, allowedRoles, pathname]);

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
