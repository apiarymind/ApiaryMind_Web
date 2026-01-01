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
          <h3 class="text-lg md:text-xl font-bold mb-4 text-amber-500">§1. Postanowienia Ogólne</h3>
          <p class="mb-4 text-sm md:text-base">1. Niniejszy Regulamin określa zasady korzystania z aplikacji mobilnej i serwisu internetowego ApiaryMind.<br/>
          2. Właścicielem praw autorskich i operatorem systemu jest <strong>ApiaryMind</strong>, zwany dalej "Usługodawcą".</p>
          
          <h3 class="text-lg md:text-xl font-bold mb-4 text-amber-500">§2. Rodzaje i Zakres Usług</h3>
          <p class="mb-4 text-sm md:text-base">1. ApiaryMind to narzędzie wspomagające zarządzanie pasieką, oferujące m.in.: ewidencję uli, harmonogram zadań, moduł weterynaryjny oraz analizę danych (AI Scoring).<br/>
          2. <strong>Ważne zastrzeżenie:</strong> Moduł Weterynaryjny (Strażnik Karencji) pełni funkcję pomocniczą. Użytkownik jest zobowiązany do każdorazowej weryfikacji okresów karencji leków zgodnie z ulotką producenta.</p>

          <h3 class="text-lg md:text-xl font-bold mb-4 text-amber-500">§3. Subskrypcje i Płatności</h3>
          <p class="mb-4 text-sm md:text-base">1. Aplikacja oferuje plany darmowe (FREE) oraz płatne (PLUS, PRO, PRO+, BUSINESS).<br/>
          2. Płatności za subskrypcje realizowane są wyłącznie za pośrednictwem sklepu Google Play Store.<br/>
          3. Ceny i zakres funkcji poszczególnych planów określa aktualny Cennik dostępny w aplikacji.</p>

          <h3 class="text-lg md:text-xl font-bold mb-4 text-amber-500">§4. AI Scoring i Własność Danych</h3>
          <p class="mb-4 text-sm md:text-base">1. Użytkownik zachowuje pełne prawa do wprowadzonych przez siebie danych osobowych.<br/>
          2. Użytkownik udziela Usługodawcy niewyłącznej, nieodpłatnej licencji na wykorzystanie <strong>zanonimizowanych</strong> danych produkcyjnych w celu trenowania algorytmów AI.</p>
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
          <h3 class="text-lg md:text-xl font-bold mb-4 text-amber-500">1. Administrator Danych</h3>
          <p class="mb-4 text-sm md:text-base">Administratorem Twoich danych osobowych jest <strong>ApiaryMind</strong>. Dbamy o to, by Twoje dane były bezpieczne.</p>

          <h3 class="text-lg md:text-xl font-bold mb-4 text-amber-500">2. Jakie dane zbieramy i po co?</h3>
          <ul class="list-disc pl-6 mb-4 space-y-2 text-sm md:text-base">
            <li><strong>Dane konta:</strong> E-mail, Imię, Nazwisko.</li>
            <li><strong>Lokalizacja Pasiek (GPS):</strong> Niezbędna do funkcji pogodowych i map.</li>
            <li><strong>Dane o ulach:</strong> Służą do prowadzenia ewidencji.</li>
          </ul>

          <h3 class="text-lg md:text-xl font-bold mb-4 text-amber-500">3. Bezpieczeństwo AI</h3>
          <p class="mb-4 text-sm md:text-base">Dane wykorzystywane do modułu AI Scoring są <strong>całkowicie anonimizowane</strong>.</p>

          <h3 class="text-lg md:text-xl font-bold mb-4 text-amber-500">4. Usuwanie Danych</h3>
          <p class="mb-4 text-sm md:text-base">W przypadku usunięcia konta, Twoje dane osobowe zostaną trwale skasowane z naszych serwerów w ciągu 30 dni.</p>
        ` 
      }]
    };
  }

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
            
            // --- HERO SECTION (MOBILE OPTIMIZED) ---
            case 'HERO':
               return (
                 <div key={section.id} className="relative pt-24 pb-12 md:pt-40 md:pb-24 overflow-hidden flex justify-center px-4">
                    <div className="relative z-10 max-w-4xl w-full py-8 px-6 md:py-12 md:px-12 rounded-3xl shadow-2xl backdrop-blur-xl text-center transition-colors duration-300
                                    bg-white/60 border border-amber-900/10 text-amber-950
                                    dark:bg-black/40 dark:border-white/10 dark:text-white">
                      
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] md:text-xs font-mono mb-4 md:mb-6 backdrop-blur-sm
                                      bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600 dark:bg-amber-500"></span>
                        </span>
                        System v1.0 Gotowy
                      </div>

                      {/* RESPONSIVE FONT SIZES: smaller on mobile */}
                      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4 md:mb-6 leading-tight drop-shadow-sm">
                        Przyszłość Twojej Pasieki <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-500 dark:to-yellow-300">
                          Zaczyna się Dzisiaj
                        </span>
                      </h1>
                      
                      <p className="text-base md:text-lg mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed font-medium
                                    text-amber-900/80 dark:text-gray-300">
                        ApiaryMind to nie kolejny notatnik. To kompletny ekosystem – od hobby, przez hodowlę, aż po wielki biznes. 
                        Zarządzaj głosowo i miej realny wpływ na rozwój narzędzia.
                      </p>
                      
                      <div className="flex justify-center">
                        <Link 
                          href="/beta" 
                          className="group relative px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-base md:text-lg rounded-xl transition-all hover:scale-105 shadow-lg flex items-center gap-2 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                          <FlaskConical size={20} className="md:w-6 md:h-6 animate-pulse" />
                          <span>Dołącz do Beta Testerów</span>
                        </Link>
                      </div>
                    </div>
                 </div>
               );

            // --- FEATURES SECTION (STACKS ON MOBILE) ---
            case 'FEATURES':
               return (
                 <div key={section.id} className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 bg-transparent">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-amber-950 dark:text-white">Dlaczego ApiaryMind?</h2>
                        <p className="text-sm md:text-base text-amber-900/60 dark:text-white/60">Tworzymy narzędzie, którego brakowało na rynku.</p>
                    </div>
                    
                    {/* Grid automatically becomes 1 column on mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                       {[
                         { icon: Mic, title: "Sterowanie Głosem", desc: "Pracuj bez dotykania ekranu. Dyktuj notatki i oceny offline.", color: "text-amber-600 dark:text-amber-500" },
                         { icon: ShieldCheck, title: "Strażnik Karencji", desc: "Bezpieczeństwo przede wszystkim. System pilnuje terminów leczenia.", color: "text-blue-600 dark:text-blue-500" },
                         { icon: Dna, title: "AI Scoring", desc: "Rewolucja w hodowli. Obiektywna ocena wartości genetycznej.", color: "text-purple-600 dark:text-purple-400" },
                         { icon: Moon, title: "Smoke Theme", desc: "Design, który nie męczy wzroku. Oszczędzaj oczy i baterię.", color: "text-gray-600 dark:text-gray-400" }
                       ].map((item, i) => (
                         <div key={i} className="p-5 md:p-6 rounded-2xl backdrop-blur-md transition-all group hover:-translate-y-1
                                                 bg-white/40 border border-amber-900/5 hover:bg-white/60 hover:border-amber-500/30
                                                 dark:bg-black/40 dark:border-white/10 dark:hover:bg-black/60 dark:hover:border-amber-500/50">
                           <item.icon className={`w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 transition-colors ${item.color} opacity-80 group-hover:opacity-100`} />
                           <h3 className="text-base md:text-lg font-bold mb-2 text-amber-950 dark:text-white">{item.title}</h3>
                           <p className="text-sm text-amber-900/70 dark:text-white/60 leading-relaxed">{item.desc}</p>
                         </div>
                       ))}
                    </div>
                 </div>
               );

            // --- PRICING TABLE (SCROLLABLE ON MOBILE) ---
            case 'PRICING':
               return (
                 <section key={section.id} className="py-10 border-t border-amber-900/5 dark:border-white/5 bg-transparent">
                   {/* Container adds horizontal scroll on small screens */}
                   <div className="w-full overflow-x-auto px-2 md:px-0">
                      <PricingTable />
                   </div>
                 </section>
               );

            // --- BETA PROMO CTA (PADDED FOR MOBILE) ---
            case 'BETA_PROMO':
                return (
                  <div key={section.id} className="max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-24 pt-8 md:pt-10">
                    <div className="relative rounded-3xl p-6 md:p-12 overflow-hidden text-center border
                                    bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/20
                                    dark:from-amber-900/20 dark:to-black/40 dark:border-amber-500/30">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-amber-500/20 blur-[100px] rounded-full pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="bg-amber-500 text-black font-bold text-[10px] md:text-xs px-3 py-1 rounded-full mb-4 md:mb-6 flex items-center gap-2">
                                <Gift size={12} className="md:w-3.5 md:h-3.5" /> OFERTA SPECJALNA
                            </div>
                            <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6 text-amber-950 dark:text-white">Zostań Pionierem ApiaryMind</h2>
                            <p className="text-base md:text-xl max-w-2xl mx-auto mb-6 md:mb-8 text-amber-900/80 dark:text-gray-300">
                                Wersja Beta to moment, w którym Twój głos liczy się najbardziej. 
                                <br/>Dla <span className="text-amber-600 dark:text-amber-400 font-bold">50 wybranych testerów</span> przygotowaliśmy:
                            </p>
                            <div className="mb-8 md:mb-10 p-4 md:p-6 rounded-2xl bg-white/50 dark:bg-black/50 border border-amber-500/30 backdrop-blur-sm">
                                <span className="text-3xl md:text-5xl font-black text-amber-600 dark:text-amber-500 tracking-tight">2 LATA</span>
                                <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-amber-900/60 dark:text-white/60 mt-1 md:mt-2">Subskrypcji PRO+ Za Darmo</div>
                            </div>
                            <Link href="/beta" className="px-6 py-3 md:px-10 md:py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-base md:text-lg rounded-xl transition-all hover:scale-105 shadow-lg flex items-center gap-2">
                              Zarejestruj się do Bety <ArrowRight size={18} className="md:w-5 md:h-5" />
                            </Link>
                        </div>
                    </div>
                  </div>
                );

            // --- TEXT SECTION (Docs) ---
            case 'TEXT':
               return (
                 <section key={section.id} className="py-8 md:py-12 max-w-4xl mx-auto px-4 md:px-6 backdrop-blur-md rounded-3xl my-6 md:my-10 border
                                                      bg-white/60 border-amber-900/10 dark:bg-black/30 dark:border-white/10">
                    <h1 className="text-2xl md:text-4xl font-black text-amber-600 dark:text-amber-500 mb-6 md:mb-8 tracking-tight">{page.title}</h1>
                    <div className="prose prose-sm md:prose-lg prose-amber max-w-none dark:prose-invert"
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