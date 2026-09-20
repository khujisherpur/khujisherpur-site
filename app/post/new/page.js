'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import ImageCropper from '../../../components/ImageCropper';

function NewPostForm() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [category, setCategory] = useState(null);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [form, setForm] = useState({
    title: '', name: '', area: '', phone: '', priceOrSalary: '', description: '',
  });

  const [pendingFile, setPendingFile] = useState(null); // ক্রপার-এ থাকা ছবি
  const [providerPhoto, setProviderPhoto] = useState(null); // ক্রপ শেষ হওয়া একটা ছবি (Blob)
  const [listingPhotos, setListingPhotos] = useState([]); // ক্রপ শেষ হওয়া একাধিক ছবি (Blob[])

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
    });
  }, []);

  useEffect(() => {
    if (!categorySlug) { setLoadingCategory(false); return; }
    supabase
      .from('categories')
      .select('id, name, slug, type, icon')
      .eq('slug', categorySlug)
      .single()
      .then(({ data }) => {
        setCategory(data || null);
        setLoadingCategory(false);
      });
  }, [categorySlug]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) setPendingFile(file);
    e.target.value = ''; // যাতে একই ফাইল আবার সিলেক্ট করা যায়
  }

  function handleCropComplete(blob) {
    if (category?.type === 'service') {
      setProviderPhoto(blob);
    } else {
      setListingPhotos((prev) => (prev.length >= 3 ? prev : [...prev, blob]));
    }
    setPendingFile(null);
  }

  function removeListingPhoto(index) {
    setListingPhotos((prev) => prev.filter((_, i) => i !== index));
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
    if (!user || !category) return;
    setSubmitting(true);
    setError(null);

    try {
      const isService = category.type === 'service';

      if (isService) {
        let photoUrl = null;
        if (providerPhoto) photoUrl = await uploadBlob(providerPhoto);

        const { error } = await supabase.from('providers').insert({
          user_id: user.id,
          category_id: category.id,
          name: form.name,
          area: form.area,
          phone: form.phone,
          description: form.description,
          photo_url: photoUrl,
        });
        if (error) throw error;
      } else {
        let photoUrls = [];
        if (listingPhotos.length > 0) {
          photoUrls = await Promise.all(listingPhotos.map(uploadBlob));
        }

        const { error } = await supabase.from('listings').insert({
          user_id: user.id,
          category_id: category.id,
          title: form.title,
          area: form.area,
          price_or_salary: form.priceOrSalary,
          description: form.description,
          photos: photoUrls,
        });
        if (error) throw error;
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  if (checkingAuth || loadingCategory) {
    return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">পোস্ট দিতে হলে আগে লগইন করুন।</p>
        <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">লগইন করুন</a>
      </main>
    );
  }

  if (!category) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">সঠিক ক্যাটাগরি বাছাই করা হয়নি।</p>
        <a href="/" className="text-green underline">হোমপেজে ফিরে যান</a>
      </main>
    );
  }

  if (success) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-3xl mb-4">✅</p>
        <h1 className="text-xl font-semibold mb-2">পোস্ট জমা হয়েছে!</h1>
        <p className="text-ink/70 text-sm mb-6">
          এটা এখন পর্যালোচনার (Pending) অবস্থায় আছে। Admin/Moderator অনুমোদন করলে সবাই দেখতে পাবে।
        </p>
        <a href="/dashboard" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">ড্যাশবোর্ডে যান</a>
      </main>
    );
  }

  const isService = category.type === 'service';

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      {pendingFile && (
        <ImageCropper
          file={pendingFile}
          shape={category?.type === 'service' ? 'circle' : 'square'}
          onCancel={() => setPendingFile(null)}
          onComplete={handleCropComplete}
        />
      )}

      <header className="flex items-center justify-between mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
      </header>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">{category.icon}</span>
        <h1 className="text-xl font-semibold">
          {isService ? `${category.name} হিসেবে প্রোফাইল তৈরি করুন` : `নতুন ${category.name} পোস্ট দিন`}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border-2 border-ink/10 p-6 space-y-4">
        {isService ? (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">আপনার নাম</label>
            <input
              type="text" required value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
              placeholder="যেমন: রহিম উদ্দিন"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">শিরোনাম</label>
            <input
              type="text" required value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
              placeholder="যেমন: ২ বেডরুম বাসা, শেরপুর সদর"
            />
          </div>
        )}

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">এলাকা</label>
          <input
            type="text" required value={form.area}
            onChange={(e) => updateField('area', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
            placeholder="যেমন: শেরপুর সদর"
          />
        </div>

        {isService ? (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">ফোন নম্বর</label>
            <input
              type="tel" required value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
              placeholder="01XXXXXXXXX"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">
              {category.slug === 'job' ? 'বেতন' : 'ভাড়া'}
            </label>
            <input
              type="text" required value={form.priceOrSalary}
              onChange={(e) => updateField('priceOrSalary', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
              placeholder={category.slug === 'job' ? 'যেমন: ১৫,০০০ টাকা/মাস' : 'যেমন: ৮,০০০ টাকা/মাস'}
            />
          </div>
        )}

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">বিবরণ</label>
          <textarea
            required rows={4} value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green resize-none"
            placeholder="বিস্তারিত লিখুন..."
          />
        </div>

        {/* ছবি আপলোড সেকশন */}
        {isService ? (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">ছবি (ঐচ্ছিক)</label>
            {providerPhoto ? (
              <div className="flex items-center gap-3">
                <img
                  src={URL.createObjectURL(providerPhoto)}
                  alt="প্রিভিউ"
                  className="w-20 h-20 object-cover rounded-full"
                />
                <button
                  type="button"
                  onClick={() => setProviderPhoto(null)}
                  className="text-sm text-red-600 border border-red-300 px-3 py-1.5"
                >
                  সরান
                </button>
              </div>
            ) : (
              <label className="inline-block text-sm border border-ink/20 px-4 py-2 cursor-pointer hover:bg-paper">
                + ছবি বাছাই করুন
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">ছবি (ঐচ্ছিক, সর্বোচ্চ ৩টা)</label>
            <div className="flex gap-2 flex-wrap">
              {listingPhotos.map((blob, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(blob)} alt={`ছবি ${i + 1}`} className="w-20 h-20 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeListingPhoto(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 text-xs rounded-full"
                  >
                    ×
                  </button>
                </div>
              ))}
              {listingPhotos.length < 3 && (
                <label className="w-20 h-20 border border-dashed border-ink/30 flex items-center justify-center text-xs text-ink/50 cursor-pointer hover:bg-paper">
                  + যোগ করুন
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </label>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit" disabled={submitting}
          className="w-full bg-marigold text-ink font-semibold py-2.5 hover:bg-marigold/90 transition-colors disabled:opacity-50"
        >
          {submitting ? 'জমা হচ্ছে...' : 'পোস্ট জমা দিন'}
        </button>
      </form>
    </main>
  );
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>}>
      <NewPostForm />
    </Suspense>
  );
}
