import { getCmsPageBySlug } from "../../lib/api";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  // W prawdziwej aplikacji tutaj pobieramy listę wszystkich stron z API Strapi
  return [{ slug: 'demo' }, { slug: 'regulamin' }, { slug: 'polityka-prywatnosci' }];
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const page = await getCmsPageBySlug(params.slug);

  if (!page) {
     // Fallback dla wersji demo (gdy brak połączenia z API)
     if (['demo', 'regulamin', 'polityka-prywatnosci'].includes(params.slug)) {
         return (
            <div className="max-w-4xl mx-auto py-12 px-4">
              <h1 className="text-4xl font-bold text-amber-500 mb-8 capitalize">{params.slug.replace('-', ' ')}</h1>
              <div className="p-6 bg-brown-800 rounded-xl border border-brown-700">
                <p className="text-amber-100 mb-4">
                  To jest placeholder dla strony dynamicznej CMS.
                  W pełnej wersji treść zostanie pobrana z endpointu:
                  <code className="bg-black/30 px-2 py-1 rounded text-amber-300 ml-2">/api/pages?slug={params.slug}</code>
                </p>
                <p className="text-amber-200/60 text-sm">
                  Sekcje strony będą renderowane dynamicznie w zależności od typu (Hero, Text, List, CTA).
                </p>
              </div>
            </div>
         );
     }
     return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-amber-500 mb-8">{page.title}</h1>
      <div className="space-y-12">
        {page.sections?.map((section: any) => (
          <section key={section.id} className="cms-section">
             {section.title && <h2 className="text-2xl font-bold text-amber-400 mb-4">{section.title}</h2>}
             <div className="text-amber-50/90 whitespace-pre-wrap">
                {typeof section.content === 'string' ? section.content : JSON.stringify(section.content)}
             </div>
          </section>
        ))}
      </div>
    </div>
  );
}
