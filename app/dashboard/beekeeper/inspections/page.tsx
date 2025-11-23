import { getInspections } from "../../../../lib/apiServices";

export default async function InspectionsPage() {
  const inspections = await getInspections();

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-500 mb-6">Przeglądy i Miodobrania</h1>
      <div className="overflow-x-auto rounded-xl border border-brown-700">
        <table className="w-full text-left text-sm text-amber-100">
          <thead className="bg-brown-800 text-amber-500 uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Pasieka</th>
              <th className="px-6 py-3">Typ</th>
              <th className="px-6 py-3">Notatki</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brown-700 bg-brown-900/50">
            {inspections.map((inspection) => (
              <tr key={inspection.id} className="hover:bg-brown-800/30 transition-colors">
                <td className="px-6 py-4 font-mono text-amber-200/80">{inspection.date}</td>
                <td className="px-6 py-4">{inspection.apiary}</td>
                <td className="px-6 py-4 font-bold text-amber-400">{inspection.type}</td>
                <td className="px-6 py-4 text-amber-100/70">{inspection.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
