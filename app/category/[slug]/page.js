export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { redirect, notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { getLang } from '../../../lib/getLang';
import { categoryLabels } from '../../../lib/categoryLabels';
import { upazilaList } from '../../../lib/locations';
import { formatPrice, parsePrice, timeAgo, toBn } from '../../../lib/format';
import { subcategoryIcons } from '../../../lib/services';
import { SITE_NAME, DEFAULT_OG_IMAGE } from '../../../lib/site';
import SiteHeader from '../../../components/SiteHeader';

const FILTER_KEYS = ['type', 'upazila', 'sort', 'sub'];

export function generateMetadata({ params, searchParams }) {
  const lang = getLang();
  const label = categoryLabels[params.slug];
  if (!label) return { title: 'খুঁজি শেরপুর', robots: { index: false } };

  const name = label[lang].name;
  const title =
    lang === 'bn' ? `শেরপুরে ${name} | খুঁজি শেরপুর` : `${name} in Sherpur | Khuji Sherpur`;
  const description = label[lang].desc || title;

  // শুধু আসল ফিল্টার থাকলেই noindex; ?fbclid= বা ?utm_ দিয়ে এলে নয়
  const hasFilter = FILTER_KEYS.some((k) => searchParams?.[k]);
  const canonical = `/category/${params.slug}`;

  return {
    title,
    description,
    ...(hasFilter
      ? { robots: { index: false, follow: true } }
      : { alternates: { canonical } }),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: lang === 'bn' ? 'bn_BD' : 'en_US',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description, images: [DEFAULT_OG_IMAGE] },
  };
}

const text = {
  bn: {
    home: '← হোমপেজ',
    addProfile: '+ প্রোফাইল যুক্ত করুন', addPost: '+ পোস্ট দিন',
    noProvider: 'এখনো কোনো প্রোভাইডার নেই।',
    noListing: 'এখনো কোনো পোস্ট নেই।',
    beFirst: 'প্রথমটা আপনিই যোগ করুন!',
    noMatch: 'এই ফিল্টারে কিছু পাওয়া যায়নি।',
    clearFilters: 'ফিল্টার মুছুন',
    unavailable: 'অনুপলব্ধ',
    all: 'সব', house: 'বাসা', shop: 'দোকান', mess: 'মেস', other: 'অন্যান্য',
    allAreas: 'সব উপজেলা',
    whichService: 'কোন সেবা খুঁজছেন?',
    sortNew: 'নতুন আগে', sortLow: 'কম দাম', sortHigh: 'বেশি দাম',
    profilesWord: 'টি প্রোফাইল', postsWord: 'টি পোস্ট',
    exp: 'বছর অভিজ্ঞতা',
  },
  en: {
    home: '← Home',
    addProfile: '+ Add Profile', addPost: '+ Post',
    noProvider: 'No providers yet.',
    noListing: 'No posts yet.',
    beFirst: 'Be the first to add one!',
    noMatch: 'Nothing found with these filters.',
    clearFilters: 'Clear filters',
    unavailable: 'Unavailable',
    all: 'All', house: 'House', shop: 'Shop', mess: 'Mess', other: 'Other',
    allAreas: 'All areas',
    whichService: 'Which service are you looking for?',
    sortNew: 'Newest', sortLow: 'Price: low', sortHigh: 'Price: high',
    profilesWord: ' profiles', postsWord: ' posts',
    exp: 'yrs experience',
  },
};

const rentTypeTabs = ['house', 'shop', 'mess', 'other'];

function buildHref(base, params, overrides = {}) {
  const merged = { ...params, ...overrides };
  const qs = Object.entries(merged)
    .filter(([, v]) => v && v !== 'all' && v !== 'new')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `${base}?${qs}` : base;
}

function Chip({ href, active, children }) {
  return (
    <a
      href={href}
      className={`text-sm px-4 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 border transition-colors ${
        active ? 'bg-green text-white border-green' : 'bg-white border-ink/15 text-ink/65'
      }`}
    >
      {children}
    </a>
  );
}

