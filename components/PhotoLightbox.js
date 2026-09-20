'use client';
import { useState } from 'react';

export default function PhotoLightbox({ src, alt, size = 'w-28 h-28' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        className={`${size} rounded-full object-cover cursor-pointer`}
      />

      {open && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-white text-3xl leading-none"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
