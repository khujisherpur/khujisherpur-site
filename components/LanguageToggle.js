'use client';
import { useState } from 'react';

export default function LanguageToggle({ lang, variant = 'default' }) {
  const [open, setOpen] = useState(false);
  const isLight = variant === 'light';

  function setLang(newLang) {
    document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
    window.location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium border flex-shrink-0 transition-colors ${
          isLight ? 'border-white/40 text-white hover:bg-white/10' : 'border-ink/20 text-ink/70 hover:bg-paper'
        }`}
      >
        <span>🌐</span>
        <span>EN</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-xs p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-ink mb-4 text-center">
              Which language do you prefer?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setLang('bn')}
                className={`w-full rounded-lg py-2.5 text-sm font-medium border transition-colors ${
                  lang === 'bn' ? 'bg-green text-white border-green' : 'border-ink/15 text-ink hover:bg-paper'
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLang('en')}
                className={`w-full rounded-lg py-2.5 text-sm font-medium border transition-colors ${
                  lang === 'en' ? 'bg-green text-white border-green' : 'border-ink/15 text-ink hover:bg-paper'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
