'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user || !category) return;
    setSubmitting(true);
    setError(null);

    const isService = category.type === 'service';
    const table = isService ? 'providers' : 'listings';
    const payload = isService
      ? {
          user_id: user.id,
          category_id: category.id,
          name: form.name,
          area: form.area,
          phone: form.phone,
          description: form.description,
        }
      : {
          user_id: user.id,
          category_id: category.id,
          title: form.title,
          area: form.area,
          price_or_salary: form.priceOrSalary,
          description: form.description,
        };

    const { error } = await supabase.from(table).insert(payload);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
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
