'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toBn } from '../lib/format';

function getCookieLang() {
  if (typeof document === 'undefined') return 'bn';
  const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
  return match && match[1] === 'en' ? 'en' : 'bn';
}

const text = {
  bn: {
    title: 'রিভিউ ও রেটিং',
    reviewsWord: 'টি রিভিউ',
    noReviews: 'এখনো কোনো রিভিউ নেই। প্রথম রিভিউ আপনিই দিন!',
    loginPrompt: 'রিভিউ দিতে লগইন করুন',
    loginButton: 'লগইন করে রিভিউ দিন',
    yourRating: 'আপনার রেটিং',
    labels: ['', 'খুব খারাপ', 'খারাপ', 'মোটামুটি', 'ভালো', 'চমৎকার'],
    placeholder: 'অভিজ্ঞতা লিখুন (ঐচ্ছিক)',
    submit: 'রিভিউ জমা দিন',
    submitting: 'জমা হচ্ছে...',
    needRating: 'একটা রেটিং দিন (তারকায় চাপ দিন)।',
    duplicate: 'আপনি ইতিমধ্যে এই প্রোফাইলে রিভিউ দিয়েছেন।',
    thanks: 'ধন্যবাদ! আপনার রিভিউ জমা হয়েছে।',
    yourReview: 'আপনার রিভিউ',
    delete: 'মুছুন',
    confirmDelete: 'আপনার রিভিউটা মুছে ফেলতে চান?',
    deleteFailed: 'মুছে ফেলা যায়নি।',
    anonymous: 'ইউজার',
    ownerReply: 'প্রোভাইডারের জবাব',
    replyPlaceholder: 'জবাব লিখুন...',
    send: 'পাঠান',
    reply: 'জবাব দিন',
  },
  en: {
    title: 'Reviews & Ratings',
    reviewsWord: ' reviews',
    noReviews: 'No reviews yet. Be the first to review!',
    loginPrompt: 'Log in to leave a review',
    loginButton: 'Log in to review',
    yourRating: 'Your rating',
    labels: ['', 'Very bad', 'Bad', 'Okay', 'Good', 'Excellent'],
    placeholder: 'Share your experience (optional)',
    submit: 'Submit review',
    submitting: 'Submitting...',
    needRating: 'Please give a rating (tap a star).',
    duplicate: 'You have already reviewed this profile.',
    thanks: 'Thank you! Your review has been submitted.',
    yourReview: 'Your review',
    delete: 'Delete',
    confirmDelete: 'Delete your review?',
    deleteFailed: 'Could not delete.',
    anonymous: 'User',
    ownerReply: "Provider's reply",
    replyPlaceholder: 'Write a reply...',
    send: 'Send',
    reply: 'Reply',
  },
};

function Stars({ value, size = 'text-base' }) {
  const v = Math.round(value);
  return (
    <span className={`text-marigold ${size} leading-none whitespace-nowrap`} aria-label={`${v}/5`}>
      {'★'.repeat(v)}
      <span className="text-ink/20">{'★'.repeat(5 - v)}</span>
    </span>
  );
}

