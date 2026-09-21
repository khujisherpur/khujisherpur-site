'use client';

export default function LanguageToggle({ lang }) {
  function setLang(newLang) {
    document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
    window.location.reload();
  }

  return (
    <div className="flex border border-ink/20 rounded-full overflow-hidden text-sm flex-shrink-0">
      <button
        onClick={() => setLang('bn')}
        className={`px-3 py-1 ${lang === 'bn' ? 'bg-green text-white' : 'text-ink/60'}`}
      >
        বাং
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1 ${lang === 'en' ? 'bg-green text-white' : 'text-ink/60'}`}
      >
        EN
      </button>
    </div>
  );
}
