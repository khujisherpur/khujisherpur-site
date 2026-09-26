export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../lib/supabaseClient';
import { getLang } from '../lib/getLang';
import { categoryLabels } from '../lib/categoryLabels';
import LanguageToggle from '../components/LanguageToggle';
import AuthButton from '../components/AuthButton';
import BottomNav from '../components/BottomNav';
import HeaderBell from '../components/HeaderBell';
import HeroIntro from '../components/HeroIntro';

const text = {
  bn: {
    tagline1: 'শেরপুরে যা খুঁজছেন', tagline2: 'এক জায়গায় খুঁজুন',
    heroTitle: 'শেরপুরে যা খুঁজছেন, এক জায়গায় খুঁজুন',
    heroSubtitle: 'বাসা ভাড়া, চাকরি, নাকি বিশ্বস্ত মিস্ত্রি — যা দরকার সবই পাবেন এখানে।',
    liveCount: (n) => `শেরপুরে এখন ${n}টি সক্রিয় পোস্ট ও প্রোফাইল`,
    searchPlaceholder: 'নাম, এলাকা, ক্যাটাগরি দিয়ে খুঁজুন...',
    whatLooking: 'কী খুঁজছেন?',
    recentTitle: 'সাম্প্রতিক পোস্ট', seeAll: 'সব দেখুন →',
    providersTitle: 'সাম্প্রতিক সেবাদাতা',
    howTitle: 'কীভাবে কাজ করে',
    step1Title: 'খুঁজুন', step1Desc: 'ক্যাটাগরি বা সার্চ দিয়ে প্রয়োজন খুঁজে নিন',
    step2Title: 'যোগাযোগ করুন', step2Desc: 'বিস্তারিত দেখে সরাসরি কল করুন',
    step3Title: 'পান/সেবা নিন', step3Desc: 'আপনার প্রয়োজন সহজেই পূরণ করুন',
    reviews: 'রিভিউ',
    terms: 'শর্তাবলি', privacy: 'প্রাইভেসি পলিসি', disclaimer: 'দায়বদ্ধতা',
    footer: '© ২০২৬ খুঁজি শেরপুর', credit: 'Developed by ASRAFUL',
    justNow: 'এইমাত্র', minutesAgo: (n) => `${n} মিনিট আগে`, hoursAgo: (n) => `${n} ঘণ্টা আগে`, daysAgo: (n) => `${n} দিন আগে`,
  },
  en: {
    tagline1: 'What you\u2019re looking for in Sherpur', tagline2: 'find it all in one place',
    heroTitle: 'Find what you\u2019re looking for in Sherpur, all in one place',
    heroSubtitle: 'House rent, jobs, or a trusted repairman — find everything here.',
    liveCount: (n) => `${n} active posts & profiles in Sherpur right now`,
    searchPlaceholder: 'Search by name, area, category...',
    whatLooking: 'What are you looking for?',
    recentTitle: 'Recent Posts', seeAll: 'See all →',
    providersTitle: 'Recent Providers',
    howTitle: 'How It Works',
    step1Title: 'Search', step1Desc: 'Use categories or search to find what you need',
    step2Title: 'Contact', step2Desc: 'Call directly after checking details',
    step3Title: 'Get It Done', step3Desc: 'Easily fulfill your need',
    reviews: 'reviews',
    terms: 'Terms', privacy: 'Privacy Policy', disclaimer: 'Disclaimer',
    footer: '© 2026 Khuji Sherpur', credit: 'Developed by ASRAFUL',
    justNow: 'Just now', minutesAgo: (n) => `${n}m ago`, hoursAgo: (n) => `${n}h ago`, daysAgo: (n) => `${n}d ago`,
  },
};

function timeAgo(dateStr, t) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t.justNow;
  if (mins < 60) return t.minutesAgo(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t.hoursAgo(hours);
  return t.daysAgo(Math.floor(hours / 24));
}

function categoryHref(cat) {
  if (cat.type === 'external') return cat.external_url;
  if (cat.type === 'blood') return '/blood';
  if (cat.type === 'info') return '/emergency';
  return `/category/${cat.slug}`;
}

