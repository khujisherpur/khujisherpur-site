'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import BottomNav from '../../../components/BottomNav';
export default function FavoritesPage() {
  const [user, setUser] = useState(null);
  const [providers, setProviders] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) await loadFavorites(data.user.id);
    setLoading(false);
  }

  async function loadFavorites(userId) {
    const { data: favs } = await supabase
      .from('favorites')
      .select('id, provider_id, listing_id')
      .eq('user_id', userId);

    const providerIds = (favs || []).filter((f) => f.provider_id).map((f) => f.provider_id);
    const listingIds = (favs || []).filter((f) => f.listing_id).map((f) => f.listing_id);

    if (providerIds.length > 0) {
      const { data } = await supabase
        .from('providers')
        .select('id, name, area, categories(name)')
        .in('id', providerIds);
      setProviders(data || []);
    }

    if (listingIds.length > 0) {
      const { data } = await supabase
        .from('listings')
        .select('id, title, area, price_or_salary, categories(name)')
        .in('id', listingIds);
      setListings(data || []);
    }
  }

  if (loading) return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">এই পেজ দেখতে লগইন করুন।</p>
        <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">লগইন করুন</a>
      </main>
    );
  }

  const isEmpty = providers.length === 0 && listings.length === 0;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <header className="mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
      </header>

      <a href="/dashboard" className="text-sm text-ink/50 hover:text-ink">← ড্যাশবোর্ডে ফিরে যান</a>

      <h1 className="text-2xl font-semibold mt-3 mb-6">আমার ফেভারিট</h1>

      {isEmpty && (
        <p className="text-ink/50 text-sm">এখনো কিছু ফেভারিট করেননি।</p>
      )}

      {providers.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-3">প্রোভাইডার ({providers.length})</h2>
          <div className="space-y-3">
            {providers.map((p) => (
              <a key={p.id} href={`/provider/${p.id}`} className="block bg-white p-4 border border-ink/10 hover:border-green">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-ink/60 mt-1">{p.categories?.name} · {p.area}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {listings.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-3">পোস্ট ({listings.length})</h2>
          <div className="space-y-3">
            {listings.map((l) => (
              <a key={l.id} href={`/listing/${l.id}`} className="block bg-white p-4 border border-ink/10 hover:border-green">
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-ink/60 mt-1">{l.categories?.name} · {l.area}</p>
                <p className="text-sm text-green font-medium mt-1">{l.price_or_salary}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      <BottomNav activeTab="favorites" />
      <div className="h-16" />
    </main>
  );
}