export default function ReviewSection({ providerId, ownerId }) {
  const [lang, setLang] = useState('bn');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    setLang(getCookieLang());
    load();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const t = text[lang];
  const num = (n) => (lang === 'bn' ? toBn(n) : n);

  async function load() {
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id, reply, replied_at, users(name)')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    setReviews(data || []);
    setLoading(false);
  }

  const mine = user ? reviews.find((r) => r.user_id === user.id) : null;
  const isOwner = !!(user && ownerId && user.id === ownerId);
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (myRating === 0) {
      setError(t.needRating);
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error } = await supabase.from('reviews').insert({
      provider_id: providerId,
      user_id: user.id,
      rating: myRating,
      comment: myComment.trim(),
    });

    if (error) {
      setError(error.code === '23505' ? t.duplicate : error.message);
    } else {
      setMyRating(0);
      setMyComment('');
      setJustSubmitted(true);
      await load();
    }
    setSubmitting(false);
  }

  async function deleteMine(id) {
    if (!confirm(t.confirmDelete)) return;
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id');
    if (error || !data || data.length === 0) {
      alert(t.deleteFailed + (error ? ' ' + error.message : ''));
      return;
    }
    setJustSubmitted(false);
    await load();
  }

  async function submitReply(reviewId) {
    if (!replyText.trim()) return;
    const { error } = await supabase
      .from('reviews')
      .update({ reply: replyText.trim(), replied_at: new Date().toISOString() })
      .eq('id', reviewId);
    if (error) {
      alert(error.message);
      return;
    }
    setReplyingTo(null);
    setReplyText('');
    await load();
  }

  const dateFmt = (d) =>
    new Date(d).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div>
      <h2 className="text-sm font-medium text-ink/60 mb-3">{t.title}</h2>

      {/* সারাংশ */}
      {count > 0 ? (
        <div className="flex items-center gap-4 bg-paper rounded-xl p-4 mb-4">
          <div className="text-center flex-shrink-0">
            <p className="text-4xl font-semibold font-numeric leading-none">{num(avg.toFixed(1))}</p>
            <div className="mt-1.5">
              <Stars value={avg} size="text-sm" />
            </div>
            <p className="text-[11px] text-ink/50 mt-1">
              {num(count)}
              {t.reviewsWord}
            </p>
          </div>
          <div className="flex-1 space-y-1">
            {dist.map(({ n, c }) => (
              <div key={n} className="flex items-center gap-2">
                <span className="text-[11px] text-ink/50 w-3 text-right font-numeric">{num(n)}</span>
                <div className="flex-1 h-1.5 bg-ink/10 rounded-full overflow-hidden">
                  <div className="h-full bg-marigold rounded-full" style={{ width: `${(c / count) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !loading && <p className="text-sm text-ink/50 mb-4">{t.noReviews}</p>
      )}

      {/* লগইন না থাকলে */}
      {!user && !loading && (
        <div className="bg-paper rounded-xl p-4 mb-4 text-center">
          <p className="text-sm text-ink/60 mb-3">{t.loginPrompt}</p>
          <a
            href="/login"
            className="inline-block bg-marigold text-ink text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            {t.loginButton}
          </a>
        </div>
      )}

      {/* রিভিউ ফর্ম */}
      {user && !isOwner && !mine && (
        <form onSubmit={handleSubmit} className="bg-paper rounded-xl p-4 mb-4">
          <p className="text-sm font-medium mb-2">{t.yourRating}</p>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMyRating(n)}
                aria-label={`${n}`}
                className={`text-3xl leading-none p-1 ${n <= myRating ? 'text-marigold' : 'text-ink/20'}`}
              >
                ★
              </button>
            ))}
            {myRating > 0 && <span className="text-xs text-ink/55 ml-2">{t.labels[myRating]}</span>}
          </div>
          <textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder={t.placeholder}
            rows={3}
            maxLength={500}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-green resize-none bg-white"
          />
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 bg-marigold text-ink text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
          >
            {submitting ? t.submitting : t.submit}
          </button>
        </form>
      )}

      {justSubmitted && mine && (
        <p className="text-sm text-green bg-green/10 rounded-lg px-3 py-2 mb-4">{t.thanks}</p>
      )}

      {/* রিভিউ তালিকা */}
      <div className="space-y-4">
        {reviews.map((r) => {
          const name = r.users?.name || t.anonymous;
          const isMine = user && r.user_id === user.id;
          return (
            <div key={r.id} className="border-t border-ink/5 pt-4 first:border-0 first:pt-0">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-full bg-[#EEF1F8] text-green-dark text-sm font-semibold flex items-center justify-center flex-shrink-0">
                  {name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {name}
                      {isMine && (
                        <span className="ml-1.5 text-[10px] bg-green/10 text-green px-1.5 py-0.5 rounded-full">
                          {t.yourReview}
                        </span>
                      )}
                    </p>
                    <Stars value={r.rating} size="text-sm" />
                  </div>
                  <p className="text-[11px] text-ink/40 mt-0.5">{dateFmt(r.created_at)}</p>
                  {r.comment && <p className="text-sm text-ink/75 mt-1.5 leading-relaxed">{r.comment}</p>}

                  {r.reply && (
                    <div className="mt-2 pl-3 border-l-2 border-green/30">
                      <p className="text-xs font-medium text-green">{t.ownerReply}</p>
                      <p className="text-sm text-ink/70 mt-0.5">{r.reply}</p>
                    </div>
                  )}

                  {isOwner && !r.reply && (
                    <div className="mt-2">
                      {replyingTo === r.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={t.replyPlaceholder}
                            className="flex-1 border border-ink/20 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green"
                          />
                          <button
                            onClick={() => submitReply(r.id)}
                            className="text-xs bg-green text-white px-3 py-1.5 rounded-lg"
                          >
                            {t.send}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setReplyingTo(r.id)} className="text-xs text-green underline">
                          {t.reply}
                        </button>
                      )}
                    </div>
                  )}

                  {isMine && (
                    <button onClick={() => deleteMine(r.id)} className="mt-2 text-xs text-red-500 underline">
                      {t.delete}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
