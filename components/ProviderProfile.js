import PhotoLightbox from './PhotoLightbox';
import ReviewSection from './ReviewSection';
import ReportButton from './ReportButton';
import FavoriteButton from './FavoriteButton';
import ProfileMenu from './ProfileMenu';
import { supabase } from '../lib/supabaseClient';
import { getServicesFor, providerHref } from '../lib/services';
import { toBn } from '../lib/format';

const text = {
  bn: {
    unavailable: 'এই মুহূর্তে অনুপলব্ধ',
    available: 'এখন সক্রিয়',
    about: 'পরিচিতি',
    noDesc: 'কোনো বিবরণ দেওয়া হয়নি।',
    info: 'তথ্য',
    verified: 'যাচাইকৃত',
    experience: 'অভিজ্ঞতা',
    year: 'বছর',
    rating: 'রেটিং',
    views: 'ভিউ',
    call: 'কল',
    whatsapp: 'WhatsApp',
    phone: 'মোবাইল',
    address: 'ঠিকানা',
    services: 'যে সেবা দেন',
    more: 'আরও',
    seeAll: 'সব দেখুন →',
    exp: 'বছর অভিজ্ঞতা',
  },
  en: {
    unavailable: 'Currently unavailable',
    available: 'Available now',
    about: 'About',
    noDesc: 'No description provided.',
    info: 'Information',
    verified: 'Verified',
    experience: 'Experience',
    year: 'yrs',
    rating: 'Rating',
    views: 'Views',
    call: 'Call',
    whatsapp: 'WhatsApp',
    phone: 'Phone',
    address: 'Address',
    services: 'Services offered',
    more: 'More',
    seeAll: 'See all →',
    exp: 'yrs experience',
  },
};

function uniq(list) {
  return Array.from(new Set(list.map((v) => (v || '').trim()).filter(Boolean)));
}

function waLink(n) {
  let d = (n || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('0')) d = '88' + d;
  else if (!d.startsWith('880')) d = '880' + d;
  return `https://wa.me/${d}`;
}

function ContactButtons({ phone, whatsapp, t, small = false }) {
  const wa = waLink(whatsapp);
  const size = small ? 'py-2 text-xs' : 'py-3 text-sm';
  return (
    <div className="flex gap-2">
      <a
        href={`tel:${phone}`}
        className={`flex-1 text-center font-semibold rounded-xl bg-marigold text-ink ${size}`}
      >
        📞 {t.call}
      </a>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 text-center font-semibold rounded-xl bg-[#25D366] text-white ${size}`}
        >
          💬 {t.whatsapp}
        </a>
      )}
    </div>
  );
}

async function getRelated(provider, lang) {
  let subId = provider.primary_subcategory_id;
  if (!subId) {
    const { data } = await supabase
      .from('providers')
      .select('primary_subcategory_id')
      .eq('id', provider.id)
      .maybeSingle();
    subId = data?.primary_subcategory_id;
  }
  if (!subId) return { items: [], svc: {} };

  const { data } = await supabase
    .from('providers')
    .select('id, slug, name, area, upazila, phone, whatsapp, is_available, photo_url, experience_years, primary_subcategory_id, is_verified')
    .eq('status', 'approved')
    .eq('primary_subcategory_id', subId)
    .neq('id', provider.id)
    .limit(30);

  let items = data || [];
  // একই উপজেলার আগে, তারপর অন্যরা
  items.sort(
    (a, b) =>
      Number(b.upazila === provider.upazila) - Number(a.upazila === provider.upazila)
  );
  items = items.slice(0, 10);
  const svc = items.length ? await getServicesFor(items, lang) : {};
  return { items, svc };
}

