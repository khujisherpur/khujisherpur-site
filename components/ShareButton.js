'use client';
import { useState } from 'react';

export default function ShareButton({ title, lang = 'bn' }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ইউজার শেয়ার বাতিল করলে কিছু করার নেই
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1.5 text-sm border border-ink/20 bg-white rounded-full px-4 py-2 active:bg-paper"
    >
      <span>↗</span>
      {copied ? (lang === 'bn' ? 'লিংক কপি হয়েছে' : 'Link copied') : lang === 'bn' ? 'শেয়ার' : 'Share'}
    </button>
  );
}
