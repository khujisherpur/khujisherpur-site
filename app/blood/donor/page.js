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

  return (
    <>
      <SiteHeader lang="bn" simple />
      <main className="max-w-2xl mx-auto px-4 pb-16">
        <a href="/blood" className="inline-block mt-5 text-sm text-ink/50 hover:text-ink">← ব্লাড পেজে ফিরে যান</a>

        <div className="flex items-center gap-3 mt-3 mb-2">
          <span className="text-3xl">🩸</span>
          <h1 className="text-xl md:text-2xl font-semibold">স্বেচ্ছাসেবী রক্তদাতা</h1>
        </div>
        <p className="text-sm text-ink/60 mb-5">
          রক্তের গ্রুপ ও এলাকা দিয়ে খুঁজুন, তারপর সরাসরি যোগাযোগ করুন।
        </p>

        <form method="get" className="bg-white border border-ink/10 rounded-xl p-3 mb-5 grid grid-cols-2 gap-2">
          <select
            name="group"
            defaultValue={group}
            className="border border-ink/20 rounded-lg px-3 py-2.5 bg-white text-sm"
          >
            <option value="">সব গ্রুপ</option>
            {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input
            type="text"
            name="q"
            defaultValue={q}
            maxLength={40}
            placeholder="এলাকা বা নাম"
            className="border border-ink/20 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green"
          />
          <button
            type="submit"
            className="col-span-2 bg-red-500 text-white font-semibold py-2.5 rounded-lg hover:bg-red-600 transition-colors"
          >
            🔍 খুঁজুন
          </button>
        </form>

        {donors.length > 0 && (
          <p className="text-xs text-ink/50 mb-3">
            {toBn(donors.length)} জন দেখানো হচ্ছে
            {count && count > donors.length ? ` (মোট ${toBn(count)} জন, খুঁজে সীমিত করুন)` : ''}
          </p>
        )}

        {donors.length === 0 && (
          <div className="bg-white border border-dashed border-ink/20 rounded-xl p-8 text-center">
            <p className="text-3xl mb-2">🔎</p>
            <p className="text-sm text-ink/60">
              {group || q ? 'এই খোঁজে কোনো রক্তদাতা পাওয়া যায়নি।' : 'এখনো কোনো রক্তদাতা তালিকায় যুক্ত হননি।'}
            </p>
            {(group || q) && (
              <a href="/blood/donors" className="text-green underline text-sm mt-2 inline-block">সব রক্তদাতা দেখুন</a>
            )}
          </div>
        )}

        <div className="space-y-3">
          {donors.map((d) => (
            <div key={d.id} className="bg-white border border-ink/10 rounded-xl p-3 flex items-center gap-3">
              <a href={`/blood/donors/${d.slug || d.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-12 h-12 rounded-full bg-red-50 text-red-600 font-bold flex items-center justify-center flex-shrink-0">
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
                className="bg-red-500 text-white text-sm font-medium px-3 py-2 rounded-lg flex-shrink-0 hover:bg-red-600 transition-colors"
              >
                📞 কল
              </a>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white border border-ink/10 rounded-xl p-4 text-xs text-ink/60 leading-relaxed">
          রক্তদান সম্পূর্ণ স্বেচ্ছাসেবী। রক্তের বিনিময়ে কোনো অর্থ লেনদেন করবেন না। খুঁজি শেরপুর ডোনারদের তথ্য যাচাই করে না,
          রক্ত নেওয়ার আগে হাসপাতালে গ্রুপ ও পরীক্ষা মিলিয়ে নিন।
        </div>

        <a
          href="/blood/donor"
          className="block text-center mt-6 border-2 border-green/30 text-green font-semibold py-2.5 rounded-xl hover:bg-green/5 transition-colors"
        >
          ❤️ আপনিও রক্তদাতা হিসেবে যুক্ত হন
        </a>
      </main>
    </>
  );
}
