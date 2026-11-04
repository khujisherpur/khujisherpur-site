'use client';
import { useState } from 'react';

export default function ShareInvite({ small, title, desc, shareText, copiedText }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = 'https://khujisherpur.com/blood';
    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText, url });
        return;
      }
      await navigator.clipboard.writeText(`${shareText} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  }

  return (
    <section className="mt-6 bg-gradient-to-br from-[#0E5C33] to-[#1C8A4C] text-white rounded-2xl p-4 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/80">{small}</p>
        <p className="font-semibold text-base leading-snug mt-0.5">{title}</p>
        <p className="text-xs text-white/80 mt-1">{desc}</p>
      </div>
      <button
        type="button"
        onClick={share}
        aria-label="share"
        className="w-12 h-12 rounded-xl bg-white text-green flex items-center justify-center flex-shrink-0"
      >
        {copied ? (
          <span className="text-[10px] font-semibold px-1">{copiedText}</span>
        ) : (
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
        )}
      </button>
    </section>
  );
}
