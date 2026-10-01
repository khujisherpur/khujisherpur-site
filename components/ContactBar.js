import { cleanPhone, waLink } from '../lib/format';

export default function ContactBar({ phone, lang = 'bn' }) {
  if (!phone) return null;
  const wa = waLink(phone);

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-ink/10 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex gap-2">
        <a
          href={`tel:${cleanPhone(phone)}`}
          className="flex-1 text-center bg-marigold text-ink font-semibold py-3 rounded-xl"
        >
          📞 {lang === 'bn' ? 'কল করুন' : 'Call'}
        </a>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-[#25D366] text-white font-semibold py-3 rounded-xl"
          >
            💬 WhatsApp
          </a>
        )}
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
