'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function fetchIn(table, select, col, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 40) {
    const { data } = await supabase.from(table).select(select).in(col, ids.slice(i, i + 40));
    if (data) out.push(...data);
  }
  return out;
}

const statusInfo = {
  pending: { text: 'পর্যালোচনাধীন', color: 'text-marigold bg-marigold/10' },
  approved: { text: 'অনুমোদিত', color: 'text-green bg-green/10' },
  active: { text: 'অনুমোদিত', color: 'text-green bg-green/10' },
  rejected: { text: 'বাতিল', color: 'text-red-500 bg-red-50' },
  expired: { text: 'মেয়াদোত্তীর্ণ', color: 'text-ink/50 bg-ink/5' },
  filled: { text: 'পূরণ হয়েছে', color: 'text-ink/50 bg-ink/5' },
};
const reportStatus = {
  open: { text: 'খোলা', color: 'bg-red-50 text-red-600' },
  reviewed: { text: 'পর্যালোচিত', color: 'bg-green/10 text-green' },
  dismissed: { text: 'বাতিল', color: 'bg-ink/5 text-ink/50' },
};

export default function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [targets, setTargets] = useState({});
  const [owners, setOwners] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('open');
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
      .from('reports')
      .select('id, target_type, target_id, reason, status, created_at, users(name, phone)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) {
      setError('রিপোর্ট লোড করা যায়নি: ' + err.message);
      setLoading(false);
      return;
    }
    const list = data || [];
    setReports(list);

    const lids = [...new Set(list.filter((r) => r.target_type === 'listing').map((r) => r.target_id))];
    const pids = [...new Set(list.filter((r) => r.target_type === 'provider').map((r) => r.target_id))];
    const [ls, ps] = await Promise.all([
      fetchIn('listings', 'id, title, status, user_id, photos, area, contact_phone', 'id', lids),
      fetchIn('providers', 'id, name, status, user_id, photo_url, area, phone', 'id', pids),
    ]);
    const map = {};
    ls.forEach((x) => {
      map['listing:' + x.id] = { title: x.title, status: x.status, owner: x.user_id, image: x.photos?.[0], area: x.area, phone: x.contact_phone };
    });
    ps.forEach((x) => {
      map['provider:' + x.id] = { title: x.name, status: x.status, owner: x.user_id, image: x.photo_url, area: x.area, phone: x.phone };
    });
    setTargets(map);

    const oids = [...new Set(Object.values(map).map((t) => t.owner).filter(Boolean))];
    const us = await fetchIn('users', 'id, name, phone', 'id', oids);
    setOwners(Object.fromEntries(us.map((u) => [u.id, u])));
    setLoading(false);
  }

  const perTarget = useMemo(() => {
    const m = {};
    reports.forEach((r) => {
      const k = r.target_type + ':' + r.target_id;
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [reports]);

  const counts = useMemo(
    () => ({
      open: reports.filter((r) => r.status === 'open').length,
      reviewed: reports.filter((r) => r.status === 'reviewed').length,
      dismissed: reports.filter((r) => r.status === 'dismissed').length,
      all: reports.length,
    }),
    [reports]
  );

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.status === filter);

  async function setStatus(id, status) {
    const { data, error: err } = await supabase.from('reports').update({ status }).eq('id', id).select('id');
    if (err || !data || data.length === 0) {
      alert('বদলানো যায়নি' + (err ? ': ' + err.message : ''));
      return;
    }
    setToast(status === 'reviewed' ? 'পর্যালোচনা সম্পন্ন' : 'রিপোর্ট বাতিল');
    load();
  }

  async function closeTarget(r) {
    if (!confirm('এটা বন্ধ করে দিতে চান? মালিকের ফোনে নোটিফিকেশন যাবে।')) return;
    const table = r.target_type === 'provider' ? 'providers' : 'listings';
    const { data, error: err } = await supabase
      .from(table)
      .update({ status: 'rejected', reject_reason: 'রিপোর্টের ভিত্তিতে বন্ধ করা হয়েছে' })
      .eq('id', r.target_id)
      .select('id');
    if (err || !data || data.length === 0) {
      alert('বন্ধ করা যায়নি' + (err ? ': ' + err.message : ''));
      return;
    }
    await supabase
      .from('reports')
      .update({ status: 'reviewed' })
      .eq('target_type', r.target_type)
      .eq('target_id', r.target_id)
      .eq('status', 'open');
    setToast('বন্ধ করা হয়েছে');
    load();
  }

  const chips = [
    { key: 'open', label: `খোলা (${counts.open})` },
    { key: 'reviewed', label: `পর্যালোচিত (${counts.reviewed})` },
    { key: 'dismissed', label: `বাতিল (${counts.dismissed})` },
    { key: 'all', label: `সব (${counts.all})` },
  ];

  return (
    <div>
      <h2 className="text-lg font-medium mb-3">রিপোর্ট/অভিযোগ</h2>

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
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm text-ink/50">কোনো রিপোর্ট নেই।</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((r) => {
          const key = r.target_type + ':' + r.target_id;
          const t = targets[key];
          const owner = t ? owners[t.owner] : null;
          const isProvider = r.target_type === 'provider';
          const total = perTarget[key] || 1;
          const live = t && (t.status === 'active' || t.status === 'approved');
          return (
            <div
              key={r.id}
              className={`bg-white rounded-xl border-l-4 ${
                r.status === 'open' ? 'border-l-red-400' : 'border-l-ink/20'
              } border-t border-r border-b border-ink/10 p-3`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                    {isProvider ? 'প্রোফাইল' : 'পোস্ট'}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${reportStatus[r.status]?.color || 'bg-paper text-ink/50'}`}>
                    {reportStatus[r.status]?.text || r.status}
                  </span>
                </div>
                <span className="text-[11px] text-ink/40">{fmtDate(r.created_at)}</span>
              </div>

              <p className="text-sm mt-2 leading-relaxed break-words">{r.reason}</p>
              <p className="text-[11px] text-ink/50 mt-1">
                রিপোর্টকারী: {r.users?.name || 'অজানা'}
                {r.users?.phone ? ` · ${r.users.phone}` : ''}
              </p>

              {t ? (
                <div className="mt-3 bg-paper rounded-lg p-2.5 flex gap-2.5">
                  {t.image ? (
                    <img src={t.image} alt="" className={`w-12 h-12 object-cover flex-shrink-0 ${isProvider ? 'rounded-full' : 'rounded-lg'}`} />
                  ) : (
                    <span className={`w-12 h-12 bg-[#EEF1F8] flex items-center justify-center flex-shrink-0 ${isProvider ? 'rounded-full' : 'rounded-lg'}`}>
                      {isProvider ? '👤' : '📄'}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-1">{t.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusInfo[t.status]?.color || 'bg-white text-ink/50'}`}>
                        {statusInfo[t.status]?.text || t.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink/50 line-clamp-1">{t.area}</p>
                    <p className="text-[11px] text-ink/60 mt-0.5 line-clamp-1">
                      মালিক: {owner?.name || 'অজানা'} · {t.phone || owner?.phone || '—'}
                    </p>
                    {total > 1 && <p className="text-[11px] text-red-600 mt-0.5">⚠️ এটার নামে মোট {total}টি রিপোর্ট</p>}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-ink/50 bg-paper rounded-lg px-3 py-2">
                  এই {isProvider ? 'প্রোফাইল' : 'পোস্ট'} আর পাওয়া যাচ্ছে না (মুছে ফেলা হয়ে থাকতে পারে)।
                </p>
              )}

              <div className="flex gap-2 mt-3 flex-wrap">
                {t && (
                  <a
                    href={isProvider ? `/provider/${r.target_id}` : `/listing/${r.target_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs border border-ink/20 px-3 py-2 rounded-lg"
                  >
                    পেজ দেখুন ↗
                  </a>
                )}
                {t && live && (
                  <button onClick={() => closeTarget(r)} className="text-xs border border-red-300 text-red-600 px-3 py-2 rounded-lg">
                    বন্ধ করুন
                  </button>
                )}
                {r.status === 'open' && (
                  <>
                    <button onClick={() => setStatus(r.id, 'reviewed')} className="text-xs bg-green text-white px-3 py-2 rounded-lg">
                      পর্যালোচনা সম্পন্ন
                    </button>
                    <button onClick={() => setStatus(r.id, 'dismissed')} className="text-xs border border-ink/20 px-3 py-2 rounded-lg">
                      বাতিল করুন
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
