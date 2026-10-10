export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabase } from '../../../lib/supabaseClient';
import PhotoLightbox from '../../../components/PhotoLightbox';
import ReportButton from '../../../components/ReportButton';
import FavoriteButton from '../../../components/FavoriteButton';
import ShareButton from '../../../components/ShareButton';
import ContactBar from '../../../components/ContactBar';
import SiteHeader from '../../../components/SiteHeader';
import { getLang } from '../../../lib/getLang';
import { categoryLabels } from '../../../lib/categoryLabels';
import { SITE_NAME, DEFAULT_OG_IMAGE } from '../../../lib/site';
import { formatPrice, parsePrice, timeAgo, toBn, cleanPhone, waLink } from '../../../lib/format';

export async function generateMetadata({ params }) {
  const { data: listing } = await supabase
    .from('listings')
    .select('title, area, price_or_salary, description, photos, categories(slug)')
    .eq('id', params.id)
    .eq('status', 'active')
    .gt('expiry_date', new Date().toISOString())
    .maybeSingle();

  if (!listing) {
    return { title: 'পোস্ট পাওয়া যায়নি | খুঁজি শেরপুর', robots: { index: false } };
  }

  const price = formatPrice(listing.price_or_salary, 'bn');
  const title = `${listing.title}${price ? ` - ${price}` : ''} | খুঁজি শেরপুর`;
  const catName = categoryLabels[listing.categories?.slug]?.bn?.name || '';
  const cleanDesc = (listing.description || '').replace(/\s+/g, ' ').trim();
  const description = cleanDesc
    ? cleanDesc.slice(0, 150)
    : `শেরপুরের ${listing.area} এলাকায় ${catName}। এখনই দেখুন খুঁজি শেরপুরে।`;
  const image = listing.photos?.[0];
  const images = image ? [image] : [DEFAULT_OG_IMAGE];

  // ?fbclid= ইত্যাদি যোগ হওয়া লিংকও একই পাতা বলে গণ্য হবে
  const canonical = `/listing/${params.id}`;

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
  bn: {
    back: '← তালিকায় ফিরে যান', desc: 'বিবরণ', noDesc: 'কোনো বিবরণ দেওয়া হয়নি।',
    details: 'বিস্তারিত', category: 'ক্যাটাগরি', location: 'এলাকা', type: 'ধরন', owner: 'মালিক', employer: 'প্রতিষ্ঠান', posted: 'পোস্ট করা হয়েছে',
    views: 'ভিউ',
    contact: 'যোগাযোগ', phone: 'মোবাইল', whatsapp: 'হোয়াটসঅ্যাপ', email: 'ইমেইল',
    noContact: 'এই পোস্টে যোগাযোগের তথ্য দেওয়া হয়নি।',
    house: 'বাসা', shop: 'দোকান', mess: 'মেস', other: 'অন্যান্য',
  },
  en: {
    back: '← Back to list', desc: 'Description', noDesc: 'No description provided.',
    details: 'Details', category: 'Category', location: 'Location', type: 'Type', owner: 'Owner', employer: 'Employer', posted: 'Posted',
    views: 'views',
    contact: 'Contact', phone: 'Phone', whatsapp: 'WhatsApp', email: 'Email',
    noContact: 'No contact information was provided for this post.',
    house: 'House', shop: 'Shop', mess: 'Mess', other: 'Other',
  },
};

