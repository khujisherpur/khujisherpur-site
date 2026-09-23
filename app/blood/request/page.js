'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodRequestPage() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [form, setForm] = useState({
    applicantName: '', relationToPatient: '', patientName: '',
    bloodGroup: 'A+', bagsNeeded: '1', hospitalOrArea: '',
    contactPhone: '', altPhone: '', note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
    });
  }, []);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error } = await supabase.from('blood_requests').insert({
      user_id: user.id,
      applicant_name: form.applicantName,
      relation_to_patient: form.relationToPatient,
      patient_name: form.patientName,
      blood_group: form.bloodGroup,
      bags_needed: parseInt(form.bagsNeeded) || 1,
      hospital_or_area: form.hospitalOrArea,
      contact_phone: form.contactPhone,
      alt_phone: form.altPhone,
      note: form.note,
    });

    if (error) setError(error.message);
    else setSuccess(true);
    setSubmitting(false);
  }

  if (checkingAuth) return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">রক্তের অনুরোধ করতে হলে লগইন করুন।</p>
        <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">লগইন করুন</a>
      </main>
    );
  }

  if (success) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-3xl mb-4">✅</p>
        <h1 className="text-xl font-semibold mb-2">অনুরোধ পোস্ট হয়েছে!</h1>
        <p className="text-ink/70 text-sm mb-6">
          ম্যাচিং রক্তের গ্রুপের ডোনারদের নোটিফিকেশন পাঠানো হয়েছে।
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

      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🩸</span>
        <h1 className="text-xl font-semibold">রক্তের অনুরোধ করুন</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border-2 border-red-200 p-6 space-y-4">
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">আপনার নাম (আবেদনকারী)</label>
          <input
            type="text" required value={form.applicantName}
            onChange={(e) => updateField('applicantName', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">রোগীর সাথে সম্পর্ক</label>
          <input
            type="text" required value={form.relationToPatient}
            onChange={(e) => updateField('relationToPatient', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
            placeholder="যেমন: ভাই, স্বামী, বন্ধু"
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">রোগীর নাম (ঐচ্ছিক)</label>
          <input
            type="text" value={form.patientName}
            onChange={(e) => updateField('patientName', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">রক্তের গ্রুপ</label>
            <select
              required value={form.bloodGroup}
              onChange={(e) => updateField('bloodGroup', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400 bg-white"
            >
              {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">ব্যাগ সংখ্যা</label>
            <input
              type="number" min="1" required value={form.bagsNeeded}
              onChange={(e) => updateField('bagsNeeded', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">হাসপাতাল/এলাকা</label>
          <input
            type="text" required value={form.hospitalOrArea}
            onChange={(e) => updateField('hospitalOrArea', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
            placeholder="যেমন: শেরপুর সদর হাসপাতাল"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">যোগাযোগ নম্বর</label>
            <input
              type="tel" required value={form.contactPhone}
              onChange={(e) => updateField('contactPhone', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">বিকল্প নম্বর (ঐচ্ছিক)</label>
            <input
              type="tel" value={form.altPhone}
              onChange={(e) => updateField('altPhone', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">নোট (ঐচ্ছিক)</label>
          <textarea
            rows={3} value={form.note}
            onChange={(e) => updateField('note', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit" disabled={submitting}
          className="w-full bg-red-500 text-white font-semibold py-2.5 hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {submitting ? 'পাঠানো হচ্ছে...' : 'অনুরোধ পোস্ট করুন'}
        </button>
      </form>
    </main>
  );
}
