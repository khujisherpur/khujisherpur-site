'use client';
export const runtime = 'edge';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import ImageCropper from '../../../../components/ImageCropper';
import SiteHeader from '../../../../components/SiteHeader';
import { locations, upazilaList } from '../../../../lib/locations';

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
  const [newPhotoPreview, setNewPhotoPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
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

    if (error || !data) {
      setLoadFailed(true);
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
    if (newPhotoPreview) URL.revokeObjectURL(newPhotoPreview);
    setNewPhoto(blob);
    setNewPhotoPreview(URL.createObjectURL(blob));
    setRemovePhoto(false);
    setPendingFile(null);
  }

  function clearPhoto() {
    if (newPhotoPreview) URL.revokeObjectURL(newPhotoPreview);
    setNewPhoto(null);
    setNewPhotoPreview(null);
    if (currentPhotoUrl) setRemovePhoto(true);
  }

  function undoPhotoChange() {
    if (newPhotoPreview) URL.revokeObjectURL(newPhotoPreview);
    setNewPhoto(null);
    setNewPhotoPreview(null);
    setRemovePhoto(false);
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
    let uploadedUrl = null;

    try {
      let photoUrl = currentPhotoUrl;
      if (newPhoto) {
        uploadedUrl = await uploadBlob(newPhoto);
        photoUrl = uploadedUrl;
      } else if (removePhoto) {
        photoUrl = null;
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

      const { data: updated, error: updateError } = await supabase
        .from('providers')
        .update(payload)
        .eq('id', params.id)
        .select('id');
      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        throw new Error('সেভ করা যায়নি। আপনার অ্যাকাউন্ট সাসপেন্ড থাকতে পারে বা এই প্রোফাইল এডিটের অনুমতি নেই।');
      }

      if (categorySlug === 'service-provider') {
        const finalIds = Array.from(
          new Set([...selectedSubcategoryIds, primarySubcategoryId].filter(Boolean))
        );
        await supabase.from('provider_subcategories').delete().eq('provider_id', params.id);
        const rows = finalIds.map((sid) => ({ provider_id: params.id, subcategory_id: sid }));
        if (rows.length > 0) await supabase.from('provider_subcategories').insert(rows);
      }

      if ((newPhoto || removePhoto) && currentPhotoUrl) {
        const oldPath = extractStoragePath(currentPhotoUrl);
        if (oldPath) await supabase.storage.from('images').remove([oldPath]);
      }

      setSaved(true);
    } catch (err) {
      if (uploadedUrl) {
        const p = extractStoragePath(uploadedUrl);
        if (p) await supabase.storage.from('images').remove([p]);
      }
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
          <p className="text-ink/70">এই প্রোফাইলটি খুঁজে পাওয়া যায়নি বা এডিট করার অনুমতি নেই।</p>
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

  const isServiceProvider = categorySlug === 'service-provider';
  const unionsForUpazila = form.upazila ? locations[form.upazila] || [] : [];
  const primaryName = subcategories.find((s) => s.id === primarySubcategoryId)?.name_bn;
  const shownPhoto = newPhotoPreview || (removePhoto ? null : currentPhotoUrl);
  const photoChanged = !!newPhoto || removePhoto;

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

        <a href="/dashboard" className="text-sm text-ink/60 inline-block mb-3">← ড্যাশবোর্ড</a>
        <h1 className="text-xl font-semibold mb-4">প্রোফাইল এডিট করুন</h1>

        {isServiceProvider && slug && (
          <div className="bg-[#EEF1F8] border border-ink/10 rounded-xl px-4 py-3 mb-4 text-sm">
            <p className="text-ink/60">
              প্রোফাইল লিংক: <span className="font-medium text-ink">/{slug}</span>
            </p>
            {primaryName && (
              <p className="text-ink/60 mt-1">
                প্রধান সেবা: <span className="font-medium text-ink">{primaryName}</span>
              </p>
            )}
            <p className="text-ink/40 text-xs mt-1">🔒 এই দুটো পরিবর্তন করা যায় না</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-ink/10 border-t-4 border-t-green rounded-xl p-5 space-y-4">
          {/* ছবি */}
          <div>
            <label className="block text-sm mb-2 text-ink/70">প্রোফাইল ছবি</label>
            <div className="flex items-center gap-4">
              {shownPhoto ? (
                <img src={shownPhoto} alt="প্রোফাইল ছবি" className="w-20 h-20 rounded-full object-cover border border-ink/10" />
              ) : (
                <span className="w-20 h-20 rounded-full bg-[#EEF1F8] text-green-dark text-2xl font-semibold flex items-center justify-center">
                  {form.name?.charAt(0)}
                </span>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-sm border border-ink/20 rounded-lg px-4 py-2 cursor-pointer text-center active:bg-paper">
                  {shownPhoto ? 'ছবি বদলান' : '+ ছবি যোগ করুন'}
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </label>
                {shownPhoto && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="text-xs text-red-600 border border-red-300 rounded-lg px-4 py-1.5"
                  >
                    ছবি সরান
                  </button>
                )}
                {photoChanged && (
                  <button type="button" onClick={undoPhotoChange} className="text-xs text-ink/50 underline">
                    পরিবর্তন বাতিল
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-ink/70">নাম (বাংলা)</label>
            <input
              type="text" required value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
            />
          </div>

          {isServiceProvider && (
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">নাম (ইংরেজি)</label>
              <input
                type="text" required value={form.nameEn}
                onChange={(e) => updateField('nameEn', e.target.value)}
                className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
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
                className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green bg-white"
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
                className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green bg-white disabled:bg-paper disabled:text-ink/30"
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
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-ink/70">ফোন নম্বর</label>
            <input
              type="tel" required value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">অভিজ্ঞতা (বছর, ঐচ্ছিক)</label>
            <input
              type="number" min="0" value={form.experienceYears}
              onChange={(e) => updateField('experienceYears', e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green"
            />
          </div>

          {categorySlug === 'ambulance' && (
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">গাড়ির ধরন</label>
              <div className="flex gap-2">
                {[['ac', 'AC'], ['non_ac', 'Non-AC']].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateField('vehicleType', val)}
                    className={`flex-1 text-sm py-2 rounded-lg border ${form.vehicleType === val ? 'bg-green text-white border-green' : 'border-ink/20 text-ink/60'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isServiceProvider && (
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">কোন কোন সেবা দেন?</label>
              <div className="border border-ink/20 rounded-lg divide-y divide-ink/10 max-h-64 overflow-y-auto">
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
              className="w-full border border-ink/20 rounded-lg px-3 py-2.5 outline-none focus:border-green resize-none"
            />
          </div>

          <p className="text-xs text-marigold bg-marigold/10 rounded-lg px-3 py-2">
            ℹ️ সেভ করলে প্রোফাইলটি আবার পর্যালোচনায় যাবে, অনুমোদনের আগ পর্যন্ত সাইটে দেখা যাবে না।
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
