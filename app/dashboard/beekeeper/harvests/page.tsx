import Link from "next/link";

export default function HarvestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-600 dark:text-amber-500">Miodobrania</h1>
        <p className="text-sm text-gray-700 dark:text-amber-200/70 mt-1">
          Miodobrania dodajesz bezpośrednio w szczegółach ula.
        </p>
      </div>

      <div className="bg-white dark:bg-brown-800/50 border border-gray-300 dark:border-brown-700 rounded-xl p-6 space-y-3 shadow-lg dark:shadow-none">
        <p className="text-gray-900 dark:text-amber-100">
          Przejdź do ula i użyj przycisku <strong>Dodaj Miodobranie</strong>.
        </p>
        <Link
          href="/dashboard/hives"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-brown-900 font-bold px-4 py-2 rounded-lg transition-colors"
        >
          Przejdź do listy uli
        </Link>
      </div>
    </div>
  );
}
