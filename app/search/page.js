export const runtime = 'edge';
import { supabase } from '../../lib/supabaseClient';

export default async function SearchPage({ searchParams }) {
  const query = searchParams?.q?.trim() || '';

  let providers = [];
  let listings = [];

  if (query) {
    const { data: matchedCategories } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', `%${query}%`);
    const categoryIds = (matchedCategories || []).map((c) => c.id);
    const categoryFilter = categoryIds.length > 0 ? `,category_id.in.(${categoryIds.join(',')})` : '';

    const { data: p } = await supabase
      .from('providers')
      .select('id, name, area, categories(name, slug)')
      .eq('status', 'approved')
      .or(`name.ilike.%${query}%,area.ilike.%${query}%${categoryFilter}`);
    providers = p || [];

    const { data: l } = await supabase
      .from('listings')
      .select('id, title, area, price_or_salary, categories(name, slug)')
      .eq('status', 'active')
      .or(`title.ilike.%${query}%,area.ilike.%${query}%${categoryFilter}`);
    listings = l || [];
  }

  const totalResults = providers.length + listings.length;

  return (
    <main className="max-w-4xl mx-auto px-4">
      <header className="flex items-center justify-between py-6">
        <a href="/" className="flex items-center">
          <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" />
        </a>
        <a href="/login" className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white transition-colors">
          লগইন
        </a>
      </header>

      <div className="py-6">
        <form action="/search" method="GET" className="flex gap-2 max-w-xl bg-white border-2 border-ink/10 p-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="যেমন: বাসা ভাড়া, ইলেকট্রিশিয়ান..."
            className="flex-1 bg-transparent outline-none px-3 py-2 text-base placeholder:text-ink/40"
          />
          <button
            type="submit"
            className="bg-marigold text-ink font-semibold px-5 py-2 hover:bg-marigold/90 transition-colors"
          >
            খুঁজুন
          </button>
        </form>

        {query && (
          <p className="text-sm text-ink/60 mt-4">
            "<span className="font-medium text-ink">{query}</span>" এর জন্য {totalResults}টি ফলাফল পাওয়া গেছে
          </p>
        )}
      </div>

      <section className="pb-16 space-y-3">
        {!query && (
          <p className="text-ink/50 text-sm py-10 text-center">
            কিছু খুঁজতে উপরের বক্সে লিখুন।
          </p>
        )}

        {query && totalResults === 0 && (
          <p className="text-ink/50 text-sm py-10 text-center">
            কোনো ফলাফল পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।
          </p>
        )}

        {providers.map((p) => (
          <a
            key={`provider-${p.id}`}
            href={`/provider/${p.id}`}
            className="block bg-white p-4 border-l-4 border-green hover:bg-paper transition-colors"
          >
            <p className="text-xs text-green font-medium">{p.categories?.name}</p>
            <p className="font-medium mt-1">{p.name}</p>
            <p className="text-sm text-ink/60 mt-1">{p.area}</p>
          </a>
        ))}

        {listings.map((l) => (
          <a
            key={`listing-${l.id}`}
            href={`/listing/${l.id}`}
            className="block bg-white p-4 border-l-4 border-marigold hover:bg-paper transition-colors"
          >
            <p className="text-xs text-marigold font-medium">{l.categories?.name}</p>
            <p className="font-medium mt-1">{l.title}</p>
            <p className="text-sm text-ink/60 mt-1">{l.area}</p>
            <p className="text-sm text-green font-medium mt-1">{l.price_or_salary}</p>
          </a>
        ))}
      </section>
    </main>
  );
}
