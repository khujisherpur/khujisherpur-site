'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { cleanPhone, isValidBdPhone } from '../../../lib/format';
import SiteHeader from '../../../components/SiteHeader';
import { compressImage, removeOtherLogos } from '../../../lib/orgLogo';

const upazilas = ['শেরপুর সদর', 'নকলা', 'নালিতাবাড়ী', 'ঝিনাইগাতী', 'শ্রীবরদী'];

function OrgForm() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', upazila: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      const { data: o } = await supabase
        .from('blood_orgs')
        .select('id, name, phone, address, upazila, is_approved, logo_url')
        .eq('owner_user_id', data.user.id)
        .maybeSingle();
      if (o) {
        setOrg(o);
        setForm({ name: o.name, phone: o.phone, address: o.address, upazila: o.upazila || '' });
      }
    }
    setLoading(false);
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (!isValidBdPhone(form.phone)) {
      setError('সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)');
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    const payload = {
      name: form.name.trim(),
      phone: cleanPhone(form.phone),
      address: form.address.trim(),
      upazila: form.upazila,
    };
    let err = null;
    if (org) {
      const res = await supabase.from('blood_orgs').update(payload).eq('id', org.id).select('id');
      err = res.error || (!res.data || res.data.length === 0 ? { message: 'no rows' } : null);
    } else {
      const res = await supabase.from('blood_orgs').insert({ ...payload, owner_user_id: user.id });
      err = res.error;
    }
    setBusy(false);
    if (err) {
      console.error('org save error', err);
      setError('সেভ করা যায়নি, আবার চেষ্টা করুন। [' + String(err.message || '').slice(0, 120) + ']');
      return;
    }
    setSaved(true);
    init();
  }

    const [logoBusy, setLogoBusy] = useState(false);
  const [copied, setCopied] = useState(false);

    async function uploadLogo(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || !org) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return setError('শুধু JPG, PNG বা WebP ছবি দিন');
    }
    setLogoBusy(true);
    setError(null);
    const blob = await compressImage(file);
    if (!blob) {
      setLogoBusy(false);
      return setError('ছবিটা ছোট করা যায়নি, অন্য ছবি দিন');
    }
    const path = `org-logos/${user.id}/${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('images').upload(path, blob, { contentType: 'image/jpeg' });
    if (upErr) {
      setLogoBusy(false);
      return setError('লোগো আপলোড হয়নি [' + String(upErr.message || '').slice(0, 120) + ']');
    }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
    const { data: updated, error: dbErr } = await supabase
      .from('blood_orgs')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', org.id)
      .select('id');
    if (dbErr || !updated || updated.length === 0) {
      await supabase.storage.from('images').remove([path]);
      setLogoBusy(false);
      return setError('লোগো সেভ হয়নি [' + String((dbErr && dbErr.message) || 'no rows').slice(0, 120) + ']');
    }
    await removeOtherLogos(supabase, user.id, path, org.logo_url);
    setLogoBusy(false);
    init();
  }

  async function deleteLogo() {
    if (!org || !confirm('লোগো মুছে ফেলতে চান?')) return;
    setLogoBusy(true);
    setError(null);
    const { data: updated, error: dbErr } = await supabase
      .from('blood_orgs')
      .update({ logo_url: null })
      .eq('id', org.id)
      .select('id');
    if (dbErr || !updated || updated.length === 0) {
      setLogoBusy(false);
      return setError('লোগো মোছা যায়নি [' + String((dbErr && dbErr.message) || 'no rows').slice(0, 120) + ']');
    }
    await removeOtherLogos(supabase, user.id, null, org.logo_url);
    setLogoBusy(false);
    init();
  }

  async function shareOrgLink() {
    const url = `https://khujisherpur.com/blood/orgs/${org.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: org.name, text: `${org.name}-এর রক্তদাতা সদস্য হতে লিংকে যান।`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  }

  if (loading) return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;
  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">সংস্থার প্রোফাইল খুলতে আগে লগইন করুন।</p>
        <a href="/login?next=%2Fblood%2Forg" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">লগইন করুন</a>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-6">
      <a href="/blood/orgs" className="text-sm text-ink/50">← সংস্থার তালিকা</a>
      <h1 className="text-xl font-semibold mt-3 mb-2">🏥 {org ? 'সংস্থার প্রোফাইল' : 'রক্ত সংস্থার প্রোফাইল খুলুন'}</h1>

      {org && !org.is_approved && (
        <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 mb-4">
          ⏳ আপনার সংস্থা অনুমোদনের অপেক্ষায় আছে। অনুমোদনের পর সবার তালিকায় দেখা যাবে।
        </p>
      )}
      {org && org.is_approved && (
        <p className="text-sm bg-green/10 border border-green/20 text-green rounded-xl p-3 mb-4">
          ✅ আপনার সংস্থা তালিকায় দেখানো হচ্ছে।
        </p>
      )}

                  {org && (
        <div className="bg-white border-2 border-ink/10 p-4 mb-4">
          <div className="flex items-center gap-3">
            {org.logo_url ? (
              <img src={org.logo_url} alt="" className="w-16 h-16 rounded-full object-cover border border-ink/10" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-red-50 text-red-600 text-3xl flex items-center justify-center">🩸</span>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm border border-ink/20 px-3 py-2 cursor-pointer text-center">
                {logoBusy ? 'অপেক্ষা করুন...' : org.logo_url ? 'লোগো বদলান' : 'লোগো দিন'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={uploadLogo}
                  disabled={logoBusy}
                  className="hidden"
                />
              </label>
              {org.logo_url && (
                <button
                  type="button"
                  onClick={deleteLogo}
                  disabled={logoBusy}
                  className="text-xs text-red-600 border border-red-200 px-3 py-1.5 disabled:opacity-50"
                >
                  লোগো মুছুন
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-ink/50 mt-2">
            ছবি নিজে থেকে ছোট (প্রায় ৫০ KB) হয়ে সেভ হবে। বদলালে বা মুছলে আগের ছবি সাথে সাথে মুছে যাবে।
          </p>
          {org.is_approved && (
            <button
              type="button"
              onClick={shareOrgLink}
              className="w-full mt-3 text-sm font-semibold text-green border border-green/30 rounded-lg py-2.5"
            >
              {copied ? '✅ লিংক কপি হয়েছে' : '🔗 সদস্য নিবন্ধনের লিংক শেয়ার করুন'}
            </button>
          )}
        </div>
      )}

      <form onSubmit={submit} className="bg-white border-2 border-ink/10 p-6 space-y-4">
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">সংস্থার নাম</label>
          <input
            type="text" required minLength={2} maxLength={100} value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">উপজেলা</label>
          <select
            required value={form.upazila}
            onChange={(e) => set('upazila', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green bg-white"
          >
            <option value="" disabled>উপজেলা বেছে নিন</option>
            {upazilas.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">ঠিকানা</label>
          <input
            type="text" required minLength={2} maxLength={200} value={form.address}
            onChange={(e) => set('address', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
            placeholder="গ্রাম/মহল্লা, ইউনিয়ন বা রোড"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">ফোন নম্বর</label>
          <input
            type="tel" required inputMode="tel" maxLength={20} value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
            placeholder="01XXXXXXXXX"
          />
          <p className="text-xs text-ink/50 mt-1">অনুমোদনের পর নম্বরটি সবাই দেখতে পাবে।</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green">✅ সেভ হয়েছে।</p>}

        <button
          type="submit" disabled={busy}
          className="w-full bg-green text-white font-semibold py-2.5 disabled:opacity-50"
        >
          {busy ? 'সেভ হচ্ছে...' : org ? 'আপডেট করুন' : 'প্রোফাইল খুলুন'}
        </button>
      </form>
    </main>
  );
}

export default function BloodOrgPage() {
  return (
    <>
      <SiteHeader lang="bn" simple />
      <OrgForm />
    </>
  );
}
