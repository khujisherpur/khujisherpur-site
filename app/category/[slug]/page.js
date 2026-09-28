export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabaseClient';
import { getLang } from '../../../lib/getLang';
import { categoryLabels } from '../../../lib/categoryLabels';
import SiteHeader from '../../../components/SiteHeader';

const text = {
  bn: {
    home: '← হোমপেজ',
    addProfile: '+ আপনার প্রোফাইল যুক্ত করুন', addPost: '+ নতুন পোস্ট দিন',
    noProvider: 'এখনো কোনো প্রোভাইডার নেই। প্রথম হিসেবে আপনি যোগ করতে পারেন!',
    noListing: 'এখনো কোনো পোস্ট নেই। প্রথম হিসেবে আপনি যোগ করতে পারেন!',
    unavailable: 'এই মুহূর্তে অনুপলব্ধ', notFound: 'এই ক্যাটাগরি খুঁজে পাওয়া যায়নি।', backHome: 'হোমপেজে ফিরে যান',
    all: 'সব', house: 'বাসা', shop: 'দোকান', mess: 'মেস', other: 'অন্যান্য',
    whichService: 'কোন সেবা খুঁজছেন?', backToServices: '← সব সেবা',
  },
  en: {
    home: '← Home',
    addProfile: '+ Add Your Profile', addPost: '+ Post New Listing',
    noProvider: 'No providers yet. Be the first to add one!',
    noListing: 'No posts yet. Be the first to add one!',
    unavailable: 'Currently unavailable', notFound: 'Category not found.', backHome: 'Back to Home',
    all: 'All', house: 'House', shop: 'Shop', mess: 'Mess', other: 'Other',
    whichService: 'Which service are you looking for?', backToServices: '← All services',
  },
};

const rentTypeTabs = ['house', 'shop', 'mess', 'other'];

const subcategoryIcons = {
  electrician: '⚡', plumber: '🚰', 'ac-technician': '❄️', 'fridge-technician': '🧊',
  mechanic: '⚙️', carpenter: '🪚', mason: '🧱', painter: '🎨', cleaning: '🧹',
  'mobile-repair': '📱', 'computer-repair': '💻', cctv: '📹',
  'internet-wifi': '📶', driver: '🚗', 'transport-shifting': '🚚',
};

export default async function CategoryPage({ params, searchParams }) {
  const lang = getLang();
  const t = text[lang];
  const label = categoryLabels[params.slug];
  const activeRentType = searchParams?.type || 'all';
  const activeSub = searchParams?.sub || null;

  const { data: category } = await supabase
    .from('categories')
    .select('id, slug, type')
    .eq('slug', params.slug)
    .single();

  if (!category || !label) {
    return (
      <>
        <SiteHeader lang={lang} />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-ink/70">{t.notFound}</p>
          <a href="/" className="text-green underline mt-2 inline-block">{t.backHome}</a>
        </main>
      </>
    );
  }

  const isService = category.type === 'service';
  const isRent = category.slug === 'rent';
  const isServiceProvider = category.slug === 'service-provider';
  const name = label[lang].name;

  if (isServiceProvider && !activeSub) {
    const { data: subcats } = await supabase
      .from('subcategories')
      .select('id, slug, name_bn, name_en')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    const subWithCounts = await Promise.all(
      (subcats || []).map(async (s) => {
        const { count } = await supabase
          .from('providers')
          .select('id', { count: 'exact', head: true })
          .eq('subcategory_id', s.id)
          .eq('status', 'approved');
        return { ...s, count: count || 0 };
      })
    );

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
            {subWithCounts.map((s) => (
              <a
                key={s.id}
                href={`/category/service-provider?sub=${s.slug}`}
                className="bg-white rounded-xl border border-ink/10 border-b-4 border-b-green p-3 hover:shadow-md transition-shadow text-center"
              >
                <span className="w-11 h-11 mx-auto rounded-lg flex items-center justify-center text-xl bg-[#EEF1F8]">
                  {subcategoryIcons[s.slug] || '🛠️'}
                </span>
                <p className="font-medium text-xs mt-2 leading-tight">
                  {lang === 'bn' ? s.name_bn : (s.name_en || s.name_bn)}
                </p>
                {s.count > 0 && (
                  <p className="text-[10px] text-ink/40 mt-0.5 font-numeric">{s.count}</p>
                )}
              </a>
            ))}
          </section>
        </main>
      </>
    );
  }

  let items = [];
  let activeSubcategory = null;

  if (isService) {
    let query = supabase
      .from('providers')
      .select('id, name, area, is_available')
      .eq('category_id', category.id)
      .eq('status', 'approved');

    if (isServiceProvider && activeSub) {
      const { data: subRow } = await supabase
        .from('subcategories')
        .select('id, name_bn, name_en')
        .eq('slug', activeSub)
        .single();
      activeSubcategory = subRow;
      if (subRow) query = query.eq('subcategory_id', subRow.id);
    }

    const { data } = await query.order('created_at', { ascending: false });
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
    <>
      <SiteHeader lang={lang} />
      <main className="max-w-4xl mx-auto px-4">
        <div className="py-6">
          <a
            href={isServiceProvider ? '/category/service-provider' : '/'}
            className="text-sm text-ink/50 hover:text-ink"
          >
            {isServiceProvider ? t.backToServices : t.home}
          </a>
          <div className="flex items-center gap-3 mt-3">
            <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#EEF1F8]">
              {isServiceProvider && activeSubcategory ? (subcategoryIcons[activeSub] || '🛠️') : label.icon}
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold">
              {isServiceProvider && activeSubcategory
                ? (lang === 'bn' ? activeSubcategory.name_bn : (activeSubcategory.name_en || activeSubcategory.name_bn))
                : name}
            </h1>
          </div>
          <a
            href={isServiceProvider ? `/post/new?category=${category.slug}&sub=${activeSub}` : `/post/new?category=${category.slug}`}
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
                <a key={p.id} href={`/provider/${p.id}`} className="block bg-white p-4 border border-ink/10 border-l-4 border-l-green hover:shadow-md transition-shadow">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-ink/60 mt-1">{p.area}</p>
                  {!p.is_available && <p className="text-xs text-red-500 mt-1">{t.unavailable}</p>}
                </a>
              ))
            : items.map((l) => (
                <a key={l.id} href={`/listing/${l.id}`} className="block bg-white p-4 border border-ink/10 border-l-4 border-l-marigold hover:shadow-md transition-shadow">
                  {isRent && l.rent_type && (
                    <span className="inline-block text-[10px] bg-[#EEF1F8] text-ink/60 px-2 py-0.5 rounded-full mb-1.5">
                      {t[l.rent_type] || l.rent_type}
                    </span>
                  )}
                  <p className="font-medium">{l.title}</p>
                  <p className="text-sm text-ink/60 mt-1">{l.area}</p>
                  <p className="text-sm text-green font-numeric mt-1">{l.price_or_salary}</p>
                </a>
              ))}
        </section>
      </main>
    </>
  );
}
