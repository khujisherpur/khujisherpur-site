'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState('');

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function load() {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, is_hidden, provider_id, user_id, reply, users(name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (err) {
      setError('রিভিউ লোড করা যায়নি: ' + err.message);
      setLoading(false);
      return;
    }
    const list = data || [];
    setReviews(list);
    const ids = [...new Set(list.map((r) => r.provider_id).filter(Boolean))];
    if (ids.length) {
      const { data: ps } = await supabase.from('providers').select('id, name').in('id', ids);
      setProviders(Object.fromEntries((ps || []).map((p) => [p.id, p.name])));
    }
    setLoading(false);
  }

  async function toggleHidden(r) {
    const { data, error: err } = await supabase
      .from('reviews')
      .update({ is_hidden: !r.is_hidden })
      .eq('id', r.id)
      .select('id');
    if (err || !data || data.length === 0) {
      alert('বদলানো যায়নি' + (err ? ': ' + err.message : ''));
      return;
    }
    setToast(r.is_hidden ? 'রিভিউ আবার দেখানো হচ্ছে' : 'রিভিউ লুকানো হয়েছে');
    load();
  }

  async function removeReview(r) {
    if (!confirm('এই রিভিউ চিরতরে মুছে ফেলতে চান?')) return;
    const { data, error: err } = await supabase.from('reviews').delete().eq('id', r.id).select('id');
    if (err || !data || data.length === 0) {
      alert('মোছা যায়নি' + (err ? ': ' + err.message : ''));
      return;
    }
    setToast('রিভিউ মুছে ফেলা হয়েছে');
    load();
  }

  const hiddenCount = reviews.filter((r) => r.is_hidden).length;
  const lowCount = reviews.filter((r) => r.rating <= 2).length;
  const chips = [
    { key: 'all', label: `সব (${reviews.length})` },
    { key: 'hidden', label: `লুকানো (${hiddenCount})` },
    { key: 'low', label: `কম রেটিং (${lowCount})` },
  ];

  const filtered = useMemo(() => {
    if (filter === 'hidden') return reviews.filter((r) => r.is_hidden);
    if (filter === 'low') return reviews.filter((r) => r.rating <= 2);
    return reviews;
  }, [reviews, filter]);

  return (
    <div>
      <h2 className="text-lg font-medium mb-3">রিভিউ ব্যবস্থাপনা</h2>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`text-xs px-3.5 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 border transition-colors ${
              filter === c.key ? 'bg-green text-white border-green' : 'bg-white text-ink/70 border-ink/15'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-ink/50 text-sm py-10">লোড হচ্ছে...</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">⭐</p>
          <p className="text-sm text-ink/50">কোনো রিভিউ নেই।</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((r) => (
          <div
            key={r.id}
            className={`bg-white rounded-xl border-l-4 ${
              r.is_hidden ? 'border-l-red-400' : 'border-l-marigold'
            } border-t border-r border-b border-ink/10 p-3`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.users?.name || 'ইউজার'}</p>
                <p className="text-[11px] text-ink/45">{fmtDate(r.created_at)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-marigold text-sm leading-none">
                  {'★'.repeat(r.rating)}
                  <span className="text-ink/20">{'★'.repeat(5 - r.rating)}</span>
                </span>
                {r.is_hidden && (
                  <p className="text-[10px] mt-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full inline-block">
                    লুকানো
                  </p>
                )}
              </div>
            </div>

            {r.comment ? (
              <p className="text-sm text-ink/75 mt-2 leading-relaxed break-words">{r.comment}</p>
            ) : (
              <p className="text-xs text-ink/35 mt-2">(কোনো মন্তব্য নেই)</p>
            )}

            {r.reply && (
              <div className="mt-2 pl-3 border-l-2 border-green/30">
                <p className="text-[11px] font-medium text-green">সেবাদাতার জবাব</p>
                <p className="text-xs text-ink/65 mt-0.5 break-words">{r.reply}</p>
              </div>
            )}

            <p className="text-xs text-ink/50 mt-2">
              প্রোফাইল:{' '}
              <a
                href={`/provider/${r.provider_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green underline"
              >
                {providers[r.provider_id] || 'দেখুন'} ↗
              </a>
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => toggleHidden(r)}
                className={`flex-1 text-xs py-2 rounded-lg ${
                  r.is_hidden ? 'bg-green text-white' : 'border border-ink/20 text-ink/70'
                }`}
              >
                {r.is_hidden ? 'আবার দেখান' : 'লুকান'}
              </button>
              <button
                onClick={() => removeReview(r)}
                className="flex-1 text-xs border border-red-300 text-red-600 py-2 rounded-lg"
              >
                মুছুন
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
