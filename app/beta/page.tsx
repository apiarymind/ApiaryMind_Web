"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { apiPost } from "../../lib/apiClient";

type FormData = {
  name: string;
  email: string;
  hivesCount: number;
  apiaryType: string;
  isAssociationMember: string;
  consent: boolean;
};

export default function BetaPage() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      await apiPost('/beta-candidates', {
        name: data.name,
        email: data.email,
        hivesCount: data.hivesCount,
        apiaryType: data.apiaryType,
        isAssociationMember: data.isAssociationMember === 'yes',
        consent: data.consent,
        source: 'PORTAL_WEB'
      });
      setSubmitted(true);
      reset();
    } catch (err) {
      console.error(err);
      setError("Wystąpił błąd podczas wysyłania zgłoszenia. Spróbuj ponownie później.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-brown-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-brown-800 p-8 rounded-xl border border-amber-500/30 text-center shadow-2xl">
           <div className="text-5xl mb-4">🐝</div>
           <h2 className="text-2xl font-bold text-amber-500 mb-2">Dziękujemy!</h2>
           <p className="text-amber-100 mb-6">Twoje zgłoszenie do programu beta zostało przyjęte. Skontaktujemy się z Tobą mailowo.</p>
           <a href="/" className="text-amber-400 hover:text-amber-300 underline font-semibold">Wróć na stronę główną</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brown-900 text-amber-50 py-12 px-4 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-500 mb-4 tracking-tight">Dołącz do Beta Testów</h1>
          <p className="text-lg text-amber-200/80">Pomóż nam tworzyć najlepszą aplikację dla pszczelarzy. Zgłoś swoją pasiekę do programu testowego.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-brown-800 p-6 md:p-8 rounded-2xl shadow-xl border border-brown-700 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-amber-200 uppercase tracking-wide">Imię i Nazwisko *</label>
              <input
                {...register("name", { required: "To pole jest wymagane" })}
                className="w-full bg-brown-900 border border-brown-600 rounded-lg p-3 text-amber-100 focus:border-amber-500 outline-none transition-colors"
                placeholder="Jan Kowalski"
              />
              {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-amber-200 uppercase tracking-wide">Adres E-mail *</label>
              <input
                {...register("email", {
                  required: "To pole jest wymagane",
                  pattern: { value: /^\S+@\S+$/i, message: "Nieprawidłowy format email" }
                })}
                className="w-full bg-brown-900 border border-brown-600 rounded-lg p-3 text-amber-100 focus:border-amber-500 outline-none transition-colors"
                placeholder="jan@example.com"
              />
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-amber-200 uppercase tracking-wide">Liczba uli *</label>
              <input
                type="number"
                {...register("hivesCount", { required: "To pole jest wymagane", min: 1 })}
                className="w-full bg-brown-900 border border-brown-600 rounded-lg p-3 text-amber-100 focus:border-amber-500 outline-none transition-colors"
                placeholder="np. 25"
              />
              {errors.hivesCount && <p className="text-red-400 text-xs">{errors.hivesCount.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-amber-200 uppercase tracking-wide">Typ pasieki *</label>
              <select
                {...register("apiaryType", { required: "Wybierz typ pasieki" })}
                className="w-full bg-brown-900 border border-brown-600 rounded-lg p-3 text-amber-100 focus:border-amber-500 outline-none transition-colors appearance-none"
              >
                <option value="">-- Wybierz --</option>
                <option value="Stacjonarna">Stacjonarna</option>
                <option value="Wędrowna">Wędrowna</option>
                <option value="Mieszana">Mieszana</option>
              </select>
              {errors.apiaryType && <p className="text-red-400 text-xs">{errors.apiaryType.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-amber-200 uppercase tracking-wide">Czy należysz do związku? *</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  value="yes"
                  {...register("isAssociationMember", { required: "Wybierz opcję" })}
                  className="accent-amber-500 w-4 h-4"
                />
                <span className="text-amber-100 group-hover:text-amber-300">Tak</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  value="no"
                  {...register("isAssociationMember", { required: "Wybierz opcję" })}
                  className="accent-amber-500 w-4 h-4"
                />
                <span className="text-amber-100 group-hover:text-amber-300">Nie</span>
              </label>
            </div>
            {errors.isAssociationMember && <p className="text-red-400 text-xs">{errors.isAssociationMember.message}</p>}
          </div>

          <div className="pt-4 border-t border-brown-700">
            <label className="flex items-start gap-3 cursor-pointer group">
               <input
                 type="checkbox"
                 {...register("consent", { required: "Wymagana zgoda" })}
                 className="mt-1 accent-amber-500 w-5 h-5 flex-shrink-0"
               />
               <span className="text-xs text-amber-200/80 group-hover:text-amber-100 leading-relaxed">
                 Wyrażam zgodę na przetwarzanie moich danych osobowych w celu rekrutacji do programu beta aplikacji ApiaryMind oraz kontakt w tej sprawie. Administratorem danych jest ApiaryMind sp. z o.o.
               </span>
            </label>
            {errors.consent && <p className="text-red-400 text-xs mt-1">{errors.consent.message}</p>}
          </div>

          {error && <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm text-center">{error}</div>}

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-brown-900 font-bold text-lg py-3 rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Wyślij Zgłoszenie
          </button>
        </form>
      </div>
    </div>
  );
}
