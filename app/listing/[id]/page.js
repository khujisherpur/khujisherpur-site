export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabaseClient';
import PhotoLightbox from '../../../components/PhotoLightbox';
import ReportButton from '../../../components/ReportButton';
import FavoriteButton from '../../../components/FavoriteButton';
import ShareButton from '../../../components/ShareButton';
import SiteHeader from '../../../components/SiteHeader';
import { getLang } from '../../../lib/getLang';
import { categoryLabels } from '../../../lib/categoryLabels';
import { formatPrice, timeAgo, toBn } from '../../../lib/format';

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

  return { title, description, openGraph: { title, description } };
}

const text = {
  bn: {
    back: '← তালিকায় ফিরে যান', desc: 'বিবরণ', noDesc: 'কোনো বিবরণ দেওয়া হয়নি।',
    notFound: 'এই পোস্টটি খুঁজে পাওয়া যায়নি বা মেয়াদ শেষ হয়ে গেছে।', backHome: 'হোমপেজে ফিরে যান',
    details: 'বিস্তারিত', category: 'ক্যাটাগরি', location: 'এলাকা', type: 'ধরন', owner: 'মালিক', posted: 'পোস্ট করা হয়েছে',
    views: 'ভিউ',
    house: 'বাসা', shop: 'দোকান', mess: 'মেস', other: 'অন্যান্য',
  },
  en: {
    back: '← Back to list', desc: 'Description', noDesc: 'No description provided.',
    notFound: 'This post was not found or has expired.', backHome: 'Back to Home',
    details: 'Details', category: 'Category', location: 'Location', type: 'Type', owner: 'Owner', posted: 'Posted',
    views: 'views',
    house: 'House', shop: 'Shop', mess: 'Mess', other: 'Other',
  },
};

export default async function ListingDetailPage({ params }) {
  const lang = getLang();
  const t = text[lang];

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, area, upazila, union_name, price_or_salary, description, photos, rent_type, owner_name, posted_at, view_count, categories(slug)')
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (!listing) {
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

  await supabase.rpc('increment_listing_view', { lid: listing.id });

  const label = categoryLabels[listing.categories?.slug];
  const categoryName = label ? label[lang].name : '';
  const photos = listing.photos || [];
  const where = [listing.area, listing.union_name, listing.upazila].filter(Boolean).join(', ');
  const price = formatPrice(listing.price_or_salary, lang);
  const views = (listing.view_count || 0) + 1;

  const rows = [
    { k: t.category, v: categoryName },
    { k: t.location, v: where },
    listing.rent_type ? { k: t.type, v: t[listing.rent_type] || listing.rent_type } : null,
    listing.owner_name ? { k: t.owner, v: listing.owner_name } : null,
    { k: t.posted, v: timeAgo(listing.posted_at, lang) },
  ].filter((r) => r && r.v);

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-16">
        <a href={`/category/${listing.categories?.slug}`} className="text-sm text-ink/55 hover:text-ink">
          {t.back}
        </a>

        <div className="bg-white border border-ink/10 rounded-2xl mt-3 overflow-hidden shadow-sm">
          {photos.length > 0 ? (
            <div>
              <PhotoLightbox src={photos[0]} alt={`${listing.title} - 1`} size="w-full h-64" rounded={false} />
              {photos.length > 1 && (
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {photos.slice(1).map((url, i) => (
                    <PhotoLightbox
                      key={url}
                      src={url}
                      alt={`${listing.title} - ${i + 2}`}
                      size="w-full h-28"
                      rounded={false}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-32 bg-[#EEF1F8] flex items-center justify-center text-5xl opacity-70">
              {label?.icon || '📄'}
            </div>
          )}

          <div className="p-5">
            <div className="flex items-center gap-2 flex-wrap">
              {categoryName && (
                <span className="text-[11px] bg-[#EEF1F8] text-ink/70 px-2.5 py-1 rounded-full">{categoryName}</span>
              )}
              {listing.rent_type && (
                <span className="text-[11px] bg-marigold/15 text-ink px-2.5 py-1 rounded-full">
                  {t[listing.rent_type] || listing.rent_type}
                </span>
              )}
            </div>

            <h1 className="text-xl font-semibold mt-2 leading-snug">{listing.title}</h1>
            {price && <p className="text-2xl font-semibold text-green font-numeric mt-2">{price}</p>}
            <p className="text-sm text-ink/55 mt-2">
              📍 {where}
              <span className="mx-1.5">·</span>
              {timeAgo(listing.posted_at, lang)}
              <span className="mx-1.5">·</span>👁️ {lang === 'bn' ? toBn(views) : views} {t.views}
            </p>

            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <FavoriteButton targetType="listing" targetId={listing.id} />
              <ShareButton title={listing.title} lang={lang} />
            </div>

            <div className="mt-6 pt-5 border-t border-ink/10">
              <h2 className="text-sm font-medium text-ink/60 mb-2">{t.desc}</h2>
              <p className="text-ink/80 text-sm leading-relaxed whitespace-pre-line">
                {listing.description || t.noDesc}
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-ink/10">
              <h2 className="text-sm font-medium text-ink/60 mb-2">{t.details}</h2>
              <div className="bg-paper rounded-xl divide-y divide-ink/5">
                {rows.map((r) => (
                  <div key={r.k} className="flex justify-between gap-4 px-3 py-2.5 text-sm">
                    <span className="text-ink/55 flex-shrink-0">{r.k}</span>
                    <span className="text-right">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-ink/10 flex justify-center text-xs">
              <ReportButton targetType="listing" targetId={listing.id} />
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
              ...(photos[0] ? { image: photos[0] } : {}),
            }),
          }}
        />
      </main>
    </>
  );
}
