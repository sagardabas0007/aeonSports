import { MetadataRoute } from 'next';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Generate dynamic sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aeonsports.com';
  const supabase = getServiceSupabase();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/admin/matches`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/admin/tokens`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/admin/logs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
  ];

  try {
    // Get all matches for dynamic pages
    const { data: matches } = await supabase
      .from('matches')
      .select('id, updated_at')
      .eq('status', 'finished')
      .limit(1000);

    const matchPages: MetadataRoute.Sitemap =
      matches?.map((match) => ({
        url: `${baseUrl}/match/${match.id}`,
        lastModified: new Date(match.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })) || [];

    return [...staticPages, ...matchPages];
  } catch (error) {
    console.error('[Sitemap] Error generating sitemap:', error);
    return staticPages;
  }
}
