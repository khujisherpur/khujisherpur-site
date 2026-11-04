export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabaseClient';
import SiteHeader from '../../../components/SiteHeader';
import { badgeFor } from '../../../lib/donor';

export const metadata = {
  title: 'শেরপুর জেলার সেরা রক্তদাতা | খুঁজি শেরপুর',
  description: 'শেরপুর জেলার সর্বাধিক রক্তদানকারী স্বেচ্ছাসেবীদের তালিকা।',
};

const UPAZILAS = ['শেরপুর সদর', 'নকলা', 'নালিতাবাড়ী', 'ঝিনাইগাতী', 'শ্রীবরদী'];
const bn = (n) => Number(n).toLocaleString('bn-BD');
const MEDALS = ['🥇', '🥈', '🥉'];

export default async function LeaderboardPage({ searchParams }) {
  const picked = UPAZILAS.includes(searchParams?.upazila) ? searchParams.upazila : '';

  let q = supabase
    .from('public_donor_stats')
    .select('donor_id, slug, name, blood_group, area, upazila, site_count, last_donated_at, org_name')
    .gt('site_count', 0)
    .order('site_count', { ascending: false })
    .order('last_donated_at', { ascending: false })
    .limit(50);
  if (picked) q = q.eq('upazila', picked);

  const { data } = await q;
  const rows = data || [];

  const tabs = [{ label: 'সব উপজেলা', value: '' }, ...UPAZILAS.map((u) => ({ label: u, value: u }))];

  return (
    <>
      <SiteHeader lang="bn" simple />
      <main className="max-w-2xl mx-auto px-4 pb-16">
        <a href="/blood" className="inline-block mt-5 text-sm text-ink/50">← ব্লাড পেজ</a>

        <section className="mt-3 bg-gradient-to-br from-[#7F1D1D] to-[#DC2626] text-white rounded-2xl p-5">
          <p className="text-[11px] text-white/70">লিডারবোর্ড</p>
          <h1 className="text-xl font-semibold mt-0.5">🏆 শেরপুর জেলার সেরা রক্তদাতা</h1>
          <p className="text-xs text-white/70 mt-1">
            শুধু খুঁজি শেরপুরে নথিভুক্ত দান গোনা হয়। সাইটের বাইরের দান এখানে ধরা হয় না।
          </p>
        </section>

        <div className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4">
          {tabs.map((t) => {
            const on = picked === t.value;
            return (
              <a
                key={t.label}
                href={t.value ? `/blood/leaderboard?upazila=${encodeURIComponent(t.value)}` : '/blood/leaderboard'}
                className={`whitespace-nowrap text-sm px-3.5 py-1.5 rounded-full border ${
                  on ? 'bg-red-600 text-white border-red-600' : 'bg-white text-ink/70 border-ink/15'
                }`}
              >
                {t.label}
              </a>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <div className="bg-white border border-dashed border-ink/20 rounded-xl p-8 text-center">
            <p className="text-3xl mb-1">🩸</p>
            <p className="text-sm text-ink/50">
              {picked ? `${picked}-এ` : ''} এখনো কোনো রক্তদান নথিভুক্ত হয়নি।
            </p>
          </div>
        ) : (
          <ol className="space-y-2.5">
            {rows.map((r, i) => {
              const b = badgeFor(r.site_count);
              return (
                <li key={r.donor_id}>
                  <a
                    href={`/blood/donors/${r.slug || r.donor_id}`}
                    className={`flex items-center gap-3 bg-white rounded-xl p-3 border ${
                      i < 3 ? 'border-red-200' : 'border-ink/10'
                    }`}
                  >
                    <span className="w-8 text-center text-lg font-bold flex-shrink-0">
                      {i < 3 ? MEDALS[i] : <span className="text-sm text-ink/40 font-numeric">{bn(i + 1)}</span>}
                    </span>
                    <span className="w-11 h-11 rounded-full bg-red-50 text-red-600 font-bold flex items-center justify-center flex-shrink-0">
                      {r.blood_group}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight truncate">{r.name}</p>
                      <p className="text-xs text-ink/50 mt-0.5 truncate">
                      {[r.area, r.upazila].filter(Boolean).join(', ') || '—'}
                      </p>
                      {r.org_name && (
                        <p className="text-[11px] text-ink/60 mt-0.5 truncate">🏥 {r.org_name}</p>
                      )}
                      <span className="inline-block text-[10px] bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded-full mt-1">
                        {b.icon} {b.name}
                      </span>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <p className="text-xl font-bold text-red-600 font-numeric leading-none">{bn(r.site_count)}</p>
                      <p className="text-[10px] text-ink/50 mt-1">বার</p>
                    </div>
                  </a>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </>
  );
}
