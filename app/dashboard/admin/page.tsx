import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Pulpit Administratora</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700">
           <h3 className="text-xl font-bold text-amber-100 mb-2">Użytkownicy</h3>
           <Link href="/dashboard/admin/users" className="btn-secondary text-sm">Zarządzaj</Link>
        </div>
        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700">
           <h3 className="text-xl font-bold text-amber-100 mb-2">Zgłoszenia Kół</h3>
           <Link href="/dashboard/admin/approvals" className="btn-secondary text-sm">Weryfikuj</Link>
        </div>
        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700">
           <h3 className="text-xl font-bold text-amber-100 mb-2">Betatesty</h3>
           <Link href="/dashboard/admin/beta-management" className="btn-secondary text-sm">Przeglądaj</Link>
        </div>
      </div>
    </div>
  );
}
