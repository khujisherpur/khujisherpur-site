'use client';
import { useEffect, useState } from 'react';
import { isInstalled, startInstallListeners, triggerInstall } from '../lib/pwaInstall';

export default function InstallButton() {
  const [hide, setHide] = useState(true);

  useEffect(() => {
    startInstallListeners();
    setHide(isInstalled());
    const h = () => setHide(true);
    window.addEventListener('ks-installed', h);
    return () => window.removeEventListener('ks-installed', h);
  }, []);

  if (hide) return null;

  return (
    <button
      onClick={() => triggerInstall()}
      className="bg-green text-white text-sm font-semibold px-4 py-2 rounded-xl"
    >
      📲 অ্যাপ ইনস্টল করুন
    </button>
  );
}