export default async function ProviderProfile({
  provider,
  lang,
  backHref,
  backLabel,
  headline,
  services = [],
  rating = { avg: 0, count: 0 },
  badges = [],
}) {
  const t = text[lang];
  const num = (n) => (lang === 'bn' ? toBn(n) : n);
  const where = uniq([provider.union_name, provider.upazila]).join(', ');
  const fullAddress = uniq([provider.area, provider.union_name, provider.upazila]).join(', ');
  const primarySlug = services.find((s) => s.primary)?.slug;
  const otherServices = services.filter((s) => !s.primary);

  const { items: related, svc } = await getRelated(provider, lang);
  const relatedTitle = `${t.more} ${services.find((s) => s.primary)?.label || ''}`.trim();

  return (
    <main className="max-w-2xl mx-auto px-4 pt-4 pb-12">
      <a href={backHref} className="text-sm text-ink/55 hover:text-ink">
        {backLabel}
      </a>

      <div className="bg-white border border-ink/10 rounded-2xl mt-3 shadow-sm relative">
        <div className="h-24 bg-gradient-to-r from-green-dark to-green rounded-t-2xl" />

        <ProfileMenu title={provider.name} lang={lang}>
          <div className="menu-item">
            <FavoriteButton targetType="provider" targetId={provider.id} />
          </div>
          <div className="menu-item">
            <ReportButton targetType="provider" targetId={provider.id} />
          </div>
        </ProfileMenu>

        <div className="px-5 pb-6">
          {/* ছবি */}
          <div className="-mt-14 flex justify-center">
            {provider.photo_url ? (
              <div className="rounded-full border-4 border-white shadow">
                <PhotoLightbox src={provider.photo_url} alt={provider.name} size="w-28 h-28" />
              </div>
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#EEF1F8] border-4 border-white shadow flex items-center justify-center text-4xl text-green-dark font-semibold">
                {provider.name?.charAt(0)}
              </div>
            )}
          </div>

          {/* নাম */}
          <div className="text-center mt-3">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-2xl font-semibold leading-tight">{provider.name}</h1>
              {provider.is_verified && (
                <span
                  className="w-5 h-5 rounded-full bg-blue-500 text-white text-[11px] flex items-center justify-center flex-shrink-0"
                  title={t.verified}
                >
                  ✓
                </span>
              )}
            </div>
            <p className="text-ink/60 mt-1 text-sm">{headline}</p>

            <div className="mt-3">
              {provider.is_available ? (
                <span className="inline-block text-xs bg-green/10 text-green px-3 py-1 rounded-full font-medium">
                  ● {t.available}
                </span>
              ) : (
                <span className="inline-block text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full font-medium">
                  {t.unavailable}
                </span>
              )}
            </div>
          </div>

          {/* কল ও WhatsApp */}
          <div className="mt-5">
            <ContactButtons phone={provider.phone} whatsapp={provider.whatsapp} t={t} />
          </div>

          {/* স্ট্যাট কার্ড */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="bg-[#EEF1F8] rounded-xl py-3 text-center">
              <p className="text-lg font-semibold font-numeric">
                {provider.experience_years ? num(provider.experience_years) : '—'}
              </p>
              <p className="text-[11px] text-ink/55 mt-0.5">
                {t.experience} ({t.year})
              </p>
            </div>
            <div className="bg-[#EEF1F8] rounded-xl py-3 text-center">
              <p className="text-lg font-semibold font-numeric">
                {rating.count > 0 ? `⭐ ${num(rating.avg.toFixed(1))}` : '—'}
              </p>
              <p className="text-[11px] text-ink/55 mt-0.5">
                {t.rating}
                {rating.count > 0 ? ` (${num(rating.count)})` : ''}
              </p>
            </div>
            <div className="bg-[#EEF1F8] rounded-xl py-3 text-center">
              <p className="text-lg font-semibold font-numeric">{num(provider.view_count || 0)}</p>
              <p className="text-[11px] text-ink/55 mt-0.5">{t.views}</p>
            </div>
          </div>

          {(otherServices.length > 0 || badges.length > 0) && (
            <div className="flex items-center justify-center gap-1.5 flex-wrap mt-4">
              {otherServices.map((s) => (
                <a
                  key={s.slug}
                  href={`/${s.slug}`}
                  className="text-xs px-3 py-1.5 rounded-full font-medium bg-[#EEF1F8] text-ink/70"
                >
                  {s.icon} {s.label}
                </a>
              ))}
              {badges.map((b) => (
                <span key={b} className="text-xs bg-[#EEF1F8] text-ink/70 px-3 py-1.5 rounded-full">
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* পরিচিতি */}
          <div className="mt-6 pt-5 border-t border-ink/10">
            <h2 className="text-sm font-semibold text-ink/70 mb-2">{t.about}</h2>
            <p className="text-ink/80 text-sm leading-relaxed whitespace-pre-line">
              {provider.description || t.noDesc}
            </p>
          </div>

          {/* তথ্য */}
          <div className="mt-6 pt-5 border-t border-ink/10">
            <h2 className="text-sm font-semibold text-ink/70 mb-2">{t.info}</h2>
            <div className="bg-paper rounded-xl p-3 text-sm space-y-2">
              <p className="flex justify-between gap-3">
                <span className="text-ink/55">📞 {t.phone}</span>
                <span className="font-numeric font-medium">{provider.phone}</span>
              </p>
              {fullAddress && (
                <p className="flex justify-between gap-3">
                  <span className="text-ink/55">📍 {t.address}</span>
                  <span className="text-right text-ink/80">{fullAddress}</span>
                </p>
              )}
            </div>
          </div>

          {/* রিভিউ */}
          <div className="mt-6 pt-5 border-t border-ink/10">
            <ReviewSection providerId={provider.id} ownerId={provider.user_id} />
          </div>
        </div>
      </div>

      {/* আরও প্রোফাইল (swipe) */}
      {related.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-semibold">{relatedTitle}</h2>
            {primarySlug && (
              <a href={`/${primarySlug}`} className="text-sm text-green">
                {t.seeAll}
              </a>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide">
            {related.map((p) => {
              const sv = svc[p.id] || [];
              return (
                <div
                  key={p.id}
                  className="snap-start flex-shrink-0 w-56 bg-white border border-ink/10 rounded-2xl p-3 shadow-sm"
                >
                  <a href={providerHref(p, sv)} className="block text-center">
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.name || ''}
                        className="w-20 h-20 rounded-full object-cover mx-auto"
                      />
                    ) : (
                      <span className="w-20 h-20 rounded-full bg-[#EEF1F8] text-green-dark text-2xl font-semibold flex items-center justify-center mx-auto">
                        {p.name?.charAt(0)}
                      </span>
                    )}
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      {p.is_verified && (
                        <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center flex-shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/55 mt-0.5 truncate">📍 {p.area}</p>
                    <p className="text-[11px] text-ink/45 mt-0.5 h-4">
                      {p.experience_years ? `🛠️ ${num(p.experience_years)} ${t.exp}` : ''}
                    </p>
                  </a>
                  <div className="mt-2">
                    <ContactButtons phone={p.phone} whatsapp={p.whatsapp} t={t} small />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
            ...(rating.count > 0
              ? {
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: rating.avg.toFixed(1),
                    reviewCount: rating.count,
                  },
                }
              : {}),
          }),
        }}
      />
    </main>
  );
}
