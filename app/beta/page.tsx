"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Send, Smartphone, MapPin, Users, Hexagon, Crown, Sparkles, Rocket, CheckCircle2 } from "lucide-react";

export default function BetaSignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const supabase = createClient();

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    hiveCount: "",
    voivodeship: "",
    isBreeder: false,
    hasEmployees: false,
    consent: false
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase
      .from('beta_signups')
      .insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_model: formData.phone,
        hive_count: parseInt(formData.hiveCount),
        voivodeship: formData.voivodeship,
        is_breeder: formData.isBreeder,
        has_employees: formData.hasEmployees
      });

    setIsLoading(false);

    if (error) {
      alert("Błąd wysyłania: " + error.message);
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-transparent">
        <div className="max-w-md p-10 rounded-3xl border backdrop-blur-xl text-center shadow-2xl
                        bg-green-500/10 border-green-500/20">
            <CheckCircle2 size={80} className="mx-auto text-green-500 mb-6" />
            <h2 className="text-4xl font-bold text-amber-950 dark:text-white mb-4">Dziękujemy!</h2>
            <p className="text-lg text-amber-900/70 dark:text-white/70 leading-relaxed">
                Twoje zgłoszenie zostało przyjęte.<br/>
                Odezwiemy się do wybranych osób mailowo, aby przekazać instrukcje instalacji.
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 py-24 bg-transparent selection:bg-amber-500 selection:text-black">

        {/* --- HEADER SECTION --- */}
        <div className="w-full max-w-3xl mb-12 text-center">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-600 dark:text-amber-500 mb-6 backdrop-blur-sm">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="font-bold tracking-wide">REKRUTACJA OTWARTA</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-amber-950 dark:text-white mb-6 tracking-tight drop-shadow-sm">
                Dołącz do <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-500">Beta Testów</span>
            </h1>

            <p className="text-xl text-amber-900/60 dark:text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
                Pomóż nam stworzyć najlepsze narzędzie dla pszczelarzy w Polsce i zyskaj dostęp do technologii jutra.
            </p>

            {/* BENEFITS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {/* Benefit 1 */}
                <div className="p-5 rounded-2xl border backdrop-blur-md transition-transform hover:-translate-y-1
                                bg-white/40 border-amber-900/10 dark:bg-amber-500/10 dark:border-amber-500/20">
                    <h3 className="font-bold text-lg text-amber-950 dark:text-white flex items-center gap-2 mb-2">
                        <Crown size={20} className="text-amber-600 dark:text-amber-500" />
                        Plan PRO+ Za Darmo
                    </h3>
                    <p className="text-sm text-amber-900/70 dark:text-white/70 leading-relaxed">
                        Wybrani testerzy otrzymają <strong>2 lata subskrypcji PRO+</strong> (wartość ~500 zł) w prezencie za aktywny udział.
                    </p>
                </div>

                {/* Benefit 2 */}
                <div className="p-5 rounded-2xl border backdrop-blur-md transition-transform hover:-translate-y-1
                                bg-white/40 border-amber-900/10 dark:bg-blue-500/10 dark:border-blue-500/20">
                    <h3 className="font-bold text-lg text-amber-950 dark:text-white flex items-center gap-2 mb-2">
                        <Rocket size={20} className="text-blue-600 dark:text-blue-500" />
                        Early Access
                    </h3>
                    <p className="text-sm text-amber-900/70 dark:text-white/70 leading-relaxed">
                        Stały dostęp do eksperymentalnych funkcji (AI Scoring, Analiza Głosu) przed oficjalną premierą.
                    </p>
                </div>
            </div>
        </div>

        {/* --- TARGET GROUPS INFO --- */}
        <div className="w-full max-w-3xl mb-8 p-8 rounded-3xl backdrop-blur-xl border shadow-lg
                        bg-white/60 border-amber-900/10
                        dark:bg-black/40 dark:border-white/10">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-6 text-amber-900/50 dark:text-white/50 flex items-center gap-2">
                <Users size={16} /> Poszukiwane profile pasiek
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-amber-900/90 dark:text-white/90">
                <div className="flex items-center gap-3">
                    <Hexagon size={18} className="text-green-600 dark:text-green-500" />
                    <span>Hobbyści <span className="text-amber-900/50 dark:text-white/50 text-sm">(do 10 uli)</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <Hexagon size={18} className="text-blue-600 dark:text-blue-500" />
                    <span>Małe Pasieki <span className="text-amber-900/50 dark:text-white/50 text-sm">(10-20 uli)</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <Hexagon size={18} className="text-purple-600 dark:text-purple-500" />
                    <span>Średnie Pasieki <span className="text-amber-900/50 dark:text-white/50 text-sm">(30-80 uli)</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <Crown size={18} className="text-yellow-600 dark:text-yellow-500" />
                    <span className="font-bold">Hodowcy Matek</span>
                </div>
                <div className="flex items-center gap-3">
                    <Users size={18} className="text-gray-600 dark:text-gray-400" />
                    <span className="font-bold">Pasieki z pracownikami</span>
                </div>
            </div>
        </div>

        {/* --- SIGNUP FORM --- */}
        <div className="w-full max-w-3xl p-8 md:p-12 rounded-3xl shadow-2xl backdrop-blur-xl border transition-colors duration-300
                        bg-white/80 border-amber-900/10
                        dark:bg-black/60 dark:border-white/10">

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Section: Dane Osobowe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-amber-900/60 dark:text-white/60">Imię *</label>
                        <input required name="firstName" type="text" onChange={handleChange} placeholder="Jan"
                               className="w-full px-4 py-3.5 rounded-xl border outline-none transition-all font-medium
                                          bg-white/50 border-amber-900/10 text-amber-950 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20
                                          dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-amber-500 dark:focus:bg-black/60" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-amber-900/60 dark:text-white/60">Nazwisko *</label>
                        <input required name="lastName" type="text" onChange={handleChange} placeholder="Kowalski"
                               className="w-full px-4 py-3.5 rounded-xl border outline-none transition-all font-medium
                                          bg-white/50 border-amber-900/10 text-amber-950 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20
                                          dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-amber-500 dark:focus:bg-black/60" />
                    </div>
                </div>

                {/* Section: Kontakt & Tech */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-amber-900/60 dark:text-white/60">E-mail *</label>
                        <input required name="email" type="email" onChange={handleChange} placeholder="jan@przyklad.pl"
                               className="w-full px-4 py-3.5 rounded-xl border outline-none transition-all font-medium
                                          bg-white/50 border-amber-900/10 text-amber-950 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20
                                          dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-amber-500 dark:focus:bg-black/60" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-amber-900/60 dark:text-white/60 flex items-center gap-1">
                            <Smartphone size={14}/> Model Telefonu (Android) *
                        </label>
                        <input required name="phone" type="text" placeholder="np. Samsung S23" onChange={handleChange}
                               className="w-full px-4 py-3.5 rounded-xl border outline-none transition-all font-medium
                                          bg-white/50 border-amber-900/10 text-amber-950 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20
                                          dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-amber-500 dark:focus:bg-black/60" />
                    </div>
                </div>

                {/* Section: Pasieka */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-amber-900/60 dark:text-white/60">Liczba Uli *</label>
                        <input required name="hiveCount" type="number" placeholder="20" onChange={handleChange}
                               className="w-full px-4 py-3.5 rounded-xl border outline-none transition-all font-medium
                                          bg-white/50 border-amber-900/10 text-amber-950 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20
                                          dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-amber-500 dark:focus:bg-black/60" />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-amber-900/60 dark:text-white/60 flex items-center gap-1">
                           <MapPin size={14}/> Województwo (Baza do Scoringu) *
                        </label>
                        <select required name="voivodeship" onChange={handleChange}
                                className="w-full px-4 py-3.5 rounded-xl border outline-none transition-all appearance-none font-medium
                                           bg-white/50 border-amber-900/10 text-amber-950 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20
                                           dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-amber-500 dark:focus:bg-black/60">
                            <option value="">-- Wybierz --</option>
                            <option value="dolnoslaskie">Dolnośląskie</option>
                            <option value="kujawskopomorskie">Kujawsko-Pomorskie</option>
                            <option value="lubelskie">Lubelskie</option>
                            <option value="lubuskie">Lubuskie</option>
                            <option value="lodzkie">Łódzkie</option>
                            <option value="malopolskie">Małopolskie</option>
                            <option value="mazowieckie">Mazowieckie</option>
                            <option value="opolskie">Opolskie</option>
                            <option value="podkarpackie">Podkarpackie</option>
                            <option value="podlaskie">Podlaskie</option>
                            <option value="pomorskie">Pomorskie</option>
                            <option value="slaskie">Śląskie</option>
                            <option value="swietokrzyskie">Świętokrzyskie</option>
                            <option value="warminskomazurskie">Warmińsko-Mazurskie</option>
                            <option value="wielkopolskie">Wielkopolskie</option>
                            <option value="zachodniopomorskie">Zachodniopomorskie</option>
                        </select>
                    </div>
                </div>

                {/* Section: Checkboxy (Special) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border
                                      bg-white/40 border-amber-900/10 hover:bg-amber-500/10 hover:border-amber-500
                                      dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-amber-500">
                        <input type="checkbox" name="isBreeder" onChange={handleChange}
                               className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 bg-transparent border-amber-900/30 dark:border-white/30" />
                        <span className="text-sm font-bold text-amber-950 dark:text-white">Prowadzę hodowlę matek</span>
                    </label>

                    <label className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border
                                      bg-white/40 border-amber-900/10 hover:bg-amber-500/10 hover:border-amber-500
                                      dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-amber-500">
                        <input type="checkbox" name="hasEmployees" onChange={handleChange}
                               className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 bg-transparent border-amber-900/30 dark:border-white/30" />
                        <span className="text-sm font-bold text-amber-950 dark:text-white">Zatrudniam pracowników</span>
                    </label>
                </div>

                {/* Consent */}
                <div className="flex items-start gap-3 pt-4 border-t border-amber-900/10 dark:border-white/10">
                    <input required id="consent" name="consent" type="checkbox" onChange={handleChange}
                           className="mt-1 w-5 h-5 rounded border-amber-900/20 text-amber-500 focus:ring-amber-500 bg-transparent" />
                    <label htmlFor="consent" className="text-sm text-amber-900/60 dark:text-white/60 leading-tight cursor-pointer">
                        Wyrażam zgodę na przetwarzanie danych w celu rekrutacji do programu Beta. Rozumiem, że liczba miejsc jest ograniczona.
                    </label>
                </div>

                <button disabled={isLoading}
                        type="submit"
                        className="w-full py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2
                                   bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500
                                   disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? 'Wysyłanie...' : <><Send size={20} /> Wyślij Zgłoszenie</>}
                </button>
            </form>
        </div>
    </div>
  );
}
