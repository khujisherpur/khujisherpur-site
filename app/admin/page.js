'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);

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
      await loadPending();
      await loadReports();
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

  async function approveProvider(id) {
    await supabase.from('providers').update({ status: 'approved' }).eq('id', id);
    loadPending();
  }

  async function rejectProvider(id) {
    await supabase.from('providers').update({ status: 'rejected' }).eq('id', id);
    loadPending();
  }

  async function approveListing(id) {
    await supabase.from('listings').update({ status: 'active' }).eq('id', id);
    loadPending();
  }

  async function rejectListing(id) {
    await supabase.from('listings').update({ status: 'rejected' }).eq('id', id);
    loadPending();
  }

  async function resolveReport(id, status) {
    await supabase.from('reports').update({ status }).eq('id', id);
    loadReports();
  }

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
    <main className="max-w-3xl mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
        <span className="text-sm bg-green text-white px-3 py-1 rounded-full">{role}</span>
      </header>

      {/* রিপোর্ট সেকশন */}
      <section className="mb-10">
        <h1 className="text-2xl font-semibold mb-6">রিপোর্ট ({reports.length})</h1>
        {reports.length === 0 && <p className="text-ink/50 text-sm">কোনো নতুন রিপোর্ট নেই।</p>}
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-white border border-red-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                  {r.target_type === 'provider' ? 'প্রোভাইডার' : 'লিস্টিং'}
                </span>
                <a
                  href={`/${r.target_type}/${r.target_id}`}
                  target="_blank"
                  className="text-xs text-green underline"
                >
                  পেজ দেখুন →
                </a>
              </div>
              <p className="text-sm mt-2">{r.reason}</p>
              <p className="text-xs text-ink/40 mt-1">
                রিপোর্টকারী: {r.users?.name || 'অজানা'} ·{' '}
                {new Date(r.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => resolveReport(r.id, 'reviewed')}
                  className="bg-green text-white text-sm px-4 py-1.5"
                >
                  পর্যালোচনা সম্পন্ন
                </button>
                <button
                  onClick={() => resolveReport(r.id, 'dismissed')}
                  className="border border-ink/20 text-sm px-4 py-1.5"
                >
                  বাতিল করুন
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* অপেক্ষমান অনুমোদন */}
      <h1 className="text-2xl font-semibold mb-6">অপেক্ষমান অনুমোদন</h1>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-3">প্রোভাইডার প্রোফাইল ({providers.length})</h2>
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
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">লিস্টিং পোস্ট ({listings.length})</h2>
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
      </section>
    </main>
  );
}
