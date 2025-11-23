import { getReports } from "../../../../lib/apiServices";

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-500 mb-6">Raporty i Sprzedaż</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <div key={report.id} className="p-4 border border-brown-700 bg-brown-800 rounded-lg flex justify-between items-center hover:border-amber-500 transition-colors">
            <div>
              <h4 className="font-bold text-amber-100">{report.title}</h4>
              <p className="text-xs text-amber-200/60">Data: {report.date}</p>
            </div>
            <a href={report.url} className="btn-secondary text-xs px-3 py-1">Pobierz PDF</a>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-amber-200/60 text-center">
        * Dane generowane na podstawie ewidencji w aplikacji mobilnej.
      </p>
    </div>
  );
}
