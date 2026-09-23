export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabaseClient';
import { getLang } from '../../../lib/getLang';
import { categoryLabels } from '../../../lib/categoryLabels';
import LanguageToggle from '../../../components/LanguageToggle';

const text = {
  bn: {
    login: 'লগইন', home: '← হোমপেজ',
    addProfile: '+ আপনার প্রোফাইল যুক্ত করুন', addPost: '+ নতুন পোস্ট দিন',
    noProvider: 'এখনো কোনো প্রোভাইডার নেই। প্রথম হিসেবে আপনি যোগ করতে পারেন!',
    noListing: 'এখনো কোনো পোস্ট নেই। প্রথম হিসেবে আপনি যোগ করতে পারেন!',
    unavailable: 'এই মুহূর্তে অনুপলব্ধ', notFound: 'এই ক্যাটাগরি খুঁজে পাওয়া যায়নি।', backHome: 'হোমপেজে ফিরে যান',
    all: 'সব', house: 'বাসা', shop: 'দোকান', mess: 'মেস', other: 'অন্যান্য',
  },
  en: {
    login: 'Login', home: '← Home',
    addProfile: '+ Add Your Profile', addPost: '+ Post New Listing',
    noProvider: 'No providers yet. Be the first to add one!',
    noListing: 'No posts yet. Be the first to add one!',
    unavailable: 'Currently unavailable', notFound: 'Category not found.', backHome: 'Back to Home',
    all: 'All', house: 'House', shop: 'Shop', mess: 'Mess', other: 'Other',
  },
};

const rentTypeTabs = ['house', 'shop', 'mess', 'other'];

export default async function CategoryPage({ params, searchParams }) {
  const lang = getLang();
  const t = text[lang];
  const label = categoryLabels[params.slug];
  const activeRentType = searchParams?.type || 'all';

  const { data: category } = await supabase
    .from('categories')
    .select('id, slug, type')
    .eq('slug', params.slug)
    .single();

  if (!category || !label) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">{t.notFound}</p>
        <a href="/" className="text-green underline mt-2 inline-block">{t.backHome}</a>
      </main>
    );
  }

  const isService = category.type === 'service';
  const isRent = category.slug === 'rent';
  const name = label[lang].name;

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
    let query = supabase
      .from('listings')
      .select('id, title, area, price_or_salary, rent_type')
      .eq('category_id', category.id)
      .eq('status', 'active')
      .gt('expiry_date', new Date().toISOString());

    if (isRent && activeRentType !== 'all') {
      query = query.eq('rent_type', activeRentType);
    }

    const { data } = await query.order('posted_at', { ascending: false });
    items = data || [];
  }

  return (
    <main className="max-w-4xl mx-auto px-4">
      <header className="flex items-center justify-between py-6 flex-wrap gap-3">
        <a href="/" className="flex items-center">
          <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" />
        </a>
        <div className="flex items-center gap-2">
          <LanguageToggle lang={lang} />
          <a href="/login" className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white transition-colors">
            {t.login}
          </a>
        </div>
      </header>

      <div className="py-6">
        <a href="/" className="text-sm text-ink/50 hover:text-ink">{t.home}</a>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-3xl">{label.icon}</span>
          <h1 className="text-2xl md:text-3xl font-semibold">{name}</h1>
        </div>
        <a
          href={`/post/new?category=${category.slug}`}
          className="inline-block mt-4 bg-marigold text-ink font-semibold px-5 py-2.5 hover:bg-marigold/90 transition-colors"
        >
          {isService ? t.addProfile : t.addPost}
        </a>
      </div>

      {isRent && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <a
            href={`/category/rent`}
            className={`text-sm px-4 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${
              activeRentType === 'all' ? 'bg-green text-white' : 'bg-white border border-ink/15 text-ink/60'
            }`}
          >
            {t.all}
          </a>
          {rentTypeTabs.map((rt) => (
            <a
              key={rt}
              href={`/category/rent?type=${rt}`}
              className={`text-sm px-4 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                activeRentType === rt ? 'bg-green text-white' : 'bg-white border border-ink/15 text-ink/60'
              }`}
            >
              {t[rt]}
            </a>
          ))}
        </div>
      )}

      <section className="pb-16 space-y-3">
        {items.length === 0 && (
          <p className="text-ink/50 text-sm py-10 text-center">
            {isService ? t.noProvider : t.noListing}
          </p>
        )}
        {isService
          ? items.map((p) => (
              <a key={p.id} href={`/provider/${p.id}`} className="block bg-white p-4 border border-ink/10 hover:border-green transition-colors">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-ink/60 mt-1">{p.area}</p>
                {!p.is_available && <p className="text-xs text-red-500 mt-1">{t.unavailable}</p>}
              </a>
            ))
          : items.map((l) => (
              <a key={l.id} href={`/listing/${l.id}`} className="block bg-white p-4 border border-ink/10 hover:border-green transition-colors">
                {isRent && l.rent_type && (
                  <span className="inline-block text-[10px] bg-paper text-ink/50 px-2 py-0.5 rounded-full mb-1.5">
                    {t[l.rent_type] || l.rent_type}
                  </span>
                )}
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-ink/60 mt-1">{l.area}</p>
                <p className="text-sm text-green font-medium mt-1">{l.price_or_salary}</p>
              </a>
            ))}
      </section>
    </main>
  );
}
