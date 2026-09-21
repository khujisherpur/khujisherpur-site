export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabaseClient';
import PhotoLightbox from '../../../components/PhotoLightbox';
import ReviewSection from '../../../components/ReviewSection';
import ReportButton from '../../../components/ReportButton';
import FavoriteButton from '../../../components/FavoriteButton';
import LanguageToggle from '../../../components/LanguageToggle';
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

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

const text = {
  bn: { login: 'লগইন', back: '← তালিকায় ফিরে যান', unavailable: 'এই মুহূর্তে অনুপলব্ধ', about: 'সম্পর্কে', noDesc: 'কোনো বিবরণ দেওয়া হয়নি।', notFound: 'এই প্রোফাইলটি খুঁজে পাওয়া যায়নি।', backHome: 'হোমপেজে ফিরে যান' },
  en: { login: 'Login', back: '← Back to list', unavailable: 'Currently unavailable', about: 'About', noDesc: 'No description provided.', notFound: 'This profile was not found.', backHome: 'Back to Home' },
};

export default async function ProviderDetailPage({ params }) {
  const lang = getLang();
  const t = text[lang];

  const { data: provider } = await supabase
    .from('providers')
    .select('id, name, area, phone, description, is_available, photo_url, categories(slug)')
    .eq('id', params.id)
    .eq('status', 'approved')
    .single();

  if (!provider) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">{t.notFound}</p>
        <a href="/" className="text-green underline mt-2 inline-block">{t.backHome}</a>
      </main>
    );
  }

  const label = categoryLabels[provider.categories?.slug];
  const categoryName = label ? label[lang].name : '';

  return (
    <main className="max-w-2xl mx-auto px-4">
      <header className="flex items-center justify-between py-6 flex-wrap gap-3">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" /></a>
        <div className="flex items-center gap-2">
          <LanguageToggle lang={lang} />
          <a href="/login" className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white">{t.login}</a>
        </div>
      </header>

      <a href={`/category/${provider.categories?.slug}`} className="text-sm text-ink/50 hover:text-ink">
        {t.back}
      </a>

      <div className="bg-white border border-ink/10 mt-4 overflow-hidden">
        <div className="h-20 bg-green/10" />

        <div className="px-6 pb-6">
          <div className="-mt-12 flex justify-center">
            {provider.photo_url ? (
              <div className="rounded-full border-4 border-white">
                <PhotoLightbox src={provider.photo_url} alt={provider.name} size="w-24 h-24" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-paper border-4 border-white flex items-center justify-center text-3xl text-ink/30">
                {provider.name?.charAt(0)}
              </div>
            )}
          </div>

          <div className="text-center mt-3">
            <h1 className="text-2xl font-semibold">{provider.name}</h1>
            <p className="text-ink/60 mt-1">{categoryName} · {provider.area}</p>
            {!provider.is_available && (
              <span className="inline-block mt-2 text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
                {t.unavailable}
              </span>
            )}
            <div className="mt-3 flex items-center justify-center gap-3">
              <FavoriteButton targetType="provider" targetId={provider.id} />
              <ReportButton targetType="provider" targetId={provider.id} />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-ink/10">
            <h2 className="font-medium mb-2 text-sm text-ink/50 uppercase tracking-wide">{t.about}</h2>
            <p className="text-ink/80 text-sm leading-relaxed">
              {provider.description || t.noDesc}
            </p>
          </div>

          <a
            href={`tel:${provider.phone}`}
            className="block text-center mt-6 bg-marigold text-ink font-semibold py-2.5 hover:bg-marigold/90 transition-colors"
          >
            📞 {provider.phone}
          </a>

          <ReviewSection providerId={provider.id} />
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: provider.name,
            areaServed: provider.area,
            telephone: provider.phone,
            description: provider.description,
          }),
        }}
      />
    </main>
  );
}