// বিবরণের ভেতরের লিংক ক্লিক করার উপযোগী করে
function Linkify({ value }) {
  const parts = String(value).split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="text-green underline break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// JSON-LD নিরাপদ করা: '<' চিহ্ন এস্কেপ, যাতে </script> ঢোকানো না যায়
function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|whatsapp|telegram|headless/i;

export default async function ListingDetailPage({ params }) {
  const lang = getLang();
  const t = text[lang];

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, area, upazila, union_name, price_or_salary, description, photos, rent_type, owner_name, posted_at, expiry_date, view_count, contact_phone, whatsapp, contact_email, categories(slug)')
    .eq('id', params.id)
    .eq('status', 'active')
    .gt('expiry_date', new Date().toISOString())
    .maybeSingle();

  if (!listing) notFound();

  // বট ও লিংক-প্রিভিউয়ের ভিউ গোনা হয় না
  const ua = headers().get('user-agent') || '';
  const counted = !BOT_UA.test(ua);
  if (counted) {
    await supabase.rpc('increment_listing_view', { lid: listing.id });
  }

  const isJob = listing.categories?.slug === 'job';
  const label = categoryLabels[listing.categories?.slug];
  const categoryName = label ? label[lang].name : '';
  const photos = listing.photos || [];
  const where = Array.from(
    new Set([listing.area, listing.union_name, listing.upazila].map((v) => (v || '').trim()).filter(Boolean))
  ).join(', ');
  const price = formatPrice(listing.price_or_salary, lang);
  const views = (listing.view_count || 0) + (counted ? 1 : 0);

  const hasPhone = !!listing.contact_phone;
  const waUrl = waLink(listing.whatsapp);
  const hasContact = hasPhone || !!waUrl || !!listing.contact_email;

  const rows = [
    { k: t.category, v: categoryName },
    { k: t.location, v: where },
    listing.rent_type ? { k: t.type, v: t[listing.rent_type] || listing.rent_type } : null,
    listing.owner_name ? { k: isJob ? t.employer : t.owner, v: listing.owner_name } : null,
    { k: t.posted, v: timeAgo(listing.posted_at, lang) },
  ].filter((r) => r && r.v);

  // স্ট্রাকচার্ড ডেটা: চাকরির জন্য JobPosting (প্রতিষ্ঠানের নাম থাকলে), বাকিদের জন্য Product
  const numericPrice = parsePrice(listing.price_or_salary);
  let jsonLd = null;

  if (isJob) {
    if (listing.owner_name) {
      // আবেদনের শেষ তারিখ বিবরণের ভেতরে "আবেদনের শেষ তারিখ: YYYY-MM-DD" আকারে থাকে
      const deadline = (listing.description || '').match(/আবেদনের শেষ তারিখ:\s*(\d{4}-\d{2}-\d{2})/);
      const validThrough = deadline
        ? `${deadline[1]}T23:59:59+06:00`
        : new Date(listing.expiry_date).toISOString();

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: listing.title,
        description: (listing.description || listing.title).slice(0, 5000),
        datePosted: new Date(listing.posted_at).toISOString().slice(0, 10),
        validThrough,
        hiringOrganization: { '@type': 'Organization', name: listing.owner_name },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: listing.area,
            addressRegion: listing.upazila || 'Sherpur',
            addressCountry: 'BD',
          },
        },
        ...(photos[0] ? { image: photos[0] } : {}),
      };
    }
  } else {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: listing.title,
      description: (listing.description || listing.title).slice(0, 500),
      ...(photos[0] ? { image: photos } : {}),
      ...(numericPrice
        ? {
            offers: {
              '@type': 'Offer',
              priceCurrency: 'BDT',
              price: numericPrice,
              availability: 'https://schema.org/InStock',
            },
          }
        : {}),
    };
  }

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-32">
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

            {/* যোগাযোগ */}
            <div className="mt-6 pt-5 border-t border-ink/10">
              <h2 className="text-sm font-medium text-ink/60 mb-2">{t.contact}</h2>
              {hasContact ? (
                <div className="bg-paper rounded-xl divide-y divide-ink/5">
                  {hasPhone && (
                    <a
                      href={`tel:${cleanPhone(listing.contact_phone)}`}
                      className="flex justify-between gap-4 px-3 py-3 text-sm"
                    >
                      <span className="text-ink/55">📞 {t.phone}</span>
                      <span className="font-numeric font-medium text-green">{listing.contact_phone}</span>
                    </a>
                  )}
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-between gap-4 px-3 py-3 text-sm"
                    >
                      <span className="text-ink/55">💬 {t.whatsapp}</span>
                      <span className="font-numeric font-medium text-green">{listing.whatsapp}</span>
                    </a>
                  )}
                  {listing.contact_email && (
                    <a
                      href={`mailto:${listing.contact_email}`}
                      className="flex justify-between gap-4 px-3 py-3 text-sm"
                    >
                      <span className="text-ink/55">✉️ {t.email}</span>
                      <span className="font-medium text-green break-all text-right">{listing.contact_email}</span>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink/50 bg-paper rounded-xl px-3 py-3">{t.noContact}</p>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-ink/10">
              <h2 className="text-sm font-medium text-ink/60 mb-2">{t.desc}</h2>
              <p className="text-ink/80 text-sm leading-relaxed whitespace-pre-line">
                {listing.description ? <Linkify value={listing.description} /> : t.noDesc}
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

        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
          />
        )}
      </main>

      <ContactBar
        phone={listing.contact_phone}
        whatsapp={listing.whatsapp || ''}
        email={listing.contact_email}
        lang={lang}
      />
    </>
  );
}
