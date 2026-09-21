'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function Stars({ value, size = 'text-base' }) {
  return (
    <span className={`text-marigold ${size}`}>
      {'★'.repeat(Math.round(value))}
      <span className="text-ink/20">{'★'.repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export default function ReviewSection({ providerId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function load() {
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id, users(name)')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    setReviews(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (user && reviews.length > 0) {
      setAlreadyReviewed(reviews.some((r) => r.user_id === user.id));
    }
  }, [user, reviews]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (myRating === 0) {
      setError('একটা রেটিং দিন (স্টারে ক্লিক করুন)।');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error } = await supabase.from('reviews').insert({
      provider_id: providerId,
      user_id: user.id,
      rating: myRating,
      comment: myComment,
    });

    if (error) {
      setError(
        error.code === '23505'
          ? 'আপনি ইতিমধ্যে এই প্রোফাইলে রিভিউ দিয়েছেন।'
          : error.message
      );
    } else {
      setMyRating(0);
      setMyComment('');
      await load();
    }
    setSubmitting(false);
  }

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="mt-6 pt-6 border-t border-ink/10">
      <h2 className="font-medium mb-3 text-sm text-ink/50 uppercase tracking-wide">রিভিউ ও রেটিং</h2>

      {reviews.length > 0 ? (
        <div className="flex items-center gap-2 mb-4">
          <Stars value={avg} size="text-lg" />
          <span className="text-sm text-ink/60">
            {avg.toFixed(1)} ({reviews.length}টি রিভিউ)
          </span>
        </div>
      ) : (
        !loading && <p className="text-sm text-ink/50 mb-4">এখনো কোনো রিভিউ নেই। প্রথম রিভিউ আপনিই দিন!</p>
      )}

      {/* রিভিউ ফর্ম */}
      {user && !alreadyReviewed && (
        <form onSubmit={handleSubmit} className="bg-paper p-4 mb-4">
          <p className="text-sm mb-2">আপনার রেটিং</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMyRating(n)}
                className={`text-2xl ${n <= myRating ? 'text-marigold' : 'text-ink/20'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="অভিজ্ঞতা লিখুন (ঐচ্ছিক)"
            rows={3}
            className="w-full border border-ink/20 px-3 py-2 text-sm outline-none focus:border-green resize-none bg-white"
          />
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 bg-marigold text-ink text-sm font-semibold px-4 py-2 hover:bg-marigold/90 disabled:opacity-50"
          >
            {submitting ? 'জমা হচ্ছে...' : 'রিভিউ জমা দিন'}
          </button>
        </form>
      )}

      {!user && (
        <p className="text-sm text-ink/50 mb-4">
          রিভিউ দিতে <a href="/login" className="text-green underline">লগইন করুন</a>।
        </p>
      )}

      {user && alreadyReviewed && (
        <p className="text-sm text-green mb-4">আপনি ইতিমধ্যে এই প্রোফাইলে রিভিউ দিয়েছেন। ধন্যবাদ!</p>
      )}

      {/* রিভিউ লিস্ট */}
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="border-t border-ink/5 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{r.users?.name || 'ইউজার'}</p>
              <Stars value={r.rating} />
            </div>
            {r.comment && <p className="text-sm text-ink/70 mt-1">{r.comment}</p>}
            <p className="text-xs text-ink/40 mt-1">
              {new Date(r.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
