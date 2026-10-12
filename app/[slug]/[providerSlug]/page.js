export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabase } from '../../../lib/supabaseClient';
import SiteHeader from '../../../components/SiteHeader';
import ProviderProfile from '../../../components/ProviderProfile';
import { getLang } from '../../../lib/getLang';
import { toBn } from '../../../lib/format';
import { subcategoryIcons } from '../../../lib/services';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '../../../lib/site';

const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|whatsapp|telegram|headless/i;
const SLUG_RE = /^[a-z0-9-]+$/;

function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

// generateMetadata আর পেজ দুজনেই এটা ডাকে, কিন্তু কোয়েরি চলে একবারই
const getProfile = cache(async (slug, providerSlug) => {
  if (!SLUG_RE.test(slug) || !SLUG_RE.test(providerSlug)) return null;

  const { data: subcategory } = await supabase
    .from('subcategories')
    .select('id, slug, name_bn, name_en')
    .eq('slug', slug)
    .maybeSingle();
  if (!subcategory) return null;

  const { data: provider } = await supabase
    .from('providers')
    .select('id, user_id, name, name_en, slug, area, upazila, union_name, phone, whatsapp, description, is_available, photo_url, experience_years, view_count, primary_subcategory_id, is_verified')
    .eq('slug', providerSlug)
    .eq('primary_subcategory_id', subcategory.id)
    .eq('status', 'approved')
    .maybeSingle();
  if (!provider) return null;

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('provider_id', provider.id);

  return { subcategory, provider, reviews: reviews || [] };
});

function placeOf(provider) {
  return Array.from(
    new Set([provider.area, provider.upazila].map((v) => (v || '').trim()).filter(Boolean))
  ).join(', ');
}

export async function generateMetadata({ params }) {
  const lang = getLang();
  const notFoundMeta = {
    title: 'প্রোফাইল পাওয়া যায়নি | খুঁজি শেরপুর',
    robots: { index: false },
  };

  const profile = await getProfile(params.slug, params.providerSlug);
  if (!profile) return notFoundMeta;
  const { subcategory, provider, reviews } = profile;

  const subName = lang === 'bn' ? subcategory.name_bn : subcategory.name_en || subcategory.name_bn;
  const place = placeOf(provider);
  const placeFull = `${place}${place.includes('শেরপুর') ? '' : ', শেরপুর'}`;

  const title = `${provider.name} — ${subName}, ${placeFull} | খুঁজি শেরপুর`;

  // বর্ণনা শুধু যাচাইযোগ্য তথ্য দিয়ে: ইউজারের নিজের লেখা এখানে বসানো হয় না
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const parts = [`${provider.name}, ${placeFull} এলাকার ${subName}।`];
  if (provider.experience_years) parts.push(`${toBn(provider.experience_years)} বছরের অভিজ্ঞতা।`);
  if (count > 0) parts.push(`রেটিং ${toBn(avg.toFixed(1))}/৫ (${toBn(count)} রিভিউ)।`);
  parts.push(provider.whatsapp ? 'সরাসরি কল বা WhatsApp করুন।' : 'সরাসরি কল করুন।');
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
  const profile = await getProfile(params.slug, params.providerSlug);
  if (!profile) notFound();
  const { subcategory, provider, reviews } = profile;

  // বট ও লিংক-প্রিভিউয়ের ভিউ গোনা হয় না
  const ua = headers().get('user-agent') || '';
  if (!BOT_UA.test(ua)) {
    await supabase.rpc('increment_provider_view', { pid: provider.id });
  }

  const { data: allSubcats } = await supabase
    .from('provider_subcategories')
    .select('subcategories(id, slug, name_bn, name_en)')
    .eq('provider_id', provider.id);

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

  const count = reviews.length;
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
