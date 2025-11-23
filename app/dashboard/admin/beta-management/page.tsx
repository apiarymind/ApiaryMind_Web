import { getBetaScenarios } from "../../../../lib/apiServices";

export default async function BetaManagementPage() {
  const scenarios = await getBetaScenarios();

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-500 mb-6">Zarządzanie Betatestami</h1>
      <div className="overflow-x-auto rounded-xl border border-brown-700">
         <table className="w-full text-left text-sm text-amber-100">
          <thead className="bg-brown-800 text-amber-500 uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-3">Scenariusz</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brown-700 bg-brown-900/50">
            {scenarios.map((scenario: any) => (
              <tr key={scenario.id}>
                <td className="px-6 py-4">{scenario.title}</td>
                <td className="px-6 py-4">{scenario.status}</td>
                <td className="px-6 py-4"><button className="text-amber-500">Edytuj</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
