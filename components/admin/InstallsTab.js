'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function InstallsTab() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.rpc('get_pwa_install_stats').then(({ data, error }) => {
      if (error) setError(error.message);
      else setStats(data || { total: 0, android: 0, ios: 0, today: 0 });
    });
  }, []);

  if (error) return <p className="text-sm text-red-500">লোড ব্যর্থ: {error}</p>;
  if (!stats) return <p className="text-sm text-ink/50">লোড হচ্ছে...</p>;

  const cards = [
    { label: 'মোট ইনস্টল', value: stats.total },
    { label: 'আজকের ইনস্টল', value: stats.today },
    { label: 'Android', value: stats.android },
    { label: 'iPhone', value: stats.ios },
  ];

  return (
    <div>
      <h2 className="text-lg font-medium mb-3">📲 অ্যাপ ইনস্টল</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-ink/10 p-4">
            <p className="text-xs text-ink/50">{c.label}</p>
            <p className="text-2xl font-semibold font-numeric mt-1">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
