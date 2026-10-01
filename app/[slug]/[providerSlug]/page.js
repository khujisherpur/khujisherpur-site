export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabaseClient';
import SiteHeader from '../../../components/SiteHeader';
import ProviderProfile from '../../../components/ProviderProfile';
import { getLang } from '../../../lib/getLang';

const subcategoryIcons = {
  electrician: '⚡', plumber: '🚰', 'ac-technician': '❄️', 'fridge-technician': '🧊',
  mechanic: '⚙️', carpenter: '🪚', mason: '🧱', painter: '🎨', cleaning: '🧹',
  'mobile-repair': '📱', 'computer-repair': '💻', cctv: '📹',
  'internet-wifi': '📶', driver: '🚗', 'transport-shifting': '🚚',
};

export async function generateMetadata({ params }) {
  const { data: provider } = await supabase
    .from('providers')
    .select('name, name_en, area')
    .eq('slug', params.providerSlug)
    .eq('status', 'approved')
    .maybeSingle();

  if (!provider) {
    return { title: 'প্রোফাইল পাওয়া যায়নি | খুঁজি শেরপুর' };
  }

  const title = `${provider.name} - ${provider.area} | খুঁজি শেরপুর`;
  return { title, openGraph: { title } };
}

const text = {
  bn: { back: '← তালিকায় ফিরে যান', notFound: 'এই প্রোফাইলটি খুঁজে পাওয়া যায়নি।', backHome: 'হোমপেজে ফিরে যান' },
  en: { back: '← Back to list', notFound: 'This profile was not found.', backHome: 'Back to Home' },
};

export default async function ProviderSlugPage({ params }) {
  const lang = getLang();
  const t = text[lang];

  const notFoundView = (
    <>
      <SiteHeader lang={lang} />
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">{t.notFound}</p>
        <a href="/" className="text-green underline mt-2 inline-block">{t.backHome}</a>
      </main>
    </>
  );

  const { data: subcategory } = await supabase
    .from('subcategories')
    .select('id, slug, name_bn, name_en')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!subcategory) return notFoundView;

  const { data: provider } = await supabase
    .from('providers')
    .select('id, user_id, name, name_en, slug, area, upazila, union_name, phone, description, is_available, photo_url, experience_years, view_count, primary_subcategory_id')
    .eq('slug', params.providerSlug)
    .eq('primary_subcategory_id', subcategory.id)
    .eq('status', 'approved')
    .maybeSingle();

  if (!provider) return notFoundView;

  await supabase.rpc('increment_provider_view', { pid: provider.id });

  const [{ data: allSubcats }, { data: reviews }] = await Promise.all([
    supabase
      .from('provider_subcategories')
      .select('subcategories(slug, name_bn, name_en)')
      .eq('provider_id', provider.id),
    supabase.from('reviews').select('rating').eq('provider_id', provider.id),
  ]);

  const services = (allSubcats || [])
    .map((row) => row.subcategories)
    .filter(Boolean)
    .map((s) => ({
      slug: s.slug,
      icon: subcategoryIcons[s.slug] || '🛠️',
      label: lang === 'bn' ? s.name_bn : s.name_en || s.name_bn,
    }));

  const count = reviews?.length || 0;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const primaryName = lang === 'bn' ? subcategory.name_bn : subcategory.name_en || subcategory.name_bn;

  return (
    <>
      <SiteHeader lang={lang} />
      <ProviderProfile
        provider={provider}
        lang={lang}
        backHref={`/${subcategory.slug}`}
        backLabel={t.back}
        headline={`${primaryName} · ${provider.area}`}
        services={services}
        rating={{ avg, count }}
      />
    </>
  );
}
