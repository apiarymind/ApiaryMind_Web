import { notFound } from "next/navigation";
import VideoSection from "../../components/VideoSection";
import PricingTable from "../../components/PricingTable"; 
import Link from "next/link";
import { 
  Hexagon, ShieldCheck, BarChart3, FlaskConical, 
  Mic, Dna, Moon, Gift, ArrowRight 
} from "lucide-react";

export async function generateStaticParams() {
  return [{ slug: 'demo' }, { slug: 'regulamin' }, { slug: 'polityka-prywatnosci' }, { slug: 'landing' }];
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  let page = null;

  // --- 1. LANDING PAGE CONFIGURATION ---
  if (params.slug === 'landing') {
    page = {
      title: 'Witaj w ApiaryMind',
      sections: [
        { id: 'hero', type: 'HERO' },
        { id: 'features', type: 'FEATURES' },
        { id: 'pricing', type: 'PRICING' },
        { id: 'promo', type: 'BETA_PROMO' }
      ]
    };
  }

  // --- 2. REGULAMIN (TERMS) CONFIGURATION ---
  else if (params.slug === 'regulamin') {
    page = {
      title: 'REGULAMIN',
      sections: [{
        id: 1,
        type: 'TEXT',
        content: `
          <h3 class="text-xl font-bold mb-4 text-amber-500">§1. Postanowienia Ogólne</h3>
          <p class="mb-4">1. Niniejszy Regulamin określa zasady korzystania z aplikacji mobilnej i serwisu internetowego ApiaryMind.<br/>
          2. Właścicielem praw autorskich i operatorem systemu jest <strong>ApiaryMind</strong>, zwany dalej "Usługodawcą".</p>

          <h3 class="text-xl font-bold mb-4 text-amber-500">§2. Rodzaje i Zakres Usług</h3>
          <p class="mb-4">1. ApiaryMind to narzędzie wspomagające zarządzanie pasieką, oferujące m.in.: ewidencję uli, harmonogram zadań, moduł weterynaryjny oraz analizę danych (AI Scoring).<br/>
          2. <strong>Ważne zastrzeżenie:</strong> Moduł Weterynaryjny (Strażnik Karencji) pełni funkcję pomocniczą. Użytkownik jest zobowiązany do każdorazowej weryfikacji okresów karencji leków zgodnie z ulotką producenta. Usługodawca nie ponosi odpowiedzialności za szkody wynikłe z błędnego stosowania leków.</p>

          <h3 class="text-xl font-bold mb-4 text-amber-500">§3. Subskrypcje i Płatności</h3>
          <p class="mb-4">1. Aplikacja oferuje plany darmowe (FREE) oraz płatne (PLUS, PRO, PRO+, BUSINESS).<br/>
          2. Płatności za subskrypcje realizowane są wyłącznie za pośrednictwem sklepu Google Play Store.<br/>
          3. Ceny i zakres funkcji poszczególnych planów określa aktualny Cennik dostępny w aplikacji.</p>

          <h3 class="text-xl font-bold mb-4 text-amber-500">§4. AI Scoring i Własność Danych</h3>
          <p class="mb-4">1. Użytkownik zachowuje pełne prawa do wprowadzonych przez siebie danych osobowych.<br/>
          2. Użytkownik udziela Usługodawcy niewyłącznej, nieodpłatnej licencji na wykorzystanie <strong>zanonimizowanych</strong> danych produkcyjnych (np. miodność, łagodność, lokalizacja na poziomie województwa) w celu trenowania algorytmów AI oraz generowania rankingów linii genetycznych (Scoring).</p>

          <h3 class="text-xl font-bold mb-4 text-amber-500">§5. Odpowiedzialność</h3>
          <p class="mb-4">1. Usługodawca dokłada wszelkich starań, aby system działał nieprzerwanie, jednak zastrzega sobie prawo do przerw technicznych.<br/>
          2. Aplikacja ma charakter narzędziowy. Decyzje hodowlane i biznesowe podejmuje Użytkownik na własne ryzyko.</p>
        `
      }]
    };
  }

  // --- 3. POLITYKA PRYWATNOŚCI CONFIGURATION ---
  else if (params.slug === 'polityka-prywatnosci') {
    page = {
      title: 'POLITYKA PRYWATNOŚCI',
      sections: [{
        id: 1,
        type: 'TEXT',
        content: `
          <h3 class="text-xl font-bold mb-4 text-amber-500">1. Administrator Danych</h3>
          <p class="mb-4">Administratorem Twoich danych osobowych jest <strong>ApiaryMind</strong>. Dbamy o to, by Twoje dane były bezpieczne i przetwarzane zgodnie z RODO.</p>

          <h3 class="text-xl font-bold mb-4 text-amber-500">2. Jakie dane zbieramy i po co?</h3>
          <ul class="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Dane konta:</strong> E-mail, Imię, Nazwisko (do obsługi logowania i synchronizacji danych).</li>
            <li><strong>Lokalizacja Pasiek (GPS):</strong> Niezbędna do funkcji pogodowych, mapy pożytków oraz anonimowych statystyk regionalnych.</li>
            <li><strong>Dane o ulach i matkach:</strong> Służą do prowadzenia Twojej ewidencji oraz (w formie anonimowej) do budowania systemu oceny genetyki (AI Scoring).</li>
            <li><strong>Zdjęcia i Notatki głosowe:</strong> Przetwarzane w celu realizacji funkcji "Voice-to-Text" i dokumentacji pasiecznej.</li>
          </ul>

          <h3 class="text-xl font-bold mb-4 text-amber-500">3. Bezpieczeństwo AI i Anonimizacja</h3>
          <p class="mb-4">Twoja prywatność jest priorytetem. Dane wykorzystywane do modułu AI Scoring (ocena linii hodowlanych) są <strong>całkowicie anonimizowane</strong>. System "widzi", że w województwie X linia Y dała Z miodu, ale nie wie, że to Twoja pasieka.</p>

          <h3 class="text-xl font-bold mb-4 text-amber-500">4. Uprawnienia w Aplikacji (Android)</h3>
          <p class="mb-4">Aplikacja może prosić o dostęp do:</p>
          <ul class="list-disc pl-6 mb-4 space-y-2">
            <li>Lokalizacji (dla pogody i map).</li>
            <li>Mikrofonu (dla sterowania głosowego).</li>
            <li>Aparatu (dla skanowania kodów QR Paszportów Matek).</li>
          </ul>
          <p class="mb-4">Możesz w każdej chwili wycofać te zgody w ustawieniach telefonu.</p>

          <h3 class="text-xl font-bold mb-4 text-amber-500">5. Usuwanie Danych</h3>
          <p class="mb-4">Masz prawo do "bycia zapomnianym". W przypadku usunięcia konta, Twoje dane osobowe zostaną trwale skasowane z naszych serwerów w ciągu 30 dni, z wyjątkiem danych, których przechowywania wymagają przepisy prawa (np. dla planów PRO/Business przez 6 lat).</p>
        `
      }]
    };
  }

  // --- 4. DEMO (Placeholder) ---
  else if (params.slug === 'demo') {
     page = {
      title: 'DEMO',
      sections: [{ id: 1, type: 'TEXT', content: '<p>Wersja demonstracyjna dostępna wkrótce w aplikacji mobilnej.</p>' }]
    };
  }

  if (!page) return notFound();

  return (
    <div className="min-h-screen bg-transparent selection:bg-amber-500 selection:text-black">
      
      {page.sections?.map((section: any) => {
         switch(section.type) {
            
            // --- HERO SECTION ---
            case 'HERO':
               return (
                 <div key={section.id} className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden flex justify-center px-4">
                    <div className="relative z-10 max-w-4xl w-full py-12 px-6 sm:px-12 rounded-3xl shadow-2xl backdrop-blur-xl text-center transition-colors duration-300
                                    bg-white/60 border border-amber-900/10 text-amber-950
                                    dark:bg-black/40 dark:border-white/10 dark:text-white">
                      
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-6 backdrop-blur-sm
                                      bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600 dark:bg-amber-500"></span>
                        </span>
                        System v1.0 Gotowy
                      </div>

                      <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-tight drop-shadow-sm">
                        Przyszłość Twojej Pasieki <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-500 dark:to-yellow-300">
                          Zaczyna się Dzisiaj
                        </span>
                      </h1>
                      
                      <p className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-medium
                                    text-amber-900/80 dark:text-gray-300">
                        ApiaryMind to nie kolejny notatnik. To kompletny ekosystem – od hobby, przez hodowlę, aż po wielki biznes. 
                        Zarządzaj głosowo, dbaj o bezpieczeństwo i miej realny wpływ na rozwój narzędzia.
                      </p>
                      
                      <div className="flex justify-center">
                        <Link 
                          href="/beta" 
                          className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center gap-3 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                          <FlaskConical size={24} className="animate-pulse" />
                          <span>Dołącz do Beta Testerów</span>
                        </Link>
                      </div>
                    </div>
                 </div>
               );

            // --- FEATURES SECTION ---
            case 'FEATURES':
               return (
                 <div key={section.id} className="max-w-7xl mx-auto px-6 py-20 bg-transparent">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-amber-950 dark:text-white">Dlaczego ApiaryMind?</h2>
                        <p className="text-amber-900/60 dark:text-white/60">Tworzymy narzędzie, którego brakowało na rynku.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       {[
                         { icon: Mic, title: "Sterowanie Głosem", desc: "Pracuj bez dotykania ekranu. Dyktuj notatki i oceny offline.", color: "text-amber-600 dark:text-amber-500" },
                         { icon: ShieldCheck, title: "Strażnik Karencji", desc: "Bezpieczeństwo przede wszystkim. System pilnuje terminów leczenia.", color: "text-blue-600 dark:text-blue-500" },
                         { icon: Dna, title: "AI Scoring", desc: "Rewolucja w hodowli. Obiektywna ocena wartości genetycznej.", color: "text-purple-600 dark:text-purple-400" },
                         { icon: Moon, title: "Smoke Theme", desc: "Design, który nie męczy wzroku. Oszczędzaj oczy i baterię.", color: "text-gray-600 dark:text-gray-400" }
                       ].map((item, i) => (
                         <div key={i} className="p-6 rounded-2xl backdrop-blur-md transition-all group hover:-translate-y-1
                                                 bg-white/40 border border-amber-900/5 hover:bg-white/60 hover:border-amber-500/30
                                                 dark:bg-black/40 dark:border-white/10 dark:hover:bg-black/60 dark:hover:border-amber-500/50">
                           <item.icon className={`w-10 h-10 mb-4 transition-colors ${item.color} opacity-80 group-hover:opacity-100`} />
                           <h3 className="text-lg font-bold mb-2 text-amber-950 dark:text-white">{item.title}</h3>
                           <p className="text-sm text-amber-900/70 dark:text-white/60 leading-relaxed">{item.desc}</p>
                         </div>
                       ))}
                    </div>
                 </div>
               );

            // --- PRICING TABLE ---
            case 'PRICING':
               return (
                 <section key={section.id} className="py-10 border-t border-amber-900/5 dark:border-white/5 bg-transparent">
                   <PricingTable />
                 </section>
               );

            // --- BETA PROMO CTA ---
            case 'BETA_PROMO':
                return (
                  <div key={section.id} className="max-w-5xl mx-auto px-6 pb-24 pt-10">
                    <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden text-center border
                                    bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/20
                                    dark:from-amber-900/20 dark:to-black/40 dark:border-amber-500/30">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/20 blur-[100px] rounded-full pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="bg-amber-500 text-black font-bold text-xs px-3 py-1 rounded-full mb-6 flex items-center gap-2">
                                <Gift size={14} /> OFERTA SPECJALNA
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-amber-950 dark:text-white">Zostań Pionierem ApiaryMind</h2>
                            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-amber-900/80 dark:text-gray-300">
                                Wersja Beta to moment, w którym Twój głos liczy się najbardziej. 
                                <br/>Dla <span className="text-amber-600 dark:text-amber-400 font-bold">50 wybranych testerów</span> przygotowaliśmy:
                            </p>
                            <div className="mb-10 p-6 rounded-2xl bg-white/50 dark:bg-black/50 border border-amber-500/30 backdrop-blur-sm">
                                <span className="text-4xl md:text-5xl font-black text-amber-600 dark:text-amber-500 tracking-tight">2 LATA</span>
                                <div className="text-sm font-bold uppercase tracking-widest text-amber-900/60 dark:text-white/60 mt-2">Subskrypcji PRO+ Za Darmo</div>
                            </div>
                            <Link href="/beta" className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center gap-2">
                              Zarejestruj się do Bety <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                  </div>
                );

            // --- TEXT SECTION (Updated for HTML Rendering) ---
            case 'TEXT':
               return (
                 <section key={section.id} className="py-12 max-w-4xl mx-auto px-6 backdrop-blur-md rounded-3xl my-10 border
                                                      bg-white/60 border-amber-900/10 dark:bg-black/30 dark:border-white/10">
                    <h1 className="text-3xl md:text-4xl font-black text-amber-600 dark:text-amber-500 mb-8 tracking-tight">{page.title}</h1>
                    {/* UPDATED: dangerouslySetInnerHTML to render HTML from content string */}
                    <div className="prose prose-lg prose-amber max-w-none dark:prose-invert"
                         dangerouslySetInnerHTML={{ __html: section.content }} />
                 </section>
               );
            
            case 'VIDEO': return <div key={section.id} className="max-w-6xl mx-auto px-4 py-12"><VideoSection /></div>;
            default: return null;
         }
      })}
    </div>
  );
}