import { getCmsPageBySlug } from "../../lib/api";
import { notFound } from "next/navigation";
import VideoSection from "../../components/VideoSection";

export async function generateStaticParams() {
  // W prawdziwej aplikacji tutaj pobieramy listę wszystkich stron z API Strapi
  // GET /pages
  return [{ slug: 'demo' }, { slug: 'regulamin' }, { slug: 'polityka-prywatnosci' }, { slug: 'landing' }];
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  // Try to fetch page from Strapi
  let page = null;
  try {
     page = await getCmsPageBySlug(params.slug);
  } catch (e) {
     console.error(`Failed to load page ${params.slug}`, e);
  }

  // Fallback for demo purposes if API is not reachable during build or dev without backend
  if (!page && ['demo', 'regulamin', 'polityka-prywatnosci', 'landing'].includes(params.slug)) {
     // Mock page content based on slug
     page = {
        title: params.slug === 'landing' ? 'Witaj w ApiaryMind' : params.slug.replace('-', ' ').toUpperCase(),
        sections: [
           { 
             id: 1, 
             type: params.slug === 'landing' ? 'HERO' : 'TEXT', 
             content: params.slug === 'landing' 
                ? 'Zarządzaj swoją pasieką nowocześnie.' 
                : 'Treść przykładowa dla strony ' + params.slug 
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
                 <section key={section.id} className="relative py-20 bg-brown-800 border-b border-brown-700">
                    <div className="max-w-6xl mx-auto px-4 text-center">
                       <h1 className="text-5xl md:text-6xl font-bold text-amber-500 mb-6">{page.title}</h1>
                       <p className="text-xl text-amber-100 max-w-2xl mx-auto">{section.content}</p>
                       <div className="mt-8 flex justify-center gap-4">
                          <a href="/beta" className="bg-amber-500 hover:bg-amber-400 text-brown-900 font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-amber-500/20 transition-all">Dołącz do Beta</a>
                          <a href="/login" className="bg-transparent border-2 border-amber-500 text-amber-500 hover:bg-amber-500/10 font-bold py-3 px-8 rounded-full text-lg transition-all">Zaloguj</a>
                       </div>
                    </div>
                 </section>
               );
            case 'TEXT':
               return (
                 <section key={section.id} className="py-12 max-w-4xl mx-auto px-4">
                    <div className="prose prose-invert prose-amber max-w-none">
                       {/* This would be rich text in real app */}
                       <p className="text-lg text-amber-100/80 leading-relaxed">{section.content}</p>
                    </div>
                 </section>
               );
            case 'VIDEO':
               return (
                 <div key={section.id} className="max-w-6xl mx-auto px-4">
                    <VideoSection />
                 </div>
               );
            default:
               return (
                 <section key={section.id} className="py-8 max-w-4xl mx-auto px-4 border border-red-500/30 rounded m-4">
                    <p className="text-red-300">Unknown section type: {section.type}</p>
                 </section>
               );
         }
      })}
    </div>
  );
}
