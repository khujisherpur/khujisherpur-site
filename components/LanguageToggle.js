'use client';

export default function LanguageToggle({ lang, variant = 'default' }) {
  const isLight = variant === 'light';

  function setLang(newLang) {
    document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
    window.location.reload();
  }

  const baseBorder = isLight ? 'border-white/40' : 'border-ink/20';
  const activeClass = isLight ? 'bg-white text-green' : 'bg-green text-white';
  const inactiveClass = isLight ? 'text-white/80' : 'text-ink/60';

  return (
    <div className={`flex rounded-full overflow-hidden text-xs border ${baseBorder} flex-shrink-0`}>
      <button
        onClick={() => setLang('bn')}
        className={`px-2.5 py-1 font-medium ${lang === 'bn' ? activeClass : inactiveClass}`}
      >
        বাং
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 font-medium ${lang === 'en' ? activeClass : inactiveClass}`}
      >
        EN
      </button>
    </div>
  );
}
