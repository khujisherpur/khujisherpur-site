export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabase } from '../../../lib/supabaseClient';
import SiteHeader from '../../../components/SiteHeader';
import ProviderProfile from '../../../components/ProviderProfile';
import { getLang } from '../../../lib/getLang';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '../../../lib/site';

const subcategoryIcons = {
  electrician: '⚡', plumber: '🚰', 'ac-technician': '❄️', 'fridge-technician': '🧊',
  mechanic: '⚙️', carpenter: '🪚', mason: '🧱', painter: '🎨', cleaning: '🧹',
  'mobile-repair': '📱', 'computer-repair': '💻', cctv: '📹',
  'internet-wifi': '📶', driver: '🚗', 'transport-shifting': '🚚',
};

const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|whatsapp|telegram|headless/i;
const SLUG_RE = /^[a-z0-9-]+$/;

function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

export async function generateMetadata({ params }) {
  const lang = getLang();
  const notFoundMeta = {
    title: 'প্রোফাইল পাওয়া যায়নি | খুঁজি শেরপুর',
    robots: { index: false },
  };

  if (!SLUG_RE.test(params.slug) || !SLUG_RE.test(params.providerSlug)) return notFoundMeta;

  const { data: sub } = await supabase
    .from('subcategories')
    .select('id, name_bn, name_en')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!sub) return notFoundMeta;

  // পেজের মতোই: প্রধান সেবার slug না মিললে এটা প্রোফাইলই নয়
  const { data: provider } = await supabase
    .from('providers')
    .select('name, area, description, photo_url, experience_years')
    .eq('slug', params.providerSlug)
    .eq('primary_subcategory_id', sub.id)
    .eq('status', 'approved')
    .maybeSingle();
  if (!provider) return notFoundMeta;

  const subName = lang === 'bn' ? sub.name_bn : sub.name_en || sub.name_bn;
  const title = `${provider.name}${subName ? `, ${subName}` : ''} - ${provider.area}, শেরপুর | খুঁজি শেরপুর`;

  const parts = [`${provider.name}, ${provider.area}-এর ${subName || 'সেবাদাতা'}।`];
  if (provider.experience_years) parts.push(`${provider.experience_years} বছরের অভিজ্ঞতা।`);
  const about = (provider.description || '').replace(/\s+/g, ' ').trim();
  if (about) parts.push(about.slice(0, 70));
  parts.push('রিভিউ দেখে সরাসরি যোগাযোগ করুন।');
  const description = parts.join(' ').slice(0, 155);

  const images = provider.photo_url ? [provider.photo_url] : [DEFAULT_OG_IMAGE];
  // ?fbclid= ইত্যাদি যোগ হওয়া লিংকও একই পাতা বলে গণ্য হবে
  const canonical = `/${params.slug}/${params.providerSlug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'bn_BD',
      images,
    },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

const text = {
  bn: { back: '← তালিকায় ফিরে যান' },
  en: { back: '← Back to list' },
};

export default async function ProviderSlugPage({ params }) {
  const lang = getLang();
  const t = text[lang];

  // ক্যাটাগরির ভুল slug হলে (যেমন /wp-login.php) ডাটাবেস ছোঁয়ার আগেই ৪০৪
  if (!SLUG_RE.test(params.slug) || !SLUG_RE.test(params.providerSlug)) {
    notFound();
  }

  const { data: subcategory } = await supabase
    .from('subcategories')
    .select('id, slug, name_bn, name_en')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!subcategory) notFound();

  const { data: provider } = await supabase
    .from('providers')
    .select('id, user_id, name, name_en, slug, area, upazila, union_name, phone, whatsapp, description, is_available, photo_url, experience_years, view_count, primary_subcategory_id, is_verified')
    .eq('slug', params.providerSlug)
    .eq('primary_subcategory_id', subcategory.id)
    .eq('status', 'approved')
    .maybeSingle();

  if (!provider) notFound();

  // বট ও লিংক-প্রিভিউয়ের ভিউ গোনা হয় না
  const ua = headers().get('user-agent') || '';
  if (!BOT_UA.test(ua)) {
    await supabase.rpc('increment_provider_view', { pid: provider.id });
  }

  const [{ data: allSubcats }, { data: reviews }] = await Promise.all([
    supabase
      .from('provider_subcategories')
      .select('subcategories(id, slug, name_bn, name_en)')
      .eq('provider_id', provider.id),
    supabase.from('reviews').select('rating').eq('provider_id', provider.id),
  ]);

  const subName = (s) => (lang === 'bn' ? s.name_bn : s.name_en || s.name_bn);

  let subs = (allSubcats || []).map((row) => row.subcategories).filter(Boolean);
  if (!subs.some((s) => s.id === subcategory.id)) subs = [subcategory, ...subs];

  const services = subs
    .map((s) => ({
      slug: s.slug,
      icon: subcategoryIcons[s.slug] || '🛠️',
      label: subName(s),
      primary: s.id === subcategory.id,
    }))
    .sort((a, b) => Number(b.primary) - Number(a.primary));

  const count = reviews?.length || 0;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  // স্ট্রাকচার্ড ডেটা (ফোন নম্বর ইচ্ছে করে বাদ)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: provider.name,
    url: `${SITE_URL}/${subcategory.slug}/${provider.slug}`,
    description: (provider.description || `${provider.name}, ${subName(subcategory)}`).slice(0, 500),
    ...(provider.photo_url ? { image: provider.photo_url } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: provider.area,
      addressRegion: 'Sherpur',
      addressCountry: 'BD',
    },
    ...(count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(avg.toFixed(1)),
            reviewCount: count,
          },
        }
      : {}),
  };

  return (
    <>
      <SiteHeader lang={lang} />
      <ProviderProfile
        provider={provider}
        lang={lang}
        backHref={`/${subcategory.slug}`}
        backLabel={t.back}
        headline={`${subName(subcategory)} · ${provider.area}`}
        services={services}
        rating={{ avg, count }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
    </>
  );
}
