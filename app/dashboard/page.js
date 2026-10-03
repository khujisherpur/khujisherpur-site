'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import NotificationBell from '../../components/NotificationBell';
import BottomNav from '../../components/BottomNav';
import SiteHeader from '../../components/SiteHeader';
import PushToggle from '../../components/PushToggle';

const text = {
  bn: {
    myPosts: 'আমার অ্যাকাউন্ট',
    logout: 'লগআউট',
    providerSection: 'প্রোভাইডার প্রোফাইল',
    listingSection: 'আমার পোস্ট',
    noProvider: 'এখনো কোনো প্রোফাইল তৈরি করেননি।',
    noListing: 'এখনো কোনো পোস্ট দেননি।',
    createNow: '+ পোস্ট দিন',
    edit: 'এডিট',
    view: 'দেখুন',
    delete: 'ডিলিট',
    makeUnavailable: 'অনুপলব্ধ করুন',
    makeAvailable: 'সক্রিয় করুন',
    unavailableTag: 'অনুপলব্ধ',
    loginRequired: 'এই পেজ দেখতে হলে লগইন করা দরকার।',
    loginButton: 'লগইন করুন',
    loading: 'লোড হচ্ছে...',
    confirmDeleteProvider: 'আপনি কি নিশ্চিত এই প্রোফাইলটি মুছে ফেলতে চান?',
    confirmDeleteListing: 'আপনি কি নিশ্চিত এই পোস্টটি মুছে ফেলতে চান?',
    renew: 'রিনিউ করুন (৩০ দিন)',
    views: 'ভিউ',
    statProfiles: 'প্রোফাইল',
    statPosts: 'পোস্ট',
    statViews: 'মোট ভিউ',
    favorites: 'সংরক্ষিত',
    donor: 'ডোনার ড্যাশবোর্ড',
    adminPanel: 'অ্যাডমিন প্যানেল',
    suspendedTitle: 'আপনার অ্যাকাউন্ট সাসপেন্ড করা আছে',
    suspendedBody: 'আপাতত আপনি নতুন পোস্ট বা প্রোফাইল তৈরি করতে বা বিদ্যমান পোস্ট এডিট করতে পারবেন না।',
    reason: 'কারণ: ',
    suspendedHelp: 'ভুল হয়ে থাকলে অ্যাডমিনের সাথে যোগাযোগ করুন।',
    status: {
      pending: 'পর্যালোচনাধীন',
      approved: 'অ্যাপ্রুভড',
      active: 'অ্যাক্টিভ',
      rejected: 'রিজেক্টেড',
      filled: 'পূরণ হয়েছে',
      expired: 'মেয়াদ শেষ',
    },
  },
  en: {
    myPosts: 'My Account',
    logout: 'Logout',
    providerSection: 'Provider Profiles',
    listingSection: 'My Posts',
    noProvider: "You haven't created any profile yet.",
    noListing: "You haven't posted anything yet.",
    createNow: '+ Post Ad',
    edit: 'Edit',
    view: 'View',
    delete: 'Delete',
    makeUnavailable: 'Mark Unavailable',
    makeAvailable: 'Mark Available',
    unavailableTag: 'Unavailable',
    loginRequired: 'Please log in to view this page.',
    loginButton: 'Log In',
    loading: 'Loading...',
    confirmDeleteProvider: 'Are you sure you want to delete this profile?',
    confirmDeleteListing: 'Are you sure you want to delete this post?',
    renew: 'Renew (30 days)',
    views: 'views',
    statProfiles: 'Profiles',
    statPosts: 'Posts',
    statViews: 'Total views',
    favorites: 'Saved',
    donor: 'Donor Dashboard',
    adminPanel: 'Admin Panel',
    suspendedTitle: 'Your account is suspended',
    suspendedBody: 'You cannot create new posts or profiles, or edit existing ones, for now.',
    reason: 'Reason: ',
    suspendedHelp: 'If this is a mistake, please contact the admin.',
    status: {
      pending: 'Pending Review',
      approved: 'Approved',
      active: 'Active',
      rejected: 'Rejected',
      filled: 'Filled',
      expired: 'Expired',
    },
  },
};

