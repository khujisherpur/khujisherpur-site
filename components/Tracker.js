'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;
const SKIP = /^\/(admin|login)(\/|$)/;

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

function send(kind, target, path) {
  try {
    supabase
      .rpc('track_event', {
        p_kind: kind,
        p_target_type: target?.type || null,
        p_target_id: target?.id ? String(target.id) : null,
        p_path: path,
        p_visitor: visitorId(),
      })
      .then(() => {}, () => {});
  } catch {}
}

// প্রতিটি পেজ-ভিজিট গোনে এবং কল/WhatsApp বোতামের চাপ ধরে। কিছু ভুল হলে সাইটে কোনো প্রভাব পড়ে না।
export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pathname || SKIP.test(pathname) || BOT.test(navigator.userAgent || '')) return;
    const timer = setTimeout(() => send('visit', window.__trackTarget, pathname), 700);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    function onClick(e) {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      let kind = null;
      if (href.startsWith('tel:')) kind = 'call';
      else if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) kind = 'whatsapp';
      if (!kind) return;
      const holder = a.closest('[data-track-id]');
      const target = holder
        ? { type: holder.dataset.trackType, id: holder.dataset.trackId }
        : window.__trackTarget;
      if (!target) return;
      send(kind, target, window.location.pathname);
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
