'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function FavoriteButton({ targetType, targetId }) {
  const [user, setUser] = useState(null);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) await checkFavorite(data.user.id);
    setLoading(false);
  }

  async function checkFavorite(userId) {
    const column = targetType === 'provider' ? 'provider_id' : 'listing_id';
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq(column, targetId)
      .maybeSingle();
    setFavoriteId(data?.id || null);
  }

  async function toggleFavorite() {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (favoriteId) {
      await supabase.from('favorites').delete().eq('id', favoriteId);
      setFavoriteId(null);
    } else {
      const column = targetType === 'provider' ? 'provider_id' : 'listing_id';
      const { data } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, [column]: targetId })
        .select('id')
        .single();
      setFavoriteId(data?.id || null);
    }
  }

  if (loading) return null;

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      className={`text-sm border px-3 py-1.5 flex items-center gap-1.5 ${
        favoriteId
          ? 'border-red-300 text-red-500 bg-red-50'
          : 'border-ink/20 text-ink/60 hover:bg-paper'
      }`}
    >
      <span>{favoriteId ? '❤️' : '🤍'}</span>
      {favoriteId ? 'ফেভারিট করা আছে' : 'ফেভারিট করুন'}
    </button>
  );
}
