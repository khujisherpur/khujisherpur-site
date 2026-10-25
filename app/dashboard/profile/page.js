'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import SiteHeader from '../../../components/SiteHeader';
import BottomNav from '../../../components/BottomNav';
import PageSkeleton from '../../../components/PageSkeleton';
import { cleanPhone, isValidBdPhone } from '../../../lib/format';

function PageShell({ children }) {
  return (
    <>
      <SiteHeader lang="bn" simple />
      {children}
    </>
  );
}

const normName = (s) => s.trim().replace(/\s+/g, ' ');
const normPhone = (s) => (s.trim() ? cleanPhone(s) : '');

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [phone, setPhone] = useState('');
  const [savedPhone, setSavedPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      const { data: rows } = await supabase.rpc('get_my_account');
      const prof = (rows && rows[0]) || null;
      const n = prof?.name || '';
      const p = prof?.phone || '';
      setName(n);
      setSavedName(n);
      setPhone(p);
      setSavedPhone(p);
    }
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!user || saving) return;
    const cleanName = normName(name);
    if (cleanName.length < 2) {
      setError('নাম অন্তত ২ অক্ষরের হতে হবে');
      return;
    }
    if (phone.trim() && !isValidBdPhone(phone)) {
      setError('সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)');
      return;
    }
    const cleanedPhone = normPhone(phone);
    setSaving(true);
    setError(null);
    setSaved(false);
    const { data: updated, error: err } = await supabase
      .from('users')
      .update({ name: cleanName, phone: cleanedPhone || null })
      .eq('id', user.id)
      .select('id');
    setSaving(false);
    if (err || !updated || updated.length === 0) {
      setError('সেভ করা যায়নি, একটু পরে আবার চেষ্টা করুন');
      return;
    }
    setName(cleanName);
    setSavedName(cleanName);
    setPhone(cleanedPhone);
    setSavedPhone(cleanedPhone);
    setSaved(true);
  }

  if (loading) {
    return (
      <PageShell>
        <PageSkeleton />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70 mb-4">এই পেজ দেখতে লগইন করুন।</p>
          <a
            href="/login?next=%2Fdashboard%2Fprofile"
            className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5 rounded-lg"
          >
            লগইন করুন
          </a>
        </main>
      </PageShell>
    );
  }

  const changed = normName(name) !== savedName || normPhone(phone) !== savedPhone;

  return (
    <PageShell>
      <main className="max-w-xl mx-auto px-4 py-5">
        <a href="/dashboard" className="text-sm text-ink/60 inline-block mb-3">← আমার অ্যাকাউন্ট</a>
        <h1 className="text-xl font-semibold mb-4">আমার প্রোফাইল</h1>

        <form
          onSubmit={handleSave}
          className="bg-white border border-ink/10 border-t-4 border-t-green rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="w-14 h-14 rounded-full bg-[#EEF1F8] text-green-dark text-2xl font-semibold flex items-center justify-center flex-shrink-0">
              {(name.trim() || user.email || '?').charAt(0).toUpperCase()}
            </span>
            <p className="text-xs text-ink/50">নামের প্রথম অক্ষর আপনার ছবির জায়গায় দেখা যায়।</p>
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-ink/70">আপনার নাম</label>
            <input
              type="text"
              required
              maxLength={60}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
              placeholder="যেমন: রহিম উদ্দিন"
            />
            <p className="text-[11px] text-ink/45 mt-1.5">
              এই নাম আপনার অ্যাকাউন্ট পেজে দেখা যায়। ডোনার হিসেবে দেওয়া নাম আলাদা, সেটা ডোনার নিবন্ধনে থাকে।
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-ink/70">মোবাইল নম্বর</label>
            <input
              type="tel"
              inputMode="tel"
              maxLength={20}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSaved(false);
              }}
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
              placeholder="01XXXXXXXXX"
            />
            <p className="text-[11px] text-ink/45 mt-1.5">
              পোস্ট বা প্রোভাইডার প্রোফাইলে দেওয়া ফোন আলাদা, সেটা সেই পোস্ট বা প্রোফাইল এডিট করে বদলাতে হয়।
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-ink/70">ইমেইল</label>
            <input
              type="text"
              disabled
              value={user.email || ''}
              className="w-full border border-ink/10 rounded-lg px-3 py-2.5 bg-paper text-ink/50"
            />
            <p className="text-[11px] text-ink/45 mt-1.5">লগইনের ইমেইল এখান থেকে বদলানো যায় না।</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          {saved && !changed && (
            <p className="text-sm text-green bg-green/10 rounded-lg px-3 py-2">✓ সেভ হয়েছে</p>
          )}

          <button
            type="submit"
            disabled={saving || !changed}
            className="w-full bg-marigold text-ink font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </button>
        </form>

        <BottomNav activeTab="account" />
        <div className="h-16" />
      </main>
    </PageShell>
  );
}
