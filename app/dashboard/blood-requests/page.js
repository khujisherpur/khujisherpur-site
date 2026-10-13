'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import SiteHeader from '../../../components/SiteHeader';
import BottomNav from '../../../components/BottomNav';

const fmtNum = (n) => Number(n).toLocaleString('bn-BD');

function daysAgo(d) {
  const n = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (n <= 0) return 'আজ';
  return `${fmtNum(n)} দিন আগে`;
}

const statusText = {
  active: 'চলছে',
  fulfilled: 'রক্ত পাওয়া গেছে',
  expired: 'মেয়াদ শেষ',
};

const statusStyle = {
  active: 'bg-green/10 text-green',
  fulfilled: 'bg-ink/5 text-ink/50',
  expired: 'bg-ink/5 text-ink/50',
};

function PageShell({ children }) {
  return (
    <>
      <SiteHeader lang="bn" simple />
      {children}
    </>
  );
}

export default function MyBloodRequestsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) await loadRequests(data.user.id);
    setLoading(false);
  }

  async function loadRequests(userId) {
    const { data } = await supabase
      .from('blood_requests')
      .select('id, patient_name, blood_group, bags_needed, hospital_or_area, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setRequests(data || []);
  }

  async function handleFulfilled(id) {
    if (!confirm('রক্ত পেয়ে গেছেন? অনুরোধটি সবার তালিকা থেকে সরে যাবে।')) return;
    setBusyId(id);
    const { data: updated, error } = await supabase
      .from('blood_requests')
      .update({ status: 'fulfilled' })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id');
    setBusyId(null);
    if (error || !updated || updated.length === 0) {
      alert('সেভ করা যায়নি' + (error ? ': ' + error.message : ''));
      return;
    }
    loadRequests(user.id);
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
          <a
            href="/login?next=%2Fdashboard%2Fblood-requests"
            className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5 rounded-lg"
          >
            লগইন করুন
          </a>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="max-w-2xl mx-auto px-4 py-5">
        <a href="/dashboard" className="text-sm text-ink/60 inline-block mb-3">← আমার অ্যাকাউন্ট</a>
        <h1 className="text-xl font-semibold">🩸 আমার রক্তের অনুরোধ</h1>
        <p className="text-xs text-ink/50 mt-1 mb-4">
          রক্ত পেয়ে গেলে "রক্ত পেয়েছি" চাপুন, তাহলে অনুরোধটি আর কাউকে দেখাবে না।
        </p>

        {requests.length === 0 && (
          <div className="bg-white border border-dashed border-ink/20 rounded-xl p-6 text-center">
            <p className="text-3xl mb-1">📋</p>
            <p className="text-ink/50 text-sm mb-3">আপনি এখনো কোনো রক্তের অনুরোধ দেননি।</p>
            <a
              href="/blood/request"
              className="inline-block bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-full"
            >
              রক্ত চাই
            </a>
          </div>
        )}

        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border-l-4 border-l-red-500 border-t border-r border-b border-ink/10 p-3"
            >
              <div className="flex gap-3">
                <span className="w-12 h-12 rounded-full bg-red-50 text-red-600 font-bold flex items-center justify-center flex-shrink-0">
                  {r.blood_group}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{r.hospital_or_area}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                        statusStyle[r.status] || 'bg-paper text-ink/50'
                      }`}
                    >
                      {statusText[r.status] || r.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink/60 mt-1">
                    {r.patient_name ? `রোগী: ${r.patient_name} · ` : ''}
                    {fmtNum(r.bags_needed)} ব্যাগ
                  </p>
                  <p className="text-[11px] text-ink/40 mt-0.5">{daysAgo(r.created_at)}</p>
                </div>
              </div>

              {r.status === 'active' && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button
                    onClick={() => handleFulfilled(r.id)}
                    disabled={busyId === r.id}
                    className="col-span-2 text-xs bg-green text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
                  >
                    ✅ রক্ত পেয়েছি
                  </button>
                  <a href={`/blood/${r.id}`} className="text-center text-xs border border-ink/20 py-2.5 rounded-lg">
                    দেখুন
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        <BottomNav activeTab="account" />
        <div className="h-16" />
      </main>
    </PageShell>
  );
}
