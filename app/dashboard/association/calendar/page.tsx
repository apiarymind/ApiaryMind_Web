"use client";

import { useAuth } from "../../../../lib/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssociationCalendarPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile?.role !== 'ASSOCIATION_ADMIN' && profile?.role !== 'SUPER_ADMIN') {
       router.push("/dashboard");
    }
  }, [loading, profile, router]);

  if (profile?.role !== 'ASSOCIATION_ADMIN' && profile?.role !== 'SUPER_ADMIN') return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Kalendarz Wydarzeń</h1>
      <div className="bg-brown-800 rounded-xl border border-brown-700 p-6">
        <p className="text-amber-100">Kalendarz (Stub)</p>
      </div>
    </div>
  );
}
