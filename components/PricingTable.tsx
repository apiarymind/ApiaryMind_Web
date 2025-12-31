import React from 'react';
import { Check, X, Info } from 'lucide-react';

export default function PricingTable() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Plany i Cennik</h2>
        <p className="text-white/60">Wybierz rozwiązanie dopasowane do wielkości Twojej pasieki</p>
      </div>

      {/* Wrapper z przewijaniem dla mniejszych ekranów */}
      <div className="relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-6 text-white/50 font-medium w-1/6 bg-white/5">Funkcja / Pakiet</th>

                {/* PLAN FREE */}
                <th className="p-6 text-center w-1/6 relative group transition-colors hover:bg-white/5">
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                  <div className="text-xl font-bold text-green-400 mb-1">FREE</div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Start</div>
                </th>

                {/* PLAN PLUS */}
                <th className="p-6 text-center w-1/6 relative group transition-colors hover:bg-white/5">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                  <div className="text-xl font-bold text-blue-400 mb-1">PLUS</div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Hobby</div>
                </th>

                {/* PLAN PRO */}
                <th className="p-6 text-center w-1/6 relative bg-white/5 group transition-colors hover:bg-white/10">
                  <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                  <div className="text-xl font-bold text-purple-400 mb-1">PRO</div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Zawodowiec</div>
                </th>

                {/* PLAN PRO+ */}
                <th className="p-6 text-center w-1/6 relative group transition-colors hover:bg-white/5">
                  <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>
                  <div className="text-xl font-bold text-yellow-400 mb-1">PRO+</div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Hodowca</div>
                </th>

                {/* PLAN BUSINESS */}
                <th className="p-6 text-center w-1/6 relative group transition-colors hover:bg-white/5">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-500"></div>
                  <div className="text-xl font-bold text-gray-400 mb-1">BUSINESS</div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Gospodarstwo</div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10 text-white/80">
              {/* CENA */}
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 font-bold text-white bg-white/5">Cena</td>
                <td className="p-4 text-center font-bold text-xl text-white">0 zł</td>
                <td className="p-4 text-center"><div className="font-bold text-xl text-white">~99 zł</div><div className="text-xs text-white/40">/ rok</div></td>
                <td className="p-4 text-center bg-white/5"><div className="font-bold text-xl text-white">~249 zł</div><div className="text-xs text-white/40">/ rok</div></td>
                <td className="p-4 text-center"><div className="font-bold text-xl text-white">&gt; 249 zł</div><div className="text-xs text-white/40">/ rok</div></td>
                <td className="p-4 text-center"><div className="font-bold text-white">Wycena</div><div className="text-xs text-white/40">B2B</div></td>
              </tr>

              {/* PLATFORMY */}
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-white/5">Platformy</td>
                <td className="p-4 text-center" colSpan={5}>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-amber-500">
                        Android + WWW
                    </span>
                </td>
              </tr>

              {/* ULE PRODUKCYJNE */}
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-white/5">
                    <div>Ule Produkcyjne</div>
                    <div className="text-xs text-red-400 mt-1">Hard Limits</div>
                </td>
                <td className="p-4 text-center text-red-400 font-bold">Max 10</td>
                <td className="p-4 text-center text-red-400 font-bold">Max 20</td>
                <td className="p-4 text-center bg-white/5 text-green-400 font-bold">Bez limitu</td>
                <td className="p-4 text-center text-green-400 font-bold">Bez limitu</td>
                <td className="p-4 text-center text-green-400 font-bold">Bez limitu</td>
              </tr>

              {/* ODKŁADY */}
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-white/5">
                    <div>Odkłady</div>
                    <div className="text-xs text-red-400 mt-1">Hard Limits</div>
                </td>
                <td className="p-4 text-center text-red-400 font-bold">Max 2</td>
                <td className="p-4 text-center text-red-400 font-bold">Max 10</td>
                <td className="p-4 text-center bg-white/5 text-green-400 font-bold">Bez limitu</td>
                <td className="p-4 text-center text-green-400 font-bold">Bez limitu</td>
                <td className="p-4 text-center text-green-400 font-bold">Bez limitu</td>
              </tr>

               {/* WAŻNOŚĆ ODKŁADU */}
               <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-white/5">
                    <div>Ważność Odkładu</div>
                    <div className="text-xs text-white/40 mt-1">Czas edycji</div>
                </td>
                <td className="p-4 text-center">
                    <div>3 miesiące</div>
                    <div className="text-[10px] text-white/30 uppercase mt-1">Potem LOCKED</div>
                </td>
                <td className="p-4 text-center">
                    <div>6 miesięcy</div>
                    <div className="text-[10px] text-white/30 uppercase mt-1">Potem LOCKED</div>
                </td>
                <td className="p-4 text-center bg-white/5 text-green-400 font-bold">Zawsze Aktywny</td>
                <td className="p-4 text-center text-green-400 font-bold">Zawsze Aktywny</td>
                <td className="p-4 text-center text-green-400 font-bold">Zawsze Aktywny</td>
              </tr>

              {/* HISTORIA DANYCH */}
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-white/5">
                    <div>Historia (Archiwum)</div>
                </td>
                <td className="p-4 text-center text-white/60">
                    30 Dni
                    <div className="text-[10px] text-white/30 mt-1">Potem wysyłka PDF</div>
                </td>
                <td className="p-4 text-center font-bold text-white">
                    1 Rok + 30 Dni
                </td>
                <td className="p-4 text-center bg-white/5 text-amber-500 font-bold">
                    6 LAT
                    <div className="text-[10px] text-white/40 font-normal mt-1">Wymogi Prawne</div>
                </td>
                <td className="p-4 text-center text-amber-500 font-bold">
                    6 LAT
                </td>
                <td className="p-4 text-center text-amber-500 font-bold">
                    6 LAT
                </td>
              </tr>

              {/* MODUŁ WETERYNARYJNY */}
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-white/5">
                    <div>Moduł Weterynaryjny</div>
                    <div className="text-xs text-white/40 mt-1">Strażnik Karencji</div>
                </td>
                <td className="p-4 text-center"><Check className="inline text-green-500" size={20} /></td>
                <td className="p-4 text-center"><Check className="inline text-green-500" size={20} /></td>
                <td className="p-4 text-center bg-white/5"><Check className="inline text-green-500" size={20} /></td>
                <td className="p-4 text-center"><Check className="inline text-green-500" size={20} /></td>
                <td className="p-4 text-center"><Check className="inline text-green-500" size={20} /></td>
              </tr>

               {/* MODUŁ HODOWLANY */}
               <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-white/5">
                    <div>Moduł Hodowlany</div>
                    <div className="text-xs text-white/40 mt-1">Linie genetyczne</div>
                </td>
                <td className="p-4 text-center text-white/20">-</td>
                <td className="p-4 text-center text-white/20">-</td>
                <td className="p-4 text-center bg-white/5 text-white/60">Podgląd</td>
                <td className="p-4 text-center font-bold text-yellow-400">PEŁNY DOSTĘP</td>
                <td className="p-4 text-center font-bold text-yellow-400">PEŁNY DOSTĘP</td>
              </tr>

              {/* WSPÓŁPRACOWNICY */}
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-white/5">Współpracownicy</td>
                <td className="p-4 text-center text-white/20">-</td>
                <td className="p-4 text-center text-white/20">-</td>
                <td className="p-4 text-center bg-white/5 text-xs text-white/50">Płatne dodatkowo</td>
                <td className="p-4 text-center font-bold text-white">2 w cenie</td>
                <td className="p-4 text-center font-bold text-white">Zarządzanie Zespołem</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Informacje o migracji - stopka (Translated) */}
      <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/60">
        <h4 className="text-white font-bold mb-2 flex items-center gap-2">
            <Info size={16} className="text-amber-500" /> Informacje o zmianie planu:
        </h4>
        <ul className="space-y-1 ml-6 list-disc">
            <li>
                <span className="text-white font-bold">Przejście na wyższy plan:</span> Natychmiastowe zdjęcie blokady LOCKED z odkładów (jeśli mieszczą się w nowym limicie).
            </li>
            <li>
                <span className="text-white font-bold">Przejście na niższy plan:</span> Blokada dodawania nowych uli powyżej limitu. Nadmiarowe ule przechodzą w tryb &quot;Tylko do odczytu&quot;.
            </li>
        </ul>
      </div>
    </div>
  );
}