const statusStyle = {
  pending: 'bg-marigold/10 text-marigold',
  approved: 'bg-green/10 text-green',
  active: 'bg-green/10 text-green',
  rejected: 'bg-red-50 text-red-500',
  filled: 'bg-ink/5 text-ink/50',
  expired: 'bg-ink/5 text-ink/50',
};

function extractStoragePath(publicUrl) {
  if (!publicUrl) return null;
  const marker = '/images/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

export default function DashboardPage() {
  const [lang, setLang] = useState('bn');
  const t = text[lang];

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [listings, setListings] = useState([]);
  const [ban, setBan] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      await loadMyPosts(data.user.id);
      const [{ data: b }, { data: prof }] = await Promise.all([
        supabase.from('banned_users').select('reason').eq('user_id', data.user.id).maybeSingle(),
        supabase.from('users').select('name, role').eq('id', data.user.id).maybeSingle(),
      ]);
      setBan(b || null);
      setProfile(prof || null);
    }
    setLoading(false);
  }

  async function loadMyPosts(userId) {
    const { data: p } = await supabase
      .from('providers')
      .select('id, name, area, status, is_available, photo_url, view_count, categories(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setProviders(p || []);

    const { data: l } = await supabase
      .from('listings')
      .select('id, title, area, status, photos, view_count, price_or_salary, categories(name)')
      .eq('user_id', userId)
      .order('posted_at', { ascending: false });
    setListings(l || []);
  }

  async function deleteProvider(id, photoUrl) {
    if (!confirm(t.confirmDeleteProvider)) return;
    const path = extractStoragePath(photoUrl);
    if (path) await supabase.storage.from('images').remove([path]);
    await supabase.from('provider_subcategories').delete().eq('provider_id', id);
    await supabase.from('reviews').delete().eq('provider_id', id);
    await supabase.from('favorites').delete().eq('provider_id', id);
    await supabase.from('providers').delete().eq('id', id);
    loadMyPosts(user.id);
  }

  async function deleteListing(id, photos) {
    if (!confirm(t.confirmDeleteListing)) return;
    const paths = (photos || []).map(extractStoragePath).filter(Boolean);
    if (paths.length > 0) await supabase.storage.from('images').remove(paths);
    await supabase.from('listings').delete().eq('id', id);
    loadMyPosts(user.id);
  }

  async function toggleAvailability(id, current) {
    await supabase.from('providers').update({ is_available: !current }).eq('id', id);
    loadMyPosts(user.id);
  }

  async function renewListing(id) {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);
    await supabase
      .from('listings')
      .update({ status: 'active', expiry_date: newExpiry.toISOString() })
      .eq('id', id);
    loadMyPosts(user.id);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <>
        <SiteHeader lang={lang} simple />
        <p className="text-center py-20 text-ink/60">{t.loading}</p>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SiteHeader lang={lang} simple />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70 mb-4">{t.loginRequired}</p>
          <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5 rounded-lg">
            {t.loginButton}
          </a>
        </main>
      </>
    );
  }

  const displayName = profile?.name || user.email?.split('@')[0] || '';
  const isStaff = profile?.role === 'admin' || profile?.role === 'moderator';
  const totalViews =
    providers.reduce((s, p) => s + (p.view_count || 0), 0) +
    listings.reduce((s, l) => s + (l.view_count || 0), 0);

  return (
    <>
      <SiteHeader lang={lang} simple />
      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* Toolbar */}
        <div className="flex items-center justify-end gap-2 mb-3 flex-wrap">
          <NotificationBell userId={user.id} />
          <div className="flex border border-ink/20 rounded-full overflow-hidden text-xs bg-white">
            <button
              onClick={() => setLang('bn')}
              className={`px-3 py-1.5 ${lang === 'bn' ? 'bg-green text-white' : 'text-ink/60'}`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 ${lang === 'en' ? 'bg-green text-white' : 'text-ink/60'}`}
            >
              English
            </button>
          </div>
          <button onClick={handleLogout} className="text-xs border border-ink/20 rounded-full px-3.5 py-1.5 bg-white">
            {t.logout}
          </button>
        </div>

        {/* Profile header */}
        <section className="bg-gradient-to-br from-[#0F4D3A] to-[#1C8A4C] rounded-2xl p-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-14 h-14 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-2xl font-semibold flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-white/70">{t.myPosts}</p>
              <p className="font-semibold text-lg leading-tight truncate">{displayName}</p>
              <p className="text-xs text-white/70 truncate">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: t.statProfiles, value: providers.length },
              { label: t.statPosts, value: listings.length },
              { label: t.statViews, value: totalViews },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl py-2.5 text-center">
                <p className="text-xl font-semibold font-numeric">{s.value}</p>
                <p className="text-[10px] text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {ban && (
          <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-xl p-4 mt-4">
            <p className="font-semibold text-red-700 text-sm">🚫 {t.suspendedTitle}</p>
            <p className="text-red-600/80 text-xs mt-1 leading-relaxed">{t.suspendedBody}</p>
            {ban.reason && (
              <p className="text-red-700 text-xs mt-2 bg-white/60 rounded-lg px-3 py-2">
                {t.reason}{ban.reason}
              </p>
            )}
            <p className="text-red-600/60 text-[11px] mt-2">{t.suspendedHelp}</p>
          </div>
        )}

        <PushToggle lang={lang} />
        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <a
            href="/dashboard/favorites"
            className="bg-white border border-ink/10 rounded-xl p-3 flex items-center gap-2.5 active:bg-paper"
          >
            <span className="w-9 h-9 rounded-lg bg-[#EEF1F8] flex items-center justify-center">❤️</span>
            <span className="text-sm font-medium">{t.favorites}</span>
          </a>
          <a
            href="/dashboard/donor"
            className="bg-white border border-ink/10 rounded-xl p-3 flex items-center gap-2.5 active:bg-paper"
          >
            <span className="w-9 h-9 rounded-lg bg-[#EEF1F8] flex items-center justify-center">🩸</span>
            <span className="text-sm font-medium leading-tight">{t.donor}</span>
          </a>
          {isStaff && (
            <a
              href="/admin"
              className="col-span-2 bg-green-dark text-white rounded-xl p-3 flex items-center gap-2.5"
            >
              <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">⚙️</span>
              <span className="text-sm font-medium">{t.adminPanel}</span>
              <span className="ml-auto text-white/60">›</span>
            </a>
          )}
        </div>

        {/* Provider profiles */}
        <section className="mt-8">
          <h2 className="text-base font-semibold mb-3">
            {t.providerSection} <span className="text-ink/40 font-numeric">({providers.length})</span>
          </h2>
          {providers.length === 0 && (
            <div className="bg-white border border-dashed border-ink/20 rounded-xl p-6 text-center">
              <p className="text-3xl mb-1">🛠️</p>
              <p className="text-ink/50 text-sm mb-3">{t.noProvider}</p>
              <a href="/post/new?category=service-provider" className="inline-block bg-marigold text-ink text-sm font-semibold px-4 py-2 rounded-full">
                {t.createNow}
              </a>
            </div>
          )}
          <div className="space-y-3">
            {providers.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border-l-4 border-l-green border-t border-r border-b border-ink/10 p-3"
              >
                <div className="flex gap-3">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-16 h-16 rounded-full bg-[#EEF1F8] text-green-dark text-xl font-semibold flex items-center justify-center flex-shrink-0">
                      {p.name?.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-tight line-clamp-1">{p.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle[p.status] || 'bg-paper text-ink/50'}`}>
                        {t.status[p.status] || p.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink/60 mt-0.5 line-clamp-1">
                      {p.categories?.name} · {p.area}
                    </p>
                    <p className="text-[11px] text-ink/40 mt-1">
                      👁️ {p.view_count || 0} {t.views}
                      {p.status === 'approved' && !p.is_available && (
                        <span className="ml-2 text-red-500">● {t.unavailableTag}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <a
                    href={`/dashboard/provider/${p.id}`}
                    className="text-center text-xs bg-green text-white py-2 rounded-lg font-medium"
                  >
                    ✏️ {t.edit}
                  </a>
                  <a
                    href={`/provider/${p.id}`}
                    className="text-center text-xs border border-ink/20 py-2 rounded-lg"
                  >
                    {t.view}
                  </a>
                  <button
                    onClick={() => deleteProvider(p.id, p.photo_url)}
                    className="text-xs border border-red-300 text-red-600 py-2 rounded-lg"
                  >
                    {t.delete}
                  </button>
                </div>
                {p.status === 'approved' && (
                  <button
                    onClick={() => toggleAvailability(p.id, p.is_available)}
                    className="w-full mt-2 text-xs border border-ink/15 py-2 rounded-lg text-ink/70"
                  >
                    {p.is_available ? t.makeUnavailable : t.makeAvailable}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Listings */}
        <section className="mt-8">
          <h2 className="text-base font-semibold mb-3">
            {t.listingSection} <span className="text-ink/40 font-numeric">({listings.length})</span>
          </h2>
          {listings.length === 0 && (
            <div className="bg-white border border-dashed border-ink/20 rounded-xl p-6 text-center">
              <p className="text-3xl mb-1">📄</p>
              <p className="text-ink/50 text-sm mb-3">{t.noListing}</p>
              <a href="/post/new" className="inline-block bg-marigold text-ink text-sm font-semibold px-4 py-2 rounded-full">
                {t.createNow}
              </a>
            </div>
          )}
          <div className="space-y-3">
            {listings.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-xl border-l-4 border-l-marigold border-t border-r border-b border-ink/10 p-3"
              >
                <div className="flex gap-3">
                  {l.photos?.[0] ? (
                    <img src={l.photos[0]} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-16 h-16 rounded-lg bg-[#EEF1F8] flex items-center justify-center text-2xl flex-shrink-0">
                      📄
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-tight line-clamp-1">{l.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle[l.status] || 'bg-paper text-ink/50'}`}>
                        {t.status[l.status] || l.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink/60 mt-0.5 line-clamp-1">
                      {l.categories?.name} · {l.area}
                    </p>
                    <p className="text-[11px] text-ink/40 mt-1">
                      {l.price_or_salary && (
                        <span className="text-green font-numeric font-medium mr-2">৳ {l.price_or_salary}</span>
                      )}
                      👁️ {l.view_count || 0} {t.views}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <a
                    href={`/dashboard/listing/${l.id}`}
                    className="text-center text-xs bg-green text-white py-2 rounded-lg font-medium"
                  >
                    ✏️ {t.edit}
                  </a>
                  <a href={`/listing/${l.id}`} className="text-center text-xs border border-ink/20 py-2 rounded-lg">
                    {t.view}
                  </a>
                  <button
                    onClick={() => deleteListing(l.id, l.photos)}
                    className="text-xs border border-red-300 text-red-600 py-2 rounded-lg"
                  >
                    {t.delete}
                  </button>
                </div>
                {l.status === 'expired' && (
                  <button
                    onClick={() => renewListing(l.id)}
                    className="w-full mt-2 text-xs bg-marigold text-ink font-semibold py-2 rounded-lg"
                  >
                    {t.renew}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <BottomNav activeTab="account" />
        <div className="h-16" />
      </main>
    </>
  );
}
