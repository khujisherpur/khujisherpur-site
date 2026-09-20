'use client';
export const runtime = 'edge';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';

export default function EditProviderPage({ params }) {
  const [form, setForm] = useState({ name: '', area: '', phone: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from('providers')
      .select('name, area, phone, description')
      .eq('id', params.id)
      .single();
    if (error) setError('এই প্রোফাইলটি খুঁজে পাওয়া যায়নি বা এডিট করার অনুমতি নেই।');
    else setForm(data);
    setLoading(false);
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('providers')
      .update({
        name: form.name,
        area: form.area,
        phone: form.phone,
        description: form.description,
        status: 'pending', // এডিট করলে আবার পর্যালোচনার জন্য পাঠানো হয়
      })
      .eq('id', params.id);

    if (error) setError(error.message);
    else setSaved(true);
    setSaving(false);
  }

  if (loading) return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;

  if (error && !form.name) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">{error}</p>
        <a href="/dashboard" className="text-green underline mt-2 inline-block">ড্যাশবোর্ডে ফিরে যান</a>
      </main>
    );
  }

  if (saved) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-3xl mb-4">✅</p>
        <h1 className="text-xl font-semibold mb-2">আপডেট হয়েছে!</h1>
        <p className="text-ink/70 text-sm mb-6">
          পরিবর্তনগুলো আবার পর্যালোচনার জন্য পাঠানো হয়েছে।
        </p>
        <a href="/dashboard" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">ড্যাশবোর্ডে ফিরে যান</a>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <header className="mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
      </header>

      <h1 className="text-xl font-semibold mb-6">প্রোফাইল এডিট করুন</h1>

      <form onSubmit={handleSubmit} className="bg-white border-2 border-ink/10 p-6 space-y-4">
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">নাম</label>
          <input
            type="text" required value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">এলাকা</label>
          <input
            type="text" required value={form.area}
            onChange={(e) => updateField('area', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">ফোন নম্বর</label>
          <input
            type="tel" required value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">বিবরণ</label>
          <textarea
            required rows={4} value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit" disabled={saving}
          className="w-full bg-marigold text-ink font-semibold py-2.5 hover:bg-marigold/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
        </button>
      </form>
    </main>
  );
}
