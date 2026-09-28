'use client';
export const runtime = 'edge';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import ImageCropper from '../../../../components/ImageCropper';
import SiteHeader from '../../../../components/SiteHeader';
import { locations, upazilaList } from '../../../../lib/locations';

function PageShell({ children }) {
  return (
    <>
      <SiteHeader lang="bn" simple />
      {children}
    </>
  );
}

export default function EditProviderPage({ params }) {
  const [form, setForm] = useState({
    name: '', area: '', phone: '', description: '',
    experienceYears: '', vehicleType: 'ac',
    nameEn: '', upazila: '', unionName: '',
  });
  const [categorySlug, setCategorySlug] = useState(null);
  const [slug, setSlug] = useState(null);
  const [primarySubcategoryId, setPrimarySubcategoryId] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState([]);
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
      .select(`
        name, area, phone, description, photo_url, experience_years, vehicle_type,
        name_en, slug, upazila, union_name, primary_subcategory_id, category_id,
        categories(slug)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      setError('এই প্রোফাইলটি খুঁজে পাওয়া যায়নি বা এডিট করার অনুমতি নেই।');
      setLoading(false);
      return;
    }

    setForm({
      name: data.name, area: data.area, phone: data.phone, description: data.description || '',
      experienceYears: data.experience_years || '', vehicleType: data.vehicle_type || 'ac',
      nameEn: data.name_en || '', upazila: data.upazila || '', unionName: data.union_name || '',
    });
    setCurrentPhotoUrl(data.photo_url);
    setCategorySlug(data.categories?.slug);
    setSlug(data.slug);
    setPrimarySubcategoryId(data.primary_subcategory_id);

    if (data.categories?.slug === 'service-provider') {
      const [{ data: allSubs }, { data: mySubs }] = await Promise.all([
        supabase.from('subcategories').select('id, name_bn').eq('category_id', data.category_id).eq('is_active', true).order('sort_order'),
        supabase.from('provider_subcategories').select('subcategory_id').eq('provider_id', params.id),
      ]);
      setSubcategories(allSubs || []);
      setSelectedSubcategoryIds((mySubs || []).map((r) => r.subcategory_id));
    }

    setLoading(false);
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleUpazilaChange(value) {
    setForm((f) => ({ ...f, upazila: value, unionName: '' }));
  }

  function toggleSubcategory(id) {
    if (id === primarySubcategoryId) return;
    setSelectedSubcategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
        upazila: form.upazila,
        union_name: form.unionName,
        status: 'pending',
      };
      if (categorySlug === 'ambulance') payload.vehicle_type = form.vehicleType;
      if (categorySlug === 'service-provider') payload.name_en = form.nameEn.trim();

      const { error } = await supabase.from('providers').update(payload).eq('id', params.id);
      if (error) throw error;

      if (categorySlug === 'service-provider') {
        const finalIds = Array.from(
          new Set([...selectedSubcategoryIds, primarySubcategoryId].filter(Boolean))
        );
        await supabase.from('provider_subcategories').delete().eq('provider_id', params.id);
        const rows = finalIds.map((sid) => ({ provider_id: params.id, subcategory_id: sid }));
        if (rows.length > 0) await supabase.from('provider_subcategories').insert(rows);
      }

      setSaved(true);
    } catch (err) {
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

  if (error && !form.name) {
    return (
      <PageShell>
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70">{error}</p>
          <a href="/dashboard" className="text-green underline mt-2 inline-block">ড্যাশবোর্ডে ফিরে যান</a>
        </main>
      </PageShell>
    );
  }

  if (saved) {
    return (
      <PageShell>
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-3xl mb-4">✅</p>
          <h1 className="text-xl font-semibold mb-2">আপডেট হয়েছে!</h1>
          <p className="text-ink/70 text-sm mb-6">
            পরিবর্তনগুলো আবার পর্যালোচনার জন্য পাঠানো হয়েছে।
          </p>
          <a href="/dashboard" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">ড্যাশবোর্ডে ফিরে যান</a>
        </main>
      </PageShell>
    );
  }

  const isServiceProvider = categorySlug === 'service-provider';
  const unionsForUpazila = form.upazila ? locations[form.upazila] || [] : [];
  const primaryName = subcategories.find((s) => s.id === primarySubcategoryId)?.name_bn;

  return (
    <PageShell>
      <main className="max-w-xl mx-auto px-4 py-6">
        {pendingFile && (
          <ImageCropper
            file={pendingFile}
            shape="circle"
            onCancel={() => setPendingFile(null)}
            onComplete={handleCropComplete}
          />
        )}

        <h1 className="text-xl font-semibold mb-4">প্রোফাইল এডিট করুন</h1>

        {isServiceProvider && slug && (
          <div className="bg-[#EEF1F8] border border-ink/10 rounded-md px-4 py-3 mb-4 text-sm">
            <p className="text-ink/60">
              প্রোফাইল লিংক: <span className="font-medium text-ink">/{slug}</span>
            </p>
            {primaryName && (
              <p className="text-ink/60 mt-1">
                প্রধান সেবা: <span className="font-medium text-ink">{primaryName}</span>
              </p>
            )}
            <p className="text-ink/40 text-xs mt-1">এই দুটো পরিবর্তন করা যায় না</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-ink/10 border-t-4 border-t-green p-6 space-y-4">
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
            <label className="block text-sm mb-1.5 text-ink/70">নাম (বাংলা)</label>
            <input
              type="text" required value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
            />
          </div>

          {isServiceProvider && (
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">নাম (ইংরেজি)</label>
              <input
                type="text" required value={form.nameEn}
                onChange={(e) => updateField('nameEn', e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
              />
              <p className="text-xs text-ink/50 mt-1">এটা বদলালেও প্রোফাইল লিংক (/{slug}) একই থাকবে</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">উপজেলা</label>
              <select
                required value={form.upazila}
                onChange={(e) => handleUpazilaChange(e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green bg-white"
              >
                <option value="">নির্বাচন করুন...</option>
                {upazilaList.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">ইউনিয়ন</label>
              <select
                required value={form.unionName} disabled={!form.upazila}
                onChange={(e) => updateField('unionName', e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green bg-white disabled:bg-paper disabled:text-ink/30"
              >
                <option value="">নির্বাচন করুন...</option>
                {unionsForUpazila.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-ink/70">সুনির্দিষ্ট এলাকা/বাজার</label>
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

          {isServiceProvider && (
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">কোন কোন সেবা দেন?</label>
              <div className="border border-ink/20 rounded-md divide-y divide-ink/10 max-h-64 overflow-y-auto">
                {subcategories.map((s) => {
                  const isPrimary = s.id === primarySubcategoryId;
                  const checked = isPrimary || selectedSubcategoryIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox" checked={checked} disabled={isPrimary}
                          onChange={() => toggleSubcategory(s.id)}
                          className="w-4 h-4"
                        />
                        {s.name_bn}
                      </span>
                      {isPrimary && <span className="text-[10px] bg-green/10 text-green px-2 py-0.5 rounded-full">প্রধান</span>}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-ink/50 mt-1.5">প্রধান সেবা বাদ দেওয়া যাবে না, শুধু নতুন সেবা যোগ/বাদ দেওয়া যাবে</p>
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
    </PageShell>
  );
}
