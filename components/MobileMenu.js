'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const text = {
  bn: {
    home: 'হোম', search: 'সার্চ', emergency: 'জরুরি সেবা', blood: 'ব্লাড',
    doctor: 'ডাক্তার/হাসপাতাল', terms: 'শর্তাবলি', privacy: 'প্রাইভেসি পলিসি',
    disclaimer: 'দায়বদ্ধতা', dashboard: 'ড্যাশবোর্ড', login: 'লগইন / সাইনআপ', logout: 'লগআউট',
  },
  en: {
    home: 'Home', search: 'Search', emergency: 'Emergency', blood: 'Blood',
    doctor: 'Doctor/Hospital', terms: 'Terms', privacy: 'Privacy Policy',
    disclaimer: 'Disclaimer', dashboard: 'Dashboard', login: 'Login / Sign Up', logout: 'Logout',
  },
};

export default function MobileMenu({ lang = 'bn' }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [panelStyle, setPanelStyle] = useState({});
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const t = text[lang];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = 220;
      const margin = 12;
      let right = window.innerWidth - rect.right;
      if (right + panelWidth > window.innerWidth - margin) right = margin;
      setPanelStyle({ position: 'fixed', top: rect.bottom + 8, right, width: panelWidth });
    }
    setOpen((o) => !o);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className="text-white text-2xl w-9 h-9 flex items-center justify-center flex-shrink-0"
        aria-label="Menu"
      >
        ☰
      </button>

      {open && (
        <div ref={panelRef} style={panelStyle} className="bg-white border border-ink/10 shadow-lg z-50 overflow-hidden rounded-md text-ink">
          <a href="/" className="block px-4 py-2.5 text-sm hover:bg-paper">{t.home}</a>
          <a href="/search" className="block px-4 py-2.5 text-sm hover:bg-paper">{t.search}</a>
          <a href="/emergency" className="block px-4 py-2.5 text-sm hover:bg-paper">{t.emergency}</a>
          <a href="/blood" className="block px-4 py-2.5 text-sm hover:bg-paper">{t.blood}</a>
          <a href="https://sherpurdoctorinfo.com" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 text-sm hover:bg-paper">{t.doctor}</a>
          <div className="border-t border-ink/10" />
          <a href="/terms" className="block px-4 py-2.5 text-sm hover:bg-paper">{t.terms}</a>
          <a href="/privacy" className="block px-4 py-2.5 text-sm hover:bg-paper">{t.privacy}</a>
          <a href="/disclaimer" className="block px-4 py-2.5 text-sm hover:bg-paper">{t.disclaimer}</a>
          <div className="border-t border-ink/10 md:hidden">
            {user ? (
              <>
                <a href="/dashboard" className="block px-4 py-2.5 text-sm hover:bg-paper">{t.dashboard}</a>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">{t.logout}</button>
              </>
            ) : (
              <a href="/login" className="block px-4 py-2.5 text-sm text-green hover:bg-paper">{t.login}</a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
