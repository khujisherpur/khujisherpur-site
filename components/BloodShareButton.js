// বসাবেন: components/BloodShareButton.js  (নতুন ফাইল)
'use client';
import { useState } from 'react';

// ব্লাড রিকুয়েস্ট শেয়ার: ফোনে শেয়ার-মেনু (WhatsApp, Messenger ইত্যাদি), না থাকলে লেখা কপি।
// আলাদা WhatsApp বাটনও আছে, কারণ বেশির ভাগ মানুষ ওখানেই পাঠান।
export default function BloodShareButton({ title, text }) {
  const [copied, setCopied] = useState(false);

  function fullMessage() {
    return `${text}\n${window.location.href}`;
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(fullMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ইউজার শেয়ার বাতিল করলে কিছু করার নেই
    }
  }

  function whatsapp() {
    const link = `https://wa.me/?text=${encodeURIComponent(fullMessage())}`;
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={share}
        className="flex-1 text-center border border-red-200 text-red-600 font-medium py-3 rounded-xl hover:bg-red-50 transition-colors"
      >
        {copied ? '✓ লিংক কপি হয়েছে' : '↗ শেয়ার করুন'}
      </button>
      <button
        type="button"
        onClick={whatsapp}
        className="flex-1 text-center border border-green/40 text-green font-medium py-3 rounded-xl hover:bg-green/5 transition-colors"
      >
        WhatsApp-এ পাঠান
      </button>
    </div>
  );
}
