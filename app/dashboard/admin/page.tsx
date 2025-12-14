import Link from "next/link";
import { getGlobalStats } from "@/app/actions/admin/get-global-stats";

export default async function AdminDashboard() {
  const stats = await getGlobalStats();

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Pulpit Administratora</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="bg-brown-800 p-4 rounded-xl border border-brown-700 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
            <div className="text-xs text-amber-200/60 uppercase">Użytkowników</div>
         </div>
         <div className="bg-brown-800 p-4 rounded-xl border border-brown-700 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-white">{stats.totalHives}</div>
            <div className="text-xs text-amber-200/60 uppercase">Uli w systemie</div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700 hover:border-amber-500/50 transition-colors">
           <div className="text-3xl mb-2">⚙️</div>
           <h3 className="text-xl font-bold text-amber-100 mb-2">Konfiguracja Systemu</h3>
           <p className="text-sm text-amber-200/60 mb-4">Zarządzaj flagami systemowymi i logiką biznesową.</p>
           <Link href="/dashboard/admin/settings" className="inline-block bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded text-sm font-bold">
             Otwórz ustawienia
           </Link>
        </div>

        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700 hover:border-amber-500/50 transition-colors">
           <div className="text-3xl mb-2">📝</div>
           <h3 className="text-xl font-bold text-amber-100 mb-2">Zarządzanie Treścią</h3>
           <p className="text-sm text-amber-200/60 mb-4">Edytor stron CMS i treści statycznych.</p>
           <Link href="/dashboard/admin/cms" className="inline-block bg-brown-700 hover:bg-brown-600 text-amber-100 px-4 py-2 rounded text-sm font-bold">
             Przejdź do CMS
           </Link>
        </div>

        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700 hover:border-amber-500/50 transition-colors">
           <div className="text-3xl mb-2">👥</div>
           <h3 className="text-xl font-bold text-amber-100 mb-2">Użytkownicy</h3>
           <p className="text-sm text-amber-200/60 mb-4">Lista użytkowników i zarządzanie rolami.</p>
           <Link href="/dashboard/admin/users" className="inline-block bg-brown-700 hover:bg-brown-600 text-amber-100 px-4 py-2 rounded text-sm font-bold">
             Lista użytkowników
           </Link>
        </div>
        
        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700 hover:border-amber-500/50 transition-colors">
           <div className="text-3xl mb-2">🤝</div>
           <h3 className="text-xl font-bold text-amber-100 mb-2">Zgłoszenia Kół</h3>
           <p className="text-sm text-amber-200/60 mb-4">Weryfikacja nowych kół pszczelarskich.</p>
           <Link href="/dashboard/admin/approvals" className="inline-block bg-brown-700 hover:bg-brown-600 text-amber-100 px-4 py-2 rounded text-sm font-bold">
             Weryfikuj
           </Link>
        </div>
      </div>
    </div>
  );
}