export default async function CategoryPage({ params, searchParams }) {
  const lang = getLang();
  const t = text[lang];
  const num = (n) => (lang === 'bn' ? toBn(n) : n);
  const label = categoryLabels[params.slug];
  // অদ্ভুত মান ডাটাবেসে পাঠানো হয় না, জানা মানগুলোই চলে
  const activeRentType = rentTypeTabs.includes(searchParams?.type) ? searchParams.type : 'all';
  const activeSub = searchParams?.sub || null;
  const activeUpazila = upazilaList.includes(searchParams?.upazila) ? searchParams.upazila : '';
  const sort = ['low', 'high'].includes(searchParams?.sort) ? searchParams.sort : 'new';

  if (!label) notFound();

  const { data: category } = await supabase
    .from('categories')
    .select('id, slug, type')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!category) notFound();

  const isService = category.type === 'service';
  const isRent = category.slug === 'rent';
  const isServiceProvider = category.slug === 'service-provider';
  const name = label[lang].name;

  // পুরোনো লিংক (?sub=electrician) নতুন তালিকায় নিয়ে যাই (শুধু নিরাপদ slug হলে)
  if (isServiceProvider && activeSub) {
    if (/^[a-z0-9-]+$/.test(activeSub)) {
      redirect(`/${activeSub}`);
    }
    redirect('/category/service-provider');
  }

  // সেবাদাতা: সাব-ক্যাটাগরি বাছাইয়ের পেজ
  if (isServiceProvider) {
    const [{ data: subcats }, { data: links }, { data: approved }] = await Promise.all([
      supabase
        .from('subcategories')
        .select('id, slug, name_bn, name_en')
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase.from('provider_subcategories').select('provider_id, subcategory_id'),
      supabase.from('providers').select('id, primary_subcategory_id').eq('status', 'approved'),
    ]);

    const approvedIds = new Set((approved || []).map((p) => p.id));
    const perSub = {};
    const seen = new Set();
    const add = (subId, pid) => {
      const key = `${subId}:${pid}`;
      if (seen.has(key)) return;
      seen.add(key);
      perSub[subId] = (perSub[subId] || 0) + 1;
    };
    (links || []).forEach((l) => approvedIds.has(l.provider_id) && add(l.subcategory_id, l.provider_id));
    (approved || []).forEach((p) => p.primary_subcategory_id && add(p.primary_subcategory_id, p.id));

    return (
      <>
        <SiteHeader lang={lang} />
        <main className="max-w-4xl mx-auto px-4">
          <div className="py-6">
            <a href="/" className="text-sm text-ink/50 hover:text-ink">{t.home}</a>
            <div className="flex items-center gap-3 mt-3">
              <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#EEF1F8]">{label.icon}</span>
              <h1 className="text-2xl md:text-3xl font-semibold">{name}</h1>
            </div>
            <p className="text-ink/60 text-sm mt-2">{t.whichService}</p>
          </div>

          <section className="pb-16 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {(subcats || []).map((s) => (
              <a
                key={s.id}
                href={`/${s.slug}`}
                className="bg-white rounded-xl border border-ink/10 border-b-4 border-b-green p-3 hover:shadow-md transition-shadow text-center"
              >
                <span className="w-11 h-11 mx-auto rounded-lg flex items-center justify-center text-xl bg-[#EEF1F8]">
                  {subcategoryIcons[s.slug] || '🛠️'}
                </span>
                <p className="font-medium text-xs mt-2 leading-tight">
                  {lang === 'bn' ? s.name_bn : s.name_en || s.name_bn}
                </p>
                {perSub[s.id] > 0 && (
                  <p className="text-[10px] text-ink/40 mt-0.5 font-numeric">{num(perSub[s.id])}</p>
                )}
              </a>
            ))}
          </section>
        </main>
      </>
    );
  }

  let items = [];

  if (isService) {
    let query = supabase
      .from('providers')
      .select('id, name, slug, area, upazila, is_available, photo_url, experience_years, is_verified')
      .eq('category_id', category.id)
      .eq('status', 'approved');
    if (activeUpazila) query = query.eq('upazila', activeUpazila);

    const { data } = await query.order('created_at', { ascending: false }).limit(200);
    items = data || [];
  } else {
    let query = supabase
      .from('listings')
      .select('id, title, area, upazila, price_or_salary, rent_type, photos, posted_at')
      .eq('category_id', category.id)
      .eq('status', 'active')
      .gt('expiry_date', new Date().toISOString());

    if (isRent && activeRentType !== 'all') query = query.eq('rent_type', activeRentType);
    if (activeUpazila) query = query.eq('upazila', activeUpazila);

    const { data } = await query.order('posted_at', { ascending: false }).limit(200);
    items = data || [];

    if (sort === 'low' || sort === 'high') {
      items = [...items].sort((a, b) => {
        const pa = parsePrice(a.price_or_salary);
        const pb = parsePrice(b.price_or_salary);
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return sort === 'low' ? pa - pb : pb - pa;
      });
    }
  }

  const base = `/category/${category.slug}`;
  const baseParams = { type: isRent ? activeRentType : '', upazila: activeUpazila, sort };
  const hasFilter = !!activeUpazila || (isRent && activeRentType !== 'all') || sort !== 'new';
  const clearHref = base;
  const postHref = `/post/new?category=${category.slug}`;

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="max-w-4xl mx-auto px-4">
        <div className="pt-5 pb-4">
          <a href="/" className="text-sm text-ink/50 hover:text-ink">{t.home}</a>

          <div className="flex items-center gap-3 mt-3">
            <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#EEF1F8] flex-shrink-0">
              {label.icon}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-semibold leading-tight truncate">{name}</h1>
              <p className="text-xs text-ink/50 mt-0.5">
                {num(items.length)}
                {isService ? t.profilesWord : t.postsWord}
              </p>
            </div>
            <a
              href={postHref}
              className="bg-marigold text-ink font-semibold text-sm px-4 py-2.5 rounded-full flex-shrink-0 whitespace-nowrap"
            >
              {isService ? t.addProfile : t.addPost}
            </a>
          </div>
        </div>

        {/* ফিল্টার */}
        <div className="space-y-2 mb-4">
          {isRent && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <Chip href={buildHref(base, baseParams, { type: 'all' })} active={activeRentType === 'all'}>
                {t.all}
              </Chip>
              {rentTypeTabs.map((rt) => (
                <Chip key={rt} href={buildHref(base, baseParams, { type: rt })} active={activeRentType === rt}>
                  {t[rt]}
                </Chip>
              ))}
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Chip href={buildHref(base, baseParams, { upazila: '' })} active={!activeUpazila}>
              📍 {t.allAreas}
            </Chip>
            {upazilaList.map((u) => (
              <Chip key={u} href={buildHref(base, baseParams, { upazila: u })} active={activeUpazila === u}>
                {u}
              </Chip>
            ))}
          </div>

          {!isService && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {[
                ['new', t.sortNew],
                ['low', t.sortLow],
                ['high', t.sortHigh],
              ].map(([key, lbl]) => (
                <a
                  key={key}
                  href={buildHref(base, baseParams, { sort: key })}
                  className={`text-xs px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                    sort === key ? 'bg-ink text-white' : 'text-ink/55 bg-ink/5'
                  }`}
                >
                  {lbl}
                </a>
              ))}
            </div>
          )}
        </div>

        <section className="pb-16 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">{hasFilter ? '🔎' : '📭'}</p>
              <p className="text-ink/55 text-sm">
                {hasFilter ? t.noMatch : isService ? t.noProvider : t.noListing}
              </p>
              {hasFilter ? (
                <a href={clearHref} className="inline-block mt-4 text-green underline text-sm">
                  {t.clearFilters}
                </a>
              ) : (
                <>
                  <p className="text-ink/45 text-xs mt-1">{t.beFirst}</p>
                  <a
                    href={postHref}
                    className="inline-block mt-4 bg-marigold text-ink font-semibold text-sm px-6 py-2.5 rounded-full"
                  >
                    {isService ? t.addProfile : t.addPost}
                  </a>
                </>
              )}
            </div>
          )}

          {isService
            ? items.map((p) => (
                <a
                  key={p.id}
                  href={`/provider/${p.id}`}
                  className="flex gap-3 bg-white rounded-xl p-3 border-l-4 border-l-green border-t border-r border-b border-ink/10 hover:shadow-md transition-shadow"
                >
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name || ''} loading="lazy" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-16 h-16 rounded-full bg-[#EEF1F8] text-green-dark text-xl font-semibold flex items-center justify-center flex-shrink-0">
                      {p.name?.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1 self-center">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium leading-tight truncate">{p.name}</p>
                      {p.is_verified && (
                        <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center flex-shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink/60 mt-0.5 truncate">
                      📍 {p.area}
                      {p.upazila && p.upazila !== p.area ? `, ${p.upazila}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {p.experience_years ? (
                        <span className="text-[11px] text-ink/50">
                          🛠️ {num(p.experience_years)} {t.exp}
                        </span>
                      ) : null}
                      {!p.is_available && (
                        <span className="text-[11px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          {t.unavailable}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))
            : items.map((l) => (
                <a
                  key={l.id}
                  href={`/listing/${l.id}`}
                  className="flex gap-3 bg-white rounded-xl p-3 border-l-4 border-l-marigold border-t border-r border-b border-ink/10 hover:shadow-md transition-shadow"
                >
                  {l.photos?.[0] ? (
                    <img src={l.photos[0]} alt={l.title || ''} loading="lazy" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-24 h-24 rounded-lg bg-[#EEF1F8] flex items-center justify-center text-3xl opacity-70 flex-shrink-0">
                      {label.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1 flex flex-col">
                    {isRent && l.rent_type && (
                      <span className="self-start text-[10px] bg-[#EEF1F8] text-ink/60 px-2 py-0.5 rounded-full mb-1">
                        {t[l.rent_type] || l.rent_type}
                      </span>
                    )}
                    <p className="font-medium leading-snug line-clamp-2">{l.title}</p>
                    <p className="text-xs text-ink/55 mt-1 truncate">
                      📍 {l.area}
                      {l.upazila && l.upazila !== l.area ? `, ${l.upazila}` : ''}
                    </p>
                    <div className="flex items-end justify-between mt-auto pt-1">
                      <p className="text-green font-semibold font-numeric">{formatPrice(l.price_or_salary, lang)}</p>
                      <p className="text-[10px] text-ink/40">{timeAgo(l.posted_at, lang)}</p>
                    </div>
                  </div>
                </a>
              ))}
        </section>
      </main>
    </>
  );
}
