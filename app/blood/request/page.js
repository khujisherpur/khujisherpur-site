'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { cleanPhone, isValidBdPhone } from '../../../lib/format';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// কাঁচা ইংরেজি এরর বদলে বাংলা বার্তা; ডাটাবেস ট্রিগারের নিজের বাংলা বার্তা (সাসপেন্ড, দৈনিক সীমা) সরাসরি দেখাই
function friendlyError(err) {
  const msg = (err && err.message) || '';
  const code = err && err.code;
  if (/[\u0980-\u09FF]/.test(msg)) return msg;
  if (code === '23505' || /duplicate key|unique/i.test(msg)) {
    return 'এই অনুরোধ ইতিমধ্যে পোস্ট করা আছে';
  }
  if (/row-level security|permission denied|not authorized/i.test(msg)) {
    return 'এই কাজের অনুমতি নেই। লগআউট করে আবার লগইন করে চেষ্টা করুন';
  }
  if (/failed to fetch|networkerror|network request|load failed/i.test(msg)) {
    return 'ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন';
  }
  if (/jwt|token|session/i.test(msg)) {
    return 'আপনার সেশনের মেয়াদ শেষ। আবার লগইন করুন';
  }
  return 'কিছু একটা সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করুন';
}

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
    if (!user || submitting) return;
    if (!isValidBdPhone(form.contactPhone)) {
      setError('সঠিক যোগাযোগ নম্বর দিন (যেমন: 01XXXXXXXXX)');
      return;
    }
    if (form.altPhone && !isValidBdPhone(form.altPhone)) {
      setError('বিকল্প নম্বরটি সঠিক নয় (যেমন: 01XXXXXXXXX)');
      return;
    }
    setSubmitting(true);
    setError(null);

    const bags = Math.min(Math.max(parseInt(form.bagsNeeded) || 1, 1), 10);

    try {
      const { error } = await supabase.from('blood_requests').insert({
        user_id: user.id,
        applicant_name: form.applicantName.trim(),
        relation_to_patient: form.relationToPatient.trim(),
        patient_name: form.patientName.trim(),
        blood_group: form.bloodGroup,
        bags_needed: bags,
        hospital_or_area: form.hospitalOrArea.trim(),
        contact_phone: cleanPhone(form.contactPhone),
        alt_phone: cleanPhone(form.altPhone),
        note: form.note.trim(),
      });

      if (error) {
        console.error('blood request error', error);
        setError(friendlyError(error));
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('blood request error', err);
      setError(friendlyError(err));
    }
    setSubmitting(false);
  }

  if (checkingAuth) return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">রক্তের অনুরোধ করতে হলে লগইন করুন।</p>
        <a href="/login?next=%2Fblood%2Frequest" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">লগইন করুন</a>
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
            type="text" required maxLength={80} value={form.applicantName}
            onChange={(e) => updateField('applicantName', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">রোগীর সাথে সম্পর্ক</label>
          <input
            type="text" required maxLength={40} value={form.relationToPatient}
            onChange={(e) => updateField('relationToPatient', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
            placeholder="যেমন: ভাই, স্বামী, বন্ধু"
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">রোগীর নাম (ঐচ্ছিক)</label>
          <input
            type="text" maxLength={80} value={form.patientName}
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
              type="number" min="1" max="10" required value={form.bagsNeeded}
              onChange={(e) => updateField('bagsNeeded', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">হাসপাতাল/এলাকা</label>
          <input
            type="text" required maxLength={120} value={form.hospitalOrArea}
            onChange={(e) => updateField('hospitalOrArea', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
            placeholder="যেমন: শেরপুর সদর হাসপাতাল"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">যোগাযোগ নম্বর</label>
            <input
              type="tel" required inputMode="tel" maxLength={20} value={form.contactPhone}
              onChange={(e) => updateField('contactPhone', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
              placeholder="01XXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">বিকল্প নম্বর (ঐচ্ছিক)</label>
            <input
              type="tel" inputMode="tel" maxLength={20} value={form.altPhone}
              onChange={(e) => updateField('altPhone', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-red-400"
              placeholder="01XXXXXXXXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">নোট (ঐচ্ছিক)</label>
          <textarea
            rows={3} maxLength={500} value={form.note}
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
