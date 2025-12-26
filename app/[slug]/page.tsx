import { getCmsPageBySlug } from "../../lib/api";
import { notFound } from "next/navigation";
import VideoSection from "../../components/VideoSection";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { getDynamicPage } from "@/app/actions/dynamic-pages";
import { getPublicSettings } from "@/app/actions/get-public-settings";

export async function generateStaticParams() {
  // W prawdziwej aplikacji tutaj pobieramy listę wszystkich stron z API Strapi
  // GET /pages
  return [{ slug: 'demo' }, { slug: 'regulamin' }, { slug: 'polityka-prywatnosci' }, { slug: 'landing' }];
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  // 1. Try fetching from new Dynamic Pages DB (Supabase)
  const dynamicPage = await getDynamicPage(params.slug);
  
  if (dynamicPage) {
     return (
       <div className="min-h-screen py-20 px-4">
         <section className="max-w-4xl mx-auto">
            <GlassCard className="p-10 bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20">
               <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-8">{dynamicPage.title}</h1>
               <div className="prose prose-lg prose-invert prose-amber max-w-none text-text-dark dark:text-amber-100/80 leading-relaxed whitespace-pre-wrap">
                  {dynamicPage.content_html}
               </div>
            </GlassCard>
         </section>
       </div>
     );
  }

  // 2. Fetch Global Settings for Landing overrides
  const settings = await getPublicSettings();

  // 3. Fallback to old Logic (Legacy hardcoded pages) but with overrides
  let page = null;
  try {
     page = await getCmsPageBySlug(params.slug);
  } catch (e) {
     console.error(`Failed to load page ${params.slug}`, e);
  }

  if (!page && ['demo', 'regulamin', 'polityka-prywatnosci', 'landing'].includes(params.slug)) {
     // Mock page content based on slug
     
     // Override with settings if landing
     const title = (params.slug === 'landing' && settings['LANDING_HERO_TITLE']) ? settings['LANDING_HERO_TITLE'] : (params.slug === 'landing' ? 'Witaj w ApiaryMind' : params.slug.replace('-', ' ').toUpperCase());
     const content = (params.slug === 'landing' && settings['LANDING_HERO_SUBTITLE']) ? settings['LANDING_HERO_SUBTITLE'] : (params.slug === 'landing' 
                ? 'Zarządzaj swoją pasieką nowocześnie.' 
                : 'Treść przykładowa dla strony ' + params.slug);
     const cta = (params.slug === 'landing' && settings['LANDING_CTA_BUTTON']) ? settings['LANDING_CTA_BUTTON'] : 'Dołącz do Beta';

     page = {
        title: title,
        sections: [
           { 
             id: 1, 
             type: params.slug === 'landing' ? 'HERO' : 'TEXT', 
             content: content,
             cta_text: cta
           },
           {
             id: 2,
             type: 'VIDEO',
             content: 'Sekcja wideo'
           }
        ]
     };
  }

  if (!page) {
     return notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Dynamic Render based on Section Type */}
      {page.sections?.map((section: any) => {
         switch(section.type) {
            case 'HERO':
               return (
                 <section key={section.id} className="relative py-20 bg-transparent flex justify-center items-center">
                    <GlassCard className="max-w-4xl w-full mx-4 text-center p-10 rounded-3xl bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20">
                       <h1 className="text-5xl md:text-6xl font-heading font-bold text-primary mb-6">{page.title}</h1>
                       <p className="text-xl text-text-dark dark:text-amber-100 max-w-2xl mx-auto mb-8">{section.content}</p>
                       <div className="flex flex-col sm:flex-row justify-center gap-4">
                          <a href="/beta" className="bg-primary hover:bg-amber-400 text-brown-900 font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-amber-500/20 transition-all">{section.cta_text || 'Dołącz do Beta'}</a>
                          <a href="/login" className="bg-transparent border-2 border-primary text-primary hover:bg-primary/10 font-bold py-3 px-8 rounded-full text-lg transition-all">Zaloguj</a>
                       </div>
                    </GlassCard>
                 </section>
               );
            case 'TEXT':
               return (
                 <section key={section.id} className="py-12 max-w-4xl mx-auto px-4">
                    <GlassCard className="p-8">
                        <div className="prose prose-invert prose-amber max-w-none text-text-dark dark:text-amber-100/80 leading-relaxed">
                           {/* This would be rich text in real app */}
                           <p>{section.content}</p>
                        </div>
                    </GlassCard>
                 </section>
               );
            case 'VIDEO':
               return (
                 <div key={section.id} className="max-w-6xl mx-auto px-4 py-12">
                    <GlassCard className="p-4">
                        <VideoSection />
                    </GlassCard>
                 </div>
               );
            default:
               return (
                 <section key={section.id} className="py-8 max-w-4xl mx-auto px-4">
                    <GlassCard className="border-red-500/30 p-4">
                         <p className="text-red-500 dark:text-red-300">Unknown section type: {section.type}</p>
                    </GlassCard>
                 </section>
               );
         }
      })}
    </div>
  );
}
