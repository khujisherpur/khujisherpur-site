'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import NotificationBell from './NotificationBell';

export default function HeaderBell() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="w-9 h-9 flex-shrink-0" />;

  if (user) return <NotificationBell userId={user.id} />;

  return (
    <a
      href="/login"
      className="relative text-lg border border-white/40 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-white/10 flex-shrink-0"
    >
      🔔
    </a>
  );
}
