import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-amber-200 tracking-tight">
            ApiaryMind – inteligentny ekosystem dla pszczelarzy
          </h1>
          <p className="mt-4 text-amber-100/90 leading-relaxed">
            Aplikacja Android + portal WWW do zarządzania pasiekami, raportami RHD,
            magazynem, miodobraniami oraz współpracą ze związkami pszczelarskimi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/beta"
              className="btn-primary"
            >
              Zapisz się do beta testów
            </Link>
            <Link
              href="/dashboard"
              className="btn-secondary"
            >
              Przejdź do panelu
            </Link>
          </div>
          <ul className="mt-6 space-y-1 text-amber-100/80 text-sm">
            <li>• Offline-first z synchronizacją z serwerem</li>
            <li>• Raporty RHD, sprzedaż bezpośrednia, magazyn</li>
            <li>• Integracja z panelami związków pszczelarskich</li>
          </ul>
        </div>

        <div className="bg-brown-800/70 border border-brown-700 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-amber-200">
            Co znajdziesz w wersji WWW?
          </h2>
          <ul className="mt-4 space-y-2 text-amber-100/85 text-sm">
            <li>✅ Podgląd pasiek, uli i raportów</li>
            <li>✅ Panel związku / koła pszczelarskiego (ogłoszenia, wydarzenia)</li>
            <li>✅ Panel administratora – CMS do zarządzania stroną</li>
            <li>✅ Ankiety i formularze dla betatesterów</li>
          </ul>
        </div>
      </section>
    </div>
  );
}