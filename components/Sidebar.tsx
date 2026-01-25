import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-full h-full border-r border-amber-900/10 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-xl p-6 overflow-y-auto">
      <nav className="space-y-8">
        <div>
          <h3 className="text-xs uppercase text-amber-600 dark:text-amber-400 font-bold mb-3 tracking-wider">Pszczelarz</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/dashboard/beekeeper" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Pulpit</Link></li>
            <li><Link href="/dashboard/beekeeper/apiaries" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Moje Pasieki</Link></li>
            <li><Link href="/dashboard/beekeeper/inspections" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Przeglądy i miodobrania</Link></li>
            <li><Link href="/dashboard/beekeeper/passports" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Paszporty</Link></li>
            <li><Link href="/dashboard/beekeeper/warehouse" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Magazyn</Link></li>
            <li><Link href="/dashboard/beekeeper/reports" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Raporty</Link></li>
            <li><Link href="/dashboard/beekeeper/beta" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Betatesty</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase text-amber-600 dark:text-amber-400 font-bold mb-3 tracking-wider">Związek / Koło</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/dashboard/association" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Pulpit Związku</Link></li>
            <li><Link href="/dashboard/association/members" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Członkowie</Link></li>
            <li><Link href="/dashboard/association/announcements" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Ogłoszenia</Link></li>
            <li><Link href="/dashboard/association/calendar" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Kalendarz</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase text-amber-600 dark:text-amber-400 font-bold mb-3 tracking-wider">Administrator</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/dashboard/admin" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Pulpit Admina</Link></li>
            <li><Link href="/dashboard/admin/users" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Użytkownicy</Link></li>
            <li><Link href="/dashboard/admin/approvals" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Zatwierdzanie zgłoszeń</Link></li>
            <li><Link href="/dashboard/admin/cms-editor" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">CMS Editor</Link></li>
            <li><Link href="/dashboard/admin/configuration" className="block text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Konfiguracja</Link></li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
