export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../lib/supabaseClient';
import { categoryLabels } from '../lib/categoryLabels';
import { SITE_URL } from '../lib/site';

const staticPages = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/emergency', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/blood', changeFrequency: 'daily', priority: 0.8 },
  { path: '/amar-sherpur', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/disclaimer', changeFrequency: 'yearly', priority: 0.2 },
];

export default async function sitemap() {
  const now = new Date();
  // বাংলাদেশ সময়ে আজকের তারিখ (YYYY-MM-DD), আবেদনের মেয়াদ মেলাতে
  const todayBd = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const entries = staticPages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  try {
    const [
      { data: categories },
      { data: subcategories },
      { data: providers },
      { data: listings },
    ] = await Promise.all([
      supabase.from('categories').select('slug, type, is_active'),
      supabase.from('subcategories').select('id, slug, is_active'),
      supabase
        .from('providers')
        .select('id, slug, primary_subcategory_id, updated_at, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase
        .from('listings')
        .select('id, updated_at, posted_at')
        .eq('status', 'active')
        .gt('expiry_date', now.toISOString())
        .or(`deadline.is.null,deadline.gte.${todayBd}`)
        .order('posted_at', { ascending: false })
        .limit(1000),
    ]);

    // ক্যাটাগরি পাতা (হোমের মতো একই ছাঁকনি)
    (categories || [])
      .filter(
        (c) =>
          categoryLabels[c.slug] &&
          c.is_active !== false &&
          (c.type === 'listing' || c.type === 'service')
      )
      .forEach((c) => {
        entries.push({
          url: `${SITE_URL}/category/${c.slug}`,
          lastModified: now,
          changeFrequency: 'daily',
          priority: 0.8,
        });
      });

    // সেবার তালিকা পাতা (/electrician ইত্যাদি), শুধু সক্রিয়গুলো
    (subcategories || [])
      .filter((s) => s.is_active !== false && s.slug)
      .forEach((s) => {
        entries.push({
          url: `${SITE_URL}/${s.slug}`,
          lastModified: now,
          changeFrequency: 'daily',
          priority: 0.8,
        });
      });

    // সেবাদাতার প্রোফাইল: providerHref-এর একই নিয়ম
    const subById = Object.fromEntries((subcategories || []).map((s) => [s.id, s]));
    (providers || []).forEach((p) => {
      const primary = p.primary_subcategory_id ? subById[p.primary_subcategory_id] : null;
      const path = p.slug && primary?.slug ? `/${primary.slug}/${p.slug}` : `/provider/${p.id}`;
      entries.push({
        url: `${SITE_URL}${path}`,
        lastModified: new Date(p.updated_at || p.created_at || now),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });

    // সক্রিয়, মেয়াদ-না-ফুরানো ও আবেদনের তারিখ না-পেরোনো পোস্ট
    (listings || []).forEach((l) => {
      entries.push({
        url: `${SITE_URL}/listing/${l.id}`,
        lastModified: new Date(l.updated_at || l.posted_at || now),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });
  } catch (err) {
    // ডাটাবেস সমস্যা হলে অন্তত স্থির পাতাগুলো ফেরত যাবে
    console.error('sitemap error', err);
  }

  return entries;
}
