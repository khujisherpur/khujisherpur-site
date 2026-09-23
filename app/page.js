export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../lib/supabaseClient';
import { getLang } from '../lib/getLang';
import { categoryLabels } from '../lib/categoryLabels';
import LanguageToggle from '../components/LanguageToggle';
import AuthButton from '../components/AuthButton';
import BottomNav from '../components/BottomNav';

const text = {
  bn: {
    heroTitle: 'শেরপুরে যা খুঁজছেন, এক জায়গায় খুঁজে নিন',
    heroSub: 'বাসা ভাড়া, চাকরি, নাকি বিশ্বস্ত মিস্ত্রি — যা দরকার সবই পাবেন এখানে।',
    searchPlaceholder: 'যেমন: বাসা ভাড়া, ইলেকট্রিশিয়ান...',
    searchButton: 'খুঁজুন',
    liveStats: (n) => `শেরপুরে এখন ${n}টি সক্রিয় পোস্ট ও প্রোফাইল`,
    whatLooking: 'কী খুঁজছেন?',
    postAd: '+ পোস্ট দিন',
    recentTitle: 'সাম্প্রতিক পোস্ট',
    howTitle: 'কীভাবে কাজ করে',
    step1Title: 'খুঁজুন', step1Desc: 'ক্যাটাগরি বা সার্চ দিয়ে যা দরকার তা খুঁজে বের করুন',
    step2Title: 'যোগাযোগ করুন', step2Desc: 'সরাসরি ফোনে কল করে কথা বলুন',
    step3Title: 'কাজ সেরে নিন', step3Desc: 'নিজে দেখে-শুনে নিশ্চিত হয়ে সিদ্ধান্ত নিন',
    terms: 'শর্তাবলি', privacy: 'প্রাইভেসি পলিসি', disclaimer: 'দায়বদ্ধতা',
    footer: '© ২০২৬ খুঁজি শেরপুর', credit: 'Developed by ASRAFUL',
    justNow: 'এইমাত্র', minutesAgo: (n) => `${n} মিনিট আগে`, hoursAgo: (n) => `${n} ঘণ্টা আগে`, daysAgo: (n) => `${n} দিন আগে`,
  },
  en: {
    heroTitle: 'Find what you\u2019re looking for in Sherpur, all in one place',
    heroSub: 'House rent, jobs, or a trusted repairman — get everything you need here.',
    searchPlaceholder: 'e.g. house rent, electrician...',
    searchButton: 'Search',
    liveStats: (n) => `${n} active posts & profiles in Sherpur right now`,
    whatLooking: 'What are you looking for?',
    postAd: '+ Post Ad',
    recentTitle: 'Recent Posts',
    howTitle: 'How It Works',
    step1Title: 'Search', step1Desc: 'Use categories or search to find what you need',
    step2Title: 'Contact', step2Desc: 'Call directly and talk to them',
    step3Title: 'Get It Done', step3Desc: 'Verify in person and make your decision',
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

  const { data: dbCategories } = await supabase
    .from('categories')
    .select('id, slug, type, external_url');
  const categories = (dbCategories || []).filter((c) => categoryLabels[c.slug]);

  // শুধু service/listing টাইপের জন্য কাউন্ট গণনা করা
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
  const totalActive = counts.reduce((s, c) => s + c.count, 0);

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
      .limit(6),
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
    .slice(0, 6);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-green-dark to-green shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center bg-white rounded-md px-2.5 py-1.5 flex-shrink-0">
            <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-7 w-auto" />
          </a>
          <div className="flex items-center gap-3">
            <LanguageToggle lang={lang} variant="light" />
            <AuthButton lang={lang} variant="light" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        <section className="py-10 md:py-16">
          <h1 className="text-3xl md:text-5xl font-semibold leading-tight text-ink max-w-xl">
            {t.heroTitle}
          </h1>
          <p className="mt-4 text-ink/70 max-w-md">{t.heroSub}</p>

          <form action="/search" method="GET" className="mt-8 flex gap-2 max-w-xl bg-white border-2 border-ink/10 p-2">
            <input
              type="text"
              name="q"
              placeholder={t.searchPlaceholder}
              className="flex-1 bg-transparent outline-none px-3 py-2 text-base placeholder:text-ink/40"
            />
            <button
              type="submit"
              className="bg-marigold text-ink font-semibold px-5 py-2 hover:bg-marigold/90 transition-colors"
            >
              {t.searchButton}
            </button>
          </form>

          {totalActive > 0 && (
            <p className="mt-4 text-sm text-ink/50 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green rounded-full inline-block animate-pulse" />
              {t.liveStats(totalActive)}
            </p>
          )}
        </section>

        <section id="categories" className="pb-16 scroll-mt-20">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-semibold">{t.whatLooking}</h2>
            <a
              href="#categories"
              className="text-sm bg-marigold text-ink font-semibold rounded-full px-4 py-1.5 hover:bg-marigold/90 transition-colors"
            >
              {t.postAd}
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  className={`group block bg-white p-4 border-l-4 hover:shadow-md transition-shadow ${label.color}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{label.icon}</span>
                    {count > 0 && (
                      <span className="text-xs bg-paper text-ink/50 px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                    {isExternal && <span className="text-xs text-ink/30">↗</span>}
                  </div>
                  <p className="font-medium mt-2 group-hover:text-green transition-colors">
                    {label[lang].name}
                  </p>
                  <p className="text-sm text-ink/60 mt-1">{label[lang].desc}</p>
                </a>
              );
            })}
          </div>
        </section>

        {recentItems.length > 0 && (
          <section className="pb-16">
            <h2 className="text-xl font-semibold mb-4">{t.recentTitle}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {recentItems.map((item) => {
                const label = categoryLabels[item.slug];
                const href = item.type === 'provider' ? `/provider/${item.id}` : `/listing/${item.id}`;
                return (
                  <a
                    key={`${item.type}-${item.id}`}
                    href={href}
                    className="group block bg-white border border-ink/10 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-24 bg-paper flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl opacity-30">{label?.icon || '📍'}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-ink/40">{label ? label[lang].name : ''}</p>
                      <p className="font-medium text-sm mt-0.5 line-clamp-1 group-hover:text-green transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-ink/50 mt-1">{item.area}</p>
                      {item.price && <p className="text-xs text-green font-numeric mt-1">{item.price}</p>}
                      <p className="text-[10px] text-ink/30 mt-1">{timeAgo(item.date, t)}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        <section className="pb-16">
          <h2 className="text-xl font-semibold mb-6">{t.howTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🔍', title: t.step1Title, desc: t.step1Desc },
              { icon: '📞', title: t.step2Title, desc: t.step2Desc },
              { icon: '✅', title: t.step3Title, desc: t.step3Desc },
            ].map((step, i) => (
              <div key={i} className="bg-white border border-ink/10 p-5 text-center">
                <span className="text-3xl">{step.icon}</span>
                <p className="font-medium mt-3">{step.title}</p>
                <p className="text-sm text-ink/60 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-ink/10 py-6 text-sm text-ink/60 flex flex-col items-center gap-2">
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
      <div className="h-16 md:hidden" />
    </div>
  );
}
