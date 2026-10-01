export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../lib/supabaseClient';
import { getLang } from '../../lib/getLang';
import { categoryLabels } from '../../lib/categoryLabels';
import SiteHeader from '../../components/SiteHeader';
import BottomNav from '../../components/BottomNav';
import LocationFilter from '../../components/LocationFilter';
import SaveSearchButton from '../../components/SaveSearchButton';

const text = {
  bn: {
    placeholder: 'যেমন: বাসা ভাড়া, ইলেকট্রিশিয়ান...', search: 'খুঁজুন',
    prompt: 'কিছু খুঁজতে উপরের বক্সে লিখুন অথবা এলাকা বাছাই করুন।',
    noResults: 'কোনো ফলাফল পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।',
    foundFor: 'এর জন্য', results: 'টি ফলাফল পাওয়া গেছে', inArea: 'এলাকায়',
  },
  en: {
    placeholder: 'e.g. house rent, electrician...', search: 'Search',
    prompt: 'Type something above or select an area to search.',
    noResults: 'No results found. Try a different word.',
    foundFor: 'results found for', results: '', inArea: 'in',
  },
};

export default async function SearchPage({ searchParams }) {
  const lang = getLang();
  const t = text[lang];
  const query = searchParams?.q?.trim() || '';
  const upazila = searchParams?.upazila || '';
  const unionName = searchParams?.union || '';

  let providers = [];
  let listings = [];

  if (query || upazila) {
    let providersQuery = supabase
      .from('providers')
      .select('id, name, area, upazila, union_name, categories(slug)')
      .eq('status', 'approved');
    let listingsQuery = supabase
      .from('listings')
      .select('id, title, area, upazila, union_name, price_or_salary, categories(slug)')
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

    const [{ data: p }, { data: l }] = await Promise.all([providersQuery, listingsQuery]);
    providers = p || [];
    listings = l || [];
  }

  const totalResults = providers.length + listings.length;
  const hasSearch = !!(query || upazila);

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="max-w-4xl mx-auto px-4">
        <div className="py-6">
          <div className="flex gap-2 max-w-xl flex-wrap">
            <form action="/search" method="GET" className="flex-1 min-w-[200px] flex gap-2 bg-white border-2 border-green/30 p-2">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder={t.placeholder}
                className="flex-1 bg-transparent outline-none px-3 py-2 text-base placeholder:text-ink/40"
              />
              <button
                type="submit"
                className="bg-marigold text-ink font-semibold px-5 py-2 hover:bg-marigold/90 transition-colors"
              >
                {t.search}
              </button>
            </form>
            <LocationFilter lang={lang} currentQuery={query} currentUpazila={upazila} currentUnion={unionName} />
          </div>

          {hasSearch && (
            <>
              <p className="text-sm text-ink/60 mt-4">
                {query && <>"<span className="font-medium text-ink">{query}</span>" {t.foundFor} </>}
                {totalResults} {t.results}
                {upazila && <> · {t.inArea} {unionName || upazila}</>}
              </p>
              <SaveSearchButton lang={lang} query={query} upazila={upazila} union={unionName} />
            </>
          )}
        </div>

        <section className="pb-16 space-y-3">
          {!hasSearch && <p className="text-ink/50 text-sm py-10 text-center">{t.prompt}</p>}
          {hasSearch && totalResults === 0 && (
            <p className="text-ink/50 text-sm py-10 text-center">{t.noResults}</p>
          )}

          {providers.map((p) => {
            const label = categoryLabels[p.categories?.slug];
            return (
              <a key={`provider-${p.id}`} href={`/provider/${p.id}`} className="block bg-white p-4 border border-ink/10 border-l-4 border-l-green hover:shadow-md transition-shadow">
                <p className="text-xs text-green font-medium">{label ? label[lang].name : ''}</p>
                <p className="font-medium mt-1">{p.name}</p>
                <p className="text-sm text-ink/60 mt-1">{p.area}{p.upazila ? ` · ${p.upazila}` : ''}</p>
              </a>
            );
          })}

          {listings.map((l) => {
            const label = categoryLabels[l.categories?.slug];
            return (
              <a key={`listing-${l.id}`} href={`/listing/${l.id}`} className="block bg-white p-4 border border-ink/10 border-l-4 border-l-marigold hover:shadow-md transition-shadow">
                <p className="text-xs text-marigold font-medium">{label ? label[lang].name : ''}</p>
                <p className="font-medium mt-1">{l.title}</p>
                <p className="text-sm text-ink/60 mt-1">{l.area}{l.upazila ? ` · ${l.upazila}` : ''}</p>
                <p className="text-sm text-green font-numeric mt-1">{l.price_or_salary}</p>
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
