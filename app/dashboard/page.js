'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import NotificationBell from '../../components/NotificationBell';

const text = {
  bn: {
    myPosts: 'আমার পোস্ট ও প্রোফাইল',
    logout: 'লগআউট',
    providerSection: 'প্রোভাইডার প্রোফাইল',
    listingSection: 'পোস্ট',
    noProvider: 'এখনো কোনো প্রোফাইল তৈরি করেননি।',
    noListing: 'এখনো কোনো পোস্ট দেননি।',
    edit: 'এডিট',
    delete: 'ডিলিট',
    makeUnavailable: 'অনুপলব্ধ করুন',
    makeAvailable: 'পুনরায় সক্রিয় করুন',
    loginRequired: 'এই পেজ দেখতে হলে লগইন করা দরকার।',
    loginButton: 'লগইন করুন',
    loading: 'লোড হচ্ছে...',
    confirmDeleteProvider: 'আপনি কি নিশ্চিত এই প্রোফাইলটি মুছে ফেলতে চান?',
    confirmDeleteListing: 'আপনি কি নিশ্চিত এই পোস্টটি মুছে ফেলতে চান?',
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
    myPosts: 'My Posts & Profiles',
    logout: 'Logout',
    providerSection: 'Provider Profiles',
    listingSection: 'Posts',
    noProvider: "You haven't created any profile yet.",
    noListing: "You haven't posted anything yet.",
    edit: 'Edit',
    delete: 'Delete',
    makeUnavailable: 'Mark Unavailable',
    makeAvailable: 'Mark Available',
    loginRequired: 'Please log in to view this page.',
    loginButton: 'Log In',
    loading: 'Loading...',
    confirmDeleteProvider: 'Are you sure you want to delete this profile?',
    confirmDeleteListing: 'Are you sure you want to delete this post?',
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

const statusColor = {
  pending: 'text-marigold',
  approved: 'text-green',
  active: 'text-green',
  rejected: 'text-red-500',
  filled: 'text-ink/50',
  expired: 'text-ink/50',
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
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) await loadMyPosts(data.user.id);
    setLoading(false);
  }

  async function loadMyPosts(userId) {
    const { data: p } = await supabase
      .from('providers')
      .select('id, name, area, status, is_available, photo_url, categories(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setProviders(p || []);

    const { data: l } = await supabase
      .from('listings')
      .select('id, title, area, status, photos, categories(name)')
      .eq('user_id', userId)
      .order('posted_at', { ascending: false });
    setListings(l || []);
  }

  async function deleteProvider(id, photoUrl) {
    if (!confirm(t.confirmDeleteProvider)) return;

    const path = extractStoragePath(photoUrl);
    if (path) {
      await supabase.storage.from('images').remove([path]);
    }

    await supabase.from('providers').delete().eq('id', id);
    loadMyPosts(user.id);
  }

  async function deleteListing(id, photos) {
    if (!confirm(t.confirmDeleteListing)) return;

    const paths = (photos || []).map(extractStoragePath).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from('images').remove(paths);
    }

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

  if (loading) return <p className="text-center py-20 text-ink/60">{t.loading}</p>;

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">{t.loginRequired}</p>
        <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">{t.loginButton}</a>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
        <div className="flex items-center gap-3">
          <NotificationBell userId={user.id} />
          <div className="flex border border-ink/20 rounded-full overflow-hidden text-sm">
            <button
              onClick={() => setLang('bn')}
              className={`px-3 py-1 ${lang === 'bn' ? 'bg-green text-white' : 'text-ink/60'}`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 ${lang === 'en' ? 'bg-green text-white' : 'text-ink/60'}`}
            >
              English
            </button>
          </div>
          <button onClick={handleLogout} className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white">
            {t.logout}
          </button>
        </div>
      </header>

      <h1 className="text-2xl font-semibold mb-1">{t.myPosts}</h1>
      <p className="text-ink/60 text-sm mb-8">{user.email}</p>

      {/* প্রোভাইডার প্রোফাইল */}
      <section className="mb-10">
        <h2 className="text-lg font-medium mb-3">{t.providerSection} ({providers.length})</h2>
        {providers.length === 0 && (
          <p className="text-ink/50 text-sm">{t.noProvider}</p>
        )}
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p.id} className="bg-white border border-ink/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-ink/60">{p.categories?.name} · {p.area}</p>
                </div>
                <span className={`text-xs font-medium ${statusColor[p.status]}`}>
                  {t.status[p.status]}
                </span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <a href={`/dashboard/provider/${p.id}`} className="text-sm border border-ink/20 px-3 py-1.5 hover:bg-paper">
                  {t.edit}
                </a>
                {p.status === 'approved' && (
                  <button
                    onClick={() => toggleAvailability(p.id, p.is_available)}
                    className="text-sm border border-ink/20 px-3 py-1.5 hover:bg-paper"
                  >
                    {p.is_available ? t.makeUnavailable : t.makeAvailable}
                  </button>
                )}
                <button
                  onClick={() => deleteProvider(p.id, p.photo_url)}
                  className="text-sm border border-red-300 text-red-600 px-3 py-1.5 hover:bg-red-50"
                >
                  {t.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* লিস্টিং পোস্ট */}
      <section>
        <h2 className="text-lg font-medium mb-3">{t.listingSection} ({listings.length})</h2>
        {listings.length === 0 && (
          <p className="text-ink/50 text-sm">{t.noListing}</p>
        )}
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="bg-white border border-ink/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{l.title}</p>
                  <p className="text-sm text-ink/60">{l.categories?.name} · {l.area}</p>
                </div>
                <span className={`text-xs font-medium ${statusColor[l.status]}`}>
                  {t.status[l.status]}
                </span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <a href={`/dashboard/listing/${l.id}`} className="text-sm border border-ink/20 px-3 py-1.5 hover:bg-paper">
                  {t.edit}
                </a>
                {l.status === 'expired' && (
                  <button
                    onClick={() => renewListing(l.id)}
                    className="text-sm bg-green text-white px-3 py-1.5 hover:bg-green-dark"
                  >
                    {lang === 'bn' ? 'রিনিউ করুন (৩০ দিন)' : 'Renew (30 days)'}
                  </button>
                )}
                <button
                  onClick={() => deleteListing(l.id, l.photos)}
                  className="text-sm border border-red-300 text-red-600 px-3 py-1.5 hover:bg-red-50"
                >
                  {t.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
