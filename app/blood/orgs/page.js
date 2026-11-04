export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabaseClient';
import { cleanPhone, toBn } from '../../../lib/format';
import SiteHeader from '../../../components/SiteHeader';

export const metadata = {
  title: 'রক্ত সংস্থা — খুঁজি শেরপুর',
  description: 'শেরপুরের রক্তদাতা সংস্থাগুলোর নাম, ঠিকানা, ফোন নম্বর ও সদস্য সংখ্যা।',
};

export default async function OrgsPage() {
  const { data } = await supabase
    .from('blood_orgs')
    .select('id, name, address, upazila, phone, logo_url')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(100);
  const orgs = data || [];

  let counts = new Map();
  if (orgs.length > 0) {
    const { data: stats } = await supabase
      .from('public_org_stats')
      .select('org_id, member_count')
      .in('org_id', orgs.map((o) => o.id));
    counts = new Map((stats || []).map((s) => [s.org_id, Number(s.member_count) || 0]));
  }

  return (
    <>
      <SiteHeader lang="bn" simple />
      <main className="max-w-2xl mx-auto px-4 pb-16">
        <a href="/blood" className="inline-block mt-5 text-sm text-ink/50">← ব্লাড পেজ</a>
        <h1 className="mt-3 text-xl font-semibold">🏥 রক্ত সংস্থা</h1>
        <p className="text-xs text-ink/50 mt-1">শেরপুরের রক্তদাতা সংস্থা। কার্ডে চাপলে সংস্থার পেজ খুলবে।</p>

        {orgs.length === 0 && (
          <div className="mt-5 bg-white border border-dashed border-ink/20 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-1">🏥</p>
            <p className="text-sm text-ink/50">এখনো কোনো সংস্থা যুক্ত হয়নি।</p>
          </div>
        )}

        <div className="space-y-3 mt-4">
          {orgs.map((o) => (
            <div key={o.id} className="bg-white border border-ink/10 rounded-2xl p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
              <a href={`/blood/orgs/${o.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                {o.logo_url ? (
                  <img src={o.logo_url} alt="" className="w-14 h-14 rounded-full object-cover border border-ink/10 flex-shrink-0 bg-white" />
                ) : (
                  <span className="w-14 h-14 rounded-full bg-red-50 text-red-600 text-2xl flex items-center justify-center flex-shrink-0">🩸</span>
                )}
                <span className="min-w-0">
                  <span className="block font-semibold leading-tight">{o.name}</span>
                  <span className="block text-xs text-ink/60 mt-0.5 truncate">
                    📍 {[o.address, o.upazila].filter(Boolean).join(', ')}
                  </span>
                  <span className="inline-block text-[11px] bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded-full mt-1">
                    👥 {toBn(counts.get(o.id) || 0)} জন সদস্য
                  </span>
                </span>
              </a>
              <a
                href={`tel:${cleanPhone(o.phone)}`}
                className="bg-gradient-to-br from-[#B91C1C] to-[#EF4444] text-white text-sm font-medium px-3 py-2 rounded-xl flex-shrink-0"
              >
                📞 কল
              </a>
            </div>
          ))}
        </div>

        <a href="/blood/org" className="block mt-6 text-center border-2 border-green/30 text-green font-semibold py-2.5 rounded-xl">
          ➕ আপনার সংস্থা যোগ করুন
        </a>
      </main>
    </>
  );
}
