'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodDonorPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existingDonor, setExistingDonor] = useState(null);
  const [form, setForm] = useState({ name: '', bloodGroup: 'A+', phone: '', area: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
      if (donor) {
        setExistingDonor(donor);
        setForm({ name: donor.name, bloodGroup: donor.blood_group, phone: donor.phone, area: donor.area || '' });
      }
    }
    setLoading(false);
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      user_id: user.id,
      name: form.name,
      blood_group: form.bloodGroup,
      phone: form.phone,
      area: form.area,
    };

    const { error } = existingDonor
      ? await supabase.from('blood_donors').update(payload).eq('id', existingDonor.id)
      : await supabase.from('blood_donors').insert(payload);

    if (error) setError(error.message);
    else setSuccess(true);
    setSubmitting(false);
  }

  async function toggleActive() {
    const { error } = await supabase
      .from('blood_donors')
      .update({ is_active: !existingDonor.is_active })
      .eq('id', existingDonor.id);
    if (!error) init();
  }

  if (loading) return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">ডোনার হতে হলে আগে লগইন করুন।</p>
        <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">লগইন করুন</a>
      </main>
    );
  }

  if (success) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-3xl mb-4">❤️</p>
        <h1 className="text-xl font-semibold mb-2">ধন্যবাদ!</h1>
        <p className="text-ink/70 text-sm mb-6">
          আপনি এখন একজন রক্তদাতা হিসেবে নিবন্ধিত। আপনার রক্তের গ্রুপে কারো প্রয়োজন হলে নোটিফিকেশন পাবেন।
          আপনার প্রোফাইল কখনো পাবলিকলি প্রদর্শিত হবে না।
        </p>
        <a href="/blood" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">ব্লাড পেজে ফিরে যান</a>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <header className="mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
      </header>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">❤️</span>
        <h1 className="text-xl font-semibold">
          {existingDonor ? 'ডোনার প্রোফাইল' : 'ডোনার হিসেবে নিবন্ধন করুন'}
        </h1>
      </div>
      <p className="text-xs text-ink/50 mb-6">
        🔒 আপনার প্রোফাইল কখনো পাবলিকলি ব্রাউজযোগ্য হবে না — শুধু ম্যাচিং অনুরোধ এলে আপনি নোটিফিকেশন পাবেন।
      </p>

      {existingDonor && (
        <div className="bg-green/5 border border-green/20 p-4 mb-4 flex items-center justify-between">
          <p className="text-sm">
            স্ট্যাটাস: <span className={existingDonor.is_active ? 'text-green font-medium' : 'text-ink/50'}>
              {existingDonor.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
            </span>
          </p>
          <button onClick={toggleActive} className="text-sm border border-ink/20 px-3 py-1.5 hover:bg-white">
            {existingDonor.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border-2 border-ink/10 p-6 space-y-4">
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">নাম</label>
          <input
            type="text" required value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">রক্তের গ্রুপ</label>
          <select
            required value={form.bloodGroup}
            onChange={(e) => updateField('bloodGroup', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green bg-white"
          >
            {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">ফোন নম্বর</label>
          <input
            type="tel" required value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">এলাকা</label>
          <input
            type="text" required value={form.area}
            onChange={(e) => updateField('area', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
            placeholder="যেমন: শেরপুর সদর"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit" disabled={submitting}
          className="w-full bg-green text-white font-semibold py-2.5 hover:bg-green-dark transition-colors disabled:opacity-50"
        >
          {submitting ? 'সেভ হচ্ছে...' : existingDonor ? 'আপডেট করুন' : 'নিবন্ধন করুন'}
        </button>
      </form>
    </main>
  );
}
