'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const roleLabel = { admin: 'অ্যাডমিন', moderator: 'মডারেটর', user: 'ইউজার' };
const roleColor = {
  admin: 'bg-marigold/15 text-marigold',
  moderator: 'bg-green/10 text-green',
  user: 'bg-ink/5 text-ink/50',
};
const statusLabel = {
  pending: { text: 'পর্যালোচনাধীন', color: 'text-marigold bg-marigold/10' },
  approved: { text: 'অনুমোদিত', color: 'text-green bg-green/10' },
  active: { text: 'অনুমোদিত', color: 'text-green bg-green/10' },
  rejected: { text: 'বাতিল', color: 'text-red-500 bg-red-50' },
  expired: { text: 'মেয়াদোত্তীর্ণ', color: 'text-ink/50 bg-ink/5' },
};
const fieldLabels = {
  name: 'নাম', email: 'ইমেইল', phone: 'ফোন', address: 'ঠিকানা', area: 'এলাকা',
  upazila: 'উপজেলা', union_name: 'ইউনিয়ন', bio: 'পরিচিতি', gender: 'লিঙ্গ',
  full_name: 'পূর্ণ নাম', whatsapp: 'হোয়াটসঅ্যাপ',
};
const hiddenFields = ['id', 'role', 'created_at', 'updated_at', 'avatar_url', 'photo_url', 'image_url'];

function tally(rows) {
  const map = {};
  (rows || []).forEach((r) => {
    if (r.user_id) map[r.user_id] = (map[r.user_id] || 0) + 1;
  });
  return map;
}

