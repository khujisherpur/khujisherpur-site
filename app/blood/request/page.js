'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { cleanPhone, isValidBdPhone } from '../../../lib/format';
import SiteHeader from '../../../components/SiteHeader';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const inputCls = 'w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-red-400 bg-white';
const labelCls = 'block text-sm mb-1.5 text-ink/70';

function friendlyError(err) {
  const msg = (err && err.message) || '';
  const code = err && err.code;
  if (/[\u0980-\u09FF]/.test(msg)) return msg;
  if (code === '23505' || /duplicate key|unique/i.test(msg)) return 'এই অনুরোধ ইতিমধ্যে পোস্ট করা আছে';
  if (/row-level security|permission denied|not authorized/i.test(msg)) return 'এই কাজের অনুমতি নেই। লগআউট করে আবার লগইন করে চেষ্টা করুন';
  if (/failed to fetch|networkerror|network request|load failed/i.test(msg)) return 'ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন';
  if (/jwt|token|session/i.test(msg)) return 'আপনার সেশনের মেয়াদ শেষ। আবার লগইন করুন';
  return 'কিছু একটা সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করুন';
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-red-100 rounded-2xl p-4 space-y-4 shadow-sm">
      <h2 className="text-sm font-semibold text-red-600">{title}</h2>
      {children}
    </div>
  );
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function BloodRequestForm() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [form, setForm] = useState({
    applicantName: '', relationToPatient: '', patientName: '', patientProblem: '',
    bloodGroup: 'A+', bagsNeeded: '1', hemoglobin: '',
    hospitalOrArea: '', donationDate: '', donationTime: '',
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
        patient_problem: form.patientProblem.trim(),
        blood_group: form.bloodGroup,
        bags_needed: bags,
        hemoglobin: form.hemoglobin.trim() || null,
        hospital_or_area: form.hospitalOrArea.trim(),
        donation_date: form.donationDate || null,
        donation_time: form.donationTime.trim() || null,
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
    <main className="max-w-xl mx-auto px-4 py-6">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩸</span>
          <h1 className="text-xl font-semibold">জরুরি রক্তের অনুরোধ</h1>
        </div>
        <p className="text-xs text-ink/50 mt-1">সঠিক তথ্য দিন, যাতে রক্তদাতারা দ্রুত সাড়া দিতে পারেন।</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Section title="👤 আবেদনকারীর তথ্য">
          <div>
            <label className={labelCls}>আপনার নাম</label>
            <input type="text" required maxLength={80} value={form.applicantName}
              onChange={(e) => updateField('applicantName', e.target.value)}
              className={inputCls} placeholder="যেমন: রফিকুল ইসলাম" />
          </div>
          <div>
            <label className={labelCls}>রোগীর সাথে সম্পর্ক</label>
            <input type="text" required maxLength={40} value={form.relationToPatient}
              onChange={(e) => updateField('relationToPatient', e.target.value)}
              className={inputCls} placeholder="যেমন: ভাই, স্বামী, ছেলে, বন্ধু" />
          </div>
          <div>
            <label className={labelCls}>রোগীর নাম (ঐচ্ছিক)</label>
            <input type="text" maxLength={80} value={form.patientName}
              onChange={(e) => updateField('patientName', e.target.value)}
              className={inputCls} placeholder="যেমন: মোছাঃ রহিমা খাতুন" />
          </div>
        </Section>

        <Section title="🩸 রক্তের তথ্য">
          <div>
            <label className={labelCls}>রোগীর সমস্যা</label>
            <input type="text" required maxLength={200} value={form.patientProblem}
              onChange={(e) => updateField('patientProblem', e.target.value)}
              className={inputCls} placeholder="যেমন: অপারেশন, ডেঙ্গু, থ্যালাসেমিয়া, প্রসূতি মা" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>রক্তের গ্রুপ</label>
              <select required value={form.bloodGroup}
                onChange={(e) => updateField('bloodGroup', e.target.value)}
                className={inputCls}>
                {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>কত ব্যাগ রক্ত লাগবে</label>
              <input type="number" min="1" max="10" required value={form.bagsNeeded}
                onChange={(e) => updateField('bagsNeeded', e.target.value)}
                className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>হিমোগ্লোবিন (ঐচ্ছিক)</label>
            <input type="text" inputMode="decimal" maxLength={10} value={form.hemoglobin}
              onChange={(e) => updateField('hemoglobin', e.target.value)}
              className={inputCls} placeholder="যেমন: ৭.৫ (জানা না থাকলে ফাঁকা রাখুন)" />
          </div>
        </Section>

        <Section title="📍 কোথায় ও কখন">
          <div>
            <label className={labelCls}>হাসপাতাল / এলাকা</label>
            <input type="text" required maxLength={120} value={form.hospitalOrArea}
              onChange={(e) => updateField('hospitalOrArea', e.target.value)}
              className={inputCls} placeholder="যেমন: শেরপুর সদর হাসপাতাল, ২ নং ওয়ার্ড" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>রক্তদানের তারিখ</label>
              <input type="date" required min={todayStr()} value={form.donationDate}
                onChange={(e) => updateField('donationDate', e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>রক্তদানের সময়</label>
              <input type="text" maxLength={40} value={form.donationTime}
                onChange={(e) => updateField('donationTime', e.target.value)}
                className={inputCls} placeholder="যেমন: সকাল ১০টা" />
            </div>
          </div>
        </Section>

        <Section title="📞 যোগাযোগ">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>যোগাযোগ নম্বর</label>
              <input type="tel" required inputMode="tel" maxLength={20} value={form.contactPhone}
                onChange={(e) => updateField('contactPhone', e.target.value)}
                className={inputCls} placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label className={labelCls}>বিকল্প নম্বর (ঐচ্ছিক)</label>
              <input type="tel" inputMode="tel" maxLength={20} value={form.altPhone}
                onChange={(e) => updateField('altPhone', e.target.value)}
                className={inputCls} placeholder="01XXXXXXXXX" />
            </div>
          </div>
        </Section>

        <Section title="📝 অতিরিক্ত নোট (ঐচ্ছিক)">
          <textarea rows={4} maxLength={500} value={form.note}
            onChange={(e) => updateField('note', e.target.value)}
            className={inputCls + ' resize-none'}
            placeholder={'উদাহরণ: রোগীর কাল সকালে অপারেশন। কেবিন নম্বর ৫। হাসপাতালে এসে ফোন করলে আমি নিচে এসে নিয়ে যাব। দ্রুত যোগাযোগ করুন।'} />
        </Section>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
          {submitting ? 'পাঠানো হচ্ছে...' : '🩸 অনুরোধ পোস্ট করুন'}
        </button>
      </form>
    </main>
  );
}

export default function BloodRequestPage() {
  return (
    <>
      <SiteHeader lang="bn" simple />
      <BloodRequestForm />
    </>
  );
}
