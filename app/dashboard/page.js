'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) {
    return <p className="text-center py-20 text-ink/60">লোড হচ্ছে...</p>;
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink/70 mb-4">এই পেজ দেখতে হলে লগইন করা দরকার।</p>
        <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5">
          লগইন করুন
        </a>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <header className="flex items-center justify-between mb-10">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
        <button onClick={handleLogout} className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white">
          লগআউট
        </button>
      </header>

      <h1 className="text-2xl font-semibold mb-2">স্বাগতম!</h1>
      <p className="text-ink/70">{user.email}</p>

      <div className="mt-8 bg-white border-2 border-ink/10 p-6">
        <p className="text-ink/60 text-sm">
          এখান থেকে শীঘ্রই আপনি প্রোফাইল তৈরি, পোস্ট দেওয়া ও ম্যানেজ করতে পারবেন। এই ড্যাশবোর্ড এখনো তৈরি হচ্ছে।
        </p>
      </div>
    </main>
  );
}
