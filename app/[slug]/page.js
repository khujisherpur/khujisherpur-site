export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { getLang } from '../../lib/getLang';
import { upazilaList } from '../../lib/locations';
import { toBn } from '../../lib/format';
import { getServicesFor, providerHref, subcategoryIcons } from '../../lib/services';
import { SITE_NAME, categoryOgImage } from '../../lib/site';
import SiteHeader from '../../components/SiteHeader';

const text = {
  bn: {
    home: '← সব সেবা', addProfile: '+ প্রোফাইল যুক্ত করুন',
    noProvider: 'এখনো কেউ নেই।', beFirst: 'প্রথম হিসেবে আপনি যোগ করতে পারেন!',
    noMatch: 'এই এলাকায় কেউ পাওয়া যায়নি।', clearFilters: 'ফিল্টার মুছুন',
    unavailable: 'অনুপলব্ধ', allAreas: 'সব উপজেলা',
    countWord: 'জন সেবাদাতা', exp: 'বছর অভিজ্ঞতা',
  },
  en: {
    home: '← All services', addProfile: '+ Add Profile',
    noProvider: 'No one yet.', beFirst: 'Be the first to add one!',
    noMatch: 'No one found in this area.', clearFilters: 'Clear filters',
    unavailable: 'Unavailable', allAreas: 'All areas',
    countWord: ' providers', exp: 'yrs experience',
  },
};

// বট-সুরক্ষা: শুধু a-z, 0-9, হাইফেন; .ico/.txt/.xml ইত্যাদি ও অদ্ভুত পাথ ডাটাবেসে যাওয়ার আগেই বাদ
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const getSubcategory = cache(async (slug) => {
  if (typeof slug !== 'string' || slug.length > 60 || !SLUG_RE.test(slug)) return null;
  const { data } = await supabase
    .from('subcategories')
    .select('id, slug, name_bn, name_en, category_id')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return data || null;
});

// সাব-ক্যাটাগরি যে ক্যাটাগরির অধীনে তার slug (মেটাডেটা ও পেজ একই কোয়েরি ভাগ করে)
const getOwnerCatSlug = cache(async (categoryId) => {
  const { data } = await supabase.from('categories').select('slug').eq('id', categoryId).maybeSingle();
  return data?.slug || null;
});

// এই সেবা যাঁরা অতিরিক্ত সেবা হিসেবে দেন তাঁদের আইডি (মেটাডেটা ও পেজ একই কোয়েরি ভাগ করে)
const getLinkedIds = cache(async (subId) => {
  const { data } = await supabase
    .from('provider_subcategories')
    .select('provider_id')
    .eq('subcategory_id', subId);
  return (data || []).map((l) => l.provider_id);
});

function orFilterFor(subId, linkedIds) {
  return linkedIds.length
    ? `id.in.(${linkedIds.join(',')}),primary_subcategory_id.eq.${subId}`
    : `primary_subcategory_id.eq.${subId}`;
}

async function countProviders(subId) {
  const linkedIds = await getLinkedIds(subId);
  const { count } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')
    .or(orFilterFor(subId, linkedIds));
  return count || 0;
}

function cleanUpazila(v) {
  return typeof v === 'string' && upazilaList.includes(v) ? v : '';
}

