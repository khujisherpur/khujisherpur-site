'use client';
export const runtime = 'edge';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import ImageCropper from '../../../../components/ImageCropper';
import SiteHeader from '../../../../components/SiteHeader';
import { cleanPhone, isValidBdPhone } from '../../../../lib/format';

const MAX_PHOTOS = 3;

function extractStoragePath(publicUrl) {
  if (!publicUrl) return null;
  const marker = '/images/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

// কাঁচা ইংরেজি এরর বদলে বাংলা বার্তা; ডাটাবেস ট্রিগারের নিজের বাংলা বার্তা সরাসরি দেখাই
function friendlyError(err) {
  const msg = (err && err.message) || '';
  if (/[\u0980-\u09FF]/.test(msg)) return msg;
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

function PageShell({ children }) {
  return (
    <>
      <SiteHeader lang="bn" simple />
      {children}
    </>
  );
}

export default function EditListingPage({ params }) {
  const [form, setForm] = useState({
    title: '', area: '', price_or_salary: '', description: '',
    owner_name: '', contact_phone: '', whatsapp: '', contact_email: '',
  });
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [originalStatus, setOriginalStatus] = useState('');
  const [resultStatus, setResultStatus] = useState('');
  const [user, setUser] = useState(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [removedUrls, setRemovedUrls] = useState([]);
  const [pendingFile, setPendingFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: authData } = await supabase.auth.getUser();
    setUser(authData.user);
    if (!authData.user) {
      setNeedLogin(true);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('listings')
      .select('title, area, price_or_salary, description, photos, owner_name, status, contact_phone, whatsapp, contact_email, categories(name, slug)')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      setLoadFailed(true);
      setLoading(false);
      return;
    }
    setForm({
      title: data.title || '',
      area: data.area || '',
      price_or_salary: data.price_or_salary || '',
      description: data.description || '',
      owner_name: data.owner_name || '',
      contact_phone: data.contact_phone || '',
      whatsapp: data.whatsapp || '',
      contact_email: data.contact_email || '',
    });
    setCategoryName(data.categories?.name || '');
    setCategorySlug(data.categories?.slug || '');
    setOriginalStatus(data.status || '');
    setPhotos((data.photos || []).map((url) => ({ key: url, url, preview: url })));
    setLoading(false);
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) setPendingFile(file);
    e.target.value = '';
  }

  function handleCropComplete(blob) {
    setPhotos((prev) =>
      prev.length >= MAX_PHOTOS
        ? prev
        : [...prev, { key: `new-${Date.now()}-${Math.random()}`, blob, preview: URL.createObjectURL(blob) }]
    );
    setPendingFile(null);
  }

  function removePhoto(index) {
    const item = photos[index];
    if (item.url) setRemovedUrls((r) => [...r, item.url]);
    if (item.blob) URL.revokeObjectURL(item.preview);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function makeCover(index) {
    setPhotos((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  }

  async function uploadBlob(blob) {
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error: uploadError } = await supabase.storage.from('images').upload(path, blob, {
      contentType: 'image/jpeg',
    });
    if (uploadError) {
      console.error('upload error', uploadError);
      throw new Error('ছবি আপলোড করা যায়নি। ছবি ছোট করে বা ইন্টারনেট চেক করে আবার চেষ্টা করুন');
    }
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
  }

  // চাকরিতে প্রতিষ্ঠান/নিয়োগকর্তা, ভাড়ায় মালিকের নাম
  const needsOwner = categorySlug === 'job' || categorySlug === 'rent';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user || saving) return;
    if (!isValidBdPhone(form.contact_phone)) {
      setError('সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)');
      return;
    }
    if (form.whatsapp && !isValidBdPhone(form.whatsapp)) {
      setError('হোয়াটসঅ্যাপ নম্বরটি সঠিক নয় (যেমন: 01XXXXXXXXX)');
      return;
    }
    setSaving(true);
    setError(null);
    const uploaded = [];

    try {
      const finalUrls = [];
      for (const p of photos) {
        if (p.blob) {
          const url = await uploadBlob(p.blob);
          uploaded.push(url);
          finalUrls.push(url);
        } else {
          finalUrls.push(p.url);
        }
      }

      const payload = {
        title: form.title.trim(),
        area: form.area.trim(),
        price_or_salary: form.price_or_salary,
        description: form.description,
        photos: finalUrls,
        contact_phone: cleanPhone(form.contact_phone),
        whatsapp: form.whatsapp ? cleanPhone(form.whatsapp) : null,
        contact_email: form.contact_email.trim() || null,
      };
      if (needsOwner) payload.owner_name = form.owner_name.trim();
      // অনুমোদিত পোস্টে নাম, বিবরণ, দাম, ছবি বা যোগাযোগ বদলালে ডাটাবেস নিজেই আবার pending করে।
      // শুধু প্রত্যাখ্যাত পোস্ট ঠিক করে আবার পাঠালে এখান থেকে pending করতে হয়।
      if (originalStatus === 'rejected') payload.status = 'pending';

      const { data: updated, error: updateError } = await supabase
        .from('listings')
        .update(payload)
        .eq('id', params.id)
        .select('id, status');

      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        throw new Error('সেভ করা যায়নি। আপনার অ্যাকাউন্ট সাসপেন্ড থাকতে পারে বা এই পোস্ট এডিটের অনুমতি নেই।');
      }
      setResultStatus(updated[0].status || '');

      const paths = removedUrls.map(extractStoragePath).filter(Boolean);
      if (paths.length > 0) await supabase.storage.from('images').remove(paths);

      setSaved(true);
    } catch (err) {
      console.error('listing edit error', err);
      const cleanup = uploaded.map(extractStoragePath).filter(Boolean);
      if (cleanup.length > 0) await supabase.storage.from('images').remove(cleanup);
      setError(friendlyError(err));
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <PageShell>
        <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>
      </PageShell>
    );
  }

  if (needLogin) {
    return (
      <PageShell>
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70 mb-4">পোস্ট এডিট করতে হলে আগে লগইন করুন।</p>
          <a href="/login?next=%2Fdashboard" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5 rounded-lg">
            লগইন করুন
          </a>
        </main>
      </PageShell>
    );
  }

  if (loadFailed) {
    return (
      <PageShell>
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70">এই পোস্টটি খুঁজে পাওয়া যায়নি বা এডিট করার অনুমতি নেই।</p>
          <a href="/dashboard" className="text-green underline mt-2 inline-block">ড্যাশবোর্ডে ফিরে যান</a>
        </main>
      </PageShell>
    );
  }

  if (saved) {
    const doneText =
      resultStatus === 'pending'
        ? 'পরিবর্তনগুলো আবার পর্যালোচনার জন্য পাঠানো হয়েছে।'
        : resultStatus === 'active'
        ? 'পরিবর্তনগুলো সাইটে দেখা যাচ্ছে।'
        : 'পরিবর্তন সেভ হয়েছে।';
    return (
      <PageShell>
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-xl font-semibold mb-2">আপডেট হয়েছে!</h1>
          <p className="text-ink/70 text-sm mb-6">{doneText}</p>
          <a href="/dashboard" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5 rounded-lg">
            ড্যাশবোর্ডে ফিরে যান
          </a>
        </main>
      </PageShell>
    );
  }

  const notice =
    originalStatus === 'active'
      ? 'ℹ️ শিরোনাম, বিবরণ, মূল্য, ছবি, নাম বা যোগাযোগের তথ্য বদলালে পোস্টটি আবার পর্যালোচনায় যাবে এবং অনুমোদনের আগ পর্যন্ত সাইটে দেখা যাবে না। শুধু এলাকা বদলালে যাবে না।'
      : originalStatus === 'rejected'
      ? 'ℹ️ সেভ করলে পোস্টটি আবার পর্যালোচনার জন্য পাঠানো হবে।'
      : null;

  return (
    <PageShell>
      <main className="max-w-xl mx-auto px-4 py-5">
        {pendingFile && (
          <ImageCropper
            file={pendingFile}
            shape="square"
            onCancel={() => setPendingFile(null)}
            onComplete={handleCropComplete}
          />
        )}

        <a href="/dashboard" className="text-sm text-ink/60 inline-block mb-3">← ড্যাশবোর্ড</a>
        <h1 className="text-xl font-semibold">পোস্ট এডিট করুন</h1>
        {categoryName && <p className="text-xs text-ink/50 mt-0.5 mb-4">{categoryName}</p>}

        <form onSubmit={handleSubmit} className="bg-white border border-ink/10 border-t-4 border-t-marigold rounded-xl p-5 space-y-4">
          {/* ছবি */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-ink/70">ছবি</label>
              <span className="text-xs text-ink/40 font-numeric">{photos.length}/{MAX_PHOTOS}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={p.key} className="relative">
                  <img
                    src={p.preview}
                    alt={`ছবি ${i + 1}`}
                    className={`w-full aspect-square object-cover rounded-lg border ${i === 0 ? 'border-green border-2' : 'border-ink/10'}`}
                  />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-green text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      কভার
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 text-sm rounded-full shadow"
                    aria-label="ছবি সরান"
                  >
                    ×
                  </button>
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => makeCover(i)}
                      className="absolute bottom-1 left-1 bg-white/90 text-ink text-[10px] px-1.5 py-0.5 rounded-full border border-ink/10"
                    >
                      কভার করুন
                    </button>
                  )}
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="aspect-square border-2 border-dashed border-ink/25 rounded-lg flex flex-col items-center justify-center text-xs text-ink/50 cursor-pointer active:bg-paper">
                  <span className="text-2xl leading-none mb-1">＋</span>
                  ছবি যোগ
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-[11px] text-ink/40 mt-2">প্রথম ছবিটাই কভার হিসেবে সবার আগে দেখাবে।</p>
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-ink/70">শিরোনাম</label>
            <input
              type="text" required maxLength={120} value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
            />
          </div>

          {needsOwner && (
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">
                {categorySlug === 'job' ? 'প্রতিষ্ঠান বা নিয়োগকর্তার নাম' : 'বাড়ি/দোকান মালিকের নাম'}
              </label>
              <input
                type="text" required maxLength={80} value={form.owner_name}
                onChange={(e) => updateField('owner_name', e.target.value)}
                className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
                placeholder={categorySlug === 'job' ? 'প্রতিষ্ঠান না থাকলে আপনার নাম' : 'মালিকের নাম'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm mb-1.5 text-ink/70">এলাকা</label>
            <input
              type="text" required maxLength={100} value={form.area}
              onChange={(e) => updateField('area', e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">মূল্য / ভাড়া / বেতন</label>
            <div className="flex items-center border border-ink/20 rounded-lg focus-within:border-green">
              <span className="pl-3 pr-1 text-ink/50 font-numeric select-none">৳</span>
              <input
                type="text" required maxLength={20} value={form.price_or_salary}
                onChange={(e) => updateField('price_or_salary', e.target.value)}
                className="flex-1 py-2.5 pr-3 outline-none font-numeric bg-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">বিবরণ</label>
            <textarea
              required rows={5} maxLength={2000} value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green resize-none"
            />
          </div>

          <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-3">
            <p className="text-sm font-medium">📞 যোগাযোগের তথ্য</p>
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">
                মোবাইল নম্বর <span className="text-red-500">*</span>
              </label>
              <input
                type="tel" required inputMode="tel" maxLength={20} value={form.contact_phone}
                onChange={(e) => updateField('contact_phone', e.target.value)}
                className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green bg-white"
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)</label>
              <input
                type="tel" inputMode="tel" maxLength={20} value={form.whatsapp}
                onChange={(e) => updateField('whatsapp', e.target.value)}
                className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green bg-white"
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">ইমেইল (ঐচ্ছিক)</label>
              <input
                type="email" maxLength={120} value={form.contact_email}
                onChange={(e) => updateField('contact_email', e.target.value)}
                className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green bg-white"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {notice && (
            <p className="text-xs text-marigold bg-marigold/10 rounded-lg px-3 py-2">{notice}</p>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit" disabled={saving}
            className="w-full bg-marigold text-ink font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {saving ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
          </button>
        </form>
      </main>
    </PageShell>
  );
}