function displayName(u) {
  return u.name || u.full_name || u.email || u.phone || 'নামহীন';
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Avatar({ u, size = 'w-10 h-10', text = '' }) {
  const src = u.avatar_url || u.photo_url || u.image_url;
  if (src) {
    return <img src={src} alt="" className={`${size} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <span className={`${size} ${text} rounded-full bg-[#EEF1F8] text-green-dark font-semibold flex items-center justify-center flex-shrink-0`}>
      {displayName(u).charAt(0).toUpperCase()}
    </span>
  );
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
  const [tab, setTab] = useState('info');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [items, setItems] = useState({ loading: false, listings: [], providers: [], error: '' });

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
    const list = (u.data || []).slice().sort((a, c) => new Date(c.created_at || 0) - new Date(a.created_at || 0));
    setUsers(list);
    setBans(Object.fromEntries((b.data || []).map((x) => [x.user_id, x])));
    setPostCounts(tally(l.data));
    setProfileCounts(tally(p.data));
    setLoading(false);
  }

  async function loadItems(userId) {
    setItems({ loading: true, listings: [], providers: [], error: '' });
    const [l, p] = await Promise.all([
      supabase
        .from('listings')
        .select('id, title, area, price_or_salary, status, posted_at, photos, categories(name)')
        .eq('user_id', userId)
        .order('posted_at', { ascending: false }),
      supabase
        .from('providers')
        .select('id, name, area, phone, status, photo_url, created_at, is_verified, categories(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ]);
    setItems({
      loading: false,
      listings: l.data || [],
      providers: p.data || [],
      error: l.error?.message || p.error?.message || '',
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === 'banned' && !bans[u.id]) return false;
      if (filter === 'staff' && u.role !== 'admin' && u.role !== 'moderator') return false;
      if (!q) return true;
      return [u.name, u.full_name, u.email, u.phone].some((v) => (v || '').toString().toLowerCase().includes(q));
    });
  }, [users, bans, query, filter]);

  function openUser(u) {
    setSelected(u);
    setTab('info');
    setReason('');
    loadItems(u.id);
  }

  async function banUser() {
    if (!selected) return;
    setBusy(true);
    const { error: err } = await supabase
      .from('banned_users')
      .upsert({ user_id: selected.id, reason: reason.trim() || null });
    setBusy(false);
    if (err) { alert('সাসপেন্ড করা যায়নি: ' + err.message); return; }
    setToast('ইউজারকে সাসপেন্ড করা হয়েছে');
    setSelected(null);
    load();
  }

  async function unbanUser() {
    if (!selected) return;
    setBusy(true);
    const { error: err } = await supabase.from('banned_users').delete().eq('user_id', selected.id);
    setBusy(false);
    if (err) { alert('সাসপেন্ড তুলে নেওয়া যায়নি: ' + err.message); return; }
    setToast('সাসপেন্ড তুলে নেওয়া হয়েছে');
    setSelected(null);
    load();
  }

  async function changeRole(newRole) {
    if (!selected || selected.role === newRole) return;
    if (!confirm(`${displayName(selected)}-কে "${roleLabel[newRole]}" বানাতে চান?`)) return;
    setBusy(true);
    const { error: err } = await supabase.from('users').update({ role: newRole }).eq('id', selected.id);
    setBusy(false);
    if (err) { alert('রোল বদলানো যায়নি: ' + err.message); return; }
    setToast('রোল বদলানো হয়েছে');
    setSelected(null);
    load();
  }

  async function setItemStatus(kind, id, status) {
    const table = kind === 'listing' ? 'listings' : 'providers';
    const { error: err } = await supabase.from(table).update({ status }).eq('id', id);
    if (err) { alert('স্ট্যাটাস বদলানো যায়নি: ' + err.message); return; }
    setToast('স্ট্যাটাস বদলানো হয়েছে');
    loadItems(selected.id);
  }

  const bannedCount = Object.keys(bans).length;
  const isSelf = selected?.id === currentUserId;
  const selectedIsStaff = selected && (selected.role === 'admin' || selected.role === 'moderator');
  const canBan = selected && !isSelf && !selectedIsStaff;
  const chips = [
    { key: 'all', label: `সব (${users.length})` },
    { key: 'banned', label: `সাসপেন্ড (${bannedCount})` },
    { key: 'staff', label: 'অ্যাডমিন/মডারেটর' },
  ];

  const detailFields = selected
    ? Object.entries(selected).filter(
        ([k, v]) => !hiddenFields.includes(k) && v !== null && v !== '' && v !== undefined
      )
    : [];

  function ItemCard({ kind, item }) {
    const isListing = kind === 'listing';
    const title = isListing ? item.title : item.name;
    const image = isListing ? item.photos?.[0] : item.photo_url;
    const date = isListing ? item.posted_at : item.created_at;
    const isLive = item.status === 'active' || item.status === 'approved';
    const liveStatus = isListing ? 'active' : 'approved';
    return (
      <div className={`bg-white rounded-xl border-l-4 ${isListing ? 'border-l-marigold' : 'border-l-green'} border-t border-r border-b border-ink/10 p-3`}>
        <div className="flex gap-3">
          {image ? (
            <img src={image} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <span className="w-14 h-14 rounded-lg bg-[#EEF1F8] flex items-center justify-center text-xl flex-shrink-0">
              {isListing ? '📄' : '👤'}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium line-clamp-1">{title}</p>
            <p className="text-xs text-ink/50 line-clamp-1">
              {item.categories?.name ? `${item.categories.name} · ` : ''}{item.area || ''}
            </p>
            {isListing && item.price_or_salary && (
              <p className="text-xs text-green font-numeric mt-0.5">{item.price_or_salary}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusLabel[item.status]?.color || 'bg-paper text-ink/50'}`}>
                {statusLabel[item.status]?.text || item.status}
              </span>
              <span className="text-[10px] text-ink/40">{fmtDate(date)}</span>
            </div>
          </div>
        </div>
        {!isListing && (
          <button
            onClick={async () => {
              const { error: err } = await supabase
                .from('providers')
                .update({ is_verified: !item.is_verified })
                .eq('id', item.id);
              if (err) { alert('যাচাই বদলানো যায়নি: ' + err.message); return; }
              setToast(item.is_verified ? 'যাচাই সরানো হয়েছে' : 'যাচাইকৃত করা হয়েছে');
              loadItems(selected.id);
            }}
            className={`w-full mt-3 text-xs py-2 rounded-lg border ${
              item.is_verified ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-ink/20 text-ink/70'
            }`}
          >
            {item.is_verified ? '✓ যাচাইকৃত (সরাতে চাপুন)' : '✓ যাচাইকৃত করুন'}
          </button>
        )}
                <div className="flex gap-2 mt-3">
          <a
            href={isListing ? `/listing/${item.id}` : `/provider/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs border border-ink/20 py-2 rounded-lg"
          >
            দেখুন ↗
          </a>
          {isLive ? (
            <button
              onClick={() => { if (confirm('এটা বাতিল/লুকিয়ে ফেলতে চান?')) setItemStatus(kind, item.id, 'rejected'); }}
              className="flex-1 text-xs border border-red-300 text-red-600 py-2 rounded-lg"
            >
              রিজেক্ট
            </button>
          ) : (
            <button
              onClick={() => setItemStatus(kind, item.id, liveStatus)}
              className="flex-1 text-xs bg-green text-white py-2 rounded-lg"
            >
              অনুমোদন
            </button>
          )}
        </div>
      </div>
    );
  }

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
              <Avatar u={u} />
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
                      সাসপেন্ড
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

      {/* User detail sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !busy && setSelected(null)} />
          <div className="relative bg-paper w-full md:max-w-lg rounded-t-2xl md:rounded-2xl h-[92vh] md:h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white px-4 pt-3 pb-3 border-b border-ink/10 flex-shrink-0">
              <div className="w-10 h-1 bg-ink/15 rounded-full mx-auto mb-3 md:hidden" />
              <div className="flex items-center gap-3">
                <Avatar u={selected} size="w-12 h-12" text="text-lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{displayName(selected)}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${roleColor[selected.role] || roleColor.user}`}>
                      {roleLabel[selected.role] || 'ইউজার'}
                    </span>
                    {bans[selected.id] && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600">সাসপেন্ড</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-ink/40 text-xl px-2" aria-label="বন্ধ">✕</button>
              </div>

              <div className="grid grid-cols-3 gap-1 mt-3 bg-paper rounded-lg p-1">
                {[
                  { key: 'info', label: 'বিস্তারিত' },
                  { key: 'posts', label: `পোস্ট (${items.loading ? '…' : items.listings.length})` },
                  { key: 'profiles', label: `প্রোফাইল (${items.loading ? '…' : items.providers.length})` },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`text-xs py-2 rounded-md transition-colors ${
                      tab === t.key ? 'bg-white shadow-sm font-medium text-green-dark' : 'text-ink/60'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-3">
              {tab === 'info' && (
                <>
                  {bans[selected.id] && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                      <p className="font-medium text-red-700">এই ইউজার সাসপেন্ড করা আছে</p>
                      {bans[selected.id].reason && <p className="text-red-600/80 mt-1">কারণ: {bans[selected.id].reason}</p>}
                      {bans[selected.id].banned_at && (
                        <p className="text-red-600/60 text-xs mt-1">{fmtDate(bans[selected.id].banned_at)}</p>
                      )}
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5">
                    {detailFields.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 px-3 py-2.5 text-sm">
                        <span className="text-ink/50 flex-shrink-0">{fieldLabels[k] || k}</span>
                        <span className="text-right break-all">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                    {selected.created_at && (
                      <div className="flex justify-between gap-4 px-3 py-2.5 text-sm">
                        <span className="text-ink/50">যোগদান</span>
                        <span>{fmtDate(selected.created_at)}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-4 px-3 py-2.5 text-sm">
                      <span className="text-ink/50">পোস্ট / প্রোফাইল</span>
                      <span className="font-numeric">{postCounts[selected.id] || 0} / {profileCounts[selected.id] || 0}</span>
                    </div>
                  </div>

                  {/* Suspend / unsuspend */}
                  <div className="bg-white rounded-xl border border-ink/10 p-3">
                    <p className="text-xs text-ink/50 mb-2">অ্যাকাউন্ট সাসপেন্ড</p>
                    {bans[selected.id] ? (
                      <button
                        onClick={unbanUser}
                        disabled={busy}
                        className="w-full bg-green text-white text-sm font-medium py-3 rounded-xl disabled:opacity-50"
                      >
                        {busy ? 'অপেক্ষা করুন...' : 'সাসপেন্ড তুলে নিন'}
                      </button>
                    ) : canBan ? (
                      <div className="space-y-2">
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={2}
                          placeholder="কারণ (ঐচ্ছিক)"
                          className="w-full border border-ink/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                        />
                        <button
                          onClick={banUser}
                          disabled={busy}
                          className="w-full bg-red-600 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-50"
                        >
                          {busy ? 'অপেক্ষা করুন...' : 'ইউজারকে সাসপেন্ড করুন'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-ink/50">
                        {isSelf ? 'নিজেকে সাসপেন্ড করা যায় না।' : 'অ্যাডমিন/মডারেটরকে সাসপেন্ড করা যায় না। আগে রোল বদলান।'}
                      </p>
                    )}
                  </div>

                  {/* Role change */}
                  {currentRole === 'admin' && !isSelf && (
                    <div className="bg-white rounded-xl border border-ink/10 p-3">
                      <p className="text-xs text-ink/50 mb-2">রোল পরিবর্তন</p>
                      <div className="grid grid-cols-3 gap-2">
                        {['user', 'moderator', 'admin'].map((r) => (
                          <button
                            key={r}
                            onClick={() => changeRole(r)}
                            disabled={busy || selected.role === r}
                            className={`text-xs py-2 rounded-lg border ${
                              selected.role === r ? 'bg-green text-white border-green' : 'bg-white border-ink/20 text-ink/70'
                            } disabled:opacity-60`}
                          >
                            {roleLabel[r]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {tab !== 'info' && items.error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  লোড করা যায়নি: {items.error}
                </p>
              )}
              {tab !== 'info' && items.loading && <p className="text-center text-ink/50 text-sm py-10">লোড হচ্ছে...</p>}

              {tab === 'posts' && !items.loading && (
                <>
                  {items.listings.length === 0 && !items.error && (
                    <div className="text-center py-12">
                      <p className="text-3xl mb-2">📄</p>
                      <p className="text-sm text-ink/50">এই ইউজারের কোনো পোস্ট নেই।</p>
                    </div>
                  )}
                  {items.listings.map((l) => <ItemCard key={l.id} kind="listing" item={l} />)}
                </>
              )}

              {tab === 'profiles' && !items.loading && (
                <>
                  {items.providers.length === 0 && !items.error && (
                    <div className="text-center py-12">
                      <p className="text-3xl mb-2">👤</p>
                      <p className="text-sm text-ink/50">এই ইউজারের কোনো প্রোফাইল নেই।</p>
                    </div>
                  )}
                  {items.providers.map((p) => <ItemCard key={p.id} kind="provider" item={p} />)}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
