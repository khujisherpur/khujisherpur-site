'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import ImageCropper from '../../../components/ImageCropper';
import { locations, upazilaList } from '../../../lib/locations';

const rentTypeLabels = { house: 'বাসা', shop: 'দোকান', mess: 'মেস', other: 'অন্যান্য' };
const roomOptions = ['১', '২', '৩', '৪+'];

const categoryFieldText = {
  rent: { titlePh: 'যেমন: ২ বেডরুম বাসা, শেরপুর সদর', priceLabel: 'ভাড়া', pricePh: '৮,০০০' },
  'buy-sell': { titlePh: 'যেমন: স্যামসাং স্মার্টফোন', priceLabel: 'মূল্য', pricePh: '১৫,০০০' },
  job: { titlePh: 'যেমন: সেলসম্যান প্রয়োজন', priceLabel: 'বেতন', pricePh: '১৫,০০০' },
  'agri-product': { titlePh: 'যেমন: টাটকা দেশি মুরগি (প্রতি কেজি)', priceLabel: 'মূল্য', pricePh: '৩০০' },
  teacher: { titlePh: 'যেমন: গণিত ও ইংরেজি প্রাইভেট টিউটর প্রয়োজন', priceLabel: 'টিউশন ফি (মাসিক)', pricePh: '৩,০০০' },
  venue: { titlePh: 'যেমন: কমিউনিটি সেন্টার ভাড়া দেওয়া হবে', priceLabel: 'ভাড়া', pricePh: '১০,০০০' },
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function NewPostForm() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [category, setCategory] = useState(null);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [subcategories, setSubcategories] = useState([]);

  const [form, setForm] = useState({
    title: '', name: '', ownerName: '', area: '', phone: '', priceOrSalary: '',
    description: '', rentType: 'house', bedrooms: '', bathrooms: '',
    condition: 'used', negotiable: false, deadline: '', vehicleType: 'ac',
    experienceYears: '', upazila: '', unionName: '', subcategoryId: '',
    sqft: '', amenities: '', mapLink: '',
    nameEn: '', slug: '', selectedSubcategoryIds: [], primarySubcategoryId: '',
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState(null); // 'checking' | 'available' | 'adjusted'
  const [finalSlug, setFinalSlug] = useState('');

  const [pendingFile, setPendingFile] = useState(null);
  const [providerPhoto, setProviderPhoto] = useState(null);
  const [listingPhotos, setListingPhotos] = useState([]);

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

  useEffect(() => {
    if (category?.slug !== 'service-provider') { setSubcategories([]); return; }
    supabase
      .from('subcategories')
      .select('id, name_bn, slug')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setSubcategories(data || []));
  }, [category]);

  // nameEn বদলালে, ম্যানুয়ালি slug এডিট না করা থাকলে অটো-জেনারেট
  useEffect(() => {
    if (category?.slug === 'service-provider' && !slugTouched) {
      setForm((f) => ({ ...f, slug: slugify(f.nameEn) }));
    }
  }, [form.nameEn]);

  // slug বদলালে অ্যাভেইলেবিলিটি চেক (debounced)
  useEffect(() => {
    if (category?.slug !== 'service-provider' || !form.slug) {
      setSlugStatus(null);
      setFinalSlug('');
      return;
    }
    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      let candidate = form.slug;
      let suffix = 1;
      while (true) {
        const { data } = await supabase.from('providers').select('id').eq('slug', candidate).maybeSingle();
        if (!data) break;
        suffix += 1;
        candidate = `${form.slug}-${suffix}`;
      }
      setFinalSlug(candidate);
      setSlugStatus(candidate === form.slug ? 'available' : 'adjusted');
    }, 500);
    return () => clearTimeout(timer);
  }, [form.slug, category]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleUpazilaChange(value) {
    setForm((f) => ({ ...f, upazila: value, unionName: '' }));
  }

  function toggleSubcategory(id) {
    setForm((f) => {
      const selected = f.selectedSubcategoryIds.includes(id)
        ? f.selectedSubcategoryIds.filter((x) => x !== id)
        : [...f.selectedSubcategoryIds, id];
      let primary = f.primarySubcategoryId;
      if (!selected.includes(primary)) primary = selected[0] || '';
      return { ...f, selectedSubcategoryIds: selected, primarySubcategoryId: primary };
    });
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) setPendingFile(file);
    e.target.value = '';
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
    if (!form.upazila || !form.unionName) {
      setError('উপজেলা ও ইউনিয়ন বাছাই করুন');
      return;
    }
    const isServiceProvider = category.slug === 'service-provider';
    if (isServiceProvider) {
      if (!form.nameEn.trim()) { setError('ইংরেজি নাম দিন (এটা দিয়ে আপনার প্রোফাইল লিংক তৈরি হবে)'); return; }
      if (form.selectedSubcategoryIds.length === 0) { setError('অন্তত একটা সেবা বাছাই করুন'); return; }
      if (!form.primarySubcategoryId) { setError('প্রধান সেবা বাছাই করুন'); return; }
    }
    setSubmitting(true);
    setError(null);

    try {
      const isService = category.type === 'service';
      const isAmbulance = category.slug === 'ambulance';
      const isRent = category.slug === 'rent';
      const isBuySell = category.slug === 'buy-sell';
      const isJob = category.slug === 'job';

      if (isService) {
        let photoUrl = null;
        if (providerPhoto) photoUrl = await uploadBlob(providerPhoto);

        const payload = {
          user_id: user.id,
          category_id: category.id,
          name: form.name,
          area: form.area,
          upazila: form.upazila,
          union_name: form.unionName,
          phone: form.phone,
          description: form.description,
          photo_url: photoUrl,
          experience_years: form.experienceYears ? parseInt(form.experienceYears) : null,
        };
        if (isAmbulance) payload.vehicle_type = form.vehicleType;
        if (isServiceProvider) {
          payload.name_en = form.nameEn.trim();
          payload.slug = finalSlug || slugify(form.nameEn);
          payload.primary_subcategory_id = form.primarySubcategoryId;
          payload.subcategory_id = form.primarySubcategoryId; // পুরনো কোডের সাথে সামঞ্জস্যের জন্য
        }

        const { data: inserted, error } = await supabase.from('providers').insert(payload).select('id').single();
        if (error) throw error;

        if (isServiceProvider && inserted) {
          const rows = form.selectedSubcategoryIds.map((sid) => ({ provider_id: inserted.id, subcategory_id: sid }));
          await supabase.from('provider_subcategories').insert(rows);
        }
      } else {
        let photoUrls = [];
        if (listingPhotos.length > 0) {
          photoUrls = await Promise.all(listingPhotos.map(uploadBlob));
        }

        let description = form.description;
        if (isBuySell) {
          const conditionText = form.condition === 'new' ? 'নতুন' : 'ব্যবহৃত';
          description = `কন্ডিশন: ${conditionText}${form.negotiable ? ' (দর কষাকষি যোগ্য)' : ''}\n\n${form.description}`;
        }
        if (isJob && form.deadline) {
          description = `আবেদনের শেষ তারিখ: ${form.deadline}\n\n${form.description}`;
        }
        if (isRent) {
          const parts = [];
          if (form.bedrooms) parts.push(`${form.bedrooms} বেডরুম`);
          if (form.bathrooms) parts.push(`${form.bathrooms} বাথরুম`);
          if (form.sqft) parts.push(`${form.sqft} বর্গফুট`);
          let rentBlock = parts.length ? `${parts.join(', ')}\n\n` : '';
          if (form.amenities) rentBlock += `সুযোগ-সুবিধা: ${form.amenities}\n\n`;
          description = `${rentBlock}${form.description}`;
          if (form.mapLink) description += `\n\nগুগল ম্যাপ: ${form.mapLink}`;
        }

        const payload = {
          user_id: user.id,
          category_id: category.id,
          title: form.title,
          area: form.area,
          upazila: form.upazila,
          union_name: form.unionName,
          price_or_salary: form.priceOrSalary,
          description,
          photos: photoUrls,
        };
        if (isRent) {
          payload.rent_type = form.rentType;
          payload.owner_name = form.ownerName;
        }

        const { error } = await supabase.from('listings').insert(payload);
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
  const isAmbulance = category.slug === 'ambulance';
  const isServiceProvider = category.slug === 'service-provider';
  const isRent = category.slug === 'rent';
  const isBuySell = category.slug === 'buy-sell';
  const isJob = category.slug === 'job';
  const showBedroomFields = isRent && (form.rentType === 'house' || form.rentType === 'mess');
  const unionsForUpazila = form.upazila ? locations[form.upazila] || [] : [];
  const primarySubcatName = subcategories.find((s) => s.id === form.primarySubcategoryId)?.name_bn;

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      {pendingFile && (
        <ImageCropper
          file={pendingFile}
          shape={isService ? 'circle' : 'square'}
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
        {isRent && (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">কীসের জন্য ভাড়া?</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(rentTypeLabels).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateField('rentType', key)}
                  className={`text-sm px-4 py-1.5 rounded-full border ${
                    form.rentType === key ? 'bg-green text-white border-green' : 'border-ink/20 text-ink/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isService ? (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">আপনার নাম (বাংলা)</label>
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
              placeholder={categoryFieldText[category.slug]?.titlePh || 'শিরোনাম লিখুন'}
            />
          </div>
        )}

        {isServiceProvider && (
          <>
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">আপনার নাম (ইংরেজি)</label>
              <input
                type="text" required value={form.nameEn}
                onChange={(e) => updateField('nameEn', e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
                placeholder="যেমন: Rahim Uddin"
              />
              <p className="text-xs text-ink/50 mt-1">এটা দিয়ে আপনার প্রোফাইলের লিংক তৈরি হবে</p>
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-ink/70">প্রোফাইল লিংক (URL)</label>
              <input
                type="text" required value={form.slug}
                onChange={(e) => { setSlugTouched(true); updateField('slug', slugify(e.target.value)); }}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green font-numeric"
                placeholder="rahim-uddin"
              />
              {form.slug && (
                <div className="mt-2 bg-paper border border-ink/10 rounded-md px-3 py-2 text-xs">
                  <p className="text-ink/60">
                    আপনার লিংক: <span className="font-medium text-green">
                      khujisherpur-site.pages.dev/{subcategories.find((s) => s.id === form.primarySubcategoryId)?.slug || '...'}/{slugStatus === 'checking' ? form.slug : (finalSlug || form.slug)}
                    </span>
                  </p>
                  {slugStatus === 'checking' && <p className="text-ink/40 mt-1">চেক করা হচ্ছে...</p>}
                  {slugStatus === 'available' && <p className="text-green mt-1">✓ এই লিংকটি পাওয়া যাচ্ছে</p>}
                  {slugStatus === 'adjusted' && (
                    <p className="text-marigold mt-1">⚠️ এই নামে আগে থেকে একজন আছে, তাই "{finalSlug}" ব্যবহার হবে</p>
                  )}
                  <p className="text-red-500 mt-1.5 font-medium">⚠️ এই লিংক পরে আর বদলানো যাবে না, ভালো করে দেখে নিন</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-ink/70">কোন কোন সেবা দেন? (একাধিক বাছাই করা যাবে)</label>
              <div className="border border-ink/20 rounded-md divide-y divide-ink/10 max-h-64 overflow-y-auto">
                {subcategories.map((s) => {
                  const checked = form.selectedSubcategoryIds.includes(s.id);
                  return (
                    <div key={s.id} className="flex items-center justify-between px-3 py-2.5">
                      <label className="flex items-center gap-2 text-sm flex-1">
                        <input
                          type="checkbox" checked={checked}
                          onChange={() => toggleSubcategory(s.id)}
                          className="w-4 h-4"
                        />
                        {s.name_bn}
                      </label>
                      {checked && (
                        <label className="flex items-center gap-1.5 text-xs text-ink/60 flex-shrink-0">
                          <input
                            type="radio" name="primarySubcategory"
                            checked={form.primarySubcategoryId === s.id}
                            onChange={() => updateField('primarySubcategoryId', s.id)}
                          />
                          প্রধান
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
              {primarySubcatName && (
                <p className="text-xs text-ink/50 mt-1.5">প্রধান সেবা: <span className="font-medium text-ink">{primarySubcatName}</span> (এটা পরে বদলানো যাবে না)</p>
              )}
            </div>
          </>
        )}

        {isRent && (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">বাড়ি/দোকান মালিকের নাম</label>
            <input
              type="text" required value={form.ownerName}
              onChange={(e) => updateField('ownerName', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
              placeholder="মালিকের নাম"
            />
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
              {upazilaList.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
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
              {unionsForUpazila.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {showBedroomFields && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">রুম সংখ্যা</label>
              <select
                value={form.bedrooms}
                onChange={(e) => updateField('bedrooms', e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green bg-white"
              >
                <option value="">নির্বাচন করুন...</option>
                {roomOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">বাথরুম সংখ্যা</label>
              <select
                value={form.bathrooms}
                onChange={(e) => updateField('bathrooms', e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green bg-white"
              >
                <option value="">নির্বাচন করুন...</option>
                {roomOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}

        {isRent && (
          <>
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">আয়তন (বর্গ-স্কয়ার ফিট, ঐচ্ছিক)</label>
              <input
                type="text" value={form.sqft}
                onChange={(e) => updateField('sqft', e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
                placeholder="যেমন: ৮৫০"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">সুযোগ-সুবিধা (ঐচ্ছিক)</label>
              <textarea
                rows={2} value={form.amenities}
                onChange={(e) => updateField('amenities', e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green resize-none"
                placeholder="যেমন: গ্যাস, পার্কিং, লিফট"
              />
            </div>
          </>
        )}

        {isBuySell && (
          <>
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">কন্ডিশন</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField('condition', 'new')}
                  className={`flex-1 text-sm py-2 border ${form.condition === 'new' ? 'bg-green text-white border-green' : 'border-ink/20 text-ink/60'}`}
                >
                  নতুন
                </button>
                <button
                  type="button"
                  onClick={() => updateField('condition', 'used')}
                  className={`flex-1 text-sm py-2 border ${form.condition === 'used' ? 'bg-green text-white border-green' : 'border-ink/20 text-ink/60'}`}
                >
                  ব্যবহৃত
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox" checked={form.negotiable}
                onChange={(e) => updateField('negotiable', e.target.checked)}
                className="w-4 h-4"
              />
              দর কষাকষি যোগ্য
            </label>
          </>
        )}

        <div>
          <label className="block text-sm mb-1.5 text-ink/70">সুনির্দিষ্ট এলাকা/বাজার</label>
          <input
            type="text" required value={form.area}
            onChange={(e) => updateField('area', e.target.value)}
            className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
            placeholder="যেমন: নিউ মার্কেট, শেখ হাটি বাজার"
          />
        </div>

        {isService && (
          <>
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">ফোন নম্বর</label>
              <input
                type="tel" required value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">অভিজ্ঞতা (বছর, ঐচ্ছিক)</label>
              <input
                type="number" min="0" value={form.experienceYears}
                onChange={(e) => updateField('experienceYears', e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
                placeholder="যেমন: ৫"
              />
            </div>
          </>
        )}

        {isAmbulance && (
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

        {!isService && (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">
              {categoryFieldText[category.slug]?.priceLabel || 'মূল্য'}
            </label>
            <div className="flex items-center border border-ink/20 focus-within:border-green">
              <span className="pl-3 pr-1 text-ink/50 text-lg font-numeric select-none">৳</span>
              <input
                type="text" required value={form.priceOrSalary}
                onChange={(e) => updateField('priceOrSalary', e.target.value)}
                className="flex-1 py-2.5 pr-3 outline-none text-lg font-numeric tracking-wide"
                placeholder={categoryFieldText[category.slug]?.pricePh || '০'}
                inputMode="numeric"
              />
            </div>
          </div>
        )}

        {isJob && (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">আবেদনের শেষ তারিখ (ঐচ্ছিক)</label>
            <input
              type="date" value={form.deadline}
              onChange={(e) => updateField('deadline', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
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

        {isRent && (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">গুগল ম্যাপ লিংক (ঐচ্ছিক)</label>
            <input
              type="url" value={form.mapLink}
              onChange={(e) => updateField('mapLink', e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
              placeholder="https://maps.google.com/..."
            />
          </div>
        )}

        {isService ? (
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">ছবি (ঐচ্ছিক)</label>
            {providerPhoto ? (
              <div className="flex items-center gap-3">
                <img src={URL.createObjectURL(providerPhoto)} alt="প্রিভিউ" className="w-20 h-20 object-cover rounded-full" />
                <button type="button" onClick={() => setProviderPhoto(null)} className="text-sm text-red-600 border border-red-300 px-3 py-1.5">
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
                    type="button" onClick={() => removeListingPhoto(i)}
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
