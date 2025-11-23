"use client";

import { FormEvent } from "react";

export default function BetaSignupForm() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert("Dziękujemy za zgłoszenie! (To jest wersja demonstracyjna)");
  };

  return (
    <form className="space-y-4 text-left p-6 bg-brown-900 rounded-xl border border-brown-700 shadow-xl" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="label">Adres email</label>
        <input type="email" id="email" className="input" placeholder="twoj@email.com" required />
      </div>
      <div>
        <label htmlFor="role" className="label">Kim jesteś?</label>
        <select id="role" className="input">
          <option value="beekeeper">Pszczelarzem</option>
          <option value="association">Przedstawicielem związku</option>
        </select>
      </div>
      <div>
        <label htmlFor="msg" className="label">Dlaczego chcesz testować?</label>
        <textarea id="msg" className="input h-24" placeholder="Krótki opis Twojej pasieki..."></textarea>
      </div>
      <button type="submit" className="btn-primary w-full justify-center">
        Wyślij zgłoszenie
      </button>
      <p className="text-xs text-center text-amber-200/60 mt-2">
        * To jest formularz demonstracyjny. W prawdziwej wersji dane trafią do Strapi.
      </p>
    </form>
  );
}
