export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabaseClient';
import { cleanPhone, toBn } from '../../../lib/format';
import SiteHeader from '../../../components/SiteHeader';

export const metadata = {
  title: 'রক্তদাতা তালিকা — খুঁজি শেরপুর',
  description: 'শেরপুরের স্বেচ্ছাসেবী রক্তদাতাদের তালিকা। রক্তের গ্রুপ ও এলাকা দিয়ে খুঁজুন।',
  robots: { index: false, follow: true },
};

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const LIMIT = 60;

// ilike/or ফিল্টারে বিশেষ চিহ্ন ঢুকতে না দেওয়া
const cleanQuery = (s) => String(s || '').replace(/[%,()*\\_"'`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);

function initials(name) {
  const t = String(name || '').trim();
  return t ? Array.from(t)[0].toUpperCase() : '🩸';
}

const dropPath = 'M12 2.5c3.2 4 6 7.2 6 10.5a6 6 0 1 1-12 0c0-3.3 2.8-6.5 6-10.5z';

export default async function DonorsListPage({ searchParams }) {
  const group = GROUPS.includes(searchParams?.group) ? searchParams.group : '';
  const q = cleanQuery(searchParams?.q);

  let query = supabase
    .from('blood_donors')
    .select('id, slug, name, blood_group, phone, area', { count: 'exact' })
    .eq('is_public', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(LIMIT);
  if (group) query = query.eq('blood_group', group);
  if (q) query = query.or(`name.ilike.%${q}%,area.ilike.%${q}%`);

  const { data, count } = await query;
  const donors = data || [];

  const chipHref = (g) => {
    const sp = new URLSearchParams();
    if (g) sp.set('group', g);
    if (q) sp.set('q', q);
    const qs = sp.toString();
    return `/blood/donors${qs ? `?${qs}` : ''}`;
  };

  return (
    <>
      <SiteHeader lang="bn" simple />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#3B0A12] via-[#7F1D1D] to-[#C62828] text-white">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="absolute -right-10 -top-6 w-60 h-60 text-white/[0.07] rotate-12">
          <path d={dropPath} />
        </svg>
        <div className="relative max-w-2xl mx-auto px-4 pt-5 pb-14">
          <a href="/blood" className="inline-block text-sm text-white/70 hover:text-white">← ব্লাড পেজ</a>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold">স্বেচ্ছাসেবী রক্তদাতা</h1>
          <p className="mt-1.5 text-sm text-white/80">
            রক্তের গ্রুপ ও এলাকা দিয়ে খুঁজুন, তারপর সরাসরি যোগাযোগ করুন।
          </p>
        </div>
      </section>

      <main className="max-w-2xl mx-auto px-4 pb-16">
        <form method="get" className="-mt-8 relative bg-white border border-ink/10 shadow-md rounded-2xl p-3">
          {group && <input type="hidden" name="group" value={group} />}
          <div className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q}
              maxLength={40}
              placeholder="এলাকা বা নাম লিখুন"
              className="flex-1 min-w-0 border border-ink/20 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400"
            />
            <button
              type="submit"
              className="bg-gradient-to-br from-[#B91C1C] to-[#EF4444] text-white font-semibold px-4 rounded-xl"
            >
              🔍 খুঁজুন
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <a
              href={chipHref('')}
              className={`text-xs px-3 py-1.5 rounded-full border ${!group ? 'bg-red-500 text-white border-red-500' : 'border-ink/20 text-ink/70'}`}
            >
              সব গ্রুপ
            </a>
            {GROUPS.map((g) => (
              <a
                key={g}
                href={chipHref(g)}
                className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${group === g ? 'bg-red-500 text-white border-red-500' : 'border-red-100 text-red-600 bg-red-50/50'}`}
              >
                {g}
              </a>
            ))}
          </div>
        </form>

        {donors.length > 0 && (
          <p className="text-xs text-ink/50 mt-4 mb-3">
            {toBn(donors.length)} জন দেখানো হচ্ছে
            {count && count > donors.length ? ` (মোট ${toBn(count)} জন, খুঁজে সীমিত করুন)` : ''}
          </p>
        )}

        {donors.length === 0 && (
          <div className="mt-5 bg-white border border-dashed border-ink/20 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">🔎</p>
            <p className="text-sm text-ink/60">
              {group || q ? 'এই খোঁজে কোনো রক্তদাতা পাওয়া যায়নি।' : 'এখনো কোনো রক্তদাতা তালিকায় যুক্ত হননি।'}
            </p>
            {(group || q) && (
              <a href="/blood/donors" className="text-red-600 underline text-sm mt-2 inline-block">সব রক্তদাতা দেখুন</a>
            )}
          </div>
        )}

        <div className="space-y-3 mt-3">
          {donors.map((d) => (
            <div key={d.id} className="bg-white border border-ink/10 rounded-2xl p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
              <a href={`/blood/donors/${d.slug || d.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B91C1C] to-[#EF4444] text-white font-bold flex items-center justify-center flex-shrink-0 shadow">
                  {d.blood_group}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold truncate">{d.name}</span>
                  <span className="block text-xs text-ink/60 truncate">📍 {d.area || '—'}</span>
                  <span className="inline-block text-[10px] bg-green/10 text-green px-1.5 py-0.5 rounded-full mt-1">● প্রস্তুত</span>
                </span>
              </a>
              <a
                href={`tel:${cleanPhone(d.phone)}`}
                className="bg-gradient-to-br from-[#B91C1C] to-[#EF4444] text-white text-sm font-medium px-3 py-2 rounded-xl flex-shrink-0"
              >
                📞 কল
              </a>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white border border-ink/10 rounded-2xl p-4 text-xs text-ink/60 leading-relaxed">
          রক্তদান সম্পূর্ণ স্বেচ্ছাসেবী। রক্তের বিনিময়ে কোনো অর্থ লেনদেন করবেন না। খুঁজি শেরপুর ডোনারদের তথ্য যাচাই করে না,
          রক্ত নেওয়ার আগে হাসপাতালে গ্রুপ ও পরীক্ষা মিলিয়ে নিন।
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <a href="/blood/donor" className="text-center border-2 border-green/30 text-green font-semibold py-2.5 rounded-xl hover:bg-green/5 transition-colors">
            ❤️ ডোনার হোন
          </a>
          <a href="/blood/request" className="text-center border-2 border-red-200 text-red-600 font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors">
            🆘 রক্ত লাগবে
          </a>
        </div>
      </main>
    </>
  );
}
