'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import SiteHeader from '../../../components/SiteHeader';
import BottomNav from '../../../components/BottomNav';

const fmtNum = (n) => Number(n).toLocaleString('bn-BD');

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysAgo(d) {
  const n = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (n <= 0) return 'আজ';
  return `${fmtNum(n)} দিন আগে`;
}

function PageShell({ children }) {
  return (
    <>
      <SiteHeader lang="bn" simple />
      {children}
    </>
  );
}

export default function DonorDashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donorProfile, setDonorProfile] = useState(null);
  const [newRequests, setNewRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [toggling, setToggling] = useState(false);
  const [busyId, setBusyId] = useState(null);

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
        .select('id, donated_at, blood_request_id, blood_requests(patient_name, hospital_or_area, blood_group)')
        .eq('donor_user_id', userId)
        .order('donated_at', { ascending: false }),
      supabase.from('blood_request_dismissals').select('blood_request_id').eq('donor_user_id', userId),
    ]);

    const donatedRequestIds = new Set((donations || []).map((d) => d.blood_request_id).filter(Boolean));
    const dismissedIds = new Set((dismissed || []).map((d) => d.blood_request_id));

    setNewRequests(
      (requests || []).filter((r) => !donatedRequestIds.has(r.id) && !dismissedIds.has(r.id))
    );
    setHistory(donations || []);
  }

  async function toggleActive() {
    setToggling(true);
    const next = !donorProfile.is_active;
    const { data: updated, error } = await supabase
      .from('blood_donors')
      .update({ is_active: next })
      .eq('user_id', user.id)
      .select('user_id');
    setToggling(false);
    if (error || !updated || updated.length === 0) {
      alert('স্ট্যাটাস বদলানো যায়নি' + (error ? ': ' + error.message : ''));
      return;
    }
    setDonorProfile({ ...donorProfile, is_active: next });
  }

  async function handleDonate(requestId) {
    if (!confirm('আপনি কি নিশ্চিত এই অনুরোধে রক্ত দিয়েছেন?')) return;
    setBusyId(requestId);
    const { error } = await supabase.from('blood_donations').insert({
      donor_user_id: user.id,
      blood_request_id: requestId,
    });
    setBusyId(null);
    if (error) {
      alert('সেভ করা যায়নি: ' + error.message);
      return;
    }
    loadData(user.id, donorProfile.blood_group);
  }

  async function handleDismiss(requestId) {
    setBusyId(requestId);
    const { error } = await supabase.from('blood_request_dismissals').insert({
      donor_user_id: user.id,
      blood_request_id: requestId,
    });
    setBusyId(null);
    if (error) {
      alert('সরানো যায়নি: ' + error.message);
      return;
    }
    loadData(user.id, donorProfile.blood_group);
  }

  async function handleDeleteHistory(id) {
    if (!confirm('এই এন্ট্রি মুছে ফেলতে চান?')) return;
    const { error } = await supabase.from('blood_donations').delete().eq('id', id);
    if (error) {
      alert('মুছে ফেলা যায়নি: ' + error.message);
      return;
    }
    loadData(user.id, donorProfile.blood_group);
  }

  if (loading) {
    return (
      <PageShell>
        <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70 mb-4">এই পেজ দেখতে লগইন করুন।</p>
          <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5 rounded-lg">
            লগইন করুন
          </a>
        </main>
      </PageShell>
    );
  }

  if (!donorProfile) {
    return (
      <PageShell>
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="bg-white border border-ink/10 border-t-4 border-t-red-500 rounded-xl p-6">
            <p className="text-4xl mb-3">🩸</p>
            <p className="font-medium mb-1">আপনি এখনো ডোনার হিসেবে নিবন্ধিত নন</p>
            <p className="text-sm text-ink/60 mb-5">নিবন্ধন করলে আপনার রক্তের গ্রুপের অনুরোধ এখানে দেখতে পাবেন।</p>
            <a href="/blood/donor" className="inline-block bg-red-500 text-white font-semibold px-5 py-2.5 rounded-lg">
              ডোনার হিসেবে নিবন্ধন করুন
            </a>
          </div>
        </main>
        <BottomNav activeTab="account" />
      </PageShell>
    );
  }

  const active = !!donorProfile.is_active;
  const lastDonation = history[0]?.donated_at;

  return (
    <PageShell>
      <main className="max-w-2xl mx-auto px-4 py-5">
        <a href="/dashboard" className="text-sm text-ink/60 inline-block mb-3">← আমার অ্যাকাউন্ট</a>

        {/* Header card */}
        <section className="bg-gradient-to-br from-[#7F1D1D] to-[#DC2626] rounded-2xl p-4 text-white shadow-sm">
          <div className="flex items-center gap-4">
            <span className="w-16 h-16 rounded-full bg-white text-red-600 text-2xl font-bold flex items-center justify-center flex-shrink-0 shadow">
              {donorProfile.blood_group}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-white/70">ডোনার ড্যাশবোর্ড</p>
              <p className="font-semibold text-lg leading-tight">🩸 রক্তদাতা</p>
              <p className="text-xs text-white/70 truncate">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/10 rounded-xl py-2.5 text-center">
              <p className="text-xl font-semibold font-numeric">{fmtNum(history.length)}</p>
              <p className="text-[10px] text-white/70">মোট রক্তদান</p>
            </div>
            <div className="bg-white/10 rounded-xl py-2.5 text-center px-1">
              <p className="text-sm font-semibold leading-tight pt-1">{lastDonation ? daysAgo(lastDonation) : '—'}</p>
              <p className="text-[10px] text-white/70 mt-1">সর্বশেষ রক্তদান</p>
            </div>
            <div className="bg-white/10 rounded-xl py-2.5 text-center">
              <p className="text-xl font-semibold font-numeric">{fmtNum(newRequests.length)}</p>
              <p className="text-[10px] text-white/70">নতুন অনুরোধ</p>
            </div>
          </div>
        </section>

        {/* Availability */}
        <section className="bg-white border border-ink/10 rounded-xl p-3 mt-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {active ? '🟢 আপনি এখন সক্রিয়' : '⚪ আপনি এখন নিষ্ক্রিয়'}
            </p>
            <p className="text-xs text-ink/50 mt-0.5">
              {active ? 'প্রয়োজনে মানুষ আপনার সাথে যোগাযোগ করতে পারবে।' : 'ডোনার তালিকায় আপনাকে সক্রিয় দেখানো হবে না।'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={toggleActive}
            disabled={toggling}
            className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${active ? 'bg-green' : 'bg-ink/20'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-5' : ''}`}
            />
          </button>
        </section>

        {/* New requests */}
        <section className="mt-8">
          <h2 className="text-base font-semibold mb-3">
            নতুন অনুরোধ <span className="text-ink/40 font-numeric">({fmtNum(newRequests.length)})</span>
          </h2>
          {newRequests.length === 0 && (
            <div className="bg-white border border-dashed border-ink/20 rounded-xl p-6 text-center">
              <p className="text-3xl mb-1">🙌</p>
              <p className="text-ink/50 text-sm">আপনার রক্তের গ্রুপে এই মুহূর্তে কোনো অনুরোধ নেই।</p>
            </div>
          )}
          <div className="space-y-3">
            {newRequests.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border-l-4 border-l-red-500 border-t border-r border-b border-ink/10 p-3"
              >
                <div className="flex gap-3">
                  <span className="w-12 h-12 rounded-full bg-red-50 text-red-600 font-bold flex items-center justify-center flex-shrink-0">
                    {r.blood_group}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{r.hospital_or_area}</p>
                    <p className="text-xs text-ink/60 mt-1">
                      {r.patient_name ? `রোগী: ${r.patient_name} · ` : ''}
                      {fmtNum(r.bags_needed)} ব্যাগ
                    </p>
                    <p className="text-[11px] text-ink/40 mt-0.5">
                      আবেদনকারী: {r.applicant_name} · {daysAgo(r.created_at)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button
                    onClick={() => handleDonate(r.id)}
                    disabled={busyId === r.id}
                    className="col-span-2 text-xs bg-red-500 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
                  >
                    ❤️ রক্ত দিয়েছি
                  </button>
                  <a href={`/blood/${r.id}`} className="text-center text-xs border border-ink/20 py-2.5 rounded-lg">
                    বিস্তারিত
                  </a>
                </div>
                <button
                  onClick={() => handleDismiss(r.id)}
                  disabled={busyId === r.id}
                  className="w-full mt-2 text-xs text-ink/50 border border-ink/15 py-2 rounded-lg disabled:opacity-50"
                >
                  আমার তালিকা থেকে বাদ দিন
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* History */}
        <section className="mt-8">
          <h2 className="text-base font-semibold mb-3">
            আমার রক্তদানের ইতিহাস <span className="text-ink/40 font-numeric">({fmtNum(history.length)})</span>
          </h2>
          {history.length === 0 && (
            <div className="bg-white border border-dashed border-ink/20 rounded-xl p-6 text-center">
              <p className="text-3xl mb-1">📋</p>
              <p className="text-ink/50 text-sm">এখনো কোনো রক্তদান রেকর্ড নেই।</p>
            </div>
          )}
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="bg-white border border-ink/10 rounded-xl p-3 flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-red-50 text-red-600 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {h.blood_requests?.blood_group || '🩸'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm leading-tight">
                    {h.blood_requests?.hospital_or_area || 'তথ্য পাওয়া যায়নি'}
                  </p>
                  <p className="text-xs text-ink/60 mt-0.5">
                    {h.blood_requests?.patient_name ? `রোগী: ${h.blood_requests.patient_name}` : ''}
                  </p>
                  <p className="text-[11px] text-ink/40 mt-0.5">{fmtDate(h.donated_at)}</p>
                </div>
                <button
                  onClick={() => handleDeleteHistory(h.id)}
                  className="text-xs text-red-500 border border-red-200 rounded-lg px-2.5 py-1 flex-shrink-0"
                >
                  মুছুন
                </button>
              </div>
            ))}
          </div>
        </section>

        <BottomNav activeTab="account" />
        <div className="h-16" />
      </main>
    </PageShell>
  );
}
