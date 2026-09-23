'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function DonorDashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donorProfile, setDonorProfile] = useState(null);
  const [newRequests, setNewRequests] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      const { data: donor } = await supabase
        .from('blood_donors')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();
      setDonorProfile(donor);
      if (donor) await loadData(data.user.id, donor.blood_group);
    }
    setLoading(false);
  }

  async function loadData(userId, bloodGroup) {
    const [{ data: requests }, { data: donations }, { data: dismissed }] = await Promise.all([
      supabase
        .from('blood_requests')
        .select('id, patient_name, blood_group, bags_needed, hospital_or_area, applicant_name, created_at')
        .eq('status', 'active')
        .eq('blood_group', bloodGroup)
        .order('created_at', { ascending: false }),
      supabase
        .from('blood_donations')
        .select('id, donated_at, blood_requests(patient_name, hospital_or_area, blood_group)')
        .eq('donor_user_id', userId)
        .order('donated_at', { ascending: false }),
      supabase
        .from('blood_request_dismissals')
        .select('blood_request_id')
        .eq('donor_user_id', userId),
    ]);

    const donatedIds = new Set((donations || []).map((d) => d.blood_requests && d.id).filter(Boolean));
    const donatedRequestIds = new Set(
      (await supabase.from('blood_donations').select('blood_request_id').eq('donor_user_id', userId)).data?.map(
        (d) => d.blood_request_id
      ) || []
    );
    const dismissedIds = new Set((dismissed || []).map((d) => d.blood_request_id));

    const filtered = (requests || []).filter(
      (r) => !donatedRequestIds.has(r.id) && !dismissedIds.has(r.id)
    );

    setNewRequests(filtered);
    setHistory(donations || []);
  }

  async function handleDonate(requestId) {
    if (!confirm('আপনি কি নিশ্চিত এই অনুরোধে রক্ত দিয়েছেন?')) return;
    const { error } = await supabase.from('blood_donations').insert({
      donor_user_id: user.id,
      blood_request_id: requestId,
    });
    if (!error) loadData(user.id, donorProfile.blood_group);
  }

  async function handleDismiss(requestId) {
    const { error } = await supabase.from('blood_request_dismissals').insert({
      donor_user_id: user.id,
      blood_request_id: requestId,
    });
    if (!error) loadData(user.id, donorProfile.blood_group);
  }

  async function handleDeleteHistory(id) {
    if (!confirm('এই এন্ট্রি মুছে ফেলতে চান?')) return;
    const { error } = await supabase.from('blood_donations').delete().eq('id', id);
    if (!error) loadData(user.id, donorProfile.blood_group);
  }

  if (loading) return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">এই পেজ দেখতে লগইন করুন।</p>
        <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">লগইন করুন</a>
      </main>
    );
  }

  if (!donorProfile) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-3xl mb-4">❤️</p>
        <p className="text-ink/70 mb-4">আপনি এখনো ডোনার হিসেবে নিবন্ধিত নন।</p>
        <a href="/blood/donor" className="inline-block bg-red-500 text-white font-semibold px-5 py-2.5">
          ডোনার হিসেবে নিবন্ধন করুন
        </a>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
        <a href="/dashboard" className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white">
          ড্যাশবোর্ড
        </a>
      </header>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🩸</span>
        <h1 className="text-2xl font-semibold">ডোনার ড্যাশবোর্ড</h1>
      </div>
      <p className="text-sm text-ink/60 mb-8">
        রক্তের গ্রুপ: <span className="font-semibold text-red-500">{donorProfile.blood_group}</span> ·{' '}
        স্ট্যাটাস: {donorProfile.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
      </p>

      {/* নতুন ম্যাচিং অনুরোধ */}
      <section className="mb-10">
        <h2 className="text-lg font-medium mb-3">নতুন অনুরোধ ({newRequests.length})</h2>
        {newRequests.length === 0 && (
          <p className="text-ink/50 text-sm py-6 text-center">
            আপনার রক্তের গ্রুপে এই মুহূর্তে কোনো অনুরোধ নেই।
          </p>
        )}
        <div className="space-y-3">
          {newRequests.map((r) => (
            <div key={r.id} className="bg-white border-l-4 border-red-400 p-4">
              <p className="font-medium">{r.hospital_or_area}</p>
              <p className="text-sm text-ink/60 mt-1">
                {r.patient_name ? `রোগী: ${r.patient_name} · ` : ''}{r.bags_needed} ব্যাগ · আবেদনকারী: {r.applicant_name}
              </p>
              <div className="flex gap-2 mt-3">
                <a
                  href={`/blood/${r.id}`}
                  className="text-sm border border-ink/20 px-3 py-1.5 hover:bg-paper"
                >
                  বিস্তারিত দেখুন
                </a>
                <button
                  onClick={() => handleDonate(r.id)}
                  className="text-sm bg-red-500 text-white px-3 py-1.5 hover:bg-red-600"
                >
                  ❤️ Donate
                </button>
                <button
                  onClick={() => handleDismiss(r.id)}
                  className="text-sm border border-ink/20 text-ink/50 px-3 py-1.5 hover:bg-paper"
                >
                  ডিলিট
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ডোনেশন হিস্টোরি */}
      <section>
        <h2 className="text-lg font-medium mb-3">আমার ডোনেশন ইতিহাস ({history.length})</h2>
        {history.length === 0 && (
          <p className="text-ink/50 text-sm py-6 text-center">এখনো কোনো ডোনেশন রেকর্ড নেই।</p>
        )}
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="bg-white border border-ink/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {h.blood_requests?.hospital_or_area || 'তথ্য পাওয়া যায়নি'}
                  </p>
                  <p className="text-sm text-ink/60 mt-1">
                    {h.blood_requests?.patient_name ? `রোগী: ${h.blood_requests.patient_name} · ` : ''}
                    রক্তের গ্রুপ: {h.blood_requests?.blood_group || '-'}
                  </p>
                  <p className="text-xs text-ink/40 mt-1">
                    {new Date(h.donated_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteHistory(h.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  ডিলিট
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
