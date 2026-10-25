'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DonorsTab() {
  const [donors, setDonors] = useState([]);
  const [owners, setOwners] = useState({});
  const [donationCounts, setDonationCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    const [d, don] = await Promise.all([
      supabase.from('blood_donors').select('*'),
      supabase.from('blood_donations').select('donor_user_id'),
    ]);
    if (d.error) {
      setError('ডোনার তালিকা লোড করা যায়নি: ' + d.error.message);
      setLoading(false);
      return;
    }
    const list = (d.data || []).sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    const ids = list.map((x) => x.user_id).filter(Boolean);

    const [u, emailRes] = await Promise.all([
      ids.length ? supabase.rpc('admin_list_users', { uids: ids }) : Promise.resolve({ data: [] }),
      ids.length ? supabase.rpc('admin_user_info', { uids: ids }) : Promise.resolve({ data: [] }),
    ]);
    const emailMap = Object.fromEntries((emailRes.data || []).map((e) => [e.id, e.email]));
    const ownerMap = {};
    (u.data || []).forEach((x) => {
      ownerMap[x.id] = { ...x, email: emailMap[x.id] || null };
    });

    const counts = {};
    (don.data || []).forEach((r) => {
      if (r.donor_user_id) counts[r.donor_user_id] = (counts[r.donor_user_id] || 0) + 1;
    });

    setDonors(list);
    setOwners(ownerMap);
    setDonationCounts(counts);
    setLoading(false);
  }

  const groupTotals = useMemo(() => {
    const m = {};
    donors.forEach((x) => {
      m[x.blood_group] = (m[x.blood_group] || 0) + 1;
    });
    return m;
  }, [donors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return donors.filter((x) => {
      if (group !== 'all' && x.blood_group !== group) return false;
      if (status === 'active' && x.is_active === false) return false;
      if (status === 'inactive' && x.is_active !== false) return false;
      if (!q) return true;
      const o = owners[x.user_id] || {};
      return [x.name, x.phone, x.area, o.name, o.email, o.phone].some((v) =>
        (v || '').toString().toLowerCase().includes(q)
      );
    });
  }, [donors, owners, query, group, status]);

  const activeCount = donors.filter((x) => x.is_active !== false).length;

  if (loading) return <p className="text-sm text-ink/50">লোড হচ্ছে...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="text-lg font-medium mb-1">রক্তদাতা ব্যবস্থাপনা</h2>
      <p className="text-xs text-ink/50 mb-4">
        কে ডোনার প্রোফাইল বানিয়েছে এবং তাদের দেওয়া তথ্য। ফোন নম্বর শুধু অ্যাডমিন/মডারেটর দেখতে পান।
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-ink/10 p-3">
          <p className="text-xs text-ink/50">মোট ডোনার</p>
          <p className="text-xl font-semibold font-numeric mt-1">{donors.length}</p>
        </div>
        <div className="bg-white border border-ink/10 p-3">
          <p className="text-xs text-ink/50">সক্রিয়</p>
          <p className="text-xl font-semibold font-numeric mt-1 text-green">{activeCount}</p>
        </div>
        <div className="bg-white border border-ink/10 p-3">
          <p className="text-xs text-ink/50">নিষ্ক্রিয়</p>
          <p className="text-xl font-semibold font-numeric mt-1 text-ink/50">{donors.length - activeCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          onClick={() => setGroup('all')}
          className={`text-xs px-3 py-1.5 rounded-full border ${group === 'all' ? 'bg-green text-white border-green' : 'border-ink/20 text-ink/70'}`}
        >
          সব গ্রুপ
        </button>
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`text-xs px-3 py-1.5 rounded-full border ${group === g ? 'bg-green text-white border-green' : 'border-ink/20 text-ink/70'}`}
          >
            {g} <span className="font-numeric">({groupTotals[g] || 0})</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="নাম, ফোন, এলাকা বা ইমেইল দিয়ে খুঁজুন"
          className="flex-1 min-w-0 border border-ink/15 px-3 py-2 text-sm rounded-md"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-ink/15 px-2 py-2 text-sm rounded-md bg-white"
        >
          <option value="all">সব</option>
          <option value="active">সক্রিয়</option>
          <option value="inactive">নিষ্ক্রিয়</option>
        </select>
      </div>

      {filtered.length === 0 && <p className="text-sm text-ink/50">কোনো ডোনার পাওয়া যায়নি।</p>}

      <div className="space-y-2">
        {filtered.map((x) => {
          const o = owners[x.user_id];
          const active = x.is_active !== false;
          return (
            <div key={x.id} className="bg-white border border-ink/10 p-3 flex gap-3">
              <span className="w-11 h-11 rounded-full bg-red-50 text-red-600 font-semibold flex items-center justify-center flex-shrink-0 text-sm">
                {x.blood_group}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{x.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-green/10 text-green' : 'bg-ink/5 text-ink/40'}`}>
                    {active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>
                <p className="text-xs text-ink/60 mt-0.5">
                  📞{' '}
                  <a href={`tel:${x.phone}`} className="font-numeric underline">
                    {x.phone}
                  </a>
                  {x.area ? ` · 📍 ${x.area}` : ''}
                </p>
                <p className="text-xs text-ink/50 mt-1">
                  {x.created_at ? `নিবন্ধন: ${fmtDate(x.created_at)} · ` : ''}
                  রক্ত দিয়েছেন: <span className="font-numeric">{donationCounts[x.user_id] || 0}</span> বার
                </p>
                <p className="text-xs text-ink/50 mt-1 break-words">
                  অ্যাকাউন্ট:{' '}
                  {o ? [o.name || o.full_name, o.email, o.phone].filter(Boolean).join(' · ') || 'তথ্য নেই' : 'পাওয়া যায়নি'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
