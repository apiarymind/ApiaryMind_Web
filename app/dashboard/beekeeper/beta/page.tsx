"use client";

export default function BetaDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Status Beta Testów</h1>
      <div className="bg-brown-800 p-8 rounded-xl border border-brown-700 text-center">
         <div className="text-4xl mb-4">🚧</div>
         <h2 className="text-xl font-bold text-amber-100 mb-2">Moduł w przygotowaniu</h2>
         <p className="text-amber-200/70">Tutaj będziesz widzieć status swojego zgłoszenia i zadania testowe.</p>
      </div>
    </div>
  );
}
