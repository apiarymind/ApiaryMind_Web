import React from 'react';
import { Check, Info, Sparkles } from 'lucide-react';

export default function PricingTable() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Nagłówek sekcji */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-amber-950 dark:text-white mb-4">Plany i Cennik</h2>
        <p className="text-amber-900/70 dark:text-white/60">Wybierz rozwiązanie dopasowane do wielkości Twojej pasieki</p>
      </div>

      {/* Tabela - Adaptacyjne Szkło */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl border transition-colors
                      bg-white/60 border-amber-900/10 
                      dark:bg-black/40 dark:border-white/10">
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-amber-900/10 dark:border-white/10">
                <th className="p-6 font-medium w-1/6 text-amber-900/60 bg-amber-900/5 dark:text-white/50 dark:bg-white/5">Funkcja / Pakiet</th>
                
                {/* FREE */}
                <th className="p-6 text-center w-1/6 relative group transition-colors hover:bg-amber-900/5 dark:hover:bg-white/5">
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">FREE</div>
                  <div className="text-xs text-amber-900/50 dark:text-white/40 uppercase tracking-wider">Start</div>
                </th>

                {/* PLUS */}
                <th className="p-6 text-center w-1/6 relative group transition-colors hover:bg-amber-900/5 dark:hover:bg-white/5">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">PLUS</div>
                  <div className="text-xs text-amber-900/50 dark:text-white/40 uppercase tracking-wider">Hobby</div>
                </th>

                {/* PRO */}
                <th className="p-6 text-center w-1/6 relative group transition-colors bg-amber-900/5 dark:bg-white/5 hover:bg-amber-900/10 dark:hover:bg-white/10">
                  <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">PRO</div>
                  <div className="text-xs text-amber-900/50 dark:text-white/40 uppercase tracking-wider">Zawodowiec</div>
                </th>

                {/* PRO+ (HODOWCA) */}
                <th className="p-6 text-center w-1/6 relative group transition-colors hover:bg-amber-900/5 dark:hover:bg-white/5">
                  <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 dark:bg-yellow-400"></div>
                  <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">PRO+</div>
                  <div className="text-xs text-amber-900/50 dark:text-white/40 uppercase tracking-wider">Hodowca</div>
                </th>

                {/* BUSINESS */}
                <th className="p-6 text-center w-1/6 relative group transition-colors hover:bg-amber-900/5 dark:hover:bg-white/5">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-500"></div>
                  <div className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-1">BUSINESS</div>
                  <div className="text-xs text-amber-900/50 dark:text-white/40 uppercase tracking-wider">Gospodarstwo</div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-amber-900/5 dark:divide-white/10 text-amber-900/80 dark:text-white/80">
              {/* CENA */}
              <tr className="hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 font-bold text-amber-950 dark:text-white bg-amber-900/5 dark:bg-white/5">Cena</td>
                <td className="p-4 text-center font-bold text-xl text-amber-950 dark:text-white">0 zł</td>
                <td className="p-4 text-center"><div className="font-bold text-xl text-amber-950 dark:text-white">~99 zł</div><div className="text-xs opacity-60">/ rok</div></td>
                <td className="p-4 text-center bg-amber-900/5 dark:bg-white/5"><div className="font-bold text-xl text-amber-950 dark:text-white">~249 zł</div><div className="text-xs opacity-60">/ rok</div></td>
                
                {/* CENA PRO+ z gwiazdką */}
                <td className="p-4 text-center">
                    <div className="font-bold text-xl text-amber-950 dark:text-white">250 zł*</div>
                    <div className="text-xs opacity-60">/ rok</div>
                </td>
                
                <td className="p-4 text-center"><div className="font-bold text-amber-950 dark:text-white">Wycena</div><div className="text-xs opacity-60">B2B</div></td>
              </tr>

              {/* PLATFORMY */}
              <tr className="hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-amber-900/5 dark:bg-white/5">Platformy</td>
                <td className="p-4 text-center" colSpan={5}>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-xs font-mono text-amber-700 dark:text-amber-500">
                        Android + WWW
                    </span>
                </td>
              </tr>

              {/* ULE PRODUKCYJNE */}
              <tr className="hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-amber-900/5 dark:bg-white/5">
                    <div>Ule Produkcyjne</div>
                    <div className="text-xs text-red-500 dark:text-red-400 mt-1">Hard Limits</div>
                </td>
                <td className="p-4 text-center text-red-600 dark:text-red-400 font-bold">Max 10</td>
                <td className="p-4 text-center text-red-600 dark:text-red-400 font-bold">Max 20</td>
                <td className="p-4 text-center bg-amber-900/5 dark:bg-white/5 text-green-600 dark:text-green-400 font-bold">Bez limitu</td>
                <td className="p-4 text-center text-green-600 dark:text-green-400 font-bold">Bez limitu</td>
                <td className="p-4 text-center text-green-600 dark:text-green-400 font-bold">Bez limitu</td>
              </tr>

              {/* ODKŁADY */}
              <tr className="hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-amber-900/5 dark:bg-white/5">
                    <div>Odkłady</div>
                    <div className="text-xs text-red-500 dark:text-red-400 mt-1">Hard Limits</div>
                </td>
                <td className="p-4 text-center text-red-600 dark:text-red-400 font-bold">Max 2</td>
                <td className="p-4 text-center text-red-600 dark:text-red-400 font-bold">Max 10</td>
                <td className="p-4 text-center bg-amber-900/5 dark:bg-white/5 text-green-600 dark:text-green-400 font-bold">Bez limitu</td>
                <td className="p-4 text-center text-green-600 dark:text-green-400 font-bold">Bez limitu</td>
                <td className="p-4 text-center text-green-600 dark:text-green-400 font-bold">Bez limitu</td>
              </tr>

               {/* WAŻNOŚĆ ODKŁADU */}
               <tr className="hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-amber-900/5 dark:bg-white/5">
                    <div>Ważność Odkładu</div>
                    <div className="text-xs opacity-60 mt-1">Czas edycji</div>
                </td>
                <td className="p-4 text-center">
                    <div>3 miesiące</div>
                    <div className="text-[10px] opacity-50 uppercase mt-1">Potem LOCKED</div>
                </td>
                <td className="p-4 text-center">
                    <div>6 miesięcy</div>
                    <div className="text-[10px] opacity-50 uppercase mt-1">Potem LOCKED</div>
                </td>
                <td className="p-4 text-center bg-amber-900/5 dark:bg-white/5 text-green-600 dark:text-green-400 font-bold">Zawsze Aktywny</td>
                <td className="p-4 text-center text-green-600 dark:text-green-400 font-bold">Zawsze Aktywny</td>
                <td className="p-4 text-center text-green-600 dark:text-green-400 font-bold">Zawsze Aktywny</td>
              </tr>

              {/* HISTORIA DANYCH */}
              <tr className="hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-amber-900/5 dark:bg-white/5">
                    <div>Historia (Archiwum)</div>
                </td>
                <td className="p-4 text-center opacity-80">
                    30 Dni
                    <div className="text-[10px] opacity-50 mt-1">Potem wysyłka PDF</div>
                </td>
                <td className="p-4 text-center font-bold text-amber-950 dark:text-white">
                    1 Rok + 30 Dni
                </td>
                <td className="p-4 text-center bg-amber-900/5 dark:bg-white/5 text-amber-600 dark:text-amber-500 font-bold">
                    6 LAT
                    <div className="text-[10px] opacity-60 font-normal mt-1">Wymogi Prawne</div>
                </td>
                <td className="p-4 text-center text-amber-600 dark:text-amber-500 font-bold">
                    6 LAT
                </td>
                <td className="p-4 text-center text-amber-600 dark:text-amber-500 font-bold">
                    6 LAT
                </td>
              </tr>

              {/* MODUŁ WETERYNARYJNY */}
              <tr className="hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-amber-900/5 dark:bg-white/5">
                    <div>Moduł Weterynaryjny</div>
                    <div className="text-xs opacity-60 mt-1">Strażnik Karencji</div>
                </td>
                <td className="p-4 text-center"><Check className="inline text-green-500" size={20} /></td>
                <td className="p-4 text-center"><Check className="inline text-green-500" size={20} /></td>
                <td className="p-4 text-center bg-amber-900/5 dark:bg-white/5"><Check className="inline text-green-500" size={20} /></td>
                <td className="p-4 text-center"><Check className="inline text-green-500" size={20} /></td>
                <td className="p-4 text-center"><Check className="inline text-green-500" size={20} /></td>
              </tr>

               {/* MODUŁ HODOWLANY */}
               <tr className="hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-amber-900/5 dark:bg-white/5">
                    <div>Moduł Hodowlany</div>
                    <div className="text-xs opacity-60 mt-1">Linie genetyczne</div>
                </td>
                <td className="p-4 text-center opacity-30">-</td>
                <td className="p-4 text-center opacity-30">-</td>
                <td className="p-4 text-center bg-amber-900/5 dark:bg-white/5 opacity-80">Podgląd</td>
                <td className="p-4 text-center font-bold text-yellow-600 dark:text-yellow-400">PEŁNY DOSTĘP</td>
                <td className="p-4 text-center font-bold text-yellow-600 dark:text-yellow-400">PEŁNY DOSTĘP</td>
              </tr>

              {/* WSPÓŁPRACOWNICY */}
              <tr className="hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 bg-amber-900/5 dark:bg-white/5">Współpracownicy</td>
                <td className="p-4 text-center opacity-30">-</td>
                <td className="p-4 text-center opacity-30">-</td>
                <td className="p-4 text-center bg-amber-900/5 dark:bg-white/5 text-xs opacity-60">Płatne dodatkowo</td>
                <td className="p-4 text-center font-bold text-amber-950 dark:text-white">2 w cenie</td>
                <td className="p-4 text-center font-bold text-amber-950 dark:text-white">Zarządzanie Zespołem</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
      
      {/* STOPKA: Informacje o migracji + Legenda Scoringu */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        
        {/* LEWA KOLUMNA: Migracja */}
        <div className="p-6 rounded-2xl border backdrop-blur-md transition-colors
                        bg-white/60 border-amber-900/10 text-amber-900/80
                        dark:bg-white/5 dark:border-white/10 dark:text-white/70">
            <h4 className="font-bold mb-3 flex items-center gap-2 text-amber-950 dark:text-white">
                <Info size={16} className="text-amber-600 dark:text-amber-500" /> Zmiana planu:
            </h4>
            <ul className="space-y-2 ml-4 list-disc">
                <li>
                    <span className="font-bold text-amber-950 dark:text-white">Wyższy plan:</span> Natychmiastowe zdjęcie blokady LOCKED z odkładów.
                </li>
                <li>
                    <span className="font-bold text-amber-950 dark:text-white">Niższy plan:</span> Nadmiarowe ule przechodzą w tryb &quot;Tylko do odczytu&quot;.
                </li>
            </ul>
        </div>

        {/* PRAWA KOLUMNA: AI Scoring (Zaktualizowane) */}
        <div className="p-6 rounded-2xl border backdrop-blur-md transition-colors
                        bg-white/60 border-amber-900/10 text-amber-900/80
                        dark:bg-white/5 dark:border-white/10 dark:text-white/70">
            <h4 className="font-bold mb-3 flex items-center gap-2 text-amber-950 dark:text-white">
                <Sparkles size={16} className="text-yellow-500" /> * AI Scoring:
            </h4>
            <p className="mb-2 text-xs opacity-90">
               Cena 250 zł obowiązuje do momentu pełnego uruchomienia modułu AI Scoring.
            </p>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs italic">
                &quot;Scoring to ocena wartości hodowlanej matek (Miodność, Łagodność, Rojliwość, Zimowla) na podstawie anonimowych danych zbieranych od użytkowników.
                Matka otrzymuje od hodowcy unikalny Wirtualny Paszport, który pszczelarz dodaje do swojej pasieki – na tej podstawie system agreguje wyniki danej linii.&quot;
            </div>
        </div>

      </div>
    </div>
  );
}