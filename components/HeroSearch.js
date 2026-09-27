'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationFilter from './LocationFilter';

export default function HeroSearch({ lang, placeholder }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [upazila, setUpazila] = useState('');
  const [unionName, setUnionName] = useState('');

  function handleApply(u, un) {
    setUpazila(u);
    setUnionName(un);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (upazila) params.set('upazila', upazila);
    if (upazila && unionName) params.set('union', unionName);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex bg-white rounded-full shadow-md overflow-hidden max-w-xl">
        <span className="flex items-center pl-4 text-ink/40">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none px-3 py-3 text-sm placeholder:text-ink/40"
        />
        <button
          type="submit"
          aria-label="Search"
          className="bg-marigold text-ink w-12 flex items-center justify-center hover:bg-marigold/90 transition-colors flex-shrink-0"
        >
          🔍
        </button>
      </form>
      <div className="mt-2">
        <LocationFilter
          lang={lang}
          currentQuery={query}
          currentUpazila={upazila}
          currentUnion={unionName}
          onApply={handleApply}
        />
      </div>
    </div>
  );
}
