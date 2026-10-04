'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const PUBLIC_KEY = 'BEfSX2r4qSUfeYUKeqUM2W6quBCiNdQc6cff0L09_TotoeQjEIOPHHk1rcpZGFDxk4CE1YNKyo7D017-ZBdFUEA';

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function store(action, key, value) {
  try {
    if (action === 'get') return localStorage.getItem(key);
    if (action === 'set') localStorage.setItem(key, value);
    if (action === 'del') localStorage.removeItem(key);
  } catch (e) {}
  return null;
}

async function subscribeAndSave(userId) {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
    });
  }
  const json = sub.toJSON();
  await supabase.from('push_subscriptions').delete().eq('endpoint', json.endpoint);
  const { error } = await supabase.from('push_subscriptions').insert({
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });
  if (error) throw error;
}

export default function AutoPushPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    let cancelled = false;
    navigator.serviceWorker.register('/sw.js').catch(() => {});

    async function check(user) {
      if (!user || cancelled) return;
      if (store('get', 'push_opt_out') === '1') return;
      const perm = Notification.permission;
      if (perm === 'granted') {
        const key = 'push_synced_' + user.id;
        try {
          if (sessionStorage.getItem(key)) return;
          await subscribeAndSave(user.id);
          sessionStorage.setItem(key, '1');
        } catch (e) {}
        return;
      }
      if (perm === 'default') {
        const until = Number(store('get', 'push_snooze_until') || 0);
        if (Date.now() > until) setShow(true);
      }
    }

    supabase.auth.getUser().then(({ data }) => check(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') check(session?.user);
      if (event === 'SIGNED_OUT') setShow(false);
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        const { data } = await supabase.auth.getUser();
        if (data.user) await subscribeAndSave(data.user.id);
        store('del', 'push_opt_out');
      }
    } catch (e) {}
    setBusy(false);
    setShow(false);
  }

  function later() {
    store('set', 'push_snooze_until', String(Date.now() + 3 * 24 * 3600 * 1000));
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 inset-x-3 md:max-w-md md:mx-auto z-50 bg-white border border-ink/10 rounded-2xl shadow-lg p-4">
      <p className="font-semibold text-sm">🔔 Get updates on your phone</p>
      <p className="text-xs text-ink/60 mt-1 leading-relaxed">
        Post approvals, reviews and urgent blood requests will arrive as notifications.
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={enable}
          disabled={busy}
          className="flex-1 bg-green text-white text-sm font-medium py-2.5 rounded-xl disabled:opacity-50"
        >
          {busy ? 'Please wait...' : 'Enable'}
        </button>
        <button onClick={later} className="px-5 border border-ink/20 text-sm text-ink/70 rounded-xl">
          Later
        </button>
      </div>
    </div>
  );
    }
