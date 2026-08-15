import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Listing } from '../types';
import { ListingCard } from './ListingCard';

interface ListingsPanelProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
}

export const ListingsPanel: React.FC<ListingsPanelProps> = ({ listings, onSelectListing }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(l =>
      [l.title, l.description, l.locationName, l.category, l.subcategory, l.pay]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [listings, query]);

  return (
    <section className="h-full w-full overflow-hidden bg-[#050505] text-white flex flex-col">
      <header className="shrink-0 border-b border-white/10 bg-[#050505] px-4 pt-4 pb-3 sm:px-5">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.38em] text-white/35 font-black">LOCAL MARKET / 01</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-[-0.04em]">Оголошення</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={`h-10 w-10 shrink-0 border flex items-center justify-center transition-colors ${showFilters ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/15 hover:border-white/40'}`}
            aria-label="Фільтри"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ПОШУК ОГОЛОШЕНЬ"
            className="w-full h-11 bg-[#0a0a0a] border border-white/15 pl-10 pr-10 text-[11px] uppercase tracking-[0.14em] text-white placeholder:text-white/25 outline-none focus:border-white/45 transition-colors"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-px bg-white/10 border border-white/10">
            <button type="button" className="bg-[#080808] px-3 py-3 text-left">
              <span className="block text-[8px] uppercase tracking-[0.2em] text-white/30">02 / Категорія</span>
              <span className="block mt-1 text-[11px] font-bold uppercase">Усі</span>
            </button>
            <button type="button" className="bg-[#080808] px-3 py-3 text-left">
              <span className="block text-[8px] uppercase tracking-[0.2em] text-white/30">03 / Місце</span>
              <span className="block mt-1 text-[11px] font-bold uppercase">Усі</span>
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 space-y-3 overscroll-contain">
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-[9px] uppercase tracking-[0.28em] text-white/30 font-black">INDEX / {String(filtered.length).padStart(2, '0')}</span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">LIVE LIST</span>
        </div>

        {filtered.map((listing, index) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onClick={() => onSelectListing(listing)}
            variant="full"
            index={index}
          />
        ))}

        {filtered.length === 0 && (
          <div className="min-h-48 border border-white/10 flex items-center justify-center text-center px-6">
            <div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-white/25 mb-2">NO RESULT</div>
              <p className="text-sm text-white/40">Нічого не знайдено.<br />Спробуйте інший запит.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
