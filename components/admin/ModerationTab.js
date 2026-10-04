'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const BN = '০১২৩৪৫৬৭৮৯';
const toEn = (s) => String(s ?? '').replace(/[০-৯]/g, (d) => BN.indexOf(d));
const normPhone = (s) => toEn(s).replace(/[\s-]/g, '');
const validPhone = (s) => /^(\+?88)?01[3-9]\d{8}$/.test(normPhone(s));

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysAgo(d) {
  if (!d) return '';
  const n = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return n <= 0 ? 'আজ' : `${n.toLocaleString('bn-BD')} দিন আগে`;
}

const statusInfo = {
  pending: { text: 'পর্যালোচনাধীন', color: 'text-marigold bg-marigold/10' },
  approved: { text: 'অনুমোদিত', color: 'text-green bg-green/10' },
  active: { text: 'অনুমোদিত', color: 'text-green bg-green/10' },
  rejected: { text: 'বাতিল', color: 'text-red-500 bg-red-50' },
  expired: { text: 'মেয়াদোত্তীর্ণ', color: 'text-ink/50 bg-ink/5' },
  filled: { text: 'পূরণ হয়েছে', color: 'text-ink/50 bg-ink/5' },
};
const roleLabel = { admin: 'অ্যাডমিন', moderator: 'মডারেটর', user: 'ইউজার' };
const quickReasons = ['ছবি স্পষ্ট নয়', 'বিবরণ অসম্পূর্ণ', 'ভুল মোবাইল নম্বর', 'নিয়মবিরুদ্ধ বিষয়'];

async function fetchIn(table, select, col, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 40) {
    const { data } = await supabase.from(table).select(select).in(col, ids.slice(i, i + 40));
    if (data) out.push(...data);
  }
  return out;
}
function tally(rows) {
  const m = {};
  (rows || []).forEach((r) => {
    if (r.user_id) m[r.user_id] = (m[r.user_id] || 0) + 1;
  });
  return m;
}

