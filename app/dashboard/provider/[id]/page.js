'use client';
export const runtime = 'edge';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import ImageCropper from '../../../../components/ImageCropper';

export default function EditProviderPage({ params }) {
  const [form, setForm] = useState({
    name: '', area: '', phone: '', description: '',
    experienceYears: '', vehicleType: 'ac',
  });
  const [categorySlug, setCategorySlug] = useState(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: authData } = await supabase.auth.getUser();
    setUser(authData.user);

    const { data, error } = await supabase
      .from('providers')
      .select('name, area, phone, description, photo_url, experience_years, vehicle_type, categories(slug)')
      .eq('id', params.id)
      .single();

    if (error) {
      setError('এই প্রোফাইলটি খুঁজে পাওয়া যায়নি বা এডিট করার অনুমতি নেই।');
    } else {
      setForm({
        name: data.name, area: data.area, phone: data.phone, description: data.description || '',
        experienceYears: data.experience_years || '', vehicleType: data.vehicle_type || 'ac',
      });
      setCurrentPhotoUrl(data.photo_url);
      setCategorySlug(data.categories?.slug);
    }
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
    setNewPhoto(blob);
    setPendingFile(null);
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
    setSaving(true);
    setError(null);

    try {
      let photoUrl = currentPhotoUrl;
      if (newPhoto) {
        photoUrl = await uploadBlob(newPhoto);
      }

      const payload = {
        name: form.name,
        area: form.area,
        phone: form.phone,
        description: form.description,
        photo_url: photoUrl,
        experience_years: form.experienceYears ? parseInt(form.experienceYears) : null,
        status: 'pending',
      };
      if (categorySlug === 'ambulance') payload.vehicle_type = form.vehicleType;

      const { error } = await supabase.from('providers').update(payload).eq('id', params.id);

      if (error) throw error;
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
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
      {pendingFile && (
        <ImageCropper
          file={pendingFile}
          shape="circle"
          onCancel={() => setPendingFile(null)}
          onComplete={handleCropComplete}
        />
      )}

      <header className="mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
      </header>

      <h1 className="text-xl font-semibold mb-6">প্রোফাইল এডিট করুন</h1>

      <form onSubmit={handleSubmit} className="bg-white border-2 border-ink/10 p-6 space-y-4">
        <div>
          <label className="block text-sm mb-1.5 text-ink/70">প্রোফাইল ছবি</label>
          <div className="flex items-center gap-3">
            <img
              src={newPhoto ? URL.createObjectURL(newPhoto) : (currentPhotoUrl || '/favicon-32.png')}
              alt="প্রোফাইল ছবি"
              className="w-16 h-16 rounded-full object-cover border border-ink/10"
            />
            <label className="text-sm border border-ink/20 px-4 py-2 cursor-pointer hover:bg-paper">
              ছবি বদলান
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        </div>

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
          <label className="block text-sm mb-1.5 text-ink/70">অভিজ্ঞতা (বছর, ঐচ্ছিক)</label>
          <input
            type="number" min="0" value={form.experienceYears}
            onChange={(e) => updateField('experienceYears', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
          />
        </div>

        {categorySlug === 'ambulance' && (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">গাড়ির ধরন</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateField('vehicleType', 'ac')}
                className={`flex-1 text-sm py-2 border ${form.vehicleType === 'ac' ? 'bg-green text-white border-green' : 'border-ink/20 text-ink/60'}`}
              >
                AC
              </button>
              <button
                type="button"
                onClick={() => updateField('vehicleType', 'non_ac')}
                className={`flex-1 text-sm py-2 border ${form.vehicleType === 'non_ac' ? 'bg-green text-white border-green' : 'border-ink/20 text-ink/60'}`}
              >
                Non-AC
              </button>
            </div>
          </div>
        )}

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
