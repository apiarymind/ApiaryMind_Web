import { notFound } from "next/navigation";
import VideoSection from "../../components/VideoSection";
// UPEWNIJ SIĘ, ŻE TEN IMPORT JEST POPRAWNY (ścieżka do komponentu tabeli)
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

  if (params.slug === 'landing') {
    page = {
      title: 'Witaj w ApiaryMind',
      sections: [
        { id: 'hero', type: 'HERO' },
        { id: 'features', type: 'FEATURES' },
        { id: 'pricing', type: 'PRICING' },       // SEKCJA CENNIKA
        { id: 'promo', type: 'BETA_PROMO' }       // SEKCJA PROMOCJI DLA 50 OSÓB
      ]
    };
  } else if (['demo', 'regulamin', 'polityka-prywatnosci'].includes(params.slug)) {
    page = {
      title: params.slug.replace('-', ' ').toUpperCase(),
      sections: [{ id: 1, type: 'TEXT', content: `Treść dla: ${params.slug}.` }]
    };
  }

  if (!page) return notFound();

  return (
    <div className="min-h-screen bg-transparent selection:bg-amber-500 selection:text-black">
      
      {page.sections?.map((section: any) => {
         switch(section.type) {
            
            // --- 1. HERO SECTION ---
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

            // --- 2. FEATURES SECTION ---
            case 'FEATURES':
               return (
                 <div key={section.id} className="max-w-7xl mx-auto px-6 py-20 bg-transparent">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-amber-950 dark:text-white">Dlaczego ApiaryMind?</h2>
                        <p className="text-amber-900/60 dark:text-white/60">Tworzymy narzędzie, którego brakowało na rynku.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       {[
                         { 
                           icon: Mic, 
                           title: "Sterowanie Głosem", 
                           desc: "Pracuj bez dotykania ekranu. Dyktuj notatki i oceny offline, nie zdejmując rękawic.", 
                           color: "text-amber-600 dark:text-amber-500" 
                         },
                         { 
                           icon: ShieldCheck, 
                           title: "Strażnik Karencji", 
                           desc: "Bezpieczeństwo przede wszystkim. System pilnuje terminów leczenia w każdym planie.", 
                           color: "text-blue-600 dark:text-blue-500" 
                         },
                         { 
                           icon: Dna, 
                           title: "AI Scoring", 
                           desc: "Rewolucja w hodowli. Obiektywna ocena wartości genetycznej na podstawie twardych danych.", 
                           color: "text-purple-600 dark:text-purple-400" 
                         },
                         { 
                           icon: Moon, 
                           title: "Smoke Theme", 
                           desc: "Design, który nie męczy wzroku. Oszczędzaj oczy i baterię podczas wieczornych prac.", 
                           color: "text-gray-600 dark:text-gray-400" 
                         }
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

            // --- 3. PRICING TABLE (CENNIK) ---
            case 'PRICING':
               return (
                 <section key={section.id} className="py-10 border-t border-amber-900/5 dark:border-white/5 bg-transparent">
                   <PricingTable />
                 </section>
               );

            // --- 4. BETA PROMO CTA (PROMOCJA DLA 50 OSÓB) ---
            case 'BETA_PROMO':
                return (
                  <div key={section.id} className="max-w-5xl mx-auto px-6 pb-24 pt-10">
                    <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden text-center border
                                    bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/20
                                    dark:from-amber-900/20 dark:to-black/40 dark:border-amber-500/30">
                        
                        {/* Glowing effect behind */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/20 blur-[100px] rounded-full pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="bg-amber-500 text-black font-bold text-xs px-3 py-1 rounded-full mb-6 flex items-center gap-2">
                                <Gift size={14} /> OFERTA SPECJALNA
                            </div>
                            
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-amber-950 dark:text-white">
                                Zostań Pionierem ApiaryMind
                            </h2>
                            
                            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-amber-900/80 dark:text-gray-300">
                                Wersja Beta to moment, w którym Twój głos liczy się najbardziej. 
                                <br/>Dla <span className="text-amber-600 dark:text-amber-400 font-bold">50 wybranych testerów</span> przygotowaliśmy:
                            </p>

                            <div className="mb-10 p-6 rounded-2xl bg-white/50 dark:bg-black/50 border border-amber-500/30 backdrop-blur-sm">
                                <span className="text-4xl md:text-5xl font-black text-amber-600 dark:text-amber-500 tracking-tight">
                                    2 LATA
                                </span>
                                <div className="text-sm font-bold uppercase tracking-widest text-amber-900/60 dark:text-white/60 mt-2">
                                    Subskrypcji PRO+ Za Darmo
                                </div>
                            </div>

                            <Link 
                              href="/beta" 
                              className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center gap-2"
                            >
                              Zarejestruj się do Bety <ArrowRight size={20} />
                            </Link>
                            
                            <p className="mt-4 text-xs text-amber-900/40 dark:text-white/30">
                                Liczba miejsc w programie ograniczona. Decyduje kolejność zgłoszeń i profil pasieki.
                            </p>
                        </div>
                    </div>
                  </div>
                );

            case 'TEXT':
               return (
                 <section key={section.id} className="py-12 max-w-4xl mx-auto px-4 backdrop-blur-md rounded-xl my-10 border 
                                                      bg-white/60 border-amber-900/10 dark:bg-black/30 dark:border-white/10">
                    <h1 className="text-3xl font-bold text-amber-600 dark:text-amber-500 mb-6">{page.title}</h1>
                    <div className="prose prose-amber max-w-none dark:prose-invert">
                        <p className="text-amber-950 dark:text-gray-200">{section.content}</p>
                    </div>
                 </section>
               );
            
            case 'VIDEO': return <div key={section.id} className="max-w-6xl mx-auto px-4 py-12"><VideoSection /></div>;
            default: return null;
         }
      })}
    </div>
  );
}