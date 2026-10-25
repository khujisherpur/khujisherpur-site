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
    edit: 'এডিট',
    save: 'সেভ',
    cancel: 'বাতিল',
    edited: 'সম্পাদিত',
    confirmDelete: 'আপনার রিভিউটা মুছে ফেলতে চান?',
    confirmDeleteReply: 'রিপ্লাইটা মুছে ফেলতে চান?',
    deleteFailed: 'মুছে ফেলা যায়নি।',
    anonymous: 'ইউজার',
    ownerReply: 'প্রোভাইডারের জবাব',
    provider: 'সেবাদাতা',
    replyPlaceholder: 'রিপ্লাই লিখুন...',
    send: 'পাঠান',
    reply: 'রিপ্লাই',
    seeMore: 'আরও দেখুন',
    viewReplies: 'টি রিপ্লাই দেখুন',
    hideReplies: 'রিপ্লাই লুকান',
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
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    edited: 'Edited',
    confirmDelete: 'Delete your review?',
    confirmDeleteReply: 'Delete this reply?',
    deleteFailed: 'Could not delete.',
    anonymous: 'User',
    ownerReply: "Provider's reply",
    provider: 'Provider',
    replyPlaceholder: 'Write a reply...',
    send: 'Send',
    reply: 'Reply',
    seeMore: 'See more',
    viewReplies: ' replies',
    hideReplies: 'Hide replies',
  },
};

