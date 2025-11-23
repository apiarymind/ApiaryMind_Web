import Link from "next/link";

export default function AssociationDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Pulpit Związku / Koła</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700">
           <h3 className="text-xl font-bold text-amber-100 mb-2">Członkowie</h3>
           <p className="text-amber-200/60 mb-4">Lista członków koła i status składek.</p>
           <Link href="/dashboard/association/members" className="btn-secondary text-sm">Zarządzaj</Link>
        </div>
        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700">
           <h3 className="text-xl font-bold text-amber-100 mb-2">Ogłoszenia</h3>
           <p className="text-amber-200/60 mb-4">Wyślij wiadomość do członków.</p>
           <Link href="/dashboard/association/announcements" className="btn-secondary text-sm">Dodaj</Link>
        </div>
        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700">
           <h3 className="text-xl font-bold text-amber-100 mb-2">Kalendarz</h3>
           <p className="text-amber-200/60 mb-4">Nadchodzące wydarzenia i szkolenia.</p>
           <Link href="/dashboard/association/calendar" className="btn-secondary text-sm">Zobacz</Link>
        </div>
      </div>
    </div>
  );
}
