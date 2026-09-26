'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { categoryLabels } from '../../lib/categoryLabels';

const sidebarItems = [
  { key: 'dashboard', icon: '🏠', label: 'ড্যাশবোর্ড', enabled: true },
  { key: 'posts', icon: '📄', label: 'পোস্ট ব্যবস্থাপনা', enabled: true },
  { key: 'profiles', icon: '👤', label: 'প্রোফাইল ব্যবস্থাপনা', enabled: true },
  { key: 'reports', icon: '⚠️', label: 'রিপোর্ট/অভিযোগ', enabled: true },
  { key: 'banners', icon: '🖼️', label: 'ব্যানার ব্যবস্থাপনা', enabled: true },
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
  const [banners, setBanners] = useState([]);
  const [bannerForm, setBannerForm] = useState({
    file: null, advertiser_name: '', advertiser_phone: '',
    duration_mode: 'permanent', start_date: '', end_date: '',
  });
  const [bannerUploading, setBannerUploading] = useState(false);

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
      await Promise.all([loadPending(), loadReports(), loadStats(), loadBanners()]);
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
  async function loadBanners() {
    const { data } = await supabase
      .from('homepage_banners')
      .select('*')
      .order('sort_order', { ascending: true });
    setBanners(data || []);
  }

  async function uploadBanner(e) {
    e.preventDefault();
    if (!bannerForm.file) { alert('একটা ছবি বাছাই করুন'); return; }
    setBannerUploading(true);

    const fileExt = bannerForm.file.name.split('.').pop();
    const filePath = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, bannerForm.file);

    if (uploadError) {
      alert('আপলোড ব্যর্থ: ' + uploadError.message);
      setBannerUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);

    const { error: insertError } = await supabase.from('homepage_banners').insert({
      image_url: urlData.publicUrl,
      advertiser_name: bannerForm.advertiser_name || null,
      advertiser_phone: bannerForm.advertiser_phone || null,
      duration_mode: bannerForm.duration_mode,
      start_date: bannerForm.duration_mode === 'fixed' ? bannerForm.start_date : null,
      end_date: bannerForm.duration_mode === 'fixed' ? bannerForm.end_date : null,
      sort_order: banners.length,
    });

    if (insertError) {
      alert('সেভ ব্যর্থ: ' + insertError.message);
    } else {
      setBannerForm({ file: null, advertiser_name: '', advertiser_phone: '', duration_mode: 'permanent', start_date: '', end_date: '' });
      loadBanners();
    }
    setBannerUploading(false);
  }

  async function toggleBannerActive(id, current) {
    await supabase.from('homepage_banners').update({ is_active: !current }).eq('id', id);
    loadBanners();
  }

  async function deleteBanner(id) {
    if (!confirm('এই ব্যানারটা মুছে ফেলতে চান?')) return;
    await supabase.from('homepage_banners').delete().eq('id', id);
    loadBanners();
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

        {activeTab === 'banners' && (
          <div>
            <h2 className="text-lg font-medium mb-3">হোমপেজ ব্যানার/বিজ্ঞাপন</h2>

            <form onSubmit={uploadBanner} className="bg-white border border-ink/10 p-4 mb-6 space-y-3">
              <p className="font-medium text-sm">নতুন ব্যানার যোগ করুন</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerForm({ ...bannerForm, file: e.target.files[0] })}
                className="text-sm w-full"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="বিজ্ঞাপনদাতার নাম (ঐচ্ছিক)"
                  value={bannerForm.advertiser_name}
                  onChange={(e) => setBannerForm({ ...bannerForm, advertiser_name: e.target.value })}
                  className="border border-ink/15 px-3 py-2 text-sm rounded-md"
                />
                <input
                  type="text"
                  placeholder="ফোন নম্বর (ঐচ্ছিক)"
                  value={bannerForm.advertiser_phone}
                  onChange={(e) => setBannerForm({ ...bannerForm, advertiser_phone: e.target.value })}
                  className="border border-ink/15 px-3 py-2 text-sm rounded-md"
                />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={bannerForm.duration_mode === 'permanent'}
                    onChange={() => setBannerForm({ ...bannerForm, duration_mode: 'permanent' })}
                  />
                  স্থায়ী (নিজে বন্ধ না করা পর্যন্ত)
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={bannerForm.duration_mode === 'fixed'}
                    onChange={() => setBannerForm({ ...bannerForm, duration_mode: 'fixed' })}
                  />
                  নির্দিষ্ট মেয়াদ
                </label>
              </div>
              {bannerForm.duration_mode === 'fixed' && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={bannerForm.start_date}
                    onChange={(e) => setBannerForm({ ...bannerForm, start_date: e.target.value })}
                    className="border border-ink/15 px-3 py-2 text-sm rounded-md"
                  />
                  <input
                    type="date"
                    value={bannerForm.end_date}
                    onChange={(e) => setBannerForm({ ...bannerForm, end_date: e.target.value })}
                    className="border border-ink/15 px-3 py-2 text-sm rounded-md"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={bannerUploading}
                className="bg-green text-white text-sm px-4 py-2 rounded-md disabled:opacity-50"
              >
                {bannerUploading ? 'আপলোড হচ্ছে...' : 'আপলোড করুন'}
              </button>
            </form>

            <p className="font-medium text-sm mb-3">বর্তমান ব্যানার ({banners.length})</p>
            {banners.length === 0 && <p className="text-ink/50 text-sm">কোনো ব্যানার নেই।</p>}
            <div className="space-y-3">
              {banners.map((b) => (
                <div key={b.id} className="bg-white border border-ink/10 p-3 flex gap-3 items-center">
                  <img src={b.image_url} alt="" className="w-24 h-14 object-cover rounded-md flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{b.advertiser_name || 'নাম নেই'}</p>
                    <p className="text-xs text-ink/50">
                      {b.duration_mode === 'permanent' ? 'স্থায়ী' : `${b.start_date} - ${b.end_date}`} · 👁️ {b.view_count} ভিউ
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${b.is_active ? 'bg-green/10 text-green' : 'bg-ink/5 text-ink/40'}`}>
                      {b.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleBannerActive(b.id, b.is_active)}
                      className="text-xs border border-ink/20 px-2.5 py-1 rounded-md"
                    >
                      {b.is_active ? 'বন্ধ করুন' : 'চালু করুন'}
                    </button>
                    <button
                      onClick={() => deleteBanner(b.id)}
                      className="text-xs border border-red-300 text-red-600 px-2.5 py-1 rounded-md"
                    >
                      মুছুন
                    </button>
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
