import Link from "next/link";
import { getGlobalStats } from "@/app/actions/admin/get-global-stats";
import { getNavigationItemsForAdmin } from "@/app/actions/admin/navigation-items";

const DEFAULT_ADMIN_LINKS = [
  { id: "admin-dashboard", label: "Pulpit Admina", path: "/dashboard/admin" },
  { id: "admin-users", label: "Użytkownicy", path: "/dashboard/admin/users" },
  { id: "admin-approvals", label: "Zatwierdzanie zgłoszeń", path: "/dashboard/admin/approvals" },
  { id: "admin-cms-editor", label: "CMS Editor", path: "/dashboard/admin/cms-editor" },
  { id: "admin-cms", label: "CMS", path: "/dashboard/admin/cms" },
  { id: "admin-configuration", label: "Konfiguracja", path: "/dashboard/admin/configuration" },
  { id: "admin-settings", label: "Ustawienia", path: "/dashboard/admin/settings" },
  { id: "admin-theme", label: "Zarządzanie Wyglądem", path: "/dashboard/admin/theme" },
  { id: "admin-social-media", label: "Media Społecznościowe", path: "/dashboard/admin/social-media" },
  { id: "admin-support", label: "Wsparcie", path: "/dashboard/admin/support" },
  { id: "admin-surveys", label: "Ankiety", path: "/dashboard/admin/surveys" },
  { id: "admin-beta", label: "Beta", path: "/dashboard/admin/beta" },
  { id: "admin-beta-management", label: "Zarządzanie Betą", path: "/dashboard/admin/beta-management" },
  { id: "admin-navigation", label: "Nawigacja", path: "/dashboard/admin/settings/navigation" }
];

export default async function AdminDashboard() {
  const stats = await getGlobalStats();
  const navigationItems = await getNavigationItemsForAdmin();

  const adminLinks = navigationItems
    .filter(item => item.category === "Administrator" && item.is_active)
    .map(item => ({ id: item.id, label: item.label, path: item.path }));

  const linksToRender = adminLinks.length > 0 ? adminLinks : DEFAULT_ADMIN_LINKS;

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Pulpit Administratora</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="p-4 rounded-xl border backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-300"
              style={{
                borderRadius: 'var(--theme-card-radius, 0.75rem)',
                borderColor: 'var(--theme-card-border)',
                borderWidth: 'var(--theme-card-border-width, 1px)',
                boxShadow: 'var(--theme-card-shadow)',
                backdropFilter: 'var(--theme-card-blur, blur(20px))',
                backgroundColor: 'var(--theme-card-bg, rgba(90, 66, 45, 0.4))'
              }}>
            <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
            <div className="text-xs text-amber-200/60 uppercase">Użytkowników</div>
         </div>
         <div className="p-4 rounded-xl border backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-300"
              style={{
                borderRadius: 'var(--theme-card-radius, 0.75rem)',
                borderColor: 'var(--theme-card-border)',
                borderWidth: 'var(--theme-card-border-width, 1px)',
                boxShadow: 'var(--theme-card-shadow)',
                backdropFilter: 'var(--theme-card-blur, blur(20px))',
                backgroundColor: 'var(--theme-card-bg, rgba(90, 66, 45, 0.4))'
              }}>
            <div className="text-3xl font-bold text-white">{stats.totalHives}</div>
            <div className="text-xs text-amber-200/60 uppercase">Uli w systemie</div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {linksToRender.map(link => (
          <div
            key={link.id}
            className="p-6 rounded-xl border backdrop-blur-xl hover:border-amber-500/50 transition-all duration-300"
            style={{
              borderRadius: 'var(--theme-card-radius, 0.75rem)',
              borderColor: 'var(--theme-card-border)',
              borderWidth: 'var(--theme-card-border-width, 1px)',
              boxShadow: 'var(--theme-card-shadow)',
              backdropFilter: 'var(--theme-card-blur, blur(20px))',
              backgroundColor: 'var(--theme-card-bg, rgba(90, 66, 45, 0.4))'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-2">{link.label}</h3>
            <p className="text-sm text-white/60 mb-4">{link.path}</p>
            <Link
              href={link.path}
              className="inline-block bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded text-sm font-bold"
            >
              Otwórz
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
