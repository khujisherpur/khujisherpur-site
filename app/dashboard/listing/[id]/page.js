'use client';
export const runtime = 'edge';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import ImageCropper from '../../../../components/ImageCropper';
import SiteHeader from '../../../../components/SiteHeader';

const MAX_PHOTOS = 3;

function extractStoragePath(publicUrl) {
  if (!publicUrl) return null;
  const marker = '/images/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
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
  const [form, setForm] = useState({ title: '', area: '', price_or_salary: '', description: '' });
  const [categoryName, setCategoryName] = useState('');
  const [user, setUser] = useState(null);
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

    const { data, error } = await supabase
      .from('listings')
      .select('title, area, price_or_salary, description, photos, categories(name)')
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
    });
    setCategoryName(data.categories?.name || '');
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
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;
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

      const { data: updated, error: updateError } = await supabase
        .from('listings')
        .update({
          title: form.title,
          area: form.area,
          price_or_salary: form.price_or_salary,
          description: form.description,
          photos: finalUrls,
          status: 'pending',
        })
        .eq('id', params.id)
        .select('id');

      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        throw new Error('সেভ করা যায়নি। আপনার অ্যাকাউন্ট সাসপেন্ড থাকতে পারে বা এই পোস্ট এডিটের অনুমতি নেই।');
      }

      const paths = removedUrls.map(extractStoragePath).filter(Boolean);
      if (paths.length > 0) await supabase.storage.from('images').remove(paths);

      setSaved(true);
    } catch (err) {
      const cleanup = uploaded.map(extractStoragePath).filter(Boolean);
      if (cleanup.length > 0) await supabase.storage.from('images').remove(cleanup);
      setError(err.message);
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
    return (
      <PageShell>
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-xl font-semibold mb-2">আপডেট হয়েছে!</h1>
          <p className="text-ink/70 text-sm mb-6">পরিবর্তনগুলো আবার পর্যালোচনার জন্য পাঠানো হয়েছে।</p>
          <a href="/dashboard" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5 rounded-lg">
            ড্যাশবোর্ডে ফিরে যান
          </a>
        </main>
      </PageShell>
    );
  }

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
              type="text" required value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">এলাকা</label>
            <input
              type="text" required value={form.area}
              onChange={(e) => updateField('area', e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">মূল্য / ভাড়া / বেতন</label>
            <div className="flex items-center border border-ink/20 rounded-lg focus-within:border-green">
              <span className="pl-3 pr-1 text-ink/50 font-numeric select-none">৳</span>
              <input
                type="text" required value={form.price_or_salary}
                onChange={(e) => updateField('price_or_salary', e.target.value)}
                className="flex-1 py-2.5 pr-3 outline-none font-numeric bg-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">বিবরণ</label>
            <textarea
              required rows={5} value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green resize-none"
            />
          </div>

          <p className="text-xs text-marigold bg-marigold/10 rounded-lg px-3 py-2">
            ℹ️ সেভ করলে পোস্টটি আবার পর্যালোচনায় যাবে, অনুমোদনের আগ পর্যন্ত সাইটে দেখা যাবে না।
          </p>

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
