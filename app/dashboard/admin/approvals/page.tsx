"use client";

import { useAuth } from "../../../../lib/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminApprovalsPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
     if (!loading && profile?.system_role !== 'SUPER_ADMIN') {
       router.push("/dashboard");
    }
  }, [loading, profile, router]);

  if (profile?.system_role !== 'SUPER_ADMIN') return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Zatwierdzanie Związków</h1>
      <div className="rounded-xl border p-6 backdrop-blur-xl transition-all duration-300"
           style={{
             borderRadius: 'var(--theme-card-radius, 0.75rem)',
             borderColor: 'var(--theme-card-border)',
             borderWidth: 'var(--theme-card-border-width, 1px)',
             boxShadow: 'var(--theme-card-shadow)',
             backdropFilter: 'var(--theme-card-blur, blur(20px))',
             backgroundColor: 'var(--theme-card-bg, rgba(90, 66, 45, 0.4))'
           }}>
        <p className="text-amber-100">Lista związków oczekujących na zatwierdzenie (Stub)</p>
      </div>
    </div>
  );
}
