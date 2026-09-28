export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabaseClient';
import PhotoLightbox from '../../../components/PhotoLightbox';
import ReviewSection from '../../../components/ReviewSection';
import ReportButton from '../../../components/ReportButton';
import FavoriteButton from '../../../components/FavoriteButton';
import SiteHeader from '../../../components/SiteHeader';
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
  bn: { back: '← তালিকায় ফিরে যান', unavailable: 'এই মুহূর্তে অনুপলব্ধ', about: 'সম্পর্কে', noDesc: 'কোনো বিবরণ দেওয়া হয়নি।', notFound: 'এই প্রোফাইলটি খুঁজে পাওয়া যায়নি।', backHome: 'হোমপেজে ফিরে যান', verified: 'যাচাইকৃত', experience: 'বছরের অভিজ্ঞতা' },
  en: { back: '← Back to list', unavailable: 'Currently unavailable', about: 'About', noDesc: 'No description provided.', notFound: 'This profile was not found.', backHome: 'Back to Home', verified: 'Verified', experience: 'years experience' },
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
    .select('id, user_id, name, name_en, slug, area, upazila, union_name, phone, description, is_available, photo_url, experience_years, primary_subcategory_id')
    .eq('slug', params.providerSlug)
    .eq('primary_subcategory_id', subcategory.id)
    .eq('status', 'approved')
    .maybeSingle();

  if (!provider) return notFoundView;

  await supabase.rpc('increment_provider_view', { pid: provider.id });

  const { data: allSubcats } = await supabase
    .from('provider_subcategories')
    .select('subcategories(slug, name_bn, name_en)')
    .eq('provider_id', provider.id);
  const services = (allSubcats || []).map((row) => row.subcategories).filter(Boolean);

  const primaryName = lang === 'bn' ? subcategory.name_bn : (subcategory.name_en || subcategory.name_bn);

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="max-w-2xl mx-auto px-4 pt-4">
        <a href={`/${subcategory.slug}`} className="text-sm text-ink/50 hover:text-ink">
          {t.back}
        </a>

        <div className="bg-white border border-ink/10 mt-4 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-green-dark to-green" />

          <div className="px-6 pb-6">
            <div className="-mt-12 flex justify-center">
              {provider.photo_url ? (
                <div className="rounded-full border-4 border-white">
                  <PhotoLightbox src={provider.photo_url} alt={provider.name} size="w-24 h-24" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#EEF1F8] border-4 border-white flex items-center justify-center text-3xl text-ink/40">
                  {provider.name?.charAt(0)}
                </div>
              )}
            </div>

            <div className="text-center mt-3">
              <div className="flex items-center justify-center gap-1.5">
                <h1 className="text-2xl font-semibold">{provider.name}</h1>
                <span className="text-blue-500 text-lg" title={t.verified}>✓</span>
              </div>
              <p className="text-ink/60 mt-1">{primaryName} · {provider.area}{provider.upazila ? `, ${provider.upazila}` : ''}</p>

              {services.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 flex-wrap mt-2">
                  {services.map((s) => (
                    <span key={s.slug} className="text-[10px] bg-[#EEF1F8] text-ink/60 px-2 py-0.5 rounded-full">
                      {subcategoryIcons[s.slug] || '🛠️'} {lang === 'bn' ? s.name_bn : (s.name_en || s.name_bn)}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap text-sm text-ink/50">
                {provider.experience_years && (
                  <span>{provider.experience_years} {t.experience}</span>
                )}
              </div>

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
              📞 <span className="font-numeric">{provider.phone}</span>
            </a>

            <ReviewSection providerId={provider.id} ownerId={provider.user_id} />
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
    </>
  );
}
