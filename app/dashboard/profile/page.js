'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import SiteHeader from '../../../components/SiteHeader';
import BottomNav from '../../../components/BottomNav';
import PageSkeleton from '../../../components/PageSkeleton';
import ImageCropper from '../../../components/ImageCropper';
import { cleanPhone, isValidBdPhone } from '../../../lib/format';

function PageShell({ children }) {
  return (
    <>
      <SiteHeader lang="bn" simple />
      {children}
    </>
  );
}

async function compressImage(blob, maxSide = 400, targetKB = 100) {
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    const toBlob = (q) => new Promise((r) => canvas.toBlob(r, 'image/jpeg', q));
    let q = 0.85;
    let out = await toBlob(q);
    while (out && out.size > targetKB * 1024 && q > 0.4) {
      q -= 0.1;
      out = await toBlob(q);
    }
    return out || blob;
  } catch (e) {
    return blob;
  }
}
const normName = (s) => s.trim().replace(/\s+/g, ' ');
const normPhone = (s) => (s.trim() ? cleanPhone(s) : '');

function extractStoragePath(publicUrl) {
  if (!publicUrl) return null;
  const marker = '/images/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [phone, setPhone] = useState('');
  const [savedPhone, setSavedPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);
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
      const [{ data: rows }, { data: pic }] = await Promise.all([
        supabase.rpc('get_my_account'),
        supabase.from('users').select('avatar_url').eq('id', data.user.id).maybeSingle(),
      ]);
      const prof = (rows && rows[0]) || null;
      const n = prof?.name || '';
      const p = prof?.phone || '';
      setName(n);
      setSavedName(n);
      setPhone(p);
      setSavedPhone(p);
      setAvatarUrl(pic?.avatar_url || '');
    }
    setLoading(false);
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) setPendingFile(file);
    e.target.value = '';
  }

  async function saveAvatar(newUrl, oldUrl) {
    const { data: updated, error: err } = await supabase
      .from('users')
      .update({ avatar_url: newUrl })
      .eq('id', user.id)
      .select('id');
        if (err || !updated || updated.length === 0) return false;
    const oldPath = extractStoragePath(oldUrl);
    if (oldPath) {
      const { data: removed, error: rmErr } = await supabase.storage.from('images').remove([oldPath]);
       if (rmErr || !removed || removed.length === 0) {
        setError('পুরোনো ছবি মোছা যায়নি। পথ: ' + oldPath + (rmErr ? ' | ' + rmErr.message : ' | কোনো ফাইল মেলেনি'));
      }
    }
    return true;
  }

  async function handleCropComplete(blob) {
    setPendingFile(null);
    setPhotoBusy(true);
    setError(null);
    const path = `${user.id}/avatar-${Date.now()}.jpg`;
    const small = await compressImage(blob);
    const { error: upErr } = await supabase.storage
      .from('images')
      .upload(path, small, { contentType: 'image/jpeg' });
    if (upErr) {
      setPhotoBusy(false);
      setError('ছবি আপলোড করা যায়নি। ছবি ছোট করে বা ইন্টারনেট চেক করে আবার চেষ্টা করুন');
      return;
    }
    const { data: pub } = supabase.storage.from('images').getPublicUrl(path);
    const ok = await saveAvatar(pub.publicUrl, avatarUrl);
    setPhotoBusy(false);
    if (!ok) {
      await supabase.storage.from('images').remove([path]);
      setError('ছবি সেভ করা যায়নি, একটু পরে আবার চেষ্টা করুন');
      return;
    }
    setAvatarUrl(pub.publicUrl);
    setPhotoSaved(true);
    setTimeout(() => setPhotoSaved(false), 3000);
  }

  async function removeAvatar() {
    if (!avatarUrl || !confirm('ছবিটা সরিয়ে ফেলতে চান?')) return;
    setPhotoBusy(true);
    setError(null);
    const ok = await saveAvatar(null, avatarUrl);
    setPhotoBusy(false);
    if (!ok) {
      setError('ছবি সরানো যায়নি, একটু পরে আবার চেষ্টা করুন');
      return;
    }
    setAvatarUrl('');
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
  const initial = (name.trim() || user.email || '?').charAt(0).toUpperCase();

  return (
    <PageShell>
      <main className="max-w-xl mx-auto px-4 py-5">
        {pendingFile && (
          <ImageCropper
            file={pendingFile}
            shape="circle"
            onCancel={() => setPendingFile(null)}
            onComplete={handleCropComplete}
          />
        )}

        <a href="/dashboard" className="text-sm text-ink/60 inline-block mb-3">← আমার অ্যাকাউন্ট</a>
        <h1 className="text-xl font-semibold mb-4">আমার প্রোফাইল</h1>

        <div className="bg-white border border-ink/10 border-t-4 border-t-green rounded-xl p-5 mb-4 text-center">
          <div className="relative w-28 h-28 mx-auto">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow" />
            ) : (
              <span className="w-28 h-28 rounded-full bg-[#EEF1F8] text-green-dark text-4xl font-semibold flex items-center justify-center border-4 border-white shadow">
                {initial}
              </span>
            )}
            {photoBusy && (
              <span className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center text-xs text-ink/60">
                অপেক্ষা করুন...
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <label className="text-sm bg-green text-white px-4 py-2 rounded-full cursor-pointer">
              {avatarUrl ? '📷 ছবি বদলান' : '📷 ছবি যোগ করুন'}
              <input type="file" accept="image/*" onChange={handleFileSelect} disabled={photoBusy} className="hidden" />
            </label>
            {avatarUrl && (
              <button
                type="button"
                onClick={removeAvatar}
                disabled={photoBusy}
                className="text-sm border border-red-300 text-red-600 px-4 py-2 rounded-full disabled:opacity-50"
              >
                সরান
              </button>
            )}
          </div>
        {photoSaved && <p className="text-xs text-green mt-3">✓ ছবি সেভ হয়েছে</p>}
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white border border-ink/10 rounded-xl p-5 space-y-4"
        >
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
