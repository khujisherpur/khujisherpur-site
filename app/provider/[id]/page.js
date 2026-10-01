export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabaseClient';
import SiteHeader from '../../../components/SiteHeader';
import ProviderProfile from '../../../components/ProviderProfile';
import { getLang } from '../../../lib/getLang';
import { categoryLabels } from '../../../lib/categoryLabels';

export async function generateMetadata({ params }) {
  const { data: provider } = await supabase
    .from('providers')
    .select('name, area, description, categories(name)')
    .eq('id', params.id)
    .eq('status', 'approved')
    .single();

  if (!provider) {
    return { title: 'প্রোফাইল পাওয়া যায়নি | খুঁজি শেরপুর' };
  }

  const title = `${provider.name} - ${provider.categories?.name} ${provider.area} | খুঁজি শেরপুর`;
  const description = provider.description
    ? provider.description.slice(0, 150)
    : `শেরপুরের ${provider.area} এলাকায় বিশ্বস্ত ${provider.categories?.name}। যোগাযোগ করুন খুঁজি শেরপুরের মাধ্যমে।`;

  return { title, description, openGraph: { title, description } };
}

const text = {
  bn: { back: '← তালিকায় ফিরে যান', notFound: 'এই প্রোফাইলটি খুঁজে পাওয়া যায়নি।', backHome: 'হোমপেজে ফিরে যান' },
  en: { back: '← Back to list', notFound: 'This profile was not found.', backHome: 'Back to Home' },
};

export default async function ProviderDetailPage({ params }) {
  const lang = getLang();
  const t = text[lang];

  const { data: provider } = await supabase
    .from('providers')
    .select('id, user_id, name, area, upazila, union_name, phone, description, is_available, photo_url, vehicle_type, experience_years, view_count, categories(slug)')
    .eq('id', params.id)
    .eq('status', 'approved')
    .single();

  if (!provider) {
    return (
      <>
        <SiteHeader lang={lang} />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-ink/70">{t.notFound}</p>
          <a href="/" className="text-green underline mt-2 inline-block">{t.backHome}</a>
        </main>
      </>
    );
  }

  await supabase.rpc('increment_provider_view', { pid: provider.id });

  const { data: reviews } = await supabase.from('reviews').select('rating').eq('provider_id', provider.id);
  const count = reviews?.length || 0;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  const slug = provider.categories?.slug;
  const label = categoryLabels[slug];
  const categoryName = label ? label[lang].name : '';
  const badges = [];
  if (slug === 'ambulance' && provider.vehicle_type) {
    badges.push(`🚑 ${provider.vehicle_type === 'ac' ? 'AC' : 'Non-AC'}`);
  }

  return (
    <>
      <SiteHeader lang={lang} />
      <ProviderProfile
        provider={provider}
        lang={lang}
        backHref={slug ? `/category/${slug}` : '/'}
        backLabel={t.back}
        headline={`${categoryName} · ${provider.area}`}
        rating={{ avg, count }}
        badges={badges}
      />
    </>
  );
}
