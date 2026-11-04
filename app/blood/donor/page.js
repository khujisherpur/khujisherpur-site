'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { cleanPhone, isValidBdPhone } from '../../../lib/format';
import SiteHeader from '../../../components/SiteHeader';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const upazilas = ['শেরপুর সদর', 'নকলা', 'নালিতাবাড়ী', 'ঝিনাইগাতী', 'শ্রীবরদী'];

// কাঁচা ইংরেজি এরর বদলে বাংলা বার্তা; ডাটাবেস ট্রিগারের নিজের বাংলা বার্তা (সাসপেন্ড, সীমা) সরাসরি দেখাই
function friendlyError(err) {
  const msg = (err && err.message) || '';
  const code = err && err.code;
  if (/[\u0980-\u09FF]/.test(msg)) return msg;
  if (code === '23505' || /duplicate key|unique/i.test(msg)) {
    return 'আপনি ইতিমধ্যে ডোনার হিসেবে নিবন্ধিত। পাতাটি রিফ্রেশ করে প্রোফাইল আপডেট করুন';
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
  return 'কিছু একটা সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করুন' + (msg ? ' [' + (code || '') + ' ' + msg.slice(0, 140) + ']' : '');
}

function BloodDonorForm() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existingDonor, setExistingDonor] = useState(null);
  const [form, setForm] = useState({ name: '', bloodGroup: 'A+', phone: '', area: '', upazila: '', isPublic: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [invite, setInvite] = useState(null);
  const [myOrg, setMyOrg] = useState(null);
  const [orgBusy, setOrgBusy] = useState(false);
  useEffect(() => {
    init();
  }, []);

    useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('org');
    if (!p || !/^[0-9a-f-]{36}$/i.test(p)) return;
    supabase
      .from('blood_orgs')
      .select('id, name')
      .eq('id', p)
      .eq('is_approved', true)
      .maybeSingle()
      .then(({ data }) => setInvite(data || null));
  }, []);

  useEffect(() => {
    const id = existingDonor && existingDonor.org_id;
    if (!id) {
      setMyOrg(null);
      return;
    }
    supabase
      .from('blood_orgs')
      .select('id, name')
      .eq('id', id)
      .eq('is_approved', true)
      .maybeSingle()
      .then(({ data }) => setMyOrg(data || null));
  }, [existingDonor]);

  async function init() {
    try {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: donor } = await supabase
          .from('blood_donors')
          .select('id, name, blood_group, phone, area, upazila, is_active, is_public, org_id')
          .eq('user_id', data.user.id)
          .maybeSingle();
        if (donor) {
          setExistingDonor(donor);
          setForm({ name: donor.name, bloodGroup: donor.blood_group, phone: donor.phone, area: donor.area || '', upazila: donor.upazila || '', isPublic: !!donor.is_public });
        }
      }
    } catch (err) {
      console.error('donor init error', err);
    }
    setLoading(false);
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user || submitting) return;
    if (!isValidBdPhone(form.phone)) {
      setError('সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)');
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      blood_group: form.bloodGroup,
      phone: cleanPhone(form.phone),
      area: form.area.trim(),
      upazila: form.upazila,
      is_public: !!form.isPublic,
    };

    try {
            let error = null;
      if (existingDonor) {
        const res = await supabase
          .from('blood_donors')
          .update(payload)
          .eq('id', existingDonor.id)
          .select('id');
        error = res.error;
        if (!error && (!res.data || res.data.length === 0)) {
          error = { message: 'সেভ করা যায়নি। আপনার এই প্রোফাইল বদলের অনুমতি নেই।' };
        }
      } else {
          const res = await supabase
          .from('blood_donors')
          .insert(invite ? { ...payload, org_id: invite.id } : payload);
        error = res.error;
      }

      if (error) {
        console.error('donor save error', error);
        setError(friendlyError(error));
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('donor save error', err);
      setError(friendlyError(err));
    }
    setSubmitting(false);
  }

  async function toggleActive() {
    setError(null);
        const { data: updated, error: upErr } = await supabase
      .from('blood_donors')
      .update({ is_active: !existingDonor.is_active })
      .eq('id', existingDonor.id)
      .select('id');
    const error = upErr || (!updated || updated.length === 0 ? { message: 'স্ট্যাটাস বদলানো যায়নি। অনুমতি নেই।' } : null);
    if (error) {
      console.error('donor toggle error', error);
      setError(friendlyError(error));
    } else {
      init();
    }
  }

   async function changeOrg(orgId) {
    if (orgBusy || !existingDonor) return;
    setOrgBusy(true);
    setError(null);
    const { data: updated, error: err } = await supabase
      .from('blood_donors')
      .update({ org_id: orgId })
      .eq('id', existingDonor.id)
      .select('id');
    setOrgBusy(false);
    if (err || !updated || updated.length === 0) {
      setError(friendlyError(err || { message: 'সংস্থা বদলানো যায়নি।' }));
      return;
    }
    init();
  }

  if (loading) return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">ডোনার হতে হলে আগে লগইন করুন।</p>
          <a
          href={`/login?next=${encodeURIComponent('/blood/donor' + (invite ? '?org=' + invite.id : ''))}`}
          className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5"
        >
          লগইন করুন
        </a>
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
          {form.isPublic ? 'আপনার প্রোফাইল রক্তদাতা তালিকায় দেখানো হবে।' : 'আপনার প্রোফাইল তালিকায় দেখানো হবে না।'}
        </p>
        <a href="/blood" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">ব্লাড পেজে ফিরে যান</a>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">❤️</span>
        <h1 className="text-xl font-semibold">
          {existingDonor ? 'ডোনার প্রোফাইল' : 'ডোনার হিসেবে নিবন্ধন করুন'}
        </h1>
      </div>
      <p className="text-xs text-ink/50 mb-6">
        রক্তের প্রয়োজনে মিলে যাওয়া অনুরোধ এলে আপনি নোটিফিকেশন পাবেন। চাইলে আপনার প্রোফাইল রক্তদাতা তালিকাতেও দেখানো যাবে।
      </p>

      {existingDonor && (
        <div className="bg-green/5 border border-green/20 p-4 mb-4 flex items-center justify-between">
          <p className="text-sm">
            স্ট্যাটাস: <span className={existingDonor.is_active ? 'text-green font-medium' : 'text-ink/50'}>
              {existingDonor.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
            </span>
          </p>
          <button type="button" onClick={toggleActive} className="text-sm border border-ink/20 px-3 py-1.5 hover:bg-white">
            {existingDonor.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
          </button>
        </div>
      )}

            {invite && !existingDonor && (
        <p className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4">
          🏥 আপনি <strong>{invite.name}</strong>-এর সদস্য হয়ে নিবন্ধন করছেন।
        </p>
      )}

      {existingDonor && invite && existingDonor.org_id !== invite.id && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-red-700">🏥 {invite.name}-এর সদস্য হতে চান?</p>
          <button
            type="button"
            onClick={() => changeOrg(invite.id)}
            disabled={orgBusy}
            className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-50"
          >
            সদস্য হোন
          </button>
        </div>
      )}

      {existingDonor && myOrg && (
        <div className="bg-white border border-ink/10 rounded-xl p-3 mb-4 flex items-center justify-between gap-3">
          <p className="text-sm">🏥 আপনি <strong>{myOrg.name}</strong>-এর সদস্য</p>
          <button
            type="button"
            onClick={() => changeOrg(null)}
            disabled={orgBusy}
            className="text-sm border border-ink/20 px-3 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-50"
          >
            সংস্থা ছাড়ুন
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border-2 border-ink/10 p-6 space-y-4">
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">নাম</label>
          <input
            type="text" required maxLength={80} value={form.name}
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
            type="tel" required inputMode="tel" maxLength={20} value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
            placeholder="01XXXXXXXXX"
          />
        </div>

          <div>
          <label className="block text-sm mb-1.5 text-ink/70">উপজেলা</label>
          <select
            required value={form.upazila}
            onChange={(e) => updateField('upazila', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green bg-white"
          >
            <option value="" disabled>উপজেলা বেছে নিন</option>
            {upazilas.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">এলাকা</label>
          <input
            type="text" required maxLength={100} value={form.area}
            onChange={(e) => updateField('area', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
            placeholder="যেমন: গ্রাম, মহল্লা বা ইউনিয়ন"
          />
        </div>

        <label className="flex items-start gap-3 bg-paper border border-ink/10 rounded-lg p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) => updateField('isPublic', e.target.checked)}
            className="mt-1 w-4 h-4 accent-green flex-shrink-0"
          />
          <span className="text-sm leading-relaxed">
            আমার প্রোফাইল রক্তদাতা তালিকায় সবার জন্য দেখানো হোক
            <span className="block text-xs text-ink/55 mt-1">
              দেখানো হবে: নাম, রক্তের গ্রুপ, এলাকা ও <strong>ফোন নম্বর</strong> — যে কেউ আপনাকে কল করতে পারবে। যেকোনো সময় এটা বন্ধ করতে পারবেন।
            </span>
          </span>
        </label>

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

export default function BloodDonorPage() {
  return (
    <>
      <SiteHeader lang="bn" simple />
      <BloodDonorForm />
    </>
  );
}
