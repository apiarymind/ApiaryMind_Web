import { redirect } from "next/navigation";
import { getSessionUid } from "@/app/actions/auth-session";
import { getCurrentUserProfile } from "@/app/actions/get-user";
import { getNavigationItemsForAdmin } from "@/app/actions/admin/navigation-items";
import NavigationManagerClient from "./NavigationManagerClient";
import { GlassCard } from "@/app/components/ui/GlassCard";

export default async function AdminNavigationSettingsPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== "ADMIN" && profile.system_role !== "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const navigationItems = await getNavigationItemsForAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold text-primary">
        Zarządzanie nawigacją
      </h1>
      <GlassCard className="p-6">
        <NavigationManagerClient items={navigationItems} />
      </GlassCard>
    </div>
  );
}
