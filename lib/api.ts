const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Pobiera stronę CMS po slug z backendu Strapi.
 * Oczekujemy kolekcji typu "pages" z polem slug, title, sections.
 */
export async function getCmsPageBySlug(slug: string) {
  // During build time or if API is not set, we return null so the page component can handle fallback
  if (!API_BASE) return null;

  try {
    const res = await fetch(
      `${API_BASE}/pages?filters[slug][$eq]=${encodeURIComponent(slug)}&populate[sections]=*`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) return null;
    const json = await res.json();

    const item = json.data?.[0];
    if (!item) return null;

    const attrs = item.attributes;
    return {
      id: item.id,
      title: attrs.title,
      slug: attrs.slug,
      sections: attrs.sections?.map((s: any) => ({
        id: s.id,
        type: s.type, // Ensure type is passed
        title: s.title,
        content: s.content
      }))
    };
  } catch (e) {
    // Suppress error log during build if it's connection error to localhost
    if ((e as any).code !== 'ECONNREFUSED') {
       console.error("Błąd getCmsPageBySlug", e);
    }
    return null;
  }
}