const PAGE = 5;

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
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [visible, setVisible] = useState(1);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editing, setEditing] = useState(null); // { type:'review'|'reply', id, rating, text }
  const [openReplies, setOpenReplies] = useState({});

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
      .select('id, rating, comment, created_at, edited_at, user_id, reply, replied_at, users(name, avatar_url)')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    const list = data || [];
    setReviews(list);

    if (list.length) {
      const { data: rep } = await supabase
        .from('review_replies')
        .select('id, review_id, user_id, body, created_at, edited_at, users(name, avatar_url)')
        .in('review_id', list.map((r) => r.id))
        .order('created_at', { ascending: true });
      const map = {};
      (rep || []).forEach((x) => {
        (map[x.review_id] = map[x.review_id] || []).push(x);
      });
      setReplies(map);
    } else {
      setReplies({});
    }
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

  async function saveEdit() {
    if (!editing) return;
    const body = editing.text.trim();
    const now = new Date().toISOString();
    let res;
    if (editing.type === 'review') {
      if (!editing.rating) return;
      res = await supabase
        .from('reviews')
        .update({ rating: editing.rating, comment: body, edited_at: now })
        .eq('id', editing.id)
        .eq('user_id', user.id);
    } else {
      if (!body) return;
      res = await supabase
        .from('review_replies')
        .update({ body, edited_at: now })
        .eq('id', editing.id)
        .eq('user_id', user.id);
    }
    if (res.error) {
      alert(res.error.message);
      return;
    }
    setEditing(null);
    await load();
  }

  async function submitReply(reviewId) {
    const body = replyText.trim();
    if (!body) return;
    const { error } = await supabase
      .from('review_replies')
      .insert({ review_id: reviewId, user_id: user.id, body });
    if (error) {
      alert(error.message);
      return;
    }
    setReplyingTo(null);
    setReplyText('');
    setOpenReplies((o) => ({ ...o, [reviewId]: true }));
    await load();
  }

  async function deleteReply(id) {
    if (!confirm(t.confirmDeleteReply)) return;
    const { error } = await supabase.from('review_replies').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      alert(t.deleteFailed + ' ' + error.message);
      return;
    }
    await load();
  }

  const dateFmt = (d) =>
    new Date(d).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const btn = 'text-xs text-ink/55 font-medium hover:text-ink';

    function Avatar({ name, src, small }) {
    const box = small ? 'w-7 h-7' : 'w-9 h-9';
    if (src) {
      return <img src={src} alt="" className={`${box} rounded-full object-cover flex-shrink-0`} />;
    }
    return (
      <span
        className={`${box} ${small ? 'text-xs' : 'text-sm'} rounded-full bg-[#EEF1F8] text-green-dark font-semibold flex items-center justify-center flex-shrink-0`}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  function EditBox({ withStars }) {
    return (
      <div className="mt-2">
        {withStars && (
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEditing((e) => ({ ...e, rating: n }))}
                className={`text-2xl leading-none ${n <= editing.rating ? 'text-marigold' : 'text-ink/20'}`}
              >
                ★
              </button>
            ))}
          </div>
        )}
        <textarea
          value={editing.text}
          onChange={(e) => setEditing((x) => ({ ...x, text: e.target.value }))}
          rows={3}
          maxLength={500}
          className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-green resize-none bg-white"
        />
        <div className="flex gap-2 mt-2">
          <button onClick={saveEdit} className="text-xs bg-green text-white px-4 py-1.5 rounded-full">
            {t.save}
          </button>
          <button onClick={() => setEditing(null)} className="text-xs border border-ink/20 px-4 py-1.5 rounded-full">
            {t.cancel}
          </button>
        </div>
      </div>
    );
  }

  const shown = reviews.slice(0, visible);

  return (
    <div>
      <h2 className="text-sm font-semibold text-ink/70 mb-3">{t.title}</h2>

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

      {!user && !loading && (
        <div className="bg-paper rounded-xl p-4 mb-4 text-center">
          <p className="text-sm text-ink/60 mb-3">{t.loginPrompt}</p>
          <a href="/login" className="inline-block bg-marigold text-ink text-sm font-semibold px-5 py-2.5 rounded-full">
            {t.loginButton}
          </a>
        </div>
      )}

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

      <div className="space-y-5">
        {shown.map((r) => {
          const name = r.users?.name || t.anonymous;
          const isMine = user && r.user_id === user.id;
          const reps = replies[r.id] || [];
          const open = openReplies[r.id];
          const editingThis = editing && editing.type === 'review' && editing.id === r.id;

          return (
            <div key={r.id} className="border-t border-ink/5 pt-5 first:border-0 first:pt-0">
              <div className="flex items-start gap-3">
               <Avatar name={name} src={r.users?.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="bg-paper rounded-2xl px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold">
                        {name}
                        {isMine && (
                          <span className="ml-1.5 text-[10px] bg-green/10 text-green px-1.5 py-0.5 rounded-full font-medium">
                            {t.yourReview}
                          </span>
                        )}
                      </p>
                      <Stars value={r.rating} size="text-sm" />
                    </div>
                    {editingThis ? (
                      <EditBox withStars />
                    ) : (
                      r.comment && <p className="text-sm text-ink/80 mt-1 leading-relaxed whitespace-pre-line">{r.comment}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 px-2 flex-wrap">
                    <span className="text-[11px] text-ink/40">
                      {dateFmt(r.created_at)}
                      {r.edited_at ? ` · ${t.edited}` : ''}
                    </span>
                    {user && (
                      <button
                        className={btn}
                        onClick={() => {
                          setReplyingTo(replyingTo === r.id ? null : r.id);
                          setReplyText('');
                        }}
                      >
                        {t.reply}
                      </button>
                    )}
                    {isMine && !editingThis && (
                      <>
                        <button
                          className={btn}
                          onClick={() => setEditing({ type: 'review', id: r.id, rating: r.rating, text: r.comment || '' })}
                        >
                          {t.edit}
                        </button>
                        <button className="text-xs text-red-500 font-medium" onClick={() => deleteMine(r.id)}>
                          {t.delete}
                        </button>
                      </>
                    )}
                  </div>

                  {/* পুরনো মালিকের জবাব */}
                  {r.reply && (
                    <div className="mt-2 ml-3 pl-3 border-l-2 border-green/30">
                      <p className="text-xs font-medium text-green">{t.ownerReply}</p>
                      <p className="text-sm text-ink/70 mt-0.5">{r.reply}</p>
                    </div>
                  )}

                  {reps.length > 0 && (
                    <button
                      className="text-xs text-green font-medium mt-2 ml-2"
                      onClick={() => setOpenReplies((o) => ({ ...o, [r.id]: !o[r.id] }))}
                    >
                      {open ? t.hideReplies : `${num(reps.length)}${t.viewReplies}`}
                    </button>
                  )}

                  {open && (
                    <div className="mt-2 ml-3 pl-3 border-l-2 border-ink/10 space-y-3">
                      {reps.map((p) => {
                        const pn = p.users?.name || t.anonymous;
                        const pMine = user && p.user_id === user.id;
                        const pOwner = ownerId && p.user_id === ownerId;
                        const editingReply = editing && editing.type === 'reply' && editing.id === p.id;
                        return (
                          <div key={p.id} className="flex items-start gap-2">
                           <Avatar name={pn} src={p.users?.avatar_url} small />
                            <div className="min-w-0 flex-1">
                              <div className="bg-paper rounded-2xl px-3 py-2">
                                <p className="text-xs font-semibold">
                                  {pn}
                                  {pOwner && (
                                    <span className="ml-1.5 text-[10px] bg-marigold/25 text-ink px-1.5 py-0.5 rounded-full font-medium">
                                      {t.provider}
                                    </span>
                                  )}
                                </p>
                                {editingReply ? (
                                  <EditBox />
                                ) : (
                                  <p className="text-sm text-ink/80 mt-0.5 whitespace-pre-line">{p.body}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 px-2">
                                <span className="text-[11px] text-ink/40">
                                  {dateFmt(p.created_at)}
                                  {p.edited_at ? ` · ${t.edited}` : ''}
                                </span>
                                {pMine && !editingReply && (
                                  <>
                                    <button
                                      className={btn}
                                      onClick={() => setEditing({ type: 'reply', id: p.id, text: p.body })}
                                    >
                                      {t.edit}
                                    </button>
                                    <button className="text-xs text-red-500 font-medium" onClick={() => deleteReply(p.id)}>
                                      {t.delete}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {replyingTo === r.id && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t.replyPlaceholder}
                        maxLength={500}
                        autoFocus
                        className="flex-1 min-w-0 border border-ink/20 rounded-full px-4 py-2 text-sm outline-none focus:border-green bg-white"
                      />
                      <button
                        onClick={() => submitReply(r.id)}
                        className="text-xs bg-green text-white px-4 py-2 rounded-full flex-shrink-0 whitespace-nowrap"
                      >
                        {t.send}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {reviews.length > visible && (
        <button
          onClick={() => setVisible((v) => v + PAGE)}
          className="mt-5 w-full border border-ink/15 rounded-full py-2.5 text-sm font-medium text-ink/70 hover:bg-paper"
        >
          {t.seeMore} ({num(reviews.length - visible)})
        </button>
      )}
    </div>
  );
}
