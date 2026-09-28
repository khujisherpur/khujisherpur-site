import LanguageToggle from './LanguageToggle';
import HeaderBell from './HeaderBell';
import AuthButton from './AuthButton';

export default function SiteHeader({ lang = 'bn', simple = false }) {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-green-dark to-green shadow-md">
      <div className="max-w-4xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
        <a href="/" className="flex items-center bg-white rounded-md px-2 py-1.5 flex-shrink-0">
          <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-6 w-auto" />
        </a>
        {!simple && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <LanguageToggle lang={lang} variant="light" />
            <HeaderBell />
            <AuthButton lang={lang} variant="light" />
          </div>
        )}
      </div>
    </header>
  );
}
