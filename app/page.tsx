import Link from 'next/link';
import BetaSignupForm from '../components/BetaSignupForm';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-brown-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none select-none">
             {/* Hex pattern placeholder */}
             <svg width="100%" height="100%">
                <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                    <path d="M24.8,22l12.4-7.2v-14.4l-12.4-7.2l-12.4,7.2v14.4L24.8,22z" fill="none" stroke="#F4B524" strokeWidth="1"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#hexagons)" />
             </svg>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-amber-500 mb-6 drop-shadow-md">
            ApiaryMind
          </h1>
          <p className="text-xl md:text-2xl text-amber-100 mb-8 font-light">
            Kompleksowy system zarządzania pasieką.<br/>
            Aplikacja mobilna na Androida + Portal WWW.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn-primary text-lg px-8 py-3 no-underline">
              Wejdź do Panelu
            </Link>
            <Link href="#beta" className="btn-secondary text-lg px-8 py-3 no-underline">
              Dołącz do Beta testów
            </Link>
          </div>
        </div>
      </section>

      {/* Target Audience Sections */}
      <section className="py-16 px-4 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        <div className="p-6 rounded-2xl bg-brown-800/50 border border-brown-700">
          <h3 className="text-2xl font-bold text-amber-400 mb-4">Dla Pszczelarzy</h3>
          <p className="text-amber-200/80 mb-4">
            Prowadź ewidencję pasiek i uli. Notuj przeglądy i miodobrania bezpośrednio w aplikacji mobilnej.
            Analizuj raporty i zarządzaj magazynem sprzętu przez WWW.
          </p>
          <ul className="list-disc list-inside text-sm text-amber-100/70 space-y-1">
            <li>Ewidencja uli i matek</li>
            <li>Rejestracja przeglądów (Głosowa/Touch)</li>
            <li>Magazyn sprzętu i produktów</li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-brown-800/50 border border-brown-700">
          <h3 className="text-2xl font-bold text-amber-400 mb-4">Dla Związków</h3>
          <p className="text-amber-200/80 mb-4">
            Usprawnij komunikację z członkami koła. Wysyłaj ogłoszenia i zarządzaj listą członków.
          </p>
          <ul className="list-disc list-inside text-sm text-amber-100/70 space-y-1">
            <li>Ewidencja członków</li>
            <li>Powiadomienia i ogłoszenia</li>
            <li>Kalendarz wydarzeń</li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-brown-800/50 border border-brown-700">
          <h3 className="text-2xl font-bold text-amber-400 mb-4">Dla Administratorów</h3>
          <p className="text-amber-200/80 mb-4">
            Pełna kontrola nad systemem, zarządzanie treściami CMS i weryfikacja zgłoszeń.
          </p>
        </div>
      </section>

      {/* Beta Form Section */}
      <section id="beta" className="py-16 px-4 bg-brown-800 border-y border-brown-700">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-amber-500 mb-6">Dołącz do Beta Testów</h2>
          <p className="text-amber-100 mb-8">
            Chcesz sprawdzić ApiaryMind w akcji? Zapisz się, aby otrzymać dostęp do wersji testowej aplikacji i portalu.
          </p>
          <BetaSignupForm />
        </div>
      </section>
    </div>
  );
}
