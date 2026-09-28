export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { getLang } from '../../lib/getLang';
import SiteHeader from '../../components/SiteHeader';

const text = {
  bn: {
    home: '← সব সেবা', addProfile: '+ আপনার প্রোফাইল যুক্ত করুন',
    noProvider: 'এখনো কেউ নেই। প্রথম হিসেবে আপনি যোগ করতে পারেন!',
    unavailable: 'এই মুহূর্তে অনুপলব্ধ',
  },
  en: {
    home: '← All services', addProfile: '+ Add Your Profile',
    noProvider: 'No one yet. Be the first to add one!',
    unavailable: 'Currently unavailable',
  },
};

const subcategoryIcons = {
  electrician: '⚡', plumber: '🚰', 'ac-technician': '❄️', 'fridge-technician': '🧊',
  mechanic: '⚙️', carpenter: '🪚', mason: '🧱', painter: '🎨', cleaning: '🧹',
  'mobile-repair': '📱', 'computer-repair': '💻', cctv: '📹',
  'internet-wifi': '📶', driver: '🚗', 'transport-shifting': '🚚',
};

export default async function SubcategoryPage({ params }) {
  const lang = getLang();
  const t = text[lang];

  const { data: subcategory } = await supabase
    .from('subcategories')
    .select('id, slug, name_bn, name_en, category_id')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!subcategory) {
    notFound();
  }

  const { data: providers } = await supabase
    .from('providers')
    .select('id, slug, name, name_en, area, upazila, is_available, photo_url')
    .eq('primary_subcategory_id', subcategory.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  const items = providers || [];
  const name = lang === 'bn' ? subcategory.name_bn : (subcategory.name_en || subcategory.name_bn);
  const icon = subcategoryIcons[subcategory.slug] || '🛠️';

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="max-w-4xl mx-auto px-4">
        <div className="py-6">
          <a href="/category/service-provider" className="text-sm text-ink/50 hover:text-ink">{t.home}</a>
          <div className="flex items-center gap-3 mt-3">
            <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#EEF1F8]">{icon}</span>
            <h1 className="text-2xl md:text-3xl font-semibold">{name}</h1>
          </div>
          <a
            href={`/post/new?category=service-provider`}
            className="inline-block mt-4 bg-marigold text-ink font-semibold px-5 py-2.5 hover:bg-marigold/90 transition-colors"
          >
            {t.addProfile}
          </a>
        </div>

        <section className="pb-16 space-y-3">
          {items.length === 0 && (
            <p className="text-ink/50 text-sm py-10 text-center">{t.noProvider}</p>
          )}
          {items.map((p) => (
            <a
              key={p.id}
              href={p.slug ? `/${subcategory.slug}/${p.slug}` : `/provider/${p.id}`}
              className="flex items-center gap-3 bg-white p-4 border border-ink/10 border-l-4 border-l-green hover:shadow-md transition-shadow"
            >
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#EEF1F8] flex items-center justify-center text-ink/40 flex-shrink-0">
                  {p.name?.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-sm text-ink/60 mt-0.5 truncate">{p.area}{p.upazila ? ` · ${p.upazila}` : ''}</p>
                {!p.is_available && <p className="text-xs text-red-500 mt-1">{t.unavailable}</p>}
              </div>
            </a>
          ))}
        </section>
      </main>
    </>
  );
}