export async function generateMetadata({ params, searchParams }) {
  const lang = getLang();
  const sub = await getSubcategory(params.slug);
  if (!sub) {
    return { title: lang === 'bn' ? 'পাওয়া যায়নি' : 'Not found', robots: { index: false, follow: false } };
  }
  const name = lang === 'bn' ? sub.name_bn : sub.name_en || sub.name_bn;
  const filtered = !!cleanUpazila(searchParams?.upazila);
  const canonical = `/${params.slug}`;

  // সংখ্যা ৩-এর কম হলে বলা হয় না (কম সংখ্যা দেখালে উল্টো ক্লিক কমে); ফিল্টার করা পাতায় গোনাই হয় না
  let n = 0;
  if (!filtered && lang === 'bn') n = await countProviders(sub.id);
  const fmt = n >= 3 ? toBn(n) : null;

  const title =
    lang === 'bn'
      ? `শেরপুরের ${name} — ফোন নম্বর ও রিভিউ | খুঁজি শেরপুর`
      : `${name} in Sherpur — phone numbers & reviews | Khuji Sherpur`;
  const description =
    lang === 'bn'
      ? fmt
        ? `শেরপুরে ${fmt} জন ${name} — এলাকা, অভিজ্ঞতা ও রিভিউসহ। সরাসরি কল করুন।`
        : /শিক্ষক|টিউটর/.test(name)
          ? `শেরপুরের ${name} — বিষয়, এলাকা ও রিভিউসহ। সরাসরি কল করুন।`
          : `শেরপুরের ${name} সেবাদাতা — এলাকা, অভিজ্ঞতা ও রিভিউসহ। সরাসরি কল করুন।`
      : `${name} service providers in Sherpur district — area, experience and reviews. Call directly.`;

  // শিক্ষকের বিষয় হলে শিক্ষকের ছবি, বাকি সব সেবায় সেবাদাতার ছবি
  const ownerSlug = await getOwnerCatSlug(sub.category_id);
  const ogImage = categoryOgImage(ownerSlug === 'teacher' ? 'teacher' : 'service-provider');

  return {
    title,
    description,
    // ফিল্টার করা পাতা সার্চ ইঞ্জিনে ডুপ্লিকেট হয়, তাই noindex; ফিল্টারহীন পাতায় canonical
    ...(filtered
      ? { robots: { index: false, follow: true } }
      : { alternates: { canonical } }),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: lang === 'bn' ? 'bn_BD' : 'en_US',
      images: [ogImage],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function SubcategoryPage({ params, searchParams }) {
  const lang = getLang();
  const t = text[lang];
  const num = (n) => (lang === 'bn' ? toBn(n) : n);
  const activeUpazila = cleanUpazila(searchParams?.upazila);

  const subcategory = await getSubcategory(params.slug);
  if (!subcategory) {
    notFound();
  }

  // এই সেবা যাঁরা দেন (প্রধান বা অতিরিক্ত, দুটোই)
  const linkedIds = await getLinkedIds(subcategory.id);
  const orFilter = orFilterFor(subcategory.id, linkedIds);

  let query = supabase
    .from('providers')
    .select('id, slug, name, area, upazila, is_available, photo_url, experience_years, primary_subcategory_id, is_verified')
    .eq('status', 'approved')
    .or(orFilter);
  if (activeUpazila) query = query.eq('upazila', activeUpazila);

  const { data: providers } = await query.order('created_at', { ascending: false }).limit(200);
  const items = providers || [];
  const svc = await getServicesFor(items, lang);

  const name = lang === 'bn' ? subcategory.name_bn : subcategory.name_en || subcategory.name_bn;
  const icon = subcategoryIcons[subcategory.slug] || '🛠️';
  const base = `/${subcategory.slug}`;
  // শিক্ষকের বিষয় হলে প্রোফাইল যোগ ও ফেরার লিংক শিক্ষকের ক্যাটাগরিতে যায়
  const ownerSlug = await getOwnerCatSlug(subcategory.category_id);
  const catSlug = ownerSlug === 'teacher' ? 'teacher' : 'service-provider';
  const countWord = catSlug === 'teacher' && lang === 'bn' ? ' জন শিক্ষক' : t.countWord;

  return (
    <>
      <SiteHeader lang={lang} />
      <main className="max-w-4xl mx-auto px-4">
        <div className="pt-5 pb-4">
          <a href={`/category/${catSlug}`} className="text-sm text-ink/50 hover:text-ink">{t.home}</a>
          <div className="flex items-center gap-3 mt-3">
            <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#EEF1F8] flex-shrink-0">
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-semibold leading-tight truncate">{name}</h1>
              <p className="text-xs text-ink/50 mt-0.5">
                {num(items.length)}
                {countWord}
              </p>
            </div>
            <a
              href={`/post/new?category=${catSlug}`}
              className="bg-marigold text-ink font-semibold text-sm px-4 py-2.5 rounded-full flex-shrink-0 whitespace-nowrap"
            >
              {t.addProfile}
            </a>
          </div>
        </div>

        {/* উপজেলা ফিল্টার */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
          {[['', `📍 ${t.allAreas}`], ...upazilaList.map((u) => [u, u])].map(([val, label]) => {
            const active = activeUpazila === val;
            return (
              <a
                key={val || 'all'}
                href={val ? `${base}?upazila=${encodeURIComponent(val)}` : base}
                className={`text-sm px-4 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 border transition-colors ${
                  active ? 'bg-green text-white border-green' : 'bg-white border-ink/15 text-ink/65'
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>

        <section className="pb-16 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">{activeUpazila ? '🔎' : '📭'}</p>
              <p className="text-ink/55 text-sm">{activeUpazila ? t.noMatch : t.noProvider}</p>
              {activeUpazila ? (
                <a href={base} className="inline-block mt-4 text-green underline text-sm">{t.clearFilters}</a>
              ) : (
                <>
                  <p className="text-ink/45 text-xs mt-1">{t.beFirst}</p>
                  <a
                    href={`/post/new?category=${catSlug}`}
                    className="inline-block mt-4 bg-marigold text-ink font-semibold text-sm px-6 py-2.5 rounded-full"
                  >
                    {t.addProfile}
                  </a>
                </>
              )}
            </div>
          )}

          {items.map((p) => {
            const services = svc[p.id] || [];
            const shown = services.slice(0, 3);
            const extra = services.length - shown.length;
            return (
              <a
                key={p.id}
                href={providerHref(p, services)}
                className="flex gap-3 bg-white rounded-xl p-3 border-l-4 border-l-green border-t border-r border-b border-ink/10 hover:shadow-md transition-shadow"
              >
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name || ''} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <span className="w-16 h-16 rounded-full bg-[#EEF1F8] text-green-dark text-xl font-semibold flex items-center justify-center flex-shrink-0">
                    {p.name?.charAt(0)}
                  </span>
                )}
                <div className="min-w-0 flex-1 self-center">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium leading-tight truncate">{p.name}</p>
                    <span className={p.is_verified ? 'w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center flex-shrink-0' : 'hidden'}>
                      ✓
                    </span>
                  </div>
                  <p className="text-sm text-ink/60 mt-0.5 truncate">
                    📍 {p.area}
                    {p.upazila && p.upazila !== p.area ? `, ${p.upazila}` : ''}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap mt-1.5">
                    {shown.map((s) => (
                      <span
                        key={s.id}
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          s.slug === subcategory.slug ? 'bg-marigold/25 text-ink font-medium' : 'bg-[#EEF1F8] text-ink/60'
                        }`}
                      >
                        {s.icon} {s.label}
                      </span>
                    ))}
                    {extra > 0 && <span className="text-[10px] text-ink/45">+{num(extra)}</span>}
                    {p.experience_years ? (
                      <span className="text-[10px] text-ink/45 ml-1">
                        · {num(p.experience_years)} {t.exp}
                      </span>
                    ) : null}
                    {!p.is_available && (
                      <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{t.unavailable}</span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </section>
      </main>
    </>
  );
}
