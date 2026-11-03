export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { cleanPhone, waLink } from '../../../../lib/format';
import SiteHeader from '../../../../components/SiteHeader';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// RLS-এর কারণে শুধু পাবলিক ও সক্রিয় ডোনারই পাওয়া যাবে
const getDonor = cache(async (id) => {
  if (typeof id !== 'string' || !UUID_RE.test(id)) return null;
  const { data } = await supabase
    .from('blood_donors')
    .select('id, name, blood_group, phone, area, created_at')
    .eq('id', id)
    .eq('is_public', true)
    .eq('is_active', true)
    .maybeSingle();
  return data || null;
});

export async function generateMetadata({ params }) {
  const donor = await getDonor(params.id);
  const robots = { index: false, follow: false };
  if (!donor) return { title: 'পাওয়া যায়নি — খুঁজি শেরপুর', robots };
  return {
    title: `${donor.blood_group} রক্তদাতা — ${donor.name} | খুঁজি শেরপুর`,
    description: 'শেরপুরের স্বেচ্ছাসেবী রক্তদাতার প্রোফাইল।',
    robots,
  };
}

function Row({ label, children }) {
  return (
    <div>
      <p className="text-ink/50">{label}</p>
      <div className="font-medium">{children}</div>
    </div>
  );
}

export default async function DonorProfilePage({ params }) {
  if (typeof params.id !== 'string' || !UUID_RE.test(params.id)) notFound();
  const donor = await getDonor(params.id);

  if (!donor) {
    return (
      <>
        <SiteHeader lang="bn" simple />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70">এই রক্তদাতার প্রোফাইল পাওয়া যায়নি বা এখন দেখানো হচ্ছে না।</p>
          <a href="/blood/donors" className="text-green underline mt-2 inline-block">রক্তদাতা তালিকায় ফিরে যান</a>
        </main>
      </>
    );
  }

  const wa = waLink(donor.phone);

  return (
    <>
      <SiteHeader lang="bn" simple />
      <main className="max-w-2xl mx-auto px-4 pb-16">
        <a href="/blood/donors" className="inline-block mt-5 text-sm text-ink/50 hover:text-ink">← রক্তদাতা তালিকা</a>

        <div className="bg-white border-2 border-red-200 rounded-2xl mt-4 overflow-hidden">
          <div className="bg-gradient-to-br from-[#7F1D1D] to-[#DC2626] text-white px-5 py-5 flex items-center gap-4">
            <span className="w-16 h-16 rounded-full bg-white text-red-600 text-2xl font-bold flex items-center justify-center flex-shrink-0 shadow">
              {donor.blood_group}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-white/70">স্বেচ্ছাসেবী রক্তদাতা</p>
              <h1 className="font-semibold text-lg leading-tight break-words">{donor.name}</h1>
              <span className="inline-block text-[10px] bg-white/20 px-2 py-0.5 rounded-full mt-1">● রক্তদানে প্রস্তুত</span>
            </div>
          </div>

          <div className="p-5">
            <div className="space-y-3 text-sm">
              <Row label="রক্তের গ্রুপ">{donor.blood_group}</Row>
              <Row label="এলাকা">{donor.area || '—'}</Row>
              <Row label="ফোন"><span className="font-numeric">{donor.phone}</span></Row>
            </div>

            <div className="mt-6 space-y-2">
              <a
                href={`tel:${cleanPhone(donor.phone)}`}
                className="block text-center bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors"
              >
                📞 কল করুন
              </a>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center border border-ink/20 py-3 rounded-xl hover:bg-paper transition-colors"
                >
                  💬 WhatsApp-এ মেসেজ
                </a>
              )}
            </div>

            <p className="mt-6 text-xs text-ink/50 leading-relaxed">
              রক্তদান সম্পূর্ণ স্বেচ্ছাসেবী। রক্তের বিনিময়ে কোনো অর্থ লেনদেন করবেন না। খুঁজি শেরপুর তথ্য যাচাই করে না,
              রক্ত নেওয়ার আগে হাসপাতালে গ্রুপ ও পরীক্ষা মিলিয়ে নিন।
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
