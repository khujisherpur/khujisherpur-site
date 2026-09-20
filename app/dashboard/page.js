'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const statusLabel = {
  pending: { text: 'পর্যালোচনাধীন', color: 'text-marigold' },
  approved: { text: 'অ্যাপ্রুভড', color: 'text-green' },
  active: { text: 'অ্যাক্টিভ', color: 'text-green' },
  rejected: { text: 'রিজেক্টেড', color: 'text-red-500' },
  filled: { text: 'পূরণ হয়েছে', color: 'text-ink/50' },
  expired: { text: 'মেয়াদ শেষ', color: 'text-ink/50' },
};

export default function DashboardPage() {
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
      .select('id, name, area, status, is_available, categories(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setProviders(p || []);

    const { data: l } = await supabase
      .from('listings')
      .select('id, title, area, status, categories(name)')
      .eq('user_id', userId)
      .order('posted_at', { ascending: false });
    setListings(l || []);
  }

  async function deleteProvider(id) {
    if (!confirm('আপনি কি নিশ্চিত এই প্রোফাইলটি মুছে ফেলতে চান?')) return;
    await supabase.from('providers').delete().eq('id', id);
    loadMyPosts(user.id);
  }

  async function deleteListing(id) {
    if (!confirm('আপনি কি নিশ্চিত এই পোস্টটি মুছে ফেলতে চান?')) return;
    await supabase.from('listings').delete().eq('id', id);
    loadMyPosts(user.id);
  }

  async function toggleAvailability(id, current) {
    await supabase.from('providers').update({ is_available: !current }).eq('id', id);
    loadMyPosts(user.id);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">এই পেজ দেখতে হলে লগইন করা দরকার।</p>
        <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">লগইন করুন</a>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
        <button onClick={handleLogout} className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white">
          লগআউট
        </button>
      </header>

      <h1 className="text-2xl font-semibold mb-1">আমার পোস্ট ও প্রোফাইল</h1>
      <p className="text-ink/60 text-sm mb-8">{user.email}</p>

      {/* প্রোভাইডার প্রোফাইল */}
      <section className="mb-10">
        <h2 className="text-lg font-medium mb-3">প্রোভাইডার প্রোফাইল ({providers.length})</h2>
        {providers.length === 0 && (
          <p className="text-ink/50 text-sm">এখনো কোনো প্রোফাইল তৈরি করেননি।</p>
        )}
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p.id} className="bg-white border border-ink/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-ink/60">{p.categories?.name} · {p.area}</p>
                </div>
                <span className={`text-xs font-medium ${statusLabel[p.status]?.color}`}>
                  {statusLabel[p.status]?.text}
                </span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <a href={`/dashboard/provider/${p.id}`} className="text-sm border border-ink/20 px-3 py-1.5 hover:bg-paper">
                  এডিট
                </a>
                {p.status === 'approved' && (
                  <button
                    onClick={() => toggleAvailability(p.id, p.is_available)}
                    className="text-sm border border-ink/20 px-3 py-1.5 hover:bg-paper"
                  >
                    {p.is_available ? 'অনুপলব্ধ করুন' : 'পুনরায় সক্রিয় করুন'}
                  </button>
                )}
                <button
                  onClick={() => deleteProvider(p.id)}
                  className="text-sm border border-red-300 text-red-600 px-3 py-1.5 hover:bg-red-50"
                >
                  ডিলিট
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* লিস্টিং পোস্ট */}
      <section>
        <h2 className="text-lg font-medium mb-3">পোস্ট ({listings.length})</h2>
        {listings.length === 0 && (
          <p className="text-ink/50 text-sm">এখনো কোনো পোস্ট দেননি।</p>
        )}
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="bg-white border border-ink/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{l.title}</p>
                  <p className="text-sm text-ink/60">{l.categories?.name} · {l.area}</p>
                </div>
                <span className={`text-xs font-medium ${statusLabel[l.status]?.color}`}>
                  {statusLabel[l.status]?.text}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <a href={`/dashboard/listing/${l.id}`} className="text-sm border border-ink/20 px-3 py-1.5 hover:bg-paper">
                  এডিট
                </a>
                <button
                  onClick={() => deleteListing(l.id)}
                  className="text-sm border border-red-300 text-red-600 px-3 py-1.5 hover:bg-red-50"
                >
                  ডিলিট
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
