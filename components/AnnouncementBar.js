'use client';
import { useEffect, useState } from 'react';

function hashText(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

export default function AnnouncementBar({ text, link }) {
  const [state, setState] = useState('checking');
  const key = 'ann_dismissed_' + hashText(text || '');

  useEffect(() => {
    try {
      setState(localStorage.getItem(key) ? 'hidden' : 'show');
    } catch (e) {
      setState('show');
    }
  }, [key]);

  if (state !== 'show') return null;

  // শুধু http/https বা নিজের সাইটের লিংক গ্রহণযোগ্য
  const safeLink = link && /^(https?:\/\/|\/)/i.test(link) ? link : null;

  function close() {
    setState('hidden');
    try {
      localStorage.setItem(key, '1');
    } catch (e) {}
  }

  return (
    <div className="bg-marigold text-ink">
      <div className="max-w-4xl mx-auto px-3 py-2 flex items-center gap-2">
        {safeLink ? (
          <a href={safeLink} className="flex-1 text-xs font-medium leading-snug">
            📢 {text} <span className="font-bold">→</span>
          </a>
        ) : (
          <p className="flex-1 text-xs font-medium leading-snug">📢 {text}</p>
        )}
        <button
          onClick={close}
          aria-label="বন্ধ করুন"
          className="w-7 h-7 flex items-center justify-center text-ink/60 text-sm flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
