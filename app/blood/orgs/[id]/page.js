export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { cleanPhone, toBn } from '../../../../lib/format';
import SiteHeader from '../../../../components/SiteHeader';
import ShareInvite from '../../../../components/ShareInvite';
import DonorReadyTag from '../../../../components/DonorReadyTag';
import { badgeFor } from '../../../../lib/donor';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// RLS-এর কারণে শুধু অনুমোদিত সংস্থা পাওয়া যাবে
const getOrg = cache(async (id) => {
  if (!UUID_RE.test(String(id || ''))) return null;
  const { data } = await supabase
    .from('blood_orgs')
    .select('id, name, address, upazila, phone, logo_url')
    .eq('id', id)
    .eq('is_approved', true)
    .maybeSingle();
  return data || null;
});

export async function generateMetadata({ params }) {
  const org = await getOrg(params.id);
  const robots = { index: false, follow: true };
  if (!org) return { title: 'পাওয়া যায়নি — খুঁজি শেরপুর', robots };
  return { title: `${org.name} | রক্ত সংস্থা — খুঁজি শেরপুর`, robots };
}

export default async function OrgPage({ params }) {
  const org = await getOrg(params.id);

  if (!org) {
    return (
      <>
        <SiteHeader lang="bn" simple />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70">এই সংস্থা পাওয়া যায়নি বা এখন দেখানো হচ্ছে না।</p>
          <a href="/blood/orgs" className="text-green underline mt-2 inline-block">সংস্থার তালিকায় ফিরে যান</a>
        </main>
      </>
    );
  }

  const { data: membersRaw } = await supabase
    .from('public_donor_stats')
    .select('donor_id, slug, name, blood_group, phone, area, upazila, site_count, last_donated_at')
    .eq('org_id', org.id)
    .order('site_count', { ascending: false })
    .limit(100);
  const members = membersRaw || [];

  const { data: stat } = await supabase
    .from('public_org_stats')
    .select('member_count')
    .eq('org_id', org.id)
    .maybeSingle();
  const memberCount = Number(stat?.member_count) || members.length;

  return (
    <>
      <SiteHeader lang="bn" simple />
      <main className="max-w-2xl mx-auto px-4 pb-16">
        <a href="/blood/orgs" className="inline-block mt-5 text-sm text-ink/50">← সংস্থার তালিকা</a>

        <div className="bg-white border-2 border-red-200 rounded-2xl mt-4 overflow-hidden">
          <div className="bg-gradient-to-br from-[#7F1D1D] to-[#DC2626] text-white px-5 py-5 flex items-center gap-4">
            {org.logo_url ? (
              <img src={org.logo_url} alt="" className="w-16 h-16 rounded-full object-cover bg-white flex-shrink-0 shadow" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-white text-red-600 text-3xl flex items-center justify-center flex-shrink-0 shadow">🩸</span>
            )}
            <div className="min-w-0">
              <p className="text-[11px] text-white/70">রক্ত সংস্থা</p>
              <h1 className="font-semibold text-lg leading-tight break-words">{org.name}</h1>
              <span className="inline-block text-[10px] bg-white/20 px-2 py-0.5 rounded-full mt-1">
                👥 {toBn(memberCount)} জন সদস্য
              </span>
            </div>
          </div>

          <div className="p-5">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-ink/50">ঠিকানা</p>
                <p className="font-medium">{[org.address, org.upazila].filter(Boolean).join(', ')}</p>
              </div>
              <div>
                <p className="text-ink/50">ফোন</p>
                <p className="font-medium font-numeric">{org.phone}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <a
                href={`tel:${cleanPhone(org.phone)}`}
                className="block text-center bg-red-500 text-white font-semibold py-3 rounded-xl"
              >
                📞 কল করুন
              </a>
              <a
                href={`/blood/donor?org=${org.id}`}
                className="block text-center border-2 border-green/30 text-green font-semibold py-3 rounded-xl"
              >
                ❤️ সদস্য হয়ে নিবন্ধন করুন
              </a>
            </div>
          </div>
        </div>

        <ShareInvite
          small="সংস্থার লিংক"
          title="বন্ধুদের সাথে শেয়ার করুন"
          desc="লিংক থেকে নিবন্ধন করলে এই সংস্থার সদস্য হবে"
          shareText={`${org.name}-এর রক্তদাতা সদস্য হতে লিংকে যান।`}
          copiedText="কপি হয়েছে"
          shareUrl={`https://khujisherpur.com/blood/orgs/${org.id}`}
        />

        <h2 className="text-base font-semibold mt-8 mb-3">
          সদস্য রক্তদাতা <span className="text-ink/40">({toBn(memberCount)})</span>
        </h2>

        {members.length === 0 && (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-6 text-center">
            <p className="text-3xl mb-1">🩸</p>
            <p className="text-sm text-ink/50">এখনো কোনো সদস্য নেই।</p>
          </div>
        )}

        <div className="space-y-3">
          {members.map((d) => {
            const b = badgeFor(d.site_count);
            return (
              <div key={d.donor_id} className="bg-white border border-ink/10 rounded-2xl p-3 flex items-center gap-3">
                <a href={`/blood/donors/${d.slug || d.donor_id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B91C1C] to-[#EF4444] text-white font-bold flex items-center justify-center flex-shrink-0 shadow">
                    {d.blood_group}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold truncate">{d.name}</span>
                    <span className="block text-xs text-ink/60 truncate">
                      📍 {[d.area, d.upazila].filter(Boolean).join(', ') || '—'}
                    </span>
                    <span className="inline-block text-[10px] bg-red-50 text-red-700 font-semibold px-1.5 py-0.5 rounded-full mt-1">
                      {b.icon} {b.name}
                    </span>
                    <DonorReadyTag lastDonatedAt={d.last_donated_at} />
                  </span>
                </a>
                <a
                  href={`tel:${cleanPhone(d.phone)}`}
                  className="bg-gradient-to-br from-[#B91C1C] to-[#EF4444] text-white text-sm font-medium px-3 py-2 rounded-xl flex-shrink-0"
                >
                  📞 কল
                </a>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
