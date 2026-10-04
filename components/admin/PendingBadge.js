'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function PendingBadge({ type }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      let q;
      if (type === 'listings') {
        q = supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      } else if (type === 'providers') {
        q = supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      } else if (type === 'reports') {
        q = supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open');
      } else {
        return;
      }
      const { count } = await q;
      if (alive) setN(count || 0);
    }
    load();
    const t = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [type]);

  if (!n) return null;
  return (
    <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
      {n > 99 ? '99+' : n}
    </span>
  );
  }
