"use client";

import { useState, FormEvent } from "react";

type BetaForm = {
  name: string;
  email: string;
  hives: string;
  associationMember: "tak" | "nie" | "";
  associationName: string;
  apiaryType: "stacjonarna" | "wedrowna" | "mieszana" | "";
  consent: boolean;
};

export default function BetaPage() {
  const [form, setForm] = useState<BetaForm>({
    name: "",
    email: "",
    hives: "",
    associationMember: "",
    associationName: "",
    apiaryType: "",
    consent: false
  });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.hives || !form.apiaryType || !form.consent) {
      alert("Uzupełnij wszystkie wymagane pola i zaznacz zgodę RODO.");
      return;
    }
    try {
      setStatus("sending");
      await fetch("/api/beta-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      setStatus("ok");
      setForm({
        name: "",
        email: "",
        hives: "",
        associationMember: "",
        associationName: "",
        apiaryType: "",
        consent: false
      });
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-amber-200 mb-4">
        Zgłoszenie do programu beta ApiaryMind
      </h1>
      <p className="text-amber-100/90 text-sm mb-6">
        Szukamy ok. 50 betatesterów z różnymi wielkościami pasiek i doświadczeniem.
        Wypełnij formularz – spośród zgłoszeń wybierzemy najbardziej pasujące do scenariuszy testowych.
      </p>

      <form onSubmit={onSubmit} className="space-y-4 bg-brown-800/70 border border-brown-700 rounded-xl p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Imię i nazwisko *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Jan Kowalski"
            />
          </div>
          <div>
            <label className="label">E-mail *</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="jan@pasieka.pl"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">Liczba uli *</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.hives}
              onChange={e => setForm({ ...form, hives: e.target.value })}
              placeholder="np. 25"
            />
          </div>
          <div>
            <label className="label">Typ pasieki *</label>
            <select
              className="input"
              value={form.apiaryType}
              onChange={e => setForm({ ...form, apiaryType: e.target.value as any })}
            >
              <option value="">Wybierz</option>
              <option value="stacjonarna">Stacjonarna</option>
              <option value="wedrowna">Wędrowna</option>
              <option value="mieszana">Mieszana</option>
            </select>
          </div>
          <div>
            <label className="label">Członek związku? *</label>
            <select
              className="input"
              value={form.associationMember}
              onChange={e => setForm({ ...form, associationMember: e.target.value as any })}
            >
              <option value="">Wybierz</option>
              <option value="tak">Tak</option>
              <option value="nie">Nie</option>
            </select>
          </div>
        </div>

        {form.associationMember === "tak" && (
          <div>
            <label className="label">Nazwa związku / koła pszczelarskiego</label>
            <input
              className="input"
              value={form.associationName}
              onChange={e => setForm({ ...form, associationName: e.target.value })}
              placeholder="np. Koło Pszczelarzy w ..."
            />
          </div>
        )}

        <div className="flex items-start gap-2">
          <input
            id="consent"
            type="checkbox"
            className="mt-1"
            checked={form.consent}
            onChange={e => setForm({ ...form, consent: e.target.checked })}
          />
          <label htmlFor="consent" className="text-xs text-amber-100/80 leading-snug">
            Wyrażam zgodę na przetwarzanie moich danych osobowych w celu rekrutacji
            do programu beta aplikacji ApiaryMind oraz kontakt w tej sprawie.
          </label>
        </div>

        <div className="flex justify-end gap-3">
          {status === "ok" && (
            <span className="text-xs text-emerald-300">
              Zgłoszenie zapisane. Jeśli zostaniesz wybrany, skontaktujemy się mailowo.
            </span>
          )}
          {status === "error" && (
            <span className="text-xs text-red-300">
              Wystąpił błąd zapisu. Spróbuj ponownie później.
            </span>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Wysyłanie…" : "Wyślij zgłoszenie"}
          </button>
        </div>
      </form>
    </div>
  );
}