export default async function HomePage() {
  const lang = getLang();
  const t = text[lang];

  const { data: banners } = await supabase
    .from('homepage_banners')
    .select('id, image_url')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  const validBanners = (banners || []).filter((b) => b.image_url);

  const { data: dbCategories } = await supabase
    .from('categories')
    .select('id, slug, type, external_url');
  const categories = (dbCategories || []).filter((c) => categoryLabels[c.slug]);

  const countable = categories.filter((c) => c.type === 'service' || c.type === 'listing');
  const counts = await Promise.all(
    countable.map(async (c) => {
      const table = c.type === 'service' ? 'providers' : 'listings';
      const statusValue = c.type === 'service' ? 'approved' : 'active';
      const { count } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('category_id', c.id)
        .eq('status', statusValue);
      return { slug: c.slug, count: count || 0 };
    })
  );
  const countMap = Object.fromEntries(counts.map((c) => [c.slug, c.count]));

  const [{ count: activeListingsCount }, { count: approvedProvidersCount }] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ]);
  const totalActiveCount = (activeListingsCount || 0) + (approvedProvidersCount || 0);

  const [{ data: recentProviders }, { data: recentListings }] = await Promise.all([
    supabase
      .from('providers')
      .select('id, name, area, photo_url, created_at, categories(slug)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('listings')
      .select('id, title, area, price_or_salary, photos, posted_at, categories(slug)')
      .eq('status', 'active')
      .gt('expiry_date', new Date().toISOString())
      .order('posted_at', { ascending: false })
      .limit(8),
  ]);

  const recentItems = [
    ...(recentProviders || []).map((p) => ({
      id: p.id, type: 'provider', title: p.name, area: p.area,
      image: p.photo_url, date: p.created_at, slug: p.categories?.slug,
    })),
    ...(recentListings || []).map((l) => ({
      id: l.id, type: 'listing', title: l.title, area: l.area, price: l.price_or_salary,
      image: l.photos?.[0] || null, date: l.posted_at, slug: l.categories?.slug,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  const providersWithRating = await Promise.all(
    (recentProviders || []).slice(0, 6).map(async (p) => {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', p.id);
      const count = reviews?.length || 0;
      const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
      return { ...p, avgRating: avg, reviewCount: count };
    })
  );

  const steps = [
    { icon: '🔍', title: t.step1Title, desc: t.step1Desc },
    { icon: '📞', title: t.step2Title, desc: t.step2Desc },
    { icon: '✅', title: t.step3Title, desc: t.step3Desc },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-green-dark to-green shadow-md">
        <div className="max-w-4xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          <a href="/" className="flex items-center gap-2 min-w-0 flex-shrink">
            <span className="flex items-center bg-white rounded-md px-2 py-1.5 flex-shrink-0">
              <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-6 w-auto" />
            </span>
            <span className="min-w-0 hidden sm:block">
              <span className="block text-white text-[11px] font-medium leading-tight truncate">{t.tagline1}</span>
              <span className="block text-white/80 text-[10px] leading-tight truncate">{t.tagline2}</span>
            </span>
          </a>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <LanguageToggle lang={lang} variant="light" />
            <HeaderBell />
            <AuthButton lang={lang} variant="light" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Hero */}
        <section className="bg-gradient-to-b from-[#1B2A4A] to-[#0F1A30] px-4 pt-4 pb-8">
          {/* Cover photo box — fixed aspect ratio, কোনো স্ক্রিনেই কাটবে না */}
          <div className="relative rounded-2xl overflow-hidden border-4 border-white/50 shadow-md aspect-[12/5] bg-[#1B2A4A]/60">
            {validBanners.length > 0 &&
              validBanners.map((b, i) => (
                <img
                  key={b.id}
                  src={b.image_url}
                  alt=""
                  className={
                    validBanners.length > 1
                      ? 'hero-banner-slide absolute inset-0 w-full h-full object-cover'
                      : 'absolute inset-0 w-full h-full object-cover'
                  }
                  style={validBanners.length > 1 ? { animationDelay: `${i * 4}s` } : undefined}
                />
              ))}

            <HeroIntro title={t.heroTitle} subtitle={t.heroSubtitle} />

            {validBanners.length > 1 && (
              <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-20">
                {validBanners.map((b, i) => (
                  <span
                    key={b.id}
                    className="hero-banner-dot h-1.5 rounded-full bg-white/50"
                    style={{ animationDelay: `${i * 4}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Search bar */}
          <form action="/search" method="GET" className="mt-4 flex bg-white rounded-full shadow-md overflow-hidden max-w-xl">
            <span className="flex items-center pl-4 text-ink/40">🔍</span>
            <input
              type="text"
              name="q"
              placeholder={t.searchPlaceholder}
              className="flex-1 bg-transparent outline-none px-3 py-3 text-sm placeholder:text-ink/40"
            />
            <button
              type="submit"
              aria-label="Search"
              className="bg-marigold text-ink w-12 flex items-center justify-center hover:bg-marigold/90 transition-colors flex-shrink-0"
            >
              🔍
            </button>
          </form>

          <div className="flex items-center gap-2 mt-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green" />
            </span>
            <span className="text-xs text-ink/70 font-medium">{t.liveCount(totalActiveCount)}</span>
          </div>
        </section>

        {validBanners.length > 1 && (
          <style>{`
            .hero-banner-slide {
              opacity: 0;
              animation: heroFade ${validBanners.length * 4}s infinite;
            }
            @keyframes heroFade {
              0% { opacity: 0; }
              5% { opacity: 1; }
              ${Math.round(100 / validBanners.length) - 5}% { opacity: 1; }
              ${Math.round(100 / validBanners.length)}% { opacity: 0; }
              100% { opacity: 0; }
            }
            .hero-banner-dot {
              width: 1.5rem;
              animation: heroDot ${validBanners.length * 4}s infinite;
            }
            @keyframes heroDot {
              0% { background-color: rgba(255,255,255,0.9); width: 1.5rem; }
              ${Math.round(100 / validBanners.length) - 2}% { background-color: rgba(255,255,255,0.9); width: 1.5rem; }
              ${Math.round(100 / validBanners.length)}% { background-color: rgba(255,255,255,0.4); width: 0.375rem; }
              100% { background-color: rgba(255,255,255,0.4); width: 0.375rem; }
            }
          `}</style>
        )}
            {validBanners.length > 0 &&
              validBanners.map((b, i) => (
                <img
                  key={b.id}
                  src={b.image_url}
                  alt=""
                  className="hero-banner-slide absolute inset-0 w-full h-full object-cover"
                  style={{ animationDelay: `${i * 4}s` }}
                />
              ))}

            <HeroIntro title={t.heroTitle} subtitle={t.heroSubtitle} />

            {validBanners.length > 1 && (
              <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-20">
                {validBanners.map((b, i) => (
                  <span
                    key={b.id}
                    className="hero-banner-dot h-1.5 rounded-full bg-white/50"
                    style={{ animationDelay: `${i * 4}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Search bar — now below the cover box */}
          <form action="/search" method="GET" className="mt-4 flex bg-white rounded-full shadow-md overflow-hidden max-w-xl">
            <span className="flex items-center pl-4 text-ink/40">🔍</span>
            <input
              type="text"
              name="q"
              placeholder={t.searchPlaceholder}
              className="flex-1 bg-transparent outline-none px-3 py-3 text-sm placeholder:text-ink/40"
            />
            <button
              type="submit"
              aria-label="Search"
              className="bg-marigold text-ink w-12 flex items-center justify-center hover:bg-marigold/90 transition-colors flex-shrink-0"
            >
              🔍
            </button>
          </form>

          <div className="flex items-center gap-2 mt-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green" />
            </span>
            <span className="text-xs text-ink/70 font-medium">{t.liveCount(totalActiveCount)}</span>
          </div>
        </section>

        {validBanners.length > 0 && (
          <style>{`
            .hero-banner-slide {
              opacity: 0;
              animation: heroFade ${validBanners.length * 4}s infinite;
            }
            @keyframes heroFade {
              0% { opacity: 0; }
              5% { opacity: 1; }
              ${Math.round(100 / validBanners.length) - 5}% { opacity: 1; }
              ${Math.round(100 / validBanners.length)}% { opacity: 0; }
              100% { opacity: 0; }
            }
            .hero-banner-dot {
              width: 1.5rem;
              animation: heroDot ${validBanners.length * 4}s infinite;
            }
            @keyframes heroDot {
              0% { background-color: rgba(255,255,255,0.9); width: 1.5rem; }
              ${Math.round(100 / validBanners.length) - 2}% { background-color: rgba(255,255,255,0.9); width: 1.5rem; }
              ${Math.round(100 / validBanners.length)}% { background-color: rgba(255,255,255,0.4); width: 0.375rem; }
              100% { background-color: rgba(255,255,255,0.4); width: 0.375rem; }
            }
          `}</style>
        )}

        {/* Category Grid */}
        <section id="categories" className="px-4 pt-4 pb-10 scroll-mt-20">
          <div className="grid grid-cols-3 gap-2.5">
            {categories.map((c) => {
              const label = categoryLabels[c.slug];
              const count = countMap[c.slug] || 0;
              const isExternal = c.type === 'external';
              return (
                <a
                  key={c.slug}
                  href={categoryHref(c)}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="bg-white rounded-xl border border-ink/10 p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg text-white ${label.iconBg}`}>
                      {label.icon}
                    </span>
                    {isExternal ? (
                      <span className="text-xs text-ink/30">↗</span>
                    ) : count > 0 ? (
                      <span className="text-[10px] bg-paper text-ink/50 px-1.5 py-0.5 rounded-full font-numeric">{count}</span>
                    ) : null}
                  </div>
                  <p className="font-medium text-sm mt-2 leading-tight">{label[lang].name}</p>
                </a>
              );
            })}
          </div>
        </section>

        {/* Recent Posts */}
        {recentItems.length > 0 && (
          <section className="pb-10">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="text-lg font-semibold">🔥 {t.recentTitle}</h2>
              <a href="/search" className="text-sm text-green font-medium">{t.seeAll}</a>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 px-4 snap-x snap-mandatory scrollbar-hide">
              {recentItems.map((item) => {
                const label = categoryLabels[item.slug];
                const href = item.type === 'provider' ? `/provider/${item.id}` : `/listing/${item.id}`;
                return (
                  <a
                    key={`${item.type}-${item.id}`}
                    href={href}
                    className="flex-shrink-0 w-36 snap-start bg-white rounded-xl border border-ink/10 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-24 bg-paper flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl opacity-30">{label?.icon || '📍'}</span>
                      )}
                      {label && (
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/90 text-ink/70">
                          {label[lang].name}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-ink/50 mt-1">📍 {item.area}</p>
                      {item.price && <p className="text-xs text-green font-numeric font-medium mt-1">{item.price}</p>}
                      <p className="text-[9px] text-ink/30 mt-1">{timeAgo(item.date, t)}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="px-4 pb-10">
          <div className="bg-green/5 border border-green/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t.howTitle}</h2>
            </div>
            <div className="flex items-start justify-between gap-1">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="relative">
                      <span className="w-12 h-12 rounded-full bg-green text-white flex items-center justify-center text-lg">
                        {step.icon}
                      </span>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-marigold text-ink text-[10px] font-bold flex items-center justify-center font-numeric">
                        {i + 1}
                      </span>
                    </div>
                    <p className="font-medium text-xs mt-2">{step.title}</p>
                    <p className="text-[10px] text-ink/60 mt-1 leading-snug px-1">{step.desc}</p>
                  </div>
                  {i < steps.length - 1 && <span className="text-ink/20 text-lg px-0.5">›</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Service Providers */}
        {providersWithRating.length > 0 && (
          <section className="pb-10">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="text-lg font-semibold">{t.providersTitle}</h2>
              <a href="/search" className="text-sm text-green font-medium">{t.seeAll}</a>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 px-4 snap-x snap-mandatory scrollbar-hide">
              {providersWithRating.map((p) => {
                const label = categoryLabels[p.categories?.slug];
                return (
                  <a
                    key={p.id}
                    href={`/provider/${p.id}`}
                    className="flex-shrink-0 w-44 snap-start bg-white rounded-xl border border-ink/10 p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-paper flex items-center justify-center text-sm text-ink/30 flex-shrink-0">
                          {p.name?.charAt(0)}
                        </div>
                      )}
                      <span className="text-blue-500 text-xs flex-shrink-0" title="Verified">✓</span>
                    </div>
                    <p className="text-sm font-medium mt-2 line-clamp-1">{p.name}</p>
                    <p className="text-[10px] text-ink/50 mt-0.5 line-clamp-1">
                      {label ? label[lang].name : ''} · {p.area}
                    </p>
                    {p.reviewCount > 0 && (
                      <p className="text-[10px] text-marigold mt-1 font-numeric">
                        ⭐ {p.avgRating.toFixed(1)} ({p.reviewCount} {t.reviews})
                      </p>
                    )}
                  </a>
                );
              })}
            </div>
          </section>
        )}

        <footer className="border-t border-ink/10 py-6 px-4 text-sm text-ink/60 flex flex-col items-center gap-2 mb-16 md:mb-0">
          <div className="flex gap-4 flex-wrap justify-center">
            <a href="/terms" className="hover:text-ink">{t.terms}</a>
            <a href="/privacy" className="hover:text-ink">{t.privacy}</a>
            <a href="/disclaimer" className="hover:text-ink">{t.disclaimer}</a>
          </div>
          <p>{t.footer}</p>
          <a
            href="https://www.facebook.com/share/1CDYwoqn57/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ink/40 hover:text-ink"
          >
            {t.credit}
          </a>
        </footer>
      </main>

      <BottomNav activeTab="home" />
    </div>
  );
}
