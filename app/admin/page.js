'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { categoryLabels } from '../../lib/categoryLabels';

const sidebarItems = [
  { key: 'dashboard', icon: '🏠', label: 'ড্যাশবোর্ড', enabled: true },
  { key: 'posts', icon: '📄', label: 'পোস্ট ব্যবস্থাপনা', enabled: true },
  { key: 'profiles', icon: '👤', label: 'প্রোফাইল ব্যবস্থাপনা', enabled: true },
  { key: 'reports', icon: '⚠️', label: 'রিপোর্ট/অভিযোগ', enabled: true },
  { key: 'users', icon: '👥', label: 'ব্যবহারকারী ব্যবস্থাপনা', enabled: false },
  { key: 'categories', icon: '📁', label: 'ক্যাটাগরি ব্যবস্থাপনা', enabled: false },
  { key: 'settings', icon: '⚙️', label: 'সাইট সেটিংস', enabled: false },
];

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [providers, setProviders] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ totalListings: 0, totalProviders: 0, totalUsers: 0, openReports: 0 });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setLoading(false);
      return;
    }
    setUser(authData.user);

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    setRole(profile?.role || 'user');

    if (profile?.role === 'admin' || profile?.role === 'moderator') {
      await Promise.all([loadPending(), loadReports(), loadStats()]);
    }
    setLoading(false);
  }

  async function loadPending() {
    const { data: p } = await supabase
      .from('providers')
      .select('id, name, area, phone, description, status, categories(name)')
      .eq('status', 'pending');
    setProviders(p || []);

    const { data: l } = await supabase
      .from('listings')
      .select('id, title, area, price_or_salary, description, status, categories(name)')
      .eq('status', 'pending');
    setListings(l || []);
  }

  async function loadReports() {
    const { data } = await supabase
      .from('reports')
      .select('id, target_type, target_id, reason, status, created_at, users(name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    setReports(data || []);
  }

  async function loadStats() {
    const [{ count: listingCount }, { count: providerCount }, { count: userCount }, { count: reportCount }] =
      await Promise.all([
        supabase.from('listings').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ]);
    setStats({
      totalListings: listingCount || 0,
      totalProviders: providerCount || 0,
      totalUsers: userCount || 0,
      openReports: reportCount || 0,
    });

    const { data: cats } = await supabase.from('categories').select('id, slug, type');
    const breakdown = await Promise.all(
      (cats || []).filter((c) => categoryLabels[c.slug]).map(async (c) => {
        const table = c.type === 'service' ? 'providers' : c.type === 'listing' ? 'listings' : null;
        if (!table) return { slug: c.slug, count: 0 };
        const { count } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq('category_id', c.id);
        return { slug: c.slug, count: count || 0 };
      })
    );
    breakdown.sort((a, b) => b.count - a.count);
    setCategoryBreakdown(breakdown.filter((b) => b.count > 0));

    const [{ data: recentL }, { data: recentP }] = await Promise.all([
      supabase.from('listings').select('id, title, area, status, posted_at, categories(name)').order('posted_at', { ascending: false }).limit(5),
      supabase.from('providers').select('id, name, area, status, created_at, categories(name)').order('created_at', { ascending: false }).limit(5),
    ]);
    const activity = [
      ...(recentL || []).map((l) => ({ id: l.id, title: l.title, area: l.area, status: l.status, date: l.posted_at, category: l.categories?.name, type: 'listing' })),
      ...(recentP || []).map((p) => ({ id: p.id, title: p.name, area: p.area, status: p.status, date: p.created_at, category: p.categories?.name, type: 'provider' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
    setRecentActivity(activity);
  }

  async function approveProvider(id) {
    await supabase.from('providers').update({ status: 'approved' }).eq('id', id);
    loadPending(); loadStats();
  }
  async function rejectProvider(id) {
    await supabase.from('providers').update({ status: 'rejected' }).eq('id', id);
    loadPending(); loadStats();
  }
  async function approveListing(id) {
    await supabase.from('listings').update({ status: 'active' }).eq('id', id);
    loadPending(); loadStats();
  }
  async function rejectListing(id) {
    await supabase.from('listings').update({ status: 'rejected' }).eq('id', id);
    loadPending(); loadStats();
  }
  async function resolveReport(id, status) {
    await supabase.from('reports').update({ status }).eq('id', id);
    loadReports(); loadStats();
  }

  const statusLabel = {
    pending: { text: 'পর্যালোচনাধীন', color: 'text-marigold bg-marigold/10' },
    approved: { text: 'অনুমোদিত', color: 'text-green bg-green/10' },
    active: { text: 'অনুমোদিত', color: 'text-green bg-green/10' },
    rejected: { text: 'বাতিল', color: 'text-red-500 bg-red-50' },
  };

  if (loading) return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">এই পেজ দেখতে লগইন করুন।</p>
        <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">লগইন করুন</a>
      </main>
    );
  }

  if (role !== 'admin' && role !== 'moderator') {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">এই পেজ দেখার অনুমতি আপনার নেই।</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen md:flex bg-paper">
      {/* Sidebar (desktop) / Horizontal tabs (mobile) */}
      <aside className="md:w-56 md:flex-shrink-0 bg-green-dark text-white md:min-h-screen">
        <div className="p-4 flex items-center gap-2 border-b border-white/10">
          <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-7 bg-white rounded px-1 py-0.5" />
        </div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 gap-1">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              disabled={!item.enabled}
              onClick={() => item.enabled && setActiveTab(item.key)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm whitespace-nowrap flex-shrink-0 text-left transition-colors ${
                activeTab === item.key ? 'bg-white/15 font-medium' : 'hover:bg-white/5'
              } ${!item.enabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span>{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
              {!item.enabled && <span className="hidden md:inline text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full ml-auto">শীঘ্রই</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">অ্যাডমিন ড্যাশবোর্ড</h1>
            <p className="text-sm text-ink/50">সাইটের সার্বিক পরিস্থিতি এক নজরে দেখুন</p>
          </div>
          <span className="text-sm bg-green text-white px-3 py-1 rounded-full flex-shrink-0">{role}</span>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="bg-white border border-ink/10 p-4">
                <p className="text-xs text-ink/50">মোট পোস্ট</p>
                <p className="text-2xl font-semibold font-numeric mt-1">{stats.totalListings}</p>
              </div>
              <div className="bg-white border border-ink/10 p-4">
                <p className="text-xs text-ink/50">মোট প্রোফাইল</p>
                <p className="text-2xl font-semibold font-numeric mt-1">{stats.totalProviders}</p>
              </div>
              <div className="bg-white border border-ink/10 p-4">
                <p className="text-xs text-ink/50">মোট ব্যবহারকারী</p>
                <p className="text-2xl font-semibold font-numeric mt-1">{stats.totalUsers}</p>
              </div>
              <div className="bg-white border border-ink/10 p-4">
                <p className="text-xs text-ink/50">রিপোর্ট/অভিযোগ</p>
                <p className="text-2xl font-semibold font-numeric mt-1 text-red-500">{stats.openReports}</p>
              </div>
            </div>

            {/* Category breakdown */}
            {categoryBreakdown.length > 0 && (
              <div className="bg-white border border-ink/10 p-5 mb-8">
                <h2 className="font-medium mb-4">ক্যাটাগরি অনুযায়ী পোস্ট/প্রোফাইল</h2>
                <div className="space-y-2.5">
                  {categoryBreakdown.map((c) => {
                    const label = categoryLabels[c.slug];
                    const max = categoryBreakdown[0].count || 1;
                    return (
                      <div key={c.slug} className="flex items-center gap-3">
                        <span className="text-sm w-32 flex-shrink-0 truncate">{label?.icon} {label?.bn.name}</span>
                        <div className="flex-1 bg-paper h-5 rounded-full overflow-hidden">
                          <div className="bg-green h-full rounded-full" style={{ width: `${(c.count / max) * 100}%` }} />
                        </div>
                        <span className="text-sm font-numeric w-10 text-right flex-shrink-0">{c.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent activity */}
            {recentActivity.length > 0 && (
              <div className="bg-white border border-ink/10 p-5">
                <h2 className="font-medium mb-4">সাম্প্রতিক পোস্ট (বিভিন্ন ক্যাটাগরি)</h2>
                <div className="space-y-3">
                  {recentActivity.map((a) => (
                    <div key={`${a.type}-${a.id}`} className="flex items-center justify-between text-sm border-b border-ink/5 pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.title}</p>
                        <p className="text-xs text-ink/50">{a.category} · {a.area}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${statusLabel[a.status]?.color || 'bg-paper text-ink/50'}`}>
                        {statusLabel[a.status]?.text || a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'posts' && (
          <div>
            <h2 className="text-lg font-medium mb-3">পোস্ট ব্যবস্থাপনা — অপেক্ষমান ({listings.length})</h2>
            {listings.length === 0 && <p className="text-ink/50 text-sm">কোনো অপেক্ষমান পোস্ট নেই।</p>}
            <div className="space-y-3">
              {listings.map((l) => (
                <div key={l.id} className="bg-white border border-ink/10 p-4">
                  <p className="font-medium">{l.title} <span className="text-ink/50 text-sm">({l.categories?.name})</span></p>
                  <p className="text-sm text-ink/60">{l.area} · {l.price_or_salary}</p>
                  <p className="text-sm text-ink/70 mt-1">{l.description}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => approveListing(l.id)} className="bg-green text-white text-sm px-4 py-1.5">অ্যাপ্রুভ</button>
                    <button onClick={() => rejectListing(l.id)} className="border border-red-400 text-red-600 text-sm px-4 py-1.5">রিজেক্ট</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profiles' && (
          <div>
            <h2 className="text-lg font-medium mb-3">প্রোফাইল ব্যবস্থাপনা — অপেক্ষমান ({providers.length})</h2>
            {providers.length === 0 && <p className="text-ink/50 text-sm">কোনো অপেক্ষমান প্রোফাইল নেই।</p>}
            <div className="space-y-3">
              {providers.map((p) => (
                <div key={p.id} className="bg-white border border-ink/10 p-4">
                  <p className="font-medium">{p.name} <span className="text-ink/50 text-sm">({p.categories?.name})</span></p>
                  <p className="text-sm text-ink/60">{p.area} · {p.phone}</p>
                  <p className="text-sm text-ink/70 mt-1">{p.description}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => approveProvider(p.id)} className="bg-green text-white text-sm px-4 py-1.5">অ্যাপ্রুভ</button>
                    <button onClick={() => rejectProvider(p.id)} className="border border-red-400 text-red-600 text-sm px-4 py-1.5">রিজেক্ট</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <h2 className="text-lg font-medium mb-3">রিপোর্ট/অভিযোগ ({reports.length})</h2>
            {reports.length === 0 && <p className="text-ink/50 text-sm">কোনো নতুন রিপোর্ট নেই।</p>}
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="bg-white border border-red-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                      {r.target_type === 'provider' ? 'প্রোভাইডার' : 'লিস্টিং'}
                    </span>
                    <a href={`/${r.target_type}/${r.target_id}`} target="_blank" className="text-xs text-green underline">পেজ দেখুন →</a>
                  </div>
                  <p className="text-sm mt-2">{r.reason}</p>
                  <p className="text-xs text-ink/40 mt-1">
                    রিপোর্টকারী: {r.users?.name || 'অজানা'} · {new Date(r.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => resolveReport(r.id, 'reviewed')} className="bg-green text-white text-sm px-4 py-1.5">পর্যালোচনা সম্পন্ন</button>
                    <button onClick={() => resolveReport(r.id, 'dismissed')} className="border border-ink/20 text-sm px-4 py-1.5">বাতিল করুন</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
