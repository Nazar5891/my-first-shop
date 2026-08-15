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
    return listings.filter(l => [l.title, l.description, l.locationName, l.category, l.subcategory, l.pay].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [listings, query]);

  return (
    <section className="h-full w-full overflow-hidden bg-[#050505] text-white flex flex-col">
      <header className="shrink-0 border-b border-white/10 bg-[#080808]/95 backdrop-blur-xl px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div><p className="text-[10px] uppercase tracking-[0.28em] text-white/40 font-black">Marketplace</p><h1 className="text-xl font-black tracking-tight">Оголошення</h1></div>
          <button type="button" onClick={() => setShowFilters(v => !v)} className={`p-2.5 rounded-xl border ${showFilters ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10'}`} aria-label="Фільтри"><SlidersHorizontal className="w-4 h-4" /></button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Що шукаєте?" className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30" />
          {query && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
        </div>
        {showFilters && <div className="mt-3 grid grid-cols-2 gap-2"><button className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs font-bold text-white/70">Категорія <span className="block text-white/35 font-normal">Усі</span></button><button className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs font-bold text-white/70">Місце <span className="block text-white/35 font-normal">Усі</span></button></div>}
      </header>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 overscroll-contain">
        <div className="px-1 text-[10px] uppercase tracking-[0.2em] text-white/30 font-black">{filtered.length} оголошень</div>
        {filtered.map(listing => <ListingCard key={listing.id} listing={listing} onClick={() => onSelectListing(listing)} variant="full" />)}
        {filtered.length === 0 && <div className="h-48 flex items-center justify-center text-center text-sm text-white/35">Нічого не знайдено.<br />Спробуйте інший запит.</div>}
      </div>
    </section>
  );
};
