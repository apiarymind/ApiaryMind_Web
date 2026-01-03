import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://apiarymind.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/beta`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic pages - Queens (public rodowody)
  let queenPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient();
    const { data: queens } = await supabase
      .from('queens')
      .select('id, updated_at')
      .limit(1000); // Limit to prevent too large sitemap

    if (queens) {
      queenPages = queens.map((queen) => ({
        url: `${baseUrl}/q/${queen.id}`,
        lastModified: queen.updated_at ? new Date(queen.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('Error fetching queens for sitemap:', error);
  }

  // Dynamic pages - Apiaries (public wizytówki)
  let apiaryPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient();
    const { data: apiaries } = await supabase
      .from('apiaries')
      .select('id, updated_at')
      .limit(1000); // Limit to prevent too large sitemap

    if (apiaries) {
      apiaryPages = apiaries.map((apiary) => ({
        url: `${baseUrl}/a/${apiary.id}`,
        lastModified: apiary.updated_at ? new Date(apiary.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Error fetching apiaries for sitemap:', error);
  }

  return [...staticPages, ...queenPages, ...apiaryPages];
}


