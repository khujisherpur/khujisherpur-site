'use client';
import { useState, useEffect } from 'react';

export default function HeroIntro({ title, subtitle }) {
  const [show, setShow] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 4000);
    const hideTimer = setTimeout(() => setShow(false), 4400);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  function close() {
    setFading(true);
    setTimeout(() => setShow(false), 300);
  }

  if (!show) return null;

  return (
    <div
      className={`absolute inset-0 z-20 flex items-center justify-center px-6 bg-black/55 transition-opacity duration-300 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <button
        onClick={close}
        aria-label="Close"
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-lg"
      >
        ✕
      </button>
      <div className="text-center max-w-sm">
        <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-md">
          {title}
        </h1>
        <p className="text-white/90 text-sm mt-3 leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
