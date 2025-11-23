import Link from "next/link";

export default function BeekeeperDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Pulpit Pszczelarza</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700">
           <h3 className="text-xl font-bold text-amber-100 mb-2">Moje Pasieki</h3>
           <p className="text-amber-200/60 mb-4">Zarządzaj swoimi pasiekami i ulami.</p>
           <Link href="/dashboard/beekeeper/apiaries" className="btn-secondary text-sm">Przejdź</Link>
        </div>
        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700">
           <h3 className="text-xl font-bold text-amber-100 mb-2">Przeglądy</h3>
           <p className="text-amber-200/60 mb-4">Historia przeglądów i miodobrań.</p>
           <Link href="/dashboard/beekeeper/inspections" className="btn-secondary text-sm">Przejdź</Link>
        </div>
        <div className="bg-brown-800 p-6 rounded-xl border border-brown-700">
           <h3 className="text-xl font-bold text-amber-100 mb-2">Magazyn</h3>
           <p className="text-amber-200/60 mb-4">Stan sprzętu i produktów.</p>
           <Link href="/dashboard/beekeeper/warehouse" className="btn-secondary text-sm">Przejdź</Link>
        </div>
         <div className="bg-brown-800 p-6 rounded-xl border border-brown-700">
           <h3 className="text-xl font-bold text-amber-100 mb-2">Raporty</h3>
           <p className="text-amber-200/60 mb-4">Raporty sprzedaży i produkcji.</p>
           <Link href="/dashboard/beekeeper/reports" className="btn-secondary text-sm">Przejdź</Link>
        </div>
         <div className="bg-brown-800 p-6 rounded-xl border border-brown-700">
           <h3 className="text-xl font-bold text-amber-100 mb-2">Betatesty</h3>
           <p className="text-amber-200/60 mb-4">Zgłaszanie błędów i scenariusze testowe.</p>
           <Link href="/dashboard/beekeeper/beta" className="btn-secondary text-sm">Przejdź</Link>
        </div>
      </div>
    </div>
  );
}
