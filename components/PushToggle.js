'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const PUBLIC_KEY = 'BEfSX2r4qSUfeYUKeqUM2W6quBCiNdQc6cff0L09_TotoeQjEIOPHHk1rcpZGFDxk4CE1YNKyo7D017-ZBdFUEA';

const text = {
  bn: {
    title: 'ফোনে নোটিফিকেশন',
    on: 'চালু আছে। সাইট বন্ধ থাকলেও জানতে পারবেন।',
    off: 'পোস্ট অনুমোদন, রিভিউ ও জরুরি খবর ফোনে পান।',
    enable: 'চালু করুন',
    disable: 'বন্ধ করুন',
    denied: 'ব্রাউজার সেটিংসে নোটিফিকেশন ব্লক করা আছে। সেখান থেকে অনুমতি দিন।',
    wait: 'অপেক্ষা করুন...',
    fail: 'চালু করা যায়নি: ',
  },
  en: {
    title: 'Phone notifications',
    on: 'Enabled. You will be notified even when the site is closed.',
    off: 'Get post approvals, reviews and urgent updates on your phone.',
    enable: 'Enable',
    disable: 'Disable',
    denied: 'Notifications are blocked in browser settings. Allow them there.',
    wait: 'Please wait...',
    fail: 'Could not enable: ',
  },
};

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushToggle({ lang = 'bn' }) {
  const t = text[lang] || text.bn;
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    setSupported(true);
    setDenied(Notification.permission === 'denied');
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setDenied(perm === 'denied');
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
        });
      }
      const json = sub.toJSON();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('লগইন নেই');
      await supabase.from('push_subscriptions').delete().eq('endpoint', json.endpoint);
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: auth.user.id,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
      if (error) throw error;
      setSubscribed(true);
    } catch (e) {
      alert(t.fail + (e.message || e));
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (e) {}
    setBusy(false);
  }

  if (!supported) return null;

  return (
    <div className="bg-white border border-ink/10 rounded-xl p-3 mt-4 flex items-center gap-3">
      <span className="w-9 h-9 rounded-lg bg-[#EEF1F8] flex items-center justify-center flex-shrink-0">🔔</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t.title}</p>
        <p className="text-[11px] text-ink/50 leading-snug">
          {denied ? t.denied : subscribed ? t.on : t.off}
        </p>
      </div>
      {!denied && (
        <button
          onClick={subscribed ? disable : enable}
          disabled={busy}
          className={`text-xs px-3.5 py-2 rounded-full flex-shrink-0 disabled:opacity-50 ${
            subscribed ? 'border border-ink/20 text-ink/70' : 'bg-green text-white font-medium'
          }`}
        >
          {busy ? t.wait : subscribed ? t.disable : t.enable}
        </button>
      )}
    </div>
  );
}