export default function ModerationTab({ kind }) {
  const isListing = kind === 'listing';
  const table = isListing ? 'listings' : 'providers';
  const liveStatus = isListing ? 'active' : 'approved';
  const dateKey = isListing ? 'posted_at' : 'created_at';
  const titleKey = isListing ? 'title' : 'name';
  const phoneKey = isListing ? 'contact_phone' : 'phone';

  const [items, setItems] = useState([]);
  const [people, setPeople] = useState({ users: {}, listings: {}, providers: {}, bans: {}, emails: {} });
  const [svc, setSvc] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [q, setQ] = useState('');
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
    const { data, error: err } = await supabase
      .from(table)
      .select('*, categories(name)')
      .order(dateKey, { ascending: false })
      .limit(300);
    if (err) {
      setError('লোড করা যায়নি: ' + err.message);
      setLoading(false);
      return;
    }
    const list = data || [];
    setItems(list);

    const uids = [...new Set(list.map((r) => r.user_id).filter(Boolean))];
    const pids = list.map((r) => r.id);
    const [us, ls, ps, bs, em, subs, links] = await Promise.all([
      fetchIn('users', 'id, name, phone, role, created_at', 'id', uids),
      fetchIn('listings', 'user_id', 'user_id', uids),
      fetchIn('providers', 'user_id', 'user_id', uids),
      fetchIn('banned_users', 'user_id, reason', 'user_id', uids),
      supabase.rpc('admin_user_info', { uids }),
      isListing ? Promise.resolve({ data: [] }) : supabase.from('subcategories').select('id, name_bn'),
      isListing ? Promise.resolve([]) : fetchIn('provider_subcategories', 'provider_id, subcategory_id', 'provider_id', pids),
    ]);

    setPeople({
      users: Object.fromEntries(us.map((u) => [u.id, u])),
      listings: tally(ls),
      providers: tally(ps),
      bans: Object.fromEntries(bs.map((b) => [b.user_id, b])),
      emails: Object.fromEntries((em.data || []).map((e) => [e.id, e])),
    });

    if (!isListing) {
      const names = Object.fromEntries((subs.data || []).map((s) => [s.id, s.name_bn]));
      const map = {};
      links.forEach((l) => {
        (map[l.provider_id] = map[l.provider_id] || []).push(l.subcategory_id);
      });
      const result = {};
      list.forEach((p) => {
        const ids = [...new Set([p.primary_subcategory_id, ...(map[p.id] || [])].filter(Boolean))];
        result[p.id] = ids.map((id) => names[id]).filter(Boolean);
      });
      setSvc(result);
    }
    setLoading(false);
  }

  const phoneCount = useMemo(() => {
    const m = {};
    items.forEach((r) => {
      const p = normPhone(r[phoneKey]);
      if (p) m[p] = (m[p] || 0) + 1;
    });
    return m;
  }, [items]);

  function posterOf(r) {
    return {
      user: people.users[r.user_id],
      info: people.emails[r.user_id],
      listings: people.listings[r.user_id] || 0,
      providers: people.providers[r.user_id] || 0,
      ban: people.bans[r.user_id],
    };
  }

  function checksOf(r) {
    const p = posterOf(r);
    const phone = r[phoneKey];
    const dup = phone ? (phoneCount[normPhone(phone)] || 1) - 1 : 0;
    const desc = (r.description || '').trim();
    const c = [];
    c.push({ ok: (r[titleKey] || '').trim().length >= (isListing ? 5 : 2), text: isListing ? 'শিরোনাম অন্তত ৫ অক্ষর' : 'নাম দেওয়া আছে' });
    c.push({ ok: !!phone && validPhone(phone), text: 'মোবাইল নম্বর সঠিক (০১ দিয়ে ১১ ডিজিট)' });
    c.push({ ok: desc.length >= 20, text: 'বিবরণ অন্তত ২০ অক্ষর' });
    c.push({
      ok: isListing ? (r.photos || []).length > 0 : !!r.photo_url,
      text: isListing ? 'অন্তত একটি ছবি আছে' : 'প্রোফাইল ছবি আছে',
    });
    c.push({ ok: !!r.upazila, text: 'উপজেলা দেওয়া আছে' });
    if (!isListing) c.push({ ok: (svc[r.id] || []).length > 0, text: 'সেবা বাছাই করা আছে' });
    c.push({ ok: dup === 0, text: dup === 0 ? 'এই নম্বরে অন্য কোনো এন্ট্রি নেই' : `এই নম্বরে আরও ${dup}টি এন্ট্রি আছে` });
    c.push({ ok: !p.ban, text: 'পোস্টকারী সাসপেন্ড নয়' });
    return c;
  }

  const counts = useMemo(
    () => ({
      pending: items.filter((r) => r.status === 'pending').length,
      live: items.filter((r) => r.status === liveStatus).length,
      rejected: items.filter((r) => r.status === 'rejected').length,
      all: items.length,
    }),
    [items]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((r) => {
      if (filter === 'pending' && r.status !== 'pending') return false;
      if (filter === 'live' && r.status !== liveStatus) return false;
      if (filter === 'rejected' && r.status !== 'rejected') return false;
      if (!s) return true;
      const u = people.users[r.user_id];
      return [r[titleKey], r[phoneKey], r.area, u?.name, u?.phone].some((v) =>
        toEn(v).toLowerCase().includes(toEn(s))
      );
    });
  }, [items, filter, q, people]);

  async function update(patch, okMsg) {
    if (!selected) return false;
    setBusy(true);
    const { data, error: err } = await supabase.from(table).update(patch).eq('id', selected.id).select('id');
    setBusy(false);
    if (err || !data || data.length === 0) {
      alert('বদলানো যায়নি' + (err ? ': ' + err.message : ''));
      return false;
    }
    setToast(okMsg);
    return true;
  }
  async function approve() {
    if (await update({ status: liveStatus, reject_reason: null }, 'অনুমোদন হয়েছে')) {
      setSelected(null);
      load();
    }
  }
  async function reject() {
    if (!confirm('রিজেক্ট করতে চান?')) return;
    if (await update({ status: 'rejected', reject_reason: reason.trim() || null }, 'রিজেক্ট হয়েছে')) {
      setSelected(null);
      load();
    }
  }
  async function toggle(field, onMsg, offMsg) {
    const next = !selected[field];
    if (await update({ [field]: next }, next ? onMsg : offMsg)) {
      setSelected({ ...selected, [field]: next });
      load();
    }
  }

  function openItem(r) {
    setSelected(r);
    setReason('');
  }

  const chips = [
    { key: 'pending', label: `পেন্ডিং (${counts.pending})` },
    { key: 'live', label: `অনুমোদিত (${counts.live})` },
    { key: 'rejected', label: `বাতিল (${counts.rejected})` },
    { key: 'all', label: `সব (${counts.all})` },
  ];

  const Row = ({ label, value, pre }) => (
    <div className="flex justify-between gap-4 px-3 py-2.5 text-sm">
      <span className="text-ink/50 flex-shrink-0">{label}</span>
      {value !== null && value !== undefined && String(value).trim() !== '' ? (
        <span className={`text-right break-words min-w-0 ${pre ? 'whitespace-pre-line' : ''}`}>{value}</span>
      ) : (
        <span className="text-xs text-red-500">নেই</span>
      )}
    </div>
  );

  const s = selected;
  const sp = s ? posterOf(s) : null;
  const sChecks = s ? checksOf(s) : [];
  const images = s ? (isListing ? s.photos || [] : s.photo_url ? [s.photo_url] : []) : [];

  return (
    <div>
      <h2 className="text-lg font-medium mb-3">{isListing ? 'পোস্ট ব্যবস্থাপনা' : 'প্রোফাইল ব্যবস্থাপনা'}</h2>

      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">🔍</span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="শিরোনাম, ফোন, এলাকা বা পোস্টকারীর নাম..."
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
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm text-ink/50">এই তালিকায় কিছু নেই।</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((r) => {
          const p = posterOf(r);
          const warn = checksOf(r).filter((c) => !c.ok).length;
          const img = isListing ? (r.photos || [])[0] : r.photo_url;
          return (
            <button
              key={r.id}
              onClick={() => openItem(r)}
              className={`w-full text-left bg-white rounded-xl border-l-4 ${
                isListing ? 'border-l-marigold' : 'border-l-green'
              } border-t border-r border-b border-ink/10 p-3 flex gap-3 active:bg-paper`}
            >
              {img ? (
                <img src={img} alt="" className={`w-14 h-14 object-cover flex-shrink-0 ${isListing ? 'rounded-lg' : 'rounded-full'}`} />
              ) : (
                <span className={`w-14 h-14 bg-[#EEF1F8] flex items-center justify-center text-xl flex-shrink-0 ${isListing ? 'rounded-lg' : 'rounded-full'}`}>
                  {isListing ? '📄' : '👤'}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium line-clamp-1">{r[titleKey]}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${statusInfo[r.status]?.color || 'bg-paper text-ink/50'}`}>
                    {statusInfo[r.status]?.text || r.status}
                  </span>
                </div>
                <p className="text-xs text-ink/50 line-clamp-1">
                  {r.categories?.name ? `${r.categories.name} · ` : ''}{r.area}
                </p>
                <p className="text-[11px] text-ink/60 mt-0.5 line-clamp-1">
                  👤 {p.user?.name || 'অজানা'} · 📞 {r[phoneKey] || '—'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-ink/40">{fmtDate(r[dateKey])}</span>
                  {warn > 0 && (
                    <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">⚠️ {warn}টি সমস্যা</span>
                  )}
                  {p.ban && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">সাসপেন্ড</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {s && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !busy && setSelected(null)} />
          <div className="relative bg-paper w-full md:max-w-lg rounded-t-2xl md:rounded-2xl h-[94vh] md:h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-white px-4 pt-3 pb-3 border-b border-ink/10 flex-shrink-0">
              <div className="w-10 h-1 bg-ink/15 rounded-full mx-auto mb-3 md:hidden" />
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold line-clamp-2">{s[titleKey]}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusInfo[s.status]?.color || 'bg-paper text-ink/50'}`}>
                      {statusInfo[s.status]?.text || s.status}
                    </span>
                    {s.is_featured && <span className="text-[11px] px-2 py-0.5 rounded-full bg-marigold/15 text-marigold">⭐ ফিচার্ড</span>}
                    {!isListing && s.is_verified && <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">✓ যাচাইকৃত</span>}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-ink/40 text-xl px-2" aria-label="বন্ধ">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {images.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {images.map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <img src={u} alt="" className="h-40 w-auto max-w-[80vw] rounded-xl object-cover border border-ink/10" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">কোনো ছবি নেই</p>
              )}

              <div>
                <p className="text-xs text-ink/50 mb-1.5">স্বয়ংক্রিয় যাচাই</p>
                <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5">
                  {sChecks.map((c, i) => (
                    <p key={i} className={`px-3 py-2 text-sm ${c.ok ? 'text-ink/70' : 'text-red-600 font-medium'}`}>
                      {c.ok ? '✅' : '⚠️'} {c.text}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-ink/50 mb-1.5">{isListing ? 'পোস্টের তথ্য' : 'প্রোফাইলের তথ্য'}</p>
                <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5">
                  <Row label="ক্যাটাগরি" value={s.categories?.name} />
                  {isListing ? (
                    <>
                      <Row label="শিরোনাম" value={s.title} />
                      <Row label="ভাড়ার ধরন" value={s.rent_type} />
                      <Row label="দাম/বেতন" value={s.price_or_salary} />
                      <Row label="মালিকের নাম" value={s.owner_name} />
                    </>
                  ) : (
                    <>
                      <Row label="নাম" value={s.name} />
                      <Row label="ইংরেজি নাম" value={s.name_en} />
                      <Row label="সেবা" value={(svc[s.id] || []).join(', ')} />
                      <Row label="অভিজ্ঞতা (বছর)" value={s.experience_years} />
                      {s.vehicle_type && <Row label="গাড়ির ধরন" value={s.vehicle_type} />}
                    </>
                  )}
                  <Row label="উপজেলা" value={s.upazila} />
                  <Row label="ইউনিয়ন" value={s.union_name} />
                  <Row label="এলাকা/ঠিকানা" value={s.area} />
                  <Row label="মোবাইল" value={s[phoneKey]} />
                  <Row label="হোয়াটসঅ্যাপ" value={s.whatsapp} />
                  {isListing && <Row label="ইমেইল" value={s.contact_email} />}
                  <Row label="বিবরণ" value={s.description} pre />
                  <Row label={isListing ? 'পোস্টের সময়' : 'যোগের সময়'} value={fmtDate(s[dateKey])} />
                  {isListing && <Row label="মেয়াদ শেষ" value={fmtDate(s.expiry_date)} />}
                  <Row label="ভিউ" value={s.view_count} />
                  {s.status === 'rejected' && s.reject_reason && <Row label="বাতিলের কারণ" value={s.reject_reason} />}
                </div>
              </div>

              <div>
                <p className="text-xs text-ink/50 mb-1.5">পোস্টকারী</p>
                <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5">
                  <Row label="নাম" value={sp.user?.name} />
                  <Row label="মোবাইল (অ্যাকাউন্ট)" value={sp.user?.phone} />
                  <Row label="ইমেইল" value={sp.info?.email} />
                  <Row label="রোল" value={roleLabel[sp.user?.role]} />
                  <Row label="যোগদান" value={sp.user?.created_at ? `${fmtDate(sp.user.created_at)} (${daysAgo(sp.user.created_at)})` : ''} />
                  <Row label="শেষ লগইন" value={sp.info?.last_sign_in_at ? daysAgo(sp.info.last_sign_in_at) : ''} />
                  <Row label="মোট পোস্ট / প্রোফাইল" value={`${sp.listings} / ${sp.providers}`} />
                  {sp.ban && <Row label="সাসপেন্ড" value={sp.ban.reason || 'হ্যাঁ'} />}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  disabled={busy}
                  onClick={() => toggle('is_featured', 'ফিচার্ড করা হয়েছে', 'ফিচার্ড সরানো হয়েছে')}
                  className="text-xs border border-ink/20 px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  {s.is_featured ? '⭐ ফিচার্ড সরান' : '⭐ ফিচার্ড করুন'}
                </button>
                {!isListing && (
                  <button
                    disabled={busy}
                    onClick={() => toggle('is_verified', 'যাচাইকৃত করা হয়েছে', 'যাচাই সরানো হয়েছে')}
                    className="text-xs border border-ink/20 px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    {s.is_verified ? '✓ যাচাই সরান' : '✓ যাচাইকৃত করুন'}
                  </button>
                )}
                <a
                  href={isListing ? `/listing/${s.id}` : `/provider/${s.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs border border-ink/20 px-3 py-2 rounded-lg"
                >
                  পেজ দেখুন ↗
                </a>
                {s[phoneKey] && (
                  <a href={`tel:${normPhone(s[phoneKey])}`} className="text-xs border border-ink/20 px-3 py-2 rounded-lg">
                    📞 কল
                  </a>
                )}
              </div>
            </div>

            <div className="bg-white border-t border-ink/10 p-3 flex-shrink-0 space-y-2">
              {s.status !== 'rejected' && (
                <>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {quickReasons.map((x) => (
                      <button
                        key={x}
                        onClick={() => setReason(x)}
                        className="text-[11px] border border-ink/15 text-ink/60 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="রিজেক্টের কারণ (ইউজারের ফোনে যাবে)"
                    className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                  />
                </>
              )}
              <div className="flex gap-2">
                {s.status !== 'rejected' && (
                  <button
                    onClick={reject}
                    disabled={busy}
                    className="flex-1 border border-red-300 text-red-600 text-sm font-medium py-2.5 rounded-xl disabled:opacity-50"
                  >
                    {s.status === liveStatus ? 'বন্ধ করুন' : 'রিজেক্ট'}
                  </button>
                )}
                {s.status !== liveStatus && (
                  <button
                    onClick={approve}
                    disabled={busy}
                    className="flex-1 bg-green text-white text-sm font-medium py-2.5 rounded-xl disabled:opacity-50"
                  >
                    {busy ? 'অপেক্ষা করুন...' : 'অনুমোদন করুন'}
                  </button>
                )}
              </div>
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
