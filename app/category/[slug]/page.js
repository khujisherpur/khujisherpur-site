export const runtime = 'edge';
import { supabase } from '../../../lib/supabaseClient';

export default async function CategoryPage({ params }) {
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, icon, type')
    .eq('slug', params.slug)
    .single();

  if (!category) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">এই ক্যাটাগরি খুঁজে পাওয়া যায়নি।</p>
        <a href="/" className="text-green underline mt-2 inline-block">হোমপেজে ফিরে যান</a>
      </main>
    );
  }

  const isService = category.type === 'service';

  let items = [];
  if (isService) {
    const { data } = await supabase
      .from('providers')
      .select('id, name, area, is_available')
      .eq('category_id', category.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    items = data || [];
  } else {
    const { data } = await supabase
      .from('listings')
      .select('id, title, area, price_or_salary')
      .eq('category_id', category.id)
      .eq('status', 'active')
      .order('posted_at', { ascending: false });
    items = data || [];
  }

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
        <a href="/" className="text-sm text-ink/50 hover:text-ink">← হোমপেজ</a>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-3xl">{category.icon}</span>
          <h1 className="text-2xl md:text-3xl font-semibold">{category.name}</h1>
        </div>
        <a
          href={`/post/new?category=${category.slug}`}
          className="inline-block mt-4 bg-marigold text-ink font-semibold px-5 py-2.5 hover:bg-marigold/90 transition-colors"
        >
          {isService ? '+ আপনার প্রোফাইল যুক্ত করুন' : '+ নতুন পোস্ট দিন'}
        </a>
      </div>

      <section className="pb-16 space-y-3">
        {items.length === 0 && (
          <p className="text-ink/50 text-sm py-10 text-center">
            এখনো কোনো {isService ? 'প্রোভাইডার' : 'পোস্ট'} নেই। প্রথম হিসেবে আপনি যোগ করতে পারেন!
          </p>
        )}
        {isService
          ? items.map((p) => (
              <a
                key={p.id}
                href={`/provider/${p.id}`}
                className="block bg-white p-4 border border-ink/10 hover:border-green transition-colors"
              >
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-ink/60 mt-1">{p.area}</p>
                {!p.is_available && (
                  <p className="text-xs text-red-500 mt-1">এই মুহূর্তে অনুপলব্ধ</p>
                )}
              </a>
            ))
          : items.map((l) => (
              <a
                key={l.id}
                href={`/listing/${l.id}`}
                className="block bg-white p-4 border border-ink/10 hover:border-green transition-colors"
              >
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-ink/60 mt-1">{l.area}</p>
                <p className="text-sm text-green font-medium mt-1">{l.price_or_salary}</p>
              </a>
            ))}
      </section>
    </main>
  );
}
