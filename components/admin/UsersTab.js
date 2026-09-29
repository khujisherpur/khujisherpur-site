'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const roleLabel = { admin: 'অ্যাডমিন', moderator: 'মডারেটর', user: 'ইউজার' };
const roleColor = {
  admin: 'bg-marigold/15 text-marigold',
  moderator: 'bg-green/10 text-green',
  user: 'bg-ink/5 text-ink/50',
};

function tally(rows) {
  const map = {};
  (rows || []).forEach((r) => {
    if (r.user_id) map[r.user_id] = (map[r.user_id] || 0) + 1;
  });
  return map;
}

function displayName(u) {
  return u.name || u.email || u.phone || 'নামহীন';
}

export default function UsersTab({ currentUserId, currentRole }) {
  const [users, setUsers] = useState([]);
  const [bans, setBans] = useState({});
  const [postCounts, setPostCounts] = useState({});
  const [profileCounts, setProfileCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
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
    const [u, b, l, p] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('banned_users').select('user_id, reason, banned_at'),
      supabase.from('listings').select('user_id'),
      supabase.from('providers').select('user_id'),
    ]);
    if (u.error) {
      setError('ইউজার তালিকা লোড করা যায়নি: ' + u.error.message);
      setLoading(false);
      return;
    }
    const list = (u.data || []).slice().sort((a, c) => {
      return new Date(c.created_at || 0) - new Date(a.created_at || 0);
    });
    setUsers(list);
    setBans(Object.fromEntries((b.data || []).map((x) => [x.user_id, x])));
    setPostCounts(tally(l.data));
    setProfileCounts(tally(p.data));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === 'banned' && !bans[u.id]) return false;
      if (filter === 'staff' && u.role !== 'admin' && u.role !== 'moderator') return false;
      if (!q) return true;
      return [u.name, u.email, u.phone].some((v) => (v || '').toString().toLowerCase().includes(q));
    });
  }, [users, bans, query, filter]);

  function openUser(u) {
    setSelected(u);
    setReason('');
  }

  async function banUser() {
    if (!selected) return;
    setBusy(true);
    const { error: err } = await supabase
      .from('banned_users')
      .upsert({ user_id: selected.id, reason: reason.trim() || null });
    setBusy(false);
    if (err) {
      alert('ব্যান করা যায়নি: ' + err.message);
      return;
    }
    setToast('ইউজারকে ব্যান করা হয়েছে');
    setSelected(null);
    load();
  }

  async function unbanUser() {
    if (!selected) return;
    setBusy(true);
    const { error: err } = await supabase.from('banned_users').delete().eq('user_id', selected.id);
    setBusy(false);
    if (err) {
      alert('আনব্যান করা যায়নি: ' + err.message);
      return;
    }
    setToast('ব্যান তুলে নেওয়া হয়েছে');
    setSelected(null);
    load();
  }

  async function changeRole(newRole) {
    if (!selected || selected.role === newRole) return;
    if (!confirm(`${displayName(selected)}-কে "${roleLabel[newRole]}" বানাতে চান?`)) return;
    setBusy(true);
    const { error: err } = await supabase.from('users').update({ role: newRole }).eq('id', selected.id);
    setBusy(false);
    if (err) {
      alert('রোল বদলানো যায়নি: ' + err.message);
      return;
    }
    setToast('রোল বদলানো হয়েছে');
    setSelected(null);
    load();
  }

  const bannedCount = Object.keys(bans).length;
  const isSelf = selected?.id === currentUserId;
  const selectedIsStaff = selected && (selected.role === 'admin' || selected.role === 'moderator');
  const canBan = selected && !isSelf && !selectedIsStaff;
  const chips = [
    { key: 'all', label: `সব (${users.length})` },
    { key: 'banned', label: `ব্যান করা (${bannedCount})` },
    { key: 'staff', label: 'অ্যাডমিন/মডারেটর' },
  ];

  return (
    <div>
      <h2 className="text-lg font-medium mb-3">ব্যবহারকারী ব্যবস্থাপনা</h2>

      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
          className="w-full border border-ink/15 bg-white rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-green"
        />
      </div>

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
          <p className="text-3xl mb-2">👥</p>
          <p className="text-sm text-ink/50">কোনো ইউজার পাওয়া যায়নি।</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((u) => {
          const banned = !!bans[u.id];
          return (
            <button
              key={u.id}
              onClick={() => openUser(u)}
              className={`w-full text-left bg-white rounded-xl border-l-4 ${
                banned ? 'border-l-red-400' : 'border-l-green'
              } border-t border-r border-b border-ink/10 p-3 flex items-center gap-3 active:bg-paper`}
            >
              <span className="w-10 h-10 rounded-full bg-[#EEF1F8] text-green-dark font-semibold flex items-center justify-center flex-shrink-0">
                {displayName(u).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{displayName(u)}</p>
                  {u.role && u.role !== 'user' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${roleColor[u.role]}`}>
                      {roleLabel[u.role]}
                    </span>
                  )}
                  {banned && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 flex-shrink-0">
                      ব্যান
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/50 truncate">{u.email || u.phone || '—'}</p>
                <p className="text-[11px] text-ink/40 mt-0.5">
                  📄 {postCounts[u.id] || 0} পোস্ট · 👤 {profileCounts[u.id] || 0} প্রোফাইল
                </p>
              </div>
              <span className="text-ink/30 flex-shrink-0">›</span>
            </button>
          );
        })}
      </div>

      {/* Bottom sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !busy && setSelected(null)} />
          <div className="relative bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl max-h-[88vh] overflow-y-auto p-5 pb-8">
            <div className="w-10 h-1 bg-ink/15 rounded-full mx-auto mb-4 md:hidden" />

            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-12 rounded-full bg-[#EEF1F8] text-green-dark text-lg font-semibold flex items-center justify-center">
                {displayName(selected).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-semibold truncate">{displayName(selected)}</p>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${roleColor[selected.role] || roleColor.user}`}>
                  {roleLabel[selected.role] || 'ইউজার'}
                </span>
              </div>
            </div>

            <div className="bg-paper rounded-xl p-3 text-sm space-y-1.5 mb-4">
              {selected.email && <p><span className="text-ink/50">ইমেইল:</span> {selected.email}</p>}
              {selected.phone && <p><span className="text-ink/50">ফোন:</span> {selected.phone}</p>}
              {selected.created_at && (
                <p>
                  <span className="text-ink/50">যোগদান:</span>{' '}
                  {new Date(selected.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <p>
                <span className="text-ink/50">পোস্ট/প্রোফাইল:</span>{' '}
                {postCounts[selected.id] || 0} / {profileCounts[selected.id] || 0}
              </p>
            </div>

            {bans[selected.id] && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm mb-4">
                <p className="font-medium text-red-700">এই ইউজার ব্যান করা আছে</p>
                {bans[selected.id].reason && <p className="text-red-600/80 mt-1">কারণ: {bans[selected.id].reason}</p>}
              </div>
            )}

            {/* Ban / Unban */}
            {bans[selected.id] ? (
              <button
                onClick={unbanUser}
                disabled={busy}
                className="w-full bg-green text-white text-sm font-medium py-3 rounded-xl disabled:opacity-50"
              >
                {busy ? 'অপেক্ষা করুন...' : 'ব্যান তুলে নিন'}
              </button>
            ) : canBan ? (
              <div className="space-y-2">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="ব্যানের কারণ (ঐচ্ছিক)"
                  className="w-full border border-ink/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                />
                <button
                  onClick={banUser}
                  disabled={busy}
                  className="w-full bg-red-600 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-50"
                >
                  {busy ? 'অপেক্ষা করুন...' : 'ইউজারকে ব্যান করুন'}
                </button>
                <p className="text-[11px] text-ink/40 text-center">
                  ব্যান হলে নতুন পোস্ট বা প্রোফাইল বানাতে পারবে না।
                </p>
              </div>
            ) : (
              <p className="text-xs text-ink/50 text-center">
                {isSelf ? 'নিজেকে ব্যান করা যায় না।' : 'অ্যাডমিন/মডারেটরকে ব্যান করা যায় না। আগে রোল বদলান।'}
              </p>
            )}

            {/* Role change (admin only) */}
            {currentRole === 'admin' && !isSelf && (
              <div className="mt-5 pt-4 border-t border-ink/10">
                <p className="text-xs text-ink/50 mb-2">রোল পরিবর্তন</p>
                <div className="grid grid-cols-3 gap-2">
                  {['user', 'moderator', 'admin'].map((r) => (
                    <button
                      key={r}
                      onClick={() => changeRole(r)}
                      disabled={busy || selected.role === r}
                      className={`text-xs py-2 rounded-lg border ${
                        selected.role === r
                          ? 'bg-green text-white border-green'
                          : 'bg-white border-ink/20 text-ink/70'
                      } disabled:opacity-60`}
                    >
                      {roleLabel[r]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelected(null)}
              disabled={busy}
              className="w-full mt-4 text-sm text-ink/60 py-2"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
