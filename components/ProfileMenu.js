'use client';
import { useState, useRef, useEffect } from 'react';

export default function ProfileMenu({ title, lang = 'bn', children }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const bn = lang === 'bn';

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1200);
    } catch {
      window.prompt('Link', window.location.href);
    }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
    } else {
      copyLink();
    }
    setOpen(false);
  }

  const item = 'w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-paper';

  return (
    <div ref={ref} className="absolute top-3 right-3 z-20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="menu"
        className="w-9 h-9 rounded-full bg-white/90 text-ink text-xl leading-none flex items-center justify-center shadow"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-ink/10 overflow-hidden divide-y divide-ink/5">
          <button type="button" onClick={copyLink} className={item}>
            <span>🔗</span>
            <span>{copied ? (bn ? 'কপি হয়েছে ✓' : 'Copied ✓') : bn ? 'লিংক কপি করুন' : 'Copy link'}</span>
          </button>
          <button type="button" onClick={share} className={item}>
            <span>↗️</span>
            <span>{bn ? 'শেয়ার করুন' : 'Share'}</span>
          </button>
          {children}
        </div>
      )}
    </div>
  );
}
