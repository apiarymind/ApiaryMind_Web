import { notFound } from "next/navigation";
import VideoSection from "../../components/VideoSection";
// IMPORTUJEMY NOWY KOMPONENT:
import PricingTable from "../../components/PricingTable";
import Link from "next/link";
import { Hexagon, ShieldCheck, BarChart3, FlaskConical } from "lucide-react";

export async function generateStaticParams() {
  return [{ slug: 'demo' }, { slug: 'regulamin' }, { slug: 'polityka-prywatnosci' }, { slug: 'landing' }];
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  let page = null;

  if (params.slug === 'landing') {
    page = {
      title: 'Witaj w ApiaryMind',
      sections: [
        { id: 'hero', type: 'HERO', content: 'Zarządzaj swoją pasieką.' },
        { id: 'features', type: 'FEATURES', content: 'Funkcje systemu' },
        // DODANO NOWĄ SEKCJĘ CENNIKA:
        { id: 'pricing', type: 'PRICING', content: 'Cennik' }
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
                        Twoja Pasieka <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-500 dark:to-yellow-300">
                          Pod Kontrolą
                        </span>
                      </h1>
                      
                      <p className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-medium
                                    text-amber-900/80 dark:text-gray-300">
                        Zarządzaj ulami, kontroluj leczenie, monitoruj pożytki i magazyn. 
                        Wszystko w jednym miejscu.
                      </p>
                      
                      <div className="flex justify-center">
                        <Link 
                          href="/beta"
                          className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center gap-3 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                          <FlaskConical size={24} className="animate-pulse" />
                          <span>Dołącz do Beta testów</span>
                        </Link>
                      </div>

                    </div>
                 </div>
               );

            case 'FEATURES':
               return (
                 <div key={section.id} className="max-w-7xl mx-auto px-6 py-20 bg-transparent">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {[
                         { icon: BarChart3, title: "Pełna Analityka", desc: "Śledź rozwój rodzin i zbiory.", color: "text-amber-600 dark:text-amber-500" },
                         { icon: ShieldCheck, title: "Strażnik Karencji", desc: "Pilnuje okresów karencji leków.", color: "text-blue-600 dark:text-blue-500" },
                         { icon: Hexagon, title: "Magazyn & Sprzęt", desc: "Kontrola stanów magazynowych.", color: "text-green-600 dark:text-green-500" }
                       ].map((item, i) => (
                         <div key={i} className="p-6 rounded-2xl backdrop-blur-md transition-all group hover:-translate-y-1
                                                 bg-white/40 border border-amber-900/5 hover:bg-white/60 hover:border-amber-500/30
                                                 dark:bg-black/40 dark:border-white/10 dark:hover:bg-black/60 dark:hover:border-amber-500/50">
                           <item.icon className={`w-10 h-10 mb-4 transition-colors ${item.color} opacity-80 group-hover:opacity-100`} />
                           <h3 className="text-xl font-bold mb-2 text-amber-950 dark:text-white">{item.title}</h3>
                           <p className="text-sm text-amber-900/70 dark:text-white/60">{item.desc}</p>
                         </div>
                       ))}
                    </div>
                 </div>
               );

            // NOWA SEKCJA CENNIKA
            case 'PRICING':
               return (
                 <section key={section.id} className="py-20 border-t border-white/5 bg-transparent">
                   <PricingTable />
                 </section>
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