import { supabase } from './supabaseClient';

// "আমার শেরপুর"-এর চারটি ইভেন্ট গোনার সহায়ক। কিছু ভুল হলে সাইটে কোনো প্রভাব পড়ে না।
// kind: card_open | first_pick | card_generated | card_saved
// শুধু অজ্ঞাত ভিজিটর আইডি (ks_vid, Tracker.js-এর একই) যায়। নাম, ছবি বা বাছাই করা স্থান যায় না।

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;

function visitorId() {
  try {
    let v = localStorage.getItem('ks_vid');
    if (!v) {
      v = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).slice(0, 36);
      localStorage.setItem('ks_vid', v);
    }
    return v;
  } catch {
    return null;
  }
}

export function trackCard(kind, { fromCard = false, picked = null } = {}) {
  try {
    if (typeof window === 'undefined') return;
    if (BOT.test(navigator.userAgent || '')) return;
    const visitor = visitorId();
    if (!visitor) return;
    supabase
      .rpc('track_card_event', {
        p_kind: kind,
        p_visitor: visitor,
        p_from_card: !!fromCard,
        p_picked: typeof picked === 'number' ? picked : null,
      })
      .then(
        () => {},
        () => {}
      );
  } catch {}
}

// এ পর্যন্ত যত জন কার্ড নিয়েছেন (ডাটাবেসের card_total ফাংশন থেকে, শুধু মোট সংখ্যা)।
// কোনো সমস্যা হলে null ফেরত দেয়, তখন পাতায় সংখ্যাটি দেখানো হয় না।
export async function fetchCardTotal() {
  try {
    const { data, error } = await supabase.rpc('card_total');
    if (error) return null;
    const n = Number(data);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}
