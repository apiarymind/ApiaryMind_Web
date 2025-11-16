export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-xl font-bold text-amber-200 mb-2">Panel ApiaryMind</h1>
      <p className="text-sm text-amber-100/85 mb-4">
        Wybierz po lewej, czy chcesz przejść do panelu pszczelarza, związku lub administratora systemu.
      </p>
      <ul className="text-sm text-amber-100/80 list-disc pl-5 space-y-1">
        <li>Panel pszczelarza – podgląd danych z aplikacji Android (ule, przeglądy, raporty).</li>
        <li>Panel związku – ogłoszenia, wydarzenia, komunikacja z członkami.</li>
        <li>Panel admin – pełne zarządzanie stroną (CMS) i betatesterami.</li>
      </ul>
    </div>
  );
}