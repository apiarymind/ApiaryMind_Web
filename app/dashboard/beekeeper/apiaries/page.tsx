import { getApiaries } from "../../../../lib/apiServices";

export default async function ApiariesPage() {
  const apiaries = await getApiaries();

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-500 mb-6">Moje Pasieki</h1>
      <div className="overflow-x-auto rounded-xl border border-brown-700">
        <table className="w-full text-left text-sm text-amber-100">
          <thead className="bg-brown-800 text-amber-500 uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-3">Nazwa</th>
              <th className="px-6 py-3">Lokalizacja</th>
              <th className="px-6 py-3 text-right">Liczba uli</th>
              <th className="px-6 py-3 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brown-700 bg-brown-900/50">
            {apiaries.map((apiary) => (
              <tr key={apiary.id} className="hover:bg-brown-800/30 transition-colors">
                <td className="px-6 py-4 font-medium">{apiary.name}</td>
                <td className="px-6 py-4 text-amber-200/80">{apiary.location}</td>
                <td className="px-6 py-4 text-right">{apiary.hives}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-amber-500 hover:underline">Szczegóły</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
