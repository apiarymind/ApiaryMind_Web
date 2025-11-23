import Link from "next/link";
import VideoTutorialSection from "../../components/VideoTutorialSection";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-amber-500">Panel Główny</h1>
      <p className="text-lg text-amber-100">Witaj w systemie ApiaryMind. Wybierz panel, który Cię interesuje:</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/beekeeper" className="block p-6 rounded-xl border border-brown-700 bg-brown-800 hover:border-amber-500 hover:shadow-lg transition-all group">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🐝</div>
          <h2 className="text-xl font-bold text-amber-400 mb-2">Panel Pszczelarza</h2>
          <p className="text-sm text-amber-200/80">Zarządzaj swoimi pasiekami, przeglądami i magazynem.</p>
        </Link>

        <Link href="/dashboard/association" className="block p-6 rounded-xl border border-brown-700 bg-brown-800 hover:border-amber-500 hover:shadow-lg transition-all group">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏛️</div>
          <h2 className="text-xl font-bold text-amber-400 mb-2">Panel Związku</h2>
          <p className="text-sm text-amber-200/80">Zarządzaj członkami koła, ogłoszeniami i wydarzeniami.</p>
        </Link>

        <Link href="/dashboard/admin" className="block p-6 rounded-xl border border-brown-700 bg-brown-800 hover:border-amber-500 hover:shadow-lg transition-all group">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔧</div>
          <h2 className="text-xl font-bold text-amber-400 mb-2">Panel Administratora</h2>
          <p className="text-sm text-amber-200/80">Zarządzaj użytkownikami, systemem i treściami CMS.</p>
        </Link>
      </div>

      <VideoTutorialSection />
    </div>
  );
}
