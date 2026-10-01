import PhotoLightbox from './PhotoLightbox';
import ReviewSection from './ReviewSection';
import ReportButton from './ReportButton';
import FavoriteButton from './FavoriteButton';
import ShareButton from './ShareButton';
import ContactBar from './ContactBar';
import { toBn } from '../lib/format';

const text = {
  bn: {
    unavailable: 'এই মুহূর্তে অনুপলব্ধ',
    available: 'এখন সক্রিয়',
    about: 'সম্পর্কে',
    noDesc: 'কোনো বিবরণ দেওয়া হয়নি।',
    contact: 'যোগাযোগ',
    verified: 'যাচাইকৃত',
    experience: 'বছরের অভিজ্ঞতা',
    reviews: 'রিভিউ',
    views: 'ভিউ',
    services: 'যে সেবা দেন',
  },
  en: {
    unavailable: 'Currently unavailable',
    available: 'Available now',
    about: 'About',
    noDesc: 'No description provided.',
    contact: 'Contact',
    verified: 'Verified',
    experience: 'years experience',
    reviews: 'reviews',
    views: 'views',
    services: 'Services offered',
  },
};

function uniq(list) {
  return Array.from(new Set(list.map((v) => (v || '').trim()).filter(Boolean)));
}

export default function ProviderProfile({
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

  return (
    <>
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-32">
        <a href={backHref} className="text-sm text-ink/55 hover:text-ink">
          {backLabel}
        </a>

        <div className="bg-white border border-ink/10 rounded-2xl mt-3 overflow-hidden shadow-sm">
          <div className="h-24 bg-gradient-to-r from-green-dark to-green" />

          <div className="px-5 pb-6">
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

            <div className="text-center mt-3">
              <div className="flex items-center justify-center gap-1.5">
                <h1 className="text-2xl font-semibold">{provider.name}</h1>
                <span
                  className="w-5 h-5 rounded-full bg-blue-500 text-white text-[11px] flex items-center justify-center"
                  title={t.verified}
                >
                  ✓
                </span>
              </div>
              <p className="text-ink/60 mt-1 text-sm">{headline}</p>

              {services.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 flex-wrap mt-3">
                  {services.map((s) => (
                    <a
                      key={s.slug}
                      href={`/${s.slug}`}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                        s.primary ? 'bg-marigold text-ink' : 'bg-[#EEF1F8] text-ink/70'
                      }`}
                    >
                      {s.icon} {s.label}
                    </a>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
                {rating.count > 0 && (
                  <span className="text-xs bg-marigold/15 text-ink px-2.5 py-1 rounded-full font-medium">
                    ⭐ <span className="font-numeric">{num(rating.avg.toFixed(1))}</span> · {num(rating.count)} {t.reviews}
                  </span>
                )}
                {provider.experience_years ? (
                  <span className="text-xs bg-[#EEF1F8] text-ink/70 px-2.5 py-1 rounded-full">
                    🛠️ {num(provider.experience_years)} {t.experience}
                  </span>
                ) : null}
                {where && (
                  <span className="text-xs bg-[#EEF1F8] text-ink/70 px-2.5 py-1 rounded-full">📍 {where}</span>
                )}
                {badges.map((b) => (
                  <span key={b} className="text-xs bg-[#EEF1F8] text-ink/70 px-2.5 py-1 rounded-full">
                    {b}
                  </span>
                ))}
                {provider.view_count > 0 && (
                  <span className="text-xs bg-[#EEF1F8] text-ink/70 px-2.5 py-1 rounded-full">
                    👁️ {num(provider.view_count)} {t.views}
                  </span>
                )}
              </div>

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

              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                <FavoriteButton targetType="provider" targetId={provider.id} />
                <ShareButton title={provider.name} lang={lang} />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-ink/10">
              <h2 className="text-sm font-medium text-ink/60 mb-2">{t.about}</h2>
              <p className="text-ink/80 text-sm leading-relaxed whitespace-pre-line">
                {provider.description || t.noDesc}
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-ink/10">
              <h2 className="text-sm font-medium text-ink/60 mb-2">{t.contact}</h2>
              <div className="bg-paper rounded-xl p-3 text-sm space-y-1.5">
                <p>
                  📞 <span className="font-numeric font-medium">{provider.phone}</span>
                </p>
                {fullAddress && <p className="text-ink/70">📍 {fullAddress}</p>}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-ink/10">
              <ReviewSection providerId={provider.id} ownerId={provider.user_id} />
            </div>

            <div className="mt-6 pt-4 border-t border-ink/10 flex justify-center text-xs">
              <ReportButton targetType="provider" targetId={provider.id} />
            </div>
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

      <ContactBar phone={provider.phone} lang={lang} />
    </>
  );
}
