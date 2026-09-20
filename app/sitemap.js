import { supabase } from '../lib/supabaseClient';

export default async function sitemap() {
  const baseUrl = 'https://khujisherpur-site.pages.dev';

  const staticPages = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/search`, lastModified: new Date() },
    { url: `${baseUrl}/terms`, lastModified: new Date() },
    { url: `${baseUrl}/privacy`, lastModified: new Date() },
    { url: `${baseUrl}/disclaimer`, lastModified: new Date() },
  ];

  const { data: categories } = await supabase.from('categories').select('slug');
  const categoryPages = (categories || []).map((c) => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: new Date(),
  }));

  const { data: providers } = await supabase
    .from('providers')
    .select('id, updated_at')
    .eq('status', 'approved');
  const providerPages = (providers || []).map((p) => ({
    url: `${baseUrl}/provider/${p.id}`,
    lastModified: new Date(p.updated_at),
  }));

  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at')
    .eq('status', 'active');
  const listingPages = (listings || []).map((l) => ({
    url: `${baseUrl}/listing/${l.id}`,
    lastModified: new Date(l.updated_at),
  }));

  return [...staticPages, ...categoryPages, ...providerPages, ...listingPages];
}
