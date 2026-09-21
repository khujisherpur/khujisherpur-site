export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabaseClient';
import PhotoLightbox from '../../../components/PhotoLightbox';
import ReportButton from '../../../components/ReportButton';
import FavoriteButton from '../../../components/FavoriteButton';
import LanguageToggle from '../../../components/LanguageToggle';
import { getLang } from '../../../lib/getLang';
import { categoryLabels } from '../../../lib/categoryLabels';

export async function generateMetadata({ params }) {
  const { data: listing } = await supabase
    .from('listings')
    .select('title, area, price_or_salary, description, categories(name)')
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (!listing) {
    return { title: 'পোস্ট পাওয়া যায়নি | খুঁজি শেরপুর' };
  }

  const title = `${listing.title} - ${listing.price_or_salary} | খুঁজি শেরপুর`;
  const description = listing.description
    ? listing.description.slice(0, 150)
    : `শেরপুরের ${listing.area} এলাকায় ${listing.categories?.name}। এখনই দেখুন খুঁজি শেরপুরে।`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

const text = {
  bn: { login: 'লগইন', back: '← তালিকায় ফিরে যান', desc: 'বিবরণ', noDesc: 'কোনো বিবরণ দেওয়া হয়নি।', notFound: 'এই পোস্টটি খুঁজে পাওয়া যায়নি বা মেয়াদ শেষ হয়ে গেছে।', backHome: 'হোমপেজে ফিরে যান' },
  en: { login: 'Login', back: '← Back to list', desc: 'Description', noDesc: 'No description provided.', notFound: 'This post was not found or has expired.', backHome: 'Back to Home' },
};

export default async function ListingDetailPage({ params }) {
  const lang = getLang();
  const t = text[lang];

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, area, price_or_salary, description, photos, categories(slug)')
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (!listing) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">{t.notFound}</p>
        <a href="/" className="text-green underline mt-2 inline-block">{t.backHome}</a>
      </main>
    );
  }

  const label = categoryLabels[listing.categories?.slug];
  const categoryName = label ? label[lang].name : '';
  const hasPhotos = listing.photos && listing.photos.length > 0;

  return (
    <main className="max-w-2xl mx-auto px-4">
      <header className="flex items-center justify-between py-6 flex-wrap gap-3">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" /></a>
        <div className="flex items-center gap-2">
          <LanguageToggle lang={lang} />
          <a href="/login" className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white">{t.login}</a>
        </div>
      </header>

      <a href={`/category/${listing.categories?.slug}`} className="text-sm text-ink/50 hover:text-ink">
        {t.back}
      </a>

      <div className="bg-white border border-ink/10 mt-4 overflow-hidden">
        {hasPhotos ? (
          <div className={`grid gap-1 ${listing.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
            {listing.photos.map((url, i) => (
              <PhotoLightbox
                key={i}
                src={url}
                alt={`${listing.title} - ${i + 1}`}
                size={listing.photos.length === 1 ? 'w-full h-56' : 'w-full h-28'}
                rounded={false}
              />
            ))}
          </div>
        ) : (
          <div className="h-16 bg-marigold/10" />
        )}

        <div className="p-6">
          <h1 className="text-xl font-semibold">{listing.title}</h1>
          <p className="text-ink/60 mt-1">{categoryName} · {listing.area}</p>
          <p className="text-green font-semibold text-lg mt-2">{listing.price_or_salary}</p>
          <div className="mt-3 flex items-center gap-3">
            <FavoriteButton targetType="listing" targetId={listing.id} />
            <ReportButton targetType="listing" targetId={listing.id} />
          </div>

          <div className="mt-6 pt-6 border-t border-ink/10">
            <h2 className="font-medium mb-2 text-sm text-ink/50 uppercase tracking-wide">{t.desc}</h2>
            <p className="text-ink/80 text-sm leading-relaxed">
              {listing.description || t.noDesc}
            </p>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': listing.categories?.slug === 'job' ? 'JobPosting' : 'Product',
            name: listing.title,
            description: listing.description,
          }),
        }}
      />
    </main>
  );
}
