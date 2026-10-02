export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../lib/supabaseClient';
import { getLang } from '../../lib/getLang';
import { categoryLabels } from '../../lib/categoryLabels';
import { formatPrice, timeAgo, toBn } from '../../lib/format';
import { getServicesFor, providerHref } from '../../lib/services';
import SiteHeader from '../../components/SiteHeader';
import BottomNav from '../../components/BottomNav';
import LocationFilter from '../../components/LocationFilter';
import SaveSearchButton from '../../components/SaveSearchButton';

const text = {
  bn: {
    placeholder: 'যেমন: বাসা ভাড়া, ইলেকট্রিশিয়ান...', search: 'খুঁজুন',
    browseTitle: 'সাম্প্রতিক সব পোস্ট ও প্রোফাইল',
    noResults: 'কোনো ফলাফল পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।',
    noneYet: 'এখনো কোনো পোস্ট নেই।',
    foundFor: 'এর জন্য', results: 'টি ফলাফল পাওয়া গেছে', inArea: 'এলাকায়',
  },
  en: {
    placeholder: 'e.g. house rent, electrician...', search: 'Search',
    browseTitle: 'All recent posts & profiles',
    noResults: 'No results found. Try a different word.',
    noneYet: 'No posts yet.',
    foundFor: 'results found for', results: '', inArea: 'in',
  },
};

export default async function SearchPage({ searchParams }) {
  const lang = getLang();
  const t = text[lang];
  const num = (n) => (lang === 'bn' ? toBn(n) : n);
  const query = searchParams?.q?.trim() || '';
  const upazila = searchParams?.upazila || '';
  const unionName = searchParams?.union || '';
  const hasSearch = !!(query || upazila);
  const LIMIT = hasSearch ? 100 : 40;

  let providersQuery = supabase
    .from('providers')
    .select('id, name, slug, area, upazila, union_name, photo_url, created_at, primary_subcategory_id, categories(slug)')
    .eq('status', 'approved');
  let listingsQuery = supabase
    .from('listings')
    .select('id, title, area, upazila, union_name, price_or_salary, photos, posted_at, categories(slug)')
    .eq('status', 'active')
    .gt('expiry_date', new Date().toISOString());

  if (query) {
    const { data: matchedCategories } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', `%${query}%`);
    const categoryIds = (matchedCategories || []).map((c) => c.id);
    const categoryFilter = categoryIds.length > 0 ? `,category_id.in.(${categoryIds.join(',')})` : '';

    providersQuery = providersQuery.or(`name.ilike.%${query}%,area.ilike.%${query}%${categoryFilter}`);
    listingsQuery = listingsQuery.or(`title.ilike.%${query}%,area.ilike.%${query}%${categoryFilter}`);
  }
  if (upazila) {
    providersQuery = providersQuery.eq('upazila', upazila);
    listingsQuery = listingsQuery.eq('upazila', upazila);
  }
  if (unionName) {
    providersQuery = providersQuery.eq('union_name', unionName);
    listingsQuery = listingsQuery.eq('union_name', unionName);
  }

  const [{ data: p }, { data: l }] = await Promise.all([
    providersQuery.order('created_at', { ascending: false }).limit(LIMIT),
    listingsQuery.order('posted_at', { ascending: false }).limit(LIMIT),
  ]);

  const svc = await getServicesFor(p || [], lang);

  const items = [
    ...(p || []).map((x) => {
      const first = svc[x.id]?.[0];
      return {
        type: 'provider', id: x.id, title: x.name, area: x.area, upazila: x.upazila,
        image: x.photo_url, date: x.created_at, slug: x.categories?.slug,
        badge: first ? `${first.icon} ${first.label}` : categoryLabels[x.categories?.slug]?.[lang].name || '',
        href: providerHref(x, svc[x.id]),
      };
    }),
    ...(l || []).map((x) => ({
      type: 'listing', id: x.id, title: x.title, area: x.area, upazila: x.upazila,
      price: x.price_or_salary, image: x.photos?.[0] || null, date: x.posted_at, slug: x.categories?.slug,
      badge: categoryLabels[x.categories?.slug]?.[lang].name || '', href: `/listing/${x.id}`,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="max-w-4xl mx-auto px-4">
        <div className="py-5">
          <div className="flex gap-2 max-w-xl flex-wrap">
            <form action="/search" method="GET" className="flex-1 min-w-[200px] flex gap-2 bg-white border-2 border-green/30 rounded-xl p-2">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder={t.placeholder}
                className="flex-1 bg-transparent outline-none px-3 py-2 text-base placeholder:text-ink/40"
              />
              <button
                type="submit"
                className="bg-marigold text-ink font-semibold px-5 py-2 rounded-lg hover:bg-marigold/90 transition-colors"
              >
                {t.search}
              </button>
            </form>
            <LocationFilter lang={lang} currentQuery={query} currentUpazila={upazila} currentUnion={unionName} />
          </div>

          {hasSearch ? (
            <>
              <p className="text-sm text-ink/60 mt-4">
                {query && <>"<span className="font-medium text-ink">{query}</span>" {t.foundFor} </>}
                {num(items.length)} {t.results}
                {upazila && <> · {t.inArea} {unionName || upazila}</>}
              </p>
              <SaveSearchButton lang={lang} query={query} upazila={upazila} union={unionName} />
            </>
          ) : (
            <h1 className="text-lg font-semibold mt-5">
              🔥 {t.browseTitle}
              <span className="text-ink/40 font-normal text-sm ml-2">({num(items.length)})</span>
            </h1>
          )}
        </div>

        <section className="pb-16 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">{hasSearch ? '🔎' : '📭'}</p>
              <p className="text-ink/55 text-sm">{hasSearch ? t.noResults : t.noneYet}</p>
            </div>
          )}

          {items.map((item) => {
            const label = categoryLabels[item.slug];
            const isProvider = item.type === 'provider';
            return (
              <a
                key={`${item.type}-${item.id}`}
                href={item.href}
                className={`flex gap-3 bg-white rounded-xl p-3 border-l-4 ${
                  isProvider ? 'border-l-green' : 'border-l-marigold'
                } border-t border-r border-b border-ink/10 hover:shadow-md transition-shadow`}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className={`w-20 h-20 object-cover flex-shrink-0 ${isProvider ? 'rounded-full' : 'rounded-lg'}`}
                  />
                ) : (
                  <span
                    className={`w-20 h-20 bg-[#EEF1F8] flex items-center justify-center text-2xl flex-shrink-0 ${
                      isProvider ? 'rounded-full text-green-dark font-semibold' : 'rounded-lg opacity-70'
                    }`}
                  >
                    {isProvider ? item.title?.charAt(0) : label?.icon || '📄'}
                  </span>
                )}
                <div className="min-w-0 flex-1 flex flex-col">
                  <p className={`text-[11px] font-medium ${isProvider ? 'text-green' : 'text-marigold'}`}>
                    {item.badge}
                  </p>
                  <p className="font-medium leading-snug line-clamp-2 mt-0.5">{item.title}</p>
                  <p className="text-xs text-ink/55 mt-1 truncate">
                    📍 {item.area}
                    {item.upazila && item.upazila !== item.area ? `, ${item.upazila}` : ''}
                  </p>
                  <div className="flex items-end justify-between mt-auto pt-1">
                    <p className="text-green font-semibold font-numeric">
                      {item.price ? formatPrice(item.price, lang) : ''}
                    </p>
                    <p className="text-[10px] text-ink/40">{timeAgo(item.date, lang)}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </section>

        <BottomNav activeTab="search" />
        <div className="h-16 md:hidden" />
      </main>
    </>
  );
